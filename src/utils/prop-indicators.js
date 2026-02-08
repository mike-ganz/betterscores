import { espnAPI } from './api-client';

// ─── Caches (module-level, 6-hour TTL) ───

const seasonCache = new Map();
const gamelogCache = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

function getCached(cache, key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
  return null;
}

function setCache(cache, key, data) {
  cache.set(key, { data, time: Date.now() });
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

// ─── Data Fetching ───

export async function fetchSeasonAvg(playerId) {
  const cached = getCached(seasonCache, playerId);
  if (cached) return cached;

  try {
    const data = await espnAPI.getPlayerStats(playerId);
    const categories = data.statistics || [];

    const findStat = (name) => {
      for (const cat of categories) {
        const stat = cat.stats?.find(s => s.name === name);
        if (stat) return parseFloat(stat.displayValue) || 0;
      }
      return 0;
    };

    const result = {
      avgPoints: findStat('avgPoints'),
      avgRebounds: findStat('avgRebounds'),
      avgAssists: findStat('avgAssists'),
      avg3PM: findStat('avgThreePointFieldGoalsMade'),
      avgMinutes: findStat('avgMinutes'),
      gamesPlayed: findStat('gamesPlayed'),
    };

    setCache(seasonCache, playerId, result);
    return result;
  } catch (err) {
    console.error(`[prop-indicators] season stats fetch failed for ${playerId}:`, err);
    return null;
  }
}

export async function fetchL10Avg(playerId) {
  const cached = getCached(gamelogCache, playerId);
  if (cached) return cached;

  try {
    const data = await espnAPI.getPlayerGameLog(playerId);

    // Navigate gamelog structure — ESPN wraps in seasonTypes > categories > events
    const seasonTypes = data?.seasonTypes || [];
    let gameEntries = [];

    for (const st of seasonTypes) {
      const categories = st.categories || [];
      for (const cat of categories) {
        const events = cat.events || [];
        gameEntries.push(...events);
      }
    }

    // Also try flat structure if seasonTypes is empty
    if (gameEntries.length === 0 && data?.events) {
      gameEntries = data.events;
    }

    // Take last 10 games
    const last10 = gameEntries.slice(-10);
    if (last10.length === 0) return null;

    // Parse stats from each game entry
    // Gamelog stat labels may vary — look for labels in the response
    const labels = data?.labels || data?.seasonTypes?.[0]?.categories?.[0]?.labels || [];

    // Find indices from labels, fallback to known positions
    const ptsIdx = labels.indexOf('PTS') !== -1 ? labels.indexOf('PTS') : 13;
    const rebIdx = labels.indexOf('REB') !== -1 ? labels.indexOf('REB') : 7;
    const astIdx = labels.indexOf('AST') !== -1 ? labels.indexOf('AST') : 8;
    const threePtIdx = labels.indexOf('3PT') !== -1 ? labels.indexOf('3PT') : 3;

    let totalPts = 0, totalReb = 0, totalAst = 0, total3PM = 0;
    let count = 0;

    for (const game of last10) {
      const stats = game.stats || [];
      if (stats.length === 0) continue;

      totalPts += parseFloat(stats[ptsIdx]) || 0;
      totalReb += parseFloat(stats[rebIdx]) || 0;
      totalAst += parseFloat(stats[astIdx]) || 0;

      // 3PT may be "2-5" format (made-attempted) — take the made count
      const threePt = stats[threePtIdx] || '0';
      total3PM += parseFloat(threePt.toString().split('-')[0]) || 0;

      count++;
    }

    if (count === 0) return null;

    const result = {
      points: totalPts / count,
      rebounds: totalReb / count,
      assists: totalAst / count,
      threes: total3PM / count,
      games: count,
    };

    setCache(gamelogCache, playerId, result);
    return result;
  } catch (err) {
    console.error(`[prop-indicators] gamelog fetch failed for ${playerId}:`, err);
    return null;
  }
}

// ─── Computation Functions ───

/**
 * Compute a blended per-minute rate from season and L10 averages.
 * Weights: 60% L10 (recent form), 40% season (stability).
 * Falls back to whichever is available if one is missing.
 */
function blendedRate(seasonAvg, l10Avg, avgMinutes) {
  if (!avgMinutes || avgMinutes <= 0) return null;
  if (seasonAvg == null && l10Avg == null) return null;
  if (l10Avg == null) return seasonAvg / avgMinutes;
  if (seasonAvg == null) return l10Avg / avgMinutes;
  const blended = l10Avg * 0.6 + seasonAvg * 0.4;
  return blended / avgMinutes;
}

/**
 * Project a player's final stat total using a blended L10/season rate.
 * projection = currentStat + (blendedRate * remainingMinutes)
 */
export function computeProjection(currentStat, minutesPlayed, avgMinutes, seasonAvg, l10Avg) {
  const rate = blendedRate(seasonAvg, l10Avg, avgMinutes);
  if (rate == null) return null;
  const remaining = Math.max(0, avgMinutes - minutesPlayed);
  return currentStat + rate * remaining;
}

/**
 * Compute a raw signal with intensity for projection vs line.
 * Returns { direction: 'over'|'under', intensity: 0-1 } or null.
 */
export function computeProjectionSignal(projected, line) {
  if (projected == null || line == null || line <= 0) return null;
  const diff = (projected - line) / line;
  if (Math.abs(diff) < 0.03) return null; // Dead zone — too close to call
  const direction = diff > 0 ? 'over' : 'under';
  // Scale: 3% → 0, 30%+ → 1.0
  const intensity = Math.min(1, (Math.abs(diff) - 0.03) / 0.27);
  return { direction, intensity };
}

// ─── Intensity Adjustments ───

/**
 * Convert American odds to implied probability.
 * -120 → 0.545, +110 → 0.476, -110 → 0.524
 */
function impliedProb(americanOdds) {
  if (americanOdds == null) return 0.5;
  const odds = parseFloat(americanOdds);
  if (isNaN(odds)) return 0.5;
  if (odds < 0) return Math.abs(odds) / (Math.abs(odds) + 100);
  return 100 / (odds + 100);
}

/**
 * Vig adjustment multiplier.
 * Penalizes when the market already agrees with our signal direction
 * (heavy juice = less edge). Modest boost when contrarian.
 *
 * -110 → 0.95 (standard vig, near-full signal)
 * -150 → 0.80 (meaningful penalty)
 * -200 → 0.67 (heavy juice)
 * +110 → 1.05 (slight contrarian boost)
 * +130 → 1.13
 *
 * Clamped to [0.5, 1.2]
 */
function vigMultiplier(direction, overOdds, underOdds) {
  const relevantOdds = direction === 'over' ? overOdds : underOdds;
  const marketProb = impliedProb(relevantOdds);
  const raw = 1 - (marketProb - 0.5) * 2;
  return Math.max(0.5, Math.min(1.2, raw));
}

/**
 * Game confidence multiplier.
 * Linear ramp from 0 (tip-off) to 1 (player's full avg minutes played).
 * Early-game projections are mostly guesswork; late-game are near-certain.
 */
function gameConfidence(minutesPlayed, avgMinutes) {
  if (!avgMinutes || avgMinutes <= 0) return 0;
  return Math.min(1, minutesPlayed / avgMinutes);
}

// Map prop category keys to season avg field names and L10 field names
const PROP_TYPE_MAP = {
  points: { season: 'avgPoints', l10: 'points' },
  rebounds: { season: 'avgRebounds', l10: 'rebounds' },
  assists: { season: 'avgAssists', l10: 'assists' },
  threes: { season: 'avg3PM', l10: 'threes' },
};

/**
 * Compute a single blended projection indicator for a prop.
 * Applies game-confidence and vig adjustments to intensity.
 * Returns { projection: { value, direction, intensity } } or null.
 */
export function getIndicators(propType, line, currentStat, minutesPlayed, seasonAvgs, l10Avgs, overOdds, underOdds) {
  const mapping = PROP_TYPE_MAP[propType];
  if (!mapping) return null;

  const seasonAvg = seasonAvgs?.[mapping.season] ?? null;
  const avgMinutes = seasonAvgs?.avgMinutes ?? null;
  const l10Avg = l10Avgs?.[mapping.l10] ?? null;

  const projected = computeProjection(currentStat, minutesPlayed, avgMinutes, seasonAvg, l10Avg);
  const signal = computeProjectionSignal(projected, line);

  // Apply confidence and vig adjustments
  if (signal) {
    const conf = gameConfidence(minutesPlayed, avgMinutes);
    const vig = vigMultiplier(signal.direction, overOdds, underOdds);
    signal.intensity = Math.min(1, signal.intensity * conf * vig);

    // Kill signal if adjusted intensity is negligible
    if (signal.intensity < 0.02) {
      return {
        projection: { value: projected != null ? Math.round(projected * 10) / 10 : null },
      };
    }
  }

  return {
    projection: {
      value: projected != null ? Math.round(projected * 10) / 10 : null,
      ...(signal || {}),
    },
  };
}
