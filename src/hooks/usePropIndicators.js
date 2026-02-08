import { useState, useEffect } from 'react';
import { espnAPI } from '../utils/api-client';
import { fetchSeasonAvg, fetchL10Avg, getIndicators } from '../utils/prop-indicators';

const POLL_INTERVAL = 30_000; // 30s for box score refresh
const PROP_TYPES = ['points', 'rebounds', 'assists', 'threes'];

function normalizeName(name) {
  return (name || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Parse box score from game summary into a player lookup.
 * Returns Map<normalizedName, { playerId, displayName, stats }>
 */
function parseBoxScore(summary) {
  const players = summary?.boxscore?.players;
  if (!players || players.length === 0) return null;

  const lookup = new Map();

  for (const team of players) {
    const statGroup = team.statistics?.[0];
    if (!statGroup) continue;

    const labels = statGroup.labels || [];
    const minIdx = labels.indexOf('MIN');
    const ptsIdx = labels.indexOf('PTS');
    const rebIdx = labels.indexOf('REB');
    const astIdx = labels.indexOf('AST');
    const threePtIdx = labels.indexOf('3PT');

    const athletes = statGroup.athletes || [];
    for (const athlete of athletes) {
      const stats = athlete.stats || [];
      const displayName = athlete.athlete?.displayName || '';
      const shortName = athlete.athlete?.shortName || '';
      const playerId = athlete.athlete?.id;

      if (!playerId || !displayName) continue;

      // Parse minutes — could be "32" or "32:15"
      const minRaw = minIdx >= 0 ? stats[minIdx] : null;
      const minutes = parseMinutes(minRaw);

      // Parse 3PT — format "2-5" (made-attempted), take made count
      const threePtRaw = threePtIdx >= 0 ? stats[threePtIdx] : '0';
      const threesMade = parseFloat((threePtRaw || '0').toString().split('-')[0]) || 0;

      const playerStats = {
        minutes,
        points: ptsIdx >= 0 ? (parseFloat(stats[ptsIdx]) || 0) : 0,
        rebounds: rebIdx >= 0 ? (parseFloat(stats[rebIdx]) || 0) : 0,
        assists: astIdx >= 0 ? (parseFloat(stats[astIdx]) || 0) : 0,
        threes: threesMade,
      };

      // Index by both display name and short name for matching
      lookup.set(normalizeName(displayName), { playerId, displayName, stats: playerStats });
      if (shortName && shortName !== displayName) {
        lookup.set(normalizeName(shortName), { playerId, displayName, stats: playerStats });
      }
    }
  }

  return lookup;
}

function parseMinutes(raw) {
  if (raw == null) return 0;
  const str = raw.toString();
  if (str.includes(':')) {
    const [min, sec] = str.split(':');
    return (parseInt(min) || 0) + (parseInt(sec) || 0) / 60;
  }
  return parseFloat(str) || 0;
}

/**
 * Hook that computes prop bet indicators for a live game.
 *
 * @param {string} gameId - ESPN game ID
 * @param {string} league - 'nba'
 * @param {object} propsData - FanDuel props data from usePlayerProps
 * @param {boolean} isLive - Whether game is currently live
 * @returns {{ indicators: object, loading: boolean }}
 */
export function usePropIndicators(gameId, league, propsData, isLive) {
  const [indicators, setIndicators] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLive || !gameId || !propsData?.found) return;

    let cancelled = false;

    const compute = async () => {
      setLoading(true);
      try {
        // Step 1: Fetch game summary for live box score
        const summary = await espnAPI.getGameSummary(league, gameId);
        const boxScore = parseBoxScore(summary);
        if (!boxScore || cancelled) {
          setLoading(false);
          return;
        }

        // Step 2: Collect unique players from FanDuel props
        const playerSet = new Map(); // normalizedName → { originalName, propLines }
        for (const propType of PROP_TYPES) {
          const props = propsData.props?.[propType] || [];
          for (const prop of props) {
            const key = normalizeName(prop.playerName);
            if (!playerSet.has(key)) {
              playerSet.set(key, { originalName: prop.playerName, propLines: {} });
            }
            playerSet.get(key).propLines[propType] = {
              line: prop.line,
              overOdds: prop.overOdds,
              underOdds: prop.underOdds,
            };
          }
        }

        // Step 3: Match FanDuel players to box score, fetch stats, compute indicators
        const newIndicators = {};

        const entries = Array.from(playerSet.entries());
        await Promise.all(entries.map(async ([normalizedName, { originalName, propLines }]) => {
          const boxEntry = boxScore.get(normalizedName);
          if (!boxEntry) return; // No match in box score

          const { playerId, stats: currentStats } = boxEntry;

          // Fetch season averages + L10 (both cached aggressively)
          const [seasonAvgs, l10Avgs] = await Promise.all([
            fetchSeasonAvg(playerId),
            fetchL10Avg(playerId),
          ]);

          if (cancelled || !seasonAvgs) return;

          // Compute indicator for each prop type this player has
          const playerIndicators = {};
          for (const [propType, propData] of Object.entries(propLines)) {
            const currentStat = currentStats[propType] ?? 0;
            const result = getIndicators(
              propType,
              propData.line,
              currentStat,
              currentStats.minutes,
              seasonAvgs,
              l10Avgs,
              propData.overOdds,
              propData.underOdds,
            );
            if (result) {
              playerIndicators[propType] = { ...result, current: currentStat };
            }
          }

          if (Object.keys(playerIndicators).length > 0) {
            newIndicators[originalName] = playerIndicators;
          }
        }));

        if (!cancelled) {
          setIndicators(newIndicators);
        }
      } catch (err) {
        console.error('[usePropIndicators] error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Initial fetch
    compute();

    // Poll every 30s for live games
    const interval = setInterval(compute, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [gameId, league, isLive, propsData]);

  return { indicators, loading };
}
