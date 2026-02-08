import React, { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, Users, Trophy, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, subDays } from 'date-fns';

export default function CommandPalette({ isOpen, onClose, onDateChange }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose(); // Toggle mechanism handled by parent
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const actions = [
    { id: 'today', title: 'Go to Today', icon: <Calendar size={16} />, section: 'Navigation', action: () => onDateChange(new Date()) },
    { id: 'yesterday', title: 'View Yesterday', icon: <Calendar size={16} />, section: 'Navigation', action: () => onDateChange(subDays(new Date(), 1)) },
    { id: 'standings', title: 'View Standings', icon: <Trophy size={16} />, section: 'Navigation', action: () => navigate('/standings') },
    { id: 'nba', title: 'NBA Scores', icon: <Command size={16} />, section: 'Leagues', action: () => navigate('/') },
  ];

  const filteredActions = actions.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-slate-950/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-[calc(100vw-2rem)] max-w-lg bg-[#12151c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-white/5">
          <Search className="text-slate-500 mr-3" size={18} />
          <input
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-slate-200 text-sm placeholder:text-slate-600"
            placeholder="Search teams, players or commands..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-slate-500 font-bold">ESC</div>
        </div>

        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">No results found for "{query}"</div>
          ) : (
            <div className="space-y-1">
              {filteredActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    action.action();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-blue-600 hover:text-white transition-all group text-left"
                >
                  <div className="text-slate-500 group-hover:text-white/80">{action.icon}</div>
                  <span className="text-xs font-semibold">{action.title}</span>
                  <span className="ml-auto text-[10px] text-slate-600 group-hover:text-white/40 font-bold uppercase">{action.section}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="px-4 py-2 border-t border-white/5 bg-white/[0.01] flex items-center justify-between text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          <span>Navigate with arrows</span>
          <span>Open with ⌘K</span>
        </div>
      </div>
    </div>
  );
}
