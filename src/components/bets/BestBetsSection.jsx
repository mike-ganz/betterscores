import { useState } from 'react';
import { Info, X, ChevronDown } from 'lucide-react';
import { mockOdds } from '../../utils/mock-odds';

const PROP_LABELS = {
  points: 'PTS',
  rebounds: 'REB',
  assists: 'AST',
  threes: '3PM',
};

const PROP_FULL_LABELS = {
  points: 'Points',
  rebounds: 'Rebounds',
  assists: 'Assists',
  threes: '3-Pointers Made',
};

function getSignalStyle(direction, intensity) {
  const t = Math.min(1, Math.max(0, intensity ?? 0));
  const alpha = 0.1 + t * 0.9;
  if (direction === 'over') {
    const r = Math.round(52 - t * 18);
    const g = Math.round(211 + t * 39);
    const b = Math.round(153 - t * 53);
    return { backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})` };
  }
  const r = Math.round(248 + t * 7);
  const g = Math.round(113 - t * 63);
  const b = Math.round(113 - t * 63);
  return { backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})` };
}

function fmt(val) {
  if (val == null) return '—';
  return (Math.round(val * 10) / 10).toString();
}

function pct(val) {
  if (val == null) return '—';
  return `${Math.round(val * 100)}%`;
}

const BreakdownPopover = ({ bet, onClose }) => {
  const b = bet.breakdown;
  if (!b) return null;

  const isOver = bet.direction === 'over';

  return (
    <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-[#12151c] border border-white/10 rounded-xl p-4 shadow-2xl space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
          Signal Breakdown
        </span>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-slate-400">
          <span>Prop</span>
          <span className="text-slate-200 font-semibold">
            {PROP_FULL_LABELS[bet.propType]} {isOver ? 'Over' : 'Under'} {bet.line}
          </span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Season Avg</span>
          <span className="text-slate-200 font-semibold">{fmt(b.seasonAvg)}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Last 10 Avg</span>
          <span className="text-slate-200 font-semibold">{fmt(b.l10Avg)}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Blended Avg</span>
          <span className="text-slate-200 font-semibold">
            {fmt(b.blendedAvg)}
            <span className="text-slate-600 ml-1 text-[9px]">60% L10 + 40% szn</span>
          </span>
        </div>

        <div className="border-t border-white/5 pt-2" />

        <div className="flex justify-between text-slate-400">
          <span>Projected Total</span>
          <span className={`font-bold ${isOver ? 'text-emerald-400' : 'text-red-400'}`}>
            {fmt(bet.projected)}
          </span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Minutes Played / Avg</span>
          <span className="text-slate-200 font-semibold">
            {fmt(b.minutesPlayed)} / {fmt(b.avgMinutes)}
          </span>
        </div>

        <div className="border-t border-white/5 pt-2" />

        <div className="flex justify-between text-slate-400">
          <span>Raw Intensity</span>
          <span className="text-slate-200 font-semibold">{pct(b.rawIntensity)}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Game Confidence</span>
          <span className="text-slate-200 font-semibold">
            {pct(b.gameConf)}
            <span className="text-slate-600 ml-1 text-[9px]">×</span>
          </span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Vig Multiplier</span>
          <span className="text-slate-200 font-semibold">
            {fmt(b.vigMult)}
            <span className="text-slate-600 ml-1 text-[9px]">×</span>
          </span>
        </div>
        <div className="flex justify-between text-slate-400 font-bold">
          <span className="text-slate-300">Final Intensity</span>
          <span className={isOver ? 'text-emerald-400' : 'text-red-400'}>
            {pct(bet.intensity)}
          </span>
        </div>
      </div>
    </div>
  );
};

const BestBetRow = ({ bet }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const strength = bet.intensity > 0.6 ? 'Strong' : bet.intensity > 0.3 ? 'Lean' : 'Slight';
  const isOver = bet.direction === 'over';
  const showScore = bet.isLive && bet.awayScore != null && bet.homeScore != null;

  return (
    <div className="relative flex items-center justify-between py-3 px-4 bg-white/[0.02] rounded-lg border border-white/5 hover:border-white/10 transition-colors">
      {/* Signal dot + Player + Game info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={getSignalStyle(bet.direction, bet.intensity)}
        />
        {bet.headshot && (
          <img
            src={bet.headshot}
            alt=""
            className="w-9 h-9 rounded-full flex-shrink-0 bg-slate-800"
          />
        )}
        <div className="min-w-0">
          <span className="text-base font-bold text-slate-100 truncate block">
            {bet.playerName}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            {showScore ? (
              <>
                <span className="font-semibold text-slate-400">
                  {bet.awayAbbr} {bet.awayScore}
                </span>
                <span className="text-slate-700">-</span>
                <span className="font-semibold text-slate-400">
                  {bet.homeAbbr} {bet.homeScore}
                </span>
                <span className="text-slate-700 mx-0.5">·</span>
                <span className="text-green-500 font-semibold">{bet.statusDetail}</span>
              </>
            ) : (
              <>
                <span>{bet.gameLabel}</span>
                {bet.statusDetail && (
                  <>
                    <span className="text-slate-700 mx-0.5">·</span>
                    <span>{bet.statusDetail}</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Prop type + Line + Odds + Strength + Info */}
      <div className="flex items-center gap-5 flex-shrink-0 ml-4">
        <span className="text-sm font-black text-slate-400 uppercase tracking-wide w-10 text-center">
          {PROP_LABELS[bet.propType]}
        </span>
        <div className="text-center">
          {bet.current != null ? (
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-blue-400 tabular-nums">{bet.current}</span>
              <span className="text-xs text-slate-600">/</span>
              <span className="text-lg font-bold text-white tabular-nums">{bet.line}</span>
            </div>
          ) : (
            <span className="text-lg font-bold text-white tabular-nums">{bet.line}</span>
          )}
        </div>

        {/* Highlighted odds for the favored direction */}
        <div className="min-w-[54px] text-center">
          <span className={`text-sm font-bold tabular-nums ${isOver ? 'text-emerald-400' : 'text-red-400'}`}>
            {isOver ? `o${mockOdds.formatOdds(bet.overOdds)}` : `u${mockOdds.formatOdds(bet.underOdds)}`}
          </span>
        </div>

        {/* Strength label */}
        <span className={`text-xs font-bold uppercase tracking-wider min-w-[80px] text-right ${isOver ? 'text-emerald-500/70' : 'text-red-400/70'}`}>
          {strength} {bet.direction}
        </span>

        {/* Info button */}
        {bet.breakdown && (
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0"
          >
            <Info size={15} />
          </button>
        )}
      </div>

      {showBreakdown && (
        <BreakdownPopover bet={bet} onClose={() => setShowBreakdown(false)} />
      )}
    </div>
  );
};

const DEFAULT_VISIBLE = 5;

export const BestBetsSection = ({ bets, loading }) => {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-3">
        <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
          Best Bets
          <span className="text-[8px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-bold">
            Top Signals
          </span>
        </h2>
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3 px-4 bg-white/[0.02] rounded-lg border border-white/5">
              <div className="w-3 h-3 rounded-full bg-white/[0.05] animate-pulse flex-shrink-0" />
              <div className="w-9 h-9 rounded-full bg-white/[0.05] animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-32 bg-white/[0.05] rounded animate-pulse" />
                <div className="h-3 w-20 bg-white/[0.03] rounded animate-pulse" />
              </div>
              <div className="h-5 w-16 bg-white/[0.05] rounded animate-pulse" />
              <div className="h-5 w-12 bg-white/[0.05] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!bets || bets.length === 0) return null;

  const visibleBets = expanded ? bets : bets.slice(0, DEFAULT_VISIBLE);
  const hasMore = bets.length > DEFAULT_VISIBLE;

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-3">
      <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
        Best Bets
        <span className="text-[8px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-bold">
          Top Signals
        </span>
      </h2>
      <div className="space-y-2">
        {visibleBets.map((bet, i) => (
          <BestBetRow key={`${bet.playerName}-${bet.propType}-${i}`} bet={bet} />
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-center gap-1.5 pt-2 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        >
          {expanded ? 'Show less' : `Show ${bets.length - DEFAULT_VISIBLE} more`}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );
};
