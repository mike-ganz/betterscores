import { mockOdds } from '../../utils/mock-odds';

const PROP_LABELS = {
  points: 'PTS',
  rebounds: 'REB',
  assists: 'AST',
  threes: '3PM',
};

function getSignalStyle(direction, intensity) {
  const alpha = 0.25 + (intensity ?? 0) * 0.75;
  if (direction === 'over') {
    return { backgroundColor: `rgba(52, 211, 153, ${alpha})` };
  }
  return { backgroundColor: `rgba(248, 113, 113, ${alpha})` };
}

const BestBetRow = ({ bet }) => {
  const strength = bet.intensity > 0.6 ? 'Strong' : bet.intensity > 0.3 ? 'Lean' : 'Slight';
  const isOver = bet.direction === 'over';
  const showScore = bet.isLive && bet.awayScore != null && bet.homeScore != null;

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-white/[0.02] rounded-lg border border-white/5 hover:border-white/10 transition-colors">
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

      {/* Prop type + Line + Odds + Strength */}
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
      </div>
    </div>
  );
};

export const BestBetsSection = ({ bets }) => {
  if (!bets || bets.length === 0) return null;

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-3">
      <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
        Best Bets
        <span className="text-[8px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-bold">
          Top Signals
        </span>
      </h2>
      <div className="space-y-2">
        {bets.map((bet, i) => (
          <BestBetRow key={`${bet.playerName}-${bet.propType}-${i}`} bet={bet} />
        ))}
      </div>
    </div>
  );
};
