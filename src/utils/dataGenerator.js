const TF_SECONDS = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1H': 3600,
  '4H': 14400,
  '1D': 86400,
}

/**
 * Generates realistic OHLCV candles using a trend-following random walk model.
 * The generator creates impulse + correction phases to produce SMC-worthy structure.
 */
export function generateGoldCandles(count = 500, timeframe = '1H', basePrice = 3318.45) {
  const barSeconds = TF_SECONDS[timeframe] || 3600
  const now = Math.floor(Date.now() / 1000)
  // Align to bar boundary
  const alignedNow = now - (now % barSeconds)
  const startTime = alignedNow - count * barSeconds

  const candles = []
  let price = basePrice - (Math.random() * basePrice * 0.04)
  let momentum = 0
  let phase = 0 // counter to create structured swings
  let phaseDir = 1 // 1 = up, -1 = down
  let phaseLen = 20 + Math.floor(Math.random() * 30)

  for (let i = 0; i < count; i++) {
    const time = startTime + i * barSeconds

    // Switch phase direction to create higher-highs/lower-lows structure
    phase++
    if (phase >= phaseLen) {
      phase = 0
      phaseDir *= -1
      phaseLen = 15 + Math.floor(Math.random() * 35)
    }

    const volatility = price * 0.0018
    const trendPull = phaseDir * volatility * 0.3
    const noiseAmp = volatility * (0.5 + Math.random())

    momentum = momentum * 0.88 + trendPull * 0.12
    const bodyMove = momentum + (Math.random() - 0.5) * noiseAmp

    const open = price
    const close = Math.max(basePrice * 0.82, Math.min(basePrice * 1.18, price + bodyMove))
    price = close

    const range = Math.abs(close - open)
    const wickExtension = range * (0.3 + Math.random() * 0.8)
    const high = Math.max(open, close) + wickExtension * Math.random()
    const low = Math.min(open, close) - wickExtension * Math.random()
    const volume = Math.floor(800 + Math.random() * 8200)

    candles.push({
      time,
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
      volume,
    })
  }

  return candles
}

function round2(n) {
  return Math.round(n * 100) / 100
}

/**
 * Simulates one tick update to the last candle. Returns updated last candle
 * plus a new next candle when the bar closes.
 */
export function simulateTick(candles, timeframe = '1H') {
  if (!candles.length) return { candles, newBar: false }

  const barSeconds = TF_SECONDS[timeframe] || 3600
  const now = Math.floor(Date.now() / 1000)
  const alignedNow = now - (now % barSeconds)

  const last = candles[candles.length - 1]
  const volatility = last.close * 0.0003
  const delta = (Math.random() - 0.49) * volatility
  const newClose = round2(last.close + delta)
  const newHigh = round2(Math.max(last.high, newClose))
  const newLow = round2(Math.min(last.low, newClose))

  const updatedLast = { ...last, close: newClose, high: newHigh, low: newLow }

  if (alignedNow > last.time) {
    // New bar starts
    const newBar = {
      time: alignedNow,
      open: newClose,
      high: newClose,
      low: newClose,
      close: newClose,
      volume: 0,
    }
    return {
      candles: [...candles.slice(0, -1), updatedLast, newBar],
      newBar: true,
      price: newClose,
    }
  }

  return {
    candles: [...candles.slice(0, -1), updatedLast],
    newBar: false,
    price: newClose,
  }
}
