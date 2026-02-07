import { useState, useEffect } from 'react';
import { fdAPI } from '../utils/fd-client';

export function usePlayerProps(homeTeam, awayTeam, enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !homeTeam || !awayTeam) return;

    let cancelled = false;

    const fetchProps = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fdAPI.getPlayerProps(homeTeam, awayTeam);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          console.error('[usePlayerProps] fetch failed:', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProps();
    return () => { cancelled = true; };
  }, [homeTeam, awayTeam, enabled]);

  return { data, loading, error };
}
