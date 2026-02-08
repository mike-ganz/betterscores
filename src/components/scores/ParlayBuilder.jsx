import { useState } from 'react';

export const ParlayBuilder = ({ selectedGames, onAddGame, onRemoveGame }) => {
  // Simple parlay odds calculator
  // Mock calculation: each -110 moneyline ≈ 1.91 multiplier
  const calculateParlay = (count) => {
    if (count < 2) return 0;
    return Math.pow(1.91, count) - 1; // Returns approx payout multiple
  };

  const parlayOdds = calculateParlay(selectedGames.length);
  const mockBet = 100;
  const potentialPayout = mockBet * (1 + parlayOdds);

  return (
    <div className="fixed bottom-4 left-3 right-3 sm:bottom-6 sm:left-auto sm:right-6 z-40 sm:max-w-xs">
      <div className="bg-gradient-to-br from-blue-600/95 to-blue-700/95 backdrop-blur-sm rounded-lg border border-blue-400/20 shadow-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Parlay Builder
          </h3>
          <span className="text-xs bg-blue-500/30 px-2 py-1 rounded font-mono text-blue-100">
            {selectedGames.length} {selectedGames.length === 1 ? 'game' : 'games'}
          </span>
        </div>

        {selectedGames.length === 0 ? (
          <p className="text-xs text-blue-100/70 italic">Select games to build a parlay</p>
        ) : (
          <>
            <div className="space-y-2 mb-3 max-h-24 overflow-y-auto">
              {selectedGames.map((game, idx) => {
                const away = game.competitions?.[0]?.competitors?.[0];
                const home = game.competitions?.[0]?.competitors?.[1];
                return (
                  <div
                    key={game.id}
                    className="flex items-center justify-between bg-blue-500/20 rounded px-2 py-1 text-xs"
                  >
                    <span className="text-blue-100 truncate">
                      {away?.team?.abbreviation} @ {home?.team?.abbreviation}
                    </span>
                    <button
                      onClick={() => onRemoveGame(game.id)}
                      className="text-blue-300 hover:text-blue-100 transition-colors text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            {selectedGames.length >= 2 && (
              <div className="bg-blue-500/30 rounded px-2 py-2 text-xs border border-blue-400/30">
                <div className="flex justify-between text-blue-100 mb-1">
                  <span>Bet ${mockBet}</span>
                  <span className="font-bold text-green-300">
                    Win ${potentialPayout.toFixed(0)}
                  </span>
                </div>
                <div className="text-blue-200 font-semibold">
                  {(parlayOdds * 100).toFixed(0)}% Return
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
