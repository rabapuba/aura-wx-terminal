import React, { useState } from 'react';
import type { MarketContract, MarketPlatform, ContractSide } from '../../types/weatherMarket';
import { GlassCard } from '../common/GlassCard';
import { ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';

interface OrderBookWidgetProps {
  kalshiContract?: MarketContract;
  polyContract?: MarketContract;
  onSelectPrice?: (platform: MarketPlatform, side: ContractSide, price: number) => void;
}

export const OrderBookWidget: React.FC<OrderBookWidgetProps> = ({
  kalshiContract,
  polyContract,
  onSelectPrice
}) => {
  const [activePlatform, setActivePlatform] = useState<MarketPlatform>('kalshi');
  const [activeSide, setActiveSide] = useState<ContractSide>('YES');

  const currentContract = activePlatform === 'kalshi' ? kalshiContract : polyContract;
  const currentBook = currentContract ? (activeSide === 'YES' ? currentContract.yesBook : currentContract.noBook) : null;

  const maxBidTotal = currentBook?.bids[currentBook.bids.length - 1]?.total || 1000;
  const maxAskTotal = currentBook?.asks[currentBook.asks.length - 1]?.total || 1000;
  const maxTotal = Math.max(maxBidTotal, maxAskTotal, 1);

  return (
    <GlassCard className="p-3 sm:p-4 flex flex-col h-full">
      {/* Header: Platform & Side Switchers */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActivePlatform('kalshi')}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              activePlatform === 'kalshi'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
            }`}
          >
            KALSHI (USD)
          </button>
          <button
            onClick={() => setActivePlatform('polymarket')}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              activePlatform === 'polymarket'
                ? 'bg-purple-950/80 text-purple-300 border border-purple-700/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
            }`}
          >
            POLYMARKET (USDC)
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSide('YES')}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              activeSide === 'YES'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-bold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
            }`}
          >
            YES BOOK
          </button>
          <button
            onClick={() => setActiveSide('NO')}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              activeSide === 'NO'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 font-bold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
            }`}
          >
            NO BOOK
          </button>
        </div>
      </div>

      {/* CLOB Stats Bar */}
      {currentBook && (
        <div className="grid grid-cols-3 gap-2 px-2 py-1.5 mb-2 bg-slate-950/60 rounded border border-slate-800/80 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[10px]">MID PRICE</span>
            <span className="text-slate-200 font-semibold">${currentBook.midPrice.toFixed(2)}</span>
          </div>
          <div className="text-center">
            <span className="text-slate-500 block text-[10px]">SPREAD</span>
            <span className="text-amber-400 font-semibold">${currentBook.spread.toFixed(2)}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block text-[10px]">24H VOL</span>
            <span className="text-slate-300">${currentBook.volume24h.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Depth Ladder Column Headers */}
      <div className="grid grid-cols-3 text-[10px] font-mono text-slate-500 px-2 py-1 uppercase tracking-wider">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* Order Book Depth Rows */}
      {currentBook ? (
        <div className="flex-1 flex flex-col justify-between space-y-1 font-mono text-xs overflow-hidden">
          {/* Asks (Sell Orders) - Displayed in reverse so lowest ask is near the spread */}
          <div className="flex flex-col-reverse gap-0.5">
            {currentBook.asks.slice(0, 5).map((ask, idx) => {
              const depthPct = Math.min(100, Math.round((ask.total / maxTotal) * 100));
              return (
                <div
                  key={`ask-${idx}`}
                  onClick={() => onSelectPrice && onSelectPrice(activePlatform, activeSide, ask.price)}
                  className="group relative flex items-center justify-between px-2 py-1 rounded cursor-pointer hover:bg-rose-950/30 transition-colors"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-rose-500/15 rounded-r transition-all"
                    style={{ width: `${depthPct}%` }}
                  />
                  <span className="relative z-10 text-rose-400 font-bold group-hover:underline">
                    ${ask.price.toFixed(2)}
                  </span>
                  <span className="relative z-10 text-slate-300 text-right">
                    {ask.size.toLocaleString()}
                  </span>
                  <span className="relative z-10 text-slate-500 text-right text-[11px]">
                    {ask.total.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Spread Divider Bar */}
          <div className="flex items-center justify-between px-3 py-1.5 my-1 bg-slate-800/40 rounded border border-slate-700/50 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[10px] uppercase text-slate-500">Spread:</span>
              <span className="font-semibold text-slate-200">${currentBook.spread.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1 text-cyan-400">
              <Zap className="w-3 h-3" />
              <span>Last: ${currentBook.lastPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Bids (Buy Orders) */}
          <div className="flex flex-col gap-0.5">
            {currentBook.bids.slice(0, 5).map((bid, idx) => {
              const depthPct = Math.min(100, Math.round((bid.total / maxTotal) * 100));
              return (
                <div
                  key={`bid-${idx}`}
                  onClick={() => onSelectPrice && onSelectPrice(activePlatform, activeSide, bid.price)}
                  className="group relative flex items-center justify-between px-2 py-1 rounded cursor-pointer hover:bg-emerald-950/30 transition-colors"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 rounded-r transition-all"
                    style={{ width: `${depthPct}%` }}
                  />
                  <span className="relative z-10 text-emerald-400 font-bold group-hover:underline">
                    ${bid.price.toFixed(2)}
                  </span>
                  <span className="relative z-10 text-slate-300 text-right">
                    {bid.size.toLocaleString()}
                  </span>
                  <span className="relative z-10 text-slate-500 text-right text-[11px]">
                    {bid.total.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs font-mono text-slate-500">
          Syncing CLOB order book...
        </div>
      )}
    </GlassCard>
  );
};
