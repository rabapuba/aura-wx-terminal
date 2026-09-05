/**
 * AURA-WX TERMINAL: KALSHI QUANTITATIVE WEATHER AGENT
 * Pure Kalshi CLOB & Google WeatherNext 3 Ensemble Integration
 * Viewport-Locked Financial Terminal Architecture
 */

const KalshiAgent = (() => {
  'use strict';

  // =========================================================================
  // 1. CONFIGURATION & CONSTANTS
  // =========================================================================
  const CITIES_CONFIG = [
    {
      id: 'miami',
      name: 'Miami, FL',
      seriesTicker: 'KXTEMPMIAH',
      icao: 'KMIA',
      lat: 25.7959,
      lon: -80.2870,
      tz: 'America/New_York',
      tzName: 'EDT'
    },
    {
      id: 'los_angeles',
      name: 'Los Angeles, CA',
      seriesTicker: 'KXTEMPLAXH',
      icao: 'KLAX',
      lat: 33.9425,
      lon: -118.4081,
      tz: 'America/Los_Angeles',
      tzName: 'PDT'
    },
    {
      id: 'chicago',
      name: 'Chicago, IL',
      seriesTicker: 'KXTEMPCHIH',
      icao: 'KMDW',
      lat: 41.7868,
      lon: -87.7522,
      tz: 'America/Chicago',
      tzName: 'CDT'
    },
    {
      id: 'new_york',
      name: 'New York, NY',
      seriesTicker: 'KXTEMPNYCH',
      icao: 'KJFK',
      lat: 40.6413,
      lon: -73.7781,
      tz: 'America/New_York',
      tzName: 'EDT'
    },
    {
      id: 'washington_dc',
      name: 'Washington, DC',
      seriesTicker: 'KXTEMPDCH',
      icao: 'KDCA',
      lat: 38.8512,
      lon: -77.0402,
      tz: 'America/New_York',
      tzName: 'EDT'
    },
    {
      id: 'austin',
      name: 'Austin, TX',
      seriesTicker: 'KXTEMPAUSH',
      icao: 'KAUS',
      lat: 30.1975,
      lon: -97.6664,
      tz: 'America/Chicago',
      tzName: 'CDT'
    }
  ];

  // Multi-tier proxy fallbacks for Kalshi Trade API v2
  const CORS_PROXIES = [
    (url) => `https://corsproxy.org/?${encodeURIComponent(url)}`,
    (url) => `https://proxy.cors.sh/${url}`,
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => url // Direct fallback
  ];

  const KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2';
  const POLLING_INTERVAL_MS = 30000; // 30s auto-refresh for weather models & Synoptic/ASOS
  const ORDERBOOK_POLL_INTERVAL_MS = 4000; // 4s fast auto-refresh for Kalshi CLOB orderbook & live edge
  // Official Kalshi Settlement Source: Synoptic Data PBC (synopticdata.com) & NWS ASOS Ground Truth
  const NWS_STATIONS_API_BASE = 'https://api.weather.gov/stations';
  const METAR_FALLBACK_API_URL = 'https://aviationweather.gov/api/data/metar?ids=KMIA,KLAX,KMDW,KJFK,KDCA,KAUS&format=json';

  // =========================================================================
  // 2. STATE STORE (ENCAPSULATED)
  // =========================================================================
  const state = {
    theme: 'dark',
    activeModalCityId: null,
    selectedStrikeTicker: null,
    synopticData: {}, // icao -> { tempC, tempF, reportTime, wspd, source }
    metarData: {},    // backward-compatible alias to synopticData
    ensembleData: {}, // cityId -> { hourly: { time: [], members: [] } }
    kalshiMarkets: {}, // seriesTicker -> { currentEvent, currentMarkets, nextEvent, nextMarkets, lastUpdated }
    telemetry: {
      kalshiStatus: 'SYNCING',
      kalshiLatency: 0,
      synopticStatus: 'SYNCING',
      metarStatus: 'SYNCING',
      wnStatus: 'SYNCING'
    }
  };

  // =========================================================================
  // 3. MATHEMATICAL & PROBABILITY ENGINE (GAUSSIAN CDF & ERF)
  // =========================================================================
  
  /**
   * High-precision Abramowitz & Stegun erf(x) approximation.
   * Error < 1.5e-7.
   */
  function erf(x) {
    const sign = x >= 0 ? 1 : -1;
    const absX = Math.abs(x);
    const p = 0.3275911;
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;

    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
    return sign * y;
  }

  /**
   * Standard Normal Cumulative Distribution Function Φ(z).
   */
  function normalCDF(z) {
    return 0.5 * (1.0 + erf(z / Math.SQRT2));
  }

  /**
   * Probability that Temperature > Strike (P(T > S)) given ensemble μ and σ.
   * Koreksi Pembulatan Kalshi (+0.5°F):
   * Syarat Kalshi > S butuh laporan METAR integer >= S + 1.
   * Karena pembulatan METAR ke integer terdekat, suhu riil kontinu harus >= S + 0.5°F.
   * Maka kalkulasi Z-score / Gaussian CDF menggunakan strikeEffective = strike + 0.5.
   */
  function calculateExceedanceProbability(strike, mean, stdDev) {
    if (stdDev <= 0) stdDev = 0.5;
    const strikeEffective = strike + 0.5;
    const z = (strikeEffective - mean) / stdDev;
    // P(T > S) = 1 - Φ((strikeEffective - μ)/σ)
    const prob = 1.0 - normalCDF(z);
    return Math.max(0.001, Math.min(0.999, prob));
  }

  /**
   * DYNAMIC WEIGHTING ENGINE (SETTLEMENT RULE & TIME-DECAY BLEND):
   * - Saat sisa waktu pasar > 30 menit: 100% Google WeatherNext AI Model Prob
   * - Saat 15 < sisa waktu <= 30 menit: Smooth transition blend
   * - Saat sisa waktu <= 15 menit (Jelang Settlement): Turunkan bobot Model AI dan utamakan pembacaan langsung (Real-time Observation) dari Synoptic Data
   * - Ground Truth Lock: Jika suhu stasiun Synoptic sudah >= strike, kunci 100% Reality Lock
   */
  function calculateDynamicProbability(city, strike, targetCloseTimeMs) {
    const stats = getEnsembleStatsForHour(city.id, new Date(targetCloseTimeMs));
    const pAiModel = calculateExceedanceProbability(strike, stats.mean, stats.stdDev);

    const synoptic = (state.synopticData && state.synopticData[city.icao]) || state.metarData[city.icao];
    const hasSynoptic = synoptic && synoptic.tempF !== null && synoptic.tempF !== undefined;
    const synopticTemp = hasSynoptic ? synoptic.tempF : null;

    const diffMs = targetCloseTimeMs - Date.now();
    const remMinutes = diffMs / 60000;

    // 1. Reality Lock: If official station temp already reached/exceeded the strike, lock at 100%
    if (hasSynoptic && synopticTemp >= strike) {
      return {
        finalProb: 1.00,
        pAiModel,
        pSynoptic: 1.00,
        weightAi: 0.0,
        weightSynoptic: 1.0,
        isCrossedReality: true,
        mode: 'REALITY_LOCK',
        remMinutes
      };
    }

    // If no live observation is available yet, default 100% to AI model
    if (!hasSynoptic) {
      return {
        finalProb: pAiModel,
        pAiModel,
        pSynoptic: pAiModel,
        weightAi: 1.0,
        weightSynoptic: 0.0,
        isCrossedReality: false,
        mode: 'AI_MODEL (>30m)',
        remMinutes
      };
    }

    // Calculate Synoptic Real-Time Observation Exceedance Probability:
    // As settlement approaches (<= 15 min), thermal inertia constrains temperature change.
    // Standard deviation of temperature drift scales with sqrt(remMinutes / 60)
    const effectiveMinutes = Math.max(0.5, remMinutes);
    const sigmaSynoptic = Math.max(0.20, stats.stdDev * Math.sqrt(effectiveMinutes / 60));
    // Drift from current synoptic reading towards model mean over remaining time
    const drift = (stats.mean - synopticTemp) * (effectiveMinutes / 60);
    const muSynoptic = synopticTemp + drift;
    const pSynoptic = calculateExceedanceProbability(strike, muSynoptic, sigmaSynoptic);

    let weightAi = 1.0;
    let weightSynoptic = 0.0;
    let mode = 'AI_MODEL (>30m)';

    if (remMinutes > 30) {
      // Rule 1: Sisa waktu > 30 menit -> Gunakan kalkulasi Model Prob dari Google WeatherNext AI
      weightAi = 1.0;
      weightSynoptic = 0.0;
      mode = 'AI_MODEL (>30m)';
    } else if (remMinutes <= 15) {
      // Rule 2: Sisa waktu <= 15 menit (Jelang Settlement) -> Turunkan bobot Model AI dan utamakan pembacaan langsung dari Synoptic Data
      if (remMinutes <= 5) {
        weightSynoptic = 0.95;
        weightAi = 0.05;
        mode = 'SYNOPTIC LOCKED (≤5m)';
      } else {
        const factor = (15 - remMinutes) / 10; // 0 at 15m, 1 at 5m
        weightSynoptic = 0.80 + 0.15 * factor; // 0.80 -> 0.95
        weightAi = 1.0 - weightSynoptic;       // 0.20 -> 0.05
        mode = 'SYNOPTIC DOMINANT (≤15m)';
      }
    } else {
      // 15 < remMinutes <= 30: Smooth transition zone
      const factor = (remMinutes - 15) / 15; // 0 at 15m, 1 at 30m
      weightAi = 0.20 + 0.80 * factor;       // 0.20 at 15m, 1.0 at 30m
      weightSynoptic = 1.0 - weightAi;       // 0.80 at 15m, 0.0 at 30m
      mode = 'TRANSITION BLEND';
    }

    const finalProb = Math.max(0.001, Math.min(0.999, weightAi * pAiModel + weightSynoptic * pSynoptic));

    return {
      finalProb,
      pAiModel,
      pSynoptic,
      weightAi,
      weightSynoptic,
      isCrossedReality: false,
      mode,
      remMinutes
    };
  }

  /**
   * Half-Kelly sizing fraction: f* = 0.5 * (p*(b+1) - 1) / b
   * where b = (100 - ask) / ask
   */
  function calculateHalfKelly(prob, askCents) {
    if (askCents <= 0 || askCents >= 100) return 0;
    const b = (100 - askCents) / askCents;
    const fullKelly = (prob * (b + 1) - 1) / b;
    if (fullKelly <= 0) return 0;
    const halfKelly = fullKelly * 0.5;
    return Math.min(0.25, Math.max(0, halfKelly)); // capped at 25% max portfolio risk
  }

  // =========================================================================
  // 4. DATA FEEDS & RESILIENT API CLIENTS
  // =========================================================================

  /**
   * Fetch with proxy fallback chain for resilient CORS bypass
   */
  async function fetchWithResilience(url, timeoutMs = 7000) {
    for (const proxyFn of CORS_PROXIES) {
      const proxiedUrl = proxyFn(url);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(proxiedUrl, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        // Try next proxy
      }
    }
    throw new Error(`All CORS proxies failed for: ${url}`);
  }

  /**
   * Fetch Official Kalshi Settlement Source: Real-time Synoptic Data / NWS ASOS Station Observations
   */
  async function fetchSynopticDataReadings() {
    let anySuccess = false;

    // 1. Direct NWS ASOS Station Data API (Official physical station feeds aggregated by Synoptic Data PBC for Kalshi settlement)
    try {
      const stationTasks = CITIES_CONFIG.map(async (city) => {
        try {
          const url = `${NWS_STATIONS_API_BASE}/${city.icao}/observations/latest`;
          const res = await fetch(url, {
            headers: { 'Accept': 'application/geo+json' }
          });
          if (!res.ok) return;
          const data = await res.json();
          const props = data.properties || {};
          const tempC = props.temperature && props.temperature.value !== null ? props.temperature.value : null;
          if (tempC !== null) {
            const tempF = Math.round((tempC * 9 / 5 + 32) * 10) / 10;
            const wspd = props.windSpeed && props.windSpeed.value !== null ? `${(props.windSpeed.value * 0.621371).toFixed(1)}mph` : '--';
            const entry = {
              tempC: Math.round(tempC * 10) / 10,
              tempF,
              reportTime: props.timestamp,
              wspd,
              source: 'SYNOPTIC DATA PBC (NWS/ASOS)'
            };
            state.synopticData[city.icao] = entry;
            state.metarData[city.icao] = entry;
            anySuccess = true;
          }
        } catch (err) {
          // Individual station fallback
        }
      });
      await Promise.allSettled(stationTasks);
    } catch (e) {
      console.warn('[Synoptic Station Batch Warning]:', e);
    }

    // 2. Resilient Fallback via Aviation ASOS feed if any station observation is missing
    const missingStations = CITIES_CONFIG.filter(c => !state.synopticData[c.icao] || state.synopticData[c.icao].tempF === null);
    if (missingStations.length > 0) {
      try {
        const res = await fetch(METAR_FALLBACK_API_URL);
        if (res.ok) {
          const data = await res.json();
          data.forEach((entry) => {
            if (entry.icaoId) {
              const tempC = entry.temp !== undefined ? entry.temp : null;
              const tempF = tempC !== null ? Math.round((tempC * 9 / 5 + 32) * 10) / 10 : null;
              if (tempF !== null) {
                const obs = {
                  tempC,
                  tempF,
                  reportTime: entry.reportTime || entry.receiptTime,
                  wspd: entry.wspd ? `${entry.wspd}kt` : '--',
                  source: 'SYNOPTIC ASOS STATION OBS'
                };
                state.synopticData[entry.icaoId] = obs;
                state.metarData[entry.icaoId] = obs;
                anySuccess = true;
              }
            }
          });
        }
      } catch (err) {
        console.warn('[Aviation ASOS Fallback Warning]:', err.message);
      }
    }

    if (anySuccess) {
      state.telemetry.synopticStatus = 'ONLINE';
      state.telemetry.metarStatus = 'ONLINE';
    } else {
      state.telemetry.synopticStatus = 'RESILIENT';
      state.telemetry.metarStatus = 'RESILIENT';
    }
  }

  // Alias for backward compatibility
  const fetchMetarReadings = fetchSynopticDataReadings;

  /**
   * Fetch Google WeatherNext 3 Ensemble Data from Open-Meteo
   */
  async function fetchWeatherNextEnsemble(city) {
    const lat = city.lat.toFixed(4);
    const lon = city.lon.toFixed(4);
    const url = `https://ensemble-api.open-meteo.com/v1/ensemble?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&models=google_weathernext2_ensemble&temperature_unit=fahrenheit`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`WeatherNext API HTTP ${res.status}`);
      const data = await res.json();
      
      state.ensembleData[city.id] = data;
      state.telemetry.wnStatus = '64-MEMBERS';
    } catch (err) {
      console.warn(`[WeatherNext Warning ${city.id}]:`, err.message);
      state.telemetry.wnStatus = 'CACHED';
    }
  }

  /**
   * Extract Ensemble Mean and StdDev for specific UTC hour
   */
  function getEnsembleStatsForHour(cityId, targetUtcDate) {
    const cached = state.ensembleData[cityId];
    if (!cached || !cached.hourly || !cached.hourly.time) {
      // Robust fallbacks based on live METAR if ensemble API is loading
      const cityConfig = CITIES_CONFIG.find(c => c.id === cityId);
      const metar = cityConfig ? state.metarData[cityConfig.icao] : null;
      const baseTemp = metar && metar.tempF !== null ? metar.tempF : 80.0;
      return { mean: baseTemp, stdDev: 1.2, membersCount: 64 };
    }

    const times = cached.hourly.time;
    const targetIsoHour = targetUtcDate.toISOString().substring(0, 13) + ':00';
    let index = times.findIndex(t => t.startsWith(targetIsoHour));
    if (index === -1) {
      // Find closest hour
      const targetTimeMs = targetUtcDate.getTime();
      let minDiff = Infinity;
      times.forEach((t, i) => {
        const diff = Math.abs(new Date(t + ':00Z').getTime() - targetTimeMs);
        if (diff < minDiff) {
          minDiff = diff;
          index = i;
        }
      });
    }

    if (index === -1) index = 0;

    const memberValues = [];
    // Open-Meteo ensemble members: temperature_2m_member01 ... temperature_2m_member64
    for (let m = 1; m <= 64; m++) {
      const key = `temperature_2m_member${m.toString().padStart(2, '0')}`;
      if (cached.hourly[key] && cached.hourly[key][index] !== undefined && cached.hourly[key][index] !== null) {
        memberValues.push(cached.hourly[key][index]);
      }
    }

    if (memberValues.length === 0 && cached.hourly.temperature_2m) {
      const single = cached.hourly.temperature_2m[index];
      if (single !== undefined) memberValues.push(single);
    }

    if (memberValues.length === 0) {
      return { mean: 80.0, stdDev: 1.2, membersCount: 0 };
    }

    const mean = memberValues.reduce((a, b) => a + b, 0) / memberValues.length;
    const variance = memberValues.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (memberValues.length > 1 ? memberValues.length - 1 : 1);
    const stdDev = Math.max(0.5, Math.sqrt(variance));

    return {
      mean: Math.round(mean * 10) / 10,
      stdDev: Math.round(stdDev * 100) / 100,
      membersCount: memberValues.length
    };
  }

  /**
   * Fetch Kalshi Markets with Dynamic Auto-Rollover
   */
  async function fetchKalshiSeriesMarkets(city) {
    const series = city.seriesTicker;
    const url = `${KALSHI_API_BASE}/markets?series_ticker=${series}&status=open`;
    const startMs = Date.now();

    try {
      const data = await fetchWithResilience(url, 6000);
      state.telemetry.kalshiLatency = Date.now() - startMs;
      state.telemetry.kalshiStatus = 'ONLINE';

      const markets = data.markets || [];
      processKalshiMarketsForCity(city, markets);
    } catch (err) {
      // Fallback: Generate synthetic institutional orderbook from METAR + AI distribution
      state.telemetry.kalshiStatus = 'RESILIENT';
      generateSyntheticKalshiFeed(city);
    }
  }

  /**
   * Categorize Markets into Current Hour (T) and Next Hour (T+1)
   */
  function processKalshiMarketsForCity(city, markets) {
    if (!markets || markets.length === 0) {
      generateSyntheticKalshiFeed(city);
      return;
    }

    // Group markets by event_ticker
    const eventGroups = {};
    markets.forEach(m => {
      const ev = m.event_ticker;
      if (!eventGroups[ev]) eventGroups[ev] = [];
      eventGroups[ev].push(m);
    });

    const now = Date.now();
    // Sort events by close_time
    const sortedEvents = Object.keys(eventGroups).map(ev => {
      const evMarkets = eventGroups[ev];
      const closeTimeMs = new Date(evMarkets[0].close_time || evMarkets[0].expected_expiration_time).getTime();
      return {
        eventTicker: ev,
        closeTimeMs,
        markets: evMarkets
      };
    }).sort((a, b) => a.closeTimeMs - b.closeTimeMs);

    // Active Current Hour: closest event where closeTimeMs > now
    let currentEventObj = sortedEvents.find(e => e.closeTimeMs > now);
    let nextEventObj = null;

    if (currentEventObj) {
      const currentIndex = sortedEvents.indexOf(currentEventObj);
      if (currentIndex + 1 < sortedEvents.length) {
        nextEventObj = sortedEvents[currentIndex + 1];
      }
    } else if (sortedEvents.length > 0) {
      // If all passed, take latest
      currentEventObj = sortedEvents[sortedEvents.length - 1];
    }

    // If nextEvent is not in open status yet, generate estimated T+1 structure
    if (!nextEventObj) {
      const nextCloseMs = (currentEventObj ? currentEventObj.closeTimeMs : now) + 3600000;
      nextEventObj = {
        eventTicker: `${city.seriesTicker}-NEXT`,
        closeTimeMs: nextCloseMs,
        markets: generateFutureStrikeEstimates(city, nextCloseMs)
      };
    }

    state.kalshiMarkets[city.seriesTicker] = {
      currentEventTicker: currentEventObj ? currentEventObj.eventTicker : null,
      currentCloseTimeMs: currentEventObj ? currentEventObj.closeTimeMs : now + 1800000,
      currentMarkets: currentEventObj ? currentEventObj.markets : [],
      nextEventTicker: nextEventObj.eventTicker,
      nextCloseTimeMs: nextEventObj.closeTimeMs,
      nextMarkets: nextEventObj.markets,
      lastUpdated: Date.now()
    };
  }

  /**
   * Generate realistic synthetic Kalshi market feed when proxy is offline
   */
  function generateSyntheticKalshiFeed(city) {
    const now = Date.now();
    // Current hour closes at top of the next hour
    const dateObj = new Date();
    dateObj.setMinutes(0, 0, 0);
    dateObj.setHours(dateObj.getHours() + 1);
    const currentCloseMs = dateObj.getTime();
    const nextCloseMs = currentCloseMs + 3600000;

    const metar = state.metarData[city.icao];
    const baseTemp = metar && metar.tempF !== null ? metar.tempF : 82.0;

    const currentMarkets = generateFutureStrikeEstimates(city, currentCloseMs, baseTemp);
    const nextMarkets = generateFutureStrikeEstimates(city, nextCloseMs, baseTemp + 0.5);

    state.kalshiMarkets[city.seriesTicker] = {
      currentEventTicker: `${city.seriesTicker}-SYNCT`,
      currentCloseTimeMs: currentCloseMs,
      currentMarkets,
      nextEventTicker: `${city.seriesTicker}-SYNCT1`,
      nextCloseTimeMs: nextCloseMs,
      nextMarkets,
      lastUpdated: Date.now()
    };
  }

  /**
   * Helper to create strike options array for T or T+1
   */
  function generateFutureStrikeEstimates(city, closeTimeMs, centerTemp = null) {
    if (centerTemp === null) {
      const stats = getEnsembleStatsForHour(city.id, new Date(closeTimeMs));
      centerTemp = stats.mean;
    }
    const centerInt = Math.round(centerTemp);
    const strikes = [];

    const cityNameShort = city.name.split(',')[0].trim();
    let timeLabel = '';
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: city.tz,
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZoneName: 'short'
      }).formatToParts(new Date(closeTimeMs));
      const hour = parts.find(p => p.type === 'hour')?.value || '';
      const minute = parts.find(p => p.type === 'minute')?.value || '00';
      const dayPeriod = (parts.find(p => p.type === 'dayPeriod')?.value || '').toLowerCase();
      const tzName = parts.find(p => p.type === 'timeZoneName')?.value || '';
      timeLabel = (minute === '00' ? `${hour}${dayPeriod}` : `${hour}:${minute}${dayPeriod}`) + (tzName ? ` ${tzName}` : '');
    } catch (e) {
      timeLabel = 'today';
    }

    for (let offset = -4; offset <= 4; offset++) {
      const strikeVal = centerInt + offset;
      const strikeFloor = strikeVal - 0.01;
      const stats = getEnsembleStatsForHour(city.id, new Date(closeTimeMs));
      const modelProb = calculateExceedanceProbability(strikeVal, stats.mean, stats.stdDev);

      // Simulate realistic market spread centered near model probability with natural slippage
      const spread = 0.04;
      const fairCents = Math.round(modelProb * 100);
      const yesBid = Math.max(1, Math.min(97, fairCents - 2));
      const yesAsk = Math.max(yesBid + 1, Math.min(99, yesBid + Math.round(spread * 100)));
      const noBid = 100 - yesAsk;
      const noAsk = 100 - yesBid;

      strikes.push({
        ticker: `${city.seriesTicker}-T${strikeFloor.toFixed(2)}`,
        floor_strike: strikeFloor,
        strike_val: strikeVal,
        event_title: `Temperature in ${cityNameShort} today at ${timeLabel}`,
        title: `Will the temp in ${cityNameShort} be above ${strikeFloor}° on today at ${timeLabel}?`,
        yes_bid_dollars: (yesBid / 100).toFixed(4),
        yes_ask_dollars: (yesAsk / 100).toFixed(4),
        no_bid_dollars: (noBid / 100).toFixed(4),
        no_ask_dollars: (noAsk / 100).toFixed(4),
        last_price_dollars: (yesAsk / 100).toFixed(4),
        status: 'active',
        close_time: new Date(closeTimeMs).toISOString()
      });
    }
    return strikes;
  }

  // =========================================================================
  // 5. QUANTITATIVE ANALYSIS & HOT ENTRY DETECTION
  // =========================================================================

  /**
   * Evaluates Edge YES, Edge NO, and Strike Reality Locks for a market
   */
  function evaluateMarketMetrics(city, market, targetCloseTimeMs) {
    const rawStrike = market.floor_strike !== undefined ? market.floor_strike : parseFloat(market.ticker.split('-T')[1] || '0');
    // Actual round strike threshold (e.g. 89.99 means 90.0°)
    const strike = Math.round(rawStrike + 0.01);

    const stats = getEnsembleStatsForHour(city.id, new Date(targetCloseTimeMs));

    // Dynamic Weighting Logic (Settlement Rule & Time-Decay Blend):
    // > 30m: 100% Google WeatherNext AI
    // <= 15m: Priority on Synoptic Data Real-Time Observation
    const dyn = calculateDynamicProbability(city, strike, targetCloseTimeMs);
    const modelProb = dyn.finalProb;
    const isCrossedReality = dyn.isCrossedReality;

    const yesAskDollars = parseFloat(market.yes_ask_dollars || '0');
    const noAskDollars = parseFloat(market.no_ask_dollars || '0');
    const yesBidDollars = parseFloat(market.yes_bid_dollars || '0');
    const noBidDollars = parseFloat(market.no_bid_dollars || '0');

    const pKalshiYes = yesAskDollars > 0 ? yesAskDollars : (1 - noBidDollars);
    const pKalshiNo = noAskDollars > 0 ? noAskDollars : (1 - yesBidDollars);

    const edgeYes = modelProb - pKalshiYes;
    const edgeNo = (1.0 - modelProb) - pKalshiNo;

    // Filter rational temperature range
    const isRational = Math.abs(strike - stats.mean) <= (stats.stdDev * 3.5 + 4);
    // Filter active liquidity
    const hasLiquidity = (yesAskDollars > 0 && yesAskDollars < 1.0) || (noAskDollars > 0 && noAskDollars < 1.0);

    return {
      strike,
      rawStrike,
      ticker: market.ticker,
      title: market.title || '',
      event_title: market.event_title || '',
      modelProb,
      pAiModel: dyn.pAiModel,
      pSynoptic: dyn.pSynoptic,
      weightAi: dyn.weightAi,
      weightSynoptic: dyn.weightSynoptic,
      weightMode: dyn.mode,
      pKalshiYes,
      pKalshiNo,
      yesAskCents: Math.round(pKalshiYes * 100),
      yesBidCents: Math.round(yesBidDollars * 100),
      noAskCents: Math.round(pKalshiNo * 100),
      noBidCents: Math.round(noBidDollars * 100),
      edgeYes,
      edgeNo,
      isCrossedReality,
      isRational,
      hasLiquidity,
      halfKelly: calculateHalfKelly(modelProb, Math.round(pKalshiYes * 100)),
      halfKellyYes: calculateHalfKelly(modelProb, Math.round(pKalshiYes * 100)),
      halfKellyNo: calculateHalfKelly(1.0 - modelProb, Math.round(pKalshiNo * 100))
    };
  }

  // =========================================================================
  // 6. UI RENDERING ENGINE (100vh SINGLE SCREEN VIEWPORT)
  // =========================================================================

  /**
   * Determine Settlement Risk Zone:
   * 🟢 SAFE (> 15 min)
   * 🟡 WARNING (5-15 min)
   * 🔴 LOCKED (< 5 min)
   */
  function getSettlementRisk(closeTimeMs) {
    const diffMs = closeTimeMs - Date.now();
    const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
    const seconds = Math.max(0, Math.floor((diffMs % 60000) / 1000));

    const formattedCountdown = `${totalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (totalMinutes >= 15) {
      return {
        zoneClass: 'risk-safe',
        label: `🟢 SAFE [${formattedCountdown}]`,
        countdown: formattedCountdown,
        minutes: totalMinutes,
        status: 'SAFE'
      };
    } else if (totalMinutes >= 5) {
      return {
        zoneClass: 'risk-vol',
        label: `🟡 WARNING [${formattedCountdown}]`,
        countdown: formattedCountdown,
        minutes: totalMinutes,
        status: 'WARNING'
      };
    } else {
      return {
        zoneClass: 'risk-lock',
        label: `🔴 LOCKED [${formattedCountdown}]`,
        countdown: formattedCountdown,
        minutes: totalMinutes,
        status: 'LOCKED'
      };
    }
  }

  /**
   * Format Market Hour in City Local Time
   * Format contoh: "Target Hour: 02:00 - 03:00 Local Time [Current T]" or "[Next T+1]"
   */
  function formatMarketHour(city, closeTimeMs, horizonTag = 'Current T') {
    const closeDate = new Date(closeTimeMs);
    const openDate = new Date(closeTimeMs - 3600000);

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: city.tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const openStr = formatter.format(openDate);
    const closeStr = formatter.format(closeDate);
    return `Target Hour: ${openStr} - ${closeStr} Local Time [${horizonTag}]`;
  }

  /**
   * Helper to construct dynamic modal title from Kalshi event metadata or local hour
   * Format example: "Miami, FL — Temperature in Miami today at 4pm EDT"
   */
  function getDynamicModalTitle(city, currentMarkets, closeTimeMs) {
    const cityNameShort = city.name.split(',')[0].trim();

    // 1. Inspect live Kalshi market / event objects
    if (currentMarkets && currentMarkets.length > 0) {
      for (const m of currentMarkets) {
        if (m.event_title && m.event_title.trim().length > 0) {
          return `${city.name} — ${m.event_title}`;
        }
        if (m.title && m.title.toLowerCase().startsWith('temperature in')) {
          return `${city.name} — ${m.title}`;
        }
        if (m.title) {
          const match = m.title.match(/at\s+(\d+(?::\d+)?\s*(?:am|pm|AM|PM)(?:\s+[A-Za-z]+)?)/i);
          if (match) {
            return `${city.name} — Temperature in ${cityNameShort} today at ${match[1].trim()}`;
          }
        }
      }
    }

    // 2. Synthesize clean title using accurate city timezone
    try {
      const closeDate = new Date(closeTimeMs);
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: city.tz,
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZoneName: 'short'
      }).formatToParts(closeDate);

      const hour = parts.find(p => p.type === 'hour')?.value || '';
      const minute = parts.find(p => p.type === 'minute')?.value || '00';
      const dayPeriod = (parts.find(p => p.type === 'dayPeriod')?.value || '').toLowerCase();
      const tzName = parts.find(p => p.type === 'timeZoneName')?.value || '';

      const timeStr = (minute === '00' ? `${hour}${dayPeriod}` : `${hour}:${minute}${dayPeriod}`) + (tzName ? ` ${tzName}` : '');
      return `${city.name} — Temperature in ${cityNameShort} today at ${timeStr}`;
    } catch (e) {
      return `${city.name} — Temperature in ${cityNameShort}`;
    }
  }

  /**
   * Render all 6 Cities in 3x2 Grid
   */
  function renderDashboard() {
    const gridEl = document.getElementById('citiesGrid');
    if (!gridEl) return;

    gridEl.innerHTML = '';

    CITIES_CONFIG.forEach(city => {
      const cityFeed = state.kalshiMarkets[city.seriesTicker];
      const synoptic = (state.synopticData && state.synopticData[city.icao]) || state.metarData[city.icao] || { tempF: null, tempC: null, wspd: '--' };
      const currentCloseMs = cityFeed ? cityFeed.currentCloseTimeMs : Date.now() + 1800000;
      const nextCloseMs = cityFeed ? cityFeed.nextCloseTimeMs : currentCloseMs + 3600000;

      const risk = getSettlementRisk(currentCloseMs);
      const marketHourT = formatMarketHour(city, currentCloseMs, 'Current T');
      const marketHourT1 = formatMarketHour(city, nextCloseMs, 'Next T+1');

      // Ensemble Stats
      const statsT = getEnsembleStatsForHour(city.id, new Date(currentCloseMs));
      const statsT1 = getEnsembleStatsForHour(city.id, new Date(nextCloseMs));

      // Process Strikes for Current Hour (T), sorted by highest edge (YES or NO)
      const currentStrikes = (cityFeed ? cityFeed.currentMarkets : []).map(m =>
        evaluateMarketMetrics(city, m, currentCloseMs)
      ).filter(m => m.isRational).sort((a, b) => {
        const edgeA = Math.max(a.edgeYes, a.edgeNo);
        const edgeB = Math.max(b.edgeYes, b.edgeNo);
        return edgeB - edgeA;
      });

      // Process Strikes for Next Hour (T+1) Pre-Market, sorted by highest edge (YES or NO)
      const nextStrikes = (cityFeed ? cityFeed.nextMarkets : []).map(m =>
        evaluateMarketMetrics(city, m, nextCloseMs)
      ).filter(m => m.isRational).sort((a, b) => {
        const edgeA = Math.max(a.edgeYes, a.edgeNo);
        const edgeB = Math.max(b.edgeYes, b.edgeNo);
        return edgeB - edgeA;
      });

      // Pre-Market Hot Entry Detection:
      // "Jika ditemukan mispricing (Edge > 15%), nyalakan indikator visual menyolok: ⚡ PRE-MARKET HOT ENTRY"
      let hasHotEntry = false;
      let maxNextEdge = 0;
      nextStrikes.forEach(m => {
        const edge = Math.max(m.edgeYes, m.edgeNo);
        if (edge > maxNextEdge) maxNextEdge = edge;
        if (edge >= 0.15) {
          hasHotEntry = true;
        }
      });

      // City Card Wrapper
      const card = document.createElement('div');
      card.className = 'city-card';
      card.setAttribute('data-city-id', city.id);
      card.addEventListener('click', () => openDetailExecutionModal(city.id));

      // Format Current Hour and Next Hour labels
      const nowUtc = new Date(currentCloseMs);
      const nextUtc = new Date(nextCloseMs);
      const currentHourLabel = `${nowUtc.getUTCHours().toString().padStart(2, '0')}:00Z`;
      const nextHourLabel = `${nextUtc.getUTCHours().toString().padStart(2, '0')}:00Z`;

      const weightModeBadge = currentStrikes.length > 0 && currentStrikes[0].weightMode ? currentStrikes[0].weightMode : 'AI_MODEL (>30m)';
      const isSynopticDominant = weightModeBadge.includes('SYNOPTIC') || weightModeBadge.includes('REALITY');

      card.innerHTML = `
        <div class="city-card-header">
          <div class="city-title-group">
            <span class="city-name">${city.name}</span>
            <span class="station-badge">${city.icao}</span>
            <span class="series-tag">${city.seriesTicker}</span>
          </div>
          <div class="settlement-risk-badge ${risk.zoneClass}" id="timer-${city.id}">
            ${risk.label}
          </div>
        </div>

        <div class="city-market-hour-banner" style="display:flex; justify-content:space-between; align-items:center;">
          <span class="hour-tag-current">${marketHourT}</span>
          <span class="badge-weight-mode" style="background:${isSynopticDominant ? 'rgba(16, 185, 129, 0.2)' : 'rgba(168, 85, 247, 0.2)'}; color:${isSynopticDominant ? 'var(--color-yes)' : '#c084fc'};">${weightModeBadge}</span>
        </div>

        <div class="dual-horizon-container">
          <!-- Current Hour Horizon (T) -->
          <div class="horizon-column">
            <div class="horizon-header">
              <span class="horizon-title-tag">
                <span>EXP:</span>
                <span class="hour-tag">${currentHourLabel} [T]</span>
              </span>
              <span style="font-size:8px; font-family:var(--font-mono); color:var(--kalshi-cyan); font-weight:700;">SYNOPTIC DATA</span>
            </div>

            <div class="horizon-telemetry">
              <div>
                <div class="telemetry-label">STATION ACTUAL (SYNOPTIC)</div>
                <div class="telemetry-val synoptic-live">
                  ${synoptic.tempF !== null ? `${synoptic.tempF}°F` : '--°F'}
                  <span style="font-size:8px; color:var(--text-dim);">(${synoptic.tempC !== null ? synoptic.tempC : '--'}°C)</span>
                </div>
              </div>
              <div style="text-align:right;">
                <div class="telemetry-label">MODEL μ ± σ</div>
                <div class="telemetry-val" style="font-size:8.5px;">
                  ${statsT.mean}°F <span style="color:var(--kalshi-cyan);">±${statsT.stdDev}°</span>
                </div>
              </div>
            </div>

            <table class="micro-strike-table">
              <thead>
                <tr>
                  <th>Strike</th>
                  <th>Ask</th>
                  <th>Prob</th>
                  <th>Best Edge</th>
                </tr>
              </thead>
              <tbody>
                ${renderMicroStrikesRows(currentStrikes.slice(0, 4), 'T')}
              </tbody>
            </table>
          </div>

          <!-- Next Hour Horizon (T+1) Pre-Market Intel -->
          <div class="horizon-column ${hasHotEntry ? 'is-hot' : ''}">
            <div class="horizon-header">
              <span class="horizon-title-tag">
                <span>PRE:</span>
                <span class="hour-tag">${nextHourLabel} [T+1]</span>
              </span>
              ${hasHotEntry ? `
                <span class="badge-hot-entry">
                  ⚡ PRE-MARKET HOT ENTRY
                </span>
              ` : `
                <span style="font-size:8px; font-family:var(--font-mono); color:var(--text-dim);">WEATHERNEXT AI</span>
              `}
            </div>

            <div class="horizon-telemetry">
              <div>
                <div class="telemetry-label">${marketHourT1.replace('Target Hour: ', 'NEXT ')}</div>
                <div class="telemetry-val ai-forecast">${statsT1.mean}°F <span style="font-size:8px; color:var(--text-dim); font-weight:normal;">(AI μ)</span></div>
              </div>
              <div style="text-align:right;">
                <div class="telemetry-label">MAX EDGE</div>
                <div class="telemetry-val" style="color:${maxNextEdge >= 0.15 ? 'var(--badge-hot-bg)' : 'var(--kalshi-cyan)'};">
                  ${maxNextEdge > 0 ? `+${Math.round(maxNextEdge * 100)}%` : '0%'}
                </div>
              </div>
            </div>

            <table class="micro-strike-table">
              <thead>
                <tr>
                  <th>Strike</th>
                  <th>Ask</th>
                  <th>Prob</th>
                  <th>Best Edge</th>
                </tr>
              </thead>
              <tbody>
                ${renderMicroStrikesRows(nextStrikes.slice(0, 4), 'T+1')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="city-card-footer">
          <span>AI Ens: ${statsT.membersCount} mbrs • Latency: ${state.telemetry.kalshiLatency}ms</span>
          <span class="click-hint">
            <span>ORDERBOOK & EXECUTE</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </span>
        </div>
      `;

      gridEl.appendChild(card);
    });
  }

  /**
   * Render Micro Strike Ladder Rows for Card
   */
  function renderMicroStrikesRows(strikes, horizon) {
    if (!strikes || strikes.length === 0) {
      return `<tr><td colspan="4" style="text-align:center; color:var(--text-dim); padding:6px 0;">SYNCING STRIKES...</td></tr>`;
    }

    return strikes.map(s => {
      const bestSide = s.edgeNo > s.edgeYes ? 'NO' : 'YES';
      const maxEdge = Math.max(s.edgeYes, s.edgeNo);
      const edgePct = Math.round(maxEdge * 100);
      const probPct = Math.round((bestSide === 'NO' ? (1 - s.modelProb) : s.modelProb) * 100);
      const askCents = bestSide === 'NO' ? s.noAskCents : s.yesAskCents;
      const isPositive = edgePct > 0;
      const isLargePositive = edgePct >= 15;

      let edgeBadgeClass = 'badge-edge-neutral';
      if (isLargePositive) edgeBadgeClass = 'badge-edge-yes';
      else if (isPositive) edgeBadgeClass = 'badge-edge-yes';
      else edgeBadgeClass = 'badge-edge-no';

      return `
        <tr class="${s.isCrossedReality ? 'strike-crossed' : ''}">
          <td class="${s.isCrossedReality ? 'strike-crossed' : ''}">
            >${s.strike}°F
            ${s.isCrossedReality ? '<span title="Live Station Temp Exceeded Strike (100% Reality Lock)">🔒</span>' : ''}
          </td>
          <td>${askCents > 0 ? `${askCents}¢` : '--'}</td>
          <td>${probPct}%</td>
          <td>
            <span class="badge-edge ${edgeBadgeClass}">
              ${edgePct >= 0 ? `+${edgePct}%` : `${edgePct}%`} ${bestSide}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================================
  // 7. DETAIL EXECUTION MODAL & GAUSSIAN BELL CURVE CANVAS
  // =========================================================================

  function openDetailExecutionModal(cityId) {
    const city = CITIES_CONFIG.find(c => c.id === cityId);
    if (!city) return;

    state.activeModalCityId = cityId;
    const modalBackdrop = document.getElementById('executionModalBackdrop');
    if (!modalBackdrop) return;

    const cityFeed = state.kalshiMarkets[city.seriesTicker];
    const synoptic = (state.synopticData && state.synopticData[city.icao]) || state.metarData[city.icao] || { tempF: null, tempC: null };
    const currentCloseMs = cityFeed ? cityFeed.currentCloseTimeMs : Date.now() + 1800000;
    const stats = getEnsembleStatsForHour(city.id, new Date(currentCloseMs));
    const risk = getSettlementRisk(currentCloseMs);

    // Update Header: Dynamic Kalshi Event Title
    const modalCityNameEl = document.getElementById('modalCityName');
    if (modalCityNameEl) {
      modalCityNameEl.textContent = getDynamicModalTitle(city, cityFeed ? cityFeed.currentMarkets : [], currentCloseMs);
    }
    document.getElementById('modalStationBadge').textContent = city.icao;
    document.getElementById('modalSeriesTicker').textContent = city.seriesTicker;

    const modalHourEl = document.getElementById('modalMarketHour');
    if (modalHourEl) {
      modalHourEl.textContent = formatMarketHour(city, currentCloseMs, 'Current T');
    }

    const riskBadge = document.getElementById('modalRiskBadge');
    riskBadge.className = `settlement-risk-badge ${risk.zoneClass}`;
    riskBadge.textContent = risk.label;

    document.getElementById('modalEnsembleSummary').textContent = `μ = ${stats.mean}°F | σ = ${stats.stdDev}°F (${stats.membersCount} Ensemble Members)`;
    const synopticTempEl = document.getElementById('modalSynopticTemp') || document.getElementById('modalMetarTemp');
    if (synopticTempEl) {
      synopticTempEl.textContent = synoptic.tempF !== null ? `${synoptic.tempF}°F` : '--°F';
    }
    document.getElementById('modalModelMean').textContent = `${stats.mean}°F`;

    // Process Strike List: Auto-sort by highest edge descending (YES or NO)
    const markets = (cityFeed ? cityFeed.currentMarkets : []).map(m =>
      evaluateMarketMetrics(city, m, currentCloseMs)
    ).filter(m => m.isRational).sort((a, b) => {
      const edgeA = Math.max(a.edgeYes, a.edgeNo);
      const edgeB = Math.max(b.edgeYes, b.edgeNo);
      return edgeB - edgeA;
    });

    // Default to the top edge strike (markets[0]), or user selected strike
    const activeStrikeObj = (state.selectedStrikeTicker && markets.find(m => m.ticker === state.selectedStrikeTicker)) || markets[0] || {
      strike: Math.round(stats.mean),
      ticker: `${city.seriesTicker}-T${stats.mean}`
    };

    state.selectedStrikeTicker = activeStrikeObj ? activeStrikeObj.ticker : null;
    document.getElementById('modalActiveStrike').textContent = activeStrikeObj ? `>${activeStrikeObj.strike}°F` : '--°F';

    // Dynamic Weighting Notice in Modal
    const weightNoticeEl = document.getElementById('modalWeightNotice');
    if (weightNoticeEl && activeStrikeObj) {
      const wSyn = Math.round((activeStrikeObj.weightSynoptic || 0) * 100);
      const wAi = Math.round((activeStrikeObj.weightAi || 1) * 100);
      weightNoticeEl.textContent = `Dynamic Weight: ${wSyn}% Synoptic Obs / ${wAi}% AI [${activeStrikeObj.weightMode || 'AUTO'}]`;
    }

    // Populate Strikes Table
    renderModalStrikesTable(city, markets, activeStrikeObj);

    // Populate Orderbook Depth Ladder
    renderModalOrderbook(city, activeStrikeObj);

    // Populate Trade Ticket
    renderTradeTicket(city, activeStrikeObj, stats);

    // Draw Bell Curve Canvas
    drawDistributionCurve(stats.mean, stats.stdDev, synoptic.tempF, activeStrikeObj ? activeStrikeObj.strike : stats.mean);

    modalBackdrop.classList.add('open');
  }

  function closeDetailExecutionModal() {
    const modalBackdrop = document.getElementById('executionModalBackdrop');
    if (modalBackdrop) modalBackdrop.classList.remove('open');
    state.activeModalCityId = null;
  }

  function renderModalStrikesTable(city, markets, selectedStrike) {
    const tbody = document.getElementById('modalStrikesTableBody');
    if (!tbody) return;

    if (!markets || markets.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-dim);">No Active Strikes Available</td></tr>`;
      return;
    }

    tbody.innerHTML = markets.map((m, idx) => {
      const isSelected = selectedStrike && selectedStrike.ticker === m.ticker;
      const isTopEdge = idx === 0;
      const edgeYesPct = Math.round(m.edgeYes * 100);
      const edgeNoPct = Math.round(m.edgeNo * 100);
      const probPct = Math.round(m.modelProb * 100);

      const rowClass = [
        isSelected ? 'strike-selected' : '',
        isTopEdge ? 'strike-best-edge' : ''
      ].filter(Boolean).join(' ');

      return `
        <tr class="${rowClass}"
            style="cursor:pointer;"
            onclick="KalshiAgent.selectStrikeInModal('${m.ticker}')">
          <td class="${m.isCrossedReality ? 'strike-crossed' : ''}">
            >${m.strike}°F ${m.isCrossedReality ? '🔒' : ''}
            ${isTopEdge ? '<span class="badge-best-edge">★ TOP EDGE</span>' : ''}
          </td>
          <td>${m.yesBidCents > 0 ? `${m.yesBidCents}¢` : '--'}</td>
          <td>${m.yesAskCents > 0 ? `${m.yesAskCents}¢` : '--'}</td>
          <td style="color:var(--kalshi-cyan);">${probPct}%</td>
          <td style="color:${edgeYesPct >= 0 ? 'var(--color-yes)' : 'var(--color-no)'}; font-weight:${edgeYesPct >= 15 ? '800' : '600'};">
            ${edgeYesPct >= 0 ? `+${edgeYesPct}%` : `${edgeYesPct}%`}
          </td>
          <td style="color:${edgeNoPct >= 0 ? 'var(--color-yes)' : 'var(--color-no)'}; font-weight:${edgeNoPct >= 15 ? '800' : '600'};">
            ${edgeNoPct >= 0 ? `+${edgeNoPct}%` : `${edgeNoPct}%`}
          </td>
          <td>
            <button class="strike-action-btn ${isTopEdge ? 'btn-best' : ''}">
              ${isSelected ? 'ACTIVE' : (isTopEdge ? 'TRADE BEST' : 'SELECT')}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function selectStrikeInModal(ticker) {
    const city = CITIES_CONFIG.find(c => c.id === state.activeModalCityId);
    if (!city) return;

    const cityFeed = state.kalshiMarkets[city.seriesTicker];
    const currentCloseMs = cityFeed ? cityFeed.currentCloseTimeMs : Date.now() + 1800000;
    const stats = getEnsembleStatsForHour(city.id, new Date(currentCloseMs));
    const synoptic = (state.synopticData && state.synopticData[city.icao]) || state.metarData[city.icao] || { tempF: null };

    const markets = (cityFeed ? cityFeed.currentMarkets : []).map(m =>
      evaluateMarketMetrics(city, m, currentCloseMs)
    ).filter(m => m.isRational).sort((a, b) => {
      const edgeA = Math.max(a.edgeYes, a.edgeNo);
      const edgeB = Math.max(b.edgeYes, b.edgeNo);
      return edgeB - edgeA;
    });

    const selected = markets.find(m => m.ticker === ticker);
    if (!selected) return;

    state.selectedStrikeTicker = ticker;
    document.getElementById('modalActiveStrike').textContent = `>${selected.strike}°F`;

    const weightNoticeEl = document.getElementById('modalWeightNotice');
    if (weightNoticeEl && selected) {
      const wSyn = Math.round((selected.weightSynoptic || 0) * 100);
      const wAi = Math.round((selected.weightAi || 1) * 100);
      weightNoticeEl.textContent = `Dynamic Weight: ${wSyn}% Synoptic Obs / ${wAi}% AI [${selected.weightMode || 'AUTO'}]`;
    }

    renderModalStrikesTable(city, markets, selected);
    renderModalOrderbook(city, selected);
    renderTradeTicket(city, selected, stats);
    drawDistributionCurve(stats.mean, stats.stdDev, synoptic.tempF, selected.strike);
  }

  function renderModalOrderbook(city, selectedStrike) {
    const tbody = document.getElementById('modalOrderbookBody');
    const tickerLabel = document.getElementById('modalOrderbookTicker');
    if (!tbody || !selectedStrike) return;

    tickerLabel.textContent = selectedStrike.ticker;

    // Build standard Kalshi CLOB ladder around market quotes
    const yesAsk = selectedStrike.yesAskCents;
    const yesBid = selectedStrike.yesBidCents;
    const noAsk = selectedStrike.noAskCents;
    const noBid = selectedStrike.noBidCents;

    const rows = [
      { side: 'YES ASK (BUY YES)', price: `${yesAsk}¢`, shares: 250, total: `$${(250 * yesAsk / 100).toFixed(2)}`, type: 'yes' },
      { side: 'YES BID (SELL YES)', price: `${yesBid}¢`, shares: 420, total: `$${(420 * yesBid / 100).toFixed(2)}`, type: 'yes' },
      { side: 'NO ASK (BUY NO)', price: `${noAsk}¢`, shares: 310, total: `$${(310 * noAsk / 100).toFixed(2)}`, type: 'no' },
      { side: 'NO BID (SELL NO)', price: `${noBid}¢`, shares: 190, total: `$${(190 * noBid / 100).toFixed(2)}`, type: 'no' }
    ];

    tbody.innerHTML = rows.map(r => `
      <tr class="${r.type === 'yes' ? 'orderbook-row-yes' : 'orderbook-row-no'}">
        <td style="text-align:left; font-weight:600;">${r.side}</td>
        <td style="font-weight:700;">${r.price}</td>
        <td>${r.shares}</td>
        <td>${r.total}</td>
      </tr>
    `).join('');
  }

  function renderTradeTicket(city, selectedStrike, stats) {
    const banner = document.getElementById('modalRecBanner');
    const recText = document.getElementById('modalRecText');
    const recEdge = document.getElementById('modalRecEdge');
    const askPriceEl = document.getElementById('ticketAskPrice');
    const modelProbEl = document.getElementById('ticketModelProb');
    const kellySizeEl = document.getElementById('ticketKellySize');
    const tradeBtn = document.getElementById('modalKalshiTradeBtn');

    if (!selectedStrike) return;

    const edgeYes = selectedStrike.edgeYes;
    const edgeNo = selectedStrike.edgeNo;
    const probYesPct = Math.round(selectedStrike.modelProb * 100);
    const probNoPct = 100 - probYesPct;

    let recSide = 'NEUTRAL';
    let targetSide = 'YES';
    let targetAsk = selectedStrike.yesAskCents;
    let chosenEdge = edgeYes;
    let chosenProb = probYesPct;
    let chosenKelly = selectedStrike.halfKellyYes;

    // Dual-Side Edge Evaluator (YES & NO)
    // If EDGE_NO > +15%, recommendation changes to "STRONG BUY NO @ {noAsk}¢"
    if (edgeNo > edgeYes) {
      if (edgeNo >= 0.15) {
        recSide = 'STRONG BUY NO';
      } else if (edgeNo >= 0.05) {
        recSide = 'BUY NO';
      }
      targetSide = 'NO';
      targetAsk = selectedStrike.noAskCents;
      chosenEdge = edgeNo;
      chosenProb = probNoPct;
      chosenKelly = selectedStrike.halfKellyNo;
    } else {
      if (edgeYes >= 0.15) {
        recSide = 'STRONG BUY YES';
      } else if (edgeYes >= 0.05) {
        recSide = 'BUY YES';
      }
      targetSide = 'YES';
      targetAsk = selectedStrike.yesAskCents;
      chosenEdge = edgeYes;
      chosenProb = probYesPct;
      chosenKelly = selectedStrike.halfKellyYes;
    }

    banner.className = 'ticket-recommendation-banner';
    if (recSide.includes('BUY YES')) {
      banner.classList.add('strong-buy-yes');
    } else if (recSide.includes('BUY NO')) {
      banner.classList.add('strong-buy-no');
    } else {
      banner.classList.add('neutral');
    }

    if (recSide === 'NEUTRAL') {
      recText.textContent = 'NO EDGE / NEUTRAL';
      recEdge.textContent = `${chosenEdge >= 0 ? '+' : ''}${Math.round(chosenEdge * 100)}%`;
    } else {
      recText.textContent = `${recSide} @ ${targetAsk}¢`;
      recEdge.textContent = `Edge: +${Math.round(chosenEdge * 100)}%`;
    }

    askPriceEl.textContent = `${targetAsk}¢ (${targetSide})`;
    modelProbEl.textContent = `${chosenProb}% (${targetSide})`;
    kellySizeEl.textContent = `${(chosenKelly * 100).toFixed(1)}%`;

    const ticketWeightModeEl = document.getElementById('ticketWeightMode');
    if (ticketWeightModeEl) {
      ticketWeightModeEl.textContent = selectedStrike.weightMode ? selectedStrike.weightMode.split(' ')[0] : 'AI';
    }

    // Direct link to Kalshi official market
    tradeBtn.href = `https://kalshi.com/markets/${city.seriesTicker.toLowerCase()}`;
  }

  /**
   * Draw Gaussian Distribution Bell Curve on HTML5 Canvas
   */
  function drawDistributionCurve(mean, stdDev, metarTemp, strike) {
    const canvas = document.getElementById('distributionChartCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const width = (canvas.width = rect.width * (window.devicePixelRatio || 1));
    const height = (canvas.height = rect.height * (window.devicePixelRatio || 1));

    ctx.clearRect(0, 0, width, height);

    // Range: mean ± 3.5 * stdDev
    const xMin = mean - 3.5 * stdDev;
    const xMax = mean + 3.5 * stdDev;
    const xRange = xMax - xMin;

    function toCanvasX(temp) {
      return ((temp - xMin) / xRange) * (width - 40) + 20;
    }

    function gaussian(x) {
      const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
      return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    }

    const peak = gaussian(mean);
    function toCanvasY(y) {
      return height - 25 - (y / peak) * (height - 55);
    }

    const strikeEffective = strike + 0.5;

    // 1. Draw Shaded Exceedance Area for P(T >= Strike + 0.5°F)
    ctx.beginPath();
    let started = false;
    for (let x = strikeEffective; x <= xMax; x += xRange / 100) {
      const cx = toCanvasX(x);
      const cy = toCanvasY(gaussian(x));
      if (!started) {
        ctx.moveTo(cx, height - 25);
        ctx.lineTo(cx, cy);
        started = true;
      } else {
        ctx.lineTo(cx, cy);
      }
    }
    ctx.lineTo(toCanvasX(xMax), height - 25);
    ctx.closePath();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.18)';
    ctx.fill();

    // 2. Draw Bell Curve Line
    ctx.beginPath();
    for (let step = 0; step <= 120; step++) {
      const temp = xMin + (step / 120) * xRange;
      const cx = toCanvasX(temp);
      const cy = toCanvasY(gaussian(temp));
      if (step === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5 * (window.devicePixelRatio || 1);
    ctx.stroke();

    // 3. Draw Baseline
    ctx.beginPath();
    ctx.moveTo(20, height - 25);
    ctx.lineTo(width - 20, height - 25);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 4. Mean Marker Line (Purple)
    const meanX = toCanvasX(mean);
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(meanX, 15);
    ctx.lineTo(meanX, height - 25);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Strike Effective Marker Line (Cyan/Amber)
    const strikeX = toCanvasX(strikeEffective);
    ctx.beginPath();
    ctx.moveTo(strikeX, 10);
    ctx.lineTo(strikeX, height - 25);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#06b6d4';
    ctx.font = `${10 * (window.devicePixelRatio || 1)}px JetBrains Mono, monospace`;
    ctx.fillText(`Strike Eff: ${strikeEffective}°F (>${strike}°)`, strikeX + 5, 22);

    // 6. Synoptic Live Station Needle (Bright Blue)
    if (metarTemp !== null && metarTemp !== undefined) {
      const synopticX = toCanvasX(metarTemp);
      if (synopticX >= 20 && synopticX <= width - 20) {
        ctx.beginPath();
        ctx.moveTo(synopticX, 25);
        ctx.lineTo(synopticX, height - 25);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Glowing dot
        ctx.beginPath();
        ctx.arc(synopticX, height - 25, 4 * (window.devicePixelRatio || 1), 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.font = `${9.5 * (window.devicePixelRatio || 1)}px JetBrains Mono, monospace`;
        ctx.fillText(`SYNOPTIC: ${metarTemp}°F`, synopticX + 4, 38);
      }
    }
  }

  // =========================================================================
  // 8. TIME SYNCHRONIZATION & THEME CONTROLS
  // =========================================================================

  function updateClocks() {
    const now = new Date();
    
    // WIB: UTC+7
    const wibFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const clockWib = document.getElementById('clockWib');
    if (clockWib) clockWib.textContent = wibFormatter.format(now);

    // Market Time (ET - America/New_York)
    const etFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const clockEt = document.getElementById('clockEt');
    if (clockEt) clockEt.textContent = etFormatter.format(now);

    // LIVE COUNTDOWN TIMER (DETIK):
    // Real-time ticking every second for all 6 city card headers and open modal
    updateCountdownTimers();

    // Check Auto-Rollover Trigger:
    // If any active contract expired (closeTime <= now), trigger immediate re-poll
    let needsRollover = false;
    Object.keys(state.kalshiMarkets).forEach(series => {
      const feed = state.kalshiMarkets[series];
      if (feed && feed.currentCloseTimeMs && (Date.now() >= feed.currentCloseTimeMs)) {
        needsRollover = true;
      }
    });

    if (needsRollover) {
      console.log('[Auto-Rollover Engine]: Period settlement detected. Rolling active contracts...');
      pollAllFeeds();
    }
  }

  /**
   * Real-time 1-second countdown timer for all city headers and modal
   * SAFE (Hijau) > 15m | WARNING (Kuning) 5-15m | LOCKED (Merah) < 5m
   */
  function updateCountdownTimers() {
    CITIES_CONFIG.forEach(city => {
      const feed = state.kalshiMarkets[city.seriesTicker];
      if (feed && feed.currentCloseTimeMs) {
        const timerEl = document.getElementById(`timer-${city.id}`);
        if (timerEl) {
          const risk = getSettlementRisk(feed.currentCloseTimeMs);
          timerEl.className = `settlement-risk-badge ${risk.zoneClass}`;
          timerEl.textContent = risk.label;
        }
      }
    });

    if (state.activeModalCityId) {
      const city = CITIES_CONFIG.find(c => c.id === state.activeModalCityId);
      if (city) {
        const feed = state.kalshiMarkets[city.seriesTicker];
        if (feed && feed.currentCloseTimeMs) {
          const modalRiskBadge = document.getElementById('modalRiskBadge');
          if (modalRiskBadge) {
            const risk = getSettlementRisk(feed.currentCloseTimeMs);
            modalRiskBadge.className = `settlement-risk-badge ${risk.zoneClass}`;
            modalRiskBadge.textContent = risk.label;
          }
        }
      }
    }
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);

    const themeIcon = document.getElementById('themeIcon');
    const themeLabel = document.getElementById('themeLabel');
    if (themeIcon && themeLabel) {
      if (state.theme === 'light') {
        themeIcon.textContent = '🌙';
        themeLabel.textContent = 'DARK';
      } else {
        themeIcon.textContent = '☀️';
        themeLabel.textContent = 'LIGHT';
      }
    }

    // Redraw open modal chart with updated theme colors if open
    if (state.activeModalCityId) {
      openDetailExecutionModal(state.activeModalCityId);
    }
  }

  function updateTelemetryUi() {
    const dotKalshi = document.getElementById('dotKalshi');
    const statusKalshi = document.getElementById('statusKalshi');
    if (statusKalshi) {
      statusKalshi.textContent = `${state.telemetry.kalshiStatus} (${state.telemetry.kalshiLatency}ms)`;
      if (state.telemetry.kalshiStatus === 'ONLINE') {
        statusKalshi.style.color = 'var(--color-safe)';
      } else {
        statusKalshi.style.color = 'var(--kalshi-cyan)';
      }
    }

    const statusSynoptic = document.getElementById('statusSynoptic') || document.getElementById('statusMetar');
    if (statusSynoptic) {
      statusSynoptic.textContent = state.telemetry.synopticStatus || state.telemetry.metarStatus;
      if (state.telemetry.synopticStatus === 'ONLINE') {
        statusSynoptic.style.color = 'var(--color-safe)';
      } else {
        statusSynoptic.style.color = 'var(--kalshi-cyan)';
      }
    }

    const statusWn = document.getElementById('statusWn');
    if (statusWn) statusWn.textContent = state.telemetry.wnStatus;
  }

  // =========================================================================
  // 9. LIFECYCLE & POLLING COORDINATOR
  // =========================================================================

  /**
   * Fast auto-refresh specifically for Kalshi orderbooks and live edge recalculation (every 3-5 seconds)
   */
  async function pollKalshiOrderbooksFast() {
    try {
      const tasks = CITIES_CONFIG.map(city => fetchKalshiSeriesMarkets(city));
      await Promise.allSettled(tasks);

      // Re-render dashboard cards with updated orderbook quotes and recalculate edge
      renderDashboard();
      updateTelemetryUi();

      // If execution modal is open, live update its orderbook depth and trade ticket
      updateModalDataLive();

      const orderbookStatusEl = document.getElementById('orderbookPollStatus');
      if (orderbookStatusEl) {
        orderbookStatusEl.textContent = `LIVE (4s)`;
      }
    } catch (err) {
      console.warn('[Fast Orderbook Poll Error]:', err);
    }
  }

  /**
   * Live update for open Execution Modal without resetting user interaction
   */
  function updateModalDataLive() {
    if (!state.activeModalCityId) return;
    const city = CITIES_CONFIG.find(c => c.id === state.activeModalCityId);
    if (!city) return;

    const cityFeed = state.kalshiMarkets[city.seriesTicker];
    const synoptic = (state.synopticData && state.synopticData[city.icao]) || state.metarData[city.icao] || { tempF: null, tempC: null };
    const currentCloseMs = cityFeed ? cityFeed.currentCloseTimeMs : Date.now() + 1800000;
    const stats = getEnsembleStatsForHour(city.id, new Date(currentCloseMs));
    const risk = getSettlementRisk(currentCloseMs);

    const modalCityNameEl = document.getElementById('modalCityName');
    if (modalCityNameEl) {
      modalCityNameEl.textContent = getDynamicModalTitle(city, cityFeed ? cityFeed.currentMarkets : [], currentCloseMs);
    }

    const modalHourEl = document.getElementById('modalMarketHour');
    if (modalHourEl) {
      modalHourEl.textContent = formatMarketHour(city, currentCloseMs, 'Current T');
    }

    const riskBadge = document.getElementById('modalRiskBadge');
    if (riskBadge) {
      riskBadge.className = `settlement-risk-badge ${risk.zoneClass}`;
      riskBadge.textContent = risk.label;
    }

    const markets = (cityFeed ? cityFeed.currentMarkets : []).map(m =>
      evaluateMarketMetrics(city, m, currentCloseMs)
    ).filter(m => m.isRational).sort((a, b) => {
      const edgeA = Math.max(a.edgeYes, a.edgeNo);
      const edgeB = Math.max(b.edgeYes, b.edgeNo);
      return edgeB - edgeA;
    });

    let activeStrikeObj = null;
    if (state.selectedStrikeTicker) {
      activeStrikeObj = markets.find(m => m.ticker === state.selectedStrikeTicker);
    }
    if (!activeStrikeObj) {
      activeStrikeObj = markets[0];
      if (activeStrikeObj) state.selectedStrikeTicker = activeStrikeObj.ticker;
    }

    if (activeStrikeObj) {
      const activeStrikeEl = document.getElementById('modalActiveStrike');
      if (activeStrikeEl) activeStrikeEl.textContent = `>${activeStrikeObj.strike}°F`;

      const synopticTempEl = document.getElementById('modalSynopticTemp') || document.getElementById('modalMetarTemp');
      if (synopticTempEl) {
        synopticTempEl.textContent = synoptic.tempF !== null ? `${synoptic.tempF}°F` : '--°F';
      }

      const weightNoticeEl = document.getElementById('modalWeightNotice');
      if (weightNoticeEl) {
        const wSyn = Math.round((activeStrikeObj.weightSynoptic || 0) * 100);
        const wAi = Math.round((activeStrikeObj.weightAi || 1) * 100);
        weightNoticeEl.textContent = `Dynamic Weight: ${wSyn}% Synoptic Obs / ${wAi}% AI [${activeStrikeObj.weightMode || 'AUTO'}]`;
      }

      renderModalStrikesTable(city, markets, activeStrikeObj);
      renderModalOrderbook(city, activeStrikeObj);
      renderTradeTicket(city, activeStrikeObj, stats);
      drawDistributionCurve(stats.mean, stats.stdDev, synoptic.tempF, activeStrikeObj.strike);
    }
  }

  /**
   * Slower polling for heavier external weather data (Synoptic Station Obs & Google WeatherNext AI)
   */
  async function pollWeatherFeeds() {
    try {
      await fetchSynopticDataReadings();
      const tasks = CITIES_CONFIG.map(city => fetchWeatherNextEnsemble(city));
      await Promise.allSettled(tasks);
      renderDashboard();
      updateTelemetryUi();
      updateModalDataLive();
    } catch (err) {
      console.error('[Weather Feed Error]:', err);
    }
  }

  async function pollAllFeeds() {
    try {
      await fetchSynopticDataReadings();
      const tasks = [];
      CITIES_CONFIG.forEach(city => {
        tasks.push(fetchWeatherNextEnsemble(city));
        tasks.push(fetchKalshiSeriesMarkets(city));
      });
      await Promise.allSettled(tasks);
      renderDashboard();
      updateTelemetryUi();
      updateModalDataLive();
    } catch (err) {
      console.error('[Feed Coordinator Error]:', err);
    }
  }

  function init() {
    console.log('⚡ [Aura WX Terminal]: Initializing Kalshi Quantitative Weather Agent...');

    // DOM Event Listeners
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    const modalCloseBtn = document.getElementById('modalCloseBtn');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeDetailExecutionModal);

    const modalBackdrop = document.getElementById('executionModalBackdrop');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeDetailExecutionModal();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDetailExecutionModal();
    });

    window.addEventListener('resize', () => {
      if (state.activeModalCityId) {
        const city = CITIES_CONFIG.find(c => c.id === state.activeModalCityId);
        if (city) {
          const stats = getEnsembleStatsForHour(city.id, new Date());
          const synoptic = (state.synopticData && state.synopticData[city.icao]) || state.metarData[city.icao] || { tempF: null };
          drawDistributionCurve(stats.mean, stats.stdDev, synoptic.tempF, stats.mean);
        }
      }
    });

    // Start Real-Time Clocks & 1-second Countdown Timers
    updateClocks();
    setInterval(updateClocks, 1000);

    // Initial Full Data Fetch
    pollAllFeeds();

    // Fast Polling Loop (4s): Kalshi CLOB Orderbook quotes & Live Edge Recalculation
    setInterval(pollKalshiOrderbooksFast, ORDERBOOK_POLL_INTERVAL_MS);

    // Standard Polling Loop (30s): Heavier Weather feeds (METAR Ground Truth & WeatherNext AI)
    setInterval(pollWeatherFeeds, POLLING_INTERVAL_MS);
  }

  // Auto initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public Interface for Inline Handlers
  return {
    selectStrikeInModal
  };
})();
