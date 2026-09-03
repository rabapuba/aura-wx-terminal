import React from 'react';
import type { DailySettlementResolution } from '../../services/autoPeriodEngine';
import type { SettledContract } from '../../types/weatherMarket';
import { CORE_CITIES } from '../../services/weatherEngine';
import { GlassCard } from '../common/GlassCard';
import { RefreshCw, CheckCircle2, XCircle, Award, X } from 'lucide-react';

interface SettlementModalProps {
  resolution: DailySettlementResolution | null;
  settledContracts: SettledContract[];
  onClose: () => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  resolution,
  settledContracts,
  onClose
}) => {
  if (!resolution) return null;

  const totalPeriodRealizedPnL = settledContracts
    .filter((c) => c.periodId === resolution.periodId)
    .reduce((sum, c) => sum + c.realizedPnL, 0);

  const cityKeys = Object.keys(resolution.officialDailyHighs) as (keyof typeof resolution.officialDailyHighs)[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg">
        <GlassCard className="p-4 sm:p-6 border-slate-300 dark:border-[#33415e] shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-[#263147]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-800/60">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 font-mono uppercase">
                  Daily Market Settled (NWS CLI)
                </h3>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {resolution.marketDate} • {resolution.periodId}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Official Final Settlement Readings */}
          <div className="mb-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-2 block">
              Official NOAA / NWS ASOS Daily Maximum (TMAX)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {cityKeys.map((cityId) => {
                const meta = CORE_CITIES[cityId];
                const temp = resolution.officialDailyHighs[cityId];

                return (
                  <div
                    key={cityId}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147] font-mono text-xs"
                  >
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] truncate">{meta.name}</span>
                    <div className="flex items-baseline justify-between mt-0.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{temp}°F</span>
                      <span className="text-[9px] text-sky-600 dark:text-sky-400 font-semibold">{meta.stationCode}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Realized Settlement PnL Summary */}
          <div className="mb-4 p-3 rounded-lg bg-slate-50 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147] flex items-center justify-between font-mono">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase">Settled Positions P&amp;L:</span>
            </div>
            <span
              className={`text-base font-bold ${
                totalPeriodRealizedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {totalPeriodRealizedPnL >= 0 ? '+' : ''}${totalPeriodRealizedPnL.toFixed(2)}
            </span>
          </div>

          {/* Settled Positions List */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 mb-4 font-mono text-xs">
            {settledContracts
              .filter((c) => c.periodId === resolution.periodId)
              .map((sc, idx) => {
                const won = sc.realizedPnL > 0;
                return (
                  <div
                    key={`sc-${idx}`}
                    className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-[#141a24] border border-slate-200 dark:border-[#263147]"
                  >
                    <div className="flex items-center gap-2">
                      {won ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {sc.shares} {sc.side} {sc.bracketLabel}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {CORE_CITIES[sc.cityId]?.stationCode} • Entry: ${sc.entryPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`font-bold ${
                        sc.realizedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {sc.realizedPnL >= 0 ? '+' : ''}${sc.realizedPnL.toFixed(2)}
                    </span>
                  </div>
                );
              })}
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white dark:text-slate-950 font-bold font-mono text-xs transition-colors shadow-xs"
          >
            DISMISS &amp; CONTINUE DAILY TRADING
          </button>
        </GlassCard>
      </div>
    </div>
  );
};
