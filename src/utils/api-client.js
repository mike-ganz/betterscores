const ESPN_BASE = 'https://site.api.espn.com/apis';

// Parse the core odds API response into a normalized object
// When live odds exist, use them as primary (they reflect current game state)
function parseCoreOdds(data) {
  const items = data?.items || [];
  if (!items.length) return null;

  const pregame = items.find(i => i.provider?.name === 'Draft Kings') || items[0];
  const live = items.find(i => i.provider?.name?.includes('Live Odds'));

  // Use live odds when available, fall back to pre-game
  const primary = live || pregame;
  if (!primary) return null;

  // Opening line (from pregame entry, or primary's open)
  const opener = pregame || primary;
  const openSpread = opener?.open?.over
    ? opener?.homeTeamOdds?.open?.pointSpread?.alternateDisplayValue
    : null;
  const openSpreadNum = openSpread ? parseFloat(openSpread) : null;
  const openOU = opener?.open?.over
    ? null // O/U open isn't in a simple field, skip for now
    : null;

  return {
    spread: primary.spread,
    overUnder: primary.overUnder,
    details: primary.details,
    moneylineHome: primary.homeTeamOdds?.moneyLine,
    moneylineAway: primary.awayTeamOdds?.moneyLine,
    // Juice
    spreadOddsHome: primary.homeTeamOdds?.spreadOdds,
    spreadOddsAway: primary.awayTeamOdds?.spreadOdds,
    overOdds: primary.overOdds,
    underOdds: primary.underOdds,
    // Line movement (pregame open vs current)
    openSpread: pregame?.homeTeamOdds?.open?.pointSpread
      ? parseFloat(pregame.homeTeamOdds.open.pointSpread.alternateDisplayValue)
      : null,
    openMoneylineHome: pregame?.homeTeamOdds?.open?.moneyLine
      ? parseInt(pregame.homeTeamOdds.open.moneyLine.alternateDisplayValue)
      : null,
    openMoneylineAway: pregame?.awayTeamOdds?.open?.moneyLine
      ? parseInt(pregame.awayTeamOdds.open.moneyLine.alternateDisplayValue)
      : null,
    isLive: !!live,
    source: 'espn-core',
  };
}

export const espnAPI = {
  // NBA Endpoints
  getNBAScoreboard: async (date) => {
    const url = date
      ? `${ESPN_BASE}/site/v2/sports/basketball/nba/scoreboard?dates=${date}`
      : `${ESPN_BASE}/site/v2/sports/basketball/nba/scoreboard`;
    const response = await fetch(url, { cache: 'no-store' });
    return response.json();
  },

  getNBAStandings: async () => {
    const response = await fetch(`${ESPN_BASE}/v2/sports/basketball/nba/standings`);
    return response.json();
  },

  // NCAAM Endpoints
  getNCAAMScoreboard: async (date) => {
    const url = date
      ? `${ESPN_BASE}/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=${date}`
      : `${ESPN_BASE}/site/v2/sports/basketball/mens-college-basketball/scoreboard`;
    const response = await fetch(url, { cache: 'no-store' });
    return response.json();
  },

  getNCAAMRankings: async () => {
    const response = await fetch(
      `${ESPN_BASE}/site/v2/sports/basketball/mens-college-basketball/rankings`
    );
    return response.json();
  },

  getNCAAMStandings: async () => {
    const response = await fetch(
      `${ESPN_BASE}/v2/sports/basketball/mens-college-basketball/standings`
    );
    return response.json();
  },

  // Player Stats
  getPlayerStats: async (playerId) => {
    // Use core API for player data
    const response = await fetch(
      `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/athletes/${playerId}/statistics/0?lang=en&region=us`
    );
    const statsData = await response.json();
    
    // Also fetch basic player info
    const playerResponse = await fetch(
      `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/athletes/${playerId}?lang=en&region=us`
    );
    const playerData = await playerResponse.json();
    
    return {
      athlete: playerData,
      statistics: statsData.splits?.categories || []
    };
  },

  // Team Details
  getTeamInfo: async (league, teamId) => {
    const leaguePath = league === 'nba' ? 'nba' : 'mens-college-basketball';
    const response = await fetch(
      `${ESPN_BASE}/site/v2/sports/basketball/${leaguePath}/teams/${teamId}`
    );
    return response.json();
  },

  getTeamRoster: async (league, teamId) => {
    const leaguePath = league === 'nba' ? 'nba' : 'mens-college-basketball';
    const response = await fetch(
      `${ESPN_BASE}/site/v2/sports/basketball/${leaguePath}/teams/${teamId}/roster`
    );
    return response.json();
  },

  getTeamStatistics: async (league, teamId) => {
    const leaguePath = league === 'nba' ? 'nba' : 'mens-college-basketball';
    const response = await fetch(
      `${ESPN_BASE}/site/v2/sports/basketball/${leaguePath}/teams/${teamId}/statistics`
    );
    return response.json();
  },

  // Core odds endpoint — works for all game states (pre, live, post)
  getCoreOdds: async (league, gameId) => {
    const leaguePath = league === 'nba' ? 'nba' : 'mens-college-basketball';
    const url = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/${leaguePath}/events/${gameId}/competitions/${gameId}/odds?_t=${Date.now()}`;
    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();
    const parsed = parseCoreOdds(data);
    console.log(`[odds] ${gameId} spread=${parsed?.spread} ML=${parsed?.moneylineHome}/${parsed?.moneylineAway} live=${parsed?.isLive}`);
    return parsed;
  },

  // Live game box score
  getGameSummary: async (league, gameId) => {
    const leaguePath = league === 'nba' ? 'nba' : 'mens-college-basketball';
    const response = await fetch(
      `${ESPN_BASE}/site/v2/sports/basketball/${leaguePath}/summary?event=${gameId}&_t=${Date.now()}`,
      { cache: 'no-store' }
    );
    return response.json();
  },

  getWinProbability: async (league, gameId) => {
    const leaguePath = league === 'nba' ? 'nba' : 'mens-college-basketball';
    const response = await fetch(
      `${ESPN_BASE}/site/v2/sports/basketball/${leaguePath}/summary?event=${gameId}`
    );
    const data = await response.json();
    return data.winProbability || [];
  },

  // Player game log (for last-10-game averages)
  getPlayerGameLog: async (playerId) => {
    const response = await fetch(
      `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}/gamelog?region=us&lang=en`
    );
    return response.json();
  },

  getPlayByPlay: async (league, gameId) => {
    const leaguePath = league === 'nba' ? 'nba' : 'mens-college-basketball';
    const response = await fetch(
      `${ESPN_BASE}/site/v2/sports/basketball/${leaguePath}/summary?event=${gameId}`
    );
    const data = await response.json();
    return data.plays || [];
  }
};

// Date formatting helper for ESPN API (YYYYMMDD)
export const formatDateForAPI = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};
