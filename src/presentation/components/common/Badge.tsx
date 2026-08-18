import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'emerald' | 'amber' | 'rose' | 'teal' | 'indigo' | 'slate';
  animate?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'slate', animate = false }) => {
  const styles = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    slate: 'bg-slate-800 text-slate-300 border-slate-700'
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
        styles[variant]
      } ${animate ? 'animate-pulse' : ''}`}
    >
      {animate && <span className="w-1.5 h-1.5 rounded-full bg-current"></span>}
      {label}
    </span>
  );
};
