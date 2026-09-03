import React, { useState } from 'react';
import { useWeatherMarket } from '../../context/WeatherMarketContext';
import type { AuditLogSeverity, AuditLog } from '../../types/weatherMarket';
import { GlassCard } from '../common/GlassCard';
import {
  Sliders,
  Play,
  Pause,
  Save,
  Server,
  FileText,
  Sparkles,
  Award
} from 'lucide-react';

export const AgentConfigLogsView: React.FC = () => {
  const {
    agentConfig,
    updateAgentConfig,
    systemHealth,
    auditLogs,
    portfolio
  } = useWeatherMarket();

  const [minEv, setMinEv] = useState<number>(agentConfig.minEvHurdlePct);
  const [kellyMult, setKellyMult] = useState<number>(agentConfig.kellyFractionMultiplier);
  const [maxPosSize, setMaxPosSize] = useState<number>(agentConfig.maxPositionSizeDollars);
  const [stopLoss, setStopLoss] = useState<number>(agentConfig.stopLossPct);
  const [takeProfit, setTakeProfit] = useState<number>(agentConfig.takeProfitPct);
  const [autoHedge, setAutoHedge] = useState<boolean>(agentConfig.autoHedgeArbitrage);

  // Dual-Phase Strategy Parameters
  const [enableEarlyAlpha, setEnableEarlyAlpha] = useState<boolean>(agentConfig.enableEarlyAlpha);
  const [enableLateSweep, setEnableLateSweep] = useState<boolean>(agentConfig.enableLateSweep);
  const [earlyAlphaPrice, setEarlyAlphaPrice] = useState<number>(agentConfig.earlyAlphaMaxPrice);
  const [lateSweepProb, setLateSweepProb] = useState<number>(agentConfig.lateSweepMinProbPct);

  const [severityFilter, setSeverityFilter] = useState<AuditLogSeverity | 'ALL'>('ALL');
  const [selectedLogPayload, setSelectedLogPayload] = useState<AuditLog | null>(null);

  const handleSaveConfig = () => {
    updateAgentConfig({
      minEvHurdlePct: minEv,
      kellyFractionMultiplier: kellyMult,
      maxPositionSizeDollars: maxPosSize,
      stopLossPct: stopLoss,
      takeProfitPct: takeProfit,
      autoHedgeArbitrage: autoHedge,
      enableEarlyAlpha,
      enableLateSweep,
      earlyAlphaMaxPrice: earlyAlphaPrice,
      lateSweepMinProbPct: lateSweepProb
    });
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (severityFilter !== 'ALL' && log.severity !== severityFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-20 lg:pb-6 animate-fade-in">
      {/* Performance Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <GlassCard className="p-3">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">Total Portfolio Value</span>
          <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            ${portfolio.totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
            Realized: +${portfolio.realizedPnL.toFixed(2)}
          </span>
        </GlassCard>

        <GlassCard className="p-3">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">Win Rate</span>
          <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {portfolio.winRatePct}%
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            {portfolio.totalTradesCount} executed trades
          </span>
        </GlassCard>

        <GlassCard className="p-3">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">Sharpe Ratio</span>
          <span className="text-base sm:text-lg font-bold text-sky-700 dark:text-sky-300">
            {portfolio.sharpeRatio}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Institutional Benchmark</span>
        </GlassCard>

        <GlassCard className="p-3">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">Max Drawdown</span>
          <span className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">
            {portfolio.maxDrawdownPct}%
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Risk Cap: 20%</span>
        </GlassCard>
      </div>

      {/* Grid: Execution Config & API Connectivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trading Parameters Form */}
        <GlassCard className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-[#263147]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="font-mono text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase">
                  AI Execution &amp; Hybrid Strategy
                </h3>
              </div>
              <button
                onClick={() => updateAgentConfig({ autoTradingEnabled: !agentConfig.autoTradingEnabled })}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                  agentConfig.autoTradingEnabled
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 shadow-xs'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                }`}
              >
                {agentConfig.autoTradingEnabled ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                    <span>AUTONOMOUS ON</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-slate-500" />
                    <span>AUTONOMOUS OFF</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* Min EV Hurdle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Minimum Expected Value (EV) Hurdle</span>
                  <span className="text-sky-700 dark:text-sky-300 font-bold">{minEv}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="0.5"
                  value={minEv}
                  onChange={(e) => setMinEv(parseFloat(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              {/* Dual-Phase Strategy Controls */}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147] space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Dual-Phase Execution Triggers
                </span>

                {/* Early-Session Alpha */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                    <span className="text-slate-800 dark:text-slate-200">Pre-Market Solar Ramp (00:00 - 11:00)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableEarlyAlpha}
                    onChange={(e) => setEnableEarlyAlpha(e.target.checked)}
                    className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between pl-5 text-[11px] text-slate-500">
                  <span>Max Contract Price Target:</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0.10"
                    max="0.50"
                    value={earlyAlphaPrice}
                    onChange={(e) => setEarlyAlphaPrice(parseFloat(e.target.value) || 0.35)}
                    className="w-16 px-1.5 py-0.5 rounded bg-white dark:bg-[#0f141c] border border-slate-300 dark:border-[#263147] text-slate-800 dark:text-slate-200 font-bold text-right"
                  />
                </div>

                {/* Late-Session High-Prob Sweep */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-[#263147]/60">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-slate-800 dark:text-slate-200">Peak Heating &amp; Late Sweep (11:00 - 23:00)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableLateSweep}
                    onChange={(e) => setEnableLateSweep(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between pl-5 text-[11px] text-slate-500">
                  <span>Min Model Probability:</span>
                  <input
                    type="number"
                    min="65"
                    max="95"
                    value={lateSweepProb}
                    onChange={(e) => setLateSweepProb(parseInt(e.target.value) || 78)}
                    className="w-16 px-1.5 py-0.5 rounded bg-white dark:bg-[#0f141c] border border-slate-300 dark:border-[#263147] text-slate-800 dark:text-slate-200 font-bold text-right"
                  />
                </div>
              </div>

              {/* Kelly Multiplier */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Kelly Sizing Multiplier</span>
                  <span className="text-amber-700 dark:text-amber-300 font-bold">{kellyMult}x</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  {[0.1, 0.25, 0.5, 1.0].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setKellyMult(val)}
                      className={`py-1 rounded border text-center text-xs transition-colors ${
                        kellyMult === val
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-600/70 font-bold'
                          : 'bg-slate-50 dark:bg-[#141a24] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#263147]'
                      }`}
                    >
                      {val}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Position Size */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Max Position Size ($ USD)</label>
                <input
                  type="number"
                  step="500"
                  min="500"
                  max="20000"
                  value={maxPosSize}
                  onChange={(e) => setMaxPosSize(parseInt(e.target.value) || 1000)}
                  className="w-full px-3 py-1.5 rounded bg-white dark:bg-[#0f141c] border border-slate-300 dark:border-[#263147] text-slate-900 dark:text-slate-100 font-bold focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* Arbitrage Toggle */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147]">
                <div className="flex flex-col">
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">Auto-Hedge Arbitrage</span>
                  <span className="text-[10px] text-slate-500">
                    Instantly capture Kalshi/Polymarket mispricings &lt; $0.985
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoHedge}
                  onChange={(e) => setAutoHedge(e.target.checked)}
                  className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveConfig}
            className="mt-4 w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white dark:text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>SAVE HYBRID STRATEGY PARAMETERS</span>
          </button>
        </GlassCard>

        {/* API & Connectivity Telemetry */}
        <GlassCard className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-[#263147]">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="font-mono text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase">
                  Exchange APIs &amp; Data Pipeline Status
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                ALL SYSTEMS CONNECTED
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-800 dark:text-slate-200 font-bold">Kalshi CLOB API</span>
                    <span className="text-[9px] text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-1 rounded border border-emerald-300 dark:border-emerald-800/50">
                      REST / WS
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Endpoint: api.elections.kalshi.com • Auth: Active
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{systemHealth.kalshiLatencyMs}ms</span>
                  <span className="block text-[9px] text-slate-400">Latency</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-800 dark:text-slate-200 font-bold">Polymarket CLOB &amp; Relayer</span>
                    <span className="text-[9px] text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/80 px-1 rounded border border-purple-300 dark:border-purple-800/50">
                      ERC-1155
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Endpoint: clob.polymarket.com • Polygon Gas: 28 Gwei
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{systemHealth.polymarketLatencyMs}ms</span>
                  <span className="block text-[9px] text-slate-400">Latency</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-800 dark:text-slate-200 font-bold">Google WeatherNext 3 Framework</span>
                    <span className="text-[9px] text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/80 px-1 rounded border border-sky-300 dark:border-sky-800/50">
                      GRAPHCAST AI
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    5-Member Ensembles • Spatial Res: 3km • Update: Hourly
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sky-600 dark:text-sky-400 font-bold">{systemHealth.weatherNextLatencyMs}ms</span>
                  <span className="block text-[9px] text-slate-400">Sync Ping</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded bg-slate-100 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147] text-[11px] font-mono text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>Active WebSockets: <strong className="text-slate-800 dark:text-slate-200">{systemHealth.activeWebsockets}</strong></span>
            <span>Process CPU: <strong className="text-emerald-600 dark:text-emerald-400">{systemHealth.cpuLoadPct}%</strong></span>
            <span>Memory: <strong className="text-slate-800 dark:text-slate-200">{systemHealth.memoryUsageMb} MB</strong></span>
          </div>
        </GlassCard>
      </div>

      {/* System Telemetry & Audit Logs Stream */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 mb-3 border-b border-slate-200 dark:border-[#263147]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h3 className="font-mono text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase">
              System Telemetry &amp; Execution Audit Trail
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {auditLogs.length} EVENTS
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono">
            {(['ALL', 'SIGNAL', 'ORDER', 'ROLLOVER', 'INFO', 'ALERT'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  severityFilter === sev
                    ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800/80 font-bold'
                    : 'bg-slate-100 dark:bg-[#141a24] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#263147]'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 font-mono text-xs max-h-80 overflow-y-auto pr-1">
          {filteredLogs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            const sevStyles = {
              SIGNAL: 'text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800/50',
              ORDER: 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800/50',
              FILL: 'text-emerald-800 dark:text-emerald-300 bg-emerald-200 dark:bg-emerald-950/70 border-emerald-400 dark:border-emerald-700/60',
              ROLLOVER: 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800/50',
              ALERT: 'text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800/50',
              ERROR: 'text-rose-800 dark:text-rose-500 bg-rose-200 dark:bg-rose-950/80 border-rose-400 dark:border-rose-700',
              INFO: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#141a24] border-slate-200 dark:border-[#263147]'
            };

            return (
              <div
                key={log.id}
                onClick={() => setSelectedLogPayload(log.dataPayload ? log : null)}
                className={`p-2 rounded border transition-colors flex items-start justify-between gap-3 ${
                  log.dataPayload ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-[#141a24]/80' : ''
                } ${
                  log.severity === 'ROLLOVER'
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                    : 'bg-white dark:bg-[#141a24] border-slate-200 dark:border-[#263147]/60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 mt-0.5">{timeStr}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                      sevStyles[log.severity]
                    }`}
                  >
                    {log.severity}
                  </span>
                  <span className="text-slate-800 dark:text-slate-300 leading-snug">{log.message}</span>
                </div>

                {log.dataPayload && (
                  <span className="text-[9px] text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-300 dark:border-sky-800/40 shrink-0">
                    JSON
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {selectedLogPayload && (
          <div className="mt-3 p-3 rounded-lg bg-white dark:bg-[#0f141c] border border-slate-300 dark:border-[#263147] font-mono text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sky-600 dark:text-sky-400 font-bold">Log Payload Inspector ({selectedLogPayload.id})</span>
              <button
                onClick={() => setSelectedLogPayload(null)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Close
              </button>
            </div>
            <pre className="text-slate-800 dark:text-slate-300 overflow-x-auto text-[11px] p-2 bg-slate-50 dark:bg-[#141a24] rounded border border-slate-200 dark:border-[#263147]">
              {JSON.stringify(selectedLogPayload.dataPayload, null, 2)}
            </pre>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
