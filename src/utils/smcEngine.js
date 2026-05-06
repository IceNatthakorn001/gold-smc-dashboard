// ─────────────────────────────────────────────────────────────────────────────
//  Smart Money Concepts (SMC) Analysis Engine
//  Implements: Swing Points, BOS, CHoCH, Order Blocks, FVG,
//              Liquidity Zones, Supply & Demand Zones
// ─────────────────────────────────────────────────────────────────────────────

/** Detect pivot swing highs and lows using a left/right bar comparison */
export function detectSwings(candles, leftBars = 4, rightBars = 4) {
  const highs = []
  const lows = []

  for (let i = leftBars; i < candles.length - rightBars; i++) {
    const c = candles[i]
    let isHigh = true
    let isLow = true

    for (let j = i - leftBars; j <= i + rightBars; j++) {
      if (j === i) continue
      if (candles[j].high >= c.high) isHigh = false
      if (candles[j].low <= c.low) isLow = false
    }

    if (isHigh) highs.push({ index: i, price: c.high, time: c.time, type: 'high' })
    if (isLow) lows.push({ index: i, price: c.low, time: c.time, type: 'low' })
  }

  return { highs, lows }
}

/** Break of Structure and Change of Character detection */
export function detectBOSCHoCH(candles, swingHighs, swingLows) {
  const bos = []
  const choch = []
  let trend = 'neutral'

  const all = [
    ...swingHighs.map((s) => ({ ...s, type: 'high' })),
    ...swingLows.map((s) => ({ ...s, type: 'low' })),
  ].sort((a, b) => a.index - b.index)

  for (const swing of all) {
    const startSearch = swing.index + 1

    for (let i = startSearch; i < candles.length; i++) {
      const c = candles[i]

      if (swing.type === 'high' && c.close > swing.price) {
        const sig = {
          price: swing.price,
          breakTime: c.time,
          pivotTime: swing.time,
          breakIndex: i,
          pivotIndex: swing.index,
          direction: 'bullish',
        }
        if (trend === 'bearish') {
          choch.push({ ...sig, label: 'CHoCH' })
        } else {
          bos.push({ ...sig, label: 'BOS' })
        }
        trend = 'bullish'
        break
      }

      if (swing.type === 'low' && c.close < swing.price) {
        const sig = {
          price: swing.price,
          breakTime: c.time,
          pivotTime: swing.time,
          breakIndex: i,
          pivotIndex: swing.index,
          direction: 'bearish',
        }
        if (trend === 'bullish') {
          choch.push({ ...sig, label: 'CHoCH' })
        } else {
          bos.push({ ...sig, label: 'BOS' })
        }
        trend = 'bearish'
        break
      }
    }
  }

  return { bos: bos.slice(-10), choch: choch.slice(-5), trend }
}

/** Order Blocks: last opposing candle before each structural break */
export function detectOrderBlocks(candles, bos, choch) {
  const blocks = []
  const all = [...bos, ...choch].sort((a, b) => a.breakIndex - b.breakIndex)

  for (const sig of all) {
    const lookback = Math.max(0, sig.breakIndex - 25)

    if (sig.direction === 'bullish') {
      // Find last bearish candle before the break (bullish OB)
      for (let i = sig.breakIndex - 1; i >= lookback; i--) {
        const c = candles[i]
        if (c.close < c.open) {
          const endIdx = Math.min(candles.length - 1, i + 30)
          const mitigated = isMitigated(candles, i + 1, c.low, c.high, 'bullish')
          blocks.push({
            type: 'bullish',
            high: c.high,
            low: c.low,
            startTime: c.time,
            endTime: candles[endIdx].time,
            index: i,
            mitigated,
            label: sig.label === 'CHoCH' ? 'CHoCH OB' : 'OB',
          })
          break
        }
      }
    } else {
      // Find last bullish candle before the break (bearish OB)
      for (let i = sig.breakIndex - 1; i >= lookback; i--) {
        const c = candles[i]
        if (c.close > c.open) {
          const endIdx = Math.min(candles.length - 1, i + 30)
          const mitigated = isMitigated(candles, i + 1, c.low, c.high, 'bearish')
          blocks.push({
            type: 'bearish',
            high: c.high,
            low: c.low,
            startTime: c.time,
            endTime: candles[endIdx].time,
            index: i,
            mitigated,
            label: sig.label === 'CHoCH' ? 'CHoCH OB' : 'OB',
          })
          break
        }
      }
    }
  }

  // Deduplicate (same time = same candle)
  const seen = new Set()
  const unique = blocks.filter((b) => {
    const key = `${b.type}-${b.startTime}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return unique.slice(-8)
}

function isMitigated(candles, fromIdx, low, high, type) {
  for (let i = fromIdx; i < candles.length; i++) {
    if (type === 'bullish' && candles[i].low <= high && candles[i].high >= low) return true
    if (type === 'bearish' && candles[i].high >= low && candles[i].low <= high) return true
  }
  return false
}

/** Fair Value Gaps: 3-candle imbalance pattern */
export function detectFVG(candles) {
  const fvgs = []

  for (let i = 1; i < candles.length - 1; i++) {
    const prev = candles[i - 1]
    const next = candles[i + 1]
    const curr = candles[i]

    // Bullish FVG: gap between prev.high and next.low
    const bullGap = next.low - prev.high
    if (bullGap > 0 && bullGap / prev.high > 0.0001) {
      const filled = isFVGFilled(candles, i + 2, next.low, prev.high, 'bullish')
      if (!filled) {
        fvgs.push({
          type: 'bullish',
          top: next.low,
          bottom: prev.high,
          time: curr.time,
          endTime: candles[Math.min(candles.length - 1, i + 20)].time,
          index: i,
        })
      }
    }

    // Bearish FVG: gap between next.high and prev.low
    const bearGap = prev.low - next.high
    if (bearGap > 0 && bearGap / prev.low > 0.0001) {
      const filled = isFVGFilled(candles, i + 2, next.high, prev.low, 'bearish')
      if (!filled) {
        fvgs.push({
          type: 'bearish',
          top: prev.low,
          bottom: next.high,
          time: curr.time,
          endTime: candles[Math.min(candles.length - 1, i + 20)].time,
          index: i,
        })
      }
    }
  }

  return fvgs.slice(-8)
}

function isFVGFilled(candles, fromIdx, topPrice, bottomPrice, type) {
  for (let i = fromIdx; i < candles.length; i++) {
    if (type === 'bullish' && candles[i].low <= topPrice) return true
    if (type === 'bearish' && candles[i].high >= bottomPrice) return true
  }
  return false
}

/** Liquidity Zones: clusters of swing highs (buy-side) and swing lows (sell-side) */
export function detectLiquidity(swingHighs, swingLows, threshold = 0.0015) {
  const buyLiq = clusterLevels(swingHighs, threshold).map((c) => ({
    type: 'buy',
    price: c.level,
    strength: c.count,
    label: `BSL (${c.count}x)`,
  }))
  const sellLiq = clusterLevels(swingLows, threshold).map((c) => ({
    type: 'sell',
    price: c.level,
    strength: c.count,
    label: `SSL (${c.count}x)`,
  }))

  return [...buyLiq.slice(-4), ...sellLiq.slice(-4)]
}

function clusterLevels(swings, threshold) {
  if (!swings.length) return []
  const sorted = [...swings].sort((a, b) => a.price - b.price)
  const clusters = []
  let current = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.abs(sorted[i].price - current[0].price) / current[0].price
    if (diff < threshold) {
      current.push(sorted[i])
    } else {
      clusters.push({
        level: current.reduce((s, c) => s + c.price, 0) / current.length,
        count: current.length,
      })
      current = [sorted[i]]
    }
  }
  if (current.length) {
    clusters.push({
      level: current.reduce((s, c) => s + c.price, 0) / current.length,
      count: current.length,
    })
  }
  return clusters.filter((c) => c.count >= 1)
}

/** Supply & Demand Zones: origin of impulse moves */
export function detectSupplyDemand(candles, bos, choch) {
  const zones = []
  const all = [...bos, ...choch].sort((a, b) => a.breakIndex - b.breakIndex)

  for (const sig of all) {
    if (sig.direction === 'bullish') {
      const slice = candles.slice(Math.max(0, sig.pivotIndex - 8), sig.pivotIndex + 1)
      if (!slice.length) continue
      zones.push({
        type: 'demand',
        high: Math.max(...slice.map((c) => c.high)),
        low: Math.min(...slice.map((c) => c.low)),
        startTime: slice[0].time,
        endTime: candles[Math.min(candles.length - 1, sig.breakIndex + 25)].time,
        strength: sig.label === 'CHoCH' ? 'premium' : 'normal',
      })
    } else {
      const slice = candles.slice(Math.max(0, sig.pivotIndex - 8), sig.pivotIndex + 1)
      if (!slice.length) continue
      zones.push({
        type: 'supply',
        high: Math.max(...slice.map((c) => c.high)),
        low: Math.min(...slice.map((c) => c.low)),
        startTime: slice[0].time,
        endTime: candles[Math.min(candles.length - 1, sig.breakIndex + 25)].time,
        strength: sig.label === 'CHoCH' ? 'premium' : 'normal',
      })
    }
  }

  const seen = new Set()
  const unique = zones.filter((z) => {
    const key = `${z.type}-${z.startTime}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return unique.slice(-6)
}

/** EMA helper */
function ema(prices, period) {
  const k = 2 / (period + 1)
  let val = prices[0]
  for (let i = 1; i < prices.length; i++) {
    val = prices[i] * k + val * (1 - k)
  }
  return val
}

/** Overall trend bias using EMA cross + BOS/CHoCH */
export function detectTrendBias(candles, lastTrend) {
  if (candles.length < 50) return 'neutral'

  const closes = candles.slice(-80).map((c) => c.close)
  const e20 = ema(closes, 20)
  const e50 = ema(closes, 50)
  const priceDelta = (closes[closes.length - 1] - closes[0]) / closes[0]

  if (e20 > e50 * 1.0005 && priceDelta > 0) return 'bullish'
  if (e20 < e50 * 0.9995 && priceDelta < 0) return 'bearish'
  if (lastTrend === 'bullish' && e20 > e50) return 'bullish'
  if (lastTrend === 'bearish' && e20 < e50) return 'bearish'
  return 'neutral'
}

/** Run full SMC analysis pipeline */
export function runSMC(candles) {
  if (candles.length < 30) return null

  const { highs, lows } = detectSwings(candles, 4, 4)
  const { bos, choch, trend } = detectBOSCHoCH(candles, highs, lows)
  const orderBlocks = detectOrderBlocks(candles, bos, choch)
  const fvgs = detectFVG(candles)
  const liquidityZones = detectLiquidity(highs, lows)
  const supplyDemandZones = detectSupplyDemand(candles, bos, choch)
  const trendBias = detectTrendBias(candles, trend)

  return {
    swingHighs: highs,
    swingLows: lows,
    bos,
    choch,
    orderBlocks,
    fvgs,
    liquidityZones,
    supplyDemandZones,
    trend: trendBias,
  }
}
