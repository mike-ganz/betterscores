import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { usePlayerProps } from '../../hooks/usePlayerProps';
import { usePropIndicators } from '../../hooks/usePropIndicators';
import { PlayerPropsSection } from '../scores/PlayerPropsSection';

export const BetsGameCard = ({ game, defaultExpanded = false, onIndicatorsReady, refreshKey = 0 }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const competition = game.competitions?.[0];
  const { competitors, status } = competition || {};
  const home = competitors?.find(c => c.homeAway === 'home');
  const away = competitors?.find(c => c.homeAway === 'away');

  const isLive = status?.type?.state === 'in';
  const isPre = status?.type?.state === 'pre';
  const statusDetail = isPre && game.date
    ? new Date(game.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : (status?.type?.shortDetail || 'TBD');

  const { data: propsData, loading: propsLoading, error: propsError } = usePlayerProps(
    home?.team?.shortDisplayName,
    away?.team?.shortDisplayName,
    true,
    refreshKey
  );

  const { indicators } = usePropIndicators(game.id, 'nba', propsData, isLive, refreshKey);

  // Report indicators up to parent for Best Bets aggregation
  // Only report when we have actual computed indicators (not the initial empty object)
  useEffect(() => {
    if (onIndicatorsReady && propsData?.found && Object.keys(indicators).length > 0) {
      onIndicatorsReady(game.id, {
        indicators,
        propsData,
        gameLabel: `${away?.team?.abbreviation} @ ${home?.team?.abbreviation}`,
        isLive,
        awayAbbr: away?.team?.abbreviation,
        homeAbbr: home?.team?.abbreviation,
        awayScore: away?.score,
        homeScore: home?.score,
        statusDetail,
      });
    }
  }, [indicators, propsData]);

  if (!competition) return null;

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
      {/* Game Header — clickable to toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 sm:gap-6 flex-1 min-w-0">
          {/* Away Team */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {away?.team?.logo && (
              <img src={away.team.logo} alt="" className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
            )}
            <div className="text-left">
              <div className="text-xs sm:text-sm font-bold text-slate-100">
                {away?.team?.abbreviation}
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-500 hidden sm:block">
                {away?.records?.[0]?.summary}
              </div>
            </div>
            {(isLive || status?.type?.state === 'post') && (
              <span className="text-base sm:text-lg font-bold text-white tabular-nums ml-0.5 sm:ml-1">
                {away?.score}
              </span>
            )}
          </div>

          <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase flex-shrink-0">@</span>

          {/* Home Team */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {(isLive || status?.type?.state === 'post') && (
              <span className="text-base sm:text-lg font-bold text-white tabular-nums mr-0.5 sm:mr-1">
                {home?.score}
              </span>
            )}
            {home?.team?.logo && (
              <img src={home.team.logo} alt="" className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
            )}
            <div className="text-left">
              <div className="text-xs sm:text-sm font-bold text-slate-100">
                {home?.team?.abbreviation}
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-500 hidden sm:block">
                {home?.records?.[0]?.summary}
              </div>
            </div>
          </div>
        </div>

        {/* Status + Chevron */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {isLive && (
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse" />
            )}
            <span className={`text-[10px] sm:text-xs font-semibold ${isLive ? 'text-green-400' : 'text-slate-500'}`}>
              {statusDetail}
            </span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Player Props — collapsible */}
      {expanded && (
        <div className="p-3 sm:p-4 border-t border-white/5">
          <PlayerPropsSection
            propsData={propsData}
            loading={propsLoading}
            error={propsError}
            indicators={indicators}
          />
          {!propsLoading && !propsData?.found && !propsError && (
            <div className="text-center py-6">
              <span className="text-xs text-slate-600">No player props available</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
