import { useState, useEffect, useRef } from 'react';
import { formatCountdown } from '../services/autoPeriodEngine';

export interface CountdownState {
  formatted: string;
  timeRemainingMs: number;
  minutes: number;
  seconds: number;
  isUrgent: boolean;
  isCritical: boolean;
  progressPct: number; // 0 to 100% of current hour completed
}

export function useCountdown(
  targetTimeMs: number,
  startTimeMs: number,
  speedMultiplier: number = 1,
  onExpire?: () => void
): CountdownState {
  const [virtualNow, setVirtualNow] = useState<number>(Date.now());
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const prevVirtualNowRef = useRef(Date.now());
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    hasExpiredRef.current = false;
    prevVirtualNowRef.current = Date.now();
    setVirtualNow(Date.now());

    const interval = setInterval(() => {
      setVirtualNow((prev) => {
        const deltaRealMs = 250;
        const advancedMs = deltaRealMs * speedMultiplier;
        const nextVirtual = prev + advancedMs;

        if (nextVirtual >= targetTimeMs && !hasExpiredRef.current) {
          hasExpiredRef.current = true;
          if (onExpireRef.current) {
            onExpireRef.current();
          }
        }
        return nextVirtual;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [targetTimeMs, speedMultiplier]);

  const rawRemaining = Math.max(0, targetTimeMs - virtualNow);
  const countdownInfo = formatCountdown(rawRemaining);

  const totalPeriodDuration = Math.max(1000, targetTimeMs - startTimeMs);
  const elapsedMs = Math.min(totalPeriodDuration, Math.max(0, virtualNow - startTimeMs));
  const progressPct = Number(((elapsedMs / totalPeriodDuration) * 100).toFixed(1));

  return {
    formatted: countdownInfo.formatted,
    timeRemainingMs: rawRemaining,
    minutes: countdownInfo.minutes,
    seconds: countdownInfo.seconds,
    isUrgent: countdownInfo.isUrgent,
    isCritical: countdownInfo.isCritical,
    progressPct
  };
}
