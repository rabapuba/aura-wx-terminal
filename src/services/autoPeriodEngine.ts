// Auto-Period Rollover & Daily Market Lockout Clock Engine for Daily High (TMAX) Markets

import type { DailyMarketPeriod, CityId, TemperatureBracket, SessionPhase } from '../types/weatherMarket';

export interface DailySettlementResolution {
  periodId: string;
  marketDate: string;
  resolvedAt: number;
  officialDailyHighs: Record<CityId, number>;
  winningBrackets: Record<CityId, string>;
}

/**
 * Determine daily session phase based on hour of day (0 to 23)
 */
export function getDailySessionPhase(hour: number): {
  phase: SessionPhase;
  label: string;
} {
  if (hour < 11) {
    return {
      phase: 'PRE_MARKET',
      label: 'Pre-Market Solar Ramp (Morning)'
    };
  } else if (hour < 17) {
    return {
      phase: 'PEAK_HEATING',
      label: 'Peak Solar Heating Window (TMAX Active)'
    };
  } else if (hour < 23) {
    return {
      phase: 'LATE_SWEEP',
      label: 'Late-Session TMAX Sweep (High Locked)'
    };
  } else {
    return {
      phase: 'SETTLEMENT_LOCK',
      label: 'NWS Climate Report Settlement Lock'
    };
  }
}

/**
 * Compute current day start and end timestamps (00:00:00 to 23:59:59)
 */
export function getDailyMarketBoundary(currentTimeMs: number = Date.now()): {
  dayStartMs: number;
  dayEndMs: number;
  periodId: string;
  marketDateStr: string;
} {
  const date = new Date(currentTimeMs);
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const periodId = `TMAX-${yyyy}-${mm}-${dd}`;
  const marketDateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return {
    dayStartMs: start.getTime(),
    dayEndMs: end.getTime(),
    periodId,
    marketDateStr
  };
}

/**
 * Initialize DailyMarketPeriod structure
 */
export function createDailyMarketPeriod(currentTimeMs: number = Date.now()): DailyMarketPeriod {
  const { dayStartMs, dayEndMs, periodId, marketDateStr } = getDailyMarketBoundary(currentTimeMs);
  const timeRemainingMs = Math.max(0, dayEndMs - currentTimeMs);
  const currentHour = new Date(currentTimeMs).getHours();
  const { phase, label } = getDailySessionPhase(currentHour);

  return {
    periodId,
    marketDate: marketDateStr,
    startTime: dayStartMs,
    endTime: dayEndMs,
    marketLockTime: dayEndMs - 60000,
    timeRemainingMs,
    currentPhase: phase,
    phaseLabel: label,
    isMarketOpen: phase !== 'SETTLEMENT_LOCK',
    isSettled: false
  };
}

/**
 * Format milliseconds into HH:MM:SS format
 */
export function formatDailyCountdown(ms: number): {
  formatted: string;
  hours: number;
  minutes: number;
  seconds: number;
  isUrgent: boolean; // < 1 hour
  isCritical: boolean; // < 15 mins
} {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isUrgent = hours === 0;
  const isCritical = hours === 0 && minutes < 15;

  const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    formatted,
    hours,
    minutes,
    seconds,
    isUrgent,
    isCritical
  };
}

export const formatCountdown = formatDailyCountdown;

/**
 * Resolve winning bracket given official NWS ASOS Daily Maximum temperature
 */
export function resolveWinningDailyHighBracket(brackets: TemperatureBracket[], officialMax: number): string {
  for (const bracket of brackets) {
    if (officialMax >= bracket.minTemp && officialMax < bracket.maxTemp) {
      return bracket.id;
    }
  }
  return brackets[brackets.length - 1]?.id ?? '';
}
