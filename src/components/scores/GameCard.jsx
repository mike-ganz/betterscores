import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getGameImportance } from '../../utils/game-importance';
import { GameCardExpanded } from './GameCardExpanded';
import MomentumSparkline from './MomentumSparkline';
import { espnAPI } from '../../utils/api-client';
import { mockOdds } from '../../utils/mock-odds';

export const GameCard = ({ game, league = 'nba' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [summary, setSummary] = useState(null);
  const [coreOdds, setCoreOdds] = useState(null);

  const competition = game.competitions?.[0];
  if (!competition) return null;

  const { competitors, status } = competition;
  const home = competitors?.find(c => c.homeAway === 'home');
  const away = competitors?.find(c => c.homeAway === 'away');

  const isLive = status?.type?.state === 'in';
  const isOver = status?.type?.state === 'post';
  // For pre-game, format game time in user's local timezone (ESPN sends UTC in game.date)
  const isPre = status?.type?.state === 'pre';
  const statusDetail = isPre && game.date
    ? new Date(game.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : (status?.type?.shortDetail || 'TBD');

  // Fetch summary for live games + poll every 10s
  useEffect(() => {
    if (!isLive) return;
    espnAPI.getGameSummary(league, game.id).then(setSummary);
    const interval = setInterval(() => {
      espnAPI.getGameSummary(league, game.id).then(setSummary).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [isLive, game.id, league]);

  // Fetch core odds when scoreboard doesn't include them + poll for live games
  const scoreboardOdds = competition.odds?.[0];
  const needsCoreOdds = scoreboardOdds?.spread == null && scoreboardOdds?.overUnder == null;
  useEffect(() => {
    if (!needsCoreOdds) return;
    espnAPI.getCoreOdds(league, game.id).then(setCoreOdds).catch(() => {});
    if (!isLive) return;
    const interval = setInterval(() => {
      espnAPI.getCoreOdds(league, game.id).then(setCoreOdds).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [needsCoreOdds, isLive, game.id, league]);

  const { score: importanceScore, reason } = getGameImportance(game, league);

  const handleExpandClick = () => {
    setIsExpanded(true);
    document.body.style.overflow = 'hidden';
  };

  const handleClose = () => {
    setIsExpanded(false);
    document.body.style.overflow = 'auto';
  };

  return (
    <>
      <div 
        className="group relative rounded-lg transition-all duration-300 bg-gradient-to-br from-[#0f1117] to-[#0a0e27] border border-white/8 cursor-pointer hover:border-white/15 hover:shadow-lg hover:shadow-blue-500/10 sm:hover:scale-105 active:scale-[0.98] active:opacity-90"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)`
        }}
      >
        <div className="p-4 sm:p-6" onClick={handleExpandClick}>
          <div className="flex justify-between items-start mb-4 sm:mb-5">
            <div className="flex flex-col gap-1">
               <span className="text-[13px] text-slate-400 font-semibold uppercase tracking-wider letter-spacing-1">{statusDetail}</span>
               {importanceScore >= 5 && (
                 <span className="text-[11px] text-blue-300 font-semibold uppercase tracking-wide">✨ {reason}</span>
               )}
            </div>
            {isLive && <MomentumSparkline plays={summary?.plays} />}
          </div>
          
          <div className="space-y-4">
            {[away, home].map((team, idx) => (
              <div key={team?.team?.id} className="flex items-center justify-between group/team">
                <div 
                  className="flex items-center gap-3 flex-1"
                >
                   <div className="relative">
                     <img src={team?.team?.logo} className="w-9 h-9 sm:w-11 sm:h-11 object-contain filter drop-shadow-lg" />
                   </div>
                   <div className="flex flex-col min-w-0">
                      <span className="text-base font-bold text-white uppercase tracking-tight leading-tight">{team?.team?.abbreviation}</span>
                      <span className="text-[11px] text-slate-400 font-medium">{team?.records?.[0]?.summary}</span>
                   </div>
                </div>
                <div className={`text-2xl sm:text-3xl font-bold tabular-nums ml-2 sm:ml-3 ${parseInt(team?.score) > parseInt((team === home ? away : home)?.score) ? 'text-blue-400' : 'text-slate-100'}`}>
                   {team?.score}
                </div>
              </div>
            ))}
          </div>

          {/* Vegas Line */}
          {(() => {
            // Use scoreboard odds if available, otherwise core odds
            const sbOdds = competition.odds?.[0];
            const odds = (sbOdds?.spread != null || sbOdds?.overUnder != null)
              ? {
                  spread: sbOdds.spread,
                  overUnder: sbOdds.overUnder,
                  moneylineHome: sbOdds?.moneyline?.home?.close?.odds || null,
                  moneylineAway: sbOdds?.moneyline?.away?.close?.odds || null,
                  source: 'espn',
                }
              : coreOdds;

            if (!odds) {
              return (
                <div className="mt-5 pt-4 border-t border-white/10">
                  <div className="text-[11px] text-slate-600 text-center py-1">Odds not available</div>
                </div>
              );
            }

            const displayOdds = mockOdds.enrichOdds(
              odds,
              home?.team?.shortDisplayName, away?.team?.shortDisplayName,
              home?.records?.[0]?.summary, away?.records?.[0]?.summary
            );
            const isLiveOdds = coreOdds?.isLive && isLive;
            return (
              <div className="mt-4 pt-3 sm:mt-5 sm:pt-4 border-t border-white/10">
                <div className="text-[12px] sm:text-[13px] text-slate-500 uppercase font-semibold tracking-wider mb-2">
                  {isLiveOdds ? 'Live Line' : 'Vegas Line'}
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                  <div>
                    <div className="text-[11px] text-slate-600 font-medium mb-1">Spread</div>
                    <div className="text-base font-bold text-white tabular-nums leading-tight">
                      {-Math.abs(displayOdds.spread)}
                      {displayOdds.spreadOddsHome && <span className="text-[10px] font-medium text-slate-500 ml-1">({mockOdds.formatOdds(displayOdds.spreadOddsHome)})</span>}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">{displayOdds.spread <= 0 ? home?.team?.abbreviation : away?.team?.abbreviation}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-600 font-medium mb-1">Total</div>
                    <div className="text-base font-bold text-white tabular-nums leading-tight">{displayOdds.overUnder}</div>
                    <div className="text-[10px] text-slate-500 mt-1 tabular-nums">
                      {displayOdds.overOdds && displayOdds.underOdds
                        ? `o${mockOdds.formatOdds(displayOdds.overOdds)} / u${mockOdds.formatOdds(displayOdds.underOdds)}`
                        : 'O/U'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-600 font-medium mb-1">ML</div>
                    <div className="space-y-0.5">
                      <div className="flex items-baseline justify-center gap-1.5">
                        <span className="text-[10px] text-slate-500 w-8 text-right">{away?.team?.abbreviation}</span>
                        <span className="text-sm font-bold text-white tabular-nums">{mockOdds.formatOdds(displayOdds.moneylineAway)}</span>
                      </div>
                      <div className="flex items-baseline justify-center gap-1.5">
                        <span className="text-[10px] text-slate-500 w-8 text-right">{home?.team?.abbreviation}</span>
                        <span className="text-sm font-bold text-white tabular-nums">{mockOdds.formatOdds(displayOdds.moneylineHome)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Line Movement */}
                {displayOdds.openSpread != null && displayOdds.openSpread !== displayOdds.spread && (
                  <div className="mt-2 pt-2 border-t border-white/5 text-xs text-slate-500 text-center tabular-nums">
                    Opened {displayOdds.openSpread > 0 ? `+${displayOdds.openSpread}` : displayOdds.openSpread}
                    {' → '}
                    <span className="text-amber-400">{displayOdds.spread > 0 ? `+${displayOdds.spread}` : displayOdds.spread}</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {isExpanded && createPortal(
        <GameCardExpanded
          game={game}
          league={league}
          onClose={handleClose}
        />,
        document.body
      )}
    </>
  );
};
