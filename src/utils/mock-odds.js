/**
 * Mock Odds Generator
 * Produces realistic Vegas-style odds with implied probability calculations
 * Used for MVP while real odds data source is integrated
 */

// Implied probability from American odds
// Negative odds (favorite): implied% = |odds| / (|odds| + 100)
// Positive odds (underdog): implied% = 100 / (odds + 100)
const calculateImpliedProbability = (americanOdds) => {
  const odds = parseInt(americanOdds);
  if (odds < 0) {
    return Math.round((Math.abs(odds) / (Math.abs(odds) + 100)) * 100);
  } else {
    return Math.round((100 / (odds + 100)) * 100);
  }
};

// Generate mock odds based on seed, record, or arbitrary weighting
const generateMoneyline = (favoriteMargin = 3.5) => {
  // Convert point spread to moneyline
  // Rough formula: -110 is baseline for 3pt spread
  // Each additional point ≈ 10-15 in the odds
  const spread = Math.round(favoriteMargin * 10) / 10;
  
  // Favorite (negative)
  const favoriteMoney = Math.round(spread * 15);
  const favorite = -Math.max(100, 100 + favoriteMoney);
  
  // Underdog (positive) - slightly worse than perfect inverse due to vigorish
  const underdog = Math.round(Math.abs(favorite * 1.05));
  
  return { favorite, underdog };
};

export const mockOdds = {
  // Generate a single game's odds
  generateGameOdds: (homeTeam, awayTeam, homeRecord, awayRecord, seed = null) => {
    // Simple ELO-like calculation for demonstration
    // In reality: use ESPN/Vegas data or ML model
    
    // Seed advantage (if college)
    const homeSeeded = seed?.home ? Math.pow(seed.home, 0.8) : 0;
    const awaySeeded = seed?.away ? Math.pow(seed.away, 0.8) : 0;
    
    // Record parsing: "5-3" → wins
    const getWins = (record) => {
      if (!record) return 10;
      const [wins] = record.split('-').map(Number);
      return wins || 10;
    };
    
    const homeWins = getWins(homeRecord);
    const awayWins = getWins(awayRecord);
    
    // Home court advantage (2.5 pts) + record difference + seed
    const pointDifferential = 2.5 + (homeWins - awayWins) * 0.3 - (homeSeeded - awaySeeded) * 0.5;
    
    // Generate moneyline
    const { favorite, underdog } = generateMoneyline(Math.abs(pointDifferential));
    
    const [homeML, awayML] = pointDifferential > 0 
      ? [favorite, underdog]
      : [underdog, favorite];
    
    // Spread — round to nearest 0.5 like real Vegas lines
    const spreadValue = Math.round(pointDifferential * 2) / 2;

    // Over/Under — round to nearest 0.5
    const baseTotal = 210;
    const paceFactor = (homeWins + awayWins) / 20;
    const total = Math.round((baseTotal + paceFactor * 5) * 2) / 2;
    
    return {
      moneylineHome: homeML,
      moneylineAway: awayML,
      moneylineProbHome: calculateImpliedProbability(homeML),
      moneylineProbAway: calculateImpliedProbability(awayML),
      spread: spreadValue,
      spreadDisplay: `${-Math.abs(spreadValue)}`,
      overUnder: total,
      source: 'mock-data', // Indicates this is demo/MVP
    };
  },

  // Use real ESPN data where available, mock only what's missing
  enrichOdds: (espnOdds, homeTeam, awayTeam, homeRecord, awayRecord) => {
    const mock = mockOdds.generateGameOdds(homeTeam, awayTeam, homeRecord, awayRecord);
    const hasSpread = espnOdds?.spread != null;
    const hasOU = espnOdds?.overUnder != null;
    const hasML = espnOdds?.moneylineHome && espnOdds.moneylineHome !== 'N/A';

    // If ESPN has nothing, fully mock
    if (!hasSpread && !hasOU && !hasML) return mock;

    // Blend: use ESPN where available, mock the rest
    const spread = hasSpread ? parseFloat(espnOdds.spread) : mock.spread;
    const overUnder = hasOU ? parseFloat(espnOdds.overUnder) : mock.overUnder;

    // Derive moneyline from ESPN spread if no ML data
    let moneylineHome, moneylineAway;
    if (hasML) {
      moneylineHome = espnOdds.moneylineHome;
      moneylineAway = espnOdds.moneylineAway;
    } else {
      const { favorite, underdog } = generateMoneyline(Math.abs(spread));
      [moneylineHome, moneylineAway] = spread <= 0
        ? [favorite, underdog]
        : [underdog, favorite];
    }

    return {
      moneylineHome,
      moneylineAway,
      moneylineProbHome: calculateImpliedProbability(moneylineHome),
      moneylineProbAway: calculateImpliedProbability(moneylineAway),
      spread,
      spreadDisplay: `${-Math.abs(spread)}`,
      overUnder,
      // Pass through juice and line movement from core odds
      spreadOddsHome: espnOdds?.spreadOddsHome,
      spreadOddsAway: espnOdds?.spreadOddsAway,
      overOdds: espnOdds?.overOdds,
      underOdds: espnOdds?.underOdds,
      openSpread: espnOdds?.openSpread,
      openMoneylineHome: espnOdds?.openMoneylineHome,
      openMoneylineAway: espnOdds?.openMoneylineAway,
      isLive: espnOdds?.isLive || false,
      source: (hasSpread || hasOU) ? 'espn' : 'mock-data',
    };
  },

  // Calculate parlay payout (for future feature)
  calculateParlayPayout: (bets) => {
    // bets: [{ odds: -110, wager: 100 }, ...]
    let payout = bets[0].wager;
    
    for (let i = 0; i < bets.length; i++) {
      const odds = bets[i].odds;
      const multiplier = odds < 0 
        ? 100 / Math.abs(odds)
        : odds / 100;
      payout = payout * (1 + multiplier);
    }
    
    return Math.round(payout);
  },

  // Format odds for display
  formatOdds: (odds) => {
    if (odds === 'N/A' || !odds) return 'N/A';
    const num = parseInt(odds);
    return num > 0 ? `+${num}` : `${num}`;
  },
};
