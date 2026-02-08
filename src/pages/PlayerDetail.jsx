import { useParams } from 'react-router-dom';
import { PageWrapper } from '../components/layout/PageWrapper';
import { usePlayerStats } from '../hooks/useBasketballData';
import { Skeleton, StatCardSkeleton } from '../components/ui/Skeleton';
import { StatCard } from '../components/player/StatCard';

export const PlayerDetail = () => {
  const { id } = useParams();
  const { data, loading, error } = usePlayerStats(id);

  if (loading) {
    return (
      <PageWrapper title="Player Details">
        <div className="space-y-6">
          <Skeleton variant="card" className="h-32" />
          <h3 className="text-xl font-bold text-[#1E293B]">Season Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <StatCardSkeleton variant="hero" className="col-span-2" />
            <StatCardSkeleton variant="hero" className="col-span-2" />
            <StatCardSkeleton variant="hero" className="col-span-2" />
            <StatCardSkeleton variant="standard" />
            <StatCardSkeleton variant="standard" />
            <StatCardSkeleton variant="standard" />
            <StatCardSkeleton variant="compact" />
            <StatCardSkeleton variant="compact" />
            <StatCardSkeleton variant="compact" />
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (error || !data) {
    return (
      <PageWrapper title="Player Details">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-red-600">
          {error || 'Player not found'}
        </div>
      </PageWrapper>
    );
  }

  const athlete = data.athlete || {};
  const stats = data.statistics || [];

  // Extract key stats from the stats array - use per-game stats
  const findStat = (statName) => {
    for (const category of stats) {
      const stat = category.stats?.find(s => s.name === statName || s.abbreviation === statName);
      if (stat) return stat.displayValue;
    }
    return null;
  };

  const ppg = findStat('avgPoints');
  const rpg = findStat('avgRebounds');
  const apg = findStat('avgAssists');
  const fgPct = findStat('FG%');
  const fg3Pct = findStat('3P%');
  const ftPct = findStat('FT%');
  const stl = findStat('avgSteals');
  const blk = findStat('avgBlocks');
  const to = findStat('avgTurnovers');

  return (
    <PageWrapper>
      <div className="bg-[#12151c] rounded-lg border border-white/5 p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8 relative overflow-hidden shadow-2xl">
        {/* Background glow for player header */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] -translate-y-1/2 translate-x-1/2" />

        <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 md:gap-8 relative z-10 text-center md:text-left">
          {athlete.headshot && (
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
              <img
                src={athlete.headshot.href}
                alt={athlete.fullName}
                className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-[#1a1e26] object-cover relative z-10 drop-shadow-2xl"
              />
            </div>
          )}
          <div>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-100 tracking-tight">
                {athlete.fullName}
              </h2>
              <div className="px-2 py-1 rounded bg-slate-800 text-xs font-black text-slate-400">
                #{athlete.jersey}
              </div>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
              {athlete.position?.name} <span className="mx-2 text-slate-800">•</span> {athlete.team?.displayName}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-white/5" />
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap">Season Averages</h3>
        <div className="h-px flex-1 bg-white/5" />
      </div>
      
      {/* Bento Box Layout */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4 md:gap-5 mb-6 sm:mb-8 md:mb-10">
        {/* Hero Stats - Large cards spanning 2 columns */}
        <StatCard 
          variant="hero" 
          label="Points Per Game" 
          value={ppg} 
          className="col-span-2" 
        />
        <StatCard 
          variant="hero" 
          label="Rebounds Per Game" 
          value={rpg} 
          className="col-span-2" 
        />
        <StatCard 
          variant="hero" 
          label="Assists Per Game" 
          value={apg} 
          className="col-span-2" 
        />

        {/* Standard Stats - Medium cards */}
        <StatCard variant="standard" label="FG%" value={fgPct} />
        <StatCard variant="standard" label="3P%" value={fg3Pct} />
        <StatCard variant="standard" label="FT%" value={ftPct} />

        {/* Compact Stats */}
        <StatCard variant="compact" label="Steals" value={stl} />
        <StatCard variant="compact" label="Blocks" value={blk} />
        <StatCard variant="compact" label="Turnovers" value={to} />
      </div>

      {/* Future Enhancement: Game Logs */}
      <div className="bg-[#12151c]/50 rounded-lg border border-white/5 border-dashed p-6 sm:p-10 text-center">
        <p className="text-slate-600 font-bold uppercase tracking-[0.2em] text-xs">Game logs coming soon</p>
      </div>
    </PageWrapper>
  );
};
