import React, { useState } from 'react';
import type { QuantitativeEdge, CityId, StrategyPhaseTag } from '../../types/weatherMarket';
import { CORE_CITIES } from '../../services/weatherEngine';
import { GlassCard } from '../common/GlassCard';
import {
  ArrowUpDown,
  Filter,
  Sparkles,
  ExternalLink,
  Award,
  Zap
} from 'lucide-react';

interface EdgeMatrixTableProps {
  edges: QuantitativeEdge[];
  onStageTrade?: (edge: QuantitativeEdge) => void;
  selectedCityFilter?: CityId | 'ALL';
  onSelectCityFilter?: (city: CityId | 'ALL') => void;
}

type SortField = 'asymmetry' | 'evYes' | 'evNo' | 'modelProb' | 'roi' | 'kelly';

export const EdgeMatrixTable: React.FC<EdgeMatrixTableProps> = ({
  edges,
  onStageTrade,
  selectedCityFilter = 'ALL',
  onSelectCityFilter
}) => {
  const [sortField, setSortField] = useState<SortField>('asymmetry');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [filterPositiveOnly, setFilterPositiveOnly] = useState<boolean>(true);
  const [strategyFilter, setStrategyFilter] = useState<StrategyPhaseTag | 'ALL'>('ALL');

  // Filter edges
  const filteredEdges = edges.filter((edge) => {
    if (selectedCityFilter !== 'ALL' && edge.cityId !== selectedCityFilter) {
      return false;
    }
    if (strategyFilter !== 'ALL' && edge.strategyTag !== strategyFilter) {
      return false;
    }
    if (filterPositiveOnly) {
      return edge.evYes > 0 || edge.evNo > 0 || edge.isArbitrageOpportunity;
    }
    return true;
  });

  // Sort edges
  const sortedEdges = [...filteredEdges].sort((a, b) => {
    let diff = 0;
    switch (sortField) {
      case 'asymmetry':
        diff = a.statisticalAsymmetryScore - b.statisticalAsymmetryScore;
        break;
      case 'evYes':
        diff = a.evYes - b.evYes;
        break;
      case 'evNo':
        diff = a.evNo - b.evNo;
        break;
      case 'modelProb':
        diff = a.modelProbability - b.modelProbability;
        break;
      case 'roi':
        diff = Math.max(a.roiYesPct, a.roiNoPct) - Math.max(b.roiYesPct, b.roiNoPct);
        break;
      case 'kelly':
        diff = a.recommendedKellyFraction - b.recommendedKellyFraction;
        break;
    }
    return sortAsc ? diff : -diff;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <GlassCard className="p-3 sm:p-4 flex flex-col w-full overflow-hidden">
      {/* Table Toolbar & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-slate-200 dark:border-[#263147]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            Pre-Market Statistical Edge Matrix
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800/50">
            {sortedEdges.length} OPPORTUNITIES
          </span>
        </div>

        {/* Dual-Phase Strategy & City Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          {/* Strategy Filter Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-[#141a24] p-0.5 rounded-lg border border-slate-200 dark:border-[#263147]">
            <button
              onClick={() => setStrategyFilter('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                strategyFilter === 'ALL'
                  ? 'bg-white dark:bg-[#181f2c] text-slate-900 dark:text-slate-100 font-bold shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setStrategyFilter('EARLY_ALPHA')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                strategyFilter === 'EARLY_ALPHA'
                  ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              α EARLY ALPHA
            </button>
            <button
              onClick={() => setStrategyFilter('LATE_SWEEP')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                strategyFilter === 'LATE_SWEEP'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Ω LATE SWEEP
            </button>
            <button
              onClick={() => setStrategyFilter('ARBITRAGE')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                strategyFilter === 'ARBITRAGE'
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              ⚡ ARB
            </button>
          </div>

          {onSelectCityFilter && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onSelectCityFilter('ALL')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  selectedCityFilter === 'ALL'
                    ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700/60 font-semibold'
                    : 'bg-slate-100 dark:bg-[#141a24] text-slate-600 dark:text-slate-400'
                }`}
              >
                ALL CITIES
              </button>
              {(['chicago', 'newyork', 'losangeles', 'miami', 'austin'] as CityId[]).map((c) => (
                <button
                  key={c}
                  onClick={() => onSelectCityFilter(c)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    selectedCityFilter === c
                      ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700/60 font-semibold'
                      : 'bg-slate-100 dark:bg-[#141a24] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {CORE_CITIES[c].stationCode}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setFilterPositiveOnly(!filterPositiveOnly)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
              filterPositiveOnly
                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800/50 font-semibold'
                : 'bg-slate-100 dark:bg-[#141a24] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#263147]'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>EV &gt; 0</span>
          </button>
        </div>
      </div>

      {/* High-Density Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#263147] text-[10px] uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              <th className="py-2 px-2.5">City / Strike</th>
              <th
                onClick={() => handleSort('modelProb')}
                className="py-2 px-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
              >
                <div className="flex items-center gap-1">
                  <span>Model P</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2 px-2">Kalshi (Y/N)</th>
              <th className="py-2 px-2">Poly (Y/N)</th>
              <th
                onClick={() => handleSort('evYes')}
                className="py-2 px-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
              >
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span>EV YES</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('evNo')}
                className="py-2 px-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
              >
                <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <span>EV NO</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('roi')}
                className="py-2 px-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
              >
                <div className="flex items-center gap-1">
                  <span>Max ROI</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('kelly')}
                className="py-2 px-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
              >
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <span>Kelly Rec</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('asymmetry')}
                className="py-2 px-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 text-right"
              >
                <div className="flex items-center justify-end gap-1 text-sky-600 dark:text-sky-400">
                  <span>Edge Score</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2 px-2 text-right">Direct Links &amp; Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-[#263147]/60">
            {sortedEdges.map((edge) => {
              const cityName = CORE_CITIES[edge.cityId].name;
              const hasYesEdge = edge.evYes >= 0.04;
              const hasNoEdge = edge.evNo >= 0.04;

              return (
                <tr
                  key={`${edge.cityId}-${edge.bracketId}`}
                  className={`hover:bg-slate-50 dark:hover:bg-[#141a24]/60 transition-colors ${
                    edge.isArbitrageOpportunity
                      ? 'bg-amber-50/60 dark:bg-amber-950/20'
                      : hasYesEdge
                      ? 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20'
                      : hasNoEdge
                      ? 'hover:bg-rose-50/40 dark:hover:bg-rose-950/20'
                      : ''
                  }`}
                >
                  {/* City & Bracket Label */}
                  <td className="py-2.5 px-2.5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 font-sans">{cityName}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {CORE_CITIES[edge.cityId].stationCode}
                        </span>
                        {edge.strategyTag === 'EARLY_ALPHA' && (
                          <span className="text-[8px] font-bold px-1 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                            ALPHA
                          </span>
                        )}
                        {edge.strategyTag === 'LATE_SWEEP' && (
                          <span className="text-[8px] font-bold px-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            SWEEP
                          </span>
                        )}
                      </div>
                      <span className="text-slate-700 dark:text-slate-300 font-bold">{edge.bracketLabel}</span>
                    </div>
                  </td>

                  {/* WeatherNext 3 Model Probability */}
                  <td className="py-2.5 px-2">
                    <span className="text-sky-700 dark:text-sky-300 font-bold">
                      {(edge.modelProbability * 100).toFixed(1)}%
                    </span>
                  </td>

                  {/* Kalshi Quotes */}
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">${edge.kalshiYesPrice.toFixed(2)}</span>
                      <span className="text-slate-400">/</span>
                      <span className="text-rose-600 dark:text-rose-400 font-medium">${edge.kalshiNoPrice.toFixed(2)}</span>
                    </div>
                  </td>

                  {/* Polymarket Quotes */}
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">${edge.polymarketYesPrice.toFixed(2)}</span>
                      <span className="text-slate-400">/</span>
                      <span className="text-rose-600 dark:text-rose-400 font-medium">${edge.polymarketNoPrice.toFixed(2)}</span>
                    </div>
                  </td>

                  {/* EV YES */}
                  <td className="py-2.5 px-2">
                    <span
                      className={`font-semibold ${
                        edge.evYes > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {edge.evYes > 0 ? '+' : ''}
                      {(edge.evYes * 100).toFixed(1)}%
                    </span>
                  </td>

                  {/* EV NO */}
                  <td className="py-2.5 px-2">
                    <span
                      className={`font-semibold ${
                        edge.evNo > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {edge.evNo > 0 ? '+' : ''}
                      {(edge.evNo * 100).toFixed(1)}%
                    </span>
                  </td>

                  {/* Max ROI % */}
                  <td className="py-2.5 px-2 text-slate-700 dark:text-slate-300">
                    +{Math.max(edge.roiYesPct, edge.roiNoPct).toFixed(0)}%
                  </td>

                  {/* Kelly Recommended Size */}
                  <td className="py-2.5 px-2">
                    {edge.recommendedSizeDollars > 0 ? (
                      <span className="text-amber-700 dark:text-amber-300 font-bold">
                        ${edge.recommendedSizeDollars.toLocaleString()}
                        <span className="text-[10px] text-amber-600 dark:text-amber-500/80 ml-1">
                          ({(edge.recommendedKellyFraction * 100).toFixed(1)}%)
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600">--</span>
                    )}
                  </td>

                  {/* Statistical Asymmetry Score */}
                  <td className="py-2.5 px-2 text-right">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[11px] bg-slate-100 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147]">
                      {edge.isArbitrageOpportunity ? (
                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Zap className="w-3 h-3" /> ARB 99
                        </span>
                      ) : (
                        <span
                          className={
                            edge.statisticalAsymmetryScore >= 70
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : edge.statisticalAsymmetryScore >= 40
                              ? 'text-sky-600 dark:text-sky-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }
                        >
                          {edge.statisticalAsymmetryScore}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Direct Market Deep-Links & 1-Click Action */}
                  <td className="py-2.5 px-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Direct Kalshi Deep Link */}
                      <a
                        href={edge.directLinks.kalshiUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Trade on Kalshi"
                        className="px-1.5 py-1 rounded text-[10px] font-mono text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 bg-slate-100 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147] transition-colors flex items-center gap-0.5"
                      >
                        <span>KX</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>

                      {/* Direct Polymarket Deep Link */}
                      <a
                        href={edge.directLinks.polymarketUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Trade on Polymarket"
                        className="px-1.5 py-1 rounded text-[10px] font-mono text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 bg-slate-100 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147] transition-colors flex items-center gap-0.5"
                      >
                        <span>POLY</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>

                      {/* 1-Click Stage Execution */}
                      {edge.recommendedSide !== 'NEUTRAL' ? (
                        <button
                          onClick={() => onStageTrade && onStageTrade(edge)}
                          className={`px-2.5 py-1 rounded text-xs font-bold font-mono transition-all ${
                            edge.recommendedSide === 'YES'
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white dark:text-slate-950 shadow-xs'
                              : 'bg-rose-600 hover:bg-rose-500 text-white dark:text-slate-950 shadow-xs'
                          }`}
                        >
                          STAGE {edge.recommendedSide}
                        </button>
                      ) : (
                        <button
                          onClick={() => onStageTrade && onStageTrade(edge)}
                          className="px-2 py-1 rounded text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147] transition-colors"
                        >
                          STAGE
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};
