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
  // Eye-strain prevention: soft, calm glow borders without harsh neon
  const glowStyles = {
    green: 'border-emerald-500/30 dark:border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.08)]',
    red: 'border-rose-500/30 dark:border-rose-500/30 shadow-[0_0_12px_rgba(225,29,72,0.08)]',
    cyan: 'border-sky-500/30 dark:border-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.08)]',
    amber: 'border-amber-500/30 dark:border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.08)]',
    none: 'border-slate-200 dark:border-[#263147] hover:border-slate-300 dark:hover:border-[#33415e]'
  };

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl bg-white dark:bg-[#181f2c] border ${glowStyles[glow]} transition-all duration-200 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
};
