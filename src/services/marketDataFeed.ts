// Kalshi & Polymarket Real-Time CLOB Market Data Feed

import type {
  CityId,
  TemperatureBracket,
  MarketContract,
  OrderBook,
  OrderLevel,
  MarketPlatform,
  TradeOrder
} from '../types/weatherMarket';

/**
 * Generate synthetic CLOB depth ladder with realistic liquidity distribution
 */
export function generateOrderBook(
  fairPrice: number,
  platform: MarketPlatform,
  spreadCents: number = 2
): OrderBook {
  const clampedFair = Math.max(0.05, Math.min(0.95, fairPrice));
  const halfSpread = (spreadCents / 100) / 2;

  let bestBid = Math.max(0.01, Math.min(0.98, Number((clampedFair - halfSpread).toFixed(2))));
  let bestAsk = Math.max(bestBid + 0.01, Math.min(0.99, Number((clampedFair + halfSpread).toFixed(2))));

  // Platform specific characteristics (Polymarket has slightly wider spread on retail hours)
  if (platform === 'polymarket' && Math.random() > 0.5) {
    bestAsk = Math.min(0.99, bestAsk + 0.01);
  }

  // Generate 5 bid levels
  const bids: OrderLevel[] = [];
  let cumBidTotal = 0;
  for (let i = 0; i < 5; i++) {
    const price = Number((bestBid - i * 0.01).toFixed(2));
    if (price <= 0) break;
    // Liquidity increases deeper into the book
    const size = Math.round(250 + (i * 380) + Math.random() * 400);
    cumBidTotal += size;
    bids.push({ price, size, total: cumBidTotal });
  }

  // Generate 5 ask levels
  const asks: OrderLevel[] = [];
  let cumAskTotal = 0;
  for (let i = 0; i < 5; i++) {
    const price = Number((bestAsk + i * 0.01).toFixed(2));
    if (price >= 1.0) break;
    const size = Math.round(220 + (i * 360) + Math.random() * 420);
    cumAskTotal += size;
    asks.push({ price, size, total: cumAskTotal });
  }

  const spread = Number((bestAsk - bestBid).toFixed(2));
  const midPrice = Number(((bestBid + bestAsk) / 2).toFixed(3));
  const lastPrice = Math.random() > 0.5 ? bestBid : bestAsk;

  return {
    bids,
    asks,
    spread,
    midPrice,
    lastPrice,
    volume24h: Math.round(45000 + Math.random() * 85000),
    openInterest: Math.round(18000 + Math.random() * 32000),
    lastUpdated: Date.now()
  };
}

/**
 * Generate complementary OrderBook for the NO contract (price ~ 1 - YES price)
 */
export function generateNoOrderBook(yesBook: OrderBook): OrderBook {
  const bestYesBid = yesBook.bids[0]?.price ?? 0.5;
  const bestYesAsk = yesBook.asks[0]?.price ?? 0.52;

  // Best No Bid is approximately 1 - Best Yes Ask
  const bestNoBid = Math.max(0.01, Math.min(0.98, Number((1.0 - bestYesAsk).toFixed(2))));
  // Best No Ask is approximately 1 - Best Yes Bid
  const bestNoAsk = Math.max(bestNoBid + 0.01, Math.min(0.99, Number((1.0 - bestYesBid).toFixed(2))));

  const bids: OrderLevel[] = [];
  let cumBidTotal = 0;
  for (let i = 0; i < 5; i++) {
    const price = Number((bestNoBid - i * 0.01).toFixed(2));
    if (price <= 0) break;
    const size = Math.round(240 + (i * 350) + Math.random() * 350);
    cumBidTotal += size;
    bids.push({ price, size, total: cumBidTotal });
  }

  const asks: OrderLevel[] = [];
  let cumAskTotal = 0;
  for (let i = 0; i < 5; i++) {
    const price = Number((bestNoAsk + i * 0.01).toFixed(2));
    if (price >= 1.0) break;
    const size = Math.round(230 + (i * 370) + Math.random() * 380);
    cumAskTotal += size;
    asks.push({ price, size, total: cumAskTotal });
  }

  return {
    bids,
    asks,
    spread: Number((bestNoAsk - bestNoBid).toFixed(2)),
    midPrice: Number(((bestNoBid + bestNoAsk) / 2).toFixed(3)),
    lastPrice: bestNoAsk,
    volume24h: Math.round(yesBook.volume24h * 0.85),
    openInterest: Math.round(yesBook.openInterest * 0.9),
    lastUpdated: Date.now()
  };
}

/**
 * Instantiate full MarketContract for a temperature bracket on a given platform
 */
export function createMarketContract(
  bracket: TemperatureBracket,
  fairPrice: number,
  platform: MarketPlatform
): MarketContract {
  const tickerPrefix = platform === 'kalshi' ? 'KX' : 'POLY';
  const ticker = `${tickerPrefix}-${bracket.cityId.toUpperCase().slice(0, 3)}-${bracket.id}`;

  const yesBook = generateOrderBook(fairPrice, platform);
  const noBook = generateNoOrderBook(yesBook);

  const bestYesBid = yesBook.bids[0]?.price ?? 0.48;
  const bestYesAsk = yesBook.asks[0]?.price ?? 0.52;
  const bestNoBid = noBook.bids[0]?.price ?? 0.48;
  const bestNoAsk = noBook.asks[0]?.price ?? 0.52;

  return {
    id: `${platform}-${bracket.id}`,
    bracketId: bracket.id,
    cityId: bracket.cityId,
    platform,
    ticker,
    title: `${bracket.cityId.toUpperCase()} Hourly Temp ${bracket.label}`,
    side: 'YES',
    yesBook,
    noBook,
    bestYesBid,
    bestYesAsk,
    bestNoBid,
    bestNoAsk,
    lastTradePrice: bestYesBid,
    lastTradeTime: Date.now() - Math.floor(Math.random() * 12000),
    impliedProbability: yesBook.midPrice
  };
}

/**
 * Apply live micro-tick perturbation to order book
 */
export function applyMicroTick(contract: MarketContract): MarketContract {
  const updatedYesBook = { ...contract.yesBook };
  const updatedNoBook = { ...contract.noBook };

  // 40% chance to wiggle top size or price by 1 cent
  const shiftChance = Math.random();
  if (shiftChance > 0.6) {
    const delta = Math.random() > 0.5 ? 0.01 : -0.01;
    const newBestBid = Math.max(0.01, Math.min(0.97, Number((contract.bestYesBid + delta).toFixed(2))));
    const newBestAsk = Math.max(newBestBid + 0.01, Math.min(0.99, Number((contract.bestYesAsk + delta).toFixed(2))));

    if (updatedYesBook.bids[0]) {
      updatedYesBook.bids[0] = {
        price: newBestBid,
        size: Math.max(50, updatedYesBook.bids[0].size + Math.round((Math.random() - 0.48) * 120)),
        total: updatedYesBook.bids[0].total
      };
    }
    if (updatedYesBook.asks[0]) {
      updatedYesBook.asks[0] = {
        price: newBestAsk,
        size: Math.max(50, updatedYesBook.asks[0].size + Math.round((Math.random() - 0.48) * 120)),
        total: updatedYesBook.asks[0].total
      };
    }

    updatedYesBook.midPrice = Number(((newBestBid + newBestAsk) / 2).toFixed(3));
    updatedYesBook.spread = Number((newBestAsk - newBestBid).toFixed(2));
    updatedYesBook.lastUpdated = Date.now();

    return {
      ...contract,
      yesBook: updatedYesBook,
      noBook: updatedNoBook,
      bestYesBid: newBestBid,
      bestYesAsk: newBestAsk,
      lastTradePrice: Math.random() > 0.5 ? newBestBid : newBestAsk,
      lastTradeTime: Date.now(),
      impliedProbability: updatedYesBook.midPrice
    };
  }

  return contract;
}

/**
 * Generate simulated execution trade tape item
 */
export function generateSyntheticTrade(
  cityId: CityId,
  bracket: TemperatureBracket,
  platform: MarketPlatform,
  price: number,
  side: 'YES' | 'NO'
): TradeOrder {
  const shares = Math.round(50 + Math.random() * 450);
  const totalCost = Number((shares * price).toFixed(2));
  const potentialPayout = Number((shares * 1.0).toFixed(2));

  return {
    orderId: `ord-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    bracketId: bracket.id,
    cityId,
    platform,
    side,
    type: 'MARKET',
    price,
    shares,
    totalCost,
    potentialPayout,
    expectedValue: Number(((1.0 - price) * 0.15).toFixed(2)),
    status: 'FILLED',
    timestamp: Date.now(),
    filledShares: shares,
    averageFillPrice: price
  };
}
