import { useState } from 'react'
import { Newspaper, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react'
import { GOLD_NEWS, getTimeSince, getSourceColor, getCategoryLabel } from '../../utils/newsData'

export default function NewsPanel() {
  const [expanded, setExpanded] = useState(true)
  const [filter, setFilter] = useState('all')

  const categories = ['all', ...new Set(GOLD_NEWS.map((n) => n.category))]
  const filtered = filter === 'all' ? GOLD_NEWS : GOLD_NEWS.filter((n) => n.category === filter)

  return (
    <div className="panel flex flex-col overflow-hidden">
      <button
        className="panel-header w-full text-left shrink-0"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="panel-title">Market News</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-gray-600 bg-surface-3 px-1.5 py-0.5 rounded">
            {filtered.length}
          </span>
          {expanded ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
        </div>
      </button>

      {expanded && (
        <>
          {/* Category filter chips */}
          <div className="flex gap-1 flex-wrap px-2 py-1.5 border-b border-surface-4 shrink-0">
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={[
                  'px-2 py-0.5 rounded text-[9px] uppercase tracking-wide transition-all',
                  filter === cat
                    ? 'bg-gold-500 text-black font-bold'
                    : 'bg-surface-3 text-gray-500 hover:text-white',
                ].join(' ')}
              >
                {cat === 'all' ? 'All' : getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          {/* News list */}
          <div className="flex-1 overflow-y-auto divide-y divide-surface-3">
            {filtered.map((item) => (
              <NewsItem key={item.id} item={item} />
            ))}
          </div>

          <div className="px-3 py-1.5 border-t border-surface-4 shrink-0">
            <p className="text-[9px] text-gray-700">
              Demo data only — integrate NewsAPI / RSS for live news
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function NewsItem({ item }) {
  const sourceColor = getSourceColor(item.source)
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="block px-3 py-2.5 hover:bg-surface-2 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{
              color: sourceColor,
              backgroundColor: sourceColor + '22',
              border: `1px solid ${sourceColor}44`,
            }}
          >
            {item.source}
          </span>
          <CategoryBadge cat={item.category} />
        </div>
        <span className="text-[9px] text-gray-600 shrink-0">{getTimeSince(item.timestamp)}</span>
      </div>

      <p className="text-xs text-gray-300 leading-snug group-hover:text-white transition-colors mb-1 pr-4">
        {item.title}
      </p>

      {hovered && (
        <p className="text-[10px] text-gray-500 leading-snug mt-1 line-clamp-2">
          {item.summary}
        </p>
      )}

      <div className="flex items-center gap-1 mt-1 text-gray-700 group-hover:text-gray-500">
        <ExternalLink size={9} />
        <span className="text-[9px]">Read article</span>
      </div>
    </a>
  )
}

const CAT_COLORS = {
  macro: '#f59e0b',
  technical: '#3b82f6',
  demand: '#10b981',
  flows: '#8b5cf6',
  geopolitical: '#ef4444',
  analyst: '#06b6d4',
  market: '#6b7280',
}

function CategoryBadge({ cat }) {
  const color = CAT_COLORS[cat] || '#6b7280'
  return (
    <span
      className="text-[8px] uppercase tracking-wide px-1 py-0.5 rounded"
      style={{ color, backgroundColor: color + '22' }}
    >
      {getCategoryLabel(cat)}
    </span>
  )
}
