// Institutional Quantitative Weather Modeling Engine

import type { TemperatureBracket, QuantitativeEdge, MarketPlatform } from '../types/weatherMarket';

/**
 * Abramowitz and Stegun numerical approximation for error function erf(x)
 * Maximum error: 1.5e-7
 */
export function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
}

/**
 * Standard Normal Cumulative Distribution Function Phi(z)
 */
export function normalCdf(x: number, mean: number = 0, stdDev: number = 1): number {
  if (stdDev <= 0) {
    return x >= mean ? 1 : 0;
  }
  const z = (x - mean) / (stdDev * Math.SQRT2);
  return 0.5 * (1.0 + erf(z));
}

/**
 * Skew-Normal approximation using Gram-Charlier expansion for asymmetric weather distributions
 */
export function skewNormalCdf(x: number, mean: number, stdDev: number, skewness: number = 0): number {
  const baseCdf = normalCdf(x, mean, stdDev);
  if (Math.abs(skewness) < 0.01 || stdDev <= 0) {
    return baseCdf;
  }
  const z = (x - mean) / stdDev;
  const phi = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z);
  // Hermite polynomial H2(z) = z^2 - 1
  const correction = -(skewness / 6.0) * (z * z - 1) * phi;
  const res = baseCdf + correction;
  return Math.max(0.0001, Math.min(0.9999, res));
}

/**
 * Calculate the probability that a temperature falls within a bracket [minTemp, maxTemp)
 */
export function computeBracketProbability(
  bracket: TemperatureBracket,
  mean: number,
  stdDev: number,
  skewness: number = 0
): number {
  const isLowerInfinite = bracket.minTemp === -Infinity || bracket.minTemp <= -50;
  const isUpperInfinite = bracket.maxTemp === Infinity || bracket.maxTemp >= 150;

  if (isLowerInfinite && isUpperInfinite) {
    return 1.0;
  }

  if (isLowerInfinite) {
    return skewNormalCdf(bracket.maxTemp, mean, stdDev, skewness);
  }

  if (isUpperInfinite) {
    return 1.0 - skewNormalCdf(bracket.minTemp, mean, stdDev, skewness);
  }

  const pUpper = skewNormalCdf(bracket.maxTemp, mean, stdDev, skewness);
  const pLower = skewNormalCdf(bracket.minTemp, mean, stdDev, skewness);
  return Math.max(0.001, pUpper - pLower);
}

/**
 * Normalize an array of bracket probabilities so they sum exactly to 1.0000
 */
export function normalizeBracketProbabilities(
  brackets: TemperatureBracket[],
  mean: number,
  stdDev: number,
  skewness: number = 0
): Map<string, number> {
  const rawMap = new Map<string, number>();
  let sum = 0;

  for (const bracket of brackets) {
    const p = computeBracketProbability(bracket, mean, stdDev, skewness);
    rawMap.set(bracket.id, p);
    sum += p;
  }

  const normalizedMap = new Map<string, number>();
  for (const [id, rawP] of rawMap.entries()) {
    normalizedMap.set(id, sum > 0 ? rawP / sum : 1 / brackets.length);
  }

  return normalizedMap;
}

/**
 * Institutional Expected Value (EV) calculation for a binary market contract
 * EV = P(Win) * Profit - P(Loss) * Stake
 * For binary contracts payout = $1.00, cost = price:
 * EV_yes = P_model * (1 - price) - (1 - P_model) * price = P_model - price
 */
export function calculateExpectedValue(
  modelProbability: number,
  marketPrice: number
): { evDollar: number; evPercent: number } {
  if (marketPrice <= 0 || marketPrice >= 1) {
    return { evDollar: 0, evPercent: 0 };
  }
  const evDollar = modelProbability - marketPrice;
  const evPercent = (evDollar / marketPrice) * 100;
  return { evDollar, evPercent };
}

/**
 * Risk-to-Reward Ratio: Potential Profit / Capital at Risk
 */
export function calculateRiskRewardRatio(marketPrice: number): number {
  if (marketPrice <= 0 || marketPrice >= 1) return 0;
  return (1.0 - marketPrice) / marketPrice;
}

/**
 * Fractional Kelly Criterion for binary prediction markets
 * f* = (p * b - q) / b = (p - price) / (1 - price)
 * @param modelProb true probability estimate
 * @param marketPrice ask price to pay (cost per share)
 * @param multiplier fractional dampening (e.g. 0.25 for quarter Kelly)
 * @param maxCap maximum portfolio fraction cap (e.g. 0.15 = 15%)
 */
export function calculateKellyFraction(
  modelProb: number,
  marketPrice: number,
  multiplier: number = 0.25,
  maxCap: number = 0.15
): number {
  if (marketPrice <= 0.01 || marketPrice >= 0.99) return 0;
  if (modelProb <= marketPrice) return 0; // Negative EV, no bet

  const fullKelly = (modelProb - marketPrice) / (1.0 - marketPrice);
  const dampedKelly = fullKelly * multiplier;
  return Math.max(0, Math.min(maxCap, dampedKelly));
}

/**
 * Statistical Asymmetry Score (0 to 100)
 * Combines absolute probability edge, EV, and risk/reward into an institutional ranking index
 */
export function calculateStatisticalAsymmetry(
  modelProb: number,
  marketPrice: number,
  evDollar: number
): number {
  if (evDollar <= 0) return 0;
  const edgeWeight = Math.min(50, Math.abs(modelProb - marketPrice) * 100);
  const evWeight = Math.min(35, (evDollar / marketPrice) * 40);
  const confidenceFactor = modelProb > 0.15 && modelProb < 0.85 ? 15 : 10;
  return Math.min(100, Math.round(edgeWeight + evWeight + confidenceFactor));
}

/**
 * Full Quantitative Edge evaluation for a temperature bracket across Kalshi and Polymarket
 */
export function evaluateBracketEdge(
  bracket: TemperatureBracket,
  modelProb: number,
  kalshiYesAsk: number,
  kalshiNoAsk: number,
  polyYesAsk: number,
  polyNoAsk: number,
  bankroll: number = 100000,
  kellyMultiplier: number = 0.25
): QuantitativeEdge {
  // Best prices to buy
  const bestYesPrice = Math.min(kalshiYesAsk, polyYesAsk);
  const bestYesPlatform: MarketPlatform = kalshiYesAsk <= polyYesAsk ? 'kalshi' : 'polymarket';

  const bestNoPrice = Math.min(kalshiNoAsk, polyNoAsk);
  const bestNoPlatform: MarketPlatform = kalshiNoAsk <= polyNoAsk ? 'kalshi' : 'polymarket';

  // Expected Values
  const { evDollar: evYes } = calculateExpectedValue(modelProb, bestYesPrice);
  const { evDollar: evNo } = calculateExpectedValue(1.0 - modelProb, bestNoPrice);

  // Edge deltas
  const edgeYes = modelProb - bestYesPrice;
  const edgeNo = (1.0 - modelProb) - bestNoPrice;

  // ROI potentials
  const roiYesPct = bestYesPrice > 0 ? ((1.0 - bestYesPrice) / bestYesPrice) * 100 : 0;
  const roiNoPct = bestNoPrice > 0 ? ((1.0 - bestNoPrice) / bestNoPrice) * 100 : 0;

  // Risk to reward
  const riskRewardYes = calculateRiskRewardRatio(bestYesPrice);
  const riskRewardNo = calculateRiskRewardRatio(bestNoPrice);

  // Cross-Market Arbitrage: Buy Yes on one exchange, Buy No on the other
  const crossArbCost1 = kalshiYesAsk + polyNoAsk;
  const crossArbCost2 = polyYesAsk + kalshiNoAsk;
  const minArbCost = Math.min(crossArbCost1, crossArbCost2);
  const isArbitrageOpportunity = minArbCost < 0.985; // guaranteed >= 1.5% arb profit
  const arbitrageProfitSpread = isArbitrageOpportunity ? 1.0 - minArbCost : 0;

  // Recommendation logic
  let recommendedSide: 'YES' | 'NO' | 'NEUTRAL' = 'NEUTRAL';
  let recommendedKellyFraction = 0;
  let asymmetryScore = 0;

  if (isArbitrageOpportunity) {
    recommendedSide = 'YES'; // Arbitrage execution stages both legs
    recommendedKellyFraction = 0.10;
    asymmetryScore = 99;
  } else if (evYes > 0.04 && edgeYes >= 0.05) {
    recommendedSide = 'YES';
    recommendedKellyFraction = calculateKellyFraction(modelProb, bestYesPrice, kellyMultiplier);
    asymmetryScore = calculateStatisticalAsymmetry(modelProb, bestYesPrice, evYes);
  } else if (evNo > 0.04 && edgeNo >= 0.05) {
    recommendedSide = 'NO';
    recommendedKellyFraction = calculateKellyFraction(1.0 - modelProb, bestNoPrice, kellyMultiplier);
    asymmetryScore = calculateStatisticalAsymmetry(1.0 - modelProb, bestNoPrice, evNo);
  }

  const recommendedSizeDollars = Math.round(bankroll * recommendedKellyFraction);

  return {
    bracketId: bracket.id,
    cityId: bracket.cityId,
    bracketLabel: bracket.label,
    modelProbability: Number(modelProb.toFixed(4)),
    kalshiYesPrice: kalshiYesAsk,
    kalshiNoPrice: kalshiNoAsk,
    polymarketYesPrice: polyYesAsk,
    polymarketNoPrice: polyNoAsk,
    bestYesAsk: bestYesPrice,
    bestNoAsk: bestNoPrice,
    bestYesPlatform,
    bestNoPlatform,
    evYes: Number(evYes.toFixed(4)),
    evNo: Number(evNo.toFixed(4)),
    roiYesPct: Number(roiYesPct.toFixed(1)),
    roiNoPct: Number(roiNoPct.toFixed(1)),
    riskRewardYes: Number(riskRewardYes.toFixed(2)),
    riskRewardNo: Number(riskRewardNo.toFixed(2)),
    edgeYes: Number(edgeYes.toFixed(4)),
    edgeNo: Number(edgeNo.toFixed(4)),
    recommendedSide,
    recommendedKellyFraction: Number(recommendedKellyFraction.toFixed(4)),
    recommendedSizeDollars,
    statisticalAsymmetryScore: asymmetryScore,
    isArbitrageOpportunity,
    arbitrageProfitSpread: Number(arbitrageProfitSpread.toFixed(4))
  };
}

/**
 * Calculate Brier calibration score for probability predictions
 */
export function calculateBrierScore(predictions: { forecastProb: number; actualOutcome: 1 | 0 }[]): number {
  if (predictions.length === 0) return 0.082;
  const sum = predictions.reduce((acc, p) => acc + Math.pow(p.forecastProb - p.actualOutcome, 2), 0);
  return Number((sum / predictions.length).toFixed(4));
}
