// Institutional Weather Prediction Markets Domain Types

export type CityId = 'chicago' | 'newyork' | 'losangeles' | 'miami' | 'austin';

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
}

export interface TemperatureBracket {
  id: string; // e.g. 'ord-t70-71'
  cityId: CityId;
  label: string; // e.g. "70°F - 71°F", "< 68°F", "≥ 74°F"
  minTemp: number; // inclusive, -Infinity for "<"
  maxTemp: number; // exclusive, Infinity for "≥"
  strikeTemp: number; // representative midpoint or threshold
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
  ticker: string; // e.g. "KXCHID-26SEP04-T72" or "POLY-ORD-72"
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
  impliedProbability: number; // based on midpoint
}

export interface WeatherEnsembleMember {
  modelName: 'WeatherNext_3' | 'ECMWF_HRES' | 'GFS_FV3' | 'HRRR_CONUS' | 'AI_Neural_Blend';
  predictedTemp: number;
  weight: number;
  confidence: number;
}

export interface WeatherForecast {
  cityId: CityId;
  timestamp: number; // epoch ms
  targetHourTimestamp: number; // epoch ms
  currentTemp: number; // Fahrenheit
  forecastMeanTemp: number; // Fahrenheit
  standardDeviation: number; // Sigma in degrees F
  skewness: number;
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
  historicalBrierScore: number; // 0 (perfect) to 1
  forecastGeneratedAt: number;
}

export interface QuantitativeEdge {
  bracketId: string;
  cityId: CityId;
  bracketLabel: string;
  modelProbability: number; // P(bracket) from WeatherNext 3 ensemble
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
  arbitrageProfitSpread: number; // positive if yes_ask + no_ask < 1.0
}

export interface HourlyPeriod {
  periodId: string; // e.g. "20260904-0200"
  startTime: number;
  endTime: number;
  marketOpenTime: number;
  marketCloseTime: number;
  timeRemainingMs: number;
  isPreMarket: boolean;
  isMarketOpen: boolean;
  isSettled: boolean;
  settlementTemp?: number;
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
  maxPositionSizeDollars: number; // e.g. $5,000
  maxPortfolioRiskPct: number; // e.g. 20%
  stopLossPct: number; // e.g. 35%
  takeProfitPct: number; // e.g. 80%
  autoHedgeArbitrage: boolean;
  preMarketExecutionDelayMs: number;
  preferredPlatform: 'AUTO_BEST' | 'KALSHI' | 'POLYMARKET';
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
  cashBalance: number; // starting e.g. $100,000.00
  investedCapital: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalPortfolioValue: number;
  winRatePct: number;
  totalTradesCount: number;
  sharpeRatio: number;
  maxDrawdownPct: number;
}
