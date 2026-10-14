import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Hourglass, Info, Lightbulb, PartyPopper, Telescope, Zap } from 'lucide-react'
import { SECTION_LABELS, TIERS } from '../data/qlensData'
import { useStore } from '../lib/store'

export function weekLabel() {
  const end = new Date()
  end.setDate(end.getDate() - 1)
  const start = new Date(end)
  start.setDate(start.getDate() - 6)
  const f = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${f(start)} to ${f(end)}`.toUpperCase()
}

export function statusNote(card) {
  if (card.status === 'done') return null
  if (card.nudgedAt) return 'Your coach sent a reminder about this one'
  if (card.overdue) return `Waiting since ${card.deliveredDaysAgo} days ago`
  if (card.status === 'later') return 'Saved for later'
  return null
}

export function XpPill({ card, muted }) {
  const coaching = card.tier === TIERS.WEEKLY
  return (
    <span className={`inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-1 rounded-full shrink-0 ${muted ? 'bg-(--color-paper) text-(--color-ink-mute)' : coaching ? 'bg-(--color-amber) text-white' : 'bg-(--color-teal) text-white'}`}>
      <Zap size={12} fill="currentColor" /> {card.xp} XP
    </span>
  )
}

// The readable body of a card: just the content and the actions.
export function CardBody({ card, onLater }) {
  const { dispatch } = useStore()
  const coaching = card.tier === TIERS.WEEKLY
  const done = card.status === 'done'
  const s = card.sections
  const weekly = coaching ? card.weekly || [{ v: String(card.evidence.threadCount), k: 'contacts this week showed the same pattern' }] : null
  return (
    <div>
      {weekly && (
        <div className="mb-4 rounded-2xl border border-(--color-amber-stripe)/60 bg-white px-5 py-4">
          <div className="text-[11px] font-semibold tracking-[0.14em] text-(--color-amber)">THIS WEEK · {weekLabel()}</div>
          <div className={`grid gap-3 mt-3 ${weekly.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            {weekly.map((w) => (
              <div key={w.k} className="rounded-xl bg-(--color-amber-soft)/60 px-3 py-2.5">
                <div className="text-[20px] font-semibold leading-tight">{w.v}</div>
                <div className="text-[12.5px] text-(--color-ink-soft) leading-snug">{w.k}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-(--color-line) px-5 sm:px-7 py-5 divide-y divide-(--color-line)">
        {[['saw', SECTION_LABELS.saw], ['try', SECTION_LABELS.try], ['why', SECTION_LABELS.why]].map(([k, label]) => (
          <div key={k} className="py-3 first:pt-0 last:pb-0">
            <div className={`text-[11px] font-semibold tracking-[0.12em] uppercase ${k === 'try' ? (card.positive ? 'text-(--color-teal-dark)' : coaching ? 'text-(--color-amber)' : 'text-(--color-teal-dark)') : 'text-(--color-ink-mute)'}`}>{label}</div>
            <p className={`text-[15px] leading-[1.65] mt-1 ${k === 'try' ? 'font-medium text-(--color-ink)' : k === 'why' ? 'text-(--color-ink-soft)' : 'text-(--color-ink)'}`}>{s[k]}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col items-center gap-2">
        {done ? (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-(--color-teal-dark)">
            <CheckCircle2 size={17} /> Got it. +{card.xp} XP added.
          </span>
        ) : (
          <>
            <button
              onClick={() => dispatch({ type: 'ack', cardId: card.id })}
              className={`inline-flex items-center gap-2 text-[15px] font-semibold text-white px-8 py-3 rounded-xl shadow-sm hover:brightness-95 ${coaching ? 'bg-(--color-amber)' : 'bg-(--color-teal)'}`}
            >
              Got it · +{card.xp} XP <ArrowRight size={16} />
            </button>
            {card.status !== 'later' && (
              <button onClick={() => { dispatch({ type: 'later', cardId: card.id }); onLater?.() }} className="text-[13px] text-(--color-ink-soft) px-3 py-1 hover:text-(--color-ink) underline-offset-2 hover:underline">
                Not now
              </button>
            )}
            <span className="inline-flex items-center gap-1.5 text-[12.5px] text-(--color-ink-mute) mt-1">
              <Info size={13} /> {coaching ? 'Weekly Q-tips come from your weekly review.' : 'New Q-tips arrive tomorrow.'}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

// Collapsible row, used for "Done today", "Saved for later" and search results.
export default function QByteCard({ card, open, onToggle }) {
  const coaching = card.tier === TIERS.WEEKLY
  const done = card.status === 'done'
  const note = statusNote(card)
  return (
    <div
      id={`card-${card.id}`}
      className="rounded-xl overflow-hidden bg-white border border-(--color-line)"
      style={{ borderLeft: `3px solid ${done ? '#d7dedb' : coaching ? 'var(--color-amber-stripe)' : 'var(--color-teal-stripe)'}` }}
    >
      <button onClick={onToggle} className="w-full text-left flex items-center gap-3 px-4 py-3">
        {done ? <CheckCircle2 size={17} className="text-(--color-teal) shrink-0" /> : card.positive ? <PartyPopper size={17} className="text-(--color-teal-dark) shrink-0" /> : coaching ? <Telescope size={17} className="text-(--color-amber) shrink-0" /> : <Lightbulb size={17} className="text-(--color-teal-dark) shrink-0" />}
        <span className="flex-1 min-w-0">
          <span className={`block text-[14.5px] font-medium truncate ${done ? 'text-(--color-ink-soft)' : ''}`}>{card.title}</span>
          {note && <span className="block text-[12px] text-(--color-ink-mute)">{note}</span>}
        </span>
        <XpPill card={card} muted={done} />
        <span className="hidden sm:inline-flex items-center gap-1 text-[12px] text-(--color-ink-soft) shrink-0"><Hourglass size={12} /> {card.readSecs} sec</span>
        {open ? <ChevronUp size={17} className="text-(--color-ink-mute)" /> : <ChevronDown size={17} className="text-(--color-ink-mute)" />}
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-5 pt-1 bg-(--color-mint) border-t border-(--color-line) anim-rise">
          <div className="pt-4"><CardBody card={card} onLater={onToggle} /></div>
        </div>
      )}
    </div>
  )
}
