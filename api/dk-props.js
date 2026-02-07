const FD_BASE = 'https://sbapi.mi.sportsbook.fanduel.com/api';
const FD_AK = 'FhMFpcPWXMeyZxOx';

// In-memory cache (shared within warm lambda)
const cache = new Map();
const CACHE_TTL = 60_000; // 60 seconds

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

  const { type, eventId, tab } = req.query;

  let url;
  if (type === 'events') {
    // List all NBA events
    url = `${FD_BASE}/content-managed-page?page=CUSTOM&customPageId=nba&_ak=${FD_AK}`;
  } else if (eventId) {
    // Get player props for a specific event
    url = `${FD_BASE}/event-page?eventId=${eventId}&tab=${tab || 'player-points'}&_ak=${FD_AK}`;
  } else {
    return res.status(400).json({ error: 'Missing eventId or type=events' });
  }

  // Check cache
  const cached = cache.get(url);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return res.status(200).json(cached.data);
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `FanDuel API returned ${response.status}`,
      });
    }

    const data = await response.json();

    cache.set(url, { data, time: Date.now() });

    if (cache.size > 50) {
      const oldest = cache.keys().next().value;
      cache.delete(oldest);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('FanDuel proxy error:', err);
    return res.status(502).json({ error: 'Failed to fetch from FanDuel' });
  }
}
