import React from 'react';
import { useWeatherMarket } from '../../context/WeatherMarketContext';
import { CORE_CITIES } from '../../services/weatherEngine';
import type { CityId } from '../../types/weatherMarket';
import { ProbabilityCurve } from '../widgets/ProbabilityCurve';
import { GlassCard } from '../common/GlassCard';
import {
  Thermometer,
  CloudSun,
  Wind,
  Droplets,
  Gauge,
  Sun,
  Radio,
  Cpu,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Award
} from 'lucide-react';

const CITY_KEYS: CityId[] = ['chicago', 'newyork', 'losangeles', 'miami', 'austin'];

export const CityDeepDiveView: React.FC = () => {
  const {
    selectedCityId,
    setSelectedCityId,
    forecastsByCity,
    bracketsByCity,
    cityEdges
  } = useWeatherMarket();

  const cityMeta = CORE_CITIES[selectedCityId];
  const forecast = forecastsByCity[selectedCityId];
  const brackets = bracketsByCity[selectedCityId] || [];
  const edges = cityEdges[selectedCityId] || [];

  return (
    <div className="space-y-4 pb-20 lg:pb-6 animate-fade-in">
      {/* City Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
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
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold shadow-md'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>{meta.name}</span>
              <span className="text-slate-500 font-normal">({meta.stationCode})</span>
              <span className={isSelected ? 'text-slate-100 font-bold' : 'text-slate-300'}>
                {fc ? `${fc.currentTemp}°F` : '--'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Gaussian Probability Distribution Curve */}
      <ProbabilityCurve forecast={forecast} brackets={brackets} />

      {/* Grid: Ensemble Breakdown & Atmospheric Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Google WeatherNext 3 Ensemble Variance Model Comparison */}
        <GlassCard className="p-4 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className="font-mono text-xs sm:text-sm font-bold text-slate-200 uppercase">
                WeatherNext 3 Multi-Model Ensemble Variance
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">5 INDEPENDENT PHYSICS ENSEMBLES</span>
          </div>

          {forecast ? (
            <div className="space-y-2 font-mono text-xs">
              {forecast.ensembleMembers.map((member) => {
                const diffFromMean = member.predictedTemp - forecast.forecastMeanTemp;
                return (
                  <div
                    key={member.modelName}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-200 font-bold">{member.modelName}</span>
                        <span className="text-[10px] text-slate-500">Weight: {(member.weight * 100).toFixed(0)}%</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Confidence: <strong className="text-cyan-400">{member.confidence}%</strong>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-100">
                        {member.predictedTemp.toFixed(2)}°F
                      </span>
                      <span
                        className={`block text-[10px] ${
                          diffFromMean > 0
                            ? 'text-amber-400'
                            : diffFromMean < 0
                            ? 'text-blue-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {diffFromMean >= 0 ? '+' : ''}{diffFromMean.toFixed(2)}°F vs mean
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs font-mono text-slate-500">
              Loading ensemble models...
            </div>
          )}
        </GlassCard>

        {/* Detailed High-Resolution Atmospheric Telemetry */}
        <GlassCard className="p-4 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h3 className="font-mono text-xs sm:text-sm font-bold text-slate-200 uppercase">
                Sensor &amp; Atmospheric Telemetry
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">NOAA/NWS ASOS SENSOR STREAM</span>
          </div>

          {forecast ? (
            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase mb-1">
                  <Droplets className="w-3 h-3 text-blue-400" />
                  <span>Dew Point / Humidity</span>
                </div>
                <div className="text-sm font-bold text-slate-100">{forecast.dewPoint}°F</div>
                <div className="text-[10px] text-slate-400">RH: {forecast.relativeHumidity}%</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase mb-1">
                  <Gauge className="w-3 h-3 text-amber-400" />
                  <span>Barometric Pressure</span>
                </div>
                <div className="text-sm font-bold text-slate-100">{forecast.barometricPressureInHg} inHg</div>
                <div className="text-[10px] text-slate-400">Trend: {forecast.pressureTrend}</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase mb-1">
                  <Wind className="w-3 h-3 text-cyan-400" />
                  <span>Wind Velocity &amp; Gusts</span>
                </div>
                <div className="text-sm font-bold text-slate-100">{forecast.windSpeedMph} mph</div>
                <div className="text-[10px] text-slate-400">Gusts: {forecast.windGustMph} mph @ {forecast.windDirectionDeg}°</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase mb-1">
                  <Sun className="w-3 h-3 text-amber-300" />
                  <span>Solar &amp; Cloud Cover</span>
                </div>
                <div className="text-sm font-bold text-slate-100">{forecast.cloudCoverPct}% Cloud</div>
                <div className="text-[10px] text-slate-400">Radiation: {forecast.solarRadiationWm2} W/m²</div>
              </div>

              <div className="col-span-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">Radar Reflectivity</span>
                  <span className="text-sm font-bold text-slate-200">{forecast.radarReflectivityDbz} dBZ</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-500 block">Brier Calibration Score</span>
                  <span className="text-sm font-bold text-emerald-400">{forecast.historicalBrierScore} (Institutional Grade)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs font-mono text-slate-500">
              Loading sensor data...
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
