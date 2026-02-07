const PROXY = '/api/dk-props';

const PROP_TABS = ['player-points', 'player-rebounds', 'player-assists', 'player-threes'];
const TAB_TO_KEY = {
  'player-points': 'points',
  'player-rebounds': 'rebounds',
  'player-assists': 'assists',
  'player-threes': 'threes',
};

// Module-level cache (persists across renders, resets on page refresh)
const clientCache = new Map();
const CACHE_TTL = 90_000; // 90s

function getCached(key) {
  const entry = clientCache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  clientCache.set(key, { data, time: Date.now() });
  if (clientCache.size > 100) {
    const oldest = clientCache.keys().next().value;
    clientCache.delete(oldest);
  }
}

// Fetch all NBA events from FanDuel to find event IDs
async function fetchEvents() {
  const cacheKey = 'fd-events';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${PROXY}?type=events`);
  if (!res.ok) throw new Error(`Proxy error: ${res.status}`);
  const data = await res.json();

  const events = Object.values(data.attachments?.events || {});
  setCache(cacheKey, events);
  return events;
}

// Match an ESPN game to a FanDuel event by team names
function matchEvent(fdEvents, homeTeam, awayTeam) {
  if (!fdEvents || !homeTeam || !awayTeam) return null;

  const home = homeTeam.toLowerCase();
  const away = awayTeam.toLowerCase();

  return fdEvents.find(event => {
    const name = (event.name || '').toLowerCase();
    return name.includes(home) && name.includes(away);
  });
}

// Parse FanDuel market data into normalized player props
function parseMarkets(markets) {
  if (!markets) return [];

  const props = [];
  for (const market of Object.values(markets)) {
    const { marketName, runners, marketStatus } = market;
    if (!marketName || !runners || runners.length < 2) continue;
    if (marketStatus !== 'OPEN') continue;

    // Only "Player Name - Points/Rebounds/etc" format (skip "To Score 20+" style)
    if (!marketName.includes(' - ')) continue;

    const over = runners.find(r => r.result?.type === 'OVER');
    const under = runners.find(r => r.result?.type === 'UNDER');
    if (!over || !under) continue;

    const playerName = marketName.split(' - ')[0].trim();

    props.push({
      playerName,
      line: over.handicap,
      overOdds: over.winRunnerOdds?.americanDisplayOdds?.americanOdds,
      underOdds: under.winRunnerOdds?.americanDisplayOdds?.americanOdds,
      headshot: over.logo || null,
      teamLogo: over.secondaryLogo || null,
    });
  }

  // Sort by line descending (star players first)
  return props.sort((a, b) => (b.line || 0) - (a.line || 0));
}

// Fetch player props for a single event + tab
async function fetchTab(eventId, tab) {
  const cacheKey = `fd-${eventId}-${tab}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${PROXY}?eventId=${eventId}&tab=${tab}`);
  if (!res.ok) throw new Error(`Proxy error: ${res.status}`);
  const data = await res.json();

  const parsed = parseMarkets(data.attachments?.markets);
  setCache(cacheKey, parsed);
  return parsed;
}

export const fdAPI = {
  // Main method: fetch all player props for a game
  // Pass ESPN team display names (e.g., "Thunder", "Rockets")
  getPlayerProps: async (homeTeam, awayTeam) => {
    try {
      // Step 1: Find the FanDuel event ID
      const events = await fetchEvents();
      const matched = matchEvent(events, homeTeam, awayTeam);
      if (!matched) {
        return { found: false, props: {} };
      }

      // Step 2: Fetch all 4 prop tabs in parallel
      const results = {};
      const fetches = await Promise.allSettled(
        PROP_TABS.map(tab =>
          fetchTab(matched.eventId, tab).then(parsed => ({
            key: TAB_TO_KEY[tab],
            data: parsed,
          }))
        )
      );

      for (const result of fetches) {
        if (result.status !== 'fulfilled') continue;
        const { key, data } = result.value;
        if (data.length > 0) {
          results[key] = data;
        }
      }

      return {
        found: Object.keys(results).length > 0,
        props: results,
        eventId: matched.eventId,
      };
    } catch (err) {
      console.error('[fd-client] getPlayerProps error:', err);
      return { found: false, props: {}, error: err.message };
    }
  },
};
