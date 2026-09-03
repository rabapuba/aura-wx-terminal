import React, { useState } from 'react';
import type { QuantitativeEdge, CityId } from '../../types/weatherMarket';
import { CORE_CITIES } from '../../services/weatherEngine';
import { GlassCard } from '../common/GlassCard';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Sparkles,
  ShieldAlert
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

  // Filter edges
  const filteredEdges = edges.filter((edge) => {
    if (selectedCityFilter !== 'ALL' && edge.cityId !== selectedCityFilter) {
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
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wide">
            Pre-Market Statistical Edge Matrix
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
            {sortedEdges.length} OPPORTUNITIES
          </span>
        </div>

        {/* City Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 text-xs font-mono">
          {onSelectCityFilter && (
            <>
              <button
                onClick={() => onSelectCityFilter('ALL')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  selectedCityFilter === 'ALL'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
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
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {CORE_CITIES[c].stationCode}
                </button>
              ))}
            </>
          )}

          <button
            onClick={() => setFilterPositiveOnly(!filterPositiveOnly)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ml-2 ${
              filterPositiveOnly
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50 font-semibold'
                : 'bg-slate-800/40 text-slate-400 border-slate-700/40'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>EV &gt; 0 ONLY</span>
          </button>
        </div>
      </div>

      {/* Responsive High-Density Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-500 tracking-wider">
              <th className="py-2 px-2.5">City / Strike</th>
              <th
                onClick={() => handleSort('modelProb')}
                className="py-2 px-2 cursor-pointer hover:text-slate-300"
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
                className="py-2 px-2 cursor-pointer hover:text-slate-300"
              >
                <div className="flex items-center gap-1 text-emerald-400">
                  <span>EV YES</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('evNo')}
                className="py-2 px-2 cursor-pointer hover:text-slate-300"
              >
                <div className="flex items-center gap-1 text-rose-400">
                  <span>EV NO</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('roi')}
                className="py-2 px-2 cursor-pointer hover:text-slate-300"
              >
                <div className="flex items-center gap-1">
                  <span>Max ROI</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('kelly')}
                className="py-2 px-2 cursor-pointer hover:text-slate-300"
              >
                <div className="flex items-center gap-1 text-amber-400">
                  <span>Kelly Rec</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('asymmetry')}
                className="py-2 px-2 cursor-pointer hover:text-slate-300 text-right"
              >
                <div className="flex items-center justify-end gap-1 text-cyan-400">
                  <span>Edge Score</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2 px-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedEdges.map((edge) => {
              const cityName = CORE_CITIES[edge.cityId].name;
              const hasYesEdge = edge.evYes >= 0.04;
              const hasNoEdge = edge.evNo >= 0.04;

              return (
                <tr
                  key={`${edge.cityId}-${edge.bracketId}`}
                  className={`hover:bg-slate-800/30 transition-colors ${
                    edge.isArbitrageOpportunity
                      ? 'bg-amber-950/20'
                      : hasYesEdge
                      ? 'hover:bg-emerald-950/20'
                      : hasNoEdge
                      ? 'hover:bg-rose-950/20'
                      : ''
                  }`}
                >
                  {/* City & Bracket Label */}
                  <td className="py-2.5 px-2.5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-100 font-sans">{cityName}</span>
                        <span className="text-[10px] text-slate-500">
                          {CORE_CITIES[edge.cityId].stationCode}
                        </span>
                      </div>
                      <span className="text-slate-300 font-bold">{edge.bracketLabel}</span>
                    </div>
                  </td>

                  {/* WeatherNext 3 Model Probability */}
                  <td className="py-2.5 px-2">
                    <span className="text-cyan-300 font-bold">
                      {(edge.modelProbability * 100).toFixed(1)}%
                    </span>
                  </td>

                  {/* Kalshi Quotes */}
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-emerald-400 font-medium">${edge.kalshiYesPrice.toFixed(2)}</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-rose-400 font-medium">${edge.kalshiNoPrice.toFixed(2)}</span>
                    </div>
                  </td>

                  {/* Polymarket Quotes */}
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-emerald-400 font-medium">${edge.polymarketYesPrice.toFixed(2)}</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-rose-400 font-medium">${edge.polymarketNoPrice.toFixed(2)}</span>
                    </div>
                  </td>

                  {/* EV YES */}
                  <td className="py-2.5 px-2">
                    <span
                      className={`font-semibold ${
                        edge.evYes > 0 ? 'text-emerald-400' : 'text-slate-500'
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
                        edge.evNo > 0 ? 'text-rose-400' : 'text-slate-500'
                      }`}
                    >
                      {edge.evNo > 0 ? '+' : ''}
                      {(edge.evNo * 100).toFixed(1)}%
                    </span>
                  </td>

                  {/* Max ROI % */}
                  <td className="py-2.5 px-2 text-slate-300">
                    +{Math.max(edge.roiYesPct, edge.roiNoPct).toFixed(0)}%
                  </td>

                  {/* Kelly Recommended Size */}
                  <td className="py-2.5 px-2">
                    {edge.recommendedSizeDollars > 0 ? (
                      <span className="text-amber-300 font-bold">
                        ${edge.recommendedSizeDollars.toLocaleString()}
                        <span className="text-[10px] text-amber-500/80 ml-1">
                          ({(edge.recommendedKellyFraction * 100).toFixed(1)}%)
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-600">--</span>
                    )}
                  </td>

                  {/* Statistical Asymmetry Score */}
                  <td className="py-2.5 px-2 text-right">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[11px] bg-slate-800/80 border border-slate-700">
                      {edge.isArbitrageOpportunity ? (
                        <span className="text-amber-400 animate-pulse flex items-center gap-1">
                          <Zap className="w-3 h-3" /> ARB 99
                        </span>
                      ) : (
                        <span
                          className={
                            edge.statisticalAsymmetryScore >= 70
                              ? 'text-emerald-400'
                              : edge.statisticalAsymmetryScore >= 40
                              ? 'text-cyan-400'
                              : 'text-slate-400'
                          }
                        >
                          {edge.statisticalAsymmetryScore}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 1-Click Action */}
                  <td className="py-2.5 px-2 text-right">
                    {edge.recommendedSide !== 'NEUTRAL' ? (
                      <button
                        onClick={() => onStageTrade && onStageTrade(edge)}
                        className={`px-2.5 py-1 rounded text-xs font-bold font-mono transition-all ${
                          edge.recommendedSide === 'YES'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                            : 'bg-rose-600 hover:bg-rose-500 text-slate-950 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                        }`}
                      >
                        STAGE {edge.recommendedSide}
                      </button>
                    ) : (
                      <button
                        onClick={() => onStageTrade && onStageTrade(edge)}
                        className="px-2.5 py-1 rounded text-xs font-mono text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
                      >
                        ORDER
                      </button>
                    )}
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
