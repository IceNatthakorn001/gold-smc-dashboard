import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Square,
  Zap,
  Droplets,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import useStore from '../../store/useStore'
import clsx from 'clsx'

const INDICATOR_CFG = [
  {
    key: 'bos',
    label: 'Break of Structure',
    short: 'BOS',
    color: 'text-green-400',
    icon: ArrowUpRight,
    desc: 'Structural break confirming trend continuation',
  },
  {
    key: 'choch',
    label: 'Change of Character',
    short: 'CHoCH',
    color: 'text-amber-400',
    icon: Zap,
    desc: 'First structural break against prevailing trend',
  },
  {
    key: 'orderBlocks',
    label: 'Order Blocks',
    short: 'OB',
    color: 'text-blue-400',
    icon: Square,
    desc: 'Last opposing candle before impulse move',
  },
  {
    key: 'fvg',
    label: 'Fair Value Gaps',
    short: 'FVG',
    color: 'text-purple-400',
    icon: Layers,
    desc: '3-candle price imbalance (unfilled gaps)',
  },
  {
    key: 'liquidity',
    label: 'Liquidity Zones',
    short: 'LIQ',
    color: 'text-cyan-400',
    icon: Droplets,
    desc: 'Buy-side / sell-side liquidity pools',
  },
  {
    key: 'supplyDemand',
    label: 'Supply & Demand',
    short: 'S&D',
    color: 'text-rose-400',
    icon: Layers,
    desc: 'Origin zones of impulse moves',
  },
  {
    key: 'swings',
    label: 'Swing Points',
    short: 'SW',
    color: 'text-yellow-400',
    icon: TrendingUp,
    desc: 'Pivot highs and lows',
  },
]

export default function SMCPanel() {
  const { indicators, toggleIndicator, smcData } = useStore()
  const [expanded, setExpanded] = useState(true)
  const [activeSection, setActiveSection] = useState(null)

  return (
    <div className="panel flex flex-col overflow-hidden">
      <button
        className="panel-header w-full text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="panel-title">SMC Indicators</span>
        {expanded ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
      </button>

      {expanded && (
        <div className="flex flex-col overflow-y-auto">
          {/* Toggle switches */}
          <div className="p-2 space-y-1 border-b border-surface-4">
            {INDICATOR_CFG.map((cfg) => (
              <ToggleRow
                key={cfg.key}
                cfg={cfg}
                active={indicators[cfg.key]}
                onToggle={() => toggleIndicator(cfg.key)}
                onClick={() => setActiveSection(activeSection === cfg.key ? null : cfg.key)}
                expanded={activeSection === cfg.key}
                smcData={smcData}
              />
            ))}
          </div>

          {/* Active levels display */}
          {smcData && (
            <div className="flex-1 overflow-y-auto">
              <ActiveLevels smcData={smcData} indicators={indicators} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ToggleRow({ cfg, active, onToggle, onClick, expanded, smcData }) {
  const Icon = cfg.icon
  const count = getCount(smcData, cfg.key)

  return (
    <div className="rounded bg-surface-2 overflow-hidden">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <button onClick={onToggle} className="shrink-0">
          <div
            className={clsx(
              'w-7 h-3.5 rounded-full relative transition-colors',
              active ? 'bg-gold-500' : 'bg-surface-4',
            )}
          >
            <div
              className={clsx(
                'absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-all',
                active ? 'left-3.5' : 'left-0.5',
              )}
            />
          </div>
        </button>

        <Icon size={11} className={clsx('shrink-0', active ? cfg.color : 'text-gray-600')} />

        <button
          onClick={onClick}
          className="flex-1 text-left flex items-center justify-between min-w-0"
        >
          <span
            className={clsx(
              'text-xs truncate',
              active ? 'text-gray-200' : 'text-gray-600',
            )}
          >
            {cfg.short}
          </span>
          <div className="flex items-center gap-1.5">
            {count > 0 && (
              <span
                className={clsx(
                  'text-[9px] px-1.5 py-0.5 rounded-full font-mono',
                  active ? `bg-surface-4 ${cfg.color}` : 'bg-surface-3 text-gray-700',
                )}
              >
                {count}
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  )
}

function getCount(smcData, key) {
  if (!smcData) return 0
  const map = {
    bos: smcData.bos?.length,
    choch: smcData.choch?.length,
    orderBlocks: smcData.orderBlocks?.filter((o) => !o.mitigated).length,
    fvg: smcData.fvgs?.length,
    liquidity: smcData.liquidityZones?.length,
    supplyDemand: smcData.supplyDemandZones?.length,
    swings: (smcData.swingHighs?.length ?? 0) + (smcData.swingLows?.length ?? 0),
  }
  return map[key] ?? 0
}

function ActiveLevels({ smcData, indicators }) {
  if (!smcData) return null

  return (
    <div className="p-2 space-y-2 text-[11px]">
      {/* BOS */}
      {indicators.bos && smcData.bos?.length > 0 && (
        <Section title="BOS" color="text-green-400">
          {smcData.bos.slice(-4).reverse().map((b, i) => (
            <Level
              key={i}
              label={b.direction === 'bullish' ? '↑ Bull BOS' : '↓ Bear BOS'}
              price={b.price}
              color={b.direction === 'bullish' ? 'text-green-400' : 'text-red-400'}
            />
          ))}
        </Section>
      )}

      {/* CHoCH */}
      {indicators.choch && smcData.choch?.length > 0 && (
        <Section title="CHoCH" color="text-amber-400">
          {smcData.choch.slice(-3).reverse().map((c, i) => (
            <Level
              key={i}
              label={c.direction === 'bullish' ? '↑ Bull CHoCH' : '↓ Bear CHoCH'}
              price={c.price}
              color="text-amber-400"
            />
          ))}
        </Section>
      )}

      {/* Order Blocks */}
      {indicators.orderBlocks && smcData.orderBlocks?.length > 0 && (
        <Section title="Order Blocks" color="text-blue-400">
          {smcData.orderBlocks.slice(-4).reverse().map((ob, i) => (
            <div key={i} className="flex items-center justify-between py-0.5">
              <span className={ob.type === 'bullish' ? 'text-green-400' : 'text-red-400'}>
                {ob.type === 'bullish' ? '▲' : '▼'} {ob.label}
                {ob.mitigated && <span className="text-gray-600 ml-1">[M]</span>}
              </span>
              <span className="text-gray-400 font-mono tabular-nums">
                {fmt(ob.low)} – {fmt(ob.high)}
              </span>
            </div>
          ))}
        </Section>
      )}

      {/* FVG */}
      {indicators.fvg && smcData.fvgs?.length > 0 && (
        <Section title="Fair Value Gaps" color="text-purple-400">
          {smcData.fvgs.slice(-4).reverse().map((fvg, i) => (
            <div key={i} className="flex items-center justify-between py-0.5">
              <span className={fvg.type === 'bullish' ? 'text-green-400' : 'text-red-400'}>
                {fvg.type === 'bullish' ? '↑' : '↓'} FVG
              </span>
              <span className="text-gray-400 font-mono tabular-nums">
                {fmt(fvg.bottom)} – {fmt(fvg.top)}
              </span>
            </div>
          ))}
        </Section>
      )}

      {/* Liquidity */}
      {indicators.liquidity && smcData.liquidityZones?.length > 0 && (
        <Section title="Liquidity" color="text-cyan-400">
          {smcData.liquidityZones.slice(-6).map((liq, i) => (
            <Level
              key={i}
              label={liq.type === 'buy' ? `🔵 BSL (${liq.strength}x)` : `🟣 SSL (${liq.strength}x)`}
              price={liq.price}
              color={liq.type === 'buy' ? 'text-blue-400' : 'text-purple-400'}
            />
          ))}
        </Section>
      )}

      {/* S&D */}
      {indicators.supplyDemand && smcData.supplyDemandZones?.length > 0 && (
        <Section title="Supply & Demand" color="text-rose-400">
          {smcData.supplyDemandZones.slice(-4).reverse().map((z, i) => (
            <div key={i} className="flex items-center justify-between py-0.5">
              <span className={z.type === 'demand' ? 'text-blue-400' : 'text-purple-400'}>
                {z.type === 'demand' ? '▲ Demand' : '▼ Supply'}
                {z.strength === 'premium' && ' ★'}
              </span>
              <span className="text-gray-400 font-mono tabular-nums">
                {fmt(z.low)} – {fmt(z.high)}
              </span>
            </div>
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({ title, color, children }) {
  return (
    <div>
      <div className={clsx('text-[9px] uppercase tracking-widest mb-1', color)}>{title}</div>
      <div className="space-y-0.5 pl-1">{children}</div>
    </div>
  )
}

function Level({ label, price, color }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className={clsx(color)}>{label}</span>
      <span className="text-gray-400 font-mono tabular-nums">{fmt(price)}</span>
    </div>
  )
}

function fmt(n) {
  if (n == null) return '—'
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
