import { useEffect, useState } from 'react'
import { AlertTriangle, BellRing, BookOpen, CheckCircle2, ShieldAlert, XCircle, FileText, MessageSquare, ArrowDownLeft, ArrowUpRight, Zap, Flame, ListChecks, Sparkles, Undo2, Mail } from 'lucide-react'
import { agents, allCards, attentionItems, criticalFailures, dayOffset, DECLINE_REASONS, levelFor, SECTION_LABELS, TIERS, trainingRecos, TRIGGER_LABEL } from '../data/qlensData'
import { badgesFor, cardsFor, isLate, streakOf, useStore } from '../lib/store'
import { badgeTier } from '../data/qlensData'
import { KpiTiles, LineChart } from './Kpi'
import { BadgeMedal } from './Gamification'
import { Btn, Drawer, Modal, Pill, fmtDate, fmtTime, timeAgo } from './ui'

const pretty = (k) => k.replace(/_/g, ' ')
export const tierLabel = (c) => (c.positive ? 'Q-tip · you did it' : c.tier === TIERS.WEEKLY ? 'Weekly Q-tip' : 'Daily Q-tip')

export function statusOf(c) {
  if (c.heldForReview) return { label: 'Held, never sent', tone: 'coral' }
  if (c.withdrawn) return { label: 'Withdrawn by QIQ', tone: 'grey' }
  if (c.status === 'done') return { label: 'Read', tone: 'teal' }
  if (c.overdue) return { label: `Overdue · ${c.deliveredDaysAgo}d`, tone: 'coral' }
  if (c.status === 'later') return { label: 'Saved for later', tone: 'grey' }
  return { label: 'Not yet read', tone: 'grey' }
}

export function sessionStatus(q) {
  if (q.status === 'closed') return { label: 'Closed out', tone: 'grey' }
  if (q.status === 'declined') return { label: `Declined · ${q.declineReason.toLowerCase()}`, tone: 'grey' }
  if (q.status === 'scheduled') return { label: 'Booked', tone: 'teal' }
  if (isLate(q)) return { label: 'Late', tone: 'coral' }
  return { label: 'To book', tone: 'amber' }
}

const HISTORY = {
  new: { label: 'New topic', tone: 'teal', text: 'First time QIQ has coached this agent on this topic.' },
  repeat_improved: { label: 'Repeat, improved', tone: 'teal', text: 'Coached before and the agent applied it.' },
  repeat_unchanged: { label: 'Repeat, unchanged', tone: 'amber', text: 'Coached before with no change.' },
  repeat_worsened: { label: 'Repeat, worsened', tone: 'coral', text: 'Coached before and it has got worse since.' },
}

const VERDICT = {
  applied: { label: 'Applied', tone: 'teal' },
  partly: { label: 'Partly applied', tone: 'amber' },
  not_applied: { label: 'Not applied', tone: 'coral' },
  no_opportunity: { label: 'No opportunity yet', tone: 'grey' },
}

export function FollowupBlock({ f }) {
  if (!f) return null
  const v = VERDICT[f.verdict]
  return (
    <div className="rounded-xl border border-(--color-line) px-4 py-3">
      <div className="flex items-center gap-2 text-[13px]"><ListChecks size={14} className="text-(--color-teal-dark)" /><span className="font-semibold">Follow-up check, day 7</span><Pill tone={v.tone}>{v.label}</Pill></div>
      <div className="text-[13px] text-(--color-ink-soft) mt-1">Applied in {f.applied} of {f.relevant} relevant interactions since the Q-tip.</div>
      {f.quote && <div className="text-[13px] italic mt-1">“{f.quote}”</div>}
    </div>
  )
}

export function Quotes({ quotes, threadCount }) {
  if (!quotes?.length) {
    return <div className="text-[13px] text-(--color-ink-soft)">{threadCount} email thread{threadCount === 1 ? '' : 's'} behind this Q-tip.</div>
  }
  return (
    <div className="space-y-2.5">
      {quotes.map((q, i) => (
        <div key={i} className={`rounded-xl px-4 py-3 ${q.from === 'Customer' ? 'bg-(--color-paper)' : 'bg-(--color-mint-2) border border-(--color-teal)/15'}`}>
          <div className="flex items-center gap-2 text-[11.5px] text-(--color-ink-soft)">
            {q.from === 'Customer' ? <ArrowDownLeft size={12} className="text-(--color-blue)" /> : <ArrowUpRight size={12} className="text-(--color-teal-dark)" />}
            <b className="text-(--color-ink)">{q.from}</b>{q.date ? ` · ${q.date}` : ''}{q.thread ? ` · thread …${q.thread}, message ${q.seq}` : ''}
          </div>
          <div className="text-[13.5px] mt-1 leading-relaxed">“{q.text}”</div>
        </div>
      ))}
      <div className="text-[11.5px] text-(--color-ink-mute)">Customer names and personal details are removed before quotes reach QLens.</div>
    </div>
  )
}

function Block({ label, children, right }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[11.5px] font-semibold tracking-wide text-(--color-ink-soft) uppercase">{label}</div>
        {right}
      </div>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
export function EvidenceDrawer({ cardId, onClose, onOpenAgent }) {
  const { state, dispatch } = useStore()
  const base = allCards.find((c) => c.id === cardId)
  if (!base) return null
  const card = cardsFor(state, base.agentId).find((c) => c.id === cardId)
  return <EvidenceBody card={card} st={statusOf(card)} onClose={onClose} onOpenAgent={onOpenAgent} dispatch={dispatch} />
}

function EvidenceBody({ card, st, onClose, onOpenAgent, dispatch }) {
  const [preview, setPreview] = useState(false)
  const agent = agents[card.agentId]
  const canNudge = !card.heldForReview && !card.withdrawn && card.status !== 'done'
  const b = card.brief || {}
  const h = HISTORY[b.history || 'new']
  return (
    <Modal open onClose={onClose} width="max-w-2xl" title={card.heldForReview ? 'Q-tip held back by a safety check' : card.title} subtitle={`${agent.name} · why QIQ sent this · coach only`}
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
        <Pill tone={card.positive ? 'teal' : card.tier === TIERS.WEEKLY ? 'amber' : 'teal'}>{tierLabel(card)}</Pill>
        <Pill tone={st.tone}>{st.label}</Pill>
        {!card.heldForReview && !card.withdrawn && <Pill tone="outline"><Zap size={11} /> {card.xp} XP</Pill>}
        {card.nudgedAt && <Pill tone="grey"><BellRing size={11} /> Nudged {timeAgo(card.nudgedAt)}</Pill>}
      </div>

      {card.heldForReview && (
        <div className="mt-4 rounded-xl border border-(--color-coral)/30 bg-(--color-coral-soft) px-4 py-3">
          <div className="flex items-center gap-2 text-[13.5px] font-semibold text-(--color-coral)"><ShieldAlert size={15} /> Never sent to {agent.name.split(' ')[0]} · validator: {card.validator}</div>
          <div className="text-[13px] mt-1">{card.blockedReason} QIQ tried twice, then held it. Nothing here releases it; if it should go out, QIQ regenerates it. You may want to cover the topic in the 1:1.</div>
        </div>
      )}
      {card.withdrawn && (
        <div className="mt-4 rounded-xl border border-(--color-line) bg-(--color-paper) px-4 py-3 text-[13px] flex items-center gap-2"><Undo2 size={15} /> {card.withdrawnReason}. {agent.name.split(' ')[0]} never saw it.</div>
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
        <Block label="What QIQ found">
          <div className="text-[14px] leading-relaxed">{b.evidenceSummary}</div>
        </Block>
        {!card.positive && (
          <Block label="What QIQ wants the agent to do">
            <div className="text-[14px] leading-relaxed font-medium text-(--color-teal-dark)">{b.coachingAngle}</div>
          </Block>
        )}
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-(--color-line) px-3 py-2.5">
            <div className="text-[11px] text-(--color-ink-mute)">Evidence</div>
            <div className="text-[13.5px] font-medium">{card.evidence.supportStrength}</div>
            <div className="text-[11.5px] text-(--color-ink-soft)">{pretty(card.evidenceScope || 'single_signal')}</div>
          </div>
          <div className="rounded-xl border border-(--color-line) px-3 py-2.5 sm:col-span-2">
            <div className="text-[11px] text-(--color-ink-mute)">Why it was chosen</div>
            <div className="text-[13px]">{b.priorityReason}</div>
          </div>
        </div>
        <Block label="Coaching history on this topic">
          <div className="flex items-center gap-2 text-[13px]"><Pill tone={h.tone}>{h.label}</Pill> <span className="text-(--color-ink-soft)">{h.text}</span></div>
        </Block>
        {card.followup && <FollowupBlock f={card.followup} />}
        {card.quotes?.length > 0 && (
          <Block label="From the conversations">
            <Quotes quotes={card.quotes} threadCount={card.evidence.threadCount} />
          </Block>
        )}
        {!card.heldForReview && (
          <div>
            <button onClick={() => setPreview((p) => !p)} className="text-[13px] font-semibold text-(--color-teal-dark) flex items-center gap-1.5">
              <FileText size={14} /> {preview ? 'Hide' : 'Show'} what the agent sees
            </button>
            {preview && (
              <div className="mt-2 border border-(--color-line) rounded-xl p-4 text-[13px] leading-relaxed space-y-2 bg-(--color-mint)">
                <div className="font-semibold">{card.title}</div>
                {[['saw', SECTION_LABELS.saw], ['try', SECTION_LABELS.try], ['why', SECTION_LABELS.why]].map(([k, l]) => (
                  <p key={k}><span className="text-[11px] font-semibold uppercase tracking-wide text-(--color-ink-mute)">{l}</span><br />{card.sections[k]}</p>
                ))}
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
    <Modal open onClose={onClose} title={item.status === 'scheduled' ? 'Reschedule 1:1' : 'Book 1:1'} subtitle={`${agent.name} · ${TRIGGER_LABEL[item.trigger]}`}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => { dispatch({ type: 'schedule', queueId: item.id, date, time }); onClose() }}>{item.status === 'scheduled' ? 'Save new time' : 'Book session'}</Btn>
        </>
      }>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="block text-xs text-(--color-ink-soft) mb-1">Date</span>
          <input type="date" value={date} min={dayOffset(0)} onChange={(e) => setDate(e.target.value)} className="w-full border border-(--color-line) rounded-lg px-3 py-2 outline-none focus:border-(--color-teal)" />
        </label>
        <label className="text-sm">
          <span className="block text-xs text-(--color-ink-soft) mb-1">Time (30 min)</span>
          <select value={time} onChange={(e) => setTime(e.target.value)} className="w-full border border-(--color-line) rounded-lg px-3 py-2 outline-none focus:border-(--color-teal) bg-white">
            {times.map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-4 rounded-lg bg-(--color-mint-2) border border-(--color-line) p-3 text-[13px] text-(--color-ink-soft)">
        {agent.name.split(' ')[0]} sees the date and time only. The topic and your prep stay with you.
      </div>
    </Modal>
  )
}

export function DeclineModal({ item, onClose }) {
  const { dispatch } = useStore()
  const [reason, setReason] = useState(DECLINE_REASONS[0])
  const [other, setOther] = useState('')
  if (!item) return null
  const agent = agents[item.agentId]
  const final = reason === 'Other' ? (other.trim() ? `Other: ${other.trim()}` : '') : reason
  return (
    <Modal open onClose={onClose} title="Decline this 1:1" subtitle={`${agent.name} · ${TRIGGER_LABEL[item.trigger]} · ${item.topic}`}
      footer={<><Btn variant="outline" onClick={onClose}>Cancel</Btn><Btn disabled={!final} onClick={() => { dispatch({ type: 'decline', queueId: item.id, reason: final }); onClose() }}>Decline session</Btn></>}>
      <div className="text-xs text-(--color-ink-soft) mb-2">Reason (required)</div>
      <div className="flex flex-wrap gap-2">
        {DECLINE_REASONS.map((r) => (
          <button key={r} onClick={() => setReason(r)} className={`text-[13px] px-3 py-1.5 rounded-lg border ${reason === r ? 'border-(--color-teal) bg-(--color-teal-soft) text-(--color-teal-dark) font-semibold' : 'border-(--color-line) hover:bg-(--color-paper)'}`}>{r}</button>
        ))}
      </div>
      {reason === 'Other' && <input value={other} onChange={(e) => setOther(e.target.value)} placeholder="Tell QIQ why" className="mt-3 w-full border border-(--color-line) rounded-lg px-3 py-2 text-sm outline-none focus:border-(--color-teal)" />}
      <div className="mt-4 rounded-lg bg-(--color-paper) p-3 text-[13px] text-(--color-ink-soft)">The session won't count as coached. QIQ puts its topics back on next week's agenda. Critical-failure sessions can't be declined.</div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
export function PrepModal({ item, onClose, onOpenCard, onComplete, onSchedule, onDecline }) {
  const { state } = useStore()
  if (!item) return null
  const q = state.queue.find((x) => x.id === item.id) || item
  const agent = agents[q.agentId]
  const related = cardsFor(state, q.agentId).filter((c) => c.topicKey === q.topicKey)
  const hKey = q.history || related.find((c) => c.brief?.history)?.brief.history || 'new'
  const h = HISTORY[hKey]
  const quotes = related.flatMap((c) => c.quotes || []).slice(0, 3)
  const kpi = agent.kpis[q.kpiKey] || Object.values(agent.kpis)[0]
  const pastSessions = state.queue.filter((x) => x.agentId === q.agentId && x.status === 'closed' && x.id !== q.id)
  const notes = state.notes[q.agentId] || []
  const first = agent.name.split(' ')[0]
  const cf = q.cfId && criticalFailures.find((c) => c.id === q.cfId)
  const st = sessionStatus(q)
  return (
    <Modal open onClose={onClose} width="max-w-2xl" title={`1:1 prep · ${agent.name}`} subtitle={`${TRIGGER_LABEL[q.trigger]}${q.date && q.status === 'scheduled' ? ` · ${fmtDate(q.date)}, ${fmtTime(q.time)}` : ' · not booked yet'}`}
      footer={
        <>
          {q.trigger !== 'critical_failure' && (q.status === 'awaiting' || q.status === 'scheduled') && onDecline && <Btn variant="ghost" onClick={() => { onClose(); onDecline(q) }}>Decline</Btn>}
          <Btn variant="outline" onClick={onClose}>Close</Btn>
          {q.status === 'scheduled' && <Btn onClick={() => { onClose(); onComplete(q) }}>Close out session</Btn>}
          {q.status === 'awaiting' && onSchedule && <Btn onClick={() => { onClose(); onSchedule(q) }}>Book</Btn>}
        </>
      }>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2"><Pill tone={q.trigger === 'critical_failure' ? 'coral' : q.type === 'weekly' ? 'teal' : 'amber'}>{TRIGGER_LABEL[q.trigger]}</Pill><Pill tone={st.tone}>{st.label}</Pill></div>
        <Block label="Why this 1:1">
          <div className="text-[14px] leading-relaxed">{q.whyFlagged}</div>
          {cf && <div className="text-[12.5px] text-(--color-coral) mt-1.5">Critical failure on {cf.interactionId}: {cf.step}.</div>}
        </Block>

        {q.progressReview && (
          <div className="rounded-xl bg-(--color-mint-2) border border-(--color-teal)/20 px-4 py-3 text-[13.5px] flex items-center gap-2"><Sparkles size={15} className="text-(--color-teal-dark)" /> Progress review: nothing negative was routed this week. Open with the positives and the numbers.</div>
        )}

        {q.focus.length > 0 && (
          <Block label="What QIQ recommends focusing on">
            <div className="space-y-3">
              {q.focus.map((f, i) => (
                <div key={i} className="rounded-xl border border-(--color-line) px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2"><span className="text-[14px] font-semibold flex-1">{f.topic}</span>{f.coachAdded && <Pill tone="grey">Added by you</Pill>}</div>
                  <div className="text-[13px] text-(--color-ink-soft)">{f.saw}</div>
                  <div className="text-[13.5px] font-medium text-(--color-teal-dark)">{f.workOn}</div>
                  {f.sop && <div className="text-[12.5px] bg-(--color-paper) rounded-lg px-3 py-1.5"><b>SOP step:</b> {f.sop}</div>}
                  {f.training?.length > 0 && (
                    <div className="text-[12.5px]">
                      {f.training.map((t, j) => (
                        <div key={j} className="flex items-start gap-1.5"><BookOpen size={13} className="text-(--color-blue) mt-0.5 shrink-0" /><span><b>{t.title}</b>, {t.location}. <span className="text-(--color-ink-soft)">{t.why}</span></span></div>
                      ))}
                    </div>
                  )}
                  {f.followup && <FollowupBlock f={f.followup} />}
                </div>
              ))}
            </div>
          </Block>
        )}

        {q.positives?.length > 0 && (
          <Block label="Positives to open with">
            <ul className="space-y-1">
              {q.positives.map((p, i) => <li key={i} className="text-[13.5px] flex gap-2"><CheckCircle2 size={15} className="text-(--color-teal) shrink-0 mt-0.5" />{p}</li>)}
            </ul>
          </Block>
        )}

        {q.talkingPoints?.length > 0 && (
          <Block label="Talking points">
            <ol className="list-decimal pl-5 space-y-1 text-[13.5px]">{q.talkingPoints.map((t, i) => <li key={i}>{t}</li>)}</ol>
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

        {!q.progressReview && (
          <Block label="History on this topic">
            <div className="flex items-center gap-2 text-[13px] mb-2"><Pill tone={h.tone}>{h.label}</Pill> <span className="text-(--color-ink-soft)">{h.text}</span></div>
            <div className="space-y-1.5">
              {related.length === 0 && <div className="text-[13px] text-(--color-ink-soft)">No Q-tips sent on this topic yet.</div>}
              {related.map((c) => (
                <button key={c.id} onClick={() => onOpenCard(c.id)} className="w-full text-left flex items-center gap-3 border border-(--color-line) rounded-lg px-3 py-2 hover:border-(--color-teal)">
                  <span className="flex-1 text-[13px] font-medium">{c.title}</span>
                  <span className="text-[11.5px] text-(--color-ink-mute)">{tierLabel(c)} · {c.deliveredDaysAgo === 0 ? 'today' : `${c.deliveredDaysAgo}d ago`}</span>
                  <Pill tone={statusOf(c).tone}>{statusOf(c).label}</Pill>
                </button>
              ))}
            </div>
          </Block>
        )}

        {quotes.length > 0 && (
          <Block label="From the conversations">
            <Quotes quotes={quotes} />
          </Block>
        )}

        {(pastSessions.length > 0 || notes.length > 0) && (
          <Block label="Last session and your notes">
            <div className="space-y-1.5">
              {pastSessions.map((x) => (
                <div key={x.id} className="text-[13px] bg-(--color-paper) rounded-lg px-3 py-2"><b>{x.topic}</b> · {x.closeOut?.outcome}. {x.closeOut?.note}</div>
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
export function CriticalFailureModal({ item, onClose, onOpenAgent, onPrep, onSchedule }) {
  const { state } = useStore()
  if (!item) return null
  const agent = agents[item.agentId]
  const q = state.queue.find((x) => x.cfId === item.id)
  return (
    <Modal open onClose={onClose} width="max-w-2xl" title={`Critical failure · ${agent.name}`} subtitle={`${item.daysAgo === 1 ? 'Yesterday' : `${item.daysAgo} days ago`} · ${item.channel} · interaction ${item.interactionId}`}
      footer={
        <>
          <Btn variant="outline" onClick={() => { onClose(); onOpenAgent(item.agentId) }}>Open profile</Btn>
          {q && <Btn variant="outline" onClick={() => { onClose(); onPrep(q) }}>Open 1:1 prep</Btn>}
          {q?.status === 'awaiting' && <Btn onClick={() => { onClose(); onSchedule(q) }}>Book the 1:1</Btn>}
          {q?.status === 'scheduled' && <span className="text-[13px] text-(--color-teal-dark) font-medium self-center px-2 inline-flex items-center gap-1"><CheckCircle2 size={14} /> Booked {fmtDate(q.date)} {fmtTime(q.time)}</span>}
        </>
      }>
      <div className="space-y-5">
        <div className="text-[12.5px] text-(--color-ink-soft) flex items-center gap-1.5"><Mail size={13} /> Emailed to you {item.emailedAgo}. Critical-failure sessions can't be declined and are late after 1 working day.</div>
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
          <Quotes quotes={item.quotes} />
        </Block>

        <Block label="Pattern check">
          <div className="text-[13.5px]">{item.pattern}</div>
        </Block>
        <div className="text-[11.5px] text-(--color-ink-mute)">{item.source} · Outcome Matrix evidence layer</div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
const OUTCOMES = ['Improving', 'No change', 'Needs more support']

export function CloseOutModal({ item, onClose }) {
  const { dispatch } = useStore()
  const [happened, setHappened] = useState(true)
  const [outcome, setOutcome] = useState(OUTCOMES[0])
  const [note, setNote] = useState('')
  const [smartOn, setSmartOn] = useState(false)
  const [smart, setSmart] = useState({ specific: '', measurable: '', achievable: '', relevant: '', timebound: '', agreed: false })
  if (!item) return null
  const agent = agents[item.agentId]
  const valid = note.trim().length > 2 && (!smartOn || (smart.specific && smart.measurable && smart.timebound))
  const submit = () => {
    dispatch({ type: 'closeOut', queueId: item.id, closeOut: { happened, outcome: happened ? outcome : 'Did not happen', note, smart: smartOn ? smart : null } })
    onClose()
  }
  return (
    <Modal open onClose={onClose} width="max-w-xl" title="Close out session" subtitle={`${agent.name} · ${TRIGGER_LABEL[item.trigger]} · ${item.topic}`}
      footer={<><Btn variant="outline" onClick={onClose}>Cancel</Btn><Btn disabled={!valid} onClick={submit}>Close out</Btn></>}>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={happened} onChange={(e) => setHappened(e.target.checked)} className="accent-(--color-teal) w-4 h-4" />
        The session happened
      </label>
      {!happened && <div className="text-[12.5px] text-(--color-ink-soft) mt-2">Nothing is counted as coached; QIQ returns the topics to next week's agenda.</div>}
      {happened && (
        <div className="mt-4">
          <div className="text-xs text-(--color-ink-soft) mb-1.5">Outcome</div>
          <div className="flex flex-wrap gap-2">
            {OUTCOMES.map((o) => (
              <button key={o} onClick={() => setOutcome(o)} className={`text-[13px] px-3 py-1.5 rounded-lg border ${outcome === o ? 'border-(--color-teal) bg-(--color-teal-soft) text-(--color-teal-dark) font-semibold' : 'border-(--color-line) hover:bg-(--color-paper)'}`}>{o}</button>
            ))}
          </div>
          {outcome === 'Needs more support' && <div className="text-[12px] text-(--color-ink-soft) mt-2">If this topic has already been coached twice, QIQ checks whether training is needed.</div>}
        </div>
      )}
      <label className="block mt-4">
        <span className="block text-xs text-(--color-ink-soft) mb-1.5">Note (required, editable for 48 hours)</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="What you covered and what you agreed." className="w-full border border-(--color-line) rounded-lg px-3 py-2 text-sm outline-none focus:border-(--color-teal)" />
      </label>

      <div className="mt-4 border border-(--color-line) rounded-xl p-3">
        <label className="flex items-center justify-between text-sm">
          <span>
            <span className="font-medium">SMART form</span>
            <span className="block text-xs text-(--color-ink-soft)">Optional. Switched on per client.</span>
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
      <div className="flex gap-2 mb-3"><Pill tone={c.happened ? 'teal' : 'coral'}>{c.happened ? 'Happened' : 'Did not happen'}</Pill><Pill tone="outline">{c.outcome}</Pill></div>
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
export function TrainingRow({ t, compact }) {
  const { state, dispatch } = useStore()
  const st = state.training[t.id]
  const tone = { open: 'amber', arranged: 'blue', completed: 'teal', not_needed: 'grey' }[st.status]
  return (
    <div className="border border-(--color-line) rounded-lg px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13.5px] font-medium">{compact ? `${agents[t.agentId].name} · ` : ''}{t.topic}</span>
        <Pill tone={tone}>{st.status.replace('_', ' ')}</Pill>
      </div>
      <div className="text-[12.5px] text-(--color-ink-soft) mt-0.5">{t.route} · {t.rationale}</div>
      {t.refs.length > 0 ? (
        <div className="mt-1.5 space-y-0.5">
          {t.refs.map((r, i) => <div key={i} className="text-[12.5px] flex items-start gap-1.5"><BookOpen size={13} className="text-(--color-blue) mt-0.5 shrink-0" /><span><b>{r.title}</b>, {r.location}</span></div>)}
        </div>
      ) : t.contentGap && (
        <div className="mt-1.5 text-[12.5px] text-(--color-amber) flex items-center gap-1.5"><AlertTriangle size={13} /> No matching material found. Flagged to the training team.</div>
      )}
      {(st.status === 'open' || st.status === 'arranged') && (
        <div className="flex gap-1.5 mt-2">
          {st.status === 'open' && <Btn size="sm" variant="outline" onClick={() => dispatch({ type: 'training', recoId: t.id, status: 'arranged' })}>Arranged</Btn>}
          <Btn size="sm" variant="outline" onClick={() => dispatch({ type: 'training', recoId: t.id, status: 'completed' })}>Completed</Btn>
          <Btn size="sm" variant="ghost" onClick={() => dispatch({ type: 'training', recoId: t.id, status: 'not_needed', reason: 'Covered in 1:1' })}>Not needed</Btn>
        </div>
      )}
    </div>
  )
}

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
  const badges = badgesFor(state, agentId)
  const sessions = state.queue.filter((q) => q.agentId === agentId)
  const notes = state.notes[agentId] || []
  const tabs = ['Overview', 'Q-tips', 'Sessions', 'Training', 'Notes']
  const flags = [...criticalFailures, ...attentionItems].filter((x) => x.agentId === agentId)
  const recos = trainingRecos.filter((t) => t.agentId === agentId)
  return (
    <Drawer open onClose={onClose} width="max-w-3xl" title={a.name} subtitle={`${a.email} · ${a.channel}`}
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
            {[[L.level, `Level · ${L.name}`], [<span key="s" className="inline-flex items-center gap-1"><Flame size={16} className="text-(--color-orange)" />{streak}</span>, 'Day streak'], [badges.filter((b) => b.resolved > 0).length, 'Topic badges']].map(([v, k], i) => (
              <div key={i} className="rounded-xl bg-(--color-paper) px-3 py-3 text-center">
                <div className="text-[20px] font-semibold leading-none">{v}</div>
                <div className="text-[11.5px] text-(--color-ink-soft) mt-1">{k}</div>
              </div>
            ))}
          </div>
          {flags.map((f) => (
            <div key={f.id} className={`rounded-xl border px-4 py-3 ${f.type === 'Positive pattern' ? 'border-(--color-teal)/30 bg-(--color-mint-2)' : 'border-(--color-coral)/30 bg-(--color-coral-soft)'}`}>
              <div className={`flex items-center gap-2 text-[13px] font-semibold ${f.type === 'Positive pattern' ? 'text-(--color-teal-dark)' : 'text-(--color-coral)'}`}><AlertTriangle size={14} /> {f.type}</div>
              <div className="text-[13.5px] mt-1">{f.text}</div>
              <div className="text-[11.5px] text-(--color-ink-soft) mt-0.5">{f.source}</div>
            </div>
          ))}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <span key={b.topic} className="inline-flex items-center gap-1.5 text-[12px] border border-(--color-line) rounded-full pl-1 pr-2.5 py-0.5"><BadgeMedal resolved={b.resolved} size={20} />{b.topic}{badgeTier(b.resolved).current ? ` · ${badgeTier(b.resolved).current.tier}` : ''}</span>
              ))}
            </div>
          )}
          <KpiTiles kpis={a.kpis} title="Numbers" />
        </div>
      )}

      {tab === 'Q-tips' && (
        <div className="space-y-2">
          {cards.map((c) => {
            const st = statusOf(c)
            return (
              <button key={c.id} onClick={() => onOpenCard(c.id)} className="w-full text-left flex items-center gap-3 border border-(--color-line) rounded-lg px-3 py-2.5 hover:border-(--color-teal)">
                <span className="w-1 self-stretch rounded" style={{ background: c.tier === TIERS.WEEKLY ? 'var(--color-amber-stripe)' : 'var(--color-teal-stripe)' }} />
                <span className="flex-1">
                  <span className="block text-[13.5px] font-medium">{c.title}</span>
                  <span className="block text-[12px] text-(--color-ink-soft)">{tierLabel(c)} · {c.deliveredDaysAgo === 0 ? 'today' : `${c.deliveredDaysAgo} days ago`}</span>
                </span>
                <Pill tone={st.tone}>{st.label}</Pill>
              </button>
            )
          })}
        </div>
      )}

      {tab === 'Sessions' && (
        <div className="space-y-2">
          {sessions.map((q) => {
            const st = sessionStatus(q)
            return (
              <div key={q.id} className="flex items-center gap-3 border border-(--color-line) rounded-lg px-3 py-2.5">
                <div className="flex-1">
                  <div className="text-[13.5px] font-medium">{q.topic}</div>
                  <div className="text-[12px] text-(--color-ink-soft)">{TRIGGER_LABEL[q.trigger]}{q.date && q.status !== 'awaiting' ? ` · ${fmtDate(q.date)} ${fmtTime(q.time)}` : ''}</div>
                </div>
                <Pill tone={st.tone}>{st.label}</Pill>
                {q.status === 'awaiting' && <Btn size="sm" onClick={() => onSchedule(q)}>Book</Btn>}
                {(q.status === 'scheduled' || q.status === 'awaiting') && <Btn size="sm" variant="outline" onClick={() => onPrep(q)}>Prep</Btn>}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'Training' && (
        <div>
          <div className="text-[13px] text-(--color-ink-soft) mb-3">QIQ recommends training and points to the client's own material. You arrange it and mark it done; QLens reports each change to QIQ.</div>
          <div className="space-y-2">
            {recos.length === 0 && <div className="text-sm text-(--color-ink-soft) py-6 text-center">No training recommended for {a.name.split(' ')[0]}.</div>}
            {recos.map((t) => <TrainingRow key={t.id} t={t} />)}
          </div>
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
