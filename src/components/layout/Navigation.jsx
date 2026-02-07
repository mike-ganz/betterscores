import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { format, addDays, subDays, isSameDay } from 'date-fns';

const MAJOR_CONFERENCES = [
  { name: 'AP Top 25', value: 'all' },
  { name: 'Big Ten', value: 'big10' },
  { name: 'ACC', value: 'acc' },
  { name: 'Big 12', value: 'big12' },
  { name: 'SEC', value: 'sec' },
  { name: 'Big East', value: 'bige' },
  { name: 'Pac-12', value: 'pac-12' },
  { name: 'American', value: 'American' },
  { name: 'Atlantic 10', value: 'atl10' },
  { name: 'Mountain West', value: 'mwest' },
  { name: 'West Coast', value: 'wcc' },
];

export const Navigation = ({
  league,
  onLeagueChange,
  selectedDate,
  onDateChange,
  nbaConference,
  onNbaConferenceChange,
  ncaamConference,
  onNcaamConferenceChange,
}) => {
  const location = useLocation();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const isScores = location.pathname === '/';
  const isStandings = location.pathname === '/standings';
  const showFilters = isScores || isStandings;

  const navItems = [
    { to: '/', label: 'Scores' },
    { to: '/standings', label: 'Standings' },
  ];

  const leagues = [
    { key: 'nba', label: 'NBA' },
    { key: 'mens-college-basketball', label: 'NCAAM' },
  ];

  const quickDates = [
    { label: 'Yesterday', date: subDays(new Date(), 1) },
    { label: 'Today', date: new Date() },
    { label: 'Tomorrow', date: addDays(new Date(), 1) },
  ];

  const handleDateClick = (date) => {
    onDateChange(date);
    setCalendarOpen(false);
  };

  const isNcaam = league === 'mens-college-basketball';

  const renderContextFilters = () => {
    if (isScores) {
      return (
        <>
          <div className="w-[1px] h-3 bg-white/10 mx-2" />
          {quickDates.map(({ label, date }) => {
            const isSelected = isSameDay(date, selectedDate);
            return (
              <button
                key={label}
                onClick={() => handleDateClick(date)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
          <div className="w-[1px] h-3 bg-white/10 mx-2" />
          <div className="relative">
            <button
              onClick={() => setCalendarOpen(!calendarOpen)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                calendarOpen ? 'bg-white/10 text-blue-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Calendar size={14} />
            </button>
            {calendarOpen && (
              <div
                className="absolute top-full mt-2 right-0 z-50 bg-[#12151c] border border-white/10 rounded-2xl shadow-2xl"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 40px)', gap: '4px', padding: '12px', width: 'max-content' }}
              >
                {Array.from({ length: 14 }).map((_, i) => {
                  const date = addDays(subDays(new Date(), 7), i);
                  const isSelected = isSameDay(date, selectedDate);
                  return (
                    <button
                      key={i}
                      onClick={() => handleDateClick(date)}
                      className={`flex flex-col items-center justify-center rounded-lg transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-white/5 text-slate-400'
                      }`}
                      style={{ width: '40px', height: '48px' }}
                    >
                      <span style={{ fontSize: '9px' }} className="uppercase font-black opacity-40">
                        {format(date, 'EEE')}
                      </span>
                      <span style={{ fontSize: '14px' }} className="font-bold leading-tight mt-0.5">
                        {format(date, 'd')}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      );
    }

    if (isStandings) {
      return (
        <>
          <div className="w-[1px] h-3 bg-white/10 mx-2" />
          {isNcaam ? (
            <select
              value={ncaamConference}
              onChange={(e) => onNcaamConferenceChange(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200 outline-none focus:border-blue-500/50 cursor-pointer"
            >
              {MAJOR_CONFERENCES.map((conf) => (
                <option key={conf.value} value={conf.value} className="bg-[#12151c] text-slate-200">
                  {conf.name}
                </option>
              ))}
            </select>
          ) : (
            ['eastern', 'western'].map((conf) => (
              <button
                key={conf}
                onClick={() => onNbaConferenceChange(conf)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                  nbaConference === conf
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {conf}
              </button>
            ))
          )}
        </>
      );
    }

    return null;
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-slate-100 tracking-tight">
              Courtside
            </h1>
          </div>

          {/* Center: Filter Bar */}
          {showFilters && (
            <div className="flex items-center bg-[#12151c] border border-white/5 rounded-xl p-1">
              {/* League Toggle */}
              {leagues.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => onLeagueChange(key)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                    league === key
                      ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}

              {/* Context-specific filters */}
              {renderContextFilters()}
            </div>
          )}

          {/* Nav Items */}
          <div className="flex gap-8" data-test="nav-links">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {label}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};
