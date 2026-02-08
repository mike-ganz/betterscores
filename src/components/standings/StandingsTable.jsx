import { Badge } from '../ui/Badge';

export const StandingsTable = ({ teams, showRank = false, showPlayoffLines = false }) => {
  if (!teams || teams.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        No standings data available
      </div>
    );
  }

  // Sort teams by wins (descending) - best teams first
  const sortedTeams = [...teams].sort((a, b) => {
    const aWins = parseInt(a.stats?.find(s => s.name === 'wins' || s.abbreviation === 'W')?.value || 0);
    const bWins = parseInt(b.stats?.find(s => s.name === 'wins' || s.abbreviation === 'W')?.value || 0);
    return bWins - aWins;
  });

  return (
    <div className="bg-[#12151c] rounded-lg border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              {!showRank && (
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-400 w-10 sm:w-12">
                  #
                </th>
              )}
              {showRank && (
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-400">
                  Rank
                </th>
              )}
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-400">
                Team
              </th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-xs font-medium text-slate-400">
                W
              </th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-xs font-medium text-slate-400">
                L
              </th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-xs font-medium text-slate-400 hidden sm:table-cell">
                PCT
              </th>
              <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-xs font-medium text-slate-400 hidden sm:table-cell">
                GB
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedTeams.map((team, index) => {
              const showPlayoffLine = showPlayoffLines && index === 5;
              const showPlayInLine = showPlayoffLines && index === 9;
              
              return (
                <>
                  <tr 
                    key={team.team?.id || index} 
                    className="transition-colors hover:bg-white/5"
                  >
                    {!showRank && (
                      <td className="px-2 py-2 sm:px-4 sm:py-3 text-center font-medium text-slate-400">
                        {index + 1}
                      </td>
                    )}
                    {showRank && (
                      <td className="px-2 py-2 sm:px-4 sm:py-3">
                        {team.team?.rank || team.current ? (
                          <Badge variant="ranked">#{team.team?.rank || team.current}</Badge>
                        ) : (
                          <span className="text-slate-400 font-medium">{index + 1}</span>
                        )}
                      </td>
                    )}
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {team.team?.logos?.[0]?.href && (
                          <img
                            src={team.team.logos[0].href}
                            alt={team.team.displayName}
                            className="w-6 h-6 sm:w-8 sm:h-8 object-contain flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-slate-100 text-sm sm:text-base truncate">
                            {team.team?.shortDisplayName || team.team?.displayName}
                          </div>
                          {team.team?.abbreviation && (
                            <div className="text-[10px] sm:text-xs text-white/50 hidden sm:block">
                              {team.team.abbreviation}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-center font-medium text-slate-100 text-sm">
                      {team.stats?.find(s => s.name === 'wins' || s.abbreviation === 'W')?.value ||
                       team.recordSummary?.split('-')[0] || '-'}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-center font-medium text-slate-100 text-sm">
                      {team.stats?.find(s => s.name === 'losses' || s.abbreviation === 'L')?.value ||
                       team.recordSummary?.split('-')[1] || '-'}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-center text-slate-400 hidden sm:table-cell">
                      {team.stats?.find(s => s.name === 'winPercent' || s.abbreviation === 'PCT')?.displayValue || '-'}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-center text-slate-400 hidden sm:table-cell">
                      {team.stats?.find(s => s.name === 'gamesBehind' || s.abbreviation === 'GB')?.displayValue || '-'}
                    </td>
                  </tr>
                  {showPlayoffLine && (
                    <tr key={`playoff-line-${index}`}>
                      <td colSpan="7" className="px-4 py-2 bg-white/5 border-y border-white/10">
                        <div className="text-xs font-medium text-slate-400 text-center">
                          Playoff cutoff
                        </div>
                      </td>
                    </tr>
                  )}
                  {showPlayInLine && (
                    <tr key={`playin-line-${index}`}>
                      <td colSpan="7" className="px-4 py-2 bg-white/5 border-y border-white/10">
                        <div className="text-xs font-medium text-slate-400 text-center">
                          Play-in tournament
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
