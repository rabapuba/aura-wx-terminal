import React from 'react';
import type { WeatherForecast, TemperatureBracket } from '../../types/weatherMarket';
import { GlassCard } from '../common/GlassCard';
import { Activity } from 'lucide-react';

interface ProbabilityCurveProps {
  forecast: WeatherForecast | null;
  brackets: TemperatureBracket[];
}

export const ProbabilityCurve: React.FC<ProbabilityCurveProps> = ({ forecast, brackets }) => {
  if (!forecast || brackets.length === 0) {
    return (
      <GlassCard className="p-4 flex items-center justify-center min-h-[220px]">
        <span className="text-xs font-mono text-slate-400 dark:text-slate-500">Computing TMAX probability distribution...</span>
      </GlassCard>
    );
  }

  const { forecastDailyHighTemp, standardDeviation, runningDailyMaxTemp } = forecast;
  const width = 600;
  const height = 180;
  const padding = { top: 25, right: 30, bottom: 35, left: 30 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const minX = forecastDailyHighTemp - 4 * standardDeviation;
  const maxX = forecastDailyHighTemp + 4 * standardDeviation;
  const rangeX = maxX - minX;

  const pdf = (x: number) => {
    const z = (x - forecastDailyHighTemp) / standardDeviation;
    return (1 / (standardDeviation * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
  };

  const maxPdf = pdf(forecastDailyHighTemp);

  const points: { x: number; y: number; temp: number }[] = [];
  const steps = 100;
  for (let i = 0; i <= steps; i++) {
    const temp = minX + (i / steps) * rangeX;
    const p = pdf(temp);
    const x = padding.left + (i / steps) * plotWidth;
    const y = padding.top + plotHeight - (p / maxPdf) * plotHeight;
    points.push({ x, y, temp });
  }

  const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '');
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${padding.top + plotHeight} L ${points[0].x.toFixed(1)} ${padding.top + plotHeight} Z`;

  const runningMaxClamped = Math.max(minX, Math.min(maxX, runningDailyMaxTemp));
  const runningMaxX = padding.left + ((runningMaxClamped - minX) / rangeX) * plotWidth;
  const runningMaxY = padding.top + plotHeight - (pdf(runningMaxClamped) / maxPdf) * plotHeight;

  const bracketDividers = brackets.slice(1).map((b) => {
    const tempVal = b.minTemp;
    const x = padding.left + ((tempVal - minX) / rangeX) * plotWidth;
    return { x, temp: tempVal, label: b.label };
  });

  return (
    <GlassCard className="p-3 sm:p-4 flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-[#263147]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span className="font-mono text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-200">
            Daily High (TMAX) Probability Density Distribution
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="text-slate-400 dark:text-slate-500">μ TMAX:</span>
            <span className="text-sky-700 dark:text-sky-300 font-bold">{forecastDailyHighTemp}°F</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-slate-400 dark:text-slate-500">σ:</span>
            <span className="text-slate-700 dark:text-slate-300 font-bold">±{standardDeviation}°F</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-slate-400 dark:text-slate-500">Running Max:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{runningDailyMaxTemp}°F</span>
          </span>
        </div>
      </div>

      {/* SVG Gaussian Curve */}
      <div className="w-full relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[320px] select-none"
        >
          <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Baseline Grid */}
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={width - padding.right}
            y2={padding.top + plotHeight}
            stroke="#94a3b8"
            strokeOpacity="0.3"
            strokeWidth="1.5"
          />

          {/* Bracket Division Vertical Demarcations */}
          {bracketDividers.map((div, i) => (
            <g key={`div-${i}`}>
              <line
                x1={div.x}
                y1={padding.top}
                x2={div.x}
                y2={padding.top + plotHeight}
                stroke="#64748b"
                strokeOpacity="0.35"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={div.x}
                y={padding.top + plotHeight + 14}
                textAnchor="middle"
                fill="#64748b"
                fontSize="9"
                fontFamily="monospace"
              >
                {div.temp}°
              </text>
            </g>
          ))}

          {/* Filled Density Area */}
          <path d={areaD} fill="url(#curveGradient)" />

          {/* Gaussian Density Curve Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.5"
            className="dark:stroke-sky-400"
            filter="url(#softGlow)"
          />

          {/* Modeled TMAX Mean Line */}
          {(() => {
            const meanX = padding.left + ((forecastDailyHighTemp - minX) / rangeX) * plotWidth;
            return (
              <g>
                <line
                  x1={meanX}
                  y1={padding.top}
                  x2={meanX}
                  y2={padding.top + plotHeight}
                  stroke="#0284c7"
                  className="dark:stroke-sky-300"
                  strokeWidth="1.5"
                />
                <circle cx={meanX} cy={padding.top + 4} r="3" fill="#0284c7" className="dark:fill-sky-300" />
              </g>
            );
          })()}

          {/* Running Daily High Observed Pin Marker */}
          <g transform={`translate(${runningMaxX}, ${runningMaxY})`}>
            <circle r="7" fill="#10b981" opacity="0.25" className="animate-ping" />
            <circle r="4.5" fill="#10b981" stroke="#065f46" strokeWidth="1.2" />
            <line
              x1="0"
              y1="6"
              x2="0"
              y2={padding.top + plotHeight - runningMaxY}
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
          </g>

          {/* Running High Badge */}
          <g transform={`translate(${runningMaxX}, ${Math.max(12, runningMaxY - 14)})`}>
            <rect
              x="-34"
              y="-10"
              width="68"
              height="16"
              rx="4"
              fill="#065f46"
              stroke="#10b981"
              strokeWidth="1"
            />
            <text
              x="0"
              y="1"
              textAnchor="middle"
              alignmentBaseline="middle"
              fill="#d1fae5"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
            >
              RUNNING {runningDailyMaxTemp}°
            </text>
          </g>
        </svg>
      </div>

      {/* Bracket Legend Strip */}
      <div className="grid grid-cols-5 gap-1 pt-2 border-t border-slate-200 dark:border-[#263147] text-center font-mono">
        {brackets.map((b) => (
          <div
            key={b.id}
            className={`px-1 py-1 rounded border ${
              b.isEliminatedByObservedMax
                ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 opacity-70'
                : 'bg-slate-50 dark:bg-[#141a24] border-slate-200 dark:border-[#263147]'
            }`}
          >
            <span className="text-[10px] text-slate-700 dark:text-slate-300 font-medium block truncate">
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
