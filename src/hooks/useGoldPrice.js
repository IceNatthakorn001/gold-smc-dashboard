import { useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import { generateGoldCandles, simulateTick } from '../utils/dataGenerator'
import { runSMC } from '../utils/smcEngine'

const SMC_RECALC_INTERVAL = 5 // recalculate SMC every N ticks

export function useGoldPrice() {
  const {
    timeframe,
    setCandles,
    updateLastCandle,
    updateMarketData,
    setSMCData,
    candles: storeCandles,
  } = useStore()

  const tickCount = useRef(0)
  const candlesRef = useRef([])
  const intervalRef = useRef(null)

  // Re-seed historical data when timeframe changes
  useEffect(() => {
    const initial = generateGoldCandles(400, timeframe)
    candlesRef.current = initial
    setCandles(initial)

    const smc = runSMC(initial)
    setSMCData(smc)

    const last = initial[initial.length - 1]
    updateMarketData({
      currentPrice: last.close,
      high24h: Math.max(...initial.slice(-24).map((c) => c.high)),
      low24h: Math.min(...initial.slice(-24).map((c) => c.low)),
      trendBias: smc?.trend ?? 'neutral',
    })
  }, [timeframe])

  // Real-time tick simulation
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!candlesRef.current.length) return

      const result = simulateTick(candlesRef.current, timeframe)
      candlesRef.current = result.candles

      // Update the last candle in the store (lightweight-charts handles upsert)
      const updated = result.candles[result.candles.length - 1]
      updateLastCandle(updated)

      // Update market data price
      const prev = candlesRef.current[candlesRef.current.length - 2]?.close ?? updated.close
      const change = updated.close - prev
      const changePct = (change / prev) * 100

      updateMarketData({
        currentPrice: updated.close,
        priceChange: change,
        priceChangePct: changePct,
        spread: +(Math.random() * 0.4 + 0.2).toFixed(2),
        volume: updated.volume,
      })

      // Recalculate SMC periodically
      tickCount.current++
      if (tickCount.current % SMC_RECALC_INTERVAL === 0) {
        const smc = runSMC(candlesRef.current)
        setSMCData(smc)
        updateMarketData({ trendBias: smc?.trend ?? 'neutral' })
      }
    }, 1500) // tick every 1.5 s

    return () => clearInterval(intervalRef.current)
  }, [timeframe])
}
