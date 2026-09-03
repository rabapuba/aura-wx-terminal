import React, { useState, useEffect } from 'react';
import type { CityId, ContractSide, MarketPlatform, QuantitativeEdge } from '../../types/weatherMarket';
import { CORE_CITIES } from '../../services/weatherEngine';
import { GlassCard } from '../common/GlassCard';
import { X, Zap, ExternalLink } from 'lucide-react';

interface QuickOrderTicketProps {
  initialEdge?: QuantitativeEdge | null;
  onClose: () => void;
  onExecute: (
    bracketId: string,
    cityId: CityId,
    platform: MarketPlatform,
    side: ContractSide,
    shares: number,
    price: number
  ) => void;
  cashBalance: number;
}

export const QuickOrderTicket: React.FC<QuickOrderTicketProps> = ({
  initialEdge,
  onClose,
  onExecute,
  cashBalance
}) => {
  if (!initialEdge) return null;

  const [side, setSide] = useState<ContractSide>(
    initialEdge.recommendedSide !== 'NEUTRAL' ? initialEdge.recommendedSide : 'YES'
  );
  const [platform, setPlatform] = useState<MarketPlatform>(
    side === 'YES' ? initialEdge.bestYesPlatform : initialEdge.bestNoPlatform
  );
  const [price, setPrice] = useState<number>(
    side === 'YES' ? initialEdge.bestYesAsk : initialEdge.bestNoAsk
  );
  const [shares, setShares] = useState<number>(() => {
    const recommendedDollars = initialEdge.recommendedSizeDollars > 0 ? initialEdge.recommendedSizeDollars : 500;
    const targetPrice = side === 'YES' ? initialEdge.bestYesAsk : initialEdge.bestNoAsk;
    return Math.max(25, Math.floor(recommendedDollars / (targetPrice || 0.5)));
  });

  useEffect(() => {
    if (side === 'YES') {
      setPrice(platform === 'kalshi' ? initialEdge.kalshiYesPrice : initialEdge.polymarketYesPrice);
    } else {
      setPrice(platform === 'kalshi' ? initialEdge.kalshiNoPrice : initialEdge.polymarketNoPrice);
    }
  }, [side, platform, initialEdge]);

  const totalCost = Number((shares * price).toFixed(2));
  const potentialPayout = Number((shares * 1.0).toFixed(2));
  const netProfit = Number((potentialPayout - totalCost).toFixed(2));
  const roiPct = totalCost > 0 ? Number(((netProfit / totalCost) * 100).toFixed(1)) : 0;
  const isAffordable = totalCost <= cashBalance;

  const evDollar = side === 'YES' ? initialEdge.evYes : initialEdge.evNo;
  const totalEv = Number((shares * evDollar).toFixed(2));

  const applyKellySize = () => {
    if (initialEdge.recommendedSizeDollars > 0) {
      const calculatedShares = Math.floor(initialEdge.recommendedSizeDollars / price);
      setShares(Math.max(10, calculatedShares));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAffordable || shares <= 0) return;
    onExecute(initialEdge.bracketId, initialEdge.cityId, platform, side, shares, price);
    onClose();
  };

  const cityName = CORE_CITIES[initialEdge.cityId]?.name || initialEdge.cityId;
  const currentDirectUrl = platform === 'kalshi' ? initialEdge.directLinks.kalshiUrl : initialEdge.directLinks.polymarketUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md">
        <GlassCard className="p-4 sm:p-5 border-slate-300 dark:border-[#33415e] shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-[#263147]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800/60">
                STAGE ORDER
              </span>
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                {cityName} • {initialEdge.bracketLabel}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <a
                href={currentDirectUrl}
                target="_blank"
                rel="noreferrer"
                title={`Open on ${platform.toUpperCase()}`}
                className="p-1 rounded text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={onClose}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
            {/* Side Selection: YES vs NO */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSide('YES')}
                className={`py-2 rounded-lg font-bold text-center border transition-all ${
                  side === 'YES'
                    ? 'bg-emerald-600 text-white dark:text-slate-950 border-emerald-500 shadow-xs'
                    : 'bg-slate-100 dark:bg-[#141a24] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#263147] hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                BUY YES
              </button>
              <button
                type="button"
                onClick={() => setSide('NO')}
                className={`py-2 rounded-lg font-bold text-center border transition-all ${
                  side === 'NO'
                    ? 'bg-rose-600 text-white dark:text-slate-950 border-rose-500 shadow-xs'
                    : 'bg-slate-100 dark:bg-[#141a24] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#263147] hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                BUY NO
              </button>
            </div>

            {/* Platform Selection: Kalshi vs Polymarket */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPlatform('kalshi')}
                className={`py-1.5 rounded text-center border transition-colors ${
                  platform === 'kalshi'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-sky-500/60 font-semibold'
                    : 'bg-slate-100 dark:bg-[#141a24] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#263147]'
                }`}
              >
                Kalshi (USD)
              </button>
              <button
                type="button"
                onClick={() => setPlatform('polymarket')}
                className={`py-1.5 rounded text-center border transition-colors ${
                  platform === 'polymarket'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-sky-500/60 font-semibold'
                    : 'bg-slate-100 dark:bg-[#141a24] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#263147]'
                }`}
              >
                Polymarket (USDC)
              </button>
            </div>

            {/* Price & Shares Input */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Limit Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="0.99"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0.01)}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-50 dark:bg-[#0f141c] border border-slate-300 dark:border-[#263147] text-slate-900 dark:text-slate-100 font-bold focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] uppercase text-slate-500 dark:text-slate-400">Contracts (Shares)</label>
                  {initialEdge.recommendedSizeDollars > 0 && (
                    <button
                      type="button"
                      onClick={applyKellySize}
                      className="text-[9px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
                    >
                      <Zap className="w-2.5 h-2.5" /> Kelly Auto
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="10"
                  min="1"
                  value={shares}
                  onChange={(e) => setShares(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-50 dark:bg-[#0f141c] border border-slate-300 dark:border-[#263147] text-slate-900 dark:text-slate-100 font-bold focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Financial Calculations Box */}
            <div className="rounded-lg bg-slate-50 dark:bg-[#141a24] p-3 border border-slate-200 dark:border-[#263147] space-y-1.5 text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <span>Total Capital Required:</span>
                <span className="text-slate-900 dark:text-slate-100 font-bold">${totalCost.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Max Potential Payout:</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">${potentialPayout.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Net Profit / Max ROI:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  +${netProfit.toLocaleString()} (+{roiPct}%)
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-[#263147]">
                <span className="text-sky-600 dark:text-sky-400">Mathematical Expected Value:</span>
                <span className={`font-bold ${totalEv >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {totalEv >= 0 ? '+' : ''}${totalEv.toFixed(2)} ({evDollar >= 0 ? '+' : ''}{(evDollar * 100).toFixed(1)}%)
                </span>
              </div>
            </div>

            {!isAffordable && (
              <div className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded border border-rose-200 dark:border-rose-800/50">
                Insufficient cash balance. Available: ${cashBalance.toLocaleString()}
              </div>
            )}

            <button
              type="submit"
              disabled={!isAffordable || shares <= 0}
              className={`w-full py-2.5 rounded-lg font-bold text-sm font-mono tracking-wide transition-all ${
                !isAffordable || shares <= 0
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : side === 'YES'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white dark:text-slate-950 shadow-sm'
                  : 'bg-rose-600 hover:bg-rose-500 text-white dark:text-slate-950 shadow-sm'
              }`}
            >
              EXECUTE {shares.toLocaleString()} {side} (${totalCost.toLocaleString()})
            </button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};
