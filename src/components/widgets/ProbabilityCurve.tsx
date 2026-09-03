import React from 'react';
import type { WeatherForecast, TemperatureBracket } from '../../types/weatherMarket';
import { GlassCard } from '../common/GlassCard';
import { Thermometer, Activity, CloudSun } from 'lucide-react';

interface ProbabilityCurveProps {
  forecast: WeatherForecast | null;
  brackets: TemperatureBracket[];
}

export const ProbabilityCurve: React.FC<ProbabilityCurveProps> = ({ forecast, brackets }) => {
  if (!forecast || brackets.length === 0) {
    return (
      <GlassCard className="p-4 flex items-center justify-center min-h-[220px]">
        <span className="text-xs font-mono text-slate-500">Computing probability distribution...</span>
      </GlassCard>
    );
  }

  const { forecastMeanTemp, standardDeviation, currentTemp } = forecast;
  const width = 600;
  const height = 180;
  const padding = { top: 25, right: 30, bottom: 35, left: 30 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // X range: mean - 4 sigma to mean + 4 sigma
  const minX = forecastMeanTemp - 4 * standardDeviation;
  const maxX = forecastMeanTemp + 4 * standardDeviation;
  const rangeX = maxX - minX;

  // Gaussian PDF function: f(x) = (1 / (sigma * sqrt(2*pi))) * exp(-0.5 * ((x - mu)/sigma)^2)
  const pdf = (x: number) => {
    const z = (x - forecastMeanTemp) / standardDeviation;
    return (1 / (standardDeviation * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
  };

  const maxPdf = pdf(forecastMeanTemp);

  // Generate SVG path for the curve
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

  // Calculate coordinates for current temperature marker
  const currentTempClamped = Math.max(minX, Math.min(maxX, currentTemp));
  const currentTempX = padding.left + ((currentTempClamped - minX) / rangeX) * plotWidth;
  const currentTempY = padding.top + plotHeight - (pdf(currentTempClamped) / maxPdf) * plotHeight;

  // Bracket division vertical lines
  const bracketDividers = brackets.slice(1).map((b) => {
    const tempVal = b.minTemp;
    const x = padding.left + ((tempVal - minX) / rangeX) * plotWidth;
    return { x, temp: tempVal, label: b.label };
  });

  return (
    <GlassCard className="p-3 sm:p-4 flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs sm:text-sm font-semibold text-slate-200">
            WeatherNext 3 Ensemble Probability Density
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="text-slate-500">μ:</span>
            <span className="text-cyan-300 font-bold">{forecastMeanTemp}°F</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-slate-500">σ:</span>
            <span className="text-slate-300 font-bold">±{standardDeviation}°F</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-slate-500">Brier:</span>
            <span className="text-emerald-400 font-bold">{forecast.historicalBrierScore}</span>
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
            {/* Gradient for area under curve */}
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
            {/* Glow filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
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
            stroke="#1e293b"
            strokeWidth="1.5"
          />

          {/* Bracket Zone Vertical Demarcations */}
          {bracketDividers.map((div, i) => (
            <g key={`div-${i}`}>
              <line
                x1={div.x}
                y1={padding.top}
                x2={div.x}
                y2={padding.top + plotHeight}
                stroke="#334155"
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
            stroke="#06b6d4"
            strokeWidth="2.5"
            filter="url(#glow)"
          />

          {/* Mean Line */}
          {(() => {
            const meanX = padding.left + ((forecastMeanTemp - minX) / rangeX) * plotWidth;
            return (
              <g>
                <line
                  x1={meanX}
                  y1={padding.top}
                  x2={meanX}
                  y2={padding.top + plotHeight}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                />
                <circle cx={meanX} cy={padding.top + 4} r="3" fill="#38bdf8" />
              </g>
            );
          })()}

          {/* Current Live Temp Marker Pin */}
          <g transform={`translate(${currentTempX}, ${currentTempY})`}>
            <circle r="9" fill="#10b981" opacity="0.3" className="animate-ping" />
            <circle r="5" fill="#10b981" stroke="#064e3b" strokeWidth="1.5" />
            <line
              x1="0"
              y1="6"
              x2="0"
              y2={padding.top + plotHeight - currentTempY}
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
          </g>

          {/* Current Temp Badge */}
          <g transform={`translate(${currentTempX}, ${Math.max(12, currentTempY - 14)})`}>
            <rect
              x="-26"
              y="-10"
              width="52"
              height="16"
              rx="4"
              fill="#064e3b"
              stroke="#10b981"
              strokeWidth="1"
            />
            <text
              x="0"
              y="1"
              textAnchor="middle"
              alignmentBaseline="middle"
              fill="#6ee7b7"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
            >
              LIVE {currentTemp}°
            </text>
          </g>
        </svg>
      </div>

      {/* Bracket Legend Strip */}
      <div className="grid grid-cols-5 gap-1 pt-2 border-t border-slate-800 text-center font-mono">
        {brackets.map((b) => (
          <div key={b.id} className="px-1 py-1 rounded bg-slate-950/40 border border-slate-800/60">
            <span className="text-[10px] text-slate-300 font-medium block truncate">{b.label}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
