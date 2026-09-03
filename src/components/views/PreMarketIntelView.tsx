import React, { useState } from 'react';
import { useWeatherMarket } from '../../context/WeatherMarketContext';
import { CORE_CITIES } from '../../services/weatherEngine';
import type { CityId, QuantitativeEdge } from '../../types/weatherMarket';
import { EdgeMatrixTable } from '../widgets/EdgeMatrixTable';
import { GlassCard } from '../common/GlassCard';
import {
  Sparkles,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  Cpu,
  ExternalLink,
  Award,
  Zap
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
      <GlassCard className="p-4 sm:p-5 border-sky-300 dark:border-sky-700/60 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-800/80">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold font-sans text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Daily High (TMAX) Pre-Market Intelligence
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 font-semibold">
                  TMAX QUANT ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Google WeatherNext 3 ensemble physics ingestion for Daily High markets across Chicago, NYC, LA, Miami &amp; Austin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={refreshForecasts}
              disabled={isIngestingForecasts}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isIngestingForecasts ? 'animate-spin text-sky-500' : ''}`} />
              <span>{isIngestingForecasts ? 'Ingesting WX3...' : 'Re-Run Ensemble'}</span>
            </button>

            <button
              onClick={handleBatchExecuteAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white dark:text-slate-950 font-bold transition-all shadow-sm"
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
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-[#141a24] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#263147]">
                      RANK #{index + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-sans">{meta.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={edge.directLinks.kalshiUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="View on Kalshi"
                      className="p-1 rounded text-slate-400 hover:text-sky-600 dark:hover:text-sky-400"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="font-mono text-sm font-bold text-sky-700 dark:text-sky-400">
                      {edge.isArbitrageOpportunity ? 'ARB 99' : edge.statisticalAsymmetryScore}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2 font-mono">
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {edge.bracketLabel}
                  </span>
                  {edge.strategyTag === 'EARLY_ALPHA' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                      EARLY ALPHA
                    </span>
                  )}
                  {edge.strategyTag === 'LATE_SWEEP' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      LATE SWEEP
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3 bg-slate-50 dark:bg-[#141a24] p-2.5 rounded border border-slate-200 dark:border-[#263147]">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">WX3 PROB</span>
                    <span className="text-sky-700 dark:text-sky-300 font-bold">{(edge.modelProbability * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">MARKET PRICE</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">
                      ${(isYes ? edge.bestYesAsk : edge.bestNoAsk).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">EXPECTED VALUE</span>
                    <span className={`font-bold ${maxEv >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      +{((maxEv) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">KELLY SIZING</span>
                    <span className="text-amber-700 dark:text-amber-300 font-bold">
                      ${edge.recommendedSizeDollars.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onStageTrade(edge)}
                className={`w-full py-2 rounded-lg font-mono font-bold text-xs transition-all ${
                  isYes
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                    : 'bg-rose-600 hover:bg-rose-500 text-white dark:text-slate-950 shadow-xs'
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
          className="w-full flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
              Hybrid Quantitative Strategy &amp; Statistical Asymmetry Methodology
            </span>
          </div>
          {showMathExplainer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showMathExplainer && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#263147] font-mono text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
            <p>
              <strong className="text-slate-800 dark:text-slate-200">1. Pre-Market Solar Ramp (00:00 - 11:00):</strong> Scans for early-day mispricings where WeatherNext 3 ensemble probability deviates sharply from cheap early contracts ($\le \$0.35$). Offers $150\%+$ potential ROI with controlled risk before afternoon peak solar heating.
            </p>
            <p>
              <strong className="text-slate-800 dark:text-slate-200">2. Peak Solar Heating &amp; Late-Session Sweep (11:00 - 23:00):</strong> As the thermometer climbs and the day&apos;s running high (T_running) is established, brackets below T_running become mathematically impossible (probability drops to 0). The agent sweeps defensible high win-rate contracts (&ge; 78% model probability) before the NWS climate report cutoff.
            </p>
            <p>
              <strong className="text-slate-800 dark:text-slate-200">3. Expected Value (EV):</strong>
              <br />
              <code className="text-emerald-700 dark:text-emerald-400">EV_YES = P_model - Price_YES</code>
              {'  |  '}
              <code className="text-rose-700 dark:text-rose-400">EV_NO = (1 - P_model) - Price_NO</code>
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
