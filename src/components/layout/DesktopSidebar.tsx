import React from 'react';
import { useWeatherMarket } from '../../context/WeatherMarketContext';
import { CORE_CITIES } from '../../services/weatherEngine';
import type { CityId } from '../../types/weatherMarket';
import {
  Layers,
  Sparkles,
  BarChart3,
  Sliders,
  CloudSun,
  ExternalLink,
  Cpu,
  Award
} from 'lucide-react';

export type NavTabId = 'live-command' | 'pre-market-intel' | 'city-deep-dive' | 'agent-config';

interface DesktopSidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
}

const CITY_KEYS: CityId[] = ['chicago', 'newyork', 'losangeles', 'miami', 'austin'];

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ activeTab, onSelectTab }) => {
  const {
    selectedCityId,
    setSelectedCityId,
    forecastsByCity,
    cityEdges,
    positions,
    agentConfig,
    portfolio,
    activePeriod
  } = useWeatherMarket();

  const navItems: { id: NavTabId; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'live-command',
      label: 'Live Command',
      icon: <Layers className="w-4 h-4" />,
      badge: 'CLOB'
    },
    {
      id: 'pre-market-intel',
      label: 'Pre-Market Intel',
      icon: <Sparkles className="w-4 h-4" />,
      badge: activePeriod.currentPhase === 'PRE_MARKET' ? 'ALPHA' : activePeriod.currentPhase === 'LATE_SWEEP' ? 'SWEEP' : 'MATRIX'
    },
    {
      id: 'city-deep-dive',
      label: 'City Deep-Dive',
      icon: <BarChart3 className="w-4 h-4" />
    },
    {
      id: 'agent-config',
      label: 'Agent Config / Logs',
      icon: <Sliders className="w-4 h-4" />,
      badge: positions.length > 0 ? `${positions.length}` : undefined
    }
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-[calc(100vh-53px)] bg-slate-50 dark:bg-[#0f141c] border-r border-slate-200 dark:border-[#263147] p-3.5 select-none shrink-0 overflow-y-auto transition-colors">
      {/* Navigation Menu Tabs */}
      <div className="space-y-1 mb-5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2 font-semibold">
          Trading Terminal
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono font-medium transition-all ${
                isActive
                  ? 'bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800/60 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#181f2c] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive
                      ? 'bg-sky-200/80 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-500/30'
                      : 'bg-slate-200 dark:bg-[#181f2c] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 5 Core Weather Station Cities */}
      <div className="space-y-1 mb-5">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
            Core 5 Cities
          </span>
          <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 flex items-center gap-1">
            <CloudSun className="w-3 h-3" /> WX3
          </span>
        </div>

        {CITY_KEYS.map((cityId) => {
          const meta = CORE_CITIES[cityId];
          const forecast = forecastsByCity[cityId];
          const isSelected = selectedCityId === cityId;
          const edges = cityEdges[cityId] || [];
          const bestEdge = edges[0];

          return (
            <div
              key={cityId}
              className={`rounded-lg transition-all ${
                isSelected
                  ? 'bg-white dark:bg-[#181f2c] border border-slate-300 dark:border-[#33415e] shadow-sm'
                  : 'hover:bg-slate-100/60 dark:hover:bg-[#181f2c]/50 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between px-3 py-2">
                <button
                  onClick={() => setSelectedCityId(cityId)}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-sans ${isSelected ? 'text-slate-900 dark:text-slate-100 font-bold' : 'text-slate-700 dark:text-slate-300 font-medium'}`}>
                      {meta.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{meta.stationCode}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">
                      {forecast ? `Max ${forecast.runningDailyMaxTemp}°F` : '--'}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      TMAX {forecast ? `${forecast.forecastDailyHighTemp}°` : '--'}
                    </span>
                  </div>
                </button>

                {/* Direct Link & Edge Pill */}
                <div className="flex items-center gap-1.5">
                  {bestEdge && bestEdge.recommendedSide !== 'NEUTRAL' && (
                    <div
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        bestEdge.recommendedSide === 'YES'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                      }`}
                    >
                      {bestEdge.recommendedSide} +{(Math.max(bestEdge.edgeYes, bestEdge.edgeNo) * 100).toFixed(0)}%
                    </div>
                  )}

                  <a
                    href={meta.directLinks.kalshiUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={`Open ${meta.name} on Kalshi`}
                    className="p-1 rounded text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Trading Agent Institutional Status Widget */}
      <div className="mt-auto pt-3 border-t border-slate-200 dark:border-[#263147]">
        <div className="rounded-lg bg-white dark:bg-[#181f2c] p-2.5 border border-slate-200 dark:border-[#263147] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span className="text-[11px] font-mono font-semibold text-slate-800 dark:text-slate-200">
                Hybrid AI Strategy
              </span>
            </div>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                agentConfig.autoTradingEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {agentConfig.autoTradingEnabled ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-500 dark:text-slate-400">
            <div>
              <span className="text-slate-400 dark:text-slate-500">Positions:</span>{' '}
              <span className="text-slate-800 dark:text-slate-200 font-semibold">{positions.length}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500">Win Rate:</span>{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{portfolio.winRatePct}%</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500">Early Alpha:</span>{' '}
              <span className="text-sky-600 dark:text-sky-400 font-semibold">{agentConfig.enableEarlyAlpha ? 'ON' : 'OFF'}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500">Late Sweep:</span>{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{agentConfig.enableLateSweep ? 'ON' : 'OFF'}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
