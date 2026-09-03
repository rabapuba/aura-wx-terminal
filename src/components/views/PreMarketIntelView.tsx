import React, { useState } from 'react';
import { useWeatherMarket } from '../../context/WeatherMarketContext';
import { CORE_CITIES } from '../../services/weatherEngine';
import type { CityId, QuantitativeEdge } from '../../types/weatherMarket';
import { EdgeMatrixTable } from '../widgets/EdgeMatrixTable';
import { GlassCard } from '../common/GlassCard';
import {
  Sparkles,
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';

interface PreMarketIntelViewProps {
  onStageTrade: (edge: QuantitativeEdge) => void;
}

export const PreMarketIntelView: React.FC<PreMarketIntelViewProps> = ({ onStageTrade }) => {
  const {
    allEdges,
    activePeriod,
    refreshForecasts,
    isIngestingForecasts,
    agentConfig,
    executeTrade
  } = useWeatherMarket();

  const [selectedCityFilter, setSelectedCityFilter] = useState<CityId | 'ALL'>('ALL');
  const [showMathExplainer, setShowMathExplainer] = useState<boolean>(false);

  // Top 3 highest statistical asymmetry opportunities
  const topAsymmetryEdges = allEdges.slice(0, 3);

  // Batch execute all positive EV opportunities
  const handleBatchExecuteAll = () => {
    const positiveEdges = allEdges.filter((e) => e.evYes > 0.05 || e.evNo > 0.05 || e.isArbitrageOpportunity);
    positiveEdges.forEach((edge) => {
      const side = edge.recommendedSide !== 'NEUTRAL' ? edge.recommendedSide : 'YES';
      const platform = side === 'YES' ? edge.bestYesPlatform : edge.bestNoPlatform;
      const price = side === 'YES' ? edge.bestYesAsk : edge.bestNoAsk;
      const dollars = Math.min(edge.recommendedSizeDollars, agentConfig.maxPositionSizeDollars);
      const shares = Math.floor(dollars / price);
      if (shares >= 25) {
        executeTrade(edge.bracketId, edge.cityId, platform, side, shares, price);
      }
    });
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-6 animate-fade-in">
      {/* Pre-Market Intel Status Banner */}
      <GlassCard className="p-4 sm:p-5 border-cyan-700/60 shadow-[0_0_25px_rgba(6,182,212,0.12)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/80">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold font-sans text-slate-100 uppercase tracking-wide">
                  Pre-Market Quantitative Intelligence Engine
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
                  ACTIVE ANALYSIS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Google WeatherNext 3 ensemble physics ingestion across Chicago, NYC, LA, Miami &amp; Austin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={refreshForecasts}
              disabled={isIngestingForecasts}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isIngestingForecasts ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isIngestingForecasts ? 'Ingesting WX3...' : 'Re-Run Ensemble'}</span>
            </button>

            <button
              onClick={handleBatchExecuteAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>BATCH STAGE POSITIVE EV</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Top 3 Highest Statistical Asymmetry Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {topAsymmetryEdges.map((edge, index) => {
          const meta = CORE_CITIES[edge.cityId];
          const isYes = edge.recommendedSide === 'YES';
          const maxEv = Math.max(edge.evYes, edge.evNo);

          return (
            <GlassCard
              key={`${edge.cityId}-${edge.bracketId}`}
              glow={edge.isArbitrageOpportunity ? 'amber' : isYes ? 'green' : 'red'}
              className="p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 font-bold text-slate-200">
                      RANK #{index + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-100 font-sans">{meta.name}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">EDGE SCORE</span>
                    <span className="font-mono text-sm font-bold text-cyan-400">
                      {edge.isArbitrageOpportunity ? 'ARB 99' : edge.statisticalAsymmetryScore}
                    </span>
                  </div>
                </div>

                <div className="text-base font-bold font-mono text-slate-100 mb-2">
                  {edge.bracketLabel}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3 bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[10px]">WX3 PROB</span>
                    <span className="text-cyan-300 font-bold">{(edge.modelProbability * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">MARKET PRICE</span>
                    <span className="text-slate-200 font-bold">
                      ${(isYes ? edge.bestYesAsk : edge.bestNoAsk).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">EXPECTED VALUE</span>
                    <span className={`font-bold ${maxEv >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      +{((maxEv) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">KELLY SIZING</span>
                    <span className="text-amber-300 font-bold">
                      ${edge.recommendedSizeDollars.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onStageTrade(edge)}
                className={`w-full py-2 rounded-lg font-mono font-bold text-xs transition-all ${
                  isYes
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-rose-600 hover:bg-rose-500 text-slate-950 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                }`}
              >
                EXECUTE {edge.recommendedSide} ({meta.stationCode})
              </button>
            </GlassCard>
          );
        })}
      </div>

      {/* Main Pre-Market Edge Matrix Table */}
      <EdgeMatrixTable
        edges={allEdges}
        onStageTrade={onStageTrade}
        selectedCityFilter={selectedCityFilter}
        onSelectCityFilter={setSelectedCityFilter}
      />

      {/* Institutional Quantitative Methodology Collapsible Explainer */}
      <GlassCard className="p-3.5 sm:p-4">
        <button
          onClick={() => setShowMathExplainer(!showMathExplainer)}
          className="w-full flex items-center justify-between text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-200 uppercase">
              Quantitative Options Pricing &amp; Statistical Asymmetry Methodology
            </span>
          </div>
          {showMathExplainer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showMathExplainer && (
          <div className="mt-3 pt-3 border-t border-slate-800 font-mono text-xs text-slate-400 space-y-2 leading-relaxed">
            <p>
              <strong className="text-slate-200">1. Cumulative Distribution Function:</strong> Temperature probabilities are computed across continuous bracket thresholds [T_min, T_max] utilizing the Skew-Normal Gaussian formulation:
              <br />
              <code className="text-cyan-300">P(T_min ≤ T &lt; T_max) = Φ((T_max - μ)/σ) - Φ((T_min - μ)/σ)</code>
            </p>
            <p>
              <strong className="text-slate-200">2. Institutional Expected Value (EV):</strong> Binary prediction contracts settle at $1.00 or $0.00. For buying YES at ask price $p$:
              <br />
              <code className="text-emerald-300">EV_YES = P_model * (1 - p) - (1 - P_model) * p = P_model - p</code>
            </p>
            <p>
              <strong className="text-slate-200">3. Fractional Kelly Criterion:</strong> Optimal bankroll allocation formula damped by a quarter-Kelly multiplier ($0.25\times$) for drawdown mitigation:
              <br />
              <code className="text-amber-300">f* = clamp(((P_model - p) / (1 - p)) * 0.25, 0, 0.15)</code>
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
