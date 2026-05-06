import { useEffect, useRef } from 'react'
import useStore from '../../store/useStore'

const TIMEFRAMES = ['1m', '5m', '15m', '1H', '4H', '1D']

export default function TradingViewWidget() {
  const containerRef = useRef(null)
  const { timeframe, tvInterval, setTimeframe } = useStore()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ''
    const uid = 'tv_' + Date.now()

    const inner = document.createElement('div')
    inner.id = uid
    inner.style.cssText = 'width:100%;height:100%;'
    container.appendChild(inner)

    const init = () => {
      /* global TradingView */
      new window.TradingView.widget({
        autosize: true,
        symbol: 'OANDA:XAUUSD',
        interval: tvInterval,
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#131319',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        save_image: false,
        container_id: uid,
        overrides: {
          'paneProperties.background': '#0d0d12',
          'paneProperties.backgroundType': 'solid',
          'paneProperties.vertGridProperties.color': '#1a1a23',
          'paneProperties.horzGridProperties.color': '#1a1a23',
          'mainSeriesProperties.candleStyle.upColor': '#22c55e',
          'mainSeriesProperties.candleStyle.downColor': '#ef4444',
          'mainSeriesProperties.candleStyle.borderUpColor': '#22c55e',
          'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
          'mainSeriesProperties.candleStyle.wickUpColor': '#22c55e',
          'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444',
        },
        studies_overrides: {},
        loading_screen: { backgroundColor: '#0d0d12', foregroundColor: '#e8b800' },
      })
    }

    if (window.TradingView) {
      init()
    } else {
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/tv.js'
      script.async = true
      script.onload = init
      document.head.appendChild(script)
    }

    return () => {
      container.innerHTML = ''
    }
  }, [tvInterval])

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
          Live data via TradingView
        </div>
      </div>

      {/* Widget container */}
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  )
}
