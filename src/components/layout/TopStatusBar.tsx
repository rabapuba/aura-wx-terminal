import React from 'react';
import { useWeatherMarket } from '../../context/WeatherMarketContext';
import { useCountdown } from '../../hooks/useCountdown';
import {
  Clock,
  Activity,
  Zap,
  Play,
  Pause,
  RefreshCw,
  Cpu,
  TrendingUp,
  ShieldCheck
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

  const { formatted, isUrgent, isCritical, progressPct } = useCountdown(
    activePeriod.endTime,
    activePeriod.startTime,
    speedMultiplier,
    () => {
      forcePeriodRoll();
    }
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2.5 max-w-[1920px] mx-auto">
        {/* Left: Branding & Period Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-slate-100 uppercase">
              AURA<span className="text-cyan-400">-WX</span>
            </span>
            <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/50 rounded">
              v3.4 PRO
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

          {/* Period ID Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-500">PERIOD:</span>
            <span className="text-slate-200 font-semibold">{activePeriod.periodId}</span>
            {activePeriod.isPreMarket ? (
              <span className="ml-1 text-[10px] font-semibold text-amber-400 bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-800/40 animate-pulse">
                PRE-OPEN
              </span>
            ) : (
              <span className="ml-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-800/40">
                CLOB ACTIVE
              </span>
            )}
          </div>
        </div>

        {/* Center: Global Live Hourly Countdown Timer */}
        <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 shadow-inner">
          <div className="flex items-center gap-2">
            <Clock
              className={`w-4 h-4 ${
                isCritical
                  ? 'text-rose-400 animate-bounce'
                  : isUrgent
                  ? 'text-amber-400 animate-pulse'
                  : 'text-cyan-400'
              }`}
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                  HOURLY ROLLOVER
                </span>
                <span className="text-[10px] text-slate-500 font-mono">({progressPct}%)</span>
              </div>
              <span
                className={`font-mono font-bold text-sm sm:text-base tabular-nums tracking-widest ${
                  isCritical
                    ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                    : isUrgent
                    ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                    : 'text-emerald-400'
                }`}
              >
                {formatted}
              </span>
            </div>
          </div>

          {/* Speed Multiplier & Force Roll Button */}
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-800">
            <button
              onClick={() => setSpeedMultiplier(speedMultiplier === 1 ? 10 : speedMultiplier === 10 ? 60 : 1)}
              title="Toggle simulated clock speed"
              className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${
                speedMultiplier > 1
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {speedMultiplier}x
            </button>
            <button
              onClick={forcePeriodRoll}
              disabled={isIngestingForecasts}
              title="Force Immediate Period Rollover"
              className="p-1 rounded bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-cyan-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isIngestingForecasts ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Right: Telemetry, AI Agent Switch & Portfolio */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Latency Telemetry */}
          <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded border border-slate-800/60">
            <div className="flex items-center gap-1" title="Kalshi API Latency">
              <span className="text-slate-500">KX:</span>
              <span className="text-emerald-400">{systemHealth.kalshiLatencyMs}ms</span>
            </div>
            <div className="flex items-center gap-1" title="Polymarket CLOB Latency">
              <span className="text-slate-500">POLY:</span>
              <span className="text-emerald-400">{systemHealth.polymarketLatencyMs}ms</span>
            </div>
            <div className="flex items-center gap-1" title="Google WeatherNext 3 Latency">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span className="text-cyan-400">{systemHealth.weatherNextLatencyMs}ms</span>
            </div>
          </div>

          {/* AI Trading Agent Master Switch */}
          <button
            onClick={() => updateAgentConfig({ autoTradingEnabled: !agentConfig.autoTradingEnabled })}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              agentConfig.autoTradingEnabled
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {agentConfig.autoTradingEnabled ? (
              <>
                <Pause className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>AGENT: ON</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-slate-400" />
                <span>AGENT: OFF</span>
              </>
            )}
          </button>

          {/* Portfolio Balance Badge */}
          <div className="flex items-center gap-2 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-xs">
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-500">EQUITY</span>
              <span className="font-bold text-slate-100 tabular-nums">
                ${portfolio.totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div
              className={`text-[10px] px-1 py-0.5 rounded font-medium ${
                portfolio.realizedPnL >= 0
                  ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40'
                  : 'bg-rose-950/50 text-rose-400 border border-rose-800/40'
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
