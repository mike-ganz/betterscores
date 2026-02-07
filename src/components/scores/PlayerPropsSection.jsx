import { mockOdds } from '../../utils/mock-odds';

const PROP_LABELS = {
  points: 'Points',
  rebounds: 'Rebounds',
  assists: 'Assists',
  threes: '3-Pointers Made',
};

const PROP_ORDER = ['points', 'rebounds', 'assists', 'threes'];

const PropRow = ({ prop }) => (
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
      <div className="text-center">
        <div className="text-base font-bold text-white tabular-nums">
          {prop.line}
        </div>
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
    </div>
  </div>
);

export const PlayerPropsSection = ({ propsData, loading, error }) => {
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

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-4">
      <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
        Player Props
        <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">
          FanDuel
        </span>
      </h4>

      {available.map(catKey => (
        <div key={catKey}>
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
            {PROP_LABELS[catKey]}
          </div>
          <div className="space-y-1.5">
            {props[catKey].slice(0, 6).map((prop, i) => (
              <PropRow key={`${catKey}-${i}`} prop={prop} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
