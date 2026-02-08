/**
 * Computes data-driven insights from ESPN game + summary data.
 * Returns an array of { label, value } objects — no narrative fluff,
 * just facts the user can't see at a glance.
 */

// ── Pregame ──────────────────────────────────────────────────────────
function getPregameInsights(game, summary, competition) {
  const insights = [];
  const [away, home] = competition.competitors || [];
  const odds = competition.odds?.[0];

  // ESPN Predictor win probability
  const predictor = summary?.predictor;
  if (predictor?.homeTeam?.gameProjection) {
    const homeProb = Math.round(predictor.homeTeam.gameProjection);
    const awayProb = 100 - homeProb;
    const favTeam = homeProb >= 50 ? home?.team?.abbreviation : away?.team?.abbreviation;
    const favProb = Math.max(homeProb, awayProb);
    insights.push({
      label: 'ESPN Predictor',
      value: `${favTeam} has a ${favProb}% win probability`,
    });
  }

  // Season series H2H
  const series = summary?.seasonseries;
  if (series && Array.isArray(series) && series.length > 0) {
    const completed = series.filter(g => g.status?.type?.state === 'post');
    if (completed.length > 0) {
      let homeWins = 0;
      let awayWins = 0;
      for (const g of completed) {
        const comps = g.competitions?.[0]?.competitors || [];
        const winner = comps.find(c => c.winner);
        if (winner?.team?.id === home?.team?.id) homeWins++;
        else awayWins++;
      }
      if (homeWins + awayWins > 0) {
        const leader = homeWins >= awayWins ? home?.team?.abbreviation : away?.team?.abbreviation;
        const leaderWins = Math.max(homeWins, awayWins);
        const loserWins = Math.min(homeWins, awayWins);
        insights.push({
          label: 'Season Series',
          value: `${leader} leads ${leaderWins}-${loserWins}`,
        });
      }
    }
  }

  // Spread + O/U line
  const spread = odds?.spread;
  const overUnder = odds?.overUnder;
  if (spread != null && overUnder != null) {
    const spreadNum = parseFloat(spread);
    const details = odds?.details || '';
    insights.push({
      label: 'Line',
      value: `${details || (spreadNum > 0 ? `${away?.team?.abbreviation} ${spreadNum}` : `${home?.team?.abbreviation} ${spreadNum}`)} | O/U ${overUnder}`,
    });
  } else if (overUnder != null) {
    insights.push({ label: 'Total', value: `O/U ${overUnder}` });
  }

  return insights.slice(0, 3);
}

// Helper: find a stat by checking multiple possible name/label patterns
function findStat(stats, ...patterns) {
  if (!stats) return null;
  for (const pattern of patterns) {
    const found = stats.find(s =>
      s.name?.toLowerCase().includes(pattern) ||
      s.label?.toLowerCase().includes(pattern) ||
      s.abbreviation?.toLowerCase().includes(pattern)
    );
    if (found) return found;
  }
  return null;
}

// ── Live ─────────────────────────────────────────────────────────────
function getLiveInsights(game, summary, competition) {
  const prioritized = []; // interesting — shown first if available
  const baseline = [];    // always available — fill remaining slots
  const [away, home] = competition.competitors || [];
  const homeScore = parseInt(home?.score) || 0;
  const awayScore = parseInt(away?.score) || 0;
  const totalScore = homeScore + awayScore;
  const odds = competition.odds?.[0];
  const status = competition.status;
  const teamStats = summary?.boxscore?.teams;
  const playerStats = summary?.boxscore?.players;

  // ─── Prioritized: only show if conditions are met ───

  // Scoring pace vs O/U
  const overUnder = parseFloat(odds?.overUnder);
  if (overUnder && totalScore > 0 && status?.period && status?.displayClock) {
    const period = status.period;
    const clockParts = (status.displayClock || '12:00').split(':');
    const mins = parseInt(clockParts[0]) || 0;
    const secs = parseInt(clockParts[1]) || 0;
    const elapsedMins = Math.max(1, (period - 1) * 12 + (12 - mins - secs / 60));
    const projectedTotal = Math.round(totalScore * (48 / elapsedMins));
    const diff = projectedTotal - overUnder;
    prioritized.push({
      label: 'Scoring Pace',
      value: `On pace for ${projectedTotal} — ${Math.abs(Math.round(diff))} ${diff > 0 ? 'over' : 'under'} the ${overUnder} line`,
    });
  }

  // Run detection
  const plays = summary?.plays || [];
  if (plays.length >= 2) {
    let homeRun = 0, awayRun = 0, runStart = null;
    for (let i = plays.length - 1; i >= 1 && i > plays.length - 12; i--) {
      const p = plays[i], prev = plays[i - 1];
      if (!p.scoringPlay) continue;
      const hPts = (p.homeScore || 0) - (prev.homeScore || 0);
      const aPts = (p.awayScore || 0) - (prev.awayScore || 0);
      if (hPts > 0 && awayRun === 0) { homeRun += hPts; runStart = p.clock?.displayValue || runStart; }
      else if (aPts > 0 && homeRun === 0) { awayRun += aPts; runStart = p.clock?.displayValue || runStart; }
      else break;
    }
    const runPts = Math.max(homeRun, awayRun);
    if (runPts >= 5) {
      const runTeam = homeRun > awayRun ? home?.team?.abbreviation : away?.team?.abbreviation;
      prioritized.push({ label: 'Run', value: `${runPts}-0 ${runTeam} run${runStart ? ` since ${runStart}` : ''}` });
    }
  }

  // Foul trouble
  if (playerStats) {
    for (const team of playerStats) {
      const athletes = team.statistics?.[0]?.athletes || [];
      for (const athlete of athletes.slice(0, 5)) {
        const fouls = parseInt(athlete?.stats?.[10]) || 0;
        if (fouls >= 4) {
          prioritized.push({ label: 'Foul Trouble', value: `${athlete?.athlete?.shortName || 'Player'} has ${fouls} fouls` });
          break;
        }
      }
      if (prioritized.length >= 3) break;
    }
  }

  // ─── Baseline: always-available context ───

  // Team shooting comparison (from boxscore)
  if (teamStats && teamStats.length >= 2) {
    const getStatDisplay = (team, ...patterns) => {
      const stats = team.statistics || [];
      const stat = findStat(stats, ...patterns);
      return stat?.displayValue;
    };

    const awayTeam = teamStats[0];
    const homeTeam = teamStats[1];
    const awayFg = getStatDisplay(awayTeam, 'fieldgoalpct', 'fg%');
    const homeFg = getStatDisplay(homeTeam, 'fieldgoalpct', 'fg%');

    if (awayFg && homeFg) {
      const awayAbbr = awayTeam.team?.abbreviation || away?.team?.abbreviation;
      const homeAbbr = homeTeam.team?.abbreviation || home?.team?.abbreviation;
      baseline.push({
        label: 'Shooting',
        value: `${awayAbbr} ${awayFg}% FG — ${homeAbbr} ${homeFg}% FG`,
      });
    }

    // 3PT comparison if both teams have attempted enough
    const away3 = getStatDisplay(awayTeam, 'threepointfieldgoalpct', '3pt%', '3p%');
    const home3 = getStatDisplay(homeTeam, 'threepointfieldgoalpct', '3pt%', '3p%');
    if (away3 && home3) {
      const awayAbbr = awayTeam.team?.abbreviation || away?.team?.abbreviation;
      const homeAbbr = homeTeam.team?.abbreviation || home?.team?.abbreviation;
      baseline.push({
        label: '3PT',
        value: `${awayAbbr} ${away3}% — ${homeAbbr} ${home3}%`,
      });
    }
  }

  // Margin as last resort
  if (totalScore > 0) {
    const margin = Math.abs(homeScore - awayScore);
    baseline.push({
      label: 'Margin',
      value: margin === 0 ? `Tied at ${homeScore}` : `${homeScore > awayScore ? home?.team?.abbreviation : away?.team?.abbreviation} by ${margin}`,
    });
  }

  // Merge: prioritized first, then fill from baseline (no duplicates by label)
  const result = [...prioritized];
  const usedLabels = new Set(result.map(i => i.label));
  for (const item of baseline) {
    if (result.length >= 3) break;
    if (!usedLabels.has(item.label)) {
      result.push(item);
      usedLabels.add(item.label);
    }
  }

  return result.slice(0, 3);
}

// ── Post-game ────────────────────────────────────────────────────────
function getPostgameInsights(game, summary, competition) {
  const insights = [];
  const [away, home] = competition.competitors || [];
  const homeScore = parseInt(home?.score) || 0;
  const awayScore = parseInt(away?.score) || 0;
  const totalScore = homeScore + awayScore;
  const odds = competition.odds?.[0];

  const winnerTeam = homeScore > awayScore ? home : away;
  const margin = Math.abs(homeScore - awayScore);

  // Spread result
  const spread = parseFloat(odds?.spread);
  if (!isNaN(spread)) {
    // ESPN spread is typically from home team perspective (negative = home favored)
    const homeMargin = homeScore - awayScore;
    const covered = homeMargin + spread > 0;
    const favTeam = spread < 0 ? home?.team?.abbreviation : away?.team?.abbreviation;
    insights.push({
      label: 'Spread',
      value: covered
        ? `${favTeam} covered (${spread > 0 ? '+' : ''}${spread})`
        : `${favTeam} failed to cover (${spread > 0 ? '+' : ''}${spread})`,
    });
  }

  // O/U result
  const overUnder = parseFloat(odds?.overUnder);
  if (!isNaN(overUnder)) {
    const diff = totalScore - overUnder;
    insights.push({
      label: 'Total',
      value: `${totalScore} pts — went ${diff > 0 ? 'OVER' : 'UNDER'} ${overUnder} by ${Math.abs(diff).toFixed(1)}`,
    });
  }

  // Standout performer from boxscore
  const playerStats = summary?.boxscore?.players;
  if (playerStats) {
    let best = null;
    let bestPts = 0;
    for (const team of playerStats) {
      const athletes = team.statistics?.[0]?.athletes || [];
      for (const athlete of athletes) {
        const pts = parseInt(athlete?.stats?.[1]) || 0;
        if (pts > bestPts) {
          bestPts = pts;
          best = athlete;
        }
      }
    }
    if (best && bestPts >= 20) {
      const reb = best.stats?.[4] || '0';
      const ast = best.stats?.[3] || '0';
      insights.push({
        label: 'Top Performer',
        value: `${best.athlete?.shortName || 'Player'}: ${bestPts} pts, ${reb} reb, ${ast} ast`,
      });
    }
  }

  // Fallback: margin of victory
  if (insights.length === 0) {
    insights.push({
      label: 'Final',
      value: `${winnerTeam?.team?.abbreviation} won by ${margin}`,
    });
  }

  return insights.slice(0, 3);
}

// ── Main export ──────────────────────────────────────────────────────
export function getGameInsights(game, summary) {
  const competition = game?.competitions?.[0];
  if (!competition) return [];

  const state = competition.status?.type?.state;

  try {
    if (state === 'in') return getLiveInsights(game, summary, competition);
    if (state === 'post') return getPostgameInsights(game, summary, competition);
    return getPregameInsights(game, summary, competition);
  } catch (err) {
    console.error('Error computing insights:', err);
    return [];
  }
}
