import React, { useState } from 'react';
import { useWeatherMarket } from '../../context/WeatherMarketContext';
import { CORE_CITIES } from '../../services/weatherEngine';
import type { MarketPlatform, ContractSide, QuantitativeEdge } from '../../types/weatherMarket';
import { OrderBookWidget } from '../widgets/OrderBookWidget';
import { GlassCard } from '../common/GlassCard';
import {
  Thermometer,
  Wind,
  Droplets,
  Gauge,
  Zap,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Radio,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface LiveCommandViewProps {
  onOpenOrderTicket: (edge: QuantitativeEdge) => void;
}

export const LiveCommandView: React.FC<LiveCommandViewProps> = ({ onOpenOrderTicket }) => {
  const {
    selectedCityId,
    forecastsByCity,
    bracketsByCity,
    kalshiContracts,
    polymarketContracts,
    cityEdges,
    positions,
    closePosition,
    tradeTape,
    activePeriod
  } = useWeatherMarket();

  const cityMeta = CORE_CITIES[selectedCityId];
  const forecast = forecastsByCity[selectedCityId];
  const brackets = bracketsByCity[selectedCityId] || [];
  const edges = cityEdges[selectedCityId] || [];

  const [selectedBracketIndex, setSelectedBracketIndex] = useState<number>(2); // Default to middle strike bracket
  const activeBracket = brackets[selectedBracketIndex] || brackets[0];
  const activeEdge = edges.find((e) => e.bracketId === activeBracket?.id) || edges[0];

  const kalshiContract = activeBracket ? kalshiContracts[activeBracket.id] : undefined;
  const polyContract = activeBracket ? polymarketContracts[activeBracket.id] : undefined;

  return (
    <div className="space-y-3.5 pb-20 lg:pb-6 animate-fade-in">
      {/* City Hero & Atmospheric Banner */}
      <GlassCard className="p-3.5 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Station Identity & Live Temperature */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-sans text-slate-100 tracking-tight">
                  {cityMeta.name} Weather Terminal
                </h1>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-semibold border border-slate-700">
                  {cityMeta.stationCode}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono mt-0.5">
                {cityMeta.stationName} • {cityMeta.timezone} • Elev {cityMeta.elevationFt}ft
              </span>
            </div>

            <div className="h-8 w-[1px] bg-slate-800 hidden sm:block" />

            {/* Current Sensor Reading */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold font-mono text-slate-100 tabular-nums">
                {forecast ? `${forecast.currentTemp}°` : '--'}
              </span>
              <span className="text-sm font-mono text-slate-400">F</span>
              <div className="flex flex-col text-[10px] font-mono text-slate-400 leading-tight">
                <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                  <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE ASOS
                </span>
                <span>Target: {new Date(activePeriod.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* Right: Real-time Weather Telemetry Indicators */}
          {forecast && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
              <div className="px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                <div>
                  <span className="text-slate-500 block text-[9px]">WIND</span>
                  <span className="text-slate-200">{forecast.windSpeedMph} mph</span>
                </div>
              </div>

              <div className="px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                <div>
                  <span className="text-slate-500 block text-[9px]">DEW POINT</span>
                  <span className="text-slate-200">{forecast.dewPoint}°F ({forecast.relativeHumidity}%)</span>
                </div>
              </div>

              <div className="px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <div>
                  <span className="text-slate-500 block text-[9px]">PRESSURE</span>
                  <span className="text-slate-200">{forecast.barometricPressureInHg} inHg</span>
                </div>
              </div>

              <div className="px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <div>
                  <span className="text-slate-500 block text-[9px]">WX3 CONF</span>
                  <span className="text-emerald-400 font-bold">{forecast.confidenceScore}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Temperature Bracket Strips (Tabs) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {brackets.map((bracket, idx) => {
          const edge = edges.find((e) => e.bracketId === bracket.id);
          const isSelected = selectedBracketIndex === idx;

          return (
            <button
              key={bracket.id}
              onClick={() => setSelectedBracketIndex(idx)}
              className={`p-2.5 rounded-xl border font-mono text-left transition-all ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                  {bracket.label}
                </span>
                {edge?.isArbitrageOpportunity ? (
                  <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 px-1 rounded animate-pulse">
                    ARB
                  </span>
                ) : edge && edge.recommendedSide !== 'NEUTRAL' ? (
                  <span
                    className={`text-[9px] font-bold px-1 rounded ${
                      edge.recommendedSide === 'YES'
                        ? 'text-emerald-400 bg-emerald-950/60'
                        : 'text-rose-400 bg-rose-950/60'
                    }`}
                  >
                    {edge.recommendedSide} +{(Math.max(edge.edgeYes, edge.edgeNo) * 100).toFixed(0)}%
                  </span>
                ) : null}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Model P:</span>
                <span className="text-slate-200 font-semibold">
                  {edge ? `${(edge.modelProbability * 100).toFixed(1)}%` : '--'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Dual Order Book & Live Execution Tape Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Dual CLOB Order Book Column (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-3.5">
          {/* Quick Odds Comparison Banner */}
          {activeEdge && (
            <GlassCard className="p-3 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">BEST QUOTE:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">
                    YES ${activeEdge.bestYesAsk.toFixed(2)} ({activeEdge.bestYesPlatform.toUpperCase()})
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-rose-400 font-bold">
                    NO ${activeEdge.bestNoAsk.toFixed(2)} ({activeEdge.bestNoPlatform.toUpperCase()})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">MODEL EDGE:</span>
                <span className="text-cyan-300 font-bold">
                  {activeEdge.edgeYes >= 0 ? `YES +${(activeEdge.edgeYes * 100).toFixed(1)}%` : `NO +${(activeEdge.edgeNo * 100).toFixed(1)}%`}
                </span>

                <button
                  onClick={() => onOpenOrderTicket(activeEdge)}
                  className="ml-2 px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition-colors shadow"
                >
                  STAGE ORDER
                </button>
              </div>
            </GlassCard>
          )}

          <OrderBookWidget
            kalshiContract={kalshiContract}
            polyContract={polyContract}
            onSelectPrice={(_platform, _side, _price) => {
              if (activeEdge) onOpenOrderTicket(activeEdge);
            }}
          />
        </div>

        {/* Right Column: Live Trades Tape & Active Portfolio Positions */}
        <div className="space-y-3.5">
          {/* Active Positions */}
          <GlassCard className="p-3.5 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                Active Positions ({positions.length})
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {cityMeta.stationCode} Focused
              </span>
            </div>

            {positions.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {positions.map((pos) => {
                  const bracket = brackets.find((b) => b.id === pos.bracketId);
                  return (
                    <div
                      key={pos.positionId}
                      className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 font-mono text-xs flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className={pos.side === 'YES' ? 'text-emerald-400' : 'text-rose-400'}>
                            {pos.shares} {pos.side}
                          </span>
                          <span className="text-slate-300">
                            {bracket?.label || pos.bracketId}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Avg: ${pos.averageEntryPrice.toFixed(2)} • Cost: ${pos.costBasis.toFixed(0)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span
                            className={`font-bold block ${
                              pos.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {pos.unrealizedPnL >= 0 ? '+' : ''}${pos.unrealizedPnL.toFixed(2)}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {pos.unrealizedRoiPct >= 0 ? '+' : ''}{pos.unrealizedRoiPct}%
                          </span>
                        </div>

                        <button
                          onClick={() => closePosition(pos.positionId)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
                        >
                          CLOSE
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs font-mono text-slate-500">
                No active positions. Stage an order or turn on AI Agent.
              </div>
            )}
          </GlassCard>

          {/* Real-time Order Flow Tape */}
          <GlassCard className="p-3.5 flex flex-col flex-1">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                  Live CLOB Trade Tape
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">KALSHI &amp; POLY</span>
            </div>

            <div className="space-y-1 font-mono text-xs max-h-72 overflow-y-auto pr-1">
              {tradeTape.slice(0, 15).map((trade) => {
                const isYes = trade.side === 'YES';
                const timeStr = new Date(trade.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                });

                return (
                  <div
                    key={trade.orderId}
                    className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-800/30 transition-colors text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[10px]">{timeStr}</span>
                      <span
                        className={`font-bold ${isYes ? 'text-emerald-400' : 'text-rose-400'}`}
                      >
                        {trade.side}
                      </span>
                      <span className="text-slate-300 font-medium">
                        {trade.shares.toLocaleString()} @ ${trade.price.toFixed(2)}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-500 uppercase">
                      {trade.platform.slice(0, 4)}
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
