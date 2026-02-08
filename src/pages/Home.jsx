import { useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { GameCard } from '../components/scores/GameCard';
import { GameCardSkeleton } from '../components/ui/Skeleton';
import { ParlayBuilder } from '../components/scores/ParlayBuilder';
import { useScoreboard } from '../hooks/useBasketballData';
import { sortGamesByImportance } from '../utils/game-importance';
import { format } from 'date-fns';

export const Home = ({ league, selectedDate }) => {
  const [parlayGames, setParlayGames] = useState([]);

  const dateStr = format(selectedDate, 'yyyyMMdd');
  const { data, loading, error } = useScoreboard(league, dateStr);
  const games = data?.events || [];

  const liveGames = games.filter(g => g?.status?.type?.state === 'in');
  const otherGames = games.filter(g => g?.status?.type?.state !== 'in');

  const sortedOther = sortGamesByImportance(otherGames, league);

  const handleAddToParlay = (game) => {
    if (parlayGames.find(g => g.id === game.id)) {
      setParlayGames(parlayGames.filter(g => g.id !== game.id));
    } else {
      setParlayGames([...parlayGames, game]);
    }
  };

  const handleRemoveFromParlay = (gameId) => {
    setParlayGames(parlayGames.filter(g => g.id !== gameId));
  };

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => <GameCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-sm font-medium text-slate-400">{error}</span>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8 md:space-y-12">
            {liveGames.length > 0 && (
              <section className="animate-slide-in">
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider sm:tracking-[0.2em] mb-4 sm:mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live Now
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {liveGames.map(game => (
                    <GameCard
                      key={game.id}
                      game={game}
                      league={league}
                      onAddToParlay={handleAddToParlay}
                      isInParlay={parlayGames.some(g => g.id === game.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="animate-slide-in" style={{ animationDelay: '100ms' }}>
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider sm:tracking-[0.2em] mb-4 sm:mb-6">
                {liveGames.length > 0 ? 'Upcoming & Final' : 'Games'}
              </h2>
              {sortedOther.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {sortedOther.map(game => (
                    <GameCard
                      key={game.id}
                      game={game}
                      league={league}
                      onAddToParlay={handleAddToParlay}
                      isInParlay={parlayGames.some(g => g.id === game.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                  <span className="text-sm font-medium text-slate-500">No games scheduled for this date</span>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {parlayGames.length > 0 && (
        <ParlayBuilder
          selectedGames={parlayGames}
          onAddGame={handleAddToParlay}
          onRemoveGame={handleRemoveFromParlay}
        />
      )}
    </PageWrapper>
  );
};
