import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'green' | 'red' | 'cyan' | 'amber' | 'none';
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glow = 'none',
  onClick
}) => {
  const glowStyles = {
    green: 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.12)]',
    red: 'border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.12)]',
    cyan: 'border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.12)]',
    amber: 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.12)]',
    none: 'border-slate-800/80 hover:border-slate-700/90'
  };

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl bg-slate-900/75 backdrop-blur-md border ${glowStyles[glow]} transition-all duration-200 ${className}`}
    >
      {children}
    </div>
  );
};
