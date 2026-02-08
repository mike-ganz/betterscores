export const StatCard = ({ label, value, variant = 'standard', className = '' }) => {
  const variants = {
    hero: {
      container: 'bg-[#12151c] rounded-lg border border-white/5 p-4 sm:p-6 shadow-lg relative overflow-hidden',
      label: 'text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 sm:mb-3',
      value: 'text-3xl sm:text-4xl md:text-5xl font-black text-slate-100 tabular-nums relative z-10',
    },
    standard: {
      container: 'bg-[#12151c] rounded-lg border border-white/5 p-3 sm:p-5 shadow-md',
      label: 'text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1 sm:mb-2',
      value: 'text-2xl sm:text-3xl font-black text-slate-200 tabular-nums',
    },
    compact: {
      container: 'bg-[#12151c] rounded-lg border border-white/10 p-3 sm:p-4 shadow-sm',
      label: 'text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] mb-1',
      value: 'text-lg sm:text-xl font-bold text-slate-300 tabular-nums',
    },
  };

  const style = variants[variant] || variants.standard;

  return (
    <div className={`${style.container} ${className} group hover:border-white/20 transition-all duration-300`}>
      {variant === 'hero' && (
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      )}
      <div className={style.label}>{label}</div>
      <div className={style.value}>{value || '—'}</div>
      
      {/* Subtle depth flare on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 pointer-events-none" />
    </div>
  );
};
