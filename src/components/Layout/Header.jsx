import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'
import useStore from '../../store/useStore'
import clsx from 'clsx'

export default function Header() {
  const { currentPrice, prevPrice, priceChange, priceChangePct, trendBias, view, setView } =
    useStore()

  const isUp = currentPrice >= prevPrice
  const priceColor = isUp ? 'text-green-400' : 'text-red-400'

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-surface-1 border-b border-surface-4 select-none shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-gold-400 font-bold text-lg tracking-tight">
          ◈ GOLD<span className="text-white">SMC</span>
        </span>
        <span className="hidden sm:block text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">
          Smart Money Dashboard
        </span>
      </div>

      {/* Live Price */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5">
          <span className="text-gray-500 text-xs">XAU/USD</span>
          <span
            className={clsx(
              'font-mono font-bold text-base transition-colors duration-300',
              priceColor,
            )}
          >
            {currentPrice?.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span
            className={clsx(
              'text-xs font-mono',
              priceChange >= 0 ? 'text-green-400' : 'text-red-400',
            )}
          >
            {priceChange >= 0 ? '+' : ''}
            {priceChange?.toFixed(2)} ({priceChangePct >= 0 ? '+' : ''}
            {priceChangePct?.toFixed(2)}%)
          </span>
        </div>

        {/* Trend Badge */}
        <TrendBadge bias={trendBias} />

        {/* Live dot */}
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          LIVE
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-1 bg-surface-3 rounded p-0.5">
        <ViewTab active={view === 'tradingview'} onClick={() => setView('tradingview')}>
          TV Chart
        </ViewTab>
        <ViewTab active={view === 'smc'} onClick={() => setView('smc')}>
          SMC View
        </ViewTab>
      </div>
    </header>
  )
}

function TrendBadge({ bias }) {
  const cfg = {
    bullish: { icon: TrendingUp, cls: 'badge-bull', label: 'Bullish' },
    bearish: { icon: TrendingDown, cls: 'badge-bear', label: 'Bearish' },
    neutral: { icon: Minus, cls: 'badge-neutral', label: 'Neutral' },
  }
  const { icon: Icon, cls, label } = cfg[bias] ?? cfg.neutral
  return (
    <span className={cls}>
      <Icon size={10} className="inline mr-1" />
      {label}
    </span>
  )
}

function ViewTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-3 py-1 text-xs rounded transition-all',
        active
          ? 'bg-gold-500 text-black font-semibold'
          : 'text-gray-400 hover:text-white',
      )}
    >
      {children}
    </button>
  )
}
