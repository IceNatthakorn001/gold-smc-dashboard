import { TrendingUp, TrendingDown, Minus, Activity, BarChart2 } from 'lucide-react'
import useStore from '../../store/useStore'
import clsx from 'clsx'

export default function MarketDataPanel() {
  const {
    currentPrice,
    prevPrice,
    priceChange,
    priceChangePct,
    high24h,
    low24h,
    spread,
    trendBias,
    volume,
  } = useStore()

  const isUp = currentPrice >= prevPrice

  return (
    <div className="panel shrink-0">
      <div className="panel-header">
        <span className="panel-title">Market Data</span>
        <Activity size={12} className="text-gray-600" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-surface-4 text-center">
        {/* Current Price */}
        <Stat label="XAU/USD">
          <span
            className={clsx(
              'font-mono font-bold text-base transition-colors',
              isUp ? 'text-green-400' : 'text-red-400',
            )}
          >
            {fmt(currentPrice, 2)}
          </span>
        </Stat>

        {/* Change */}
        <Stat label="Change">
          <span
            className={clsx(
              'font-mono font-semibold text-sm',
              priceChange >= 0 ? 'text-green-400' : 'text-red-400',
            )}
          >
            {priceChange >= 0 ? '+' : ''}{fmt(priceChange, 2)}
          </span>
          <span
            className={clsx(
              'text-xs',
              priceChangePct >= 0 ? 'text-green-500' : 'text-red-500',
            )}
          >
            ({priceChangePct >= 0 ? '+' : ''}{fmt(priceChangePct, 3)}%)
          </span>
        </Stat>

        {/* 24h High */}
        <Stat label="24h High">
          <span className="text-green-400 font-mono text-sm">{fmt(high24h, 2)}</span>
        </Stat>

        {/* 24h Low */}
        <Stat label="24h Low">
          <span className="text-red-400 font-mono text-sm">{fmt(low24h, 2)}</span>
        </Stat>

        {/* Spread */}
        <Stat label="Spread">
          <span className="text-gold-400 font-mono text-sm">{fmt(spread, 2)}</span>
          <SpreadBar spread={spread} />
        </Stat>

        {/* Trend Bias */}
        <Stat label="Trend Bias">
          <TrendBiasWidget bias={trendBias} />
        </Stat>
      </div>
    </div>
  )
}

function Stat({ label, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 px-3 py-2.5">
      <span className="text-[9px] text-gray-600 uppercase tracking-widest mb-0.5">{label}</span>
      {children}
    </div>
  )
}

function SpreadBar({ spread }) {
  const pct = Math.min(100, (spread / 1.0) * 100)
  const color = pct < 33 ? '#22c55e' : pct < 66 ? '#f59e0b' : '#ef4444'
  return (
    <div className="w-16 h-0.5 bg-surface-4 rounded mt-1 overflow-hidden">
      <div style={{ width: `${pct}%`, backgroundColor: color }} className="h-full rounded" />
    </div>
  )
}

function TrendBiasWidget({ bias }) {
  const cfg = {
    bullish: { Icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Bullish' },
    bearish: { Icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Bearish' },
    neutral: { Icon: Minus, color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Neutral' },
  }
  const { Icon, color, bg, label } = cfg[bias] ?? cfg.neutral
  return (
    <span className={clsx('flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold', bg, color)}>
      <Icon size={11} />
      {label}
    </span>
  )
}

function fmt(n, decimals = 2) {
  if (n == null) return '—'
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
