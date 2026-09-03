// Institutional Daily High Temperature (TMAX) Prediction Markets Domain Types

export type CityId = 'chicago' | 'newyork' | 'losangeles' | 'miami' | 'austin';

export interface MarketDirectLinks {
  kalshiUrl: string;
  polymarketUrl: string;
}

export interface CityMetadata {
  id: CityId;
  name: string;
  stationCode: string; // e.g. KORD, KNYC, KLAX, KMIA, KAUS
  stationName: string;
  state: string;
  latitude: number;
  longitude: number;
  timezone: string;
  elevationFt: number;
  nwsClimateOffice: string; // e.g. "NWS Chicago (LOT)"
  directLinks: MarketDirectLinks;
}

export interface TemperatureBracket {
  id: string; // e.g. 'ord-tmax-75-76'
  cityId: CityId;
  label: string; // e.g. "75°F - 76°F", "< 73°F", "≥ 79°F"
  minTemp: number; // inclusive, -Infinity for "<"
  maxTemp: number; // exclusive, Infinity for "≥"
  strikeTemp: number; // representative midpoint or threshold
  isEliminatedByObservedMax: boolean; // true if runningDailyMax >= maxTemp
  directLinks: MarketDirectLinks;
}

export type MarketPlatform = 'kalshi' | 'polymarket';
export type ContractSide = 'YES' | 'NO';

export interface OrderLevel {
  price: number; // 0.01 to 0.99 (USD or USDC)
  size: number; // contract quantity
  total: number; // cumulative size
}

export interface OrderBook {
  bids: OrderLevel[]; // descending by price (highest bid first)
  asks: OrderLevel[]; // ascending by price (lowest ask first)
  spread: number;
  midPrice: number;
  lastPrice: number;
  volume24h: number;
  openInterest: number;
  lastUpdated: number;
}

export interface MarketContract {
  id: string;
  bracketId: string;
  cityId: CityId;
  platform: MarketPlatform;
  ticker: string; // e.g. "KXHIGHD-26SEP04-T75" or "POLY-TMAX-ORD-75"
  title: string;
  side: ContractSide;
  yesBook: OrderBook;
  noBook: OrderBook;
  bestYesBid: number;
  bestYesAsk: number;
  bestNoBid: number;
  bestNoAsk: number;
  lastTradePrice: number;
  lastTradeTime: number;
  impliedProbability: number;
  directUrl: string;
}

export interface WeatherEnsembleMember {
  modelName: 'WeatherNext_3' | 'HRRR_CONUS' | 'ECMWF_HRES' | 'GFS_FV3' | 'AI_Neural_Blend';
  predictedDailyMax: number;
  weight: number;
  confidence: number;
}

export interface WeatherForecast {
  cityId: CityId;
  timestamp: number; // epoch ms
  targetDate: string; // e.g. "2026-09-04"
  currentAmbientTemp: number; // Current real-time thermometer reading
  runningDailyMaxTemp: number; // Highest temp observed so far today (NWS ASOS CLI benchmark)
  forecastDailyHighTemp: number; // Modeled expected TMAX (mean of distribution mu)
  standardDeviation: number; // Sigma in degrees F
  skewness: number;
  peakSolarZenithHour: string; // e.g. "15:30 Local"
  dewPoint: number;
  relativeHumidity: number;
  barometricPressureInHg: number;
  pressureTrend: 'RISING' | 'STEADY' | 'FALLING';
  windSpeedMph: number;
  windDirectionDeg: number;
  windGustMph: number;
  cloudCoverPct: number;
  solarRadiationWm2: number;
  radarReflectivityDbz: number;
  confidenceScore: number; // 0 to 100
  ensembleMembers: WeatherEnsembleMember[];
  historicalBrierScore: number;
  forecastGeneratedAt: number;
}

export type StrategyPhaseTag = 'EARLY_ALPHA' | 'LATE_SWEEP' | 'CORE_EDGE' | 'ARBITRAGE' | 'NEUTRAL';

export interface QuantitativeEdge {
  bracketId: string;
  cityId: CityId;
  bracketLabel: string;
  modelProbability: number; // P(bracket) from WeatherNext 3 TMAX ensemble
  kalshiYesPrice: number;
  kalshiNoPrice: number;
  polymarketYesPrice: number;
  polymarketNoPrice: number;
  bestYesAsk: number;
  bestNoAsk: number;
  bestYesPlatform: MarketPlatform;
  bestNoPlatform: MarketPlatform;
  evYes: number; // Expected value of YES contract
  evNo: number; // Expected value of NO contract
  roiYesPct: number; // Potential ROI % if YES wins
  roiNoPct: number; // Potential ROI % if NO wins
  riskRewardYes: number;
  riskRewardNo: number;
  edgeYes: number; // P_model - Price_yes
  edgeNo: number; // (1 - P_model) - Price_no
  recommendedSide: ContractSide | 'NEUTRAL';
  recommendedKellyFraction: number; // 0 to 1.0 (fraction of bankroll)
  recommendedSizeDollars: number;
  statisticalAsymmetryScore: number; // 0 to 100
  isArbitrageOpportunity: boolean;
  arbitrageProfitSpread: number;
  strategyTag: StrategyPhaseTag;
  directLinks: MarketDirectLinks;
}

export type SessionPhase =
  | 'PRE_MARKET'     // Morning: Before peak heating (00:00 - 11:00)
  | 'PEAK_HEATING'    // Afternoon: Solar max heating window (11:00 - 17:00)
  | 'LATE_SWEEP'      // Evening: Temperature cooling, TMAX virtually locked (17:00 - 23:00)
  | 'SETTLEMENT_LOCK';// Midnight: NWS Daily Climate Report published & settled (23:00 - 23:59)

export interface DailyMarketPeriod {
  periodId: string; // e.g. "TMAX-2026-09-04"
  marketDate: string; // e.g. "Sep 4, 2026"
  startTime: number;
  endTime: number; // 23:59:59 local / cutoff
  marketLockTime: number;
  timeRemainingMs: number;
  currentPhase: SessionPhase;
  phaseLabel: string;
  isMarketOpen: boolean;
  isSettled: boolean;
  settlementTmaxTemp?: number;
  settlementBracketId?: string;
}

export type OrderType = 'LIMIT' | 'MARKET';
export type OrderStatus = 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';

export interface TradeOrder {
  orderId: string;
  bracketId: string;
  cityId: CityId;
  platform: MarketPlatform;
  side: ContractSide;
  type: OrderType;
  price: number;
  shares: number;
  totalCost: number;
  potentialPayout: number;
  expectedValue: number;
  status: OrderStatus;
  timestamp: number;
  strategyPhase: SessionPhase;
  filledShares?: number;
  averageFillPrice?: number;
}

export interface Position {
  positionId: string;
  bracketId: string;
  cityId: CityId;
  platform: MarketPlatform;
  side: ContractSide;
  shares: number;
  averageEntryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedRoiPct: number;
  costBasis: number;
  potentialPayout: number;
  strategyPhase: SessionPhase;
  openedAt: number;
}

export interface SettledContract {
  periodId: string;
  cityId: CityId;
  bracketId: string;
  bracketLabel: string;
  side: ContractSide;
  shares: number;
  entryPrice: number;
  settlementPrice: number; // 1.0 or 0.0
  realizedPnL: number;
  settledAt: number;
}

export interface AgentConfig {
  autoTradingEnabled: boolean;
  minEvHurdlePct: number; // e.g. 5.0 for 5% minimum EV
  kellyFractionMultiplier: number; // e.g. 0.25 for quarter-Kelly
  maxPositionSizeDollars: number; // e.g. $3,000
  maxPortfolioRiskPct: number; // e.g. 20%
  stopLossPct: number; // e.g. 35%
  takeProfitPct: number; // e.g. 80%
  autoHedgeArbitrage: boolean;
  preMarketExecutionDelayMs: number;
  preferredPlatform: 'AUTO_BEST' | 'KALSHI' | 'POLYMARKET';
  enableEarlyAlpha: boolean;
  enableLateSweep: boolean;
  earlyAlphaMaxPrice: number; // e.g. 0.35
  lateSweepMinProbPct: number; // e.g. 78%
}

export type AuditLogSeverity = 'INFO' | 'SIGNAL' | 'ORDER' | 'FILL' | 'ROLLOVER' | 'ERROR' | 'ALERT';

export interface AuditLog {
  id: string;
  timestamp: number;
  severity: AuditLogSeverity;
  category: 'MARKET' | 'WEATHER_NEXT' | 'QUANT' | 'EXECUTION' | 'SYSTEM';
  message: string;
  cityId?: CityId;
  dataPayload?: Record<string, unknown>;
}

export interface SystemHealth {
  kalshiApiStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  kalshiLatencyMs: number;
  polymarketApiStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  polymarketLatencyMs: number;
  weatherNextApiStatus: 'ONLINE' | 'SYNCING' | 'OFFLINE';
  weatherNextLatencyMs: number;
  activeWebsockets: number;
  lastHeartbeat: number;
  cpuLoadPct: number;
  memoryUsageMb: number;
}

export interface PortfolioSummary {
  cashBalance: number;
  investedCapital: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalPortfolioValue: number;
  winRatePct: number;
  totalTradesCount: number;
  sharpeRatio: number;
  maxDrawdownPct: number;
}
