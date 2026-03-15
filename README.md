# Encode — The Analyst's Terminal

### [Click Here](https://encodeterminal.netlify.app/) to view the Live Website
<p style='color: red;'>(Note that the live market simulation is visible, however the past data is not visible due to blocking by YAHOO Finance in accordance with the CORS policy)</p>

A real-time simulated financial market terminal built with React 19, TypeScript, and TradingView's lightweight-charts. Encode simulates live price feeds for 100+ instruments across US and Indian markets, with candlestick charting, order book depth, technical analysis, anomaly detection, and a fully draggable/resizable panel layout — styled after a professional Bloomberg-style trading workstation.

---

## Features

### Dual-Market Simulation

Switch seamlessly between **US** (3 indexes + 47 stocks, 50 instruments) and **Indian BSE/NSE** (2 indexes + 50 Nifty 50 stocks). Each market mode loads its own instrument universe, resets simulation state, and restores your watchlist.

### Live Price Engine

All instruments tick every 100ms using **Geometric Brownian Motion (GBM)** — the same stochastic process behind the Black-Scholes model — augmented with momentum autocorrelation and mean reversion. A configurable speed multiplier (0.1× – 10×) lets you slow down or accelerate the simulation.

### 10 Interactive Panels

| Panel                  | Description                                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Price Chart**        | TradingView candlestick chart with volume histogram. Supports 17 timeframes (1m → All). Imperative canvas updates — zero React re-render cost. |
| **Order Book**         | 10-level bid/ask depth ladder with cumulative depth bars. Updates at 150ms.                                                                    |
| **Watchlist**          | Live price table with sparklines for all watched instruments. Add/remove symbols. Rows flash green/red on price change.                        |
| **Technical Analysis** | RSI, MACD, Bollinger Bands, Stochastic, SMA Cross, Volume Trend, Momentum (ROC) — combined into a STRONG BUY → STRONG SELL verdict.            |
| **Statistics**         | OHLC, VWAP, SMA/EMA, volatility, Sharpe/Sortino ratio, max drawdown, skewness, kurtosis.                                                       |
| **Signal Feed**        | Scrolling log of detected anomaly events (price spikes, volume bursts, momentum shifts, correlation breaks).                                   |
| **Heatmap**            | Color-coded performance grid for all instruments in the active market.                                                                         |
| **Fundamentals**       | Sector, 52-week range, P/E, EPS, market cap, revenue, margins, beta, dividend yield.                                                           |
| **Analyst Forecast**   | 12-month simulated return history bar chart + target price forecast.                                                                           |
| **Controls**           | Engine play/pause, speed, market switcher (US/IN), timeframe selector, theme picker.                                                           |

Panels are **draggable and resizable** via react-grid-layout, with positions persisted to `localStorage`.

### Anomaly Detection & Injection

The engine runs a **Poisson-process anomaly injector** (λ ≈ 0.00025, ~1 event/45s) that randomly amplifies volatility, volume, or momentum. An independent **statistical detector** analyzes every tick using z-score, volume ratio, and EMA divergence — firing "whisper" overlay alerts (max 3 simultaneous, auto-dismissed after 5s) for:

- 🟡 **Price Spike** — return z-score > 2.5σ
- 🔵 **Volume Burst** — volume > 3× rolling average
- 🟣 **Correlation Break** — cross-instrument divergence
- 🟡 **Momentum Shift** — fast/slow EMA crossover

### 12 Built-in Themes

| Theme          | Style                              |
| -------------- | ---------------------------------- |
| Midnight       | Dark navy — the default            |
| Arctic Light   | Bright white / light mode          |
| Obsidian       | Pure black with zinc grays         |
| Warm Amber     | Warm brown tones                   |
| Ocean Blue     | Deep navy with cyan accents        |
| Emerald Forest | Dark green with teal highlights    |
| Sunset         | Deep magenta / purple-pink         |
| Cyberpunk      | Black with neon green/magenta/cyan |
| Solarized Dark | Classic Solarized palette          |
| Nord           | Arctic Nord blue-gray              |
| Monokai        | Classic Monokai editor colors      |
| High Contrast  | Pure black, maximum contrast       |

All themes are CSS-variable-driven and apply instantly — no page reload.

---

## Tech Stack

| Layer            | Technology                                   |
| ---------------- | -------------------------------------------- |
| UI Framework     | React 19.2 + TypeScript 5.9                  |
| State Management | Zustand 5.0 (6 stores, `persist` middleware) |
| Charting         | TradingView lightweight-charts 5.1           |
| Layout           | react-grid-layout 2.2 (draggable/resizable)  |
| Styling          | Tailwind CSS 4.2                             |
| Build            | Vite 6.2                                     |
| Linting          | ESLint 9 + typescript-eslint                 |

---

## Architecture

Encode uses a strict **three-tier architecture** that keeps high-frequency data generation completely outside React:

```
ENGINE (Pure TypeScript)       STATE (Zustand)         RENDER (React)
────────────────────────       ───────────────         ──────────────
MarketEngine                   market-store            PriceChartPanel
 ├─ GBM price stepper           ├─ ticks                └─ series.update() [imperative]
 ├─ CandleAggregator (17 TFs)   ├─ candles (17 TFs)
 ├─ OrderBookSim                ├─ order books          AnimatedNumber
 ├─ AnomalyInjector             └─ tick history          └─ rAF interpolation
 └─ AnomalyDetector
                                anomaly-store           WhisperOverlay
setInterval(100ms)              ├─ history (50 cap)      └─ CSS slide-in animation
 └──→ store.getState().action() └─ active whispers
                                                        WatchlistPanel
                                selection-store          └─ 250ms throttled selector
                                theme-store
                                watchlist-store
                                layout-store
```

**Key design principles:**

- The engine runs in a `setInterval` loop with **zero React dependencies**. It pushes data via `store.getState().action()`, never hooks.
- The price chart subscribes to Zustand via `store.subscribe()` and calls `series.update()` directly on the TradingView canvas — no React reconciliation for chart updates.
- Each panel throttles its own re-render frequency (150ms – 1000ms) to prevent render storms.
- Warmup generates 2000 historical ticks per instrument in a single `processBatch()` call — one React notification instead of hundreds of thousands.

---

## Instruments

### US Market (50 instruments)

**Indexes:** SPX (S&P 500), DJI (Dow Jones), IXIC (Nasdaq Composite)

**Mega-Cap Tech:** AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA

**Financials:** BRK.B, JPM, V, MA, BAC, GS, MS, C, WFC, AXP

**Healthcare:** UNH, JNJ, ABBV, MRK, LLY

**Energy:** XOM, CVX

**Consumer & Retail:** WMT, PG, KO, PEP, MCD, COST, HD, TGT, LOW

**Industrials:** BA, CAT, GE

**Tech (Mid/Large):** AMD, INTC, QCOM, AVGO, CRM, ORCL, NFLX, DIS

**Auto:** F, GM, USB

### Indian Market (52 instruments)

**Indexes:** SENSEX (BSE Sensex), NIFTY50 (Nifty 50)

**IT Services:** TCS, INFY, WIPRO, HCLTECH, TECHM

**Banking:** HDFCBANK, ICICIBANK, KOTAKBANK, AXISBANK, SBIN, INDUSINDBK

**Energy / Conglomerate:** RELIANCE, ONGC, BPCL, IOC, COALINDIA, ADANIENT, ADANIPORTS

**FMCG:** HINDUNILVR, ITC, NESTLEIND, BRITANNIA, TATACONSUM

**Pharma:** SUNPHARMA, DRREDDY, CIPLA, DIVISLAB, APOLLOHOSP

**Auto:** MARUTI, TATAMOTORS, BAJAJ-AUTO, HEROMOTOCO, EICHERMOT, M&M

**Metals:** TATASTEEL, JSWSTEEL, HINDALCO, VEDL

**Others:** LT, TITAN, BAJFINANCE, BHARTIARTL, ASIANPAINT, ULTRACEMCO, GRASIM, NTPC, POWERGRID, SHREECEM, UPL, PIDILITIND

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Project Structure

```
src/
├── engine/                  # Pure TypeScript — zero React dependencies
│   ├── gbm.ts               # Geometric Brownian Motion price stepper
│   ├── candle-aggregator.ts # Tick → OHLCV for 17 timeframes
│   ├── order-book-sim.ts    # Synthetic bid/ask depth generation
│   ├── anomaly-injector.ts  # Poisson-process anomaly events
│   ├── anomaly-detector.ts  # Z-score + volume ratio detection
│   ├── technical-analysis.ts# RSI, MACD, BB, Stochastic, SMA, ROC
│   ├── market-engine.ts     # Orchestrator — tick loop + warmup
│   └── markets/
│       ├── us-market.ts     # 3 indexes + 47 US stocks
│       └── in-market.ts     # 2 indexes + 50 Nifty 50 stocks
├── stores/                  # Zustand state (6 stores)
│   ├── market-store.ts      # Ticks, candles, order books
│   ├── anomaly-store.ts     # Whisper queue + history
│   ├── selection-store.ts   # Active instrument, timeframe, market mode
│   ├── theme-store.ts       # Active theme + CSS var application
│   ├── watchlist-store.ts   # User watchlist (persisted)
│   └── layout-store.ts      # Panel grid positions (persisted)
├── components/
│   ├── layout/              # Terminal, PanelGrid, Panel, StatusBar
│   ├── panels/              # 10 panel components
│   ├── controls/            # InstrumentSelector, TimeframeSelector,
│   │                        #   EngineControls, ThemeSelector
│   └── shared/              # AnimatedNumber, SparkLine, WhisperOverlay,
│                            #   PulseIndicator, Ticker
├── hooks/                   # useLightweightChart, useAnimatedValue,
│                            #   useAnomalyPulse, useThrottledSelector
└── lib/                     # math.ts, format.ts, ring-buffer.ts,
                             #   color.ts, throttle.ts, yahoo-finance.ts
```

---

## Documentation

Full technical documentation is available in [`docs/Encode-Terminal-Documentation.pdf`](docs/Encode-Terminal-Documentation.pdf), covering the data engine internals, state management architecture, performance techniques, and a complete instrument reference.
