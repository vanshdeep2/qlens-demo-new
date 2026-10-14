import { useState } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Illustrative, Modal } from './ui'

const RANGES = [
  { label: 'Last 7 days', short: '7D', n: 7 },
  { label: 'Last 30 days', short: '30D', n: 30 },
]

// The last point in every trend is yesterday.
function dateFor(i, n) {
  const d = new Date()
  d.setDate(d.getDate() - (n - i))
  return d
}
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const dShort = (d) => `${d.getDate()} ${MON[d.getMonth()]}`

function decimalsFor(unit, span) {
  if (unit === '/5') return 1
  if (unit === '%') return span < 6 ? 1 : 0
  return 0
}

export function LineChart({ points, unit, target, color = 'var(--color-teal)', height = 110, w = 300 }) {
  const [hover, setHover] = useState(null)
  const h = height
  const padL = w > 400 ? 50 : 40
  const padR = 18
  const fs = w > 400 ? 12 : 9
  const padT = 10
  const padB = w > 400 ? 24 : 28
  const n = points.length
  const pMax = Math.max(...points)
  const pMin = Math.min(...points)
  const spread = pMax - pMin || Math.abs(pMax) * 0.02 || 1
  const max = pMax + spread * 0.2
  const min = pMin - spread * 0.2
  const range = max - min
  const dec = decimalsFor(unit, max - min)
  const ticks = [min, (min + max) / 2, max].map((v) => +v.toFixed(dec))
  const showTarget = target != null && target <= max && target >= min
  const X = (i) => padL + (i / Math.max(n - 1, 1)) * (w - padL - padR)
  const Y = (v) => padT + (1 - (v - min) / range) * (h - padT - padB)
  const path = points.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')
  const area = `${path} L${X(n - 1)},${h - padB} L${X(0)},${h - padB} Z`
  const xIdx = n <= 7 ? points.map((_, i) => i) : [0, 7, 14, 21, n - 1]
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * w
    const i = Math.round(((x - padL) / (w - padL - padR)) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, i)))
  }
  const hi = hover ?? n - 1
  const gid = `kpiFill-${Math.round(w)}-${h}`
  return (
    <div className="relative">
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible block" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--color-teal)" stopOpacity="0.18" />
            <stop offset="1" stopColor="var(--color-teal)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={w - padR} y1={Y(t)} y2={Y(t)} stroke="var(--color-line)" strokeWidth="1" />
            <text x={padL - 6} y={Y(t) + (i === 0 ? -6 : 3)} textAnchor="end" fontSize={fs} fill="var(--color-ink-mute)">{t}{unit === '/5' ? '' : unit}</text>
          </g>
        ))}
        {showTarget && (
          <>
            <line x1={padL} x2={w - padR} y1={Y(target)} y2={Y(target)} stroke="var(--color-ink-soft)" strokeDasharray="3 3" strokeWidth="1" />
            <text x={w - padR} y={Y(target) - 3} textAnchor="end" fontSize={fs - 0.5} fill="var(--color-ink-soft)">Target {target}{unit}</text>
          </>
        )}
        <path d={area} fill={`url(#${gid})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {n <= 7 && points.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r="2.5" fill={color} />)}
        <line x1={X(hi)} x2={X(hi)} y1={padT} y2={h - padB} stroke="var(--color-ink-mute)" strokeWidth="1" opacity={hover != null ? 0.5 : 0} />
        <circle cx={X(hi)} cy={Y(points[hi])} r="4" fill="white" stroke={color} strokeWidth="2" />
        {xIdx.map((i) => (
          <text key={i} x={X(i)} y={h - 6} textAnchor="middle" fontSize={fs - 0.5} fill="var(--color-ink-mute)">{dShort(dateFor(i, n))}</text>
        ))}
      </svg>
      {target != null && !showTarget && <div className="text-[11px] text-(--color-ink-mute) mt-1">Target {target}{unit} is {target > max ? 'above' : 'below'} this range.</div>}
      {hover != null && (
        <div className="absolute top-0 pointer-events-none text-[11px] bg-(--color-ink) text-white rounded-md px-2 py-1 whitespace-nowrap"
          style={{ left: `${(X(hi) / w) * 100}%`, transform: `translate(${hi > n / 2 ? '-100%' : '0'}, -110%)` }}>
          <b>{points[hi]}{unit}</b> · {dShort(dateFor(hi, n))}
        </div>
      )}
    </div>
  )
}

export function onTrack(k) {
  return k.direction === 'higher_better' ? k.value >= k.target : k.value <= k.target
}

export function KpiCard({ kpi, compact = false }) {
  const [range, setRange] = useState(0)
  const n = RANGES[range].n
  const pts = kpi.trend.slice(-n)
  const ok = onTrack(kpi)
  const delta = +(pts[pts.length - 1] - pts[0]).toFixed(kpi.unit === '/5' ? 1 : kpi.unit === '%' ? 1 : 0)
  const good = kpi.direction === 'higher_better' ? delta >= 0 : delta <= 0
  return (
    <div className="bg-white border border-(--color-line) rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[12px] font-medium text-(--color-ink-soft)">{kpi.label}</div>
        <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${ok ? 'bg-(--color-teal-soft) text-(--color-teal-dark)' : 'bg-(--color-coral-soft) text-(--color-coral)'}`}>
          {ok ? 'On track' : 'Needs focus'}
        </span>
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <div className="text-[26px] font-semibold tracking-tight">{kpi.value}{kpi.unit}</div>
        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${good ? 'text-(--color-teal-dark)' : 'text-(--color-coral)'}`}>
          {delta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {delta > 0 ? '+' : ''}{delta}{kpi.unit}
        </span>
      </div>
      <div className="text-[11px] text-(--color-ink-mute)">
        Target {kpi.direction === 'higher_better' ? '≥' : '≤'} {kpi.target}{kpi.unit} · change over {RANGES[range].label.toLowerCase()}
      </div>
      <div className="mt-5">
        <LineChart points={pts} unit={kpi.unit} target={kpi.target} height={compact ? 100 : 120} />
      </div>
      <div className="flex gap-1 mt-3">
        {RANGES.map((r, i) => (
          <button
            key={r.label}
            onClick={() => setRange(i)}
            className={`text-[11px] px-2 py-1 rounded-md font-medium ${range === i ? 'bg-(--color-teal) text-white' : 'bg-(--color-paper) text-(--color-ink-soft) hover:bg-(--color-teal-soft)'}`}
          >
            {compact ? r.short : r.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function KpiRow({ kpis, compact }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="text-[15px] font-semibold">Your performance</div>
        <Illustrative>Illustrative KPIs</Illustrative>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values(kpis).map((k) => <KpiCard key={k.key} kpi={k} compact={compact} />)}
      </div>
    </div>
  )
}

export function KpiTiles({ kpis, title = 'Your numbers', stack = false }) {
  const [open, setOpen] = useState(null)
  const list = Object.values(kpis)
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="text-[15px] font-semibold">{title}</div>
        <span className="text-[12px] text-(--color-ink-mute)">Yesterday · email metrics · tap for the trend</span>
        <Illustrative />
      </div>
      <div className={`grid grid-cols-1 ${stack ? '' : 'sm:grid-cols-3'} gap-3`}>
        {list.map((k) => {
          const ok = onTrack(k)
          const pts = k.trend.slice(-7)
          const delta = +(pts[pts.length - 1] - pts[0]).toFixed(k.unit === 's' ? 0 : 1)
          const good = k.direction === 'higher_better' ? delta >= 0 : delta <= 0
          return (
            <button key={k.key} onClick={() => setOpen(k)} className="text-left bg-white border border-(--color-line) rounded-xl px-4 py-3 hover:border-(--color-teal) transition flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full shrink-0 ${ok ? 'bg-(--color-teal)' : 'bg-(--color-coral)'}`} />
              <span className="flex-1 min-w-0">
                <span className="block text-[12px] text-(--color-ink-soft) truncate">{k.label}</span>
                <span className="block text-[20px] font-semibold tracking-tight">{k.value}{k.unit}</span>
              </span>
              <span className={`inline-flex items-center gap-0.5 text-[12px] font-semibold ${good ? 'text-(--color-teal-dark)' : 'text-(--color-coral)'}`}>
                {delta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{delta > 0 ? '+' : ''}{delta}
              </span>
            </button>
          )
        })}
      </div>
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.label} subtitle={open ? `${onTrack(open) ? 'On track' : 'Below target'} · target ${open.direction === 'higher_better' ? '≥' : '≤'} ${open.target}${open.unit}` : ''}>
        {open && <KpiCard kpi={open} />}
      </Modal>
    </div>
  )
}
