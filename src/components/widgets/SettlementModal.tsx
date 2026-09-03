import React from 'react';
import type { RolloverResolution } from '../../services/autoPeriodEngine';
import type { SettledContract } from '../../types/weatherMarket';
import { CORE_CITIES } from '../../services/weatherEngine';
import { GlassCard } from '../common/GlassCard';
import { RefreshCw, CheckCircle2, XCircle, Award, X } from 'lucide-react';

interface SettlementModalProps {
  resolution: RolloverResolution | null;
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

  const cityKeys = Object.keys(resolution.settlementTemps) as (keyof typeof resolution.settlementTemps)[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg">
        <GlassCard className="p-4 sm:p-6 border-cyan-700/80 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-100 font-mono uppercase">
                  Hourly Period Settled
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  Period ID: {resolution.periodId}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Official Final Settlement Readings */}
          <div className="mb-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2 block">
              Official ASOS Station Final Temperatures
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {cityKeys.map((cityId) => {
                const meta = CORE_CITIES[cityId];
                const temp = resolution.settlementTemps[cityId];

                return (
                  <div
                    key={cityId}
                    className="p-2 rounded bg-slate-950/70 border border-slate-800 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span>{meta.name}</span>
                      <span className="text-slate-500">{meta.stationCode}</span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-sm font-bold text-cyan-300">{temp}°F</span>
                      <span className="text-[9px] text-emerald-400 bg-emerald-950/60 px-1 rounded border border-emerald-800/40">
                        FINAL
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Settled Positions Summary */}
          <div className="rounded-lg bg-slate-950/90 p-3 border border-slate-800 mb-4 font-mono text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 uppercase text-[10px]">Period Trading Settlement</span>
              <span
                className={`font-bold ${
                  totalPeriodRealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {totalPeriodRealizedPnL >= 0 ? '+' : ''}${totalPeriodRealizedPnL.toFixed(2)}
              </span>
            </div>

            {settledContracts.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {settledContracts.map((contract, i) => {
                  const isWon = contract.settlementPrice === 1.0;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1 px-2 rounded bg-slate-900/60 text-[11px]"
                    >
                      <div className="flex items-center gap-1.5">
                        {isWon ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span className="text-slate-200">
                          {contract.shares} {contract.side} ({contract.bracketLabel})
                        </span>
                      </div>
                      <span
                        className={`font-bold ${
                          contract.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {contract.realizedPnL >= 0 ? '+' : ''}${contract.realizedPnL.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-slate-500 text-center py-2 text-[11px]">
                No active positions held during this period rollover.
              </div>
            )}
          </div>

          {/* Notice of new period */}
          <div className="text-[11px] font-mono text-cyan-300 bg-cyan-950/40 p-2.5 rounded border border-cyan-800/40 flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Next hourly period initialized. Fresh WeatherNext 3 forecasts ingested and CLOB order books re-centered.
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs tracking-wider transition-colors shadow-lg shadow-cyan-500/20"
          >
            CONTINUE TO LIVE TERMINAL
          </button>
        </GlassCard>
      </div>
    </div>
  );
};
