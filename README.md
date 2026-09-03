# AURA-WX PRO: Institutional Weather Prediction Market Terminal & AI Trading Agent

[![Platform](https://img.shields.io/badge/platform-Kalshi%20%7C%20Polymarket-06b6d4.svg)](#)
[![Data Engine](https://img.shields.io/badge/weather%20framework-Google%20WeatherNext%203-10b981.svg)](#)
[![Architecture](https://img.shields.io/badge/architecture-Zero--Lag%20Reactive%20CLOB-6366f1.svg)](#)
[![Design](https://img.shields.io/badge/theme-Dark%20Fintech%20Obsidian-f59e0b.svg)](#)
[![TypeScript](https://img.shields.io/badge/typescript-v5.7%2B-blue.svg)](#)

> **AURA-WX PRO** is a production-grade institutional trading terminal and autonomous AI execution agent for hourly weather prediction markets (targeting **Kalshi** binary contracts and **Polymarket** USDC order books across 5 core metro centers: **Chicago, New York, Los Angeles, Miami, and Austin**).

---

## Architecture Overview

```
                                  ┌─────────────────────────────────────────┐
                                  │   Google WeatherNext 3 Data Framework   │
                                  │  (GraphCast AI + HRRR + ECMWF Ensemble) │
                                  └────────────────────┬────────────────────┘
                                                       │
                                                       ▼
┌─────────────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────────────┐
│       Kalshi Binary CLOB        │       │   Quantitative Engine   │       │     Polymarket Outcome CLOB     │
│    (1¢ - 99¢ USD Contracts)     │◄─────►│    - Normal/Skew CDF    │◄─────►│     (USDC Outcome Tokens)       │
│  - KXCHID, KXNYCD, KXLAXD, etc. │       │    - Expected Value (EV)│       │  - POLY-ORD, POLY-NYC, etc.     │
└────────────────┬────────────────┘       │    - Half-Kelly Sizing  │       └────────────────┬────────────────┘
                 │                        │    - Arbitrage Detector │                        │
                 │                        └────────────┬────────────┘                        │
                 │                                     │                                     │
                 ▼                                     ▼                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       WeatherMarket Central State Store                                      │
│                (Active Period Rollover Engine, Live Micro-Ticks, Risk & Portfolio Accounting)                │
└──────────────────────────────────────────────────────┬──────────────────────────────────────────────────────┘
                                                       │
                           ┌───────────────────────────┴───────────────────────────┐
                           ▼                                                       ▼
        ┌─────────────────────────────────────┐                 ┌─────────────────────────────────────┐
        │        Desktop Terminal (PC)        │                 │       Mobile Terminal (Android)     │
        │ - Persistent Bloomberg Navigation   │                 │ - Sticky Bottom Nav Bar             │
        │ - Top Telemetry & Global Countdown  │                 │ - Horizontal Swipeable City Strip   │
        │ - Dual CLOB Depth Ladders           │                 │ - Single-Column High-Density Cards  │
        └─────────────────────────────────────┘                 └─────────────────────────────────────┘
```

---

## 1. Layout & Navigation Structure (PC & Android Optimized)

### Desktop Terminal (PC)
- **Persistent Sidebar Navigation**: Fast navigation between the 4 core workspaces, quick city switcher pills displaying real-time ASOS temperature and dominant edge direction, and real-time AI Agent state.
- **Top Telemetry Bar**: Real-time system health badge, API latencies (Kalshi ~14ms, Polymarket ~22ms, Google WeatherNext 3 ~8ms), global live countdown timer to the hourly boundary (`HH:00:00`), clock speed accelerator (`1x`, `10x`, `60x`), manual rollover trigger, and portfolio equity.
- **Multi-Column Financial Grid**: Side-by-side CLOB order book depth ladders, live trade tapes, interactive SVG Gaussian probability curves, and active position cards.

### Mobile Terminal (Android & Touch Devices)
- **Sticky Bottom Navigation Bar**: Quick-switch tabs (`Command`, `Intel`, `Deep-Dive`, `Agent/Logs`) with dynamic badge counters.
- **Horizontal Swipeable City Strip**: Smooth horizontal scroll bar for switching between Chicago (ORD), New York (NYC), Los Angeles (LAX), Miami (MIA), and Austin (AUS) with zero layout shifts.
- **Single-Column High-Density Cards**: Optimized for 60 FPS touch interaction, thumb-friendly execution buttons, and high-contrast numbers.

---

## 2. The 4 Navigation Menu Tabs

1. **`Live Command`**:
   - Multi-city real-time CLOB order book for the active temperature strike bracket.
   - Dual exchange depth ladders (Kalshi USD vs Polymarket USDC) with cumulative volume visualization.
   - Live Odds comparison bar and real-time Cross-Market Arbitrage notice.
   - Real-time executed trades tape and active positions manager with 1-click exit.

2. **`Pre-Market Intel`**:
   - Dedicated pre-opening calculation engine & edge matrix.
   - Computes Expected Value (EV) for BOTH `YES` and `NO` options across every single temperature tier.
   - Statistical Asymmetry Heatmap highlighting the top 3 highest-probability alpha opportunities.
   - 1-Click "STAGE" order ticket with automated Kelly sizing and batch execution.

3. **`City Deep-Dive`**:
   - Interactive SVG Gaussian & skew-normal probability curve with temperature bracket demarcations and live temperature pin marker.
   - 5-member Google WeatherNext 3 ensemble variance breakdown (`WeatherNext_3`, `HRRR_CONUS`, `ECMWF_HRES`, `GFS_FV3`, `AI_Neural_Blend`).
   - Granular atmospheric sensor telemetry: Dew Point, Relative Humidity, Barometric Pressure trend, Wind velocity, Solar Radiation, and simulated Radar Reflectivity (dBZ).
   - Historical Brier accuracy calibration score (`0.074`).

4. **`Agent Config / Logs`**:
   - Autonomous AI execution agent controls: Min EV hurdle %, Half-Kelly multiplier, Max position size ($), Stop-loss %, Take-profit %, and Auto-hedge arbitrage toggle.
   - Real-time API connectivity status & WebSocket latency monitors.
   - Filterable system audit logs with JSON payload inspector.
   - Portfolio performance analytics: Sharpe ratio, Win rate %, Realized PnL, Max Drawdown.

---

## 3. Quantitative Financial & Atmospheric Mathematics

### Cumulative Temperature Probability
Given ensemble mean $\mu$, standard deviation $\sigma$, and skewness $\gamma$, the probability that the final ASOS station reading falls within bracket $[T_1, T_2]$ is:

$$P(T_1 \le T < T_2) = \Phi\left(\frac{T_2 - \mu}{\sigma}\right) - \Phi\left(\frac{T_1 - \mu}{\sigma}\right)$$

where $\Phi(z) = \frac{1}{2}\left[1 + \text{erf}\left(\frac{z}{\sqrt{2}}\right)\right]$.

### Expected Value (EV)
For binary contracts settled at $\$1.00$ or $\$0.00$ purchased at ask price $p$:

$$\text{EV}_{\text{YES}} = P_{\text{model}} \cdot (1 - p_{\text{YES}}) - (1 - P_{\text{model}}) \cdot p_{\text{YES}} = P_{\text{model}} - p_{\text{YES}}$$

$$\text{EV}_{\text{NO}} = (1 - P_{\text{model}}) \cdot (1 - p_{\text{NO}}) - P_{\text{model}} \cdot p_{\text{NO}} = (1 - P_{\text{model}}) - p_{\text{NO}}$$

### Fractional Kelly Criterion
Optimal bankroll allocation fraction $f^*$ with quarter-Kelly dampening ($0.25\times$) for drawdown control:

$$f^* = \text{clamp}\left( \frac{P_{\text{model}} - p}{1 - p} \times 0.25, \; 0, \; 0.15 \right)$$

### Cross-Market Arbitrage Condition
If the best ask for YES on Platform A plus the best ask for NO on Platform B is less than $\$0.985$:

$$\text{Ask}_{\text{YES}, A} + \text{Ask}_{\text{NO}, B} < 0.985 \implies \text{Guaranteed Synthetic Profit} \ge 1.5\%$$

---

## 4. Core Cities & Station Coverage

| City | Station Code | Location | Elev (ft) | Primary Climate Dynamics |
| :--- | :---: | :--- | :---: | :--- |
| **Chicago** | `KORD` | O'Hare Intl Airport, IL | 672 | Lake Michigan breeze frontal boundary |
| **New York** | `KNYC` | Central Park Station, NY | 130 | Urban heat island & Atlantic sea breeze |
| **Los Angeles** | `KLAX` | Los Angeles Intl, CA | 125 | Marine layer low stratus & coastal inversions |
| **Miami** | `KMIA` | Miami Intl Airport, FL | 9 | Tropical convection & sea-breeze convergence |
| **Austin** | `KAUS` | Bergstrom / Camp Mabry, TX | 542 | Texas dryline & diurnal radiative heating |

---

## 5. Local Setup & Production Deployment

### Prerequisites
- Node.js v20+ or [Bun](https://bun.sh)
- npm or bun

### Local Development
```bash
# Clone the repository
git clone https://github.com/rabapuba/polymarket-feed-pro.git
cd polymarket-feed-pro

# Install dependencies
npm install

# Start development server
npm run dev
```
Navigate to `http://localhost:5173`.

### Production Build
```bash
npm run build
```
Generates an optimized bundle in `dist/`.

### Deployment to Vercel / Cloudflare Pages / Custom Domain
1. Connect your GitHub repository to [Vercel](https://vercel.com) or [Cloudflare Pages](https://pages.cloudflare.com).
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Add your custom domain under **Project Settings > Domains**.

---

## License
MIT License. Built for high-frequency quantitative prediction market analytics.
