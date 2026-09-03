import React from 'react';
import { useWeatherMarket } from '../../context/WeatherMarketContext';
import { useTheme } from '../../context/ThemeContext';
import { useCountdown } from '../../hooks/useCountdown';
import {
  Clock,
  Zap,
  Play,
  Pause,
  RefreshCw,
  Sun,
  Moon,
  Sparkles,
  Award
} from 'lucide-react';

export const TopStatusBar: React.FC = () => {
  const {
    activePeriod,
    speedMultiplier,
    setSpeedMultiplier,
    systemHealth,
    portfolio,
    agentConfig,
    updateAgentConfig,
    forcePeriodRoll,
    isIngestingForecasts
  } = useWeatherMarket();

  const { theme, toggleTheme } = useTheme();

  const { formatted, isUrgent, isCritical, progressPct } = useCountdown(
    activePeriod.endTime,
    activePeriod.startTime,
    speedMultiplier,
    () => {
      forcePeriodRoll();
    }
  );

  // Dynamic Phase Badge styling
  const phaseStyles = {
    PRE_MARKET: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
    PEAK_HEATING: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/50 animate-pulse',
    LATE_SWEEP: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50 animate-pulse',
    SETTLEMENT_LOCK: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40'
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0f141c]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#263147] px-3 sm:px-6 py-2.5 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2.5 max-w-[1920px] mx-auto">
        {/* Left: Branding, Period & Strategy Phase Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase">
              Aura<span className="text-sky-600 dark:text-sky-400"> WX Terminal</span>
            </span>
            <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50 rounded">
              TMAX DAILY PRO
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-[#263147] hidden sm:block" />

          {/* Session Phase Badge */}
          <div className={`hidden sm:flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded border ${phaseStyles[activePeriod.currentPhase]}`}>
            {activePeriod.currentPhase === 'PRE_MARKET' && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            {activePeriod.currentPhase === 'PEAK_HEATING' && <Sparkles className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />}
            {activePeriod.currentPhase === 'LATE_SWEEP' && <Award className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />}
            <span className="font-semibold">{activePeriod.phaseLabel}</span>
          </div>
        </div>

        {/* Center: Global Live Daily Market Countdown Timer */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#181f2c] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#263147] shadow-sm">
          <div className="flex items-center gap-2">
            <Clock
              className={`w-4 h-4 ${
                isCritical
                  ? 'text-rose-500 dark:text-rose-400 animate-bounce'
                  : isUrgent
                  ? 'text-amber-500 dark:text-amber-400 animate-pulse'
                  : 'text-sky-600 dark:text-sky-400'
              }`}
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                  DAILY MARKET LOCK ({activePeriod.marketDate})
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">({progressPct}%)</span>
              </div>
              <span
                className={`font-mono font-bold text-sm sm:text-base tabular-nums tracking-wider ${
                  isCritical
                    ? 'text-rose-600 dark:text-rose-400 drop-shadow-[0_0_8px_rgba(225,29,72,0.4)]'
                    : isUrgent
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatted}
              </span>
            </div>
          </div>

          {/* Speed Multiplier & Force Next Day Roll Button */}
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200 dark:border-[#263147]">
            <button
              onClick={() => setSpeedMultiplier(speedMultiplier === 1 ? 10 : speedMultiplier === 10 ? 60 : 1)}
              title="Toggle simulated clock speed"
              className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${
                speedMultiplier > 1
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 font-semibold'
                  : 'bg-slate-200/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {speedMultiplier}x
            </button>
            <button
              onClick={forcePeriodRoll}
              disabled={isIngestingForecasts}
              title="Simulate Daily Settlement & Rollover"
              className="p-1 rounded bg-slate-200/70 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-400 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isIngestingForecasts ? 'animate-spin text-sky-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Right: Theme Switcher, Latencies, AI Agent & Portfolio */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Latency Telemetry */}
          <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#181f2c] px-2.5 py-1 rounded border border-slate-200 dark:border-[#263147]">
            <div className="flex items-center gap-1" title="Kalshi CLOB Latency">
              <span className="text-slate-400 dark:text-slate-500">KX:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{systemHealth.kalshiLatencyMs}ms</span>
            </div>
            <div className="flex items-center gap-1" title="Polymarket Latency">
              <span className="text-slate-400 dark:text-slate-500">POLY:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{systemHealth.polymarketLatencyMs}ms</span>
            </div>
            <div className="flex items-center gap-1" title="Google WeatherNext 3 TMAX Feed">
              <Zap className="w-3 h-3 text-sky-500 dark:text-sky-400" />
              <span className="text-sky-600 dark:text-sky-400 font-semibold">{systemHealth.weatherNextLatencyMs}ms</span>
            </div>
          </div>

          {/* Theme Switcher Toggle (Sun / Moon) */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Lite Mode' : 'Switch to Dark Mode (Charcoal Eye-Comfort)'}
            className="p-1.5 rounded-lg border transition-colors bg-slate-100 dark:bg-[#181f2c] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#263147] hover:bg-slate-200 dark:hover:bg-[#263147]"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* AI Trading Agent Master Switch */}
          <button
            onClick={() => updateAgentConfig({ autoTradingEnabled: !agentConfig.autoTradingEnabled })}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              agentConfig.autoTradingEnabled
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600/60 shadow-sm'
                : 'bg-slate-100 dark:bg-[#181f2c] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#263147] hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {agentConfig.autoTradingEnabled ? (
              <>
                <Pause className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                <span>AGENT: ON</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-slate-500" />
                <span>AGENT: OFF</span>
              </>
            )}
          </button>

          {/* Portfolio Balance Badge */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#181f2c] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#263147] font-mono text-xs">
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-400 dark:text-slate-500">EQUITY</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                ${portfolio.totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div
              className={`text-[10px] px-1 py-0.5 rounded font-medium ${
                portfolio.realizedPnL >= 0
                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                  : 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
              }`}
            >
              {portfolio.realizedPnL >= 0 ? '+' : ''}${portfolio.realizedPnL.toFixed(0)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
