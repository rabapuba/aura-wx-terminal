import React from 'react';

interface MetricBadgeProps {
  label: string;
  value: string | number;
  subValue?: string;
  variant?: 'green' | 'red' | 'cyan' | 'amber' | 'slate';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const MetricBadge: React.FC<MetricBadgeProps> = ({
  label,
  value,
  subValue,
  variant = 'slate',
  size = 'md',
  icon
}) => {
  const variantStyles = {
    green: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
    red: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40',
    cyan: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/40',
    amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
    slate: 'bg-slate-100 dark:bg-[#141a24] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#263147]'
  };

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-xs sm:text-sm',
    lg: 'px-4 py-2 text-sm sm:text-base'
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border font-mono ${variantStyles[variant]} ${sizeStyles[size]}`}>
      {icon && <span className="opacity-80">{icon}</span>}
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans">{label}</span>
        <div className="flex items-baseline gap-1.5 font-semibold tabular-nums">
          <span>{value}</span>
          {subValue && <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{subValue}</span>}
        </div>
      </div>
    </div>
  );
};
