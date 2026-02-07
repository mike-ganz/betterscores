import { PageWrapper } from '../components/layout/PageWrapper';
import { StandingsTable } from '../components/standings/StandingsTable';
import { Skeleton } from '../components/ui/Skeleton';
import { useStandings } from '../hooks/useBasketballData';

export const Standings = ({ league, nbaConference, ncaamConference }) => {
  const isNcaam = league === 'mens-college-basketball';

  const { data, loading, error } = useStandings(
    isNcaam ? 'ncaam' : 'nba',
    isNcaam ? ncaamConference : null
  );

  const renderNBAStandings = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="card" className="h-16" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-[#12151c] rounded-lg border border-red-500/20 border-dashed p-12 text-center">
          <p className="text-sm text-red-400 mb-2">Error loading standings</p>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      );
    }

    const standings = data?.children || [];
    const easternConf = standings.find((s) =>
      s.name?.toLowerCase().includes('eastern') || s.abbreviation === 'EAST'
    );
    const westernConf = standings.find((s) =>
      s.name?.toLowerCase().includes('western') || s.abbreviation === 'WEST'
    );

    const selectedConf = nbaConference === 'eastern' ? easternConf : westernConf;
    const teams = selectedConf?.standings?.entries || [];

    return <StandingsTable teams={teams} showPlayoffLines={true} />;
  };

  const renderNCAAMRankings = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="card" className="h-16" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border-2 border-dashed border-red-500/30 p-12 text-center">
          <p className="text-lg font-semibold text-red-400 mb-1">Error loading rankings</p>
          <p className="text-sm text-white/60">{error}</p>
        </div>
      );
    }

    // If showing AP Top 25 (conference === 'all')
    if (ncaamConference === 'all') {
      const rankings = data?.rankings || [];
      const apPoll = rankings.find((r) => r.name === 'AP Top 25');
      const teams = apPoll?.ranks || [];

      return (
        <div>
          <h3 className="text-lg font-bold text-slate-100 mb-4">AP Top 25</h3>
          <StandingsTable teams={teams} showRank={true} />
        </div>
      );
    }

    // Showing conference standings
    const conferences = data?.children || [];
    const selectedConf = conferences.find((c) => c.abbreviation === ncaamConference);
    const teams = selectedConf?.standings?.entries || [];

    return (
      <div>
        <h3 className="text-lg font-bold text-slate-100 mb-4">
          {selectedConf?.name || 'Conference Standings'}
        </h3>
        <StandingsTable teams={teams} showPlayoffLines={false} />
      </div>
    );
  };

  return (
    <PageWrapper title="Standings & Rankings">
      {isNcaam ? renderNCAAMRankings() : renderNBAStandings()}
    </PageWrapper>
  );
};
