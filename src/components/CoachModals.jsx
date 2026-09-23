import { useEffect, useState } from 'react'
import { AlertTriangle, BellRing, CheckCircle2, ShieldAlert, XCircle, FileText, MessageSquare, ArrowDownLeft, ArrowUpRight, Zap, Flame } from 'lucide-react'
import { agents, allCards, attentionItems, criticalFailures, dayOffset, levelFor, TIERS, trainingStatus } from '../data/qlensData'
import { badgeProgress, cardsFor, streakOf, useStore } from '../lib/store'
import { KpiTiles, LineChart } from './Kpi'
import { Avatar, Btn, Drawer, Illustrative, Modal, Pill, SourceTag, fmtDate, fmtTime, timeAgo } from './ui'

const pretty = (k) => k.replace(/_/g, ' ')

export function statusOf(c) {
  if (c.heldForReview) return { label: 'Held for review', tone: 'coral' }
  if (c.status === 'done') return { label: 'Got it', tone: 'teal' }
  if (c.overdue) return { label: `Overdue · ${c.deliveredDaysAgo}d`, tone: 'coral' }
  if (c.status === 'later') return { label: 'Saved for later', tone: 'grey' }
  return { label: 'Not yet read', tone: 'grey' }
}

// ---------------------------------------------------------------------------
export function EvidenceDrawer({ cardId, onClose, onOpenAgent }) {
  const { state, dispatch } = useStore()
  const base = allCards.find((c) => c.id === cardId)
  if (!base) return null
  const card = cardsFor(state, base.agentId).find((c) => c.id === cardId)
  const st = statusOf(card)
  return <EvidenceBody card={card} st={st} onClose={onClose} onOpenAgent={onOpenAgent} dispatch={dispatch} />
}

const HISTORY = {
  new: { label: 'New topic', tone: 'teal', text: 'First time QIQ has coached this agent on this topic.' },
  repeat_improved: { label: 'Repeat, improved', tone: 'teal', text: 'Coached before and the signal has improved since.' },
  repeat_unchanged: { label: 'Repeat, unchanged', tone: 'amber', text: 'Coached before with no change in the signal.' },
  repeat_worsened: { label: 'Repeat, worsened', tone: 'coral', text: 'Coached before and the signal has got worse since.' },
}

export function Quotes({ quotes, threadCount }) {
  if (!quotes?.length) {
    return <div className="text-[13px] text-(--color-ink-soft)">{threadCount} email thread{threadCount === 1 ? '' : 's'} behind this card.</div>
  }
  return (
    <div className="space-y-2.5">
      {quotes.map((q, i) => (
        <div key={i} className={`rounded-xl px-4 py-3 ${q.from === 'Customer' ? 'bg-(--color-paper)' : 'bg-(--color-mint-2) border border-(--color-teal)/15'}`}>
          <div className="flex items-center gap-2 text-[11.5px] text-(--color-ink-soft)">
            {q.from === 'Customer' ? <ArrowDownLeft size={12} className="text-(--color-blue)" /> : <ArrowUpRight size={12} className="text-(--color-teal-dark)" />}
            <b className="text-(--color-ink)">{q.from}</b> · {q.date} · thread …{q.thread}, message {q.seq}
          </div>
          <div className="text-[13.5px] mt-1 leading-relaxed">“{q.text}”</div>
        </div>
      ))}
      <div className="text-[11.5px] text-(--color-ink-mute)">Quotes from the real email threads. Customer names and personal details are left out.</div>
    </div>
  )
}

function Block({ label, children }) {
  return (
    <div>
      <div className="text-[11.5px] font-semibold tracking-wide text-(--color-ink-soft) uppercase mb-1.5">{label}</div>
      {children}
    </div>
  )
}

function EvidenceBody({ card, st, onClose, onOpenAgent, dispatch }) {
  const [preview, setPreview] = useState(false)
  const agent = agents[card.agentId]
  const canNudge = !card.heldForReview && card.status !== 'done'
  const b = card.brief || {}
  const h = HISTORY[b.history || 'new']
  const scope = pretty(card.evidenceScope || 'multi_interaction_trend')
  return (
    <Modal open onClose={onClose} width="max-w-2xl" title={card.heldForReview ? 'Card held back by the PII check' : card.title} subtitle={`${agent.name} · why QIQ issued this card`}
      footer={
        <>
          {canNudge && (
            <Btn variant={card.nudgedAt ? 'outline' : 'primary'} onClick={() => dispatch({ type: 'nudge', cardId: card.id })}>
              <BellRing size={14} /> {card.nudgedAt ? 'Nudge again' : `Nudge ${agent.name.split(' ')[0]}`}
            </Btn>
          )}
          <Btn variant="outline" onClick={() => { onClose(); onOpenAgent(card.agentId) }}>Open {agent.name.split(' ')[0]}'s profile</Btn>
        </>
      }>
      <div className="flex flex-wrap gap-2 items-center">
        <Pill tone={card.tier === TIERS.COACHING ? 'amber' : 'teal'}>{card.tier === TIERS.COACHING ? 'Coaching card' : 'Q-Byte'}</Pill>
        <Pill tone={st.tone}>{st.label}</Pill>
        {!card.heldForReview && <Pill tone="outline"><Zap size={11} /> {card.xp} XP</Pill>}
        {card.nudgedAt && <Pill tone="grey"><BellRing size={11} /> Nudged {timeAgo(card.nudgedAt)}</Pill>}
      </div>

      {card.heldForReview && (
        <div className="mt-4 rounded-xl border border-(--color-coral)/30 bg-(--color-coral-soft) px-4 py-3">
          <div className="flex items-center gap-2 text-[13.5px] font-semibold text-(--color-coral)"><ShieldAlert size={15} /> Never sent to {agent.name.split(' ')[0]}</div>
          <div className="text-[13px] mt-1">Both attempts to write this card named a team from the source emails, so the PII check stopped it. You may want to cover the topic in person.</div>
        </div>
      )}

      <div className="mt-5 space-y-5">
        {card.weekly && (
          <div className={`grid gap-2 ${card.weekly.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            {card.weekly.map((w) => (
              <div key={w.k} className="rounded-xl bg-(--color-amber-soft)/60 px-3 py-2.5">
                <div className="text-[18px] font-semibold leading-tight">{w.v}</div>
                <div className="text-[12px] text-(--color-ink-soft) leading-snug">{w.k}</div>
              </div>
            ))}
          </div>
        )}
        <Block label="What happened">
          <div className="text-[14px] leading-relaxed">{b.evidenceSummary}</div>
        </Block>
        <Block label="What QIQ wants the agent to do">
          <div className="text-[14px] leading-relaxed font-medium text-(--color-teal-dark)">{b.coachingAngle}</div>
        </Block>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-(--color-line) px-3 py-2.5">
            <div className="text-[11px] text-(--color-ink-mute)">Strength of evidence</div>
            <div className="text-[13.5px] font-medium">{card.evidence.supportStrength}</div>
            <div className="text-[11.5px] text-(--color-ink-soft) capitalize">{scope}</div>
          </div>
          <div className="rounded-xl border border-(--color-line) px-3 py-2.5 sm:col-span-2">
            <div className="text-[11px] text-(--color-ink-mute)">Why it ranked here</div>
            <div className="text-[13px]">{b.priorityReason}</div>
          </div>
        </div>
        <Block label="Coaching history on this topic">
          <div className="flex items-center gap-2 text-[13px]"><Pill tone={h.tone}>{h.label}</Pill> <span className="text-(--color-ink-soft)">{h.text}</span></div>
        </Block>
        <Block label="From the conversations">
          <Quotes quotes={card.quotes} threadCount={card.evidence.threadCount} />
        </Block>
        {!card.heldForReview && (
          <div>
            <button onClick={() => setPreview((p) => !p)} className="text-[13px] font-semibold text-(--color-teal-dark) flex items-center gap-1.5">
              <FileText size={14} /> {preview ? 'Hide' : 'Show'} what the agent sees
            </button>
            {preview && (
              <div className="mt-2 border border-(--color-line) rounded-xl p-4 text-[13px] leading-relaxed space-y-2 bg-(--color-mint)">
                <p>{card.sections.opening} {card.sections.trend}</p>
                <p>{card.sections.focus}</p>
                <p className="font-medium text-(--color-teal-dark)">{card.sections.guidance}</p>
                <p className="italic text-(--color-blue)">“{card.sections.example}”</p>
                <p>{card.sections.challenge}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
export function ScheduleModal({ item, onClose }) {
  const { dispatch } = useStore()
  const [date, setDate] = useState(item?.date || dayOffset(1))
  const [time, setTime] = useState(item?.time || '10:00')
  useEffect(() => {
    if (item) {
      setDate(item.date || dayOffset(1))
      setTime(item.time || '10:00')
    }
  }, [item?.id]) // eslint-disable-line
  if (!item) return null
  const agent = agents[item.agentId]
  const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00']
  return (
    <Modal
      open
      onClose={onClose}
      title={item.status === 'scheduled' ? 'Reschedule 1:1' : 'Schedule 1:1'}
      subtitle={`${agent.name} · ${item.topic}`}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => { dispatch({ type: 'schedule', queueId: item.id, date, time }); onClose() }}>{item.status === 'scheduled' ? 'Save new time' : 'Schedule session'}</Btn>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="block text-xs text-(--color-ink-soft) mb-1">Date</span>
          <input type="date" value={date} min={dayOffset(0)} onChange={(e) => setDate(e.target.value)} className="w-full border border-(--color-line) rounded-lg px-3 py-2 outline-none focus:border-(--color-teal)" />
        </label>
        <label className="text-sm">
          <span className="block text-xs text-(--color-ink-soft) mb-1">Time</span>
          <select value={time} onChange={(e) => setTime(e.target.value)} className="w-full border border-(--color-line) rounded-lg px-3 py-2 outline-none focus:border-(--color-teal) bg-white">
            {times.map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-4 rounded-lg bg-(--color-mint-2) border border-(--color-line) p-3 text-[13px] text-(--color-ink-soft)">
        {agent.name.split(' ')[0]} will see a calendar entry with the date and time only. The topic and your prep stay on your side.
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
export function PrepModal({ item, onClose, onOpenCard, onComplete, onSchedule }) {
  const { state } = useStore()
  if (!item) return null
  const agent = agents[item.agentId]
  const related = cardsFor(state, item.agentId).filter((c) => c.topicKey === item.topicKey)
  const angle = related.find((c) => c.brief?.coachingAngle)?.brief.coachingAngle
  const hKey = item.history || related.find((c) => c.brief?.history)?.brief.history || 'new'
  const h = HISTORY[hKey]
  const quotes = related.flatMap((c) => c.quotes || []).slice(0, 3)
  const kpi = agent.kpis[item.kpiKey || 'fcr']
  const pastSessions = state.queue.filter((q) => q.agentId === item.agentId && q.status === 'closed' && q.id !== item.id)
  const notes = state.notes[item.agentId] || []
  const first = agent.name.split(' ')[0]
  return (
    <Modal open onClose={onClose} width="max-w-2xl" title={`1:1 prep · ${agent.name}`} subtitle={`${item.topic}${item.date ? ` · ${fmtDate(item.date)}, ${fmtTime(item.time)}` : ' · not scheduled yet'}`}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>Close</Btn>
          {item.status === 'scheduled' && <Btn onClick={() => { onClose(); onComplete(item) }}>Mark session complete</Btn>}
          {item.status === 'awaiting' && onSchedule && <Btn onClick={() => { onClose(); onSchedule(item) }}>Schedule</Btn>}
        </>
      }>
      <div className="space-y-6">
        <Block label="Why this 1:1">
          <div className="text-[14px] leading-relaxed">{item.whyFlagged}</div>
          {item.detection && <div className="text-[12.5px] text-(--color-ink-soft) mt-1.5">{item.detection}</div>}
        </Block>

        {angle && (
          <Block label="What QIQ recommends focusing on">
            <div className="text-[14px] leading-relaxed font-medium text-(--color-teal-dark) bg-(--color-mint-2) rounded-xl px-4 py-3">{angle}</div>
          </Block>
        )}

        <Block label={`${first}'s ${kpi.label}, last 30 days`}>
          <div className="rounded-xl border border-(--color-line) px-4 pt-6 pb-3">
            <div className="flex items-baseline gap-2 -mt-3 mb-3">
              <span className="text-[20px] font-semibold">{kpi.value}{kpi.unit}</span>
              <span className="text-[12px] text-(--color-ink-soft)">target {kpi.direction === 'higher_better' ? '≥' : '≤'} {kpi.target}{kpi.unit}</span>
            </div>
            <LineChart points={kpi.trend} unit={kpi.unit} target={kpi.target} height={170} w={620} />
          </div>
        </Block>

        <Block label="History on this topic">
          <div className="flex items-center gap-2 text-[13px] mb-2"><Pill tone={h.tone}>{h.label}</Pill> <span className="text-(--color-ink-soft)">{h.text}</span></div>
          <div className="space-y-1.5">
            {related.length === 0 && <div className="text-[13px] text-(--color-ink-soft)">No cards sent on this topic yet.</div>}
            {related.map((c) => (
              <button key={c.id} onClick={() => onOpenCard(c.id)} className="w-full text-left flex items-center gap-3 border border-(--color-line) rounded-lg px-3 py-2 hover:border-(--color-teal)">
                <span className="flex-1 text-[13px] font-medium">{c.title}</span>
                <span className="text-[11.5px] text-(--color-ink-mute)">{c.tier === TIERS.COACHING ? 'Coaching card' : 'Q-Byte'} · {c.deliveredDaysAgo === 0 ? 'today' : `${c.deliveredDaysAgo}d ago`}</span>
                <Pill tone={c.status === 'done' ? 'teal' : 'grey'}>{c.status === 'done' ? 'Got it' : 'Not yet'}</Pill>
              </button>
            ))}
          </div>
        </Block>

        {quotes.length > 0 && (
          <Block label="From the conversations">
            <Quotes quotes={quotes} />
          </Block>
        )}

        {(pastSessions.length > 0 || notes.length > 0) && (
          <Block label="Last session and your notes">
            <div className="space-y-1.5">
              {pastSessions.map((q) => (
                <div key={q.id} className="text-[13px] bg-(--color-paper) rounded-lg px-3 py-2"><b>{q.topic}</b> · {q.closeOut?.outcome}. {q.closeOut?.note}</div>
              ))}
              {notes.slice(0, 3).map((n, i) => <div key={i} className="text-[13px] bg-(--color-paper) rounded-lg px-3 py-2">{n.text}</div>)}
            </div>
          </Block>
        )}
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
export function CriticalFailureModal({ item, onClose, onQueue, queueState, onOpenAgent, onPrep }) {
  const { state } = useStore()
  if (!item) return null
  const agent = agents[item.agentId]
  const q = state.queue.find((x) => x.agentId === item.agentId && x.status !== 'closed')
  return (
    <Modal open onClose={onClose} width="max-w-2xl" title={`Critical failure · ${agent.name}`} subtitle={`${item.daysAgo === 1 ? 'Yesterday' : `${item.daysAgo} days ago`} · ${item.channel} · interaction ${item.interactionId}`}
      footer={
        <>
          <Btn variant="outline" onClick={() => { onClose(); onOpenAgent(item.agentId) }}>Open profile</Btn>
          {q?.status === 'scheduled' && onPrep && <Btn variant="outline" onClick={() => { onClose(); onPrep(q) }}>Open 1:1 prep</Btn>}
          {queueState ? <span className="text-[13px] text-(--color-teal-dark) font-medium self-center px-2 inline-flex items-center gap-1"><CheckCircle2 size={14} /> {queueState}</span> : <Btn onClick={() => { onQueue(item); onClose() }}>Add to 1:1 queue</Btn>}
        </>
      }>
      <div className="space-y-5">
        <Block label="What happened">
          <div className="text-[14px] leading-relaxed">{item.summary}</div>
        </Block>

        <div className="rounded-xl border border-(--color-coral)/30 bg-(--color-coral-soft) px-4 py-3">
          <div className="text-[11.5px] font-semibold tracking-wide text-(--color-coral) uppercase">Process step missed</div>
          <div className="text-[14px] font-medium mt-1">{item.step}</div>
          <div className="text-[12px] text-(--color-ink-soft) mt-1">Required: MUST · Severity: BLOCKER · {item.sop.name}, section {item.sop.section}</div>
        </div>

        <Block label={`${item.sop.flow} · steps`}>
          <div className="space-y-1.5">
            {item.steps.map((st, i) => (
              <div key={i} className={`flex items-center gap-2.5 text-[13px] rounded-lg px-3 py-2 ${st.status === 'missed' ? 'bg-(--color-coral-soft)/60' : 'bg-(--color-paper)'}`}>
                {st.status === 'missed' ? <XCircle size={15} className="text-(--color-coral) shrink-0" /> : <CheckCircle2 size={15} className="text-(--color-teal) shrink-0" />}
                <span className="flex-1">{st.text}</span>
                {st.level && <span className="text-[10.5px] font-semibold text-(--color-ink-soft)">{st.level}{st.severity ? ` · ${st.severity}` : ''}</span>}
              </div>
            ))}
          </div>
        </Block>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-(--color-line) px-3 py-2.5 sm:col-span-3">
            <div className="text-[11px] text-(--color-ink-mute)">Outcome Matrix</div>
            <div className="text-[13.5px] font-medium">{item.outcome.cell}</div>
          </div>
          <div className="rounded-xl border border-(--color-line) px-3 py-2.5 sm:col-span-2">
            <div className="text-[11px] text-(--color-ink-mute)">Resolution</div>
            <div className="text-[13px]">{item.outcome.resolution}</div>
          </div>
          <div className="rounded-xl border border-(--color-line) px-3 py-2.5">
            <div className="text-[11px] text-(--color-ink-mute)">CSAT</div>
            <div className="text-[13px]">{item.outcome.csat}</div>
          </div>
        </div>

        <Block label="Agent Behaviour on this interaction">
          <div className="space-y-2">
            {item.behaviour.map((bh) => (
              <div key={bh.dim} className="rounded-xl border border-(--color-line) px-4 py-3">
                <div className="flex items-center justify-between"><span className="text-[13.5px] font-semibold">{bh.dim}</span><span className={`text-[13px] font-semibold ${bh.score <= 2 ? 'text-(--color-coral)' : 'text-(--color-amber)'}`}>{bh.score} / 5</span></div>
                <div className="text-[13px] text-(--color-ink-soft) mt-0.5">{bh.rationale}</div>
                <div className="text-[13px] italic mt-1">“{bh.quote}”</div>
              </div>
            ))}
          </div>
        </Block>

        <Block label="From the conversation">
          <div className="space-y-2">
            {item.quotes.map((qt, i) => (
              <div key={i} className={`rounded-xl px-4 py-2.5 text-[13.5px] ${qt.from === 'Customer' ? 'bg-(--color-paper)' : 'bg-(--color-mint-2) border border-(--color-teal)/15'}`}>
                <b className="text-[11.5px] text-(--color-ink-soft)">{qt.from}</b>
                <div>“{qt.text}”</div>
              </div>
            ))}
          </div>
        </Block>

        <Block label="Pattern check">
          <div className="text-[13.5px]">{item.pattern}</div>
        </Block>
        <div className="text-[11.5px] text-(--color-ink-mute)">{item.source} · Escalation Monitoring · Outcome Matrix evidence layer</div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
export function CloseOutModal({ item, onClose }) {
  const { dispatch } = useStore()
  const [happened, setHappened] = useState(true)
  const [outcome, setOutcome] = useState('Agreed a plan')
  const [note, setNote] = useState('')
  const [smartOn, setSmartOn] = useState(false)
  const [smart, setSmart] = useState({ specific: '', measurable: '', achievable: '', relevant: '', timebound: '', agreed: false })
  if (!item) return null
  const agent = agents[item.agentId]
  const valid = note.trim().length > 2 && (!smartOn || (smart.specific && smart.measurable && smart.timebound))
  const submit = () => {
    dispatch({ type: 'closeOut', queueId: item.id, closeOut: { happened, outcome: happened ? outcome : 'Did not take place', note, smart: smartOn ? smart : null } })
    onClose()
  }
  return (
    <Modal open onClose={onClose} width="max-w-xl" title="Close out session" subtitle={`${agent.name} · ${item.topic}`}
      footer={<><Btn variant="outline" onClick={onClose}>Cancel</Btn><Btn disabled={!valid} onClick={submit}>Close out</Btn></>}>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={happened} onChange={(e) => setHappened(e.target.checked)} className="accent-(--color-teal) w-4 h-4" />
        The session took place
      </label>
      {happened && (
        <div className="mt-4">
          <div className="text-xs text-(--color-ink-soft) mb-1.5">Outcome</div>
          <div className="flex flex-wrap gap-2">
            {['Agreed a plan', 'Improving', 'Needs follow-up', 'No change'].map((o) => (
              <button key={o} onClick={() => setOutcome(o)} className={`text-[13px] px-3 py-1.5 rounded-lg border ${outcome === o ? 'border-(--color-teal) bg-(--color-teal-soft) text-(--color-teal-dark) font-semibold' : 'border-(--color-line) hover:bg-(--color-paper)'}`}>{o}</button>
            ))}
          </div>
        </div>
      )}
      <label className="block mt-4">
        <span className="block text-xs text-(--color-ink-soft) mb-1.5">Outcome note (required)</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="What you covered and what you agreed." className="w-full border border-(--color-line) rounded-lg px-3 py-2 text-sm outline-none focus:border-(--color-teal)" />
      </label>

      <div className="mt-4 border border-(--color-line) rounded-xl p-3">
        <label className="flex items-center justify-between text-sm">
          <span>
            <span className="font-medium">Add a SMART form</span>
            <span className="block text-xs text-(--color-ink-soft)">Optional. Configured per client, not part of the core close-out.</span>
          </span>
          <button onClick={() => setSmartOn((s) => !s)} className={`w-10 h-6 rounded-full relative transition ${smartOn ? 'bg-(--color-teal)' : 'bg-(--color-line)'}`} aria-label="Toggle SMART form">
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${smartOn ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </label>
        {smartOn && (
          <div className="mt-3 space-y-2">
            {[['specific', 'Specific: what will change?'], ['measurable', 'Measurable: how will we know?'], ['achievable', 'Achievable: what support is needed?'], ['relevant', 'Relevant: which KPI does it move?'], ['timebound', 'Time-bound: review date']].map(([k, label]) => (
              <input key={k} value={smart[k]} onChange={(e) => setSmart({ ...smart, [k]: e.target.value })} placeholder={label} className="w-full border border-(--color-line) rounded-lg px-3 py-1.5 text-sm outline-none focus:border-(--color-teal)" />
            ))}
            <label className="flex items-center gap-2 text-sm mt-1">
              <input type="checkbox" checked={smart.agreed} onChange={(e) => setSmart({ ...smart, agreed: e.target.checked })} className="accent-(--color-teal) w-4 h-4" /> Agent has agreed to this plan
            </label>
          </div>
        )}
      </div>
      {happened && <div className="text-[12px] text-(--color-ink-soft) mt-3">{agent.name.split(' ')[0]} gets +50 XP for attending.</div>}
    </Modal>
  )
}

export function CloseOutView({ item, onClose }) {
  if (!item) return null
  const c = item.closeOut
  return (
    <Modal open onClose={onClose} title="Session close-out" subtitle={`${agents[item.agentId].name} · ${item.topic}`} footer={<Btn variant="outline" onClick={onClose}>Close</Btn>}>
      <div className="flex gap-2 mb-3"><Pill tone={c.happened ? 'teal' : 'coral'}>{c.happened ? 'Took place' : 'Did not take place'}</Pill><Pill tone="outline">{c.outcome}</Pill></div>
      <div className="text-[14px] leading-relaxed">{c.note}</div>
      {c.smart && (
        <div className="mt-4 border border-(--color-line) rounded-xl p-3 text-[13px] space-y-1">
          <div className="font-semibold mb-1">SMART form</div>
          {Object.entries(c.smart).filter(([k]) => k !== 'agreed').map(([k, v]) => <div key={k}><span className="capitalize text-(--color-ink-soft)">{k}:</span> {v || '—'}</div>)}
          <div className="text-(--color-teal-dark) font-medium">{c.smart.agreed ? 'Agreed by agent' : 'Not yet agreed by agent'}</div>
        </div>
      )}
    </Modal>
  )
}

// ---------------------------------------------------------------------------
export function AgentModal({ agentId, onClose, onOpenCard, onSchedule, onPrep }) {
  const { state, dispatch } = useStore()
  const [tab, setTab] = useState('Overview')
  const [draft, setDraft] = useState('')
  useEffect(() => setTab('Overview'), [agentId])
  if (!agentId) return null
  const a = agents[agentId]
  const cards = cardsFor(state, agentId)
  const L = levelFor(state.progress[agentId].xp)
  const streak = streakOf(state, agentId)
  const badges = badgeProgress(state, agentId).filter((b) => b.earnedAt)
  const sessions = state.queue.filter((q) => q.agentId === agentId)
  const notes = state.notes[agentId] || []
  const tabs = ['Overview', 'Cards', 'Sessions', 'Training', 'Notes']
  const flags = [...criticalFailures, ...attentionItems].filter((x) => x.agentId === agentId)
  return (
    <Drawer open onClose={onClose} width="max-w-3xl" title={a.name} subtitle={a.email}
      header={
        <div className="flex gap-5 border-b border-(--color-line) px-6 pt-3">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`pb-2 text-sm ${tab === t ? 'font-semibold border-b-2 border-(--color-ink)' : 'text-(--color-ink-soft) hover:text-(--color-ink)'}`}>{t}</button>
          ))}
        </div>
      }>

      {tab === 'Overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[[L.level, `Level · ${L.name}`], [<span key="s" className="inline-flex items-center gap-1"><Flame size={16} className="text-(--color-orange)" />{streak}</span>, 'Day streak'], [badges.length, 'Badges earned']].map(([v, k], i) => (
              <div key={i} className="rounded-xl bg-(--color-paper) px-3 py-3 text-center">
                <div className="text-[20px] font-semibold leading-none">{v}</div>
                <div className="text-[11.5px] text-(--color-ink-soft) mt-1">{k}</div>
              </div>
            ))}
          </div>
          {flags.map((f) => (
            <div key={f.id} className="rounded-xl border border-(--color-coral)/30 bg-(--color-coral-soft) px-4 py-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-(--color-coral)"><AlertTriangle size={14} /> {f.type} <Illustrative /></div>
              <div className="text-[13.5px] mt-1">{f.text}</div>
              <div className="text-[11.5px] text-(--color-ink-soft) mt-0.5">{f.source}</div>
            </div>
          ))}
          <KpiTiles kpis={a.kpis} title="Numbers" />
        </div>
      )}

      {tab === 'Cards' && (
        <div className="space-y-2">
          {cards.map((c) => {
            const st = statusOf(c)
            return (
              <button key={c.id} onClick={() => onOpenCard(c.id)} className="w-full text-left flex items-center gap-3 border border-(--color-line) rounded-lg px-3 py-2.5 hover:border-(--color-teal)">
                <span className="w-1 self-stretch rounded" style={{ background: c.tier === TIERS.COACHING ? 'var(--color-amber-stripe)' : 'var(--color-teal-stripe)' }} />
                <span className="flex-1">
                  <span className="block text-[13.5px] font-medium">{c.heldForReview ? 'Held for review: ' + c.title : c.title}</span>
                  <span className="block text-[12px] text-(--color-ink-soft)">{c.tier === TIERS.COACHING ? 'Coaching card' : 'Q-Byte'} · {c.deliveredDaysAgo === 0 ? 'today' : `${c.deliveredDaysAgo} days ago`}</span>
                </span>
                <Pill tone={st.tone}>{st.label}</Pill>
              </button>
            )
          })}
        </div>
      )}

      {tab === 'Sessions' && (
        <div className="space-y-2">
          {sessions.length === 0 && <div className="text-sm text-(--color-ink-soft) py-6 text-center">No coaching sessions for {a.name.split(' ')[0]}.</div>}
          {sessions.map((q) => (
            <div key={q.id} className="flex items-center gap-3 border border-(--color-line) rounded-lg px-3 py-2.5">
              <div className="flex-1">
                <div className="text-[13.5px] font-medium">{q.topic}</div>
                <div className="text-[12px] text-(--color-ink-soft)">{q.source}{q.date ? ` · ${fmtDate(q.date)} ${fmtTime(q.time)}` : ''}</div>
              </div>
              <Pill tone={q.status === 'closed' ? 'grey' : q.status === 'scheduled' ? 'teal' : 'amber'}>{q.status === 'awaiting' ? 'Awaiting schedule' : q.status === 'scheduled' ? 'Scheduled' : 'Closed'}</Pill>
              {q.status === 'awaiting' && <Btn size="sm" onClick={() => onSchedule(q)}>Schedule</Btn>}
              {q.status === 'scheduled' && <Btn size="sm" variant="outline" onClick={() => onPrep(q)}>View prep</Btn>}
            </div>
          ))}
        </div>
      )}

      {tab === 'Training' && (
        <div>
          <div className="flex items-center gap-2 mb-3"><span className="text-[13px] text-(--color-ink-soft)">Training is assigned by QIQ. Shown here read-only.</span><Illustrative /></div>
          <div className="space-y-2">
            {(trainingStatus[agentId] || []).map((t) => (
              <div key={t.course} className="border border-(--color-line) rounded-lg px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] font-medium">{t.course}</span>
                  <Pill tone={t.status === 'Completed' ? 'teal' : t.status === 'In progress' ? 'blue' : 'grey'}>{t.status}</Pill>
                </div>
                {t.progress != null && (
                  <div className="h-1.5 bg-(--color-paper) rounded-full mt-2 overflow-hidden"><div className="h-full bg-(--color-blue) rounded-full" style={{ width: `${t.progress}%` }} /></div>
                )}
              </div>
            ))}
          </div>
          <div className="text-[12px] text-(--color-ink-mute) mt-3">Whether a Coach can assign or nudge training is still an open question, so there's no assign button here.</div>
        </div>
      )}

      {tab === 'Notes' && (
        <div>
          <div className="flex gap-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) { dispatch({ type: 'note', agentId, text: draft.trim() }); setDraft('') } }} placeholder={`Add a private note about ${a.name.split(' ')[0]}...`} className="flex-1 border border-(--color-line) rounded-lg px-3 py-2 text-sm outline-none focus:border-(--color-teal)" />
            <Btn disabled={!draft.trim()} onClick={() => { dispatch({ type: 'note', agentId, text: draft.trim() }); setDraft('') }}><MessageSquare size={14} /> Add</Btn>
          </div>
          <div className="mt-3 space-y-2">
            {notes.length === 0 && <div className="text-sm text-(--color-ink-soft) py-4 text-center">No notes yet.</div>}
            {notes.map((n, i) => (
              <div key={i} className="bg-(--color-paper) rounded-lg px-3 py-2">
                <div className="text-[13.5px]">{n.text}</div>
                <div className="text-[11px] text-(--color-ink-mute) mt-0.5">{timeAgo(n.at)}</div>
              </div>
            ))}
          </div>
          <div className="text-[11.5px] text-(--color-ink-mute) mt-3">Notes stay with the Coach. The agent never sees them.</div>
        </div>
      )}
    </Drawer>
  )
}

