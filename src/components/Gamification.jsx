import { useEffect, useState } from 'react'
import { Award, CalendarDays, Crown, Download, Flame, Hourglass, Medal, Snowflake, Sparkles, Target, TrendingUp, Trophy, Zap } from 'lucide-react'
import { agents, BADGE_TIERS, badgeTier, COACH, LEADERBOARD, LEVELS, levelFor, XP_RULES } from '../data/qlensData'
import { badgesFor, streakOf, useStore, weekXp } from '../lib/store'
import { Btn, Modal, Popover, fmtDate, fmtTime } from './ui'

// ---------------------------------------------------------------------------
// Calendar (.ics)
// ---------------------------------------------------------------------------
function ics(session, agentName) {
  const [y, m, d] = session.date.split('-')
  const [hh, mm] = session.time.split(':')
  const start = `${y}${m}${d}T${hh}${mm}00`
  const endH = String(Number(hh) + 1).padStart(2, '0')
  const end = `${y}${m}${d}T${endH}${mm}00`
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//QLens//Demo//EN', 'BEGIN:VEVENT',
    `UID:${session.id}@qlens`, `DTSTAMP:${start}`, `DTSTART:${start}`, `DTEND:${end}`,
    'SUMMARY:1:1 with your coach', `DESCRIPTION:1:1 with your coach (${agentName}).`, 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'qlens-1to1.ics'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function CalendarButton({ s, agentName, compact }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const text = `1:1 with your coach · ${fmtDate(s.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${fmtTime(s.time)}`
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

export function SessionBanner({ agentId }) {
  const { state } = useStore()
  const s = state.queue.filter((q) => q.agentId === agentId && q.status === 'scheduled').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0]
  if (!s) return null
  return (
    <div className="flex flex-wrap items-center gap-3 bg-white border border-(--color-line) rounded-xl px-4 py-2.5">
      <CalendarDays size={17} className="text-(--color-teal-dark)" />
      <span className="text-[14px]"><b>1:1 with your coach</b> · {fmtDate(s.date, { weekday: 'long', day: 'numeric', month: 'short' })}, {fmtTime(s.time)}</span>
      <span className="text-[12px] text-(--color-ink-mute)">+{XP_RULES.sessionAttended} XP for attending</span>
      <div className="ml-auto w-[170px]"><CalendarButton s={s} agentName={agents[agentId].name} compact /></div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------
export function BadgeMedal({ resolved, size = 40 }) {
  const { current } = badgeTier(resolved)
  return (
    <span className={`rounded-full flex items-center justify-center shrink-0 ${current ? 'text-white shadow-sm' : 'bg-(--color-paper) text-(--color-ink-mute) border border-dashed border-(--color-line)'}`}
      style={{ width: size, height: size, ...(current ? { background: `linear-gradient(135deg, ${current.color}, ${current.color}cc)` } : {}) }}>
      <Medal size={size * 0.45} />
    </span>
  )
}

function nextBadge(state, agentId) {
  const list = badgesFor(state, agentId).map((b) => ({ ...b, ...badgeTier(b.resolved) })).filter((b) => b.next)
  if (!list.length) return null
  return list.sort((a, b) => a.toNext - b.toNext)[0]
}

export function NextBadgeLine({ agentId, onOpen }) {
  const { state } = useStore()
  const b = nextBadge(state, agentId)
  if (!b) return null
  return (
    <button onClick={onOpen} className="inline-flex items-center gap-2 text-[13px] text-(--color-ink-soft) hover:text-(--color-ink)">
      <BadgeMedal resolved={b.resolved} size={24} />
      <span>Next badge: <b className="text-(--color-ink) font-semibold">{b.next.tier} in {b.topic.toLowerCase()}</b>, {b.toNext} more confirmed improvement{b.toNext === 1 ? '' : 's'}</span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Celebrations: instant XP toasts, pending bonus, level-ups
// ---------------------------------------------------------------------------
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
  const toasts = list.filter((c) => c.type === 'xp' || c.type === 'goal' || c.type === 'pending')
  const big = list.find((c) => c.type === 'level')

  useEffect(() => {
    if (!toasts.length) return
    const t = setTimeout(() => dispatch({ type: "dismissCelebration", agentId, id: toasts[0].id }), 1700)
    return () => clearTimeout(t)
  }, [toasts.length, toasts[0]?.id]) // eslint-disable-line

  return (
    <>
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
        {toasts.slice(0, 2).map((t) => (
          <div key={t.id} className="anim-pop flex items-center gap-2 bg-(--color-ink) text-white rounded-full pl-2 pr-4 py-2 shadow-xl">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center ${t.type === 'pending' ? 'bg-white/20' : 'bg-(--color-teal)'}`}>
              {t.type === 'goal' ? <Target size={15} /> : t.type === 'pending' ? <Hourglass size={15} /> : <Zap size={15} fill="currentColor" />}
            </span>
            <span className="text-sm font-semibold">+{t.amount} XP</span>
            <span className="text-sm text-white/70">{t.type === 'goal' ? 'Daily goal complete' : t.type === 'pending' ? 'Implemented Bonus, pending' : t.reason}</span>
          </div>
        ))}
      </div>
      {big && toasts.length === 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onMouseDown={() => dispatch({ type: 'dismissCelebration', agentId, id: big.id })}>
          <div className="relative anim-pop bg-white rounded-3xl shadow-2xl w-[340px] p-7 text-center overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
            <Confetti />
            <span className="mx-auto w-20 h-20 rounded-full flex items-center justify-center text-white shadow-md" style={{ background: 'linear-gradient(135deg, #4fd1b5, var(--color-teal-dark))' }}>
              <Sparkles size={34} />
            </span>
            <div className="text-[11px] font-semibold tracking-[0.14em] text-(--color-teal-dark) mt-4">LEVEL UP</div>
            <div className="text-xl font-semibold mt-1">Level {big.level} · {big.name}</div>
            <div className="text-sm text-(--color-ink-soft) mt-1">{(() => { const L = levelFor(state.progress[agentId].xp); return L.next ? `${L.toNext} XP to Level ${L.next.level}.` : 'You have reached the top level.' })()}</div>
            <Btn className="mt-5 w-full" onClick={() => dispatch({ type: 'dismissCelebration', agentId, id: big.id })}>Let's keep going</Btn>
          </div>
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Progress pill and panel
// ---------------------------------------------------------------------------
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

const DAY_STYLE = {
  done: 'bg-(--color-orange) text-white',
  freeze: 'bg-(--color-blue-soft) text-(--color-blue)',
  none: 'bg-white text-(--color-ink-mute) border border-dashed border-(--color-line)',
  miss: 'bg-(--color-paper) text-(--color-ink-mute)',
  today: 'border-2 border-dashed border-(--color-orange) text-(--color-orange)',
}
function DayIcon({ d, size }) {
  if (d === 'done') return <Flame size={size} fill="currentColor" />
  if (d === 'freeze') return <Snowflake size={size} />
  if (d === 'today') return <Flame size={size} />
  if (d === 'none') return <span className="text-[10px]">–</span>
  return <span>·</span>
}

export function ProgressDrawer({ agentId, open, onClose }) {
  const { state } = useStore()
  const [tab, setTab] = useState('Level')
  if (!open) return null
  const p = state.progress[agentId]
  const xp = p.xp
  const L = levelFor(xp)
  const streak = streakOf(state, agentId)
  const badges = badgesFor(state, agentId).map((b) => ({ ...b, ...badgeTier(b.resolved) }))
  const earnedBadges = badges.filter((b) => b.current).length
  const days = [...agents[agentId].seed.history, p.todayDone ? 'done' : 'today']
  const pending = p.growth.filter((g) => g.status === 'pending')
  const earned = p.growth.filter((g) => g.status === 'earned')

  // Leaderboard: XP earned this week (team board) and team totals (campaign)
  const team = Object.keys(agents).map((id) => ({ id, xp: weekXp(state, id) })).sort((a, b) => b.xp - a.xp)
  const myRank = team.findIndex((x) => x.id === agentId) + 1
  const teamTotal = team.reduce((n, x) => n + x.xp, 0)
  const campaign = [...LEADERBOARD.otherTeams, { name: COACH.team, xp: teamTotal, mine: true }].sort((a, b) => b.xp - a.xp)

  const tabs = ['Level', 'Streak', 'Badges', 'Leaderboard']
  return (
    <Modal open onClose={onClose} title="Your progress" width="max-w-md"
      footer={<span className="text-[11.5px] text-(--color-ink-mute) text-center">Q-tip read +{XP_RULES.dailyRead} · weekly Q-tip +{XP_RULES.weeklyRead} · full day +{XP_RULES.dailyGoal} · 1:1 attended +{XP_RULES.sessionAttended} · tip applied +{XP_RULES.implementedBonus}</span>}>
      <div className="flex gap-1 bg-(--color-paper) rounded-xl p-1">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 text-[12.5px] py-1.5 rounded-lg ${tab === t ? 'bg-white shadow-sm font-semibold' : 'text-(--color-ink-soft)'}`}>{t}</button>
        ))}
      </div>

      <div className="mt-5 min-h-[230px]">
        {tab === 'Level' && (
          <div className="anim-rise">
            <div className="flex justify-between text-[13px]"><span className="font-semibold">Level {L.level} · {L.name}</span><span className="text-(--color-ink-soft)">{xp.toLocaleString()} XP</span></div>
            <div className="h-2.5 rounded-full bg-(--color-teal-soft) mt-2 overflow-hidden"><div className="h-full bg-(--color-teal) rounded-full" style={{ width: `${Math.round(L.pct * 100)}%` }} /></div>
            <div className="text-[13px] text-(--color-ink-soft) mt-2">{L.next ? <><b className="text-(--color-ink)">{L.toNext} XP</b> to Level {L.next.level} · {L.next.name}</> : 'Top level reached'}</div>
            {(pending.length > 0 || earned.length > 0) && (
              <div className="mt-5">
                <div className="text-[12px] font-semibold text-(--color-ink-soft) mb-2">Implemented Bonus</div>
                <div className="space-y-1.5">
                  {pending.map((g) => (
                    <div key={g.id} className="flex items-center gap-2 rounded-lg border border-dashed border-(--color-line) px-3 py-2 text-[13px] text-(--color-ink-soft)">
                      <Hourglass size={14} /> <span className="flex-1">{g.topic}</span> <span className="font-semibold">+{g.amount} pending</span>
                    </div>
                  ))}
                  {earned.map((g) => (
                    <div key={g.id} className="flex items-center gap-2 rounded-lg bg-(--color-mint-2) px-3 py-2 text-[13px]">
                      <TrendingUp size={14} className="text-(--color-teal-dark)" /> <span className="flex-1">{g.topic}</span> <span className="font-semibold text-(--color-teal-dark)">+{g.amount} earned</span>
                    </div>
                  ))}
                </div>
                <div className="text-[11.5px] text-(--color-ink-mute) mt-1.5">Pending XP counts once the topic stays clear for {XP_RULES.confirmDays} days.</div>
              </div>
            )}
            <div className="mt-4 space-y-1">
              {LEVELS.filter((l) => l.level > L.level).slice(0, 2).map((l) => (
                <div key={l.level} className="flex justify-between items-center border border-(--color-line) rounded-lg px-3 py-2 text-[13px]">
                  <span>Level {l.level} · {l.name}</span><span className="text-(--color-ink-mute)">{l.min.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Streak' && (
          <div className="anim-rise">
            <div className="flex items-baseline gap-2"><Flame size={20} className="text-(--color-orange) self-center" fill="currentColor" /><span className="text-[22px] font-semibold">{streak}</span><span className="text-[13px] text-(--color-ink-soft)">day streak</span></div>
            <div className="grid grid-cols-5 gap-1.5 mt-3">
              {days.map((d, i) => {
                const back = days.length - 1 - i
                const date = new Date()
                date.setDate(date.getDate() - back)
                return (
                  <div key={i} className={`h-12 rounded-lg flex flex-col items-center justify-center text-[10px] ${DAY_STYLE[d]}`}>
                    <DayIcon d={d} size={14} />
                    <span className="mt-0.5">{back === 0 ? 'Today' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-2 mt-4 text-[13px]"><Snowflake size={15} className="text-(--color-blue)" /> <b>{p.freezes}</b> freeze{p.freezes === 1 ? '' : 's'} held (max 2)</div>
            <div className="text-[12.5px] text-(--color-ink-soft) mt-1.5 leading-relaxed">A day counts when you read at least one Q-tip. Days with no Q-tips, like days off, don't count against you. You earn a freeze for every 7 days you keep it going, and it's used automatically on a day you miss.</div>
          </div>
        )}

        {tab === 'Badges' && (
          <div className="anim-rise">
            <div className="text-[12.5px] text-(--color-ink-soft) mb-3">One badge per coaching topic. It levels up each time QIQ confirms you improved on it: {BADGE_TIERS.map((t) => `${t.tier} ${t.min}`).join(', ')}.</div>
            {badges.length === 0 && <div className="text-[13px] text-(--color-ink-soft) py-6 text-center">Your first badge comes with your first confirmed improvement.</div>}
            <div className="space-y-2">
              {badges.map((b) => (
                <div key={b.topic} className="flex items-center gap-3 rounded-xl border border-(--color-line) px-3 py-2.5">
                  <BadgeMedal resolved={b.resolved} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium truncate">{b.topic}</div>
                    <div className="text-[12px] text-(--color-ink-soft)">{b.current ? b.current.tier : 'Not yet earned'}{b.next ? ` · ${b.toNext} to ${b.next.tier}` : ' · top tier'}</div>
                  </div>
                  <span className="text-[12px] text-(--color-ink-mute)">{b.resolved} confirmed</span>
                </div>
              ))}
            </div>
            <div className="text-[11.5px] text-(--color-ink-mute) mt-2">{earnedBadges} of {badges.length} topics with a badge.</div>
          </div>
        )}

        {tab === 'Leaderboard' && (
          <div className="anim-rise space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-(--color-amber-soft)/60 px-3 py-2.5">
                <div className="text-[11px] text-(--color-ink-soft) flex items-center gap-1"><Crown size={12} /> Agent of the Week</div>
                <div className="text-[13.5px] font-semibold mt-0.5">{agents[LEADERBOARD.agentOfWeek.agentId].name}</div>
                <div className="text-[11px] text-(--color-ink-mute)">{LEADERBOARD.agentOfWeek.period}</div>
              </div>
              <div className="rounded-xl bg-(--color-mint-2) px-3 py-2.5">
                <div className="text-[11px] text-(--color-ink-soft) flex items-center gap-1"><Award size={12} /> Most Improved</div>
                <div className="text-[13.5px] font-semibold mt-0.5">{agents[LEADERBOARD.mostImproved.agentId].name}</div>
                <div className="text-[11px] text-(--color-ink-mute)">{LEADERBOARD.mostImproved.period}</div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[12px] font-semibold text-(--color-ink-soft) mb-1.5"><span>Your team · XP earned this week</span><span className="font-normal">You're #{myRank}</span></div>
              <div className="space-y-1">
                {team.map((x, i) => (
                  <div key={x.id} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] ${x.id === agentId ? 'bg-(--color-teal-soft) font-semibold' : ''}`}>
                    <span className="w-5 text-(--color-ink-mute)">{i + 1}</span>
                    <span className="flex-1">{LEADERBOARD.named || x.id === agentId ? agents[x.id].name : 'Teammate'}</span>
                    <span>{x.xp} XP</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[12px] font-semibold text-(--color-ink-soft) mb-1.5 flex items-center gap-1"><Trophy size={12} /> Campaign · team totals this week</div>
              <div className="space-y-1">
                {campaign.map((t, i) => (
                  <div key={t.name} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] ${t.mine ? 'bg-(--color-teal-soft) font-semibold' : ''}`}>
                    <span className="w-5 text-(--color-ink-mute)">{i + 1}</span><span className="flex-1">{t.name}</span><span>{t.xp.toLocaleString()} XP</span>
                  </div>
                ))}
              </div>
              <div className="text-[11.5px] text-(--color-ink-mute) mt-1.5">Ranked on XP earned in the period, so newer agents can compete. Campaign boards show team totals only.</div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
