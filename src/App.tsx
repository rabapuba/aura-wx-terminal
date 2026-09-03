import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Sun,
  Moon,
  Clock,
  Zap,
  Play,
  Pause,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Award,
  Layers,
  BarChart3,
  Sliders,
  Wind,
  Droplets,
  Gauge,
  Radio,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Cpu,
  CheckCircle2,
  XCircle,
  X,
  Server,
  FileText
} from 'lucide-react';

// ==========================================
// 1. DOMAIN DATA MODELS & CONSTANTS
// ==========================================

export type CityId = 'chicago' | 'newyork' | 'losangeles' | 'miami' | 'austin';
export type NavTabId = 'live-command' | 'pre-market-intel' | 'city-deep-dive' | 'agent-config';
export type MarketPlatform = 'kalshi' | 'polymarket';
export type ContractSide = 'YES' | 'NO';
export type SessionPhase = 'PRE_MARKET' | 'PEAK_HEATING' | 'LATE_SWEEP' | 'SETTLEMENT_LOCK';

interface MarketDirectLinks {
  kalshiUrl: string;
  polymarketUrl: string;
}

interface CityMetadata {
  id: CityId;
  name: string;
  stationCode: string;
  stationName: string;
  state: string;
  timezone: string;
  elevationFt: number;
  nwsClimateOffice: string;
  baseTmax: number;
  currentAmbient: number;
  runningHigh: number;
  forecastTmax: number;
  stdDev: number;
  dewPoint: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  solarZenith: string;
  brierScore: number;
  directLinks: MarketDirectLinks;
}

const CITIES: Record<CityId, CityMetadata> = {
  chicago: {
    id: 'chicago',
    name: 'Chicago',
    stationCode: 'KORD',
    stationName: "Chicago O'Hare Intl Airport",
    state: 'IL',
    timezone: 'America/Chicago',
    elevationFt: 672,
    nwsClimateOffice: 'NWS Chicago (CLIORD)',
    baseTmax: 78.5,
    currentAmbient: 75.8,
    runningHigh: 77.2,
    forecastTmax: 78.5,
    stdDev: 1.25,
    dewPoint: 58.4,
    humidity: 55,
    pressure: 29.94,
    windSpeed: 8.5,
    solarZenith: '15:15 Local',
    brierScore: 0.068,
    directLinks: {
      kalshiUrl: 'https://kalshi.com/markets/kxhighd/daily-high-temperature-chicago',
      polymarketUrl: 'https://polymarket.com/event/highest-temperature-in-chicago'
    }
  },
  newyork: {
    id: 'newyork',
    name: 'New York',
    stationCode: 'KNYC',
    stationName: 'Central Park Weather Station',
    state: 'NY',
    timezone: 'America/New_York',
    elevationFt: 130,
    nwsClimateOffice: 'NWS New York (CLINYC)',
    baseTmax: 81.0,
    currentAmbient: 79.2,
    runningHigh: 80.6,
    forecastTmax: 81.0,
    stdDev: 1.20,
    dewPoint: 61.2,
    humidity: 58,
    pressure: 29.98,
    windSpeed: 7.2,
    solarZenith: '14:45 Local',
    brierScore: 0.064,
    directLinks: {
      kalshiUrl: 'https://kalshi.com/markets/kxhighny/daily-high-temperature-new-york',
      polymarketUrl: 'https://polymarket.com/event/highest-temperature-in-new-york'
    }
  },
  losangeles: {
    id: 'losangeles',
    name: 'Los Angeles',
    stationCode: 'KLAX',
    stationName: 'Los Angeles Intl Airport',
    state: 'CA',
    timezone: 'America/Los_Angeles',
    elevationFt: 125,
    nwsClimateOffice: 'NWS Los Angeles (CLILAX)',
    baseTmax: 84.5,
    currentAmbient: 81.5,
    runningHigh: 83.4,
    forecastTmax: 84.5,
    stdDev: 1.35,
    dewPoint: 56.0,
    humidity: 48,
    pressure: 29.92,
    windSpeed: 10.4,
    solarZenith: '15:30 Local',
    brierScore: 0.072,
    directLinks: {
      kalshiUrl: 'https://kalshi.com/markets/kxlaxh/daily-high-temperature-los-angeles',
      polymarketUrl: 'https://polymarket.com/event/highest-temperature-in-los-angeles'
    }
  },
  miami: {
    id: 'miami',
    name: 'Miami',
    stationCode: 'KMIA',
    stationName: 'Miami Intl Airport',
    state: 'FL',
    timezone: 'America/New_York',
    elevationFt: 9,
    nwsClimateOffice: 'NWS Miami (CLIMIA)',
    baseTmax: 89.5,
    currentAmbient: 87.4,
    runningHigh: 88.6,
    forecastTmax: 89.5,
    stdDev: 1.15,
    dewPoint: 72.8,
    humidity: 68,
    pressure: 30.02,
    windSpeed: 9.0,
    solarZenith: '14:30 Local',
    brierScore: 0.059,
    directLinks: {
      kalshiUrl: 'https://kalshi.com/markets/kxhighmia/daily-high-temperature-miami',
      polymarketUrl: 'https://polymarket.com/event/highest-temperature-in-miami'
    }
  },
  austin: {
    id: 'austin',
    name: 'Austin',
    stationCode: 'KAUS',
    stationName: 'Austin-Bergstrom / Camp Mabry',
    state: 'TX',
    timezone: 'America/Chicago',
    elevationFt: 542,
    nwsClimateOffice: 'NWS Austin (CLIAUS)',
    baseTmax: 94.0,
    currentAmbient: 91.8,
    runningHigh: 93.2,
    forecastTmax: 94.0,
    stdDev: 1.40,
    dewPoint: 64.0,
    humidity: 44,
    pressure: 29.89,
    windSpeed: 11.2,
    solarZenith: '15:45 Local',
    brierScore: 0.075,
    directLinks: {
      kalshiUrl: 'https://kalshi.com/markets/kxaush/daily-high-temperature-austin',
      polymarketUrl: 'https://polymarket.com/event/highest-temperature-in-austin'
    }
  }
};

const CITY_KEYS: CityId[] = ['chicago', 'newyork', 'losangeles', 'miami', 'austin'];

export interface TemperatureBracket {
  id: string;
  cityId: CityId;
  label: string;
  minTemp: number;
  maxTemp: number;
  strikeTemp: number;
  isEliminated: boolean;
  modelProb: number;
  kalshiYesAsk: number;
  kalshiNoAsk: number;
  polyYesAsk: number;
  polyNoAsk: number;
  bestYesAsk: number;
  bestNoAsk: number;
  bestYesPlatform: MarketPlatform;
  bestNoPlatform: MarketPlatform;
  evYes: number;
  evNo: number;
  roiYesPct: number;
  roiNoPct: number;
  asymmetryScore: number;
  recommendedSide: ContractSide | 'NEUTRAL';
  recommendedKellySize: number;
  isArbitrage: boolean;
  strategyTag: 'EARLY_ALPHA' | 'LATE_SWEEP' | 'CORE_EDGE' | 'ARBITRAGE' | 'NEUTRAL';
}

export interface TradeOrder {
  orderId: string;
  bracketId: string;
  cityId: CityId;
  platform: MarketPlatform;
  side: ContractSide;
  price: number;
  shares: number;
  totalCost: number;
  timestamp: number;
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
  costBasis: number;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  severity: 'INFO' | 'SIGNAL' | 'ORDER' | 'ROLLOVER' | 'ALERT';
  message: string;
}

// ==========================================
// 2. MATHEMATICAL & PROBABILITY FUNCTIONS
// ==========================================

function erf(x: number): number {
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

function normalCDF(x: number, mean: number, stdDev: number): number {
  if (stdDev <= 0) return x >= mean ? 1.0 : 0.0;
  const z = (x - mean) / (stdDev * Math.SQRT2);
  return 0.5 * (1.0 + erf(z));
}

function computeDailyHighProbability(minTemp: number, maxTemp: number, mean: number, stdDev: number, runningMax: number): number {
  if (runningMax >= maxTemp) {
    return 0.0001; // Mathematically eliminated because today's high already surpassed this bracket
  }
  const pMin = minTemp === -Infinity ? 0.0 : normalCDF(minTemp, mean, stdDev);
  const pMax = maxTemp === Infinity ? 1.0 : normalCDF(maxTemp, mean, stdDev);
  const rawProb = Math.max(0.0001, pMax - pMin);

  if (runningMax > minTemp) {
    const pRunning = normalCDF(runningMax, mean, stdDev);
    const probRemainingHigher = Math.max(0.001, 1.0 - pRunning);
    const conditionalInBracket = Math.max(0, pMax - pRunning) / probRemainingHigher;
    return Math.max(0.0001, Math.min(0.9999, conditionalInBracket));
  }
  return Math.max(0.0001, Math.min(0.9999, rawProb));
}

function generateCityBrackets(city: CityMetadata): TemperatureBracket[] {
  const center = Math.round(city.forecastTmax);
  const cityCode = city.stationCode.toLowerCase();

  const raw = [
    { id: `${cityCode}-tmax-b1`, label: `< ${center - 3}°F`, minTemp: -Infinity, maxTemp: center - 3, strikeTemp: center - 4 },
    { id: `${cityCode}-tmax-b2`, label: `${center - 3}°F - ${center - 2}°F`, minTemp: center - 3, maxTemp: center - 1, strikeTemp: center - 2.5 },
    { id: `${cityCode}-tmax-b3`, label: `${center - 1}°F - ${center}°F`, minTemp: center - 1, maxTemp: center + 1, strikeTemp: center },
    { id: `${cityCode}-tmax-b4`, label: `${center + 1}°F - ${center + 2}°F`, minTemp: center + 1, maxTemp: center + 3, strikeTemp: center + 1.5 },
    { id: `${cityCode}-tmax-b5`, label: `≥ ${center + 3}°F`, minTemp: center + 3, maxTemp: Infinity, strikeTemp: center + 4 }
  ];

  return raw.map((b) => {
    const isEliminated = city.runningHigh >= b.maxTemp;
    const modelProb = computeDailyHighProbability(b.minTemp, b.maxTemp, city.forecastTmax, city.stdDev, city.runningHigh);

    // Realistic prices based on probability
    const kalshiYesAsk = isEliminated ? 0.02 : Number(Math.max(0.02, Math.min(0.98, modelProb + 0.03)).toFixed(2));
    const kalshiNoAsk = Number(Math.max(0.02, Math.min(0.98, 1.0 - modelProb + 0.03)).toFixed(2));
    const polyYesAsk = isEliminated ? 0.02 : Number(Math.max(0.02, Math.min(0.98, modelProb + 0.02)).toFixed(2));
    const polyNoAsk = Number(Math.max(0.02, Math.min(0.98, 1.0 - modelProb + 0.04)).toFixed(2));

    const bestYesAsk = Math.min(kalshiYesAsk, polyYesAsk);
    const bestNoAsk = Math.min(kalshiNoAsk, polyNoAsk);
    const bestYesPlatform: MarketPlatform = kalshiYesAsk <= polyYesAsk ? 'kalshi' : 'polymarket';
    const bestNoPlatform: MarketPlatform = kalshiNoAsk <= polyNoAsk ? 'kalshi' : 'polymarket';

    const evYes = Number((modelProb * (1.0 - bestYesAsk) - (1.0 - modelProb) * bestYesAsk).toFixed(4));
    const evNo = Number(((1.0 - modelProb) * (1.0 - bestNoAsk) - modelProb * bestNoAsk).toFixed(4));

    const roiYesPct = bestYesAsk > 0 ? Number((((1.0 - bestYesAsk) / bestYesAsk) * 100).toFixed(1)) : 0;
    const roiNoPct = bestNoAsk > 0 ? Number((((1.0 - bestNoAsk) / bestNoAsk) * 100).toFixed(1)) : 0;

    const isArbitrage = kalshiYesAsk + polyNoAsk < 0.985 || polyYesAsk + kalshiNoAsk < 0.985;

    let recommendedSide: ContractSide | 'NEUTRAL' = 'NEUTRAL';
    let strategyTag: TemperatureBracket['strategyTag'] = 'NEUTRAL';
    let asymmetryScore = 10;
    let recommendedKellySize = 0;

    if (isArbitrage) {
      recommendedSide = 'YES';
      strategyTag = 'ARBITRAGE';
      asymmetryScore = 99;
      recommendedKellySize = 2500;
    } else if (evYes > 0.04) {
      recommendedSide = 'YES';
      asymmetryScore = Math.min(98, Math.round(evYes * 200 + roiYesPct * 0.2));
      recommendedKellySize = Math.min(4000, Math.round(asymmetryScore * 40));
      if (bestYesAsk <= 0.35 && modelProb >= 0.45) strategyTag = 'EARLY_ALPHA';
      else if (modelProb >= 0.78) strategyTag = 'LATE_SWEEP';
      else strategyTag = 'CORE_EDGE';
    } else if (evNo > 0.04) {
      recommendedSide = 'NO';
      asymmetryScore = Math.min(98, Math.round(evNo * 200 + roiNoPct * 0.2));
      recommendedKellySize = Math.min(4000, Math.round(asymmetryScore * 40));
      if (bestNoAsk <= 0.35 && (1.0 - modelProb) >= 0.45) strategyTag = 'EARLY_ALPHA';
      else if ((1.0 - modelProb) >= 0.78) strategyTag = 'LATE_SWEEP';
      else strategyTag = 'CORE_EDGE';
    }

    return {
      id: b.id,
      cityId: city.id,
      label: b.label,
      minTemp: b.minTemp,
      maxTemp: b.maxTemp,
      strikeTemp: b.strikeTemp,
      isEliminated,
      modelProb: Number(modelProb.toFixed(4)),
      kalshiYesAsk,
      kalshiNoAsk,
      polyYesAsk,
      polyNoAsk,
      bestYesAsk,
      bestNoAsk,
      bestYesPlatform,
      bestNoPlatform,
      evYes,
      evNo,
      roiYesPct,
      roiNoPct,
      asymmetryScore,
      recommendedSide,
      recommendedKellySize,
      isArbitrage,
      strategyTag
    };
  });
}

// ==========================================
// 3. MAIN AURA WX APPLICATION COMPONENT
// ==========================================

export default function App() {
  // Theme state: dark mode (institutional charcoal) vs lite mode
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') return true;
      if (saved === 'lite' || saved === 'light') return false;
      const storedAura = localStorage.getItem('aura_wx_theme');
      if (storedAura === 'dark') return true;
      if (storedAura === 'light') return false;
    } catch {
      // storage disabled
    }
    return true; // Default institutional charcoal dark
  });

  useEffect(() => {
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'lite');
      localStorage.setItem('aura_wx_theme', isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  // Navigation and active city state
  const [activeTab, setActiveTab] = useState<NavTabId>('live-command');
  const [selectedCityId, setSelectedCityId] = useState<CityId>('chicago');
  const [selectedBracketIndex, setSelectedBracketIndex] = useState<number>(2);

  // Market period & countdown state
  const [marketDateStr] = useState<string>(() => {
    return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  });
  const [countdownSeconds, setCountdownSeconds] = useState<number>(34200); // ~9.5 hours to daily market lock
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('PEAK_HEATING');

  // Quantitative data state
  const [cityData, setCityData] = useState<Record<CityId, CityMetadata>>(CITIES);
  const activeCity = cityData[selectedCityId];

  const cityBrackets = useMemo(() => {
    return generateCityBrackets(activeCity);
  }, [activeCity]);

  const activeBracket = cityBrackets[selectedBracketIndex] || cityBrackets[0];

  const allCityEdges = useMemo(() => {
    const list: TemperatureBracket[] = [];
    CITY_KEYS.forEach((cid) => {
      const b = generateCityBrackets(cityData[cid]);
      list.push(...b);
    });
    return list.sort((a, b) => b.asymmetryScore - a.asymmetryScore);
  }, [cityData]);

  // Portfolio, Positions & Tape
  const [portfolioValue, setPortfolioValue] = useState<number>(104850.0);
  const [cashBalance, setCashBalance] = useState<number>(94200.0);
  const [realizedPnL, setRealizedPnL] = useState<number>(4850.0);
  const [positions, setPositions] = useState<Position[]>([
    {
      positionId: 'pos-1',
      bracketId: 'kord-tmax-b3',
      cityId: 'chicago',
      platform: 'kalshi',
      side: 'YES',
      shares: 500,
      averageEntryPrice: 0.42,
      currentPrice: 0.46,
      unrealizedPnL: 20.0,
      costBasis: 210.0
    },
    {
      positionId: 'pos-2',
      bracketId: 'knyc-tmax-b4',
      cityId: 'newyork',
      platform: 'polymarket',
      side: 'NO',
      shares: 800,
      averageEntryPrice: 0.38,
      currentPrice: 0.34,
      unrealizedPnL: 32.0,
      costBasis: 304.0
    }
  ]);

  const [tradeTape, setTradeTape] = useState<TradeOrder[]>([
    { orderId: 'ord-101', bracketId: 'kord-tmax-b3', cityId: 'chicago', platform: 'kalshi', side: 'YES', price: 0.45, shares: 250, totalCost: 112.5, timestamp: Date.now() - 4000 },
    { orderId: 'ord-102', bracketId: 'knyc-tmax-b2', cityId: 'newyork', platform: 'polymarket', side: 'NO', price: 0.62, shares: 400, totalCost: 248.0, timestamp: Date.now() - 9000 },
    { orderId: 'ord-103', bracketId: 'kmia-tmax-b4', cityId: 'miami', platform: 'kalshi', side: 'YES', price: 0.31, shares: 600, totalCost: 186.0, timestamp: Date.now() - 15000 }
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: 'log-1', timestamp: Date.now() - 12000, severity: 'INFO', message: `Google WeatherNext 3 TMAX ingested for 5 cities (${marketDateStr})` },
    { id: 'log-2', timestamp: Date.now() - 7000, severity: 'SIGNAL', message: 'Early Alpha Trigger: Chicago 77°F-78°F YES trading at 44¢ with Model P=58%' },
    { id: 'log-3', timestamp: Date.now() - 3000, severity: 'ORDER', message: 'Filled 250 YES on Kalshi Chicago KORD @ $0.45' }
  ]);

  // AI Autonomous Trading Switch & Risk Settings
  const [autoTrading, setAutoTrading] = useState<boolean>(false);
  const [minEvHurdle, setMinEvHurdle] = useState<number>(6.0);
  const [kellyMultiplier, setKellyMultiplier] = useState<number>(0.25);
  const [maxPositionSize, setMaxPositionSize] = useState<number>(3000);

  // Staged Order Modal State
  const [stagedBracket, setStagedBracket] = useState<TemperatureBracket | null>(null);
  const [stagedSide, setStagedSide] = useState<ContractSide>('YES');
  const [stagedPlatform, setStagedPlatform] = useState<MarketPlatform>('kalshi');
  const [stagedPrice, setStagedPrice] = useState<number>(0.5);
  const [stagedShares, setStagedShares] = useState<number>(100);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 86400));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Autonomous AI agent simulated execution loop
  useEffect(() => {
    if (!autoTrading) return;
    const interval = setInterval(() => {
      const topOpportunity = allCityEdges.find(
        (e) => !positions.some((p) => p.bracketId === e.id) && (e.evYes > minEvHurdle / 100 || e.evNo > minEvHurdle / 100)
      );

      if (topOpportunity) {
        const side = topOpportunity.recommendedSide !== 'NEUTRAL' ? topOpportunity.recommendedSide : 'YES';
        const price = side === 'YES' ? topOpportunity.bestYesAsk : topOpportunity.bestNoAsk;
        const platform = side === 'YES' ? topOpportunity.bestYesPlatform : topOpportunity.bestNoPlatform;
        const shares = Math.min(500, Math.floor(topOpportunity.recommendedKellySize / price));

        if (shares >= 20 && cashBalance >= shares * price) {
          const totalCost = Number((shares * price).toFixed(2));
          const newOrder: TradeOrder = {
            orderId: `ord-${Date.now().toString(36)}`,
            bracketId: topOpportunity.id,
            cityId: topOpportunity.cityId,
            platform,
            side,
            price,
            shares,
            totalCost,
            timestamp: Date.now()
          };

          const newPosition: Position = {
            positionId: `pos-${Date.now().toString(36)}`,
            bracketId: topOpportunity.id,
            cityId: topOpportunity.cityId,
            platform,
            side,
            shares,
            averageEntryPrice: price,
            currentPrice: price,
            unrealizedPnL: 0,
            costBasis: totalCost
          };

          setCashBalance((c) => Number((c - totalCost).toFixed(2)));
          setPositions((p) => [newPosition, ...p]);
          setTradeTape((t) => [newOrder, ...t.slice(0, 20)]);
          setAuditLogs((l) => [
            {
              id: `log-${Date.now().toString(36)}`,
              timestamp: Date.now(),
              severity: 'ORDER',
              message: `AI Auto-Execution: ${shares} ${side} on ${CITIES[topOpportunity.cityId].name} (${topOpportunity.label}) @ $${price.toFixed(2)} [${platform.toUpperCase()}]`
            },
            ...l.slice(0, 50)
          ]);
        }
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [autoTrading, allCityEdges, positions, minEvHurdle, cashBalance]);

  // Execute manual trade
  const handleExecuteTrade = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!stagedBracket) return;
    const totalCost = Number((stagedShares * stagedPrice).toFixed(2));
    if (totalCost > cashBalance) {
      alert('Insufficient cash balance!');
      return;
    }

    const newOrder: TradeOrder = {
      orderId: `ord-${Date.now().toString(36)}`,
      bracketId: stagedBracket.id,
      cityId: stagedBracket.cityId,
      platform: stagedPlatform,
      side: stagedSide,
      price: stagedPrice,
      shares: stagedShares,
      totalCost,
      timestamp: Date.now()
    };

    const newPosition: Position = {
      positionId: `pos-${Date.now().toString(36)}`,
      bracketId: stagedBracket.id,
      cityId: stagedBracket.cityId,
      platform: stagedPlatform,
      side: stagedSide,
      shares: stagedShares,
      averageEntryPrice: stagedPrice,
      currentPrice: stagedPrice,
      unrealizedPnL: 0,
      costBasis: totalCost
    };

    setCashBalance((c) => Number((c - totalCost).toFixed(2)));
    setPositions((p) => [newPosition, ...p]);
    setTradeTape((t) => [newOrder, ...t.slice(0, 20)]);
    setAuditLogs((l) => [
      {
        id: `log-${Date.now().toString(36)}`,
        timestamp: Date.now(),
        severity: 'ORDER',
        message: `Manual Order Filled: ${stagedShares} ${stagedSide} on ${CITIES[stagedBracket.cityId].name} (${stagedBracket.label}) @ $${stagedPrice.toFixed(2)}`
      },
      ...l.slice(0, 50)
    ]);
    setStagedBracket(null);
  }, [stagedBracket, stagedShares, stagedPrice, stagedPlatform, stagedSide, cashBalance]);

  const openOrderModal = (bracket: TemperatureBracket, side: ContractSide = 'YES') => {
    setStagedBracket(bracket);
    setStagedSide(side);
    const p = side === 'YES' ? bracket.bestYesPlatform : bracket.bestNoPlatform;
    setStagedPlatform(p);
    const pr = side === 'YES' ? bracket.bestYesAsk : bracket.bestNoAsk;
    setStagedPrice(pr);
    setStagedShares(Math.max(50, Math.floor(1000 / pr)));
  };

  const closePosition = (id: string) => {
    setPositions((prev) => {
      const target = prev.find((p) => p.positionId === id);
      if (!target) return prev;
      const proceeds = target.shares * target.currentPrice;
      const pnl = proceeds - target.costBasis;
      setCashBalance((c) => Number((c + proceeds).toFixed(2)));
      setRealizedPnL((r) => Number((r + pnl).toFixed(2)));
      setPortfolioValue((v) => Number((v + pnl).toFixed(2)));
      setAuditLogs((l) => [
        {
          id: `log-${Date.now().toString(36)}`,
          timestamp: Date.now(),
          severity: 'ORDER',
          message: `Closed position ${target.bracketId}: PnL ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`
        },
        ...l.slice(0, 50)
      ]);
      return prev.filter((p) => p.positionId !== id);
    });
  };

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${isDark ? 'bg-[#0f141c] text-[#cbd5e1]' : 'bg-[#f8fafc] text-[#0f172a]'}`}>
      {/* ========================================================
          TOP STATUS BAR & NAVIGATION
      ======================================================== */}
      <header className={`sticky top-0 z-40 w-full border-b transition-colors px-3 sm:px-6 py-2.5 backdrop-blur-md ${isDark ? 'bg-[#0f141c]/95 border-[#263147]' : 'bg-white/95 border-slate-200 shadow-xs'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 max-w-[1920px] mx-auto">
          {/* Left: Branding & Session Phase */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-sm sm:text-base font-extrabold tracking-wider uppercase">
                Aura<span className="text-sky-500"> WX Terminal</span>
              </span>
              <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-sky-500/10 text-sky-500 border border-sky-500/30 rounded font-semibold">
                TMAX DAILY
              </span>
            </div>

            <div className={`h-4 w-[1px] hidden sm:block ${isDark ? 'bg-[#263147]' : 'bg-slate-200'}`} />

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold bg-sky-500/10 text-sky-500 border border-sky-500/20 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Solar Peak Heating (Active)</span>
            </div>
          </div>

          {/* Center: Daily Market Countdown Timer */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono ${isDark ? 'bg-[#181f2c] border-[#263147]' : 'bg-slate-100 border-slate-200 shadow-xs'}`}>
            <Clock className="w-4 h-4 text-sky-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider opacity-60">
                DAILY MARKET LOCK ({marketDateStr})
              </span>
              <span className="font-bold text-sm sm:text-base text-emerald-500 tabular-nums">
                {formatCountdown(countdownSeconds)}
              </span>
            </div>
          </div>

          {/* Right: Latency, Theme Switcher, AI Agent, Portfolio Equity */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Latencies */}
            <div className={`hidden lg:flex items-center gap-2.5 text-[11px] font-mono px-2.5 py-1 rounded border ${isDark ? 'bg-[#181f2c] border-[#263147]' : 'bg-slate-100 border-slate-200'}`}>
              <span>KX: <strong className="text-emerald-500">12ms</strong></span>
              <span>POLY: <strong className="text-emerald-500">18ms</strong></span>
              <span className="flex items-center gap-0.5 text-sky-500"><Zap className="w-3 h-3" /> WX3: <strong>32ms</strong></span>
            </div>

            {/* THEME TOGGLE BUTTON */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono border transition-all flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-[#263147] border-[#334155] text-amber-300 hover:bg-[#334155]'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 shadow-xs'
              }`}
            >
              {isDark ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">🌙 Dark Mode (Pro)</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">☀️ Lite Mode (Clean)</span>
                </>
              )}
            </button>

            {/* AI Agent Toggle */}
            <button
              onClick={() => setAutoTrading(!autoTrading)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
                autoTrading
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-xs'
                  : isDark ? 'bg-[#181f2c] border-[#263147] text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              {autoTrading ? <Pause className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
              <span>{autoTrading ? 'AGENT: ON' : 'AGENT: OFF'}</span>
            </button>

            {/* Equity Badge */}
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border font-mono text-xs ${isDark ? 'bg-[#181f2c] border-[#263147]' : 'bg-slate-100 border-slate-200'}`}>
              <div className="flex flex-col text-right">
                <span className="text-[9px] opacity-60">EQUITY</span>
                <span className="font-bold tabular-nums">${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <span className="text-[10px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                +${realizedPnL.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================
          MOBILE HORIZONTAL CITY SELECTION STRIP
      ======================================================== */}
      <div className={`lg:hidden sticky top-[53px] z-30 w-full border-b px-2 py-1.5 overflow-x-auto no-scrollbar backdrop-blur-md ${isDark ? 'bg-[#0f141c]/95 border-[#263147]' : 'bg-white/95 border-slate-200'}`}>
        <div className="flex items-center gap-1.5 min-w-max">
          {CITY_KEYS.map((cid) => {
            const c = cityData[cid];
            const isSel = selectedCityId === cid;
            return (
              <button
                key={cid}
                onClick={() => setSelectedCityId(cid)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                  isSel
                    ? 'bg-sky-500/20 text-sky-400 border-sky-500/60 font-bold'
                    : isDark ? 'bg-[#181f2c] border-[#263147] text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                <span>{c.name}</span>
                <span className="opacity-40">•</span>
                <span className={isSel ? 'text-emerald-400 font-bold' : ''}>Max {c.runningHigh}°</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          MAIN WORKSPACE LAYOUT (PERSISTENT SIDEBAR + VIEWS)
      ======================================================== */}
      <div className="flex flex-row overflow-hidden min-h-[calc(100vh-53px)]">
        {/* Desktop Sidebar Navigation */}
        <aside className={`hidden lg:flex flex-col w-64 border-r p-3.5 shrink-0 overflow-y-auto ${isDark ? 'bg-[#0f141c] border-[#263147]' : 'bg-slate-50 border-slate-200'}`}>
          <div className="space-y-1 mb-5">
            <div className="text-[10px] font-mono uppercase tracking-wider opacity-50 px-2 mb-2 font-semibold">
              Trading Terminal
            </div>
            {[
              { id: 'live-command' as NavTabId, label: 'Live Command', icon: <Layers className="w-4 h-4" />, badge: 'CLOB' },
              { id: 'pre-market-intel' as NavTabId, label: 'Pre-Market Intel', icon: <Sparkles className="w-4 h-4" />, badge: 'ALPHA' },
              { id: 'city-deep-dive' as NavTabId, label: 'City Deep-Dive', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'agent-config' as NavTabId, label: 'Agent Config / Logs', icon: <Sliders className="w-4 h-4" />, badge: positions.length > 0 ? `${positions.length}` : undefined }
            ].map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono font-medium transition-all border cursor-pointer ${
                    active
                      ? 'bg-sky-500/15 text-sky-400 border-sky-500/50 shadow-xs'
                      : isDark ? 'text-slate-400 border-transparent hover:bg-[#181f2c]' : 'text-slate-600 border-transparent hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={active ? 'text-sky-400' : 'opacity-60'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 5 Core Weather Cities */}
          <div className="space-y-1 mb-5">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider opacity-50 font-semibold">
                Core 5 Cities
              </span>
              <span className="text-[10px] font-mono text-sky-500 flex items-center gap-1 font-semibold">
                NOAA ASOS
              </span>
            </div>

            {CITY_KEYS.map((cid) => {
              const c = cityData[cid];
              const isSel = selectedCityId === cid;
              return (
                <div
                  key={cid}
                  className={`rounded-lg transition-all border ${
                    isSel
                      ? isDark ? 'bg-[#181f2c] border-[#33415e] shadow-xs' : 'bg-white border-slate-300 shadow-xs'
                      : 'border-transparent hover:bg-slate-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between px-3 py-2">
                    <button
                      onClick={() => setSelectedCityId(cid)}
                      className="flex-1 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs ${isSel ? 'font-bold' : 'font-medium'}`}>{c.name}</span>
                        <span className="text-[10px] font-mono opacity-50">{c.stationCode}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono mt-0.5">
                        <span className="text-emerald-500 font-bold">Max {c.runningHigh}°F</span>
                        <span className="opacity-30">•</span>
                        <span className="opacity-60 text-[10px]">TMAX {c.forecastTmax}°</span>
                      </div>
                    </button>

                    <a
                      href={c.directLinks.kalshiUrl}
                      target="_blank"
                      rel="noreferrer"
                      title={`Open ${c.name} on Kalshi`}
                      className="p-1 rounded opacity-50 hover:opacity-100 hover:text-sky-400 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Strategy Summary Card */}
          <div className="mt-auto pt-3 border-t border-slate-500/20">
            <div className={`p-2.5 rounded-lg border text-xs font-mono ${isDark ? 'bg-[#181f2c] border-[#263147]' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-sky-500" /> AI Terminal</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${autoTrading ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                  {autoTrading ? 'AUTONOMOUS' : 'MANUAL'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] opacity-70">
                <div>Positions: <strong className="opacity-100">{positions.length}</strong></div>
                <div>Win Rate: <strong className="text-emerald-500">71.2%</strong></div>
                <div>Kelly Cap: <strong className="opacity-100">{kellyMultiplier}x</strong></div>
                <div>Min EV: <strong className="text-sky-500">+{minEvHurdle}%</strong></div>
              </div>
            </div>
          </div>
        </aside>

        {/* Viewport Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 max-w-[1920px] mx-auto w-full pb-20 lg:pb-6">
          {/* TAB 1: LIVE COMMAND VIEW */}
          {activeTab === 'live-command' && (
            <div className="space-y-4">
              {/* City Banner */}
              <div className={`p-4 sm:p-5 rounded-xl border ${isDark ? 'bg-[#181f2c] border-[#263147]' : 'bg-white border-slate-200 shadow-xs'}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-bold">{activeCity.name} Daily High Terminal</h1>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-bold border border-sky-500/30">
                        {activeCity.stationCode}
                      </span>
                      <div className="flex items-center gap-1.5 ml-2">
                        <a
                          href={activeCity.directLinks.kalshiUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/25 flex items-center gap-1"
                        >
                          <span>Kalshi TMAX</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <a
                          href={activeCity.directLinks.polymarketUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 text-[10px] font-mono rounded bg-purple-500/15 text-purple-400 border border-purple-500/40 hover:bg-purple-500/25 flex items-center gap-1"
                        >
                          <span>Polymarket</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                    <p className="text-xs opacity-60 font-mono mt-1">
                      {activeCity.stationName} • {activeCity.nwsClimateOffice} • Market Date: {marketDateStr}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-mono opacity-50">RUNNING DAILY HIGH</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-mono font-extrabold text-emerald-500 tabular-nums">
                          {activeCity.runningHigh}°
                        </span>
                        <span className="text-sm font-mono opacity-50">F</span>
                      </div>
                    </div>
                    <div className={`h-8 w-[1px] ${isDark ? 'bg-[#263147]' : 'bg-slate-200'}`} />
                    <div className="flex flex-col text-[11px] font-mono opacity-70">
                      <span>Ambient: <strong>{activeCity.currentAmbient}°F</strong></span>
                      <span>Model TMAX: <strong className="text-sky-400">{activeCity.forecastTmax}°F</strong></span>
                      <span>Peak Zenith: <strong>{activeCity.solarZenith}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bracket Pills Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
                {cityBrackets.map((b, idx) => {
                  const isSel = selectedBracketIndex === idx;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBracketIndex(idx)}
                      className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                        isSel
                          ? 'bg-sky-500/20 border-sky-500/70 shadow-xs'
                          : isDark ? 'bg-[#181f2c] border-[#263147] hover:border-slate-600' : 'bg-white border-slate-200 hover:border-slate-300'
                      } ${b.isEliminated ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold">{b.label}</span>
                        {b.isEliminated ? (
                          <span className="text-[8px] px-1 rounded bg-rose-500/20 text-rose-400 font-bold">SURPASSED</span>
                        ) : b.isArbitrage ? (
                          <span className="text-[8px] px-1 rounded bg-amber-500/20 text-amber-400 font-bold animate-pulse">ARB</span>
                        ) : (
                          <span className="text-[9px] font-bold text-sky-400">{(b.modelProb * 100).toFixed(0)}%</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px] opacity-70">
                        <span>Best:</span>
                        <span className="font-bold">${b.bestYesAsk.toFixed(2)} Y / ${b.bestNoAsk.toFixed(2)} N</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Order Book & Positions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Dual CLOB Column */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Quote Banner */}
                  <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${isDark ? 'bg-[#181f2c] border-[#263147]' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                      <span className="opacity-60">ACTIVE QUOTE:</span>
                      <strong className="text-emerald-500">YES ${activeBracket.bestYesAsk.toFixed(2)} ({activeBracket.bestYesPlatform.toUpperCase()})</strong>
                      <span className="opacity-30">|</span>
                      <strong className="text-rose-500">NO ${activeBracket.bestNoAsk.toFixed(2)} ({activeBracket.bestNoPlatform.toUpperCase()})</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="opacity-60">MODEL EDGE:</span>
                      <strong className="text-sky-400">{activeBracket.evYes >= 0 ? `YES +${(activeBracket.evYes * 100).toFixed(1)}%` : `NO +${(activeBracket.evNo * 100).toFixed(1)}%`}</strong>
                      <button
                        onClick={() => openOrderModal(activeBracket, activeBracket.evYes >= activeBracket.evNo ? 'YES' : 'NO')}
                        className="ml-2 px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-xs cursor-pointer"
                      >
                        STAGE ORDER
                      </button>
                    </div>
                  </div>

                  {/* Order Book Depth Card */}
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#181f2c] border-[#263147]' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-500/20 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">CLOB ORDER BOOK ({activeBracket.label})</span>
                        <a href={activeCity.directLinks.kalshiUrl} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline flex items-center gap-0.5 text-[10px]">
                          <span>Kalshi</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <span className="opacity-60">Mid: ${((activeBracket.bestYesAsk + activeBracket.bestNoAsk) / 2).toFixed(2)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                      {/* Bids */}
                      <div>
                        <span className="text-[10px] text-emerald-500 font-bold uppercase block mb-1">Buy Orders (Bids)</span>
                        <div className="space-y-1">
                          {[
                            { price: activeBracket.bestYesAsk - 0.01, size: 850 },
                            { price: activeBracket.bestYesAsk - 0.02, size: 1420 },
                            { price: activeBracket.bestYesAsk - 0.03, size: 2100 }
                          ].map((b, i) => (
                            <div key={i} className="flex justify-between p-1.5 rounded bg-emerald-500/10 text-emerald-400">
                              <span className="font-bold">${b.price.toFixed(2)}</span>
                              <span>{b.size.toLocaleString()} shares</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Asks */}
                      <div>
                        <span className="text-[10px] text-rose-500 font-bold uppercase block mb-1">Sell Orders (Asks)</span>
                        <div className="space-y-1">
                          {[
                            { price: activeBracket.bestYesAsk, size: 620 },
                            { price: activeBracket.bestYesAsk + 0.01, size: 1150 },
                            { price: activeBracket.bestYesAsk + 0.02, size: 1980 }
                          ].map((a, i) => (
                            <div key={i} className="flex justify-between p-1.5 rounded bg-rose-500/10 text-rose-400">
                              <span className="font-bold">${a.price.toFixed(2)}</span>
                              <span>{a.size.toLocaleString()} shares</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Active Positions & Live Trade Tape */}
                <div className="space-y-4">
                  {/* Positions */}
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#181f2c] border-[#263147]' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-500/20 font-mono text-xs font-bold">
                      <span>Active Positions ({positions.length})</span>
                      <span className="text-emerald-500">+${positions.reduce((s, p) => s + p.unrealizedPnL, 0).toFixed(2)}</span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 font-mono text-xs">
                      {positions.map((pos) => (
                        <div key={pos.positionId} className={`p-2 rounded-lg border flex items-center justify-between ${isDark ? 'bg-[#0f141c] border-[#263147]' : 'bg-slate-50 border-slate-200'}`}>
                          <div>
                            <div className="font-bold">
                              <span className={pos.side === 'YES' ? 'text-emerald-400' : 'text-rose-400'}>{pos.shares} {pos.side}</span> {CITIES[pos.cityId].name}
                            </div>
                            <span className="text-[10px] opacity-60">Avg ${pos.averageEntryPrice.toFixed(2)} • Cost ${pos.costBasis.toFixed(0)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-400">+${pos.unrealizedPnL.toFixed(2)}</span>
                            <button
                              onClick={() => closePosition(pos.positionId)}
                              className="px-2 py-0.5 rounded bg-slate-500/20 hover:bg-slate-500/40 text-[10px] cursor-pointer"
                            >
                              CLOSE
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Live Trade Tape */}
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#181f2c] border-[#263147]' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-500/20 font-mono text-xs font-bold">
                      <span className="flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 text-sky-500 animate-pulse" /> Live Trades</span>
                      <span className="opacity-50">KALSHI &amp; POLY</span>
                    </div>

                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 font-mono text-xs">
                      {tradeTape.map((t) => (
                        <div key={t.orderId} className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-500/10 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold ${t.side === 'YES' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.side}</span>
                            <span>{t.shares} @ ${t.price.toFixed(2)}</span>
                            <span className="opacity-60 font-sans">({CITIES[t.cityId].stationCode})</span>
                          </div>
                          <span className="text-[9px] uppercase opacity-50">{t.platform}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRE-MARKET INTEL VIEW */}
          {activeTab === 'pre-market-intel' && (
            <div className="space-y-4">
              {/* Header Banner */}
              <div className={`p-4 sm:p-5 rounded-xl border ${isDark ? 'bg-[#181f2c] border-[#263147]' : 'bg-white border-slate-200 shadow-xs'}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Daily High (TMAX) Pre-Market Intelligence Matrix</h2>
                      <p className="text-xs opacity-60 font-mono mt-0.5">
                        High-resolution probability density calculations across Chicago, New York, Los Angeles, Miami &amp; Austin
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      // Batch execute positive EV
                      alert('Simulated batch execution of positive EV opportunities complete!');
                    }}
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Cpu className="w-4 h-4" />
                    <span>STAGE POSITIVE EV (ALL CITIES)</span>
                  </button>
                </div>
              </div>

              {/* Edge Matrix Table */}
              <div className={`p-4 rounded-xl border overflow-x-auto ${isDark ? 'bg-[#181f2c] border-[#263147]' : 'bg-white border-slate-200'}`}>
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-500/20 text-[10px] uppercase opacity-50">
                      <th className="py-2.5 px-2">City / Strike</th>
                      <th className="py-2.5 px-2">Model P</th>
                      <th className="py-2.5 px-2">Kalshi Y/N</th>
                      <th className="py-2.5 px-2">Poly Y/N</th>
                      <th className="py-2.5 px-2 text-emerald-400">EV YES</th>
                      <th className="py-2.5 px-2 text-rose-400">EV NO</th>
                      <th className="py-2.5 px-2">Max ROI</th>
                      <th className="py-2.5 px-2 text-sky-400">Score</th>
                      <th className="py-2.5 px-2 text-right">Market Link &amp; Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-500/10">
                    {allCityEdges.map((edge) => {
                      const c = CITIES[edge.cityId];
                      return (
                        <tr key={`${edge.cityId}-${edge.id}`} className="hover:bg-slate-500/10 transition-colors">
                          <td className="py-2.5 px-2 font-bold font-sans">
                            <div>{c.name} • {edge.label}</div>
                            <span className="text-[10px] font-mono opacity-50">{c.stationCode}</span>
                          </td>
                          <td className="py-2.5 px-2 font-bold text-sky-400">{(edge.modelProb * 100).toFixed(1)}%</td>
                          <td className="py-2.5 px-2 opacity-80">${edge.kalshiYesAsk.toFixed(2)} / ${edge.kalshiNoAsk.toFixed(2)}</td>
                          <td className="py-2.5 px-2 opacity-80">${edge.polyYesAsk.toFixed(2)} / ${edge.polyNoAsk.toFixed(2)}</td>
                          <td className="py-2.5 px-2 font-bold text-emerald-400">+{((edge.evYes) * 100).toFixed(1)}%</td>
                          <td className="py-2.5 px-2 font-bold text-rose-400">+{((edge.evNo) * 100).toFixed(1)}%</td>
                          <td className="py-2.5 px-2 font-bold">+{Math.max(edge.roiYesPct, edge.roiNoPct).toFixed(0)}%</td>
                          <td className="py-2.5 px-2">
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold text-[10px]">
                              {edge.isArbitrage ? 'ARB 99' : edge.asymmetryScore}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={c.directLinks.kalshiUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-1.5 py-1 rounded bg-slate-500/15 hover:bg-slate-500/30 text-[10px] flex items-center gap-0.5"
                              >
                                <span>KX</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                              <button
                                onClick={() => openOrderModal(edge, edge.recommendedSide !== 'NEUTRAL' ? edge.recommendedSide : 'YES')}
                                className={`px-2.5 py-1 rounded font-bold text-xs cursor-pointer ${
                                  edge.recommendedSide === 'YES' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'
                                }`}
                              >
                                STAGE {edge.recommendedSide !== 'NEUTRAL' ? edge.recommendedSide : 'ORDER'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CITY DEEP-DIVE VIEW */}
          {activeTab === 'city-deep-dive' && (
            <div className="space-y-4">
              {/* City Switcher Strip */}
              <div className="flex flex-wrap items-center gap-2">
                {CITY_KEYS.map((cid) => {
                  const c = cityData[cid];
                  const isSel = selectedCityId === cid;
                  return (
                    <button
                      key={cid}
                      onClick={() => setSelectedCityId(cid)}
                      className={`px-3 py-2 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                        isSel
                          ? 'bg-sky-500/20 text-sky-400 border-sky-500/60 shadow-xs'
                          : isDark ? 'bg-[#181f2c] border-[#263147] text-slate-400' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {c.name} (Max {c.runningHigh}°F)
                    </button>
                  );
                })}
              </div>

              {/* Interactive Gaussian SVG Curve */}
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#181f2c] border-[#263147]' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-500/20 font-mono text-xs">
                  <span className="font-bold text-sky-400">WeatherNext 3 TMAX Gaussian Probability Density</span>
                  <div className="flex items-center gap-3">
                    <span>μ TMAX: <strong>{activeCity.forecastTmax}°F</strong></span>
                    <span>σ: <strong>±{activeCity.stdDev}°F</strong></span>
                    <span className="text-emerald-400">Running Max: <strong>{activeCity.runningHigh}°F</strong></span>
                  </div>
                </div>

                {/* SVG Curve */}
                <div className="w-full overflow-x-auto py-2">
                  <svg viewBox="0 0 600 180" className="w-full h-auto min-w-[320px]">
                    <defs>
                      <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Baseline */}
                    <line x1="30" y1="140" x2="570" y2="140" stroke="#64748b" strokeWidth="1.5" strokeOpacity="0.3" />

                    {/* Gaussian Curve Path */}
                    <path
                      d="M 30 140 Q 150 140 230 110 Q 300 20 370 110 Q 450 140 570 140 Z"
                      fill="url(#curveGrad)"
                    />
                    <path
                      d="M 30 140 Q 150 140 230 110 Q 300 20 370 110 Q 450 140 570 140"
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="2.5"
                    />

                    {/* Mean Line */}
                    <line x1="300" y1="20" x2="300" y2="140" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx="300" cy="20" r="3" fill="#38bdf8" />
                    <text x="300" y="160" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                      Mean {activeCity.forecastTmax}°F
                    </text>

                    {/* Running High Marker Pin */}
                    <circle cx="270" cy="55" r="5" fill="#10b981" />
                    <line x1="270" y1="55" x2="270" y2="140" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" />
                    <text x="270" y="172" textAnchor="middle" fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      Live Max {activeCity.runningHigh}°F
                    </text>
                  </svg>
                </div>
              </div>

              {/* Sensor & Telemetry Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#181f2c] border-[#263147]' : 'bg-white border-slate-200'}`}>
                  <span className="opacity-60 block text-[10px]">DEW POINT &amp; HUMIDITY</span>
                  <div className="text-base font-bold mt-1">{activeCity.dewPoint}°F ({activeCity.humidity}%)</div>
                </div>
                <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#181f2c] border-[#263147]' : 'bg-white border-slate-200'}`}>
                  <span className="opacity-60 block text-[10px]">BAROMETRIC PRESSURE</span>
                  <div className="text-base font-bold mt-1">{activeCity.pressure} inHg</div>
                </div>
                <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#181f2c] border-[#263147]' : 'bg-white border-slate-200'}`}>
                  <span className="opacity-60 block text-[10px]">WIND VELOCITY</span>
                  <div className="text-base font-bold mt-1">{activeCity.windSpeed} mph</div>
                </div>
                <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#181f2c] border-[#263147]' : 'bg-white border-slate-200'}`}>
                  <span className="opacity-60 block text-[10px]">BRIER CALIBRATION SCORE</span>
                  <div className="text-base font-bold text-emerald-400 mt-1">{activeCity.brierScore}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AGENT CONFIG / LOGS VIEW */}
          {activeTab === 'agent-config' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Agent Control Form */}
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#181f2c] border-[#263147]' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-500/20">
                    <span className="font-bold flex items-center gap-1.5"><Sliders className="w-4 h-4 text-sky-400" /> AI Execution Settings</span>
                    <span className="text-[10px] text-emerald-400 font-bold">READY</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Minimum EV Hurdle</span>
                        <strong className="text-sky-400">+{minEvHurdle}%</strong>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="20"
                        step="0.5"
                        value={minEvHurdle}
                        onChange={(e) => setMinEvHurdle(parseFloat(e.target.value))}
                        className="w-full accent-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block mb-1">Kelly Sizing Fraction</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[0.1, 0.25, 0.5, 1.0].map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setKellyMultiplier(k)}
                            className={`py-1 rounded border text-center cursor-pointer ${
                              kellyMultiplier === k ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 font-bold' : isDark ? 'bg-[#0f141c] border-[#263147]' : 'bg-slate-100 border-slate-200'
                            }`}
                          >
                            {k}x
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1">Max Position Size ($ USD)</label>
                      <input
                        type="number"
                        step="500"
                        value={maxPositionSize}
                        onChange={(e) => setMaxPositionSize(parseInt(e.target.value) || 1000)}
                        className={`w-full p-2 rounded border font-bold ${isDark ? 'bg-[#0f141c] border-[#263147] text-white' : 'bg-white border-slate-300 text-black'}`}
                      />
                    </div>
                  </div>
                </div>

                {/* System Status Telemetry */}
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#181f2c] border-[#263147]' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-500/20">
                    <span className="font-bold flex items-center gap-1.5"><Server className="w-4 h-4 text-sky-400" /> Exchange Connectivity</span>
                    <span className="text-[10px] text-emerald-400 font-bold">ALL ONLINE</span>
                  </div>

                  <div className="space-y-2">
                    <div className={`p-2 rounded border flex justify-between ${isDark ? 'bg-[#0f141c] border-[#263147]' : 'bg-slate-50 border-slate-200'}`}>
                      <span>Kalshi REST/WebSocket API</span>
                      <strong className="text-emerald-400">12ms</strong>
                    </div>
                    <div className={`p-2 rounded border flex justify-between ${isDark ? 'bg-[#0f141c] border-[#263147]' : 'bg-slate-50 border-slate-200'}`}>
                      <span>Polymarket CLOB Relayer</span>
                      <strong className="text-emerald-400">18ms</strong>
                    </div>
                    <div className={`p-2 rounded border flex justify-between ${isDark ? 'bg-[#0f141c] border-[#263147]' : 'bg-slate-50 border-slate-200'}`}>
                      <span>Google WeatherNext 3 Framework</span>
                      <strong className="text-sky-400">32ms</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Logs Trail */}
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#181f2c] border-[#263147]' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-500/20 font-bold">
                  <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-sky-400" /> Audit Log Trail</span>
                  <span className="opacity-50 text-[10px]">{auditLogs.length} events recorded</span>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 text-[11px]">
                  {auditLogs.map((l) => (
                    <div key={l.id} className={`p-2 rounded border flex items-center justify-between ${isDark ? 'bg-[#0f141c] border-[#263147]' : 'bg-slate-50 border-slate-200'}`}>
                      <span>{l.message}</span>
                      <span className="opacity-40 text-[9px] shrink-0 ml-2">{new Date(l.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================
          MOBILE BOTTOM NAVIGATION BAR
      ======================================================== */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t pb-safe ${isDark ? 'bg-[#0f141c]/95 border-[#263147]' : 'bg-white/95 border-slate-200 shadow-lg'}`}>
        <div className="grid grid-cols-4 h-16">
          {[
            { id: 'live-command' as NavTabId, label: 'Command', icon: <Layers className="w-5 h-5" /> },
            { id: 'pre-market-intel' as NavTabId, label: 'Intel', icon: <Sparkles className="w-5 h-5" /> },
            { id: 'city-deep-dive' as NavTabId, label: 'Deep-Dive', icon: <BarChart3 className="w-5 h-5" /> },
            { id: 'agent-config' as NavTabId, label: 'Agent', icon: <Sliders className="w-5 h-5" /> }
          ].map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                  active ? 'text-sky-500 font-bold' : 'opacity-60'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-mono">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ========================================================
          QUICK ORDER STAGING MODAL
      ======================================================== */}
      {stagedBracket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md">
            <div className={`p-5 rounded-2xl border shadow-2xl font-mono text-xs ${isDark ? 'bg-[#181f2c] border-[#33415e]' : 'bg-white border-slate-300'}`}>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-500/20">
                <span className="font-bold text-sm">STAGE ORDER: {CITIES[stagedBracket.cityId].name} ({stagedBracket.label})</span>
                <button onClick={() => setStagedBracket(null)} className="p-1 rounded opacity-60 hover:opacity-100 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleExecuteTrade} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStagedSide('YES')}
                    className={`py-2 rounded-lg font-bold text-center border cursor-pointer ${stagedSide === 'YES' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-500/10 border-slate-500/30'}`}
                  >
                    BUY YES
                  </button>
                  <button
                    type="button"
                    onClick={() => setStagedSide('NO')}
                    className={`py-2 rounded-lg font-bold text-center border cursor-pointer ${stagedSide === 'NO' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-500/10 border-slate-500/30'}`}
                  >
                    BUY NO
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStagedPlatform('kalshi')}
                    className={`py-1.5 rounded text-center border cursor-pointer ${stagedPlatform === 'kalshi' ? 'bg-slate-500/20 border-sky-500 font-bold' : 'border-slate-500/20'}`}
                  >
                    Kalshi (USD)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStagedPlatform('polymarket')}
                    className={`py-1.5 rounded text-center border cursor-pointer ${stagedPlatform === 'polymarket' ? 'bg-slate-500/20 border-sky-500 font-bold' : 'border-slate-500/20'}`}
                  >
                    Polymarket (USDC)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] opacity-60 mb-1">Limit Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="0.99"
                      value={stagedPrice}
                      onChange={(e) => setStagedPrice(parseFloat(e.target.value) || 0.01)}
                      className={`w-full p-2 rounded border font-bold ${isDark ? 'bg-[#0f141c] border-[#263147]' : 'bg-slate-50 border-slate-300'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] opacity-60 mb-1">Quantity (Shares)</label>
                    <input
                      type="number"
                      step="50"
                      min="10"
                      value={stagedShares}
                      onChange={(e) => setStagedShares(parseInt(e.target.value) || 10)}
                      className={`w-full p-2 rounded border font-bold ${isDark ? 'bg-[#0f141c] border-[#263147]' : 'bg-slate-50 border-slate-300'}`}
                    />
                  </div>
                </div>

                <div className={`p-3 rounded-lg border space-y-1.5 ${isDark ? 'bg-[#0f141c] border-[#263147]' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between">
                    <span>Total Cost:</span>
                    <strong>${(stagedShares * stagedPrice).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Potential Payout:</span>
                    <strong>${(stagedShares * 1.0).toFixed(2)} (+{stagedPrice > 0 ? (((1.0 - stagedPrice) / stagedPrice) * 100).toFixed(0) : 0}%)</strong>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-lg font-bold text-sm tracking-wide transition-all cursor-pointer ${
                    stagedSide === 'YES' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  EXECUTE ORDER (${(stagedShares * stagedPrice).toFixed(2)})
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
