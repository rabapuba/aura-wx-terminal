import React, { useState } from 'react';
import { useWeatherMarket } from '../../context/WeatherMarketContext';
import type { AuditLogSeverity, AuditLog } from '../../types/weatherMarket';
import { GlassCard } from '../common/GlassCard';
import {
  Sliders,
  ShieldAlert,
  Cpu,
  Zap,
  Radio,
  FileText,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Save,
  Server
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

  const [severityFilter, setSeverityFilter] = useState<AuditLogSeverity | 'ALL'>('ALL');
  const [selectedLogPayload, setSelectedLogPayload] = useState<AuditLog | null>(null);

  const handleSaveConfig = () => {
    updateAgentConfig({
      minEvHurdlePct: minEv,
      kellyFractionMultiplier: kellyMult,
      maxPositionSizeDollars: maxPosSize,
      stopLossPct: stopLoss,
      takeProfitPct: takeProfit,
      autoHedgeArbitrage: autoHedge
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
          <span className="text-[10px] text-slate-500 uppercase block">Total Portfolio Value</span>
          <span className="text-base sm:text-lg font-bold text-slate-100">
            ${portfolio.totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">
            Realized: +${portfolio.realizedPnL.toFixed(2)}
          </span>
        </GlassCard>

        <GlassCard className="p-3">
          <span className="text-[10px] text-slate-500 uppercase block">Win Rate</span>
          <span className="text-base sm:text-lg font-bold text-emerald-400">
            {portfolio.winRatePct}%
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {portfolio.totalTradesCount} executed trades
          </span>
        </GlassCard>

        <GlassCard className="p-3">
          <span className="text-[10px] text-slate-500 uppercase block">Sharpe Ratio</span>
          <span className="text-base sm:text-lg font-bold text-cyan-300">
            {portfolio.sharpeRatio}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Institutional Tier</span>
        </GlassCard>

        <GlassCard className="p-3">
          <span className="text-[10px] text-slate-500 uppercase block">Max Drawdown</span>
          <span className="text-base sm:text-lg font-bold text-amber-400">
            {portfolio.maxDrawdownPct}%
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Risk Limit: 20%</span>
        </GlassCard>
      </div>

      {/* Grid: Execution Config & API Connectivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trading Parameters Form */}
        <GlassCard className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="font-mono text-xs sm:text-sm font-bold text-slate-200 uppercase">
                  AI Execution &amp; Risk Parameters
                </h3>
              </div>
              <button
                onClick={() => updateAgentConfig({ autoTradingEnabled: !agentConfig.autoTradingEnabled })}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                  agentConfig.autoTradingEnabled
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {agentConfig.autoTradingEnabled ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>AUTONOMOUS ON</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-slate-400" />
                    <span>AUTONOMOUS OFF</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* Min EV Hurdle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400">Minimum Expected Value Hurdle</span>
                  <span className="text-cyan-300 font-bold">{minEv}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="0.5"
                  value={minEv}
                  onChange={(e) => setMinEv(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* Kelly Fraction Multiplier */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400">Kelly Sizing Multiplier</span>
                  <span className="text-amber-300 font-bold">{kellyMult}x ({kellyMult === 0.25 ? 'Quarter-Kelly' : kellyMult === 0.5 ? 'Half-Kelly' : 'Custom'})</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  {[0.1, 0.25, 0.5, 1.0].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setKellyMult(val)}
                      className={`py-1 rounded border text-center text-xs transition-colors ${
                        kellyMult === val
                          ? 'bg-amber-950/60 text-amber-300 border-amber-600/70 font-bold'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {val}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Position Size */}
              <div>
                <label className="block text-slate-400 mb-1">Max Position Size ($ USD)</label>
                <input
                  type="number"
                  step="500"
                  min="500"
                  max="20000"
                  value={maxPosSize}
                  onChange={(e) => setMaxPosSize(parseInt(e.target.value) || 1000)}
                  className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-100 font-bold focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Risk Controls: Stop-Loss & Take-Profit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Stop Loss (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="80"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-100 font-bold focus:border-rose-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Take Profit (%)</label>
                  <input
                    type="number"
                    min="20"
                    max="200"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(parseInt(e.target.value) || 75)}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-100 font-bold focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Arbitrage Toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="flex flex-col">
                  <span className="text-slate-200 font-semibold">Auto-Hedge Arbitrage</span>
                  <span className="text-[10px] text-slate-500">
                    Instantly capture Kalshi/Polymarket mispricings &lt; $0.985
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoHedge}
                  onChange={(e) => setAutoHedge(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveConfig}
            className="mt-4 w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
          >
            <Save className="w-4 h-4" />
            <span>SAVE EXECUTION PARAMETERS</span>
          </button>
        </GlassCard>

        {/* API & Connectivity Telemetry */}
        <GlassCard className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <h3 className="font-mono text-xs sm:text-sm font-bold text-slate-200 uppercase">
                  Exchange APIs &amp; Data Pipeline Status
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                ALL SYSTEMS CONNECTED
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {/* Kalshi Connectivity */}
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200 font-bold">Kalshi CLOB API</span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-950/80 px-1 rounded border border-emerald-800/50">
                      REST / WS
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Endpoint: api.elections.kalshi.com • Auth: Active
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-bold">{systemHealth.kalshiLatencyMs}ms</span>
                  <span className="block text-[9px] text-slate-500">Latency</span>
                </div>
              </div>

              {/* Polymarket Connectivity */}
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200 font-bold">Polymarket CLOB &amp; Relayer</span>
                    <span className="text-[9px] text-purple-400 bg-purple-950/80 px-1 rounded border border-purple-800/50">
                      ERC-1155
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Endpoint: clob.polymarket.com • Polygon Gas: 28 Gwei
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-bold">{systemHealth.polymarketLatencyMs}ms</span>
                  <span className="block text-[9px] text-slate-500">Latency</span>
                </div>
              </div>

              {/* Google WeatherNext 3 Data Framework */}
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200 font-bold">Google WeatherNext 3 Framework</span>
                    <span className="text-[9px] text-cyan-400 bg-cyan-950/80 px-1 rounded border border-cyan-800/50">
                      GRAPHCAST AI
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    5-Member Ensembles • Spatial Res: 3km • Update: Hourly
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-cyan-400 font-bold">{systemHealth.weatherNextLatencyMs}ms</span>
                  <span className="block text-[9px] text-slate-500">Sync Ping</span>
                </div>
              </div>

              {/* NOAA ASOS Station Stream */}
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200 font-bold">ASOS / NWS METAR Fallback</span>
                    <span className="text-[9px] text-slate-300 bg-slate-800 px-1 rounded">
                      FAA SENSORS
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Stations: KORD, KNYC, KLAX, KMIA, KAUS
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-300 font-bold">100%</span>
                  <span className="block text-[9px] text-slate-500">Uptime</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Active WebSockets: <strong className="text-slate-200">{systemHealth.activeWebsockets}</strong></span>
            <span>Process CPU: <strong className="text-emerald-400">{systemHealth.cpuLoadPct}%</strong></span>
            <span>Allocated Mem: <strong className="text-slate-200">{systemHealth.memoryUsageMb} MB</strong></span>
          </div>
        </GlassCard>
      </div>

      {/* System Telemetry & Audit Logs Stream */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h3 className="font-mono text-xs sm:text-sm font-bold text-slate-200 uppercase">
              System Telemetry &amp; Execution Audit Trail
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {auditLogs.length} EVENTS
            </span>
          </div>

          {/* Severity Filter Pills */}
          <div className="flex items-center gap-1 text-[11px] font-mono">
            {(['ALL', 'SIGNAL', 'ORDER', 'ROLLOVER', 'INFO', 'ALERT'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  severityFilter === sev
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-1.5 font-mono text-xs max-h-80 overflow-y-auto pr-1">
          {filteredLogs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            const sevStyles = {
              SIGNAL: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/50',
              ORDER: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50',
              FILL: 'text-emerald-300 bg-emerald-950/70 border-emerald-700/60',
              ROLLOVER: 'text-amber-400 bg-amber-950/60 border-amber-800/50',
              ALERT: 'text-rose-400 bg-rose-950/60 border-rose-800/50',
              ERROR: 'text-rose-500 bg-rose-950/80 border-rose-700',
              INFO: 'text-slate-400 bg-slate-900 border-slate-800'
            };

            return (
              <div
                key={log.id}
                onClick={() => setSelectedLogPayload(log.dataPayload ? log : null)}
                className={`p-2 rounded border transition-colors flex items-start justify-between gap-3 ${
                  log.dataPayload ? 'cursor-pointer hover:bg-slate-800/40' : ''
                } ${
                  log.severity === 'ROLLOVER'
                    ? 'bg-amber-950/20 border-amber-900/40'
                    : 'bg-slate-950/60 border-slate-800/60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">{timeStr}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                      sevStyles[log.severity]
                    }`}
                  >
                    {log.severity}
                  </span>
                  <span className="text-slate-300 leading-snug">{log.message}</span>
                </div>

                {log.dataPayload && (
                  <span className="text-[9px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40 shrink-0">
                    JSON
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* JSON Payload Inspector Modal */}
        {selectedLogPayload && (
          <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-cyan-400 font-bold">Log Payload Inspector ({selectedLogPayload.id})</span>
              <button
                onClick={() => setSelectedLogPayload(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>
            <pre className="text-slate-300 overflow-x-auto text-[11px] p-2 bg-slate-900/80 rounded border border-slate-800">
              {JSON.stringify(selectedLogPayload.dataPayload, null, 2)}
            </pre>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
