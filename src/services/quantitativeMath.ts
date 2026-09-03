// Institutional Quantitative Math & Expected Value Engine for Daily High (TMAX) Prediction Markets

import type {
  TemperatureBracket,
  MarketPlatform,
  QuantitativeEdge,
  StrategyPhaseTag
} from '../types/weatherMarket';

/**
 * Abramowitz and Stegun numerical approximation for erf(x)
 */
export function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
}

/**
 * Standard Normal Cumulative Distribution Function Phi(z)
 */
export function normalCDF(x: number, mean: number, stdDev: number): number {
  if (stdDev <= 0) return x >= mean ? 1.0 : 0.0;
  const z = (x - mean) / (stdDev * Math.SQRT2);
  return 0.5 * (1.0 + erf(z));
}

/**
 * Compute true probability of Daily High (TMAX) falling in [minTemp, maxTemp]
 * Conditioned on the currently observed runningDailyMax
 */
export function computeDailyHighBracketProbability(
  minTemp: number,
  maxTemp: number,
  mean: number,
  stdDev: number,
  runningMax: number = 0
): number {
  // If the day's high has ALREADY exceeded maxTemp, bracket is impossible!
  if (runningMax >= maxTemp) {
    return 0.0001; // Floor to epsilon
  }

  // Raw unconditioned probabilities
  const pMin = minTemp === -Infinity ? 0.0 : normalCDF(minTemp, mean, stdDev);
  const pMax = maxTemp === Infinity ? 1.0 : normalCDF(maxTemp, mean, stdDev);
  const rawProb = Math.max(0.0001, pMax - pMin);

  // If running max has entered bracket, condition on T >= runningMax
  if (runningMax > minTemp) {
    const pRunning = normalCDF(runningMax, mean, stdDev);
    const probRemainingHigher = Math.max(0.001, 1.0 - pRunning);
    const conditionalInBracket = Math.max(0, pMax - pRunning) / probRemainingHigher;
    return Math.max(0.0001, Math.min(0.9999, conditionalInBracket));
  }

  return Math.max(0.0001, Math.min(0.9999, rawProb));
}

/**
 * Calculate expected value (EV) for binary prediction market contracts
 */
export function calculateExpectedValue(modelProbability: number, contractPrice: number): number {
  if (contractPrice <= 0 || contractPrice >= 1.0) return 0;
  return modelProbability * (1.0 - contractPrice) - (1.0 - modelProbability) * contractPrice;
}

/**
 * Kelly Criterion fraction for optimal capital growth
 */
export function calculateKellyFraction(
  modelProbability: number,
  contractPrice: number,
  fractionalMultiplier: number = 0.25
): number {
  if (contractPrice <= 0.01 || contractPrice >= 0.99) return 0;
  const b = (1.0 - contractPrice) / contractPrice;
  const p = modelProbability;
  const q = 1.0 - p;

  const rawKelly = (b * p - q) / b;
  if (rawKelly <= 0) return 0;

  const scaledKelly = rawKelly * fractionalMultiplier;
  return Math.min(0.20, Math.max(0, scaledKelly)); // Cap at 20%
}

/**
 * Full quantitative edge evaluation for a Daily High bracket across Kalshi and Polymarket
 */
export function evaluateDailyHighEdge(
  bracket: TemperatureBracket,
  meanTmax: number,
  stdDev: number,
  runningMax: number,
  kalshiYesAsk: number,
  kalshiNoAsk: number,
  polyYesAsk: number,
  polyNoAsk: number,
  bankroll: number = 100000,
  kellyMultiplier: number = 0.25
): QuantitativeEdge {
  const modelProb = computeDailyHighBracketProbability(
    bracket.minTemp,
    bracket.maxTemp,
    meanTmax,
    stdDev,
    runningMax
  );

  // Best execution routing
  const bestYesPrice = Math.min(kalshiYesAsk, polyYesAsk);
  const bestNoPrice = Math.min(kalshiNoAsk, polyNoAsk);
  const bestYesPlatform: MarketPlatform = kalshiYesAsk <= polyYesAsk ? 'kalshi' : 'polymarket';
  const bestNoPlatform: MarketPlatform = kalshiNoAsk <= polyNoAsk ? 'kalshi' : 'polymarket';

  // Expected Value
  const evYes = calculateExpectedValue(modelProb, bestYesPrice);
  const evNo = calculateExpectedValue(1.0 - modelProb, bestNoPrice);
  const edgeYes = modelProb - bestYesPrice;
  const edgeNo = (1.0 - modelProb) - bestNoPrice;

  // Potential ROIs
  const roiYesPct = bestYesPrice > 0 ? ((1.0 - bestYesPrice) / bestYesPrice) * 100 : 0;
  const roiNoPct = bestNoPrice > 0 ? ((1.0 - bestNoPrice) / bestNoPrice) * 100 : 0;

  // Arbitrage spread
  const crossArbCost1 = kalshiYesAsk + polyNoAsk;
  const crossArbCost2 = polyYesAsk + kalshiNoAsk;
  const minArbCost = Math.min(crossArbCost1, crossArbCost2);
  const isArbitrageOpportunity = minArbCost < 0.985;
  const arbitrageProfitSpread = isArbitrageOpportunity ? 1.0 - minArbCost : 0;

  // Recommendation & Strategy Classification
  let recommendedSide: 'YES' | 'NO' | 'NEUTRAL' = 'NEUTRAL';
  let recommendedKellyFraction = 0;
  let asymmetryScore = 0;
  let strategyTag: StrategyPhaseTag = 'NEUTRAL';

  if (isArbitrageOpportunity) {
    recommendedSide = 'YES';
    recommendedKellyFraction = 0.10;
    asymmetryScore = 99;
    strategyTag = 'ARBITRAGE';
  } else if (evYes > 0.04 && edgeYes >= 0.05) {
    recommendedSide = 'YES';
    recommendedKellyFraction = calculateKellyFraction(modelProb, bestYesPrice, kellyMultiplier);
    asymmetryScore = Math.min(100, Math.round((evYes * 220) + (edgeYes * 180) + (roiYesPct > 100 ? 15 : 5)));

    if (bestYesPrice <= 0.35 && modelProb >= 0.45) {
      strategyTag = 'EARLY_ALPHA';
      asymmetryScore = Math.min(100, asymmetryScore + 10);
    } else if (modelProb >= 0.78) {
      strategyTag = 'LATE_SWEEP';
    } else {
      strategyTag = 'CORE_EDGE';
    }
  } else if (evNo > 0.04 && edgeNo >= 0.05) {
    recommendedSide = 'NO';
    recommendedKellyFraction = calculateKellyFraction(1.0 - modelProb, bestNoPrice, kellyMultiplier);
    asymmetryScore = Math.min(100, Math.round((evNo * 220) + (edgeNo * 180) + (roiNoPct > 100 ? 15 : 5)));

    if (bestNoPrice <= 0.35 && (1.0 - modelProb) >= 0.45) {
      strategyTag = 'EARLY_ALPHA';
      asymmetryScore = Math.min(100, asymmetryScore + 10);
    } else if ((1.0 - modelProb) >= 0.78) {
      strategyTag = 'LATE_SWEEP';
    } else {
      strategyTag = 'CORE_EDGE';
    }
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
    riskRewardYes: bestYesPrice > 0 ? Number(((1.0 - bestYesPrice) / bestYesPrice).toFixed(2)) : 0,
    riskRewardNo: bestNoPrice > 0 ? Number(((1.0 - bestNoPrice) / bestNoPrice).toFixed(2)) : 0,
    edgeYes: Number(edgeYes.toFixed(4)),
    edgeNo: Number(edgeNo.toFixed(4)),
    recommendedSide,
    recommendedKellyFraction: Number(recommendedKellyFraction.toFixed(4)),
    recommendedSizeDollars,
    statisticalAsymmetryScore: asymmetryScore,
    isArbitrageOpportunity,
    arbitrageProfitSpread: Number(arbitrageProfitSpread.toFixed(4)),
    strategyTag,
    directLinks: bracket.directLinks
  };
}
