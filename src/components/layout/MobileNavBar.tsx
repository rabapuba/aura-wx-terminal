import React from 'react';
import { useWeatherMarket } from '../../context/WeatherMarketContext';
import { CORE_CITIES } from '../../services/weatherEngine';
import type { CityId } from '../../types/weatherMarket';
import type { NavTabId } from './DesktopSidebar';
import { Layers, Sparkles, BarChart3, Sliders } from 'lucide-react';

interface MobileNavBarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
}

const CITY_KEYS: CityId[] = ['chicago', 'newyork', 'losangeles', 'miami', 'austin'];

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ activeTab, onSelectTab }) => {
  const { selectedCityId, setSelectedCityId, forecastsByCity, positions } = useWeatherMarket();

  const navItems: { id: NavTabId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'live-command', label: 'Command', icon: <Layers className="w-5 h-5" /> },
    { id: 'pre-market-intel', label: 'Intel', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'city-deep-dive', label: 'Deep-Dive', icon: <BarChart3 className="w-5 h-5" /> },
    {
      id: 'agent-config',
      label: 'Agent/Logs',
      icon: <Sliders className="w-5 h-5" />,
      badge: positions.length > 0 ? `${positions.length}` : undefined
    }
  ];

  return (
    <>
      {/* Mobile Horizontal Swipeable City Strip (Fixed below TopStatusBar on mobile) */}
      <div className="lg:hidden sticky top-[53px] z-30 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-2 py-1.5 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          {CITY_KEYS.map((cityId) => {
            const meta = CORE_CITIES[cityId];
            const forecast = forecastsByCity[cityId];
            const isSelected = selectedCityId === cityId;

            return (
              <button
                key={cityId}
                onClick={() => setSelectedCityId(cityId)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  isSelected
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 shadow-sm font-semibold'
                    : 'bg-slate-900/80 text-slate-400 border border-slate-800'
                }`}
              >
                <span>{meta.name}</span>
                <span className="text-slate-500">•</span>
                <span className={isSelected ? 'text-cyan-200' : 'text-slate-300'}>
                  {forecast ? `${forecast.currentTemp}°` : '--'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Android Optimized Sticky Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 pb-safe">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
                  isActive ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-cyan-500 text-[9px] font-mono text-slate-950 font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono tracking-tight">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 w-8 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
