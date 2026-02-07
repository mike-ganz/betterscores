import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/layout/Navigation';
import { Home } from './pages/Home';
import { Standings } from './pages/Standings';
import { PlayerDetail } from './pages/PlayerDetail';
import { TeamPage } from './pages/TeamPage';
import CommandPalette from './components/ui/CommandPalette';

function App() {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Shared filter state
  const [league, setLeague] = useState('nba');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [nbaConference, setNbaConference] = useState('eastern');
  const [ncaamConference, setNcaamConference] = useState('all');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-transparent">
        <Navigation
          league={league}
          onLeagueChange={setLeague}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          nbaConference={nbaConference}
          onNbaConferenceChange={setNbaConference}
          ncaamConference={ncaamConference}
          onNcaamConferenceChange={setNcaamConference}
        />
        <CommandPalette
          isOpen={isPaletteOpen}
          onClose={() => setIsPaletteOpen(false)}
          onDateChange={setSelectedDate}
        />
        <Routes>
          <Route path="/" element={<Home league={league} selectedDate={selectedDate} />} />
          <Route path="/standings" element={
            <Standings
              league={league}
              nbaConference={nbaConference}
              ncaamConference={ncaamConference}
            />
          } />
          <Route path="/player/:id" element={<PlayerDetail />} />
          <Route path="/team/:league/:id" element={<TeamPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
