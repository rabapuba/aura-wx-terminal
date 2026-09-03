// Auto-Period Rollover & Hourly Boundary Clock Engine

import type { HourlyPeriod, CityId, TemperatureBracket } from '../types/weatherMarket';

export interface RolloverResolution {
  periodId: string;
  resolvedAt: number;
  settlementTemps: Record<CityId, number>;
  winningBrackets: Record<CityId, string>;
}

/**
 * Calculate the next hourly boundary (XX:00:00.000 UTC/Local)
 */
export function getNextHourlyBoundary(currentTimeMs: number = Date.now()): {
  currentPeriodStartMs: number;
  nextPeriodStartMs: number;
  periodId: string;
} {
  const date = new Date(currentTimeMs);
  const currentPeriodStart = new Date(date);
  currentPeriodStart.setMinutes(0, 0, 0);
  const currentPeriodStartMs = currentPeriodStart.getTime();

  const nextPeriodStart = new Date(currentPeriodStartMs + 3600000);
  const nextPeriodStartMs = nextPeriodStart.getTime();

  // Period ID format: YYYYMMDD-HH00
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const periodId = `${yyyy}${mm}${dd}-${hh}00`;

  return {
    currentPeriodStartMs,
    nextPeriodStartMs,
    periodId
  };
}

/**
 * Initialize an HourlyPeriod structure
 */
export function createHourlyPeriod(currentTimeMs: number = Date.now()): HourlyPeriod {
  const { currentPeriodStartMs, nextPeriodStartMs, periodId } = getNextHourlyBoundary(currentTimeMs);
  const timeRemainingMs = Math.max(0, nextPeriodStartMs - currentTimeMs);

  // Pre-market phase occurs during initial 10 mins before active order-matching opens
  // or when remaining time is > 50 mins
  const isPreMarket = timeRemainingMs > 50 * 60 * 1000;

  return {
    periodId,
    startTime: currentPeriodStartMs,
    endTime: nextPeriodStartMs,
    marketOpenTime: currentPeriodStartMs,
    marketCloseTime: nextPeriodStartMs - 60000, // Closes 1 min before official hour mark
    timeRemainingMs,
    isPreMarket,
    isMarketOpen: true,
    isSettled: false
  };
}

/**
 * Format milliseconds into MM:SS or HH:MM:SS format
 */
export function formatCountdown(ms: number): {
  formatted: string;
  minutes: number;
  seconds: number;
  isUrgent: boolean; // < 5 mins
  isCritical: boolean; // < 1 min
} {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isUrgent = totalSeconds < 300; // < 5 minutes
  const isCritical = totalSeconds < 60; // < 1 minute

  let formatted = '';
  if (hours > 0) {
    formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return {
    formatted,
    minutes,
    seconds,
    isUrgent,
    isCritical
  };
}

/**
 * Identify which temperature bracket wins for a given settlement temperature
 */
export function resolveWinningBracket(brackets: TemperatureBracket[], settlementTemp: number): string {
  for (const bracket of brackets) {
    if (settlementTemp >= bracket.minTemp && settlementTemp < bracket.maxTemp) {
      return bracket.id;
    }
  }
  // Fallback to last bracket if out of bounds
  return brackets[brackets.length - 1]?.id ?? '';
}
