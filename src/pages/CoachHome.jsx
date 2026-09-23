import { useState } from 'react'
import { AlertTriangle, ArrowDown, ArrowUp, BellRing, CalendarPlus, Check, ChevronDown, ChevronUp, Flame, ShieldAlert, Sparkles, OctagonAlert } from 'lucide-react'
import { agents, attentionItems, COACH, criticalFailures, dayOffset } from '../data/qlensData'
import { cardsFor, streakOf, useStore } from '../lib/store'
import { AgentModal, CloseOutModal, CloseOutView, CriticalFailureModal, EvidenceDrawer, PrepModal, ScheduleModal } from '../components/CoachModals'
import { onTrack } from '../components/Kpi'
import { Avatar, Btn, fmtDate, fmtTime, timeAgo } from '../components/ui'

const first = (id) => agents[id].name.split(' ')[0]

function whenLabel(date) {
  if (date === dayOffset(0)) return 'Today'
  if (date === dayOffset(1)) return 'Tomorrow'
  return fmtDate(date)
}

function Section({ title, count, right, children, tone }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[16px] font-semibold flex items-center gap-2">
          {title}
          {count != null && <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${tone === 'coral' ? 'bg-(--color-coral-soft) text-(--color-coral)' : 'bg-(--color-paper) text-(--color-ink-soft) border border-(--color-line)'}`}>{count}</span>}
        </h2>
        {right}
      </div>
      {children}
    </section>
  )
}

function Row({ children, className = '' }) {
  return <div className={`flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-2 px-5 py-3 ${className}`}>{children}</div>
}

function GroupHead({ icon: Icon, label, count, action, urgent }) {
  return (
    <div className="flex items-center gap-2 px-5 py-2.5 bg-(--color-paper)">
      <Icon size={14} className={urgent ? 'text-(--color-coral)' : 'text-(--color-teal-dark)'} />
      <span className="text-[12.5px] font-semibold">{label}</span>
      <span className="text-[12px] text-(--color-ink-mute)">{count}</span>
      <span className="ml-auto">{action}</span>
    </div>
  )
}

function KpiCell({ k }) {
  const ok = onTrack(k)
  const wk = k.trend.slice(-7)
  const d = wk[wk.length - 1] - wk[0]
  const good = k.direction === 'higher_better' ? d >= 0 : d <= 0
  return (
    <td className="px-3 py-3 whitespace-nowrap">
      <span className={`font-semibold ${ok ? 'text-(--color-ink)' : 'text-(--color-coral)'}`}>{k.value}{k.unit}</span>
      <span className={`ml-1 inline-flex ${good ? 'text-(--color-teal)' : 'text-(--color-coral)'}`}>{d >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}</span>
    </td>
  )
}

export default function CoachHome({ openAgent, setOpenAgent }) {
  const { state, dispatch } = useStore()
  const [cardId, setCardId] = useState(null)
  const [schedule, setSchedule] = useState(null)
  const [prep, setPrep] = useState(null)
  const [closeOut, setCloseOut] = useState(null)
  const [viewClose, setViewClose] = useState(null)
  const [cf, setCf] = useState(null)
  const [showDone, setShowDone] = useState(false)
  const [showPast, setShowPast] = useState(false)
  const [sort, setSort] = useState({ key: 'attention', dir: 1 })

  const rows = Object.values(agents).map((a) => ({ agent: a, cards: cardsFor(state, a.id) }))
  const all = rows.flatMap((r) => r.cards)
  const today = all.filter((c) => c.deliveredDaysAgo === 0 && !c.heldForReview)
  const readToday = today.filter((c) => c.status === 'done').length
  const overdueAll = all.filter((c) => c.overdue)
  const inQueue = (id) => state.queue.find((q) => q.agentId === id && q.status !== 'closed')
  const queueLabel = (id) => {
    const q = inQueue(id)
    if (!q) return null
    return q.status === 'scheduled' ? `1:1 booked · ${whenLabel(q.date)} ${fmtTime(q.time)}` : 'In queue, not scheduled yet'
  }

  // ---- Critical failures
  const cfs = criticalFailures

  // ---- Upcoming 1:1s
  const upcoming = state.queue.filter((q) => q.status === 'scheduled').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const past = state.queue.filter((q) => q.status === 'closed')

  // ---- To-do groups
  const toSchedule = state.queue.filter((x) => x.status === 'awaiting').sort((a, b) => b.flaggedDaysAgo - a.flaggedDaysAgo)
  const toNudge = rows.map(({ agent, cards }) => ({ agent, od: cards.filter((c) => c.overdue && !c.nudgedAt) })).filter((x) => x.od.length)
  const flags = attentionItems.filter((it) => !state.queuedFromAttention[it.id] && !state.queue.some((q) => q.agentId === it.agentId))
  const held = all.filter((x) => x.heldForReview && !state.reviewed[x.id])
  const todoCount = toSchedule.length + toNudge.length + flags.length + held.length

  // ---- Team table
  const severity = ({ agent, cards }) => {
    if (cfs.some((x) => x.agentId === agent.id)) return 0
    if (attentionItems.some((x) => x.agentId === agent.id)) return 1
    if (cards.some((c) => c.overdue)) return 2
    return 3
  }
  const statusFor = ({ agent, cards }) => {
    if (cfs.some((x) => x.agentId === agent.id)) return { text: 'Critical failure', tone: 'coral' }
    const flag = attentionItems.find((x) => x.agentId === agent.id)
    if (flag) return { text: flag.type, tone: 'amber' }
    const od = cards.filter((c) => c.overdue)
    if (od.length) return { text: od.some((c) => c.nudgedAt) ? 'Overdue · nudged' : `${od.length} overdue`, tone: 'coral' }
    return { text: 'On track', tone: 'teal' }
  }
  const readOf = ({ cards }) => {
    const t = cards.filter((c) => c.deliveredDaysAgo === 0 && !c.heldForReview)
    return { read: t.filter((c) => c.status === 'done').length, total: t.length }
  }
  const sortVal = (r) => {
    switch (sort.key) {
      case 'name': return r.agent.name
      case 'read': { const x = readOf(r); return x.total ? x.read / x.total : 0 }
      case 'aht': return -r.agent.kpis.aht.value
      case 'fcr': return r.agent.kpis.fcr.value
      case 'ab': return r.agent.kpis.agentBehaviour.value
      case 'streak': return streakOf(state, r.agent.id)
      default: return -severity(r)
    }
  }
  const team = [...rows].sort((a, b) => {
    const x = sortVal(a), y = sortVal(b)
    const c = typeof x === 'string' ? x.localeCompare(y) : y - x
    return c * sort.dir
  })
  const Th = ({ k, children, className = '' }) => (
    <th className={`px-3 py-2.5 font-semibold ${className}`}>
      <button onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? -s.dir : 1 }))} className="inline-flex items-center gap-1 hover:text-(--color-ink)">
        {children} {sort.key === k && (sort.dir === 1 ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
      </button>
    </th>
  )

  return (
    <div className="px-4 md:px-8 py-7 max-w-[1080px] mx-auto space-y-8 pb-16">
      <header>
        <h1 className="text-[26px] font-semibold tracking-tight">Team home</h1>
        <p className="text-[14px] text-(--color-ink-soft) mt-0.5">
          {COACH.name} · {rows.length} agents · team read <b className="text-(--color-ink)">{readToday} of {today.length}</b> cards today · {overdueAll.length} overdue
        </p>
      </header>

      {/* 1. Critical failures */}
      <Section title="Critical failures" count={cfs.length} tone="coral">
        <div className="bg-white border border-(--color-coral)/30 rounded-2xl divide-y divide-(--color-line) overflow-hidden">
          {cfs.map((it) => {
            const ql = queueLabel(it.agentId)
            return (
              <Row key={it.id}>
                <span className="w-8 h-8 rounded-full bg-(--color-coral-soft) text-(--color-coral) flex items-center justify-center shrink-0"><OctagonAlert size={16} /></span>
                <div className="flex-1 min-w-[200px]">
                  <div className="text-[14.5px] font-semibold">{agents[it.agentId].name}</div>
                  <div className="text-[13px] text-(--color-ink-soft)">{it.what} · {it.daysAgo === 1 ? 'yesterday' : `${it.daysAgo} days ago`}</div>
                </div>
                <div className="flex items-center gap-1.5 ml-11 sm:ml-0 shrink-0">
                  <Btn size="sm" variant="outline" onClick={() => setCf(it)}>View details</Btn>
                  {ql ? <span className="text-[12.5px] text-(--color-teal-dark) font-medium flex items-center gap-1"><Check size={13} /> {ql}</span> : <Btn size="sm" onClick={() => dispatch({ type: 'queueFromAttention', item: it })}>Add to 1:1 queue</Btn>}
                </div>
              </Row>
            )
          })}
        </div>
      </Section>

      {/* 2. Upcoming 1:1s */}
      <Section title="Upcoming 1:1s" count={upcoming.length}
        right={past.length > 0 && (
          <button onClick={() => setShowPast((s) => !s)} className="text-[13px] text-(--color-ink-soft) hover:text-(--color-ink) flex items-center gap-1">
            {past.length} past {showPast ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}>
        <div className="bg-white border border-(--color-line) rounded-2xl divide-y divide-(--color-line) overflow-hidden">
          {upcoming.length === 0 && <div className="px-5 py-6 text-[13.5px] text-(--color-ink-soft) text-center">No sessions booked.</div>}
          {upcoming.map((q) => {
            const soon = q.date <= dayOffset(1)
            return (
              <Row key={q.id}>
                <div className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center leading-none shrink-0 ${soon ? 'border-(--color-teal) bg-(--color-mint-2)' : 'border-(--color-line)'}`}>
                  <span className="text-[9.5px] font-semibold text-(--color-coral) uppercase">{fmtDate(q.date, { month: 'short' })}</span>
                  <span className="text-lg font-bold">{fmtDate(q.date, { day: 'numeric' })}</span>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="text-[14.5px] font-semibold flex items-center gap-2">
                    {agents[q.agentId].name}
                    {soon && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-(--color-teal) text-white">{whenLabel(q.date)} · prep now</span>}
                  </div>
                  <div className="text-[13px] text-(--color-ink-soft)">{q.topic} · {whenLabel(q.date)}, {fmtTime(q.time)}</div>
                </div>
                <div className="flex gap-1.5 ml-[60px] sm:ml-0 shrink-0">
                  <Btn size="sm" variant="ghost" onClick={() => setSchedule(q)}>Reschedule</Btn>
                  <Btn size="sm" variant={soon ? 'primary' : 'outline'} onClick={() => setPrep(q)}>Prep</Btn>
                  <Btn size="sm" variant="outline" onClick={() => setCloseOut(q)}>Mark complete</Btn>
                </div>
              </Row>
            )
          })}
          {showPast && past.map((q) => (
            <Row key={q.id} className="bg-(--color-paper)">
              <Check size={16} className="text-(--color-teal) shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium">{agents[q.agentId].name} · {q.topic}</div>
                <div className="text-[12px] text-(--color-ink-soft)">{q.closeOut?.outcome}</div>
              </div>
              <Btn size="sm" variant="outline" onClick={() => setViewClose(q)}>View close-out</Btn>
            </Row>
          ))}
        </div>
      </Section>

      {/* 3. To-do, grouped */}
      <Section title="To do" count={todoCount}
        right={state.coachDone.length > 0 && (
          <button onClick={() => setShowDone((s) => !s)} className="text-[13px] text-(--color-ink-soft) hover:text-(--color-ink) flex items-center gap-1">
            <Check size={14} className="text-(--color-teal)" /> {state.coachDone.length} done {showDone ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}>
        <div className="bg-white border border-(--color-line) rounded-2xl divide-y divide-(--color-line) overflow-hidden">
          {todoCount === 0 && (
            <div className="px-5 py-8 text-center">
              <Sparkles size={22} className="mx-auto text-(--color-teal)" />
              <div className="text-[15px] font-semibold mt-2">You're clear for today</div>
            </div>
          )}

          {toSchedule.length > 0 && (
            <>
              <GroupHead icon={CalendarPlus} label="Schedule 1:1s" count={toSchedule.length} urgent={toSchedule.some((q) => q.flaggedDaysAgo >= 3)} />
              {toSchedule.map((q) => {
                const late = q.flaggedDaysAgo >= 3
                return (
                  <Row key={q.id}>
                    <div className="flex-1 min-w-[200px]">
                      <div className="text-[14px] font-semibold">{agents[q.agentId].name}</div>
                      <div className={`text-[12.5px] ${late ? 'text-(--color-coral)' : 'text-(--color-ink-soft)'}`}>{q.topic} · {q.flaggedDaysAgo === 0 ? 'added today' : `waiting ${q.flaggedDaysAgo}d`}{late ? ', reported to QIQ as late' : ''}</div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Btn size="sm" variant="ghost" onClick={() => setPrep(q)}>Prep</Btn>
                      <Btn size="sm" onClick={() => setSchedule(q)}>Schedule</Btn>
                    </div>
                  </Row>
                )
              })}
            </>
          )}

          {toNudge.length > 0 && (
            <>
              <GroupHead icon={BellRing} label="Nudge overdue agents" count={toNudge.length} urgent
                action={toNudge.length > 1 && <Btn size="sm" onClick={() => toNudge.forEach((x) => x.od.forEach((c) => dispatch({ type: 'nudge', cardId: c.id })))}>Nudge all</Btn>} />
              {toNudge.map(({ agent, od }) => (
                <Row key={agent.id}>
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-[14px] font-semibold">{agent.name}</div>
                    <div className="text-[12.5px] text-(--color-ink-soft) truncate">“{od[0].title}” unread for {od[0].deliveredDaysAgo} days</div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Btn size="sm" variant="ghost" onClick={() => setCardId(od[0].id)}>View card</Btn>
                    <Btn size="sm" variant="outline" onClick={() => od.forEach((c) => dispatch({ type: 'nudge', cardId: c.id }))}>Nudge</Btn>
                  </div>
                </Row>
              ))}
            </>
          )}

          {flags.length > 0 && (
            <>
              <GroupHead icon={AlertTriangle} label="Review QIQ flags" count={flags.length} />
              {flags.map((it) => (
                <Row key={it.id}>
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-[14px] font-semibold">{agents[it.agentId].name} <span className="font-normal text-(--color-ink-soft)">· {it.type}</span></div>
                    <div className="text-[12.5px] text-(--color-ink-soft)">{it.text}</div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Btn size="sm" variant="ghost" onClick={() => setOpenAgent(it.agentId)}>View</Btn>
                    <Btn size="sm" onClick={() => dispatch({ type: 'queueFromAttention', item: it })}>Add to 1:1 queue</Btn>
                  </div>
                </Row>
              ))}
            </>
          )}

          {held.length > 0 && (
            <>
              <GroupHead icon={ShieldAlert} label="Cards held back by the PII check" count={held.length} />
              {held.map((c) => (
                <Row key={c.id}>
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-[14px] font-semibold">{agents[c.agentId].name}</div>
                    <div className="text-[12.5px] text-(--color-ink-soft)">Card on {c.title.toLowerCase()} was never sent</div>
                  </div>
                  <Btn size="sm" variant="outline" onClick={() => { setCardId(c.id); dispatch({ type: 'reviewed', id: c.id, text: `Reviewed ${first(c.agentId)}'s held card` }) }}>Review</Btn>
                </Row>
              ))}
            </>
          )}

          {showDone && state.coachDone.map((d, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-2.5 bg-(--color-paper)">
              <Check size={15} className="text-(--color-teal)" />
              <span className="text-[13px] text-(--color-ink-soft) flex-1">{d.text}</span>
              <span className="text-[11.5px] text-(--color-ink-mute)">{timeAgo(d.at)}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 4. Team table */}
      <Section title="Your team" right={<span className="text-[12.5px] text-(--color-ink-mute)">Click a column to sort, a row to open the agent</span>}>
        <div className="bg-white border border-(--color-line) rounded-2xl overflow-x-auto">
          <table className="w-full text-[13px] min-w-[760px]">
            <thead>
              <tr className="text-left text-[11px] tracking-wide text-(--color-ink-mute) uppercase border-b border-(--color-line)">
                <Th k="name" className="pl-5">Agent</Th>
                <Th k="read">Read today</Th>
                <Th k="aht">AHT</Th>
                <Th k="fcr">FCR</Th>
                <Th k="ab">Behaviour</Th>
                <Th k="streak">Streak</Th>
                <Th k="attention" className="pr-5">Status</Th>
              </tr>
            </thead>
            <tbody>
              {team.map((r) => {
                const { agent } = r
                const st = statusFor(r)
                const { read, total } = readOf(r)
                return (
                  <tr key={agent.id} onClick={() => setOpenAgent(agent.id)} className="border-b border-(--color-line) last:border-0 hover:bg-(--color-mint-2) cursor-pointer">
                    <td className="pl-5 pr-3 py-3">
                      <span className="flex items-center gap-2.5"><Avatar initials={agent.initials} size={28} tone="soft" /><span className="font-semibold whitespace-nowrap">{agent.name}</span></span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-2">
                        <span className="w-14 h-1.5 rounded-full bg-(--color-paper) overflow-hidden"><span className="block h-full bg-(--color-teal) rounded-full" style={{ width: `${total ? (read / total) * 100 : 0}%` }} /></span>
                        <span className="text-(--color-ink-soft)">{read}/{total}</span>
                      </span>
                    </td>
                    <KpiCell k={agent.kpis.aht} />
                    <KpiCell k={agent.kpis.fcr} />
                    <KpiCell k={agent.kpis.agentBehaviour} />
                    <td className="px-3 py-3 whitespace-nowrap"><Flame size={12} className="inline -mt-0.5 text-(--color-orange)" /> {streakOf(state, agent.id)}</td>
                    <td className={`pl-3 pr-5 py-3 whitespace-nowrap font-medium ${st.tone === 'coral' ? 'text-(--color-coral)' : st.tone === 'amber' ? 'text-(--color-amber)' : 'text-(--color-teal-dark)'}`}>{st.text}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="text-[11.5px] text-(--color-ink-mute) mt-2">KPIs are yesterday's values. Red means below target; the arrow shows the week's direction.</div>
      </Section>

      {cardId && <EvidenceDrawer cardId={cardId} onClose={() => setCardId(null)} onOpenAgent={setOpenAgent} />}
      <AgentModal agentId={openAgent} onClose={() => setOpenAgent(null)} onOpenCard={(id) => { setOpenAgent(null); setCardId(id) }} onSchedule={(q) => { setOpenAgent(null); setSchedule(q) }} onPrep={(q) => { setOpenAgent(null); setPrep(q) }} />
      <ScheduleModal item={schedule} onClose={() => setSchedule(null)} />
      <PrepModal item={prep} onClose={() => setPrep(null)} onOpenCard={(id) => { setPrep(null); setCardId(id) }} onComplete={(q) => setCloseOut(q)} onSchedule={(q) => setSchedule(q)} />
      <CriticalFailureModal item={cf} onClose={() => setCf(null)} onQueue={(it) => dispatch({ type: 'queueFromAttention', item: it })} queueState={cf && queueLabel(cf.agentId)} onOpenAgent={setOpenAgent} onPrep={(q) => setPrep(q)} />
      {closeOut && <CloseOutModal item={closeOut} onClose={() => setCloseOut(null)} />}
      <CloseOutView item={viewClose} onClose={() => setViewClose(null)} />
    </div>
  )
}
