import { useEffect, useRef, useCallback } from 'react'
import {
  createChart,
  CrosshairMode,
  LineStyle,
  PriceScaleMode,
} from 'lightweight-charts'
import useStore from '../../store/useStore'

const TIMEFRAMES = ['1m', '5m', '15m', '1H', '4H', '1D']

const COLORS = {
  bg: '#0d0d12',
  grid: '#1a1a23',
  text: '#9ca3af',
  border: '#22222d',
  bull: '#22c55e',
  bear: '#ef4444',
  choch: '#f59e0b',
  fvgBull: 'rgba(34,197,94,0.12)',
  fvgBear: 'rgba(239,68,68,0.12)',
  obBull: 'rgba(34,197,94,0.18)',
  obBear: 'rgba(239,68,68,0.18)',
  demandZone: 'rgba(59,130,246,0.12)',
  supplyZone: 'rgba(168,85,247,0.12)',
  liquidityBuy: '#3b82f6',
  liquiditySell: '#a855f7',
  swingHigh: '#f59e0b',
  swingLow: '#f59e0b',
}

export default function SMCChart() {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const lineSeriesRef = useRef([])
  const canvasRef = useRef(null)

  const { timeframe, setTimeframe, candles, smcData, indicators } = useStore()

  // ── Init chart ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const chart = createChart(container, {
      layout: {
        background: { color: COLORS.bg },
        textColor: COLORS.text,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: COLORS.grid },
        horzLines: { color: COLORS.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#374151', style: LineStyle.Dashed, width: 1 },
        horzLine: { color: '#374151', style: LineStyle.Dashed, width: 1 },
      },
      rightPriceScale: {
        borderColor: COLORS.border,
        scaleMargins: { top: 0.06, bottom: 0.06 },
      },
      timeScale: {
        borderColor: COLORS.border,
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: false,
        fixRightEdge: false,
      },
      handleScroll: true,
      handleScale: true,
    })

    const candleSeries = chart.addCandlestickSeries({
      upColor: COLORS.bull,
      downColor: COLORS.bear,
      borderUpColor: COLORS.bull,
      borderDownColor: COLORS.bear,
      wickUpColor: COLORS.bull,
      wickDownColor: COLORS.bear,
    })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries

    // Canvas overlay for box drawing
    const canvas = document.createElement('canvas')
    canvas.style.cssText =
      'position:absolute;top:0;left:0;pointer-events:none;z-index:3;'
    container.style.position = 'relative'
    container.appendChild(canvas)
    canvasRef.current = canvas

    // Resize
    const ro = new ResizeObserver(() => {
      if (!container) return
      chart.applyOptions({ width: container.clientWidth, height: container.clientHeight })
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    })
    ro.observe(container)
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight

    // Redraw on pan/zoom
    chart.timeScale().subscribeVisibleTimeRangeChange(() => drawBoxCanvas())
    chart.subscribeCrosshairMove(() => drawBoxCanvas())

    return () => {
      ro.disconnect()
      chart.remove()
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas)
    }
  }, [])

  // ── Load candle data ───────────────────────────────────────────────────────
  useEffect(() => {
    const series = candleSeriesRef.current
    if (!series || !candles.length) return

    // Lightweight Charts requires sorted data; use setData for bulk + update for last
    try {
      series.setData(candles.slice(0, -1))
      series.update(candles[candles.length - 1])
    } catch {
      series.setData(candles)
    }
  }, [candles])

  // ── Draw line-based overlays (BOS / CHoCH / Liquidity / Swing dots) ────────
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    // Remove old line series
    lineSeriesRef.current.forEach((s) => {
      try { chart.removeSeries(s) } catch {}
    })
    lineSeriesRef.current = []

    if (!smcData) return

    // BOS lines
    if (indicators.bos) {
      smcData.bos.slice(-6).forEach((sig) => {
        const color = sig.direction === 'bullish' ? COLORS.bull : COLORS.bear
        const line = chart.addLineSeries({
          color,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          lastValueVisible: false,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
        })
        try {
          line.setData([
            { time: sig.pivotTime, value: sig.price },
            { time: sig.breakTime, value: sig.price },
          ])
          // Label marker
          line.setMarkers([{
            time: sig.breakTime,
            position: sig.direction === 'bullish' ? 'belowBar' : 'aboveBar',
            color,
            shape: 'arrowUp',
            text: 'BOS',
            size: 0,
          }])
        } catch {}
        lineSeriesRef.current.push(line)
      })
    }

    // CHoCH lines
    if (indicators.choch) {
      smcData.choch.slice(-4).forEach((sig) => {
        const line = chart.addLineSeries({
          color: COLORS.choch,
          lineWidth: 2,
          lineStyle: LineStyle.Dotted,
          lastValueVisible: false,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
        })
        try {
          line.setData([
            { time: sig.pivotTime, value: sig.price },
            { time: sig.breakTime, value: sig.price },
          ])
          line.setMarkers([{
            time: sig.breakTime,
            position: sig.direction === 'bullish' ? 'belowBar' : 'aboveBar',
            color: COLORS.choch,
            shape: 'circle',
            text: 'CHoCH',
            size: 0,
          }])
        } catch {}
        lineSeriesRef.current.push(line)
      })
    }

    // Liquidity horizontal lines
    if (indicators.liquidity) {
      smcData.liquidityZones.slice(-6).forEach((liq) => {
        const color = liq.type === 'buy' ? COLORS.liquidityBuy : COLORS.liquiditySell
        const line = chart.addLineSeries({
          color,
          lineWidth: 1,
          lineStyle: LineStyle.LargeDashed,
          lastValueVisible: false,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
        })
        // Extend line from first data point to last
        const firstTime = candles[0]?.time
        const lastTime = candles[candles.length - 1]?.time
        if (firstTime && lastTime) {
          try {
            line.setData([
              { time: firstTime, value: liq.price },
              { time: lastTime, value: liq.price },
            ])
          } catch {}
        }
        lineSeriesRef.current.push(line)
      })
    }

    // Trigger canvas redraw
    drawBoxCanvas()
  }, [smcData, indicators, candles])

  // ── Canvas: draw colored boxes ─────────────────────────────────────────────
  const drawBoxCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const chart = chartRef.current
    const series = candleSeriesRef.current
    if (!canvas || !chart || !series || !smcData) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const p2c = (price) => series.priceToCoordinate(price)
    const t2c = (time) => chart.timeScale().timeToCoordinate(time)

    function fillBox(x1, y1, x2, y2, fillColor, strokeColor, label, labelColor) {
      const x = Math.min(x1, x2)
      const y = Math.min(y1, y2)
      const w = Math.abs(x2 - x1)
      const h = Math.abs(y2 - y1)
      if (w < 2 || h < 2) return

      ctx.fillStyle = fillColor
      ctx.fillRect(x, y, w, h)
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = 1
      ctx.setLineDash([])
      ctx.strokeRect(x, y, w, h)

      if (label) {
        ctx.fillStyle = labelColor
        ctx.font = 'bold 9px JetBrains Mono, monospace'
        ctx.fillText(label, x + 4, y + 12)
      }
    }

    // Order Blocks
    if (indicators.orderBlocks && smcData.orderBlocks) {
      smcData.orderBlocks.slice(-6).forEach((ob) => {
        const y1 = p2c(ob.high)
        const y2 = p2c(ob.low)
        const x1 = t2c(ob.startTime)
        const x2 = t2c(ob.endTime)
        if (y1 == null || y2 == null || x1 == null || x2 == null) return

        const isBull = ob.type === 'bullish'
        const alpha = ob.mitigated ? 0.06 : 0.2
        fillBox(
          x1, y1, x2, y2,
          isBull ? `rgba(34,197,94,${alpha})` : `rgba(239,68,68,${alpha})`,
          isBull ? (ob.mitigated ? '#15803d' : COLORS.bull) : (ob.mitigated ? '#991b1b' : COLORS.bear),
          ob.mitigated ? `(M) ${ob.label}` : ob.label,
          isBull ? COLORS.bull : COLORS.bear,
        )
      })
    }

    // FVG boxes
    if (indicators.fvg && smcData.fvgs) {
      smcData.fvgs.slice(-6).forEach((fvg) => {
        const y1 = p2c(fvg.top)
        const y2 = p2c(fvg.bottom)
        const x1 = t2c(fvg.time)
        const x2 = t2c(fvg.endTime)
        if (y1 == null || y2 == null || x1 == null || x2 == null) return

        const isBull = fvg.type === 'bullish'
        fillBox(
          x1, y1, x2, y2,
          isBull ? COLORS.fvgBull : COLORS.fvgBear,
          isBull ? COLORS.bull : COLORS.bear,
          'FVG',
          isBull ? COLORS.bull : COLORS.bear,
        )
      })
    }

    // Supply & Demand Zones
    if (indicators.supplyDemand && smcData.supplyDemandZones) {
      smcData.supplyDemandZones.slice(-6).forEach((zone) => {
        const y1 = p2c(zone.high)
        const y2 = p2c(zone.low)
        const x1 = t2c(zone.startTime)
        const x2 = t2c(zone.endTime)
        if (y1 == null || y2 == null || x1 == null || x2 == null) return

        const isDemand = zone.type === 'demand'
        const strokeColor = isDemand ? '#3b82f6' : '#a855f7'
        const fillColor = isDemand ? COLORS.demandZone : COLORS.supplyZone
        const label = isDemand
          ? zone.strength === 'premium' ? 'D-Zone★' : 'D-Zone'
          : zone.strength === 'premium' ? 'S-Zone★' : 'S-Zone'

        fillBox(x1, y1, x2, y2, fillColor, strokeColor, label, strokeColor)
      })
    }

    // Swing High/Low dots on canvas
    if (indicators.swings) {
      const dotR = 3
      ctx.fillStyle = COLORS.swingHigh

      smcData.swingHighs?.slice(-30).forEach((sh) => {
        const cx = t2c(sh.time)
        const cy = p2c(sh.price)
        if (cx == null || cy == null) return
        ctx.beginPath()
        ctx.arc(cx, cy - 6, dotR, 0, Math.PI * 2)
        ctx.fill()
      })

      smcData.swingLows?.slice(-30).forEach((sl) => {
        const cx = t2c(sl.time)
        const cy = p2c(sl.price)
        if (cx == null || cy == null) return
        ctx.beginPath()
        ctx.arc(cx, cy + 6, dotR, 0, Math.PI * 2)
        ctx.fill()
      })
    }
  }, [smcData, indicators, candles])

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Timeframe bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-surface-4 bg-surface-2 shrink-0">
        <span className="text-[10px] text-gray-600 mr-2 uppercase tracking-widest">TF</span>
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={[
              'px-2.5 py-0.5 text-xs rounded transition-all font-mono',
              timeframe === tf
                ? 'bg-gold-500 text-black font-bold'
                : 'text-gray-500 hover:text-white hover:bg-surface-4',
            ].join(' ')}
          >
            {tf}
          </button>
        ))}
        <div className="ml-auto text-[10px] text-gray-600 hidden sm:block">
          Simulated data — plug in real API for live
        </div>
      </div>

      {/* Chart container */}
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  )
}
