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
  ShieldCheck,
  TrendingUp,
  Cpu,
  ChevronRight,
  Zap
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
    portfolio
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
      badge: 'ALPHA'
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
    <aside className="hidden lg:flex flex-col w-64 h-[calc(100vh-53px)] bg-slate-950/80 border-r border-slate-800/80 p-3.5 select-none shrink-0 overflow-y-auto">
      {/* Navigation Menu Tabs */}
      <div className="space-y-1 mb-6">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 mb-2 font-semibold">
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
                  ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/60 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-400'
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
      <div className="space-y-1 mb-6">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
            Core 5 Cities
          </span>
          <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
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
            <button
              key={cityId}
              onClick={() => setSelectedCityId(cityId)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                isSelected
                  ? 'bg-slate-900 border border-slate-700/80 shadow-md'
                  : 'hover:bg-slate-900/40 border border-transparent'
              }`}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-medium font-sans ${isSelected ? 'text-slate-100 font-semibold' : 'text-slate-300'}`}>
                    {meta.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{meta.stationCode}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <span className="text-slate-300 font-semibold">
                    {forecast ? `${forecast.currentTemp}°F` : '--'}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[10px] text-slate-500">
                    μ {forecast ? `${forecast.forecastMeanTemp}°` : '--'}
                  </span>
                </div>
              </div>

              {/* Edge Pill */}
              {bestEdge && bestEdge.recommendedSide !== 'NEUTRAL' && (
                <div
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    bestEdge.recommendedSide === 'YES'
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                      : 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                  }`}
                >
                  {bestEdge.recommendedSide} +{(Math.max(bestEdge.edgeYes, bestEdge.edgeNo) * 100).toFixed(0)}%
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* AI Trading Agent Institutional Status Widget */}
      <div className="mt-auto pt-3 border-t border-slate-800/80">
        <div className="rounded-lg bg-slate-900/60 p-2.5 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-mono font-semibold text-slate-200">
                AI Execution Agent
              </span>
            </div>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                agentConfig.autoTradingEnabled
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {agentConfig.autoTradingEnabled ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400">
            <div>
              <span className="text-slate-500">Positions:</span>{' '}
              <span className="text-slate-200 font-semibold">{positions.length}</span>
            </div>
            <div>
              <span className="text-slate-500">Win Rate:</span>{' '}
              <span className="text-emerald-400 font-semibold">{portfolio.winRatePct}%</span>
            </div>
            <div>
              <span className="text-slate-500">Min EV:</span>{' '}
              <span className="text-cyan-400 font-semibold">{agentConfig.minEvHurdlePct}%</span>
            </div>
            <div>
              <span className="text-slate-500">Kelly:</span>{' '}
              <span className="text-amber-400 font-semibold">{agentConfig.kellyFractionMultiplier}x</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
