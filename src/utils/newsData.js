// Mock gold news feed — structure mirrors a real NewsAPI response.
// In production, replace with a call to NewsAPI, RSS parser, or a backend proxy.

const NOW = Date.now()
const mins = (n) => new Date(NOW - n * 60_000).toISOString()

export const GOLD_NEWS = [
  {
    id: 1,
    title: 'Gold Climbs Near Record as Fed Rate-Cut Bets Strengthen',
    source: 'Bloomberg',
    timestamp: mins(12),
    url: 'https://www.bloomberg.com/markets/commodities',
    summary:
      'Spot gold rose 0.8% as weaker-than-expected US jobs data rekindled expectations for Federal Reserve rate cuts in 2025.',
    category: 'macro',
  },
  {
    id: 2,
    title: 'Central Banks Add Record 1,037 Tonnes to Gold Reserves in 2024',
    source: 'Reuters',
    timestamp: mins(45),
    url: 'https://www.reuters.com/markets/commodities',
    summary:
      'Global central banks purchased a record amount of gold last year, driven by emerging-market nations diversifying away from the dollar.',
    category: 'demand',
  },
  {
    id: 3,
    title: "XAUUSD Technical: Bears Eye $3,280 Support After Monday's Rejection",
    source: 'Investing.com',
    timestamp: mins(90),
    url: 'https://www.investing.com/commodities/gold',
    summary:
      'Gold failed to sustain gains above the $3,340 resistance level. A break of $3,280 could open the door to the $3,245 demand zone.',
    category: 'technical',
  },
  {
    id: 4,
    title: 'Dollar Weakens on Soft CPI Print, Lifting Metal Prices',
    source: 'Bloomberg',
    timestamp: mins(135),
    url: 'https://www.bloomberg.com/markets/currencies',
    summary:
      'The US Dollar Index fell to a two-month low after CPI data surprised to the downside, boosting safe-haven and commodity demand.',
    category: 'macro',
  },
  {
    id: 5,
    title: 'Gold ETF Inflows Surge for Third Consecutive Week',
    source: 'Reuters',
    timestamp: mins(200),
    url: 'https://www.reuters.com/markets',
    summary:
      'SPDR Gold Shares (GLD) reported the largest weekly inflow in eight months, signaling renewed institutional appetite for gold.',
    category: 'flows',
  },
  {
    id: 6,
    title: 'Geopolitical Tensions Keep Gold Bid Above $3,300',
    source: 'Investing.com',
    timestamp: mins(280),
    url: 'https://www.investing.com/analysis/gold',
    summary:
      'Escalating Middle East and Eastern Europe tensions continue to underpin safe-haven demand for gold, analysts say.',
    category: 'geopolitical',
  },
  {
    id: 7,
    title: 'Goldman Sachs Raises Gold Price Target to $3,700 for Year-End',
    source: 'Bloomberg',
    timestamp: mins(380),
    url: 'https://www.bloomberg.com/news/articles',
    summary:
      'Goldman Sachs analysts cited stronger-than-expected central bank purchases and sustained safe-haven demand as key drivers.',
    category: 'analyst',
  },
  {
    id: 8,
    title: 'Silver and Platinum Lag as Gold Continues to Outperform',
    source: 'Reuters',
    timestamp: mins(520),
    url: 'https://www.reuters.com/markets/commodities',
    summary:
      "Despite a broader commodities rally, gold's gains have been the most pronounced among precious metals this quarter.",
    category: 'market',
  },
]

export function getTimeSince(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const SOURCE_COLORS = {
  Bloomberg: '#f59e0b',
  Reuters: '#3b82f6',
  'Investing.com': '#10b981',
}
export function getSourceColor(source) {
  return SOURCE_COLORS[source] || '#6b7280'
}

const CATEGORY_LABELS = {
  macro: 'MACRO',
  demand: 'DEMAND',
  technical: 'TECHNICAL',
  flows: 'FLOWS',
  geopolitical: 'GEO',
  analyst: 'ANALYST',
  market: 'MARKET',
}
export function getCategoryLabel(cat) {
  return CATEGORY_LABELS[cat] || cat.toUpperCase()
}
