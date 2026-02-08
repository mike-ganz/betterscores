import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { espnAPI } from '../../utils/api-client';
import { mockOdds } from '../../utils/mock-odds';
import { getGameInsights } from '../../utils/game-insights';
import { usePlayerProps } from '../../hooks/usePlayerProps';
import { PlayerPropsSection } from './PlayerPropsSection';

export const GameCardExpanded = ({ game, league = 'nba', onClose }) => {
  const [summary, setSummary] = useState(null);
  const [coreOdds, setCoreOdds] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryData, oddsData] = await Promise.all([
          espnAPI.getGameSummary(league, game.id),
          espnAPI.getCoreOdds(league, game.id).catch(() => null),
        ]);
        setSummary(summaryData);
        setCoreOdds(oddsData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [game.id, league]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const competition = game.competitions?.[0];
  const home = competition?.competitors?.find(c => c.homeAway === 'home');
  const away = competition?.competitors?.find(c => c.homeAway === 'away');

  const isOver = competition?.status?.type?.state === 'post';
  const shouldFetchProps = league === 'nba' && !isOver && !!home && !!away;

  const {
    data: propsData,
    loading: propsLoading,
    error: propsError,
  } = usePlayerProps(
    home?.team?.shortDisplayName,
    away?.team?.shortDisplayName,
    shouldFetchProps
  );

  if (!competition || !home || !away) return null;

  const isLive = competition.status?.type?.state === 'in';

  const getOdds = () => {
    // Try scoreboard odds first, then core odds
    const sbOdds = game.competitions?.[0]?.odds?.[0];
    const hasSbOdds = sbOdds?.spread != null || sbOdds?.overUnder != null;

    const oddsData = hasSbOdds
      ? {
          spread: sbOdds.spread,
          overUnder: sbOdds.overUnder,
          moneylineHome: sbOdds?.moneyline?.home?.close?.odds || null,
          moneylineAway: sbOdds?.moneyline?.away?.close?.odds || null,
        }
      : coreOdds;

    if (!oddsData) return null;

    return mockOdds.enrichOdds(
      oddsData,
      home.team?.shortDisplayName,
      away.team?.shortDisplayName,
      home.records?.[0]?.summary,
      away.records?.[0]?.summary
    );
  };

  const insights = getGameInsights(game, summary);
  const displayOdds = getOdds();

  const handleClose = () => {
    document.body.style.overflow = 'auto';
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-sm z-50 overflow-y-auto p-4" onClick={handleClose}>
      <div className="min-h-full flex items-center justify-center">
        <div
          className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden my-8"
          onClick={(e) => e.stopPropagation()}
          style={{ maxHeight: 'calc(100vh - 4rem)' }}
        >
        {/* Enhanced Header with Records (Sticky) */}
        <div className="sticky top-0 p-4 sm:p-6 border-b border-white/5 flex justify-between items-start bg-[#0f1117]/95 backdrop-blur z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
               <span className="text-[10px] sm:text-[11px] font-black text-blue-400 uppercase tracking-widest flex-shrink-0">
                 {competition?.status?.type?.detail || 'Game'}
               </span>
            </div>
            <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight mb-1 truncate">
              {away.team?.abbreviation} @ {home.team?.abbreviation}
            </h3>
            <p className="text-xs text-slate-400 line-clamp-2">
              {away.team?.shortDisplayName} ({away.records?.[0]?.summary || '—'}) vs {home.team?.shortDisplayName} ({home.records?.[0]?.summary || '—'})
            </p>
          </div>
          <button 
            onClick={handleClose} 
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/20 transition-all text-slate-400 hover:text-slate-100 flex-shrink-0 ml-2 group"
            title="Close modal (Esc)"
          >
            <X size={18} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Info Grid (Scrollable Content) */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Data Insights */}
          {insights.length > 0 && (
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-baseline gap-3 px-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-lg">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap w-24 flex-shrink-0">{insight.label}</span>
                  <span className="text-sm font-semibold text-slate-200">{insight.value}</span>
                </div>
              ))}
            </div>
          )}

           {/* Betting Data - Enhanced with Implied Probability */}
           {displayOdds && (
             <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-5">
                <div>
                  <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    Vegas Lines
                    {displayOdds.source === 'mock-data' && (
                      <span className="text-[8px] bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded opacity-60">MVP Data</span>
                    )}
                  </h4>
                  
                  {/* Moneyline with Implied Probability */}
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Moneyline (Implied %)</div>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Away Team */}
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-sm font-bold text-white">{mockOdds.formatOdds(displayOdds.moneylineAway)}</span>
                          <span className="text-[10px] font-bold text-cyan-400">{displayOdds.moneylineProbAway}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-cyan-500/60 rounded-full transition-all duration-300"
                            style={{ width: `${displayOdds.moneylineProbAway}%` }}
                          />
                        </div>
                        <div className="text-[9px] text-slate-500">{away.team?.abbreviation}</div>
                      </div>
                      
                      {/* Home Team */}
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-sm font-bold text-white">{mockOdds.formatOdds(displayOdds.moneylineHome)}</span>
                          <span className="text-[10px] font-bold text-orange-400">{displayOdds.moneylineProbHome}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-orange-500/60 rounded-full transition-all duration-300"
                            style={{ width: `${displayOdds.moneylineProbHome}%` }}
                          />
                        </div>
                        <div className="text-[9px] text-slate-500">{home.team?.abbreviation}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spread & Total */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5">
                  <div>
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Spread</span>
                    <div className="flex items-baseline gap-2">
                      <div className="text-base font-bold text-white tabular-nums">{-Math.abs(displayOdds.spread)}</div>
                      {displayOdds.spreadOddsHome && (
                        <span className="text-xs text-slate-500 tabular-nums">({mockOdds.formatOdds(displayOdds.spreadOddsHome)})</span>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-1">{displayOdds.spread <= 0 ? home.team?.abbreviation : away.team?.abbreviation} favored</div>
                    {displayOdds.openSpread != null && displayOdds.openSpread !== displayOdds.spread && (
                      <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
                        Opened <span className="text-slate-400">{-Math.abs(displayOdds.openSpread)}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Total</span>
                    <div className="text-base font-bold text-white tabular-nums">{displayOdds.overUnder}</div>
                    {displayOdds.overOdds && displayOdds.underOdds ? (
                      <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
                        O {mockOdds.formatOdds(displayOdds.overOdds)} / U {mockOdds.formatOdds(displayOdds.underOdds)}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 mt-1">O/U</div>
                    )}
                  </div>
                </div>

                {/* Moneyline Line Movement */}
                {displayOdds.openMoneylineHome != null && displayOdds.openMoneylineHome !== displayOdds.moneylineHome && (
                  <div className="pt-3 border-t border-white/5">
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Line Movement</span>
                    <div className="grid grid-cols-2 gap-3 text-xs tabular-nums">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{home.team?.abbreviation} ML:</span>
                        <span className="text-slate-400">{mockOdds.formatOdds(displayOdds.openMoneylineHome)}</span>
                        <span className="text-slate-600">→</span>
                        <span className="text-amber-400">{mockOdds.formatOdds(displayOdds.moneylineHome)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{away.team?.abbreviation} ML:</span>
                        <span className="text-slate-400">{mockOdds.formatOdds(displayOdds.openMoneylineAway)}</span>
                        <span className="text-slate-600">→</span>
                        <span className="text-amber-400">{mockOdds.formatOdds(displayOdds.moneylineAway)}</span>
                      </div>
                    </div>
                  </div>
                )}
             </div>
           )}

           {/* Player Props */}
           {shouldFetchProps && (
             <PlayerPropsSection
               propsData={propsData}
               loading={propsLoading}
               error={propsError}
             />
           )}

           {/* Live Game Context */}
           {isLive && (
              <div className="space-y-4 pt-2 border-t border-white/5">
                 {/* Leading Scorers - Top 3 only */}
                 {summary?.boxscore?.players && (
                    <div>
                       <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Leading Scorers</h4>
                       <div className="space-y-2">
                          {summary.boxscore.players.slice(0, 2).map((team, teamIdx) => {
                             const leader = team.statistics?.[0]?.athletes?.[0];
                             if (!leader) return null;
                             const fouls = leader?.stats?.[10]; // Foul count typically at index 10
                             const hasFoulTrouble = fouls >= 4;
                             return (
                                <div key={`${team.team.id}-${teamIdx}`} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                   <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <img src={team.team.logo} className="w-7 h-7 flex-shrink-0 opacity-80" />
                                      <div className="flex-1 min-w-0">
                                         <div className="text-sm font-semibold text-slate-100 truncate">{leader?.athlete?.displayName}</div>
                                         <div className="text-[10px] text-slate-500">{team.team.abbreviation}</div>
                                      </div>
                                   </div>
                                   <div className="text-right flex-shrink-0 ml-2">
                                      <div className="text-base font-black text-white tabular-nums">{leader?.stats?.[1] || 0}</div>
                                      <div className="text-[9px] text-slate-500 font-medium">PTS</div>
                                      {hasFoulTrouble && (
                                         <div className="text-[8px] text-yellow-400 font-bold mt-0.5">⚠️ {fouls}F</div>
                                      )}
                                   </div>
                                </div>
                             )
                          })}
                       </div>
                    </div>
                 )}

                 {/* Live Game Status */}
                 <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg p-4 flex justify-between items-end">
                    <div>
                       <div className="text-[9px] font-black text-blue-400/70 uppercase tracking-widest mb-1">Live Status</div>
                       <div className="text-sm text-slate-300 font-medium">Q{competition.status?.period || '—'} • {competition.status?.displayClock || '—'}</div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                 </div>
              </div>
           )}

           {/* Postgame Summary */}
           {isOver && (
              <div className="pt-2 border-t border-white/5">
                 <p className="text-sm text-slate-300">
                    Final: {parseInt(home.score) > parseInt(away.score) ? home.team.shortDisplayName : away.team.shortDisplayName} wins
                 </p>
              </div>
           )}
        </div>

        {/* Footer padding to prevent content hiding under bottom of modal */}
        <div className="h-4"></div>
        </div>
      </div>
    </div>
  );
};
