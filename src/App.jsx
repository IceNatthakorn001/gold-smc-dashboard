import { useGoldPrice } from './hooks/useGoldPrice'
import useStore from './store/useStore'
import Header from './components/Layout/Header'
import TradingViewWidget from './components/Chart/TradingViewWidget'
import SMCChart from './components/Chart/SMCChart'
import MarketDataPanel from './components/MarketData/MarketDataPanel'
import SMCPanel from './components/Indicators/SMCPanel'
import NewsPanel from './components/News/NewsPanel'

export default function App() {
  useGoldPrice() // starts real-time price + SMC simulation

  const { view } = useStore()

  return (
    <div className="flex flex-col h-screen bg-surface overflow-hidden">
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <Header />

      {/* ── Market data strip ─────────────────────────────────────────────── */}
      <MarketDataPanel />

      {/* ── Main dashboard ────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Chart area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {view === 'tradingview' ? <TradingViewWidget /> : <SMCChart />}
        </div>

        {/* Right sidebar */}
        <aside className="w-64 xl:w-72 shrink-0 flex flex-col border-l border-surface-4 overflow-hidden">
          <div className="flex-1 flex flex-col gap-0 overflow-hidden divide-y divide-surface-4">
            {/* SMC panel takes ~55% height */}
            <div className="flex-[55] min-h-0 overflow-hidden flex flex-col">
              <SMCPanel />
            </div>

            {/* News panel takes remaining */}
            <div className="flex-[45] min-h-0 overflow-hidden flex flex-col">
              <NewsPanel />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
