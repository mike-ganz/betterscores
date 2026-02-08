import { useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { BetsGameCard } from '../components/bets/BetsGameCard';
import { BestBetsSection } from '../components/bets/BestBetsSection';
import { useScoreboard } from '../hooks/useBasketballData';
import { clearFdCache } from '../utils/fd-client';
import { clearIndicatorCaches } from '../utils/prop-indicators';
import { format } from 'date-fns';

const PROP_TYPES = ['points', 'rebounds', 'assists', 'threes'];

/**
 * Extract the strongest signals across all games.
 * Returns flat array of { playerName, headshot, propType, line, overOdds, underOdds,
 *   gameLabel, isLive, direction, intensity, projected, current } sorted by intensity desc.
 */
function extractBestBets(allGameData) {
  const bets = [];

  for (const gameData of Object.values(allGameData)) {
    const { indicators, propsData, gameLabel, isLive,
      awayAbbr, homeAbbr, awayScore, homeScore, statusDetail } = gameData;
    if (!indicators || !propsData?.props) continue;

    for (const propType of PROP_TYPES) {
      const props = propsData.props[propType] || [];
      for (const prop of props) {
        const indicator = indicators[prop.playerName]?.[propType];
        const signal = indicator?.projection;
        if (!signal?.direction || !signal?.intensity) continue;

        bets.push({
          playerName: prop.playerName,
          headshot: prop.headshot,
          propType,
          line: prop.line,
          overOdds: prop.overOdds,
          underOdds: prop.underOdds,
          gameLabel,
          isLive,
          awayAbbr,
          homeAbbr,
          awayScore,
          homeScore,
          statusDetail,
          direction: signal.direction,
          intensity: signal.intensity,
          projected: signal.value,
          current: indicator.current,
          breakdown: indicator.breakdown,
        });
      }
    }
  }

  // Sort by intensity descending, take top 10
  bets.sort((a, b) => b.intensity - a.intensity);
  const top = bets.slice(0, 10);

  // Log distribution for debugging
  const overs = top.filter(b => b.direction === 'over').length;
  const unders = top.filter(b => b.direction === 'under').length;
  if (top.length > 0) {
    console.log(`[bestBets] Top ${top.length}: ${overs} overs, ${unders} unders (from ${bets.length} total signals across ${Object.keys(allGameData).length} games)`);
  }

  return top;
}

export const Bets = () => {
  const dateStr = format(new Date(), 'yyyyMMdd');
  const { data, loading, error } = useScoreboard('nba', dateStr);
  const games = data?.events || [];

  const liveGames = games.filter(g => g?.status?.type?.state === 'in');
  const upcomingGames = games.filter(g => g?.status?.type?.state === 'pre');

  // Refresh mechanism — incrementing key busts caches and re-triggers all hooks
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    clearFdCache();
    clearIndicatorCaches();
    setAllGameData({});
    setRefreshing(true);
    setRefreshKey(k => k + 1);
    // Reset spinning state after a short delay
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Collect indicator data from all game cards
  const [allGameData, setAllGameData] = useState({});

  const handleIndicatorsReady = useCallback((gameId, data) => {
    setAllGameData(prev => {
      // Skip if data hasn't meaningfully changed (same indicator keys)
      const existing = prev[gameId];
      if (existing && existing.indicators === data.indicators && existing.propsData === data.propsData) {
        return prev;
      }
      return { ...prev, [gameId]: data };
    });
  }, []);

  const bestBets = extractBestBets(allGameData);
  const hasLiveGames = games.some(g => g?.status?.type?.state === 'in');
  const bestBetsLoading = !loading && hasLiveGames && bestBets.length === 0;

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto relative">
        {/* Refresh button — top right */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="absolute top-0 right-0 p-2.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
          title="Refresh all data"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>

        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
                <div className="h-12 bg-white/[0.03] rounded-lg animate-pulse mb-4" />
                <div className="space-y-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-10 bg-white/[0.03] rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-sm font-medium text-slate-400">{error}</span>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8 md:space-y-12">
            {/* Best Bets — aggregated strongest signals */}
            {(bestBets.length > 0 || bestBetsLoading) && (
              <section className="animate-slide-in">
                <BestBetsSection bets={bestBets} loading={bestBetsLoading} />
              </section>
            )}

            {/* Live Games */}
            {liveGames.length > 0 && (
              <section className="animate-slide-in">
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider sm:tracking-[0.2em] mb-4 sm:mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live Props
                </h2>
                <div className="space-y-4">
                  {liveGames.map(game => (
                    <BetsGameCard
                      key={game.id}
                      game={game}
                      onIndicatorsReady={handleIndicatorsReady}
                      refreshKey={refreshKey}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Games */}
            {upcomingGames.length > 0 && (
              <section className="animate-slide-in" style={{ animationDelay: '100ms' }}>
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider sm:tracking-[0.2em] mb-4 sm:mb-6">
                  Upcoming
                </h2>
                <div className="space-y-4">
                  {upcomingGames.map(game => (
                    <BetsGameCard
                      key={game.id}
                      game={game}
                      onIndicatorsReady={handleIndicatorsReady}
                      refreshKey={refreshKey}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* No games */}
            {liveGames.length === 0 && upcomingGames.length === 0 && (
              <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <span className="text-sm font-medium text-slate-500">No NBA games today</span>
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};
