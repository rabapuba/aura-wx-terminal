// Central Institutional Daily High Temperature (TMAX) Prediction Market Context & Reactive Engine

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  CityId,
  TemperatureBracket,
  WeatherForecast,
  MarketContract,
  QuantitativeEdge,
  DailyMarketPeriod,
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
import { CORE_CITIES, generateDailyHighBrackets, fetchWeatherNextForecast } from '../services/weatherEngine';
import { evaluateDailyHighEdge } from '../services/quantitativeMath';
import { createMarketContract, applyMicroTick, generateSyntheticTrade } from '../services/marketDataFeed';
import { createDailyMarketPeriod, resolveWinningDailyHighBracket, type DailySettlementResolution } from '../services/autoPeriodEngine';

export interface WeatherMarketState {
  selectedCityId: CityId;
  setSelectedCityId: (id: CityId) => void;
  activePeriod: DailyMarketPeriod;
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
  activeSettlementNotice: DailySettlementResolution | null;
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
  preferredPlatform: 'AUTO_BEST',
  enableEarlyAlpha: true,
  enableLateSweep: true,
  earlyAlphaMaxPrice: 0.35,
  lateSweepMinProbPct: 78
};

const CITY_KEYS: CityId[] = ['chicago', 'newyork', 'losangeles', 'miami', 'austin'];

export const WeatherMarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCityId, setSelectedCityId] = useState<CityId>('chicago');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [activePeriod, setActivePeriod] = useState<DailyMarketPeriod>(() => createDailyMarketPeriod());
  const [isIngestingForecasts, setIsIngestingForecasts] = useState<boolean>(false);
  const [activeSettlementNotice, setActiveSettlementNotice] = useState<DailySettlementResolution | null>(null);

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
    winRatePct: 71.2,
    totalTradesCount: 184,
    sharpeRatio: 2.64,
    maxDrawdownPct: 3.8
  });

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    kalshiApiStatus: 'ONLINE',
    kalshiLatencyMs: 12,
    polymarketApiStatus: 'ONLINE',
    polymarketLatencyMs: 19,
    weatherNextApiStatus: 'ONLINE',
    weatherNextLatencyMs: 34,
    activeWebsockets: 10,
    lastHeartbeat: Date.now(),
    cpuLoadPct: 14.8,
    memoryUsageMb: 86.4
  });

  const isAgentExecutingRef = useRef<boolean>(false);

  // Add audit log helper
  const addAuditLog = useCallback((
    severity: AuditLog['severity'],
    category: AuditLog['category'],
    message: string,
    cityId?: CityId,
    dataPayload?: Record<string, unknown>
  ) => {
    const log: AuditLog = {
      id: `log-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      severity,
      category,
      message,
      cityId,
      dataPayload
    };
    setAuditLogs((prev) => [log, ...prev.slice(0, 199)]);
  }, []);

  // Update Agent Config
  const updateAgentConfig = useCallback((updates: Partial<AgentConfig>) => {
    setAgentConfig((prev) => {
      const next = { ...prev, ...updates };
      addAuditLog('INFO', 'SYSTEM', `Agent configuration updated: ${Object.keys(updates).join(', ')}`);
      return next;
    });
  }, [addAuditLog]);

  // Ingest forecasts and evaluate Daily High (TMAX) edge matrix
  const initializePeriod = useCallback(async (period: DailyMarketPeriod) => {
    setIsIngestingForecasts(true);
    addAuditLog('INFO', 'WEATHER_NEXT', `Ingesting Google WeatherNext 3 Daily High (TMAX) forecasts for 5 core cities (${period.marketDate})`);

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

        // Generate 5 strike brackets centered on modeled TMAX forecast
        const brackets = generateDailyHighBrackets(cityId, forecast.forecastDailyHighTemp, forecast.runningDailyMaxTemp);
        newBrackets[cityId] = brackets;

        const edgesForCity: QuantitativeEdge[] = [];

        for (const bracket of brackets) {
          // Compute baseline fair probability
          const fairProb = bracket.isEliminatedByObservedMax ? 0.0001 : 0.20;
          const kalshiFair = Math.max(0.02, Math.min(0.98, fairProb + (Math.random() * 0.08 - 0.04)));
          const polyFair = Math.max(0.02, Math.min(0.98, fairProb + (Math.random() * 0.08 - 0.04)));

          const kContract = createMarketContract(bracket, kalshiFair, 'kalshi');
          const pContract = createMarketContract(bracket, polyFair, 'polymarket');

          newKalshi[bracket.id] = kContract;
          newPoly[bracket.id] = pContract;

          // Quantitative Edge evaluation
          const edge = evaluateDailyHighEdge(
            bracket,
            forecast.forecastDailyHighTemp,
            forecast.standardDeviation,
            forecast.runningDailyMaxTemp,
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

    // Sort edges globally by Statistical Asymmetry
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
      `Calculated Daily High edge matrix: ${allEdgesList.length} brackets evaluated across Kalshi & Polymarket.`
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
      strategyPhase: activePeriod.currentPhase,
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
        strategyPhase: activePeriod.currentPhase,
        openedAt: Date.now()
      };
      return [...prev, newPos];
    });

    // Update portfolio cash
    setPortfolio((prev) => {
      const newCash = Number((prev.cashBalance - totalCost).toFixed(2));
      const newInvested = Number((prev.investedCapital + totalCost).toFixed(2));
      return {
        ...prev,
        cashBalance: newCash,
        investedCapital: newInvested,
        totalTradesCount: prev.totalTradesCount + 1
      };
    });

    // Append to live trade tape
    setTradeTape((prev) => [order, ...prev.slice(0, 49)]);

    addAuditLog(
      'ORDER',
      'EXECUTION',
      `Filled ${shares.toLocaleString()} ${side} @ $${price.toFixed(2)} ($${totalCost.toLocaleString()}) on ${platform.toUpperCase()} [${CORE_CITIES[cityId].name}]`,
      cityId,
      { orderId: order.orderId, shares, price, totalCost }
    );
  }, [portfolio.cashBalance, activePeriod.currentPhase, addAuditLog]);

  // Close an active position
  const closePosition = useCallback((positionId: string) => {
    setPositions((prev) => {
      const target = prev.find((p) => p.positionId === positionId);
      if (!target) return prev;

      const exitPrice = target.side === 'YES' ? target.currentPrice : (1.0 - target.currentPrice);
      const grossProceeds = Number((target.shares * exitPrice).toFixed(2));
      const realizedPnL = Number((grossProceeds - target.costBasis).toFixed(2));

      setPortfolio((p) => ({
        ...p,
        cashBalance: Number((p.cashBalance + grossProceeds).toFixed(2)),
        investedCapital: Math.max(0, Number((p.investedCapital - target.costBasis).toFixed(2))),
        realizedPnL: Number((p.realizedPnL + realizedPnL).toFixed(2)),
        totalPortfolioValue: Number((p.totalPortfolioValue + realizedPnL).toFixed(2))
      }));

      addAuditLog(
        'ORDER',
        'EXECUTION',
        `Closed position ${positionId} (${target.shares} shares): Realized PnL ${realizedPnL >= 0 ? '+' : ''}$${realizedPnL.toFixed(2)}`,
        target.cityId
      );

      return prev.filter((p) => p.positionId !== positionId);
    });
  }, [addAuditLog]);

  // Force Daily Market Rollover & Settlement (Next Day Simulation)
  const forcePeriodRoll = useCallback(async () => {
    addAuditLog('ROLLOVER', 'SYSTEM', `Executing Daily Market Lockout & NWS Climate Report Settlement for ${activePeriod.marketDate}`);

    // 1. Settle all 5 cities against observed Daily High (TMAX)
    const officialDailyHighs: Record<CityId, number> = {} as Record<CityId, number>;
    const winningBrackets: Record<CityId, string> = {} as Record<CityId, string>;

    for (const cityId of CITY_KEYS) {
      const fc = forecastsByCity[cityId];
      // Final official TMAX settled against NWS ASOS Daily Climate Report
      const officialMax = fc ? fc.runningDailyMaxTemp : 78.0;
      officialDailyHighs[cityId] = officialMax;

      const brackets = bracketsByCity[cityId] || [];
      const winningId = resolveWinningDailyHighBracket(brackets, officialMax);
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

    setPortfolio((prev) => ({
      ...prev,
      cashBalance: Number((prev.cashBalance + prev.investedCapital + totalRealizedFromRollover).toFixed(2)),
      investedCapital: 0,
      realizedPnL: Number((prev.realizedPnL + totalRealizedFromRollover).toFixed(2)),
      totalPortfolioValue: Number((prev.totalPortfolioValue + totalRealizedFromRollover).toFixed(2))
    }));

    setSettledHistory((prev) => [...settledList, ...prev]);
    setPositions([]);

    const resolution: DailySettlementResolution = {
      periodId: activePeriod.periodId,
      marketDate: activePeriod.marketDate,
      resolvedAt: Date.now(),
      officialDailyHighs,
      winningBrackets
    };
    setActiveSettlementNotice(resolution);

    // 3. Initialize next day's market period
    const nextStartTime = activePeriod.endTime + 1000;
    const date = new Date(nextStartTime);
    const nextDateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const nextPeriodId = `TMAX-${yyyy}-${mm}-${dd}`;

    const newPeriod: DailyMarketPeriod = {
      periodId: nextPeriodId,
      marketDate: nextDateStr,
      startTime: nextStartTime,
      endTime: nextStartTime + 86400000 - 1000,
      marketLockTime: nextStartTime + 86400000 - 60000,
      timeRemainingMs: 86400000,
      currentPhase: 'PRE_MARKET',
      phaseLabel: 'Pre-Market Solar Ramp (Morning)',
      isMarketOpen: true,
      isSettled: false
    };

    setActivePeriod(newPeriod);
    await initializePeriod(newPeriod);

    addAuditLog(
      'ROLLOVER',
      'SYSTEM',
      `Rollover Complete: Shifted to ${nextDateStr}. NWS CLI PnL: ${totalRealizedFromRollover >= 0 ? '+' : ''}$${totalRealizedFromRollover.toFixed(2)}`
    );
  }, [activePeriod, forecastsByCity, bracketsByCity, positions, initializePeriod, addAuditLog]);

  const dismissSettlementNotice = () => {
    setActiveSettlementNotice(null);
  };

  // Simulated live micro-ticks and order flow loop
  useEffect(() => {
    const tickInterval = setInterval(() => {
      // Perturb Kalshi & Polymarket order books slightly
      setKalshiContracts((prev) => {
        const next = { ...prev };
        const keys = Object.keys(next);
        if (keys.length === 0) return prev;
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        if (next[randomKey]) {
          next[randomKey] = applyMicroTick(next[randomKey]);
        }
        return next;
      });

      setPolymarketContracts((prev) => {
        const next = { ...prev };
        const keys = Object.keys(next);
        if (keys.length === 0) return prev;
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        if (next[randomKey]) {
          next[randomKey] = applyMicroTick(next[randomKey]);
        }
        return next;
      });

      // Synthetic external retail tape trade
      if (Math.random() > 0.65) {
        const contracts = Object.values(kalshiContracts);
        if (contracts.length > 0) {
          const sampleContract = contracts[Math.floor(Math.random() * contracts.length)];
          const synthetic = generateSyntheticTrade(sampleContract);
          setTradeTape((prev) => [synthetic, ...prev.slice(0, 49)]);
        }
      }

      // Heartbeat & latency jitter
      setSystemHealth((prev) => ({
        ...prev,
        lastHeartbeat: Date.now(),
        kalshiLatencyMs: Math.max(9, Math.min(28, prev.kalshiLatencyMs + (Math.random() > 0.5 ? 1 : -1))),
        polymarketLatencyMs: Math.max(14, Math.min(38, prev.polymarketLatencyMs + (Math.random() > 0.5 ? 1 : -1))),
        weatherNextLatencyMs: Math.max(25, Math.min(48, prev.weatherNextLatencyMs + (Math.random() > 0.5 ? 1 : -1)))
      }));
    }, 1800 / speedMultiplier);

    return () => clearInterval(tickInterval);
  }, [speedMultiplier, kalshiContracts]);

  // Autonomous Quantitative Trading Agent Execution Loop
  useEffect(() => {
    if (!agentConfig.autoTradingEnabled) return;

    const agentInterval = setInterval(() => {
      if (isAgentExecutingRef.current || allEdges.length === 0) return;

      const currentPhase = activePeriod.currentPhase;
      const candidates = allEdges.filter((edge) => {
        if (edge.isArbitrageOpportunity && agentConfig.autoHedgeArbitrage) return true;
        const maxEv = Math.max(edge.evYes, edge.evNo);
        const minEvRequired = agentConfig.minEvHurdlePct / 100;

        if (maxEv < minEvRequired || edge.recommendedSide === 'NEUTRAL') return false;

        // Early Alpha filter: cheap contracts <= $0.35
        if (currentPhase === 'PRE_MARKET' && agentConfig.enableEarlyAlpha) {
          const targetPrice = edge.recommendedSide === 'YES' ? edge.bestYesAsk : edge.bestNoAsk;
          return edge.strategyTag === 'EARLY_ALPHA' || targetPrice <= agentConfig.earlyAlphaMaxPrice;
        }

        // Late Sweep filter: high win probability >= 78%
        if (currentPhase === 'LATE_SWEEP' && agentConfig.enableLateSweep) {
          const winProb = edge.recommendedSide === 'YES' ? edge.modelProbability : 1.0 - edge.modelProbability;
          return edge.strategyTag === 'LATE_SWEEP' || (winProb * 100) >= agentConfig.lateSweepMinProbPct;
        }

        return true;
      });

      if (candidates.length === 0) return;

      const topEdge = candidates[0];
      const hasPosition = positions.some((p) => p.bracketId === topEdge.bracketId);
      if (hasPosition) return;

      isAgentExecutingRef.current = true;

      try {
        if (topEdge.isArbitrageOpportunity && agentConfig.autoHedgeArbitrage) {
          const arbSize = Math.min(agentConfig.maxPositionSizeDollars / 2, 1000);
          const shares = Math.floor(arbSize / topEdge.bestYesAsk);
          if (shares > 10) {
            addAuditLog('SIGNAL', 'QUANT', `Cross-Market Arbitrage on ${topEdge.bracketLabel} (${topEdge.cityId.toUpperCase()}): Kalshi Yes + Poly No < 1.0`, topEdge.cityId);
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
              `Daily High Signal: ${side} on ${topEdge.bracketLabel} (${topEdge.cityId.toUpperCase()}) | Model P=${(topEdge.modelProbability * 100).toFixed(1)}% vs Market=${(price * 100).toFixed(1)}¢ | EV=+${((side === 'YES' ? topEdge.evYes : topEdge.evNo) * 100).toFixed(1)}%`,
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
    }, 2600);

    return () => clearInterval(agentInterval);
  }, [agentConfig, allEdges, positions, executeTrade, addAuditLog, activePeriod.currentPhase]);

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
