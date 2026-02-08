import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { espnAPI } from '../../utils/api-client';
import { mockOdds } from '../../utils/mock-odds';
import { getGameInsights } from '../../utils/game-insights';
import { usePlayerProps } from '../../hooks/usePlayerProps';
import { PlayerPropsSection } from './PlayerPropsSection';

export const GameCardExpanded = ({ game, league = 'nba', onClose }) => {
  const [summary, setSummary] = useState(null);
  const [coreOdds, setCoreOdds] = useState(null);
  const [activeBoxTeam, setActiveBoxTeam] = useState(0);
  const [propsExpanded, setPropsExpanded] = useState(false);

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
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-sm z-50 overflow-y-auto p-2 sm:p-4" onClick={handleClose}>
      <div className="min-h-full flex items-center justify-center">
        <div
          className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden my-2 sm:my-8"
          onClick={(e) => e.stopPropagation()}
          style={{ maxHeight: 'calc(100vh - 1rem)' }}
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
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Data Insights - disabled for now, not providing clear value
          {insights.length > 0 && (
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-baseline gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/[0.02] border border-white/5 rounded-lg">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap w-20 sm:w-24 flex-shrink-0">{insight.label}</span>
                  <span className="text-sm font-semibold text-slate-200">{insight.value}</span>
                </div>
              ))}
            </div>
          )}
          */}

           {/* Betting Data - Enhanced with Implied Probability */}
           {displayOdds && (
             <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 sm:p-5 space-y-3 sm:space-y-5">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 border-t border-white/5">
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
                        Opened <span className="text-slate-400">{displayOdds.openSpread <= 0 ? home.team?.abbreviation : away.team?.abbreviation} {-Math.abs(displayOdds.openSpread)}</span>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs tabular-nums">
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

           {/* Player Stats Box Score */}
           {summary?.boxscore?.players?.length > 0 && (() => {
             const bsTeams = summary.boxscore.players;
             const team = bsTeams[activeBoxTeam];
             const allAthletes = (team?.statistics || []).flatMap(s => s.athletes || []);
             const labels = team?.statistics?.[0]?.labels || [];
             const minIdx = labels.indexOf('MIN');
             const ptsIdx = labels.indexOf('PTS');

             const parseMin = (val) => {
               if (!val) return 0;
               if (val.includes(':')) return parseInt(val.split(':')[0]) + parseInt(val.split(':')[1]) / 60;
               return parseFloat(val) || 0;
             };

             const athletes = allAthletes
               .filter(p => {
                 if (!p.stats?.length) return false;
                 return minIdx >= 0 && p.stats[minIdx] && p.stats[minIdx] !== '0';
               })
               .sort((a, b) => parseMin(b.stats[minIdx]) - parseMin(a.stats[minIdx]));

             if (!athletes.length) return null;

             const MOBILE_COLS = ['MIN', 'PTS', 'REB', 'AST'];
             const DESKTOP_COLS = ['FG', '3PT', '+/-'];

             return (
               <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                 <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-white/5">
                   <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Player Stats</h4>
                   <div className="flex gap-1">
                     {bsTeams.map((t, idx) => (
                       <button
                         key={t.team.id}
                         onClick={() => setActiveBoxTeam(idx)}
                         className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                           activeBoxTeam === idx
                             ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                             : 'text-slate-500 hover:text-slate-300 border border-transparent'
                         }`}
                       >
                         <img src={t.team.logo} className="w-4 h-4" alt="" />
                         {t.team.abbreviation}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                   <table className="w-full">
                     <thead>
                       <tr className="border-b border-white/5">
                         <th className="sticky left-0 z-10 bg-[#12151c] px-2 sm:px-3 py-1.5 text-left text-[9px] font-bold text-slate-500 uppercase min-w-[110px] sm:min-w-[140px]">
                           Player
                         </th>
                         {MOBILE_COLS.map(stat => {
                           if (labels.indexOf(stat) === -1) return null;
                           return (
                             <th key={stat} className="px-1.5 sm:px-2 py-1.5 text-center text-[9px] font-bold text-slate-500 uppercase whitespace-nowrap">
                               {stat}
                             </th>
                           );
                         })}
                         {DESKTOP_COLS.map(stat => {
                           if (labels.indexOf(stat) === -1) return null;
                           return (
                             <th key={stat} className="px-1.5 sm:px-2 py-1.5 text-center text-[9px] font-bold text-slate-500 uppercase whitespace-nowrap hidden sm:table-cell">
                               {stat}
                             </th>
                           );
                         })}
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-white/[0.03]">
                       {athletes.map((player) => {
                         const pts = parseInt(player.stats?.[ptsIdx]) || 0;
                         const isTopScorer = pts >= 20;
                         return (
                           <tr key={player.athlete.id} className="hover:bg-white/[0.03] transition-colors">
                             <td className="sticky left-0 z-10 bg-[#0f1117] px-2 sm:px-3 py-1.5">
                               <div className="flex items-center gap-1.5">
                                 {player.athlete?.headshot?.href ? (
                                   <img src={player.athlete.headshot.href} alt="" className="w-5 h-5 rounded-full bg-slate-800 flex-shrink-0" />
                                 ) : (
                                   <div className="w-5 h-5 rounded-full bg-slate-800 flex-shrink-0" />
                                 )}
                                 <span className={`text-[11px] font-semibold truncate max-w-[80px] sm:max-w-[120px] ${isTopScorer ? 'text-white' : 'text-slate-300'}`}>
                                   {player.athlete.shortName || player.athlete.displayName}
                                 </span>
                               </div>
                             </td>
                             {MOBILE_COLS.map(stat => {
                               const idx = labels.indexOf(stat);
                               if (idx === -1) return null;
                               const isPts = stat === 'PTS';
                               return (
                                 <td key={stat} className={`px-1.5 sm:px-2 py-1.5 text-center text-[11px] tabular-nums ${isPts && isTopScorer ? 'text-white font-bold' : 'text-slate-400'}`}>
                                   {player.stats?.[idx] || '-'}
                                 </td>
                               );
                             })}
                             {DESKTOP_COLS.map(stat => {
                               const idx = labels.indexOf(stat);
                               if (idx === -1) return null;
                               return (
                                 <td key={stat} className="px-1.5 sm:px-2 py-1.5 text-center text-[11px] tabular-nums text-slate-400 hidden sm:table-cell">
                                   {player.stats?.[idx] || '-'}
                                 </td>
                               );
                             })}
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
               </div>
             );
           })()}

           {/* Player Props (Collapsible) */}
           {shouldFetchProps && (
             <div>
               <button
                 onClick={() => setPropsExpanded(v => !v)}
                 className={`w-full flex items-center justify-between px-3 sm:px-5 py-3 bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.03] ${
                   propsExpanded ? 'rounded-t-xl border-b-0' : 'rounded-xl'
                 }`}
               >
                 <div className="flex items-center gap-2">
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                     Player Props
                   </span>
                   <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">
                     FanDuel
                   </span>
                 </div>
                 <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${propsExpanded ? 'rotate-180' : ''}`} />
               </button>
               {propsExpanded && (
                 <PlayerPropsSection
                   propsData={propsData}
                   loading={propsLoading}
                   error={propsError}
                   hideHeader
                   className="rounded-t-none border-t-0"
                 />
               )}
             </div>
           )}

           {/* Live Game Status */}
           {isLive && (
              <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg p-4 flex justify-between items-end">
                 <div>
                    <div className="text-[9px] font-black text-blue-400/70 uppercase tracking-widest mb-1">Live Status</div>
                    <div className="text-sm text-slate-300 font-medium">Q{competition.status?.period || '—'} • {competition.status?.displayClock || '—'}</div>
                 </div>
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
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

           {/* Bottom spacer so last element is fully scrollable */}
           <div className="h-2 shrink-0" />
        </div>
        </div>
      </div>
    </div>
  );
};
