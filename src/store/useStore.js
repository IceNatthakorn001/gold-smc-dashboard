import { create } from 'zustand'

const TF_MAP = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '1H': '60',
  '4H': '240',
  '1D': 'D',
}

const useStore = create((set, get) => ({
  // ── View ─────────────────────────────────────────────────
  view: 'tradingview', // 'tradingview' | 'smc'
  setView: (view) => set({ view }),

  // ── Timeframe ────────────────────────────────────────────
  timeframe: '1H',
  tvInterval: '60',
  setTimeframe: (tf) => set({ timeframe: tf, tvInterval: TF_MAP[tf] || '60' }),

  // ── SMC Indicator toggles ────────────────────────────────
  indicators: {
    bos: true,
    choch: true,
    orderBlocks: true,
    liquidity: true,
    fvg: true,
    supplyDemand: true,
    swings: false,
  },
  toggleIndicator: (key) =>
    set((state) => ({
      indicators: { ...state.indicators, [key]: !state.indicators[key] },
    })),

  // ── Market data ──────────────────────────────────────────
  currentPrice: 3318.45,
  prevPrice: 3318.45,
  priceChange: 0,
  priceChangePct: 0,
  high24h: 3335.2,
  low24h: 3297.8,
  spread: 0.35,
  trendBias: 'neutral', // 'bullish' | 'bearish' | 'neutral'
  volume: 0,

  updateMarketData: (data) => set((state) => ({
    prevPrice: state.currentPrice,
    ...data,
  })),

  // ── Candle data ──────────────────────────────────────────
  candles: [],
  setCandles: (candles) => set({ candles }),
  updateLastCandle: (candle) =>
    set((state) => {
      const candles = [...state.candles]
      if (!candles.length) return { candles: [candle] }
      const last = candles[candles.length - 1]
      if (last.time === candle.time) {
        candles[candles.length - 1] = candle
      } else {
        candles.push(candle)
        if (candles.length > 600) candles.shift()
      }
      return { candles }
    }),

  // ── SMC analysis data ────────────────────────────────────
  smcData: null,
  setSMCData: (smcData) => set({ smcData }),
}))

export default useStore
