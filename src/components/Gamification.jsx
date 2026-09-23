import { useEffect, useState } from 'react'
import { Flame, Snowflake, Trophy, Target, Sparkles, TrendingUp, CalendarDays, Download, Clock, Zap, Footprints, CheckCheck, BookOpen, Telescope, CalendarCheck } from 'lucide-react'
const Icons = { Flame, Zap, Footprints, CheckCheck, BookOpen, Telescope, CalendarCheck }
import { agents, BADGES, LEVELS, levelFor, XP_RULES } from '../data/qlensData'
import { badgeProgress, streakOf, useStore } from '../lib/store'
import { Btn, Drawer, Illustrative, Modal, Popover, fmtDate, fmtTime } from './ui'

function Tile({ children, onClick, className = '' }) {
  return (
    <button onClick={onClick} className={`text-left bg-white border border-(--color-line) rounded-2xl p-4 hover:border-(--color-teal) hover:shadow-sm transition w-full ${className}`}>
      {children}
    </button>
  )
}

function LevelTile({ agentId }) {
  const { state } = useStore()
  const [open, setOpen] = useState(false)
  const xp = state.progress[agentId].xp
  const L = levelFor(xp)
  return (
    <div className="relative">
      <Tile onClick={() => setOpen((o) => !o)}>
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-(--color-teal) text-white flex flex-col items-center justify-center leading-none">
            <span className="text-[9px] font-semibold opacity-80">LVL</span>
            <span className="text-lg font-bold">{L.level}</span>
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-semibold">{L.name}</span>
              <span className="text-[12px] text-(--color-ink-soft)">{xp.toLocaleString()} XP</span>
            </div>
            <div className="h-2 rounded-full bg-(--color-teal-soft) mt-1.5 overflow-hidden">
              <div className="h-full rounded-full bg-(--color-teal) transition-all duration-700" style={{ width: `${Math.round(L.pct * 100)}%` }} />
            </div>
            <div className="text-[12px] text-(--color-ink-soft) mt-1.5">
              {L.next ? <><b className="text-(--color-ink)">{L.toNext} XP</b> to Level {L.next.level} · {L.next.name}</> : 'Top level reached'}
            </div>
          </div>
        </div>
      </Tile>
      <Popover open={open} onClose={() => setOpen(false)} className="left-0 top-full mt-2 w-80 p-4">
        <div className="text-sm font-semibold mb-2">Level ladder</div>
        <div className="space-y-1">
          {LEVELS.map((l) => {
            const cur = l.level === L.level
            const reached = xp >= l.min
            return (
              <div key={l.level} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] ${cur ? 'bg-(--color-teal-soft) font-semibold text-(--color-teal-dark)' : reached ? 'text-(--color-ink)' : 'text-(--color-ink-mute)'}`}>
                <span>Level {l.level} · {l.name}</span>
                <span>{l.min.toLocaleString()} XP</span>
              </div>
            )
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-(--color-line) text-[12px] text-(--color-ink-soft) space-y-1">
          <div className="font-semibold text-(--color-ink)">How you earn XP</div>
          <div>Q-Bytes: 15 to 20 XP, depending on the finding</div>
          <div>Coaching cards: 35 to 50 XP</div>
          <div>Finish all of today's Q-Bytes: +{XP_RULES.dailyGoal} XP</div>
          <div>Attend a 1:1 coaching session: +{XP_RULES.sessionAttended} XP</div>
        </div>
      </Popover>
    </div>
  )
}

function StreakTile({ agentId }) {
  const { state } = useStore()
  const [open, setOpen] = useState(false)
  const streak = streakOf(state, agentId)
  const p = state.progress[agentId]
  const history = agents[agentId].seed.history
  const days = [...history, p.todayDone ? 'done' : 'today']
  return (
    <div className="relative">
      <Tile onClick={() => setOpen((o) => !o)}>
        <div className="flex items-center gap-3">
          <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${streak > 0 ? 'bg-[#fff1e6] text-(--color-orange)' : 'bg-(--color-paper) text-(--color-ink-mute)'}`}>
            <Flame size={22} className={p.todayDone ? 'anim-flicker' : ''} fill={p.todayDone ? 'currentColor' : 'none'} />
          </span>
          <div>
            <div className="text-[15px] font-semibold">{streak}-day streak</div>
            <div className="text-[12px] text-(--color-ink-soft)">
              {p.todayDone ? 'Today counted. See you tomorrow.' : 'Acknowledge one card today to keep it going'}
            </div>
            <div className="text-[11.5px] text-(--color-blue) mt-0.5 inline-flex items-center gap-1"><Snowflake size={12} /> {p.freezes} streak freeze{p.freezes === 1 ? '' : 's'} left</div>
          </div>
        </div>
      </Tile>
      <Popover open={open} onClose={() => setOpen(false)} className="left-0 top-full mt-2 w-[340px] p-4">
        <div className="text-sm font-semibold">Last 15 days</div>
        <div className="grid grid-cols-5 gap-2 mt-3">
          {days.map((d, i) => {
            const back = days.length - 1 - i
            const date = new Date()
            date.setDate(date.getDate() - back)
            const style = {
              done: 'bg-(--color-orange) text-white',
              freeze: 'bg-(--color-blue-soft) text-(--color-blue)',
              miss: 'bg-(--color-paper) text-(--color-ink-mute)',
              today: 'border-2 border-dashed border-(--color-orange) text-(--color-orange)',
            }[d]
            return (
              <div key={i} className={`h-12 rounded-lg flex flex-col items-center justify-center text-[10px] ${style}`}>
                {d === 'done' ? <Flame size={14} fill="currentColor" /> : d === 'freeze' ? <Snowflake size={14} /> : d === 'today' ? <Flame size={14} /> : <span>·</span>}
                <span className="mt-0.5">{back === 0 ? 'Today' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
              </div>
            )
          })}
        </div>
        <div className="text-[12px] text-(--color-ink-soft) mt-3 leading-relaxed">
          A streak counts every day you acknowledge at least one card. If you miss a day, a <b className="text-(--color-blue)">streak freeze</b> covers it automatically so one busy shift doesn't wipe out your progress. You get 2 freezes a month.
        </div>
      </Popover>
    </div>
  )
}

function GoalTile({ agentId, todays, onStart }) {
  const done = todays.filter((c) => c.status === 'done').length
  const total = todays.length
  const pct = total ? done / total : 0
  const r = 18
  const c = 2 * Math.PI * r
  const finished = total > 0 && done === total
  return (
    <Tile onClick={onStart}>
      <div className="flex items-center gap-3">
        <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0">
          <circle cx="22" cy="22" r={r} fill="none" stroke="var(--color-teal-soft)" strokeWidth="5" />
          <circle cx="22" cy="22" r={r} fill="none" stroke="var(--color-teal)" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 22 22)" style={{ transition: 'stroke-dashoffset .6s' }} />
          <text x="22" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-ink)">{done}/{total}</text>
        </svg>
        <div>
          <div className="text-[15px] font-semibold">{finished ? 'Daily goal complete' : "Today's goal"}</div>
          <div className="text-[12px] text-(--color-ink-soft)">
            {finished ? `+${XP_RULES.dailyGoal} XP bonus earned` : `Finish today's cards for a +${XP_RULES.dailyGoal} XP bonus`}
          </div>
          {!finished && <div className="text-[11.5px] text-(--color-teal-dark) font-semibold mt-0.5">Start next card →</div>}
        </div>
      </div>
    </Tile>
  )
}

export function GameStrip({ agentId, todays, onStart }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <LevelTile agentId={agentId} />
      <StreakTile agentId={agentId} />
      <GoalTile agentId={agentId} todays={todays} onStart={onStart} />
    </div>
  )
}

function BadgeIcon({ name, size = 20 }) {
  const I = Icons[name] || Trophy
  return <I size={size} />
}

export function BadgeShelf({ agentId }) {
  const { state } = useStore()
  const [sel, setSel] = useState(null)
  const list = badgeProgress(state, agentId)
  const earned = list.filter((b) => b.earnedAt).length
  const b = sel && list.find((x) => x.id === sel)
  return (
    <div className="bg-white border border-(--color-line) rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[14px] font-semibold">Badges</div>
        <span className="text-[12px] text-(--color-ink-soft)">{earned} of {list.length}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {list.map((x) => (
          <button key={x.id} onClick={() => setSel(x.id)} title={x.name} className="flex flex-col items-center gap-1 p-1.5 rounded-xl hover:bg-(--color-paper)">
            <span className={`w-11 h-11 rounded-full flex items-center justify-center ${x.earnedAt ? 'text-white shadow-sm' : 'bg-(--color-paper) text-(--color-ink-mute) border border-dashed border-(--color-line)'}`} style={x.earnedAt ? { background: 'linear-gradient(135deg, #4fd1b5, var(--color-teal-dark))' } : undefined}>
              <BadgeIcon name={x.icon} size={18} />
            </span>
            <span className={`text-[10.5px] leading-tight text-center ${x.earnedAt ? 'text-(--color-ink)' : 'text-(--color-ink-mute)'}`}>{x.name}</span>
          </button>
        ))}
      </div>
      <div className="text-[11px] text-(--color-ink-mute) mt-2">Effort badges only. Skill badges wait on the badging decision.</div>
      <Modal open={!!b} onClose={() => setSel(null)} width="max-w-sm">
        {b && (
          <div className="text-center py-2">
            <span className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${b.earnedAt ? 'text-white' : 'bg-(--color-paper) text-(--color-ink-mute) border border-dashed border-(--color-line)'}`} style={b.earnedAt ? { background: 'linear-gradient(135deg, #4fd1b5, var(--color-teal-dark))' } : undefined}>
              <BadgeIcon name={b.icon} size={34} />
            </span>
            <div className="text-lg font-semibold mt-3">{b.name}</div>
            <div className="text-sm text-(--color-ink-soft) mt-1">{b.desc}</div>
            {b.earnedAt ? (
              <div className="text-sm text-(--color-teal-dark) font-medium mt-4">Earned {new Date(b.earnedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</div>
            ) : (
              <div className="mt-4">
                <div className="h-2 rounded-full bg-(--color-paper) overflow-hidden">
                  <div className="h-full bg-(--color-teal) rounded-full" style={{ width: `${(b.value / b.goal) * 100}%` }} />
                </div>
                <div className="text-xs text-(--color-ink-soft) mt-1.5">{b.value} of {b.goal} · {b.goal - b.value} to go</div>
              </div>
            )}
            <Btn className="mt-5" variant="outline" onClick={() => setSel(null)}>Close</Btn>
          </div>
        )}
      </Modal>
    </div>
  )
}

export function WinCard({ agentId }) {
  const win = agents[agentId].win
  if (!win) return null
  return (
    <div className="rounded-2xl p-4 border border-(--color-teal)/30" style={{ background: 'linear-gradient(135deg, #eafaf5, #ffffff)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-(--color-teal-dark)"><TrendingUp size={16} /> Your coaching is working</div>
        <Illustrative />
      </div>
      <div className="text-[22px] font-semibold mt-2">{win.delta}</div>
      <div className="text-[13px] text-(--color-ink-soft)">{win.kpi} since {win.since}.</div>
    </div>
  )
}

function ics(session, agentName) {
  const [y, m, d] = session.date.split('-')
  const [hh, mm] = session.time.split(':')
  const start = `${y}${m}${d}T${hh}${mm}00`
  const endH = String(Number(hh) + 1).padStart(2, '0')
  const end = `${y}${m}${d}T${endH}${mm}00`
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//QLens//Demo//EN', 'BEGIN:VEVENT',
    `UID:${session.id}@qlens`, `DTSTAMP:${start}`, `DTSTART:${start}`, `DTEND:${end}`,
    'SUMMARY:1:1 coaching session', `DESCRIPTION:Coaching session with your coach (${agentName}).`, 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'qlens-coaching-session.ics'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function CalendarButton({ s, agentName, compact }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const text = `1:1 coaching session · ${fmtDate(s.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${fmtTime(s.time)} · with your coach`
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      const el = document.getElementById(`cal-text-${s.id}`)
      if (el) {
        const r = document.createRange()
        r.selectNodeContents(el)
        window.getSelection().removeAllRanges()
        window.getSelection().addRange(r)
      }
    }
  }
  return (
    <div className={`relative ${compact ? '' : 'mt-3'}`}>
      <button onClick={() => { setOpen((o) => !o); setCopied(false) }} className="w-full inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold text-(--color-teal-dark) px-2.5 py-2 rounded-lg border border-(--color-line) bg-white hover:border-(--color-teal)">
        <CalendarDays size={13} /> Add to calendar
      </button>
      <Popover open={open} onClose={() => setOpen(false)} className={`${compact ? 'right-0 w-72' : 'left-0 right-0'} top-full mt-2 p-3`}>
        <div id={`cal-text-${s.id}`} className="text-[12.5px] leading-relaxed select-text">{text}</div>
        <div className="flex gap-2 mt-3">
          <Btn size="sm" onClick={copy}>{copied ? 'Copied' : 'Copy details'}</Btn>
          {!import.meta.env.VITE_ARTIFACT && <Btn size="sm" variant="outline" onClick={() => ics(s, agentName)}><Download size={12} /> .ics file</Btn>}
        </div>
      </Popover>
    </div>
  )
}

export function UpcomingSessions({ agentId }) {
  const { state } = useStore()
  const sessions = state.queue.filter((q) => q.agentId === agentId && q.status === 'scheduled').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  return (
    <div className="bg-white border border-(--color-line) rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[14px] font-semibold">Upcoming 1:1 coaching</div>
        <span className="text-[11px] text-(--color-ink-mute)">+{XP_RULES.sessionAttended} XP for attending</span>
      </div>
      {sessions.length === 0 ? (
        <div className="text-[13px] text-(--color-ink-soft) border border-dashed border-(--color-line) rounded-xl p-4 text-center">Nothing scheduled right now.</div>
      ) : (
        <div className="space-y-2.5">
          {sessions.map((s) => (
            <div key={s.id} className="rounded-xl border border-(--color-line) p-3.5 bg-(--color-mint-2)">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white border border-(--color-line) flex flex-col items-center justify-center leading-none shrink-0">
                  <span className="text-[9.5px] font-semibold text-(--color-coral) uppercase">{fmtDate(s.date, { month: 'short' })}</span>
                  <span className="text-lg font-bold">{fmtDate(s.date, { day: 'numeric' })}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold">{fmtDate(s.date, { weekday: 'long' })}</div>
                  <div className="text-[12.5px] text-(--color-ink-soft) flex items-center gap-1 whitespace-nowrap"><Clock size={12} /> {fmtTime(s.time)} · with your coach</div>
                </div>
              </div>
              <CalendarButton s={s} agentName={agents[agentId].name} />
            </div>
          ))}
        </div>
      )}
      <div className="text-[11px] text-(--color-ink-mute) mt-2.5 flex items-center gap-1"><CalendarDays size={12} /> Your coach prepares the session. Just turn up.</div>
    </div>
  )
}

function Confetti() {
  const colors = ['#36bfa4', '#f08a24', '#3987e5', '#ecc77a', '#227363']
  return (
    <div className="absolute inset-x-0 top-0 h-0 pointer-events-none">
      {Array.from({ length: 28 }).map((_, i) => (
        <span key={i} className="confetti" style={{ left: `${(i * 37) % 100}%`, background: colors[i % colors.length], animationDelay: `${(i % 7) * 0.07}s` }} />
      ))}
    </div>
  )
}

export function Celebrations({ agentId }) {
  const { state, dispatch } = useStore()
  const list = state.celebrations[agentId] || []
  const toasts = list.filter((c) => c.type === 'xp' || c.type === 'goal')
  const big = list.find((c) => c.type === 'badge' || c.type === 'level')

  useEffect(() => {
    if (!toasts.length) return
    const t = setTimeout(() => dispatch({ type: 'dismissCelebration', agentId, id: toasts[0].id }), 2400)
    return () => clearTimeout(t)
  }, [toasts.length, toasts[0]?.id]) // eslint-disable-line

  const badge = big?.type === 'badge' ? BADGES.find((b) => b.id === big.badgeId) : null
  return (
    <>
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
        {toasts.slice(0, 2).map((t) => (
          <div key={t.id} className="anim-pop flex items-center gap-2 bg-(--color-ink) text-white rounded-full pl-2 pr-4 py-2 shadow-xl">
            <span className="w-7 h-7 rounded-full bg-(--color-teal) flex items-center justify-center">{t.type === 'goal' ? <Target size={15} /> : <Zap size={15} fill="currentColor" />}</span>
            <span className="text-sm font-semibold">+{t.amount} XP</span>
            <span className="text-sm text-white/70">{t.type === 'goal' ? "Daily goal complete" : t.reason}</span>
          </div>
        ))}
      </div>
      {big && toasts.length === 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onMouseDown={() => dispatch({ type: 'dismissCelebration', agentId, id: big.id })}>
          <div className="relative anim-pop bg-white rounded-3xl shadow-2xl w-[340px] p-7 text-center overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
            <Confetti />
            <span className="mx-auto w-20 h-20 rounded-full flex items-center justify-center text-white shadow-md" style={{ background: 'linear-gradient(135deg, #4fd1b5, var(--color-teal-dark))' }}>
              {badge ? <BadgeIcon name={badge.icon} size={34} /> : <Sparkles size={34} />}
            </span>
            <div className="text-[11px] font-semibold tracking-[0.14em] text-(--color-teal-dark) mt-4">{badge ? 'BADGE UNLOCKED' : 'LEVEL UP'}</div>
            <div className="text-xl font-semibold mt-1">{badge ? badge.name : `Level ${big.level} · ${big.name}`}</div>
            <div className="text-sm text-(--color-ink-soft) mt-1">{badge ? badge.desc : (() => { const L = levelFor(state.progress[agentId].xp); return L.next ? `${L.toNext} XP to Level ${L.next.level}. Your next card gets you closer.` : 'You have reached the top level.' })()}</div>
            <Btn className="mt-5 w-full" onClick={() => dispatch({ type: 'dismissCelebration', agentId, id: big.id })}>{badge ? 'Add it to my collection' : "Let's keep going"}</Btn>
          </div>
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Calmer layout pieces (v3)
// ---------------------------------------------------------------------------
export function nextBadge(state, agentId) {
  const open = badgeProgress(state, agentId).filter((b) => !b.earnedAt)
  if (!open.length) return null
  return open.sort((a, b) => b.value / b.goal - a.value / a.goal)[0]
}

function badgeHint(b) {
  const left = b.goal - b.value
  if (b.metric === 'streak') return `${left} more day${left === 1 ? '' : 's'} of streak`
  if (b.metric === 'acked') return `${left} more card${left === 1 ? '' : 's'}`
  if (b.metric === 'sessions') return 'attend your next 1:1'
  if (b.metric === 'coachingAcked') return 'acknowledge a Coaching card'
  return 'finish all of a day’s cards'
}

export function ProgressChips({ agentId, doneToday, total, onOpen }) {
  const { state } = useStore()
  const L = levelFor(state.progress[agentId].xp)
  const streak = streakOf(state, agentId)
  const lit = state.progress[agentId].todayDone
  const r = 15
  const c = 2 * Math.PI * r
  return (
    <button onClick={onOpen} className="flex items-center gap-4 bg-white border border-(--color-line) rounded-full pl-1.5 pr-4 py-1.5 hover:border-(--color-teal) transition">
      <span className="flex items-center gap-2">
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r={r} fill="none" stroke="var(--color-teal-soft)" strokeWidth="3.5" />
          <circle cx="18" cy="18" r={r} fill="none" stroke="var(--color-teal)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - L.pct)} transform="rotate(-90 18 18)" style={{ transition: 'stroke-dashoffset .6s' }} />
          <text x="18" y="22" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--color-ink)">{L.level}</text>
        </svg>
        <span className="text-left leading-tight">
          <span className="block text-[13px] font-semibold">{L.name}</span>
          <span className="block text-[11px] text-(--color-ink-soft)">{L.next ? `${L.toNext} XP to next` : 'Top level'}</span>
        </span>
      </span>
      <span className="w-px h-7 bg-(--color-line)" />
      <span className="flex items-center gap-1.5 text-[13px] font-semibold">
        <Flame size={17} className={lit ? 'text-(--color-orange) anim-flicker' : 'text-(--color-ink-mute)'} fill={lit ? 'currentColor' : 'none'} /> {streak}
        <span className="font-normal text-(--color-ink-soft) hidden sm:inline">day streak</span>
      </span>
      <span className="w-px h-7 bg-(--color-line) hidden sm:block" />
      <span className="hidden sm:block text-[13px]"><b>{doneToday}</b><span className="text-(--color-ink-soft)"> of {total} today</span></span>
    </button>
  )
}

export function NextBadgeLine({ agentId, onOpen }) {
  const { state } = useStore()
  const b = nextBadge(state, agentId)
  if (!b) return null
  return (
    <button onClick={onOpen} className="inline-flex items-center gap-2 text-[13px] text-(--color-ink-soft) hover:text-(--color-ink)">
      <span className="w-6 h-6 rounded-full bg-(--color-paper) border border-dashed border-(--color-line) flex items-center justify-center text-(--color-ink-mute)"><BadgeIcon name={b.icon} size={12} /></span>
      <span>Next badge: <b className="text-(--color-ink) font-semibold">{b.name}</b>, {badgeHint(b)}</span>
    </button>
  )
}

function StreakGrid({ agentId }) {
  const { state } = useStore()
  const p = state.progress[agentId]
  const days = [...agents[agentId].seed.history, p.todayDone ? 'done' : 'today']
  return (
    <div className="grid grid-cols-5 gap-2">
      {days.map((d, i) => {
        const back = days.length - 1 - i
        const date = new Date()
        date.setDate(date.getDate() - back)
        const style = { done: 'bg-(--color-orange) text-white', freeze: 'bg-(--color-paper) text-(--color-ink-soft) border border-(--color-line)', miss: 'bg-(--color-paper) text-(--color-ink-mute)', today: 'border-2 border-dashed border-(--color-orange) text-(--color-orange)' }[d]
        return (
          <div key={i} className={`h-12 rounded-lg flex flex-col items-center justify-center text-[10px] ${style}`}>
            {d === 'done' ? <Flame size={14} fill="currentColor" /> : d === 'freeze' ? <Snowflake size={14} /> : d === 'today' ? <Flame size={14} /> : <span>·</span>}
            <span className="mt-0.5">{back === 0 ? 'Today' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          </div>
        )
      })}
    </div>
  )
}

function BadgeDot({ b, size = 44, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 w-[76px]">
      <span className={`rounded-full flex items-center justify-center ${b.earnedAt ? 'text-white shadow-sm' : 'bg-(--color-paper) text-(--color-ink-mute) border border-dashed border-(--color-line)'}`} style={{ width: size, height: size, ...(b.earnedAt ? { background: 'linear-gradient(135deg, #4fd1b5, var(--color-teal-dark))' } : {}) }}>
        <BadgeIcon name={b.icon} size={size * 0.4} />
      </span>
      <span className={`text-[11px] leading-tight text-center ${b.earnedAt ? '' : 'text-(--color-ink-mute)'}`}>{b.name}</span>
    </button>
  )
}

export function ProgressDrawer({ agentId, open, onClose }) {
  const { state } = useStore()
  const [tab, setTab] = useState('Level')
  const [all, setAll] = useState(false)
  const [sel, setSel] = useState(null)
  if (!open) return null
  const p = state.progress[agentId]
  const xp = p.xp
  const L = levelFor(xp)
  const streak = streakOf(state, agentId)
  const badges = badgeProgress(state, agentId)
  const earned = badges.filter((b) => b.earnedAt)
  const nb = nextBadge(state, agentId)
  const upcoming = LEVELS.filter((l) => l.level > L.level).slice(0, 2)
  const week = [...agents[agentId].seed.history.slice(-6), p.todayDone ? 'done' : 'today']
  const Stat = ({ k, v, sub }) => (
    <button onClick={() => setTab(k)} className={`flex-1 rounded-xl px-3 py-3 text-center transition ${tab === k ? 'bg-(--color-mint) ring-1 ring-(--color-teal)/40' : 'hover:bg-(--color-paper)'}`}>
      <div className="text-[22px] font-semibold leading-none">{v}</div>
      <div className="text-[12px] text-(--color-ink-soft) mt-1">{sub}</div>
    </button>
  )
  const picked = sel && badges.find((b) => b.id === sel)
  return (
    <Modal open onClose={onClose} title="Your progress" width="max-w-md"
      footer={<span className="text-[11.5px] text-(--color-ink-mute) text-center">Q-Byte 15 to 20 XP · Coaching card 35 to 50 XP · full day +{XP_RULES.dailyGoal} · 1:1 attended +{XP_RULES.sessionAttended}</span>}>
      <div className="flex gap-2">
        <Stat k="Level" v={L.level} sub={L.name} />
        <Stat k="Streak" v={<span className="inline-flex items-center gap-1"><Flame size={18} className="text-(--color-orange)" fill="currentColor" />{streak}</span>} sub="day streak" />
        <Stat k="Badges" v={`${earned.length}/${badges.length}`} sub="badges" />
      </div>

      <div className="mt-5 min-h-[190px]">
        {tab === 'Level' && (
          <div className="anim-rise">
            <div className="flex justify-between text-[13px]"><span className="font-semibold">Level {L.level} · {L.name}</span><span className="text-(--color-ink-soft)">{xp.toLocaleString()} XP</span></div>
            <div className="h-2.5 rounded-full bg-(--color-teal-soft) mt-2 overflow-hidden"><div className="h-full bg-(--color-teal) rounded-full" style={{ width: `${Math.round(L.pct * 100)}%` }} /></div>
            <div className="text-[13px] text-(--color-ink-soft) mt-2">{L.next ? <><b className="text-(--color-ink)">{L.toNext} XP</b> to Level {L.next.level}</> : 'Top level reached'}</div>
            <div className="mt-5 space-y-2">
              {upcoming.map((l) => (
                <div key={l.level} className="flex justify-between items-center border border-(--color-line) rounded-lg px-3 py-2 text-[13px]">
                  <span>Level {l.level} · {l.name}</span><span className="text-(--color-ink-mute)">{l.min.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'Streak' && (
          <div className="anim-rise">
            <div className="grid grid-cols-7 gap-1.5">
              {week.map((d, i) => {
                const back = week.length - 1 - i
                const date = new Date()
                date.setDate(date.getDate() - back)
                const style = { done: 'bg-(--color-orange) text-white', freeze: 'bg-(--color-paper) text-(--color-ink-soft) border border-(--color-line)', miss: 'bg-(--color-paper) text-(--color-ink-mute)', today: 'border-2 border-dashed border-(--color-orange) text-(--color-orange)' }[d]
                return (
                  <div key={i} className={`h-14 rounded-lg flex flex-col items-center justify-center text-[10.5px] ${style}`}>
                    {d === 'done' ? <Flame size={15} fill="currentColor" /> : d === 'freeze' ? <Snowflake size={15} /> : d === 'today' ? <Flame size={15} /> : <span>·</span>}
                    <span className="mt-1">{back === 0 ? 'Today' : date.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-2 mt-4 text-[13px]"><Snowflake size={15} className="text-(--color-ink-soft)" /> <b>{p.freezes}</b> streak freeze{p.freezes === 1 ? '' : 's'} left this month</div>
            <div className="text-[12.5px] text-(--color-ink-soft) mt-1.5">Read one card a day to keep it going. A freeze covers a missed day automatically.</div>
          </div>
        )}
        {tab === 'Badges' && (
          <div className="anim-rise">
            {nb && (
              <div className="rounded-xl border border-(--color-line) p-3 flex items-center gap-3">
                <span className="w-11 h-11 rounded-full bg-(--color-paper) border border-dashed border-(--color-line) flex items-center justify-center text-(--color-ink-mute)"><BadgeIcon name={nb.icon} size={18} /></span>
                <div className="flex-1">
                  <div className="text-[13px]"><span className="text-(--color-ink-soft)">Next up:</span> <b>{nb.name}</b></div>
                  <div className="h-1.5 rounded-full bg-(--color-paper) mt-1.5 overflow-hidden"><div className="h-full bg-(--color-teal) rounded-full" style={{ width: `${(nb.value / nb.goal) * 100}%` }} /></div>
                  <div className="text-[11.5px] text-(--color-ink-soft) mt-1">{nb.desc} {nb.value} of {nb.goal}.</div>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-1 mt-4 justify-center">
              {(all ? badges : earned).map((b) => <BadgeDot key={b.id} b={b} onClick={() => setSel(b.id)} />)}
            </div>
            <div className="text-center mt-2">
              <button onClick={() => setAll((x) => !x)} className="text-[12.5px] font-semibold text-(--color-teal-dark) hover:underline">{all ? 'Show earned only' : `See all ${badges.length} badges`}</button>
            </div>
            {picked && (
              <div className="mt-3 text-center text-[12.5px] text-(--color-ink-soft) bg-(--color-paper) rounded-lg px-3 py-2">
                <b className="text-(--color-ink)">{picked.name}</b> · {picked.desc} {picked.earnedAt ? `Earned ${new Date(picked.earnedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}.` : `${picked.value} of ${picked.goal} so far.`}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

export function SessionBanner({ agentId }) {
  const { state } = useStore()
  const s = state.queue.filter((q) => q.agentId === agentId && q.status === 'scheduled').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0]
  if (!s) return null
  return (
    <div className="flex flex-wrap items-center gap-3 bg-white border border-(--color-line) rounded-xl px-4 py-2.5">
      <CalendarDays size={17} className="text-(--color-teal-dark)" />
      <span className="text-[14px]"><b>1:1 coaching</b> with your coach · {fmtDate(s.date, { weekday: 'long', day: 'numeric', month: 'short' })}, {fmtTime(s.time)}</span>
      <span className="text-[12px] text-(--color-ink-mute)">+{XP_RULES.sessionAttended} XP for attending</span>
      <div className="ml-auto w-[170px]"><CalendarButton s={s} agentName={agents[agentId].name} compact /></div>
    </div>
  )
}
