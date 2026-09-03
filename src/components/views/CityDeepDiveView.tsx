import React from 'react';
import { useWeatherMarket } from '../../context/WeatherMarketContext';
import { CORE_CITIES } from '../../services/weatherEngine';
import type { CityId } from '../../types/weatherMarket';
import { ProbabilityCurve } from '../widgets/ProbabilityCurve';
import { GlassCard } from '../common/GlassCard';
import {
  Wind,
  Droplets,
  Gauge,
  Sun,
  Radio,
  Cpu,
  ExternalLink
} from 'lucide-react';

const CITY_KEYS: CityId[] = ['chicago', 'newyork', 'losangeles', 'miami', 'austin'];

export const CityDeepDiveView: React.FC = () => {
  const {
    selectedCityId,
    setSelectedCityId,
    forecastsByCity,
    bracketsByCity,
    activePeriod
  } = useWeatherMarket();

  const cityMeta = CORE_CITIES[selectedCityId];
  const forecast = forecastsByCity[selectedCityId];
  const brackets = bracketsByCity[selectedCityId] || [];

  return (
    <div className="space-y-4 pb-20 lg:pb-6 animate-fade-in">
      {/* City Switcher Tabs & External Deep Links */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-[#263147]">
        <div className="flex flex-wrap items-center gap-2">
          {CITY_KEYS.map((cityId) => {
            const meta = CORE_CITIES[cityId];
            const isSelected = selectedCityId === cityId;
            const fc = forecastsByCity[cityId];

            return (
              <button
                key={cityId}
                onClick={() => setSelectedCityId(cityId)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono transition-all ${
                  isSelected
                    ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700/80 font-bold shadow-xs'
                    : 'bg-white dark:bg-[#181f2c] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#263147] hover:border-slate-300'
                }`}
              >
                <span>{meta.name}</span>
                <span className="text-slate-400 font-normal">({meta.stationCode})</span>
                <span className={isSelected ? 'text-slate-900 dark:text-slate-100 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                  {fc ? `${fc.runningDailyMaxTemp}°F` : '--'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Direct External Market Links for Active City */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <a
            href={cityMeta.directLinks.kalshiUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition-colors"
          >
            <span>Kalshi Daily High</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={cityMeta.directLinks.polymarketUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 transition-colors"
          >
            <span>Polymarket Daily</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Gaussian Probability Distribution Curve */}
      <ProbabilityCurve forecast={forecast} brackets={brackets} />

      {/* Grid: Ensemble Breakdown & Atmospheric Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Google WeatherNext 3 Ensemble Variance Model Comparison */}
        <GlassCard className="p-4 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-[#263147]">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h3 className="font-mono text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase">
                WeatherNext 3 TMAX Multi-Model Ensemble
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">5 INDEPENDENT PHYSICS ENSEMBLES</span>
          </div>

          {forecast ? (
            <div className="space-y-2 font-mono text-xs">
              {forecast.ensembleMembers.map((member) => {
                const diffFromMean = member.predictedDailyMax - forecast.forecastDailyHighTemp;
                return (
                  <div
                    key={member.modelName}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147] flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{member.modelName}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Weight: {(member.weight * 100).toFixed(0)}%</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Confidence: <strong className="text-sky-600 dark:text-sky-400">{member.confidence}%</strong>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {member.predictedDailyMax.toFixed(1)}°F
                      </span>
                      <span
                        className={`block text-[10px] ${
                          diffFromMean > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : diffFromMean < 0
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {diffFromMean >= 0 ? '+' : ''}{diffFromMean.toFixed(1)}°F vs TMAX
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs font-mono text-slate-400">
              Loading ensemble models...
            </div>
          )}
        </GlassCard>

        {/* Detailed High-Resolution Atmospheric Telemetry */}
        <GlassCard className="p-4 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-[#263147]">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <h3 className="font-mono text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase">
                Sensor &amp; Diurnal Telemetry ({activePeriod.marketDate})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">NOAA/NWS ASOS CLI REPORT</span>
          </div>

          {forecast ? (
            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147]">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase mb-1">
                  <Sun className="w-3 h-3 text-amber-500" />
                  <span>Running High / Zenith Peak</span>
                </div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{forecast.runningDailyMaxTemp}°F</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Zenith: {forecast.peakSolarZenithHour}</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147]">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase mb-1">
                  <Droplets className="w-3 h-3 text-blue-500" />
                  <span>Dew Point / Humidity</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{forecast.dewPoint}°F</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">RH: {forecast.relativeHumidity}%</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147]">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase mb-1">
                  <Gauge className="w-3 h-3 text-amber-500" />
                  <span>Barometric Pressure</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{forecast.barometricPressureInHg} inHg</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Trend: {forecast.pressureTrend}</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147]">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase mb-1">
                  <Wind className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                  <span>Wind Velocity &amp; Gusts</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{forecast.windSpeedMph} mph</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Gusts: {forecast.windGustMph} mph @ {forecast.windDirectionDeg}°</div>
              </div>

              <div className="col-span-2 p-2.5 rounded-lg bg-slate-50 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">Climate Station Benchmark</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{cityMeta.stationName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-500 block">Brier Calibration Score</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{forecast.historicalBrierScore} (Calibrated)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs font-mono text-slate-400">
              Loading sensor data...
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
