import React, { useState } from 'react';
import { useWeatherMarket } from '../../context/WeatherMarketContext';
import { CORE_CITIES } from '../../services/weatherEngine';
import type { QuantitativeEdge } from '../../types/weatherMarket';
import { OrderBookWidget } from '../widgets/OrderBookWidget';
import { GlassCard } from '../common/GlassCard';
import {
  Wind,
  Droplets,
  Gauge,
  Zap,
  Radio,
  ExternalLink,
  Sparkles,
  Award,
  Sun,
  AlertTriangle
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

  const [selectedBracketIndex, setSelectedBracketIndex] = useState<number>(2);
  const activeBracket = brackets[selectedBracketIndex] || brackets[0];
  const activeEdge = edges.find((e) => e.bracketId === activeBracket?.id) || edges[0];

  const kalshiContract = activeBracket ? kalshiContracts[activeBracket.id] : undefined;
  const polyContract = activeBracket ? polymarketContracts[activeBracket.id] : undefined;

  return (
    <div className="space-y-3.5 pb-20 lg:pb-6 animate-fade-in">
      {/* Daily High Hero & Atmospheric Banner */}
      <GlassCard className="p-3.5 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Station Identity, Running Daily High & Direct Deep-Links */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 dark:text-slate-100 tracking-tight">
                  {cityMeta.name} Daily High Terminal
                </h1>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-[#141a24] text-sky-700 dark:text-sky-300 font-semibold border border-slate-200 dark:border-[#263147]">
                  {cityMeta.stationCode}
                </span>

                {/* Direct External Market Links */}
                <div className="flex items-center gap-1 ml-1">
                  <a
                    href={cityMeta.directLinks.kalshiUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 transition-colors"
                  >
                    <span>Kalshi TMAX</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <a
                    href={cityMeta.directLinks.polymarketUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50 hover:bg-purple-100 transition-colors"
                  >
                    <span>Polymarket</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {cityMeta.stationName} • {cityMeta.nwsClimateOffice} • Market Date: {activePeriod.marketDate}
              </span>
            </div>

            <div className="h-8 w-[1px] bg-slate-200 dark:bg-[#263147] hidden sm:block" />

            {/* Running Daily High & Ambient Thermometer */}
            <div className="flex items-baseline gap-2.5">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-mono text-slate-400 dark:text-slate-500">
                  RUNNING DAILY HIGH
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {forecast ? `${forecast.runningDailyMaxTemp}°` : '--'}
                  </span>
                  <span className="text-sm font-mono text-slate-400">F</span>
                </div>
              </div>

              <div className="flex flex-col text-[10px] font-mono text-slate-500 dark:text-slate-400 pl-2 border-l border-slate-200 dark:border-[#263147]">
                <span className="text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                  Ambient: {forecast ? `${forecast.currentAmbientTemp}°F` : '--'}
                </span>
                <span className="text-sky-600 dark:text-sky-400">
                  Model TMAX: {forecast ? `${forecast.forecastDailyHighTemp}°F` : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Telemetry & Active Strategy Tag */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
            {/* Active Session Phase Card */}
            <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147] flex items-center gap-2">
              {activePeriod.currentPhase === 'PRE_MARKET' && <Sun className="w-4 h-4 text-amber-500" />}
              {activePeriod.currentPhase === 'PEAK_HEATING' && <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 animate-pulse" />}
              {activePeriod.currentPhase === 'LATE_SWEEP' && <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[9px] uppercase">SESSION PHASE</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{activePeriod.phaseLabel}</span>
              </div>
            </div>

            {forecast && (
              <>
                <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147] flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[9px]">SOLAR ZENITH</span>
                    <span className="text-slate-800 dark:text-slate-200">{forecast.peakSolarZenithHour}</span>
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147] flex items-center gap-2">
                  <Wind className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[9px]">WIND</span>
                    <span className="text-slate-800 dark:text-slate-200">{forecast.windSpeedMph} mph</span>
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147] flex items-center gap-2">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[9px]">DEW POINT</span>
                    <span className="text-slate-800 dark:text-slate-200">{forecast.dewPoint}°F ({forecast.relativeHumidity}%)</span>
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147] flex items-center gap-2">
                  <Gauge className="w-3.5 h-3.5 text-amber-500" />
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[9px]">PRESSURE</span>
                    <span className="text-slate-800 dark:text-slate-200">{forecast.barometricPressureInHg} inHg</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Temperature Bracket Tabs with Elimination Indicator */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {brackets.map((bracket, idx) => {
          const edge = edges.find((e) => e.bracketId === bracket.id);
          const isSelected = selectedBracketIndex === idx;
          const isEliminated = bracket.isEliminatedByObservedMax;

          return (
            <button
              key={bracket.id}
              onClick={() => setSelectedBracketIndex(idx)}
              className={`p-2.5 rounded-xl border font-mono text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-sky-50 dark:bg-[#181f2c] border-sky-400 dark:border-sky-500/80 shadow-xs'
                  : 'bg-white dark:bg-[#181f2c] border-slate-200 dark:border-[#263147] hover:border-slate-300 dark:hover:border-[#33415e]'
              } ${isEliminated ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${isSelected ? 'text-sky-700 dark:text-sky-300' : 'text-slate-800 dark:text-slate-200'}`}>
                  {bracket.label}
                </span>

                {isEliminated ? (
                  <span className="text-[8px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1 rounded flex items-center gap-0.5">
                    <AlertTriangle className="w-2.5 h-2.5" /> SURPASSED
                  </span>
                ) : edge?.isArbitrageOpportunity ? (
                  <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1 rounded animate-pulse">
                    ARB
                  </span>
                ) : edge && edge.recommendedSide !== 'NEUTRAL' ? (
                  <span
                    className={`text-[9px] font-bold px-1 rounded ${
                      edge.recommendedSide === 'YES'
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60'
                        : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60'
                    }`}
                  >
                    {edge.recommendedSide} +{(Math.max(edge.edgeYes, edge.edgeNo) * 100).toFixed(0)}%
                  </span>
                ) : null}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Model P:</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">
                  {isEliminated ? '0.0%' : edge ? `${(edge.modelProbability * 100).toFixed(1)}%` : '--'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Dual Order Book & Live Execution Tape Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Dual CLOB Column */}
        <div className="lg:col-span-2 space-y-3.5">
          {/* Quick Odds Comparison Banner */}
          {activeEdge && (
            <GlassCard className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-slate-500 dark:text-slate-400">BEST QUOTE:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    YES ${activeEdge.bestYesAsk.toFixed(2)} ({activeEdge.bestYesPlatform.toUpperCase()})
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    NO ${activeEdge.bestNoAsk.toFixed(2)} ({activeEdge.bestNoPlatform.toUpperCase()})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">MODEL EDGE:</span>
                <span className="text-sky-700 dark:text-sky-300 font-bold">
                  {activeEdge.edgeYes >= 0 ? `YES +${(activeEdge.edgeYes * 100).toFixed(1)}%` : `NO +${(activeEdge.edgeNo * 100).toFixed(1)}%`}
                </span>

                <button
                  onClick={() => onOpenOrderTicket(activeEdge)}
                  className="ml-2 px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white dark:text-slate-950 font-bold font-mono text-xs transition-colors shadow-xs"
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
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-[#263147]">
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase">
                Active Positions ({positions.length})
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {cityMeta.stationCode}
              </span>
            </div>

            {positions.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {positions.map((pos) => {
                  const bracket = brackets.find((b) => b.id === pos.bracketId);
                  return (
                    <div
                      key={pos.positionId}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147] font-mono text-xs flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className={pos.side === 'YES' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                            {pos.shares} {pos.side}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
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
                              pos.unrealizedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
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
                          className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] transition-colors"
                        >
                          CLOSE
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs font-mono text-slate-400 dark:text-slate-500">
                No active positions.
              </div>
            )}
          </GlassCard>

          {/* Real-time Order Flow Tape */}
          <GlassCard className="p-3.5 flex flex-col flex-1">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-[#263147]">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase">
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
                    className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#141a24] transition-colors text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 dark:text-slate-500 text-[10px]">{timeStr}</span>
                      <span
                        className={`font-bold ${isYes ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                      >
                        {trade.side}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
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
