import { mockOdds } from '../../utils/mock-odds';

const PROP_LABELS = {
  points: 'Points',
  rebounds: 'Rebounds',
  assists: 'Assists',
  threes: '3-Pointers Made',
};

const PROP_ORDER = ['points', 'rebounds', 'assists', 'threes'];

/**
 * Returns an inline style for a signal dot.
 * Neutral (no signal) = white. Colored = green/red with intensity-based opacity.
 */
function getSignalStyle(signal) {
  if (!signal || !signal.direction) {
    return { backgroundColor: 'rgba(255, 255, 255, 0.35)' };
  }
  const { direction, intensity } = signal;
  const alpha = 0.25 + (intensity ?? 0) * 0.75;
  if (direction === 'over') {
    return { backgroundColor: `rgba(52, 211, 153, ${alpha})` };
  }
  return { backgroundColor: `rgba(248, 113, 113, ${alpha})` };
}

const SignalDot = ({ signal, tooltip, size = 'w-2.5 h-2.5' }) => (
  <div className="relative group">
    <div
      className={`${size} rounded-full`}
      style={getSignalStyle(signal)}
    />
    {tooltip && (
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-[#1a1e26] border border-white/10 rounded text-[9px] text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {tooltip}
      </div>
    )}
  </div>
);

function projTooltip(indicator) {
  if (!indicator?.projection?.value) return null;
  const { value, direction, intensity } = indicator.projection;
  const arrow = direction === 'over' ? '\u2191' : direction === 'under' ? '\u2193' : '';
  const strength = intensity > 0.6 ? 'Strong' : intensity > 0.3 ? 'Lean' : 'Slight';
  return direction ? `Proj: ${value} ${arrow} ${strength} ${direction}` : `Proj: ${value}`;
}

const PropRow = ({ prop, indicator }) => {
  const hasCurrent = indicator?.current != null;

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-white/[0.02] rounded-lg border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {prop.headshot && (
          <img
            src={prop.headshot}
            alt=""
            className="w-7 h-7 rounded-full flex-shrink-0 bg-slate-800"
          />
        )}
        <span className="text-sm font-semibold text-slate-100 truncate">
          {prop.playerName}
        </span>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0 ml-3">
        {/* Current stat / Line */}
        <div className="text-center">
          {hasCurrent ? (
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-blue-400 tabular-nums">{indicator.current}</span>
              <span className="text-[10px] text-slate-600">/</span>
              <span className="text-base font-bold text-white tabular-nums">{prop.line}</span>
            </div>
          ) : (
            <div className="text-base font-bold text-white tabular-nums">
              {prop.line}
            </div>
          )}
        </div>
        <div className="flex gap-2 text-center">
          <div className="min-w-[44px]">
            <span className="text-xs font-bold text-emerald-400 tabular-nums">
              o{mockOdds.formatOdds(prop.overOdds)}
            </span>
          </div>
          <div className="min-w-[44px]">
            <span className="text-xs font-bold text-red-400 tabular-nums">
              u{mockOdds.formatOdds(prop.underOdds)}
            </span>
          </div>
        </div>
        {indicator && (
          <SignalDot
            signal={indicator.projection}
            tooltip={projTooltip(indicator)}
          />
        )}
      </div>
    </div>
  );
};

export const PlayerPropsSection = ({ propsData, loading, error, indicators }) => {
  if (loading) {
    return (
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
        <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">
          Player Props
        </h4>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-white/[0.03] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !propsData?.found) return null;

  const { props } = propsData;
  const available = PROP_ORDER.filter(key => props[key]?.length > 0);
  if (available.length === 0) return null;

  const hasIndicators = indicators && Object.keys(indicators).length > 0;

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-4">
      <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
        Player Props
        <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">
          FanDuel
        </span>
      </h4>

      {hasIndicators && (
        <div className="flex items-center gap-2.5 text-[8px] text-slate-600">
          <span className="uppercase tracking-wider font-bold">Projection</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'rgba(52, 211, 153, 0.7)' }} /> over
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'rgba(248, 113, 113, 0.7)' }} /> under
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'rgba(255, 255, 255, 0.35)' }} /> neutral
          </span>
        </div>
      )}

      {available.map(catKey => (
        <div key={catKey}>
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
            {PROP_LABELS[catKey]}
          </div>
          <div className="space-y-1.5">
            {props[catKey].slice(0, 6).map((prop, i) => (
              <PropRow
                key={`${catKey}-${i}`}
                prop={prop}
                indicator={indicators?.[prop.playerName]?.[catKey]}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
