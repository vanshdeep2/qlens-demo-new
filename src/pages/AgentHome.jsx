import { useState } from 'react'
import { BookOpen, X, CheckCircle2, ChevronDown, ChevronUp, Flame, Hourglass } from 'lucide-react'
import { agents, TIERS, XP_RULES } from '../data/qlensData'
import { cardsFor, streakOf, useStore } from '../lib/store'
import QByteCard, { CardBody, statusNote, XpPill } from '../components/QByteCard'
import { KpiTiles } from '../components/Kpi'
import { Celebrations, NextBadgeLine, ProgressChips, ProgressDrawer, SessionBanner } from '../components/Gamification'

function readyLabel(list) {
  const c = list.filter((x) => x.tier === TIERS.WEEKLY).length
  const q = list.length - c
  const parts = []
  if (q) parts.push(`${q} new Q-tip${q === 1 ? '' : 's'}`)
  if (c) parts.push(`${c} weekly Q-tip${c === 1 ? '' : 's'}`)
  return parts.join(' and ')
}

function LoginPopup({ agentId, pending, first, onStart }) {
  const count = pending.length
  const { state, dispatch } = useStore()
  if (state.popupSeen[agentId] || count === 0 || !first) return null
  const close = () => dispatch({ type: 'popupSeen', agentId })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px]" onMouseDown={close}>
      <div className="anim-pop relative bg-white rounded-3xl shadow-2xl w-[384px] max-w-[calc(100%-32px)] px-7 pt-7 pb-5 text-center" onMouseDown={(e) => e.stopPropagation()}>
        <button aria-label="Close" onClick={close} className="absolute right-4 top-4 text-(--color-ink-mute) hover:text-(--color-ink)"><X size={16} /></button>
        <span className="relative mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-md" style={{ background: 'linear-gradient(160deg, var(--color-orange-2), var(--color-orange))' }}>
          <BookOpen size={28} />
        </span>
        <div className="text-[18px] font-semibold mt-4">{readyLabel(pending)} ready</div>
        <div className="text-[14px] text-(--color-ink-soft) mt-2 leading-relaxed">Short tips, about 20 seconds each. First up: “{first.title}”</div>
        <button onClick={() => { close(); onStart() }} className="mt-6 w-full bg-(--color-teal) text-white font-semibold text-sm rounded-xl py-3 hover:brightness-95">Start now</button>
        <button onClick={close} className="mt-3 text-sm text-(--color-ink-soft) hover:text-(--color-ink)">Maybe later</button>
      </div>
    </div>
  )
}

function Hero({ card, position, rest, onPick }) {
  const coaching = card.tier === TIERS.WEEKLY
  const note = statusNote(card)
  return (
    <section id="up-next" className="scroll-mt-4">
      <div
        className={`rounded-2xl border ${card.positive ? 'border-(--color-teal)/40 bg-(--color-mint-2)' : 'border-(--color-line)'} ${coaching ? 'bg-[#fbf8f1]' : card.positive ? '' : 'bg-(--color-mint)'} anim-rise`}
        style={{ borderLeft: `4px solid ${coaching ? 'var(--color-amber-stripe)' : 'var(--color-teal-stripe)'}` }}
        key={card.id}
      >
        <div className="px-5 sm:px-7 pt-5 pb-4 border-b border-(--color-line)">
          <div className={`text-[11px] font-semibold tracking-[0.14em] ${coaching ? 'text-(--color-amber)' : 'text-(--color-teal-dark)'}`}>{position}</div>
          <div className="flex items-start gap-3 mt-1.5">
            <h2 className="flex-1 text-[22px] font-semibold tracking-tight leading-snug" style={{ textWrap: 'balance' }}>{card.title}</h2>
            <XpPill card={card} />
            <span className="hidden sm:inline-flex items-center gap-1 text-[12px] font-medium px-2.5 py-1 rounded-full border border-(--color-line) bg-white shrink-0"><Hourglass size={12} /> {card.readSecs} sec</span>
          </div>
          {note && <div className="text-[13px] text-(--color-coral) mt-1">{note}</div>}
        </div>
        <div className="px-5 sm:px-7 py-5">
          <CardBody card={card} />
        </div>
      </div>
      {rest.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3 text-[13px]">
          <span className="text-(--color-ink-mute)">Then</span>
          {rest.map((c) => (
            <button key={c.id} onClick={() => onPick(c.id)} className="px-3 py-1.5 rounded-full bg-white border border-(--color-line) hover:border-(--color-teal) truncate max-w-[280px]">
              {c.title}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function AllDone({ agentId, earnedToday, count }) {
  const { state } = useStore()
  const fresh = state.progress[agentId].growth.find((g) => g.fresh && g.status === 'pending')
  const streak = streakOf(state, agentId)
  return (
    <section className="rounded-2xl border border-(--color-line) bg-white px-6 sm:px-8 py-8 text-center anim-rise">
      <span className="mx-auto w-14 h-14 rounded-full bg-(--color-teal-soft) text-(--color-teal-dark) flex items-center justify-center"><CheckCircle2 size={28} /></span>
      <h2 className="text-[22px] font-semibold mt-4">You're done for today</h2>
      <p className="text-[14.5px] text-(--color-ink-soft) mt-1">
        {count} Q-tip{count === 1 ? '' : 's'} read · <b className="text-(--color-ink)">+{earnedToday} XP</b> today · <Flame size={14} className="inline -mt-0.5 text-(--color-orange)" fill="currentColor" /> {streak}-day streak kept
      </p>
      {fresh && (
        <div className="max-w-md mx-auto mt-6 rounded-xl border border-(--color-teal)/30 bg-(--color-mint-2) px-5 py-4 text-left">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-(--color-teal-dark)"><Hourglass size={15} /> +{fresh.amount} XP pending</div>
          <div className="text-[14px] mt-1">You applied last week's tip on <b>{fresh.topic.toLowerCase()}</b>. The Implemented Bonus is confirmed if the topic stays clear for {fresh.confirmsInDays} days.</div>
        </div>
      )}
      <p className="text-[13px] text-(--color-ink-mute) mt-6">New Q-tips arrive tomorrow.</p>
    </section>
  )
}

export default function AgentHome() {
  const { state } = useStore()
  const agentId = state.agentId
  const agent = agents[agentId]
  const [focusId, setFocusId] = useState(null)
  const [openRow, setOpenRow] = useState(null)
  const [showDone, setShowDone] = useState(false)
  const [drawer, setDrawer] = useState(false)

  const cards = cardsFor(state, agentId).filter((c) => !c.heldForReview && !c.withdrawn)
  const todays = cards.filter((c) => c.deliveredDaysAgo === 0)
  const doneToday = todays.filter((c) => c.status === 'done')
  const order = (c) => (c.status === 'later' ? 2 : c.overdue ? 0 : 1)
  const queue = cards.filter((c) => c.status !== 'done').sort((a, b) => order(a) - order(b))
  const focus = queue.find((c) => c.id === focusId) || queue[0]
  const rest = queue.filter((c) => c.id !== focus?.id)
  const done = cards.filter((c) => c.status === 'done')
  const earnedToday = done.reduce((n, c) => n + c.xp, 0) + (state.progress[agentId].goalAwarded ? XP_RULES.dailyGoal : 0)


  const position = focus
    ? focus.positive
      ? 'UP NEXT · YOU DID IT'
      : focus.tier === TIERS.WEEKLY
      ? 'UP NEXT · WEEKLY Q-TIP · FROM YOUR WEEKLY REVIEW'
      : focus.deliveredDaysAgo > 0
        ? 'UP NEXT · FROM EARLIER'
        : `UP NEXT · ${doneToday.length + 1} OF ${todays.length} TODAY`
    : ''
  const mins = Math.max(1, Math.round(queue.reduce((n, c) => n + c.readSecs, 0) / 60))

  const firstName = agent.name.split(' ')[0]
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="px-4 md:px-8 py-7 max-w-[980px] mx-auto space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">{greet}, {firstName}</h1>
          <p className="text-[14px] text-(--color-ink-soft) mt-0.5">
            {queue.length ? `${readyLabel(queue)} waiting, about ${mins} minute${mins === 1 ? '' : 's'} in total.` : 'All caught up.'}
          </p>
        </div>
        <ProgressChips agentId={agentId} doneToday={doneToday.length} total={todays.length} onOpen={() => setDrawer(true)} />
      </header>

      <SessionBanner agentId={agentId} />

      <KpiTiles kpis={agent.kpis} />

      {focus ? (
        <Hero card={focus} position={position} rest={rest} onPick={(id) => { setFocusId(id); document.getElementById('up-next')?.scrollIntoView({ behavior: 'smooth' }) }} />
      ) : (
        <AllDone agentId={agentId} earnedToday={earnedToday} count={done.length} />
      )}

      <NextBadgeLine agentId={agentId} onOpen={() => setDrawer(true)} />

      {done.length > 0 && (
        <section>
          <button onClick={() => setShowDone((s) => !s)} className="flex items-center gap-1.5 text-[14px] font-semibold">
            {showDone ? <ChevronUp size={16} /> : <ChevronDown size={16} />} Read today ({done.length})
          </button>
          {showDone && (
            <div className="space-y-2 mt-3">
              {done.map((c) => <QByteCard key={c.id} card={c} open={openRow === c.id} onToggle={() => setOpenRow((o) => (o === c.id ? null : c.id))} />)}
            </div>
          )}
        </section>
      )}

      <ProgressDrawer agentId={agentId} open={drawer} onClose={() => setDrawer(false)} />
      <LoginPopup agentId={agentId} pending={todays.filter((c) => c.status !== 'done')} first={focus} onStart={() => document.getElementById('up-next')?.scrollIntoView({ behavior: 'smooth' })} />
      <Celebrations agentId={agentId} />
    </div>
  )
}
