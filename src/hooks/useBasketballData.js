import { useState, useEffect } from 'react';
import { espnAPI } from '../utils/api-client';

// Compute the previous day's date string (yyyyMMdd → yyyyMMdd)
function getPreviousDateStr(dateStr) {
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  const d = new Date(year, month, day);
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

// Helper: Check if any game needs active polling
const shouldPollGames = (games) => {
  if (!games || games.length === 0) return false;
  
  const now = new Date();
  
  for (const game of games) {
    const status = game.competitions?.[0]?.status;
    
    // Game is live/in progress
    if (status?.type?.state === 'in') {
      return true;
    }
    
    // Game is scheduled and coming up soon
    if (status?.type?.state === 'pre') {
      const gameTime = new Date(game.date);
      const minsUntilTipoff = (gameTime - now) / 1000 / 60;
      
      // Keep polling if within 10 minutes of tipoff
      if (minsUntilTipoff >= 0 && minsUntilTipoff <= 10) {
        return true;
      }
    }
  }
  
  return false;
};

export const useScoreboard = (league, date, autoRefresh = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(autoRefresh);

  useEffect(() => {
    const fetchData = async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);
        const fetchFn = league === 'nba'
          ? (d) => espnAPI.getNBAScoreboard(d)
          : (d) => espnAPI.getNCAAMScoreboard(d);

        const result = await fetchFn(date);

        // Before 6 AM, also check yesterday's scoreboard for still-live games
        const hour = new Date().getHours();
        if (hour < 6) {
          try {
            const yesterdayResult = await fetchFn(getPreviousDateStr(date));
            const todayIds = new Set((result?.events || []).map(e => e.id));
            const liveYesterday = (yesterdayResult?.events || []).filter(
              g => g?.status?.type?.state === 'in' && !todayIds.has(g.id)
            );
            if (liveYesterday.length > 0) {
              result.events = [...liveYesterday, ...(result.events || [])];
            }
          } catch (err) {
            console.warn('[useScoreboard] yesterday fetch failed:', err);
          }
        }

        setData(result);
        setError(null);
        
        // After fetch, determine if we should continue polling
        if (autoRefresh) {
          const shouldPoll = shouldPollGames(result?.events);
          setIsPolling(shouldPoll);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    // Initial fetch
    fetchData(true);

    // Set up auto-refresh if enabled and polling is needed
    if (autoRefresh && isPolling) {
      const interval = setInterval(() => {
        fetchData(false); // Background refresh every 10s
      }, 10000); // 10 seconds

      return () => clearInterval(interval);
    }
  }, [league, date, autoRefresh, isPolling]);

  return { data, loading, error };
};

export const useStandings = (league, conference = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let result;
        
        if (league === 'nba') {
          result = await espnAPI.getNBAStandings();
        } else {
          // NCAAM: if conference is 'all' or null, get rankings; otherwise get standings
          if (!conference || conference === 'all') {
            result = await espnAPI.getNCAAMRankings();
          } else {
            result = await espnAPI.getNCAAMStandings();
          }
        }
        
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [league, conference]);

  return { data, loading, error };
};

export const usePlayerStats = (playerId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!playerId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await espnAPI.getPlayerStats(playerId);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [playerId]);

  return { data, loading, error };
};

export const useTeamData = (league, teamId) => {
  const [teamInfo, setTeamInfo] = useState(null);
  const [roster, setRoster] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [infoData, rosterData, statsData] = await Promise.all([
          espnAPI.getTeamInfo(league, teamId),
          espnAPI.getTeamRoster(league, teamId),
          espnAPI.getTeamStatistics(league, teamId),
        ]);

        setTeamInfo(infoData);
        setRoster(rosterData);
        setStatistics(statsData);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [league, teamId]);

  return { teamInfo, roster, statistics, loading, error };
};
