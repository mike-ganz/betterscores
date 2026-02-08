import { useParams, useNavigate } from 'react-router-dom';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useTeamData } from '../hooks/useBasketballData';
import { Skeleton } from '../components/ui/Skeleton';

export const TeamPage = () => {
  const { league, id } = useParams();
  const navigate = useNavigate();
  const { teamInfo, roster, statistics, loading, error } = useTeamData(league || 'nba', id);

  if (loading) {
    return (
      <PageWrapper>
        <Skeleton variant="card" className="h-32 mb-6" />
        <Skeleton variant="card" className="h-96" />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <div className="bg-[#12151c] rounded-lg border border-red-500/20 border-dashed p-12 text-center">
          <p className="text-sm text-red-400 mb-2">Error loading team</p>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      </PageWrapper>
    );
  }

  const team = teamInfo?.team || roster?.team;
  const players = roster?.athletes || [];
  const stats = statistics?.results?.stats;
  
  // Extract team records
  const teamRecord = team?.record?.items?.find(r => r.type === 'total');
  const overallRecord = teamRecord?.summary || team?.recordSummary || 'N/A';
  
  // Calculate last 10 from recent games (if we had schedule data)
  // For now, we'll show streak instead
  const streakStat = teamRecord?.stats?.find(s => s.name === 'streak');
  const streakValue = streakStat ? parseInt(streakStat.value) : null;
  const streakDisplay = streakValue 
    ? (streakValue > 0 ? `W${streakValue}` : `L${Math.abs(streakValue)}`)
    : 'N/A';

  // Extract advanced stats (Off/Def/Net Rating)
  const getStat = (...names) => {
    const allStats = stats?.categories?.flatMap(cat => cat.stats) || [];
    for (const name of names) {
      const stat = allStats.find(s => 
        s.name === name || s.abbreviation === name || s.displayName?.includes(name)
      );
      if (stat?.displayValue) return stat.displayValue;
    }
    return 'N/A';
  };

  // Use PPG and Opp PPG from team stats
  const ppg = getStat('avgPoints', 'avgPointsFor');
  
  // Get opponent PPG from team record stats
  const avgPointsAgainst = teamRecord?.stats?.find(s => s.name === 'avgPointsAgainst');
  const oppPpg = avgPointsAgainst?.displayValue || avgPointsAgainst?.value?.toFixed(1) || 'N/A';
  
  const netRtg = oppPpg !== 'N/A' && ppg !== 'N/A' 
    ? (parseFloat(ppg) - parseFloat(oppPpg)).toFixed(1)
    : 'N/A';

  return (
    <PageWrapper>
      {/* Team Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 mb-4 text-center sm:text-left">
          {team?.logos?.[0]?.href && (
            <img
              src={team.logos[0].href}
              alt={team.displayName}
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain flex-shrink-0"
            />
          )}
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-100 mb-1">
              {team?.displayName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">{team?.standingSummary}</p>
          </div>
        </div>

        {/* Team Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <div className="bg-[#12151c] border border-white/10 rounded-lg p-3 sm:p-4">
            <div className="text-xs text-slate-400 mb-1">Record</div>
            <div className="text-xl sm:text-2xl font-semibold text-slate-100">{overallRecord}</div>
          </div>
          <div className="bg-[#12151c] border border-white/10 rounded-lg p-3 sm:p-4">
            <div className="text-xs text-slate-400 mb-1">Streak</div>
            <div className={`text-xl sm:text-2xl font-semibold ${streakValue && streakValue > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {streakDisplay}
            </div>
          </div>
          <div className="bg-[#12151c] border border-white/10 rounded-lg p-3 sm:p-4">
            <div className="text-xs text-slate-400 mb-1">PPG</div>
            <div className="text-xl sm:text-2xl font-semibold text-slate-100">{ppg}</div>
          </div>
          <div className="bg-[#12151c] border border-white/10 rounded-lg p-3 sm:p-4">
            <div className="text-xs text-slate-400 mb-1">Opp PPG</div>
            <div className="text-xl sm:text-2xl font-semibold text-slate-100">{oppPpg}</div>
          </div>
        </div>

        {netRtg !== 'N/A' && (
          <div className="mt-4 bg-[#12151c] border border-white/10 rounded-lg p-4 inline-block">
            <div className="text-xs text-slate-400 mb-1">Net Rating</div>
            <div className={`text-2xl font-semibold ${parseFloat(netRtg) > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {parseFloat(netRtg) > 0 ? '+' : ''}{netRtg}
            </div>
          </div>
        )}
      </div>

      {/* Roster */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-slate-100 mb-4">Roster</h2>
        <div className="bg-[#12151c] border border-white/10 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-400">#</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-400">Player</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-400">Pos</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-400 hidden sm:table-cell">Exp</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-400 hidden sm:table-cell">College</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {players.map((player) => (
                  <tr
                    key={player.id}
                    className="transition-colors hover:bg-white/5 cursor-pointer"
                    onClick={() => navigate(`/player/${player.id}`)}
                  >
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-sm text-slate-300">{player.jersey || '-'}</td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {player.headshot?.href && (
                          <img
                            src={player.headshot.href}
                            alt={player.displayName}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover bg-slate-800 flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-medium text-slate-100 hover:text-blue-400 transition-colors truncate">
                            {player.displayName}
                          </div>
                          <div className="text-[10px] sm:text-xs text-slate-500">
                            {player.displayHeight} • {player.displayWeight}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-300">{player.position?.abbreviation || '-'}</td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-sm text-slate-300 hidden sm:table-cell">
                      {player.experience?.years ? `${player.experience.years}y` : 'R'}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-sm text-slate-400 hidden sm:table-cell">{player.college?.shortName || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Note about navigation */}
      <div className="mt-6 text-xs text-slate-500 italic">
        Click any player to view their detailed stats page.
      </div>
    </PageWrapper>
  );
};
