// Central Institutional Weather Prediction Market Context & Reactive Engine

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  CityId,
  TemperatureBracket,
  WeatherForecast,
  MarketContract,
  QuantitativeEdge,
  HourlyPeriod,
  Position,
  SettledContract,
  TradeOrder,
  AgentConfig,
  AuditLog,
  SystemHealth,
  PortfolioSummary,
  ContractSide,
  MarketPlatform
} from '../types/weatherMarket';
import { CORE_CITIES, generateTemperatureBrackets, fetchWeatherNextForecast } from '../services/weatherEngine';
import { normalizeBracketProbabilities, evaluateBracketEdge } from '../services/quantitativeMath';
import { createMarketContract, applyMicroTick, generateSyntheticTrade } from '../services/marketDataFeed';
import { createHourlyPeriod, resolveWinningBracket, type RolloverResolution } from '../services/autoPeriodEngine';

export interface WeatherMarketState {
  selectedCityId: CityId;
  setSelectedCityId: (id: CityId) => void;
  activePeriod: HourlyPeriod;
  speedMultiplier: number;
  setSpeedMultiplier: (speed: number) => void;
  bracketsByCity: Record<CityId, TemperatureBracket[]>;
  forecastsByCity: Record<CityId, WeatherForecast | null>;
  kalshiContracts: Record<string, MarketContract>;
  polymarketContracts: Record<string, MarketContract>;
  allEdges: QuantitativeEdge[];
  cityEdges: Record<CityId, QuantitativeEdge[]>;
  positions: Position[];
  settledHistory: SettledContract[];
  tradeTape: TradeOrder[];
  auditLogs: AuditLog[];
  systemHealth: SystemHealth;
  portfolio: PortfolioSummary;
  agentConfig: AgentConfig;
  updateAgentConfig: (updates: Partial<AgentConfig>) => void;
  executeTrade: (
    bracketId: string,
    cityId: CityId,
    platform: MarketPlatform,
    side: ContractSide,
    shares: number,
    price: number
  ) => void;
  closePosition: (positionId: string) => void;
  forcePeriodRoll: () => void;
  activeSettlementNotice: RolloverResolution | null;
  dismissSettlementNotice: () => void;
  refreshForecasts: () => Promise<void>;
  isIngestingForecasts: boolean;
}

const WeatherMarketContext = createContext<WeatherMarketState | null>(null);

const DEFAULT_AGENT_CONFIG: AgentConfig = {
  autoTradingEnabled: false,
  minEvHurdlePct: 6.0,
  kellyFractionMultiplier: 0.25,
  maxPositionSizeDollars: 3000,
  maxPortfolioRiskPct: 25,
  stopLossPct: 35,
  takeProfitPct: 75,
  autoHedgeArbitrage: true,
  preMarketExecutionDelayMs: 400,
  preferredPlatform: 'AUTO_BEST'
};

const CITY_KEYS: CityId[] = ['chicago', 'newyork', 'losangeles', 'miami', 'austin'];

export const WeatherMarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCityId, setSelectedCityId] = useState<CityId>('chicago');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [activePeriod, setActivePeriod] = useState<HourlyPeriod>(() => createHourlyPeriod());
  const [isIngestingForecasts, setIsIngestingForecasts] = useState<boolean>(false);
  const [activeSettlementNotice, setActiveSettlementNotice] = useState<RolloverResolution | null>(null);

  // Core Market Data Stores
  const [bracketsByCity, setBracketsByCity] = useState<Record<CityId, TemperatureBracket[]>>({} as Record<CityId, TemperatureBracket[]>);
  const [forecastsByCity, setForecastsByCity] = useState<Record<CityId, WeatherForecast | null>>({} as Record<CityId, WeatherForecast | null>);
  const [kalshiContracts, setKalshiContracts] = useState<Record<string, MarketContract>>({});
  const [polymarketContracts, setPolymarketContracts] = useState<Record<string, MarketContract>>({});
  const [allEdges, setAllEdges] = useState<QuantitativeEdge[]>([]);
  const [cityEdges, setCityEdges] = useState<Record<CityId, QuantitativeEdge[]>>({} as Record<CityId, QuantitativeEdge[]>);

  // Portfolio & Logs
  const [positions, setPositions] = useState<Position[]>([]);
  const [settledHistory, setSettledHistory] = useState<SettledContract[]>([]);
  const [tradeTape, setTradeTape] = useState<TradeOrder[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>(DEFAULT_AGENT_CONFIG);
  const [portfolio, setPortfolio] = useState<PortfolioSummary>({
    cashBalance: 100000.0,
    investedCapital: 0.0,
    unrealizedPnL: 0.0,
    realizedPnL: 0.0,
    totalPortfolioValue: 100000.0,
    winRatePct: 68.4,
    totalTradesCount: 142,
    sharpeRatio: 2.38,
    maxDrawdownPct: 4.2
  });

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    kalshiApiStatus: 'ONLINE',
    kalshiLatencyMs: 14,
    polymarketApiStatus: 'ONLINE',
    polymarketLatencyMs: 22,
    weatherNextApiStatus: 'ONLINE',
    weatherNextLatencyMs: 8,
    activeWebsockets: 3,
    lastHeartbeat: Date.now(),
    cpuLoadPct: 12.4,
    memoryUsageMb: 84.6
  });

  const addAuditLog = useCallback((
    severity: AuditLog['severity'],
    category: AuditLog['category'],
    message: string,
    cityId?: CityId,
    dataPayload?: Record<string, unknown>
  ) => {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      severity,
      category,
      message,
      cityId,
      dataPayload
    };
    setAuditLogs((prev) => [log, ...prev.slice(0, 99)]);
  }, []);

  // Initialize or Re-initialize period markets and forecasts
  const initializePeriod = useCallback(async (period: HourlyPeriod) => {
    setIsIngestingForecasts(true);
    addAuditLog('INFO', 'WEATHER_NEXT', `Ingesting Google WeatherNext 3 high-resolution forecasts for 5 core cities (Target: ${new Date(period.endTime).toLocaleTimeString()})`);

    const newBrackets: Record<CityId, TemperatureBracket[]> = {} as Record<CityId, TemperatureBracket[]>;
    const newForecasts: Record<CityId, WeatherForecast | null> = {} as Record<CityId, WeatherForecast | null>;
    const newKalshi: Record<string, MarketContract> = {};
    const newPoly: Record<string, MarketContract> = {};
    const newCityEdges: Record<CityId, QuantitativeEdge[]> = {} as Record<CityId, QuantitativeEdge[]>;
    const allEdgesList: QuantitativeEdge[] = [];

    for (const cityId of CITY_KEYS) {
      try {
        const forecast = await fetchWeatherNextForecast(cityId, period.endTime);
        newForecasts[cityId] = forecast;

        // Generate 5 strike brackets centered on current forecast
        const brackets = generateTemperatureBrackets(cityId, forecast.forecastMeanTemp);
        newBrackets[cityId] = brackets;

        // Compute normalized probabilities from WeatherNext Gaussian/Skew distribution
        const probMap = normalizeBracketProbabilities(
          brackets,
          forecast.forecastMeanTemp,
          forecast.standardDeviation,
          forecast.skewness
        );

        const edgesForCity: QuantitativeEdge[] = [];

        for (const bracket of brackets) {
          const modelProb = probMap.get(bracket.id) ?? 0.2;

          // Realistic synthetic market fair price: model probability + slight market maker margin/noise
          const kalshiFair = Math.max(0.04, Math.min(0.96, modelProb + (Math.random() * 0.08 - 0.04)));
          const polyFair = Math.max(0.04, Math.min(0.96, modelProb + (Math.random() * 0.09 - 0.045)));

          const kContract = createMarketContract(bracket, kalshiFair, 'kalshi');
          const pContract = createMarketContract(bracket, polyFair, 'polymarket');

          newKalshi[bracket.id] = kContract;
          newPoly[bracket.id] = pContract;

          // Calculate institutional Expected Value and Edge
          const edge = evaluateBracketEdge(
            bracket,
            modelProb,
            kContract.bestYesAsk,
            kContract.bestNoAsk,
            pContract.bestYesAsk,
            pContract.bestNoAsk,
            portfolio.cashBalance,
            agentConfig.kellyFractionMultiplier
          );

          edgesForCity.push(edge);
          allEdgesList.push(edge);
        }

        newCityEdges[cityId] = edgesForCity;
      } catch (err) {
        console.error(`Error initializing city ${cityId}:`, err);
      }
    }

    // Sort edges globally by Statistical Asymmetry (highest EV / edge first)
    allEdgesList.sort((a, b) => b.statisticalAsymmetryScore - a.statisticalAsymmetryScore);

    setBracketsByCity(newBrackets);
    setForecastsByCity(newForecasts);
    setKalshiContracts(newKalshi);
    setPolymarketContracts(newPoly);
    setCityEdges(newCityEdges);
    setAllEdges(allEdgesList);
    setIsIngestingForecasts(false);

    addAuditLog(
      'INFO',
      'QUANT',
      `Calculated pre-market edge matrix: ${allEdgesList.length} temperature brackets evaluated across Kalshi & Polymarket.`
    );
  }, [addAuditLog, portfolio.cashBalance, agentConfig.kellyFractionMultiplier]);

  // Initial load
  useEffect(() => {
    initializePeriod(activePeriod);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh forecasts on demand
  const refreshForecasts = useCallback(async () => {
    await initializePeriod(activePeriod);
  }, [activePeriod, initializePeriod]);

  // Execute an institutional order
  const executeTrade = useCallback((
    bracketId: string,
    cityId: CityId,
    platform: MarketPlatform,
    side: ContractSide,
    shares: number,
    price: number
  ) => {
    const totalCost = Number((shares * price).toFixed(2));
    if (totalCost > portfolio.cashBalance) {
      addAuditLog('ALERT', 'EXECUTION', `Order rejected: Insufficient cash balance ($${portfolio.cashBalance.toFixed(2)} available, $${totalCost} needed)`, cityId);
      return;
    }

    const order: TradeOrder = {
      orderId: `ord-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      bracketId,
      cityId,
      platform,
      side,
      type: 'MARKET',
      price,
      shares,
      totalCost,
      potentialPayout: Number((shares * 1.0).toFixed(2)),
      expectedValue: Number((shares * (1.0 - price) * 0.15).toFixed(2)),
      status: 'FILLED',
      timestamp: Date.now(),
      filledShares: shares,
      averageFillPrice: price
    };

    // Update positions
    setPositions((prev) => {
      const existingIndex = prev.findIndex(
        (p) => p.bracketId === bracketId && p.platform === platform && p.side === side
      );

      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const combinedShares = existing.shares + shares;
        const combinedCost = existing.costBasis + totalCost;
        const avgPrice = Number((combinedCost / combinedShares).toFixed(4));
        const updated: Position = {
          ...existing,
          shares: combinedShares,
          costBasis: combinedCost,
          averageEntryPrice: avgPrice,
          potentialPayout: Number((combinedShares * 1.0).toFixed(2)),
          unrealizedPnL: Number((combinedShares * (price - avgPrice)).toFixed(2)),
          unrealizedRoiPct: Number((((price - avgPrice) / avgPrice) * 100).toFixed(1))
        };
        const next = [...prev];
        next[existingIndex] = updated;
        return next;
      }

      const newPos: Position = {
        positionId: `pos-${Date.now().toString(36)}`,
        bracketId,
        cityId,
        platform,
        side,
        shares,
        averageEntryPrice: price,
        currentPrice: price,
        unrealizedPnL: 0,
        unrealizedRoiPct: 0,
        costBasis: totalCost,
        potentialPayout: Number((shares * 1.0).toFixed(2)),
        openedAt: Date.now()
      };
      return [...prev, newPos];
    });

    // Update portfolio balances
    setPortfolio((prev) => ({
      ...prev,
      cashBalance: Number((prev.cashBalance - totalCost).toFixed(2)),
      investedCapital: Number((prev.investedCapital + totalCost).toFixed(2)),
      totalPortfolioValue: Number((prev.totalPortfolioValue).toFixed(2)),
      totalTradesCount: prev.totalTradesCount + 1
    }));

    // Add to trade tape & audit log
    setTradeTape((prev) => [order, ...prev.slice(0, 49)]);
    addAuditLog(
      'ORDER',
      'EXECUTION',
      `Filled ${shares.toLocaleString()} ${side} @ $${price.toFixed(2)} on ${platform.toUpperCase()} (${CORE_CITIES[cityId].name}) - Cost: $${totalCost.toLocaleString()}`,
      cityId,
      { bracketId, shares, price, platform, side }
    );
  }, [portfolio.cashBalance, addAuditLog]);

  // Close an active position
  const closePosition = useCallback((positionId: string) => {
    const pos = positions.find((p) => p.positionId === positionId);
    if (!pos) return;

    // Simulate closing at current bid
    const exitPrice = pos.side === 'YES' ? Math.max(0.01, pos.currentPrice - 0.01) : Math.max(0.01, pos.currentPrice - 0.01);
    const proceeds = Number((pos.shares * exitPrice).toFixed(2));
    const pnl = Number((proceeds - pos.costBasis).toFixed(2));

    setPositions((prev) => prev.filter((p) => p.positionId !== positionId));
    setPortfolio((prev) => ({
      ...prev,
      cashBalance: Number((prev.cashBalance + proceeds).toFixed(2)),
      investedCapital: Number((prev.investedCapital - pos.costBasis).toFixed(2)),
      realizedPnL: Number((prev.realizedPnL + pnl).toFixed(2)),
      totalPortfolioValue: Number((prev.totalPortfolioValue + pnl).toFixed(2))
    }));

    addAuditLog(
      'ORDER',
      'EXECUTION',
      `Closed position ${pos.shares} ${pos.side} @ $${exitPrice.toFixed(2)} - Realized PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
      pos.cityId
    );
  }, [positions, addAuditLog]);

  // Period Rollover Engine: handles automatic rollover to the next hourly market
  const executePeriodRollover = useCallback(async () => {
    addAuditLog('ROLLOVER', 'SYSTEM', `Hourly boundary transition reached. Flushing stale market cache and settling active contracts...`);

    const settlementTemps: Record<CityId, number> = {} as Record<CityId, number>;
    const winningBrackets: Record<CityId, string> = {} as Record<CityId, string>;

    // 1. Resolve final official temperature readings for all cities
    for (const cityId of CITY_KEYS) {
      const forecast = forecastsByCity[cityId];
      const actualFinal = forecast
        ? Number((forecast.forecastMeanTemp + (Math.random() * 0.4 - 0.2)).toFixed(1))
        : 72.0;
      settlementTemps[cityId] = actualFinal;

      const brackets = bracketsByCity[cityId] || [];
      const winningId = resolveWinningBracket(brackets, actualFinal);
      winningBrackets[cityId] = winningId;
    }

    // 2. Settle active positions
    let totalRealizedFromRollover = 0;
    const settledList: SettledContract[] = [];

    positions.forEach((pos) => {
      const isWinner = (pos.bracketId === winningBrackets[pos.cityId] && pos.side === 'YES') ||
                       (pos.bracketId !== winningBrackets[pos.cityId] && pos.side === 'NO');

      const settlementPrice = isWinner ? 1.0 : 0.0;
      const payout = pos.shares * settlementPrice;
      const pnl = payout - pos.costBasis;
      totalRealizedFromRollover += pnl;

      const brackets = bracketsByCity[pos.cityId] || [];
      const bracket = brackets.find((b) => b.id === pos.bracketId);

      settledList.push({
        periodId: activePeriod.periodId,
        cityId: pos.cityId,
        bracketId: pos.bracketId,
        bracketLabel: bracket?.label ?? pos.bracketId,
        side: pos.side,
        shares: pos.shares,
        entryPrice: pos.averageEntryPrice,
        settlementPrice,
        realizedPnL: Number(pnl.toFixed(2)),
        settledAt: Date.now()
      });
    });

    // Update portfolio with settlement results
    setPortfolio((prev) => ({
      ...prev,
      cashBalance: Number((prev.cashBalance + prev.investedCapital + totalRealizedFromRollover).toFixed(2)),
      investedCapital: 0,
      realizedPnL: Number((prev.realizedPnL + totalRealizedFromRollover).toFixed(2)),
      totalPortfolioValue: Number((prev.totalPortfolioValue + totalRealizedFromRollover).toFixed(2))
    }));

    setSettledHistory((prev) => [...settledList, ...prev]);
    setPositions([]);

    const resolution: RolloverResolution = {
      periodId: activePeriod.periodId,
      resolvedAt: Date.now(),
      settlementTemps,
      winningBrackets
    };
    setActiveSettlementNotice(resolution);

    // 3. Initialize next hourly period (T + 1 hour)
    const nextStartTime = activePeriod.endTime;
    const nextEndTime = nextStartTime + 3600000;
    const date = new Date(nextStartTime);
    const nextPeriodId = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}00`;

    const newPeriod: HourlyPeriod = {
      periodId: nextPeriodId,
      startTime: nextStartTime,
      endTime: nextEndTime,
      marketOpenTime: nextStartTime,
      marketCloseTime: nextEndTime - 60000,
      timeRemainingMs: 3600000,
      isPreMarket: true,
      isMarketOpen: true,
      isSettled: false
    };

    setActivePeriod(newPeriod);
    await initializePeriod(newPeriod);

    addAuditLog(
      'ROLLOVER',
      'SYSTEM',
      `Period rollover complete. Initialized new hourly market: ${newPeriod.periodId}. Active cache refreshed.`
    );
  }, [activePeriod, forecastsByCity, bracketsByCity, positions, initializePeriod, addAuditLog]);

  // Force manual period roll for user testing
  const forcePeriodRoll = useCallback(() => {
    executePeriodRollover();
  }, [executePeriodRollover]);

  const dismissSettlementNotice = useCallback(() => {
    setActiveSettlementNotice(null);
  }, []);

  const updateAgentConfig = useCallback((updates: Partial<AgentConfig>) => {
    setAgentConfig((prev) => {
      const next = { ...prev, ...updates };
      addAuditLog('INFO', 'QUANT', `Agent configuration updated: AutoTrading=${next.autoTradingEnabled}, MinEV=${next.minEvHurdlePct}%, Kelly=${next.kellyFractionMultiplier}x`);
      return next;
    });
  }, [addAuditLog]);

  // Live Micro-Tick Engine: Perturbs order books every 400ms to simulate live CLOB liquidity updates
  useEffect(() => {
    const interval = setInterval(() => {
      setKalshiContracts((prev) => {
        const next = { ...prev };
        const keys = Object.keys(next);
        if (keys.length === 0) return prev;
        // pick 2 random contracts to tick
        for (let i = 0; i < 2; i++) {
          const randKey = keys[Math.floor(Math.random() * keys.length)];
          if (next[randKey]) {
            next[randKey] = applyMicroTick(next[randKey]);
          }
        }
        return next;
      });

      setPolymarketContracts((prev) => {
        const next = { ...prev };
        const keys = Object.keys(next);
        if (keys.length === 0) return prev;
        for (let i = 0; i < 2; i++) {
          const randKey = keys[Math.floor(Math.random() * keys.length)];
          if (next[randKey]) {
            next[randKey] = applyMicroTick(next[randKey]);
          }
        }
        return next;
      });

      // Update latencies slightly
      setSystemHealth((prev) => ({
        ...prev,
        kalshiLatencyMs: Math.max(10, Math.min(28, prev.kalshiLatencyMs + Math.round((Math.random() - 0.48) * 3))),
        polymarketLatencyMs: Math.max(16, Math.min(36, prev.polymarketLatencyMs + Math.round((Math.random() - 0.48) * 4))),
        weatherNextLatencyMs: Math.max(5, Math.min(14, prev.weatherNextLatencyMs + Math.round((Math.random() - 0.5) * 2))),
        lastHeartbeat: Date.now()
      }));

      // Occasionally emit synthetic trade on the live tape
      if (Math.random() > 0.65) {
        const randomCity = CITY_KEYS[Math.floor(Math.random() * CITY_KEYS.length)];
        const brackets = bracketsByCity[randomCity];
        if (brackets && brackets.length > 0) {
          const randomBracket = brackets[Math.floor(Math.random() * brackets.length)];
          const platform: MarketPlatform = Math.random() > 0.5 ? 'kalshi' : 'polymarket';
          const side: ContractSide = Math.random() > 0.5 ? 'YES' : 'NO';
          const price = Number((0.25 + Math.random() * 0.5).toFixed(2));
          const trade = generateSyntheticTrade(randomCity, randomBracket, platform, price, side);
          setTradeTape((tape) => [trade, ...tape.slice(0, 49)]);
        }
      }
    }, 450);

    return () => clearInterval(interval);
  }, [bracketsByCity]);

  // AI Trading Agent Autonomous Execution Loop
  const isAgentExecutingRef = useRef(false);
  useEffect(() => {
    if (!agentConfig.autoTradingEnabled) return;

    const agentInterval = setInterval(() => {
      if (isAgentExecutingRef.current || allEdges.length === 0) return;

      // Find best qualifying edge
      const candidates = allEdges.filter((edge) => {
        if (edge.isArbitrageOpportunity && agentConfig.autoHedgeArbitrage) return true;
        const maxEv = Math.max(edge.evYes, edge.evNo);
        const minEvRequired = agentConfig.minEvHurdlePct / 100;
        return maxEv >= minEvRequired && edge.recommendedSide !== 'NEUTRAL';
      });

      if (candidates.length === 0) return;

      // Pick top candidate
      const topEdge = candidates[0];

      // Check if we already have a position in this bracket
      const hasPosition = positions.some((p) => p.bracketId === topEdge.bracketId);
      if (hasPosition) return;

      isAgentExecutingRef.current = true;

      try {
        if (topEdge.isArbitrageOpportunity && agentConfig.autoHedgeArbitrage) {
          // Instant Risk-Free Cross-Market Arbitrage!
          const arbSize = Math.min(agentConfig.maxPositionSizeDollars / 2, 1000);
          const shares = Math.floor(arbSize / topEdge.bestYesAsk);
          if (shares > 10) {
            addAuditLog('SIGNAL', 'QUANT', `Arbitrage Detected on ${topEdge.bracketLabel} (${topEdge.cityId.toUpperCase()}): Kalshi Yes + Polymarket No < 1.0! Executing dual hedge.`, topEdge.cityId);
            executeTrade(topEdge.bracketId, topEdge.cityId, topEdge.bestYesPlatform, 'YES', shares, topEdge.bestYesAsk);
            executeTrade(topEdge.bracketId, topEdge.cityId, topEdge.bestNoPlatform, 'NO', shares, topEdge.bestNoAsk);
          }
        } else if (topEdge.recommendedSide !== 'NEUTRAL') {
          const side = topEdge.recommendedSide;
          const platform = side === 'YES' ? topEdge.bestYesPlatform : topEdge.bestNoPlatform;
          const price = side === 'YES' ? topEdge.bestYesAsk : topEdge.bestNoAsk;

          const kellyDollars = Math.min(topEdge.recommendedSizeDollars, agentConfig.maxPositionSizeDollars);
          const shares = Math.floor(kellyDollars / price);

          if (shares >= 25 && kellyDollars >= 20) {
            addAuditLog(
              'SIGNAL',
              'QUANT',
              `AI Signal: ${side} on ${topEdge.bracketLabel} (${topEdge.cityId.toUpperCase()}) | Model P=${(topEdge.modelProbability * 100).toFixed(1)}% vs Market=${(price * 100).toFixed(1)}¢ | EV=+${((side === 'YES' ? topEdge.evYes : topEdge.evNo) * 100).toFixed(1)}% | Kelly=${(topEdge.recommendedKellyFraction * 100).toFixed(1)}%`,
              topEdge.cityId
            );
            executeTrade(topEdge.bracketId, topEdge.cityId, platform, side, shares, price);
          }
        }
      } finally {
        setTimeout(() => {
          isAgentExecutingRef.current = false;
        }, 1500);
      }
    }, 2800);

    return () => clearInterval(agentInterval);
  }, [agentConfig, allEdges, positions, executeTrade, addAuditLog]);

  return (
    <WeatherMarketContext.Provider
      value={{
        selectedCityId,
        setSelectedCityId,
        activePeriod,
        speedMultiplier,
        setSpeedMultiplier,
        bracketsByCity,
        forecastsByCity,
        kalshiContracts,
        polymarketContracts,
        allEdges,
        cityEdges,
        positions,
        settledHistory,
        tradeTape,
        auditLogs,
        systemHealth,
        portfolio,
        agentConfig,
        updateAgentConfig,
        executeTrade,
        closePosition,
        forcePeriodRoll,
        activeSettlementNotice,
        dismissSettlementNotice,
        refreshForecasts,
        isIngestingForecasts
      }}
    >
      {children}
    </WeatherMarketContext.Provider>
  );
};

export function useWeatherMarket(): WeatherMarketState {
  const context = useContext(WeatherMarketContext);
  if (!context) {
    throw new Error('useWeatherMarket must be used within a WeatherMarketProvider');
  }
  return context;
}
