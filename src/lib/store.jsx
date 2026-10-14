import { createContext, useContext, useReducer } from 'react'
import { agents, allCards, initialQueue, LATE_AFTER, levelFor, OVERDUE_AFTER_DAYS, seedGrowth, TIERS, topicBadges, trainingRecos, XP_RULES } from '../data/qlensData'

const Ctx = createContext(null)

let uid = 0
const id = (p) => `${p}-${Date.now().toString(36)}-${(uid++).toString(36)}`
const now = () => new Date().toISOString()
const firstName = (a) => agents[a].name.split(' ')[0]

export function streakOf(state, agentId) {
  const p = state.progress[agentId]
  return agents[agentId].seed.streakBeforeToday + (p.todayDone ? 1 : 0)
}

export function lateAfter(q) {
  return LATE_AFTER[q.trigger === 'critical_failure' ? 'critical_failure' : q.type]
}
export function isLate(q) {
  return q.status === 'awaiting' && q.arrivedDaysAgo >= lateAfter(q)
}

export function badgesFor(state, agentId) {
  const extra = state.badgeBumps[agentId] || {}
  return (topicBadges[agentId] || []).map((b) => ({ ...b, resolved: b.resolved + (extra[b.topic] || 0) }))
}

export function weekXp(state, agentId) {
  return agents[agentId].seed.weekXp + (state.progress[agentId].xp - agents[agentId].seed.xp)
}

function initState() {
  const cards = {}
  const PRE_READ = ['michael-closing', 'michael-empathy', 'janine-verification', 'thabo-hold', 'pieter-empathy', 'ayanda-hold']
  for (const c of allCards) {
    cards[c.id] = { status: c.heldForReview ? 'held' : c.withdrawn ? 'withdrawn' : PRE_READ.includes(c.id) ? 'done' : 'pending', ackAt: PRE_READ.includes(c.id) ? now() : null }
  }
  const progress = {}
  for (const a of Object.values(agents)) {
    progress[a.id] = {
      xp: a.seed.xp,
      freezes: a.seed.freezes,
      sessions: 0,
      todayDone: allCards.some((c) => c.agentId === a.id && PRE_READ.includes(c.id)),
      goalAwarded: false,
      growth: (seedGrowth[a.id] || []).map((g) => ({ ...g })),
    }
  }
  const training = Object.fromEntries(trainingRecos.map((t) => [t.id, { status: t.status, reason: null }]))
  let s = {
    persona: 'agent',
    agentId: 'hady',
    cards,
    progress,
    badgeBumps: {},
    notifications: { coach: [], ...Object.fromEntries(Object.keys(agents).map((k) => [k, []])) },
    celebrations: {},
    nudges: {},
    queue: initialQueue.map((q) => ({ ...q, focus: [...q.focus] })),
    training,
    notes: { hady: [{ text: 'Strong tone on email. Keep an eye on warranty intake.', at: now() }] },
    events: [],
    popupSeen: {},
    flagsDone: {},
    sidebarCollapsed: false,
    showSources: false,
    coachDone: [],
    reviewed: {},
  }
  s.notifications.hady = [
    { id: id('n'), text: '4 new Q-tips are ready for you.', at: now(), read: false, kind: 'cards' },
    { id: id('n'), text: 'Your weekly 1:1 has been booked.', at: now(), read: false, kind: 'session' },
  ]
  s.notifications.aidza = [{ id: id('n'), text: '3 new Q-tips are ready for you.', at: now(), read: false, kind: 'cards' }]
  s.notifications.coach = [
    { id: id('n'), text: 'Emailed to you: critical failure for Nomsa Dlamini. The 1:1 is not booked yet.', at: now(), read: false, kind: 'cf' },
    { id: id('n'), text: 'Weekly 1:1 packets are ready for all 10 agents.', at: now(), read: false, kind: 'session' },
    { id: id('n'), text: '3 Q-tips are overdue.', at: now(), read: false, kind: 'overdue' },
  ]
  // Events QLens has already reported today (clock rules)
  for (const q of s.queue.filter(isLate)) {
    s.events = log(s, 'session_late', `${agents[q.agentId].name}: ${q.topic} not booked after ${q.arrivedDaysAgo} working days`, q.agentId)
  }
  for (const c of allCards.filter((c) => c.deliveredDaysAgo >= OVERDUE_AFTER_DAYS && cards[c.id].status === 'pending')) {
    s.events = log(s, 'card_overdue', `${agents[c.agentId].name}: "${c.title}" unread for ${c.deliveredDaysAgo} days`, c.agentId)
  }
  return s
}

function log(state, type, text, agentId) {
  return [{ id: id('e'), at: now(), type, text, agentId }, ...state.events].slice(0, 200)
}

function notify(state, recipient, text, kind) {
  return { ...state.notifications, [recipient]: [{ id: id('n'), text, at: now(), read: false, kind }, ...(state.notifications[recipient] || [])] }
}

function pushCelebrations(state, agentId, list) {
  if (!list.length) return state.celebrations
  return { ...state.celebrations, [agentId]: [...(state.celebrations[agentId] || []), ...list] }
}

function done(state, text) {
  return [{ text, at: now() }, ...state.coachDone]
}

function reducer(state, action) {
  switch (action.type) {
    case 'persona':
      return { ...state, persona: action.persona }
    case 'agent':
      return { ...state, agentId: action.agentId }
    case 'sidebar':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }
    case 'popupSeen':
      return { ...state, popupSeen: { ...state.popupSeen, [action.agentId]: true } }
    case 'reset':
      return { ...initState(), showSources: state.showSources }
    case 'toggleSources':
      return { ...state, showSources: !state.showSources }
    case 'reviewed': {
      const s = { ...state, reviewed: { ...state.reviewed, [action.id]: true } }
      s.coachDone = done(state, action.text)
      s.events = log(s, 'held_item_reviewed', action.text, action.agentId)
      return s
    }

    case 'ack': {
      const card = allCards.find((c) => c.id === action.cardId)
      if (!card || state.cards[card.id].status === 'done') return state
      const a = card.agentId
      const before = levelFor(state.progress[a].xp)
      const cel = [{ id: id('c'), type: 'xp', amount: card.xp, reason: card.tier === TIERS.WEEKLY ? 'Weekly Q-tip read' : 'Q-tip read' }]
      let p = { ...state.progress[a], xp: state.progress[a].xp + card.xp, todayDone: true }
      let s = { ...state, cards: { ...state.cards, [card.id]: { status: 'done', ackAt: now() } } }
      const todays = allCards.filter((c) => c.agentId === a && c.deliveredDaysAgo === 0 && !c.heldForReview && !c.withdrawn)
      if (!p.goalAwarded && todays.every((c) => s.cards[c.id].status === 'done')) {
        p = { ...p, xp: p.xp + XP_RULES.dailyGoal, goalAwarded: true }
        cel.push({ id: id('c'), type: 'goal', amount: XP_RULES.dailyGoal })
      }
      // A read "you did it" Q-tip creates a pending Implemented Bonus (Growth XP)
      if (card.positive && card.followup?.verdict === 'applied') {
        p = { ...p, growth: [{ id: id('g'), topic: card.title.replace('You Did It: ', ''), amount: XP_RULES.implementedBonus, status: 'pending', confirmsInDays: XP_RULES.confirmDays, fresh: true }, ...p.growth] }
        cel.push({ id: id('c'), type: 'pending', amount: XP_RULES.implementedBonus })
      }
      s = { ...s, progress: { ...s.progress, [a]: p } }
      const after = levelFor(p.xp)
      if (after.level > before.level) cel.push({ id: id('c'), type: 'level', level: after.level, name: after.name })
      s.celebrations = pushCelebrations(s, a, cel)
      s.events = log(s, 'card_read', `${agents[a].name} read "${card.title}" (+${card.xp} XP shown instantly, confirmed by QIQ)`, a)
      return s
    }
    case 'later': {
      const card = allCards.find((c) => c.id === action.cardId)
      const s = { ...state, cards: { ...state.cards, [card.id]: { status: 'later', ackAt: null } } }
      s.events = log(s, 'card_deferred', `${agents[card.agentId].name} saved "${card.title}" for later`, card.agentId)
      return s
    }
    case 'dismissCelebration': {
      const list = (state.celebrations[action.agentId] || []).filter((c) => c.id !== action.id)
      return { ...state, celebrations: { ...state.celebrations, [action.agentId]: list } }
    }

    case 'nudge': {
      const card = allCards.find((c) => c.id === action.cardId)
      let s = { ...state, nudges: { ...state.nudges, [card.id]: now() } }
      s.notifications = notify(s, card.agentId, `Your coach sent a reminder: "${card.title}" is waiting for you.`, 'nudge')
      s.coachDone = done(state, `Nudged ${firstName(card.agentId)} on "${card.title}"`)
      s.events = log(s, 'card_nudged', `Coach nudged ${agents[card.agentId].name} on "${card.title}"`, card.agentId)
      return s
    }
    case 'schedule': {
      const q = state.queue.find((x) => x.id === action.queueId)
      const was = q.status === 'scheduled'
      let s = { ...state, queue: state.queue.map((x) => (x.id === q.id ? { ...x, status: 'scheduled', date: action.date, time: action.time } : x)) }
      s.notifications = notify(s, q.agentId, was ? 'Your 1:1 has been moved.' : 'A 1:1 with your coach has been booked.', 'session')
      s.coachDone = done(state, `${was ? 'Moved' : 'Booked'} ${firstName(q.agentId)}'s ${q.type === 'weekly' ? 'weekly 1:1' : '1:1'}`)
      s.events = log(s, was ? 'session_rescheduled' : 'session_scheduled', `${agents[q.agentId].name}: ${q.topic} → ${action.date} ${action.time}`, q.agentId)
      return s
    }
    case 'decline': {
      const q = state.queue.find((x) => x.id === action.queueId)
      if (q.trigger === 'critical_failure') return state
      let s = { ...state, queue: state.queue.map((x) => (x.id === q.id ? { ...x, status: 'declined', declineReason: action.reason } : x)) }
      if (q.status === 'scheduled') s.notifications = notify(s, q.agentId, 'Your 1:1 has been cancelled by your coach.', 'session')
      s.coachDone = done(state, `Declined ${firstName(q.agentId)}'s 1:1 (${action.reason.toLowerCase()})`)
      s.events = log(s, 'session_declined', `${agents[q.agentId].name}: ${q.topic} declined · ${action.reason}. QIQ returns the topics to next week's agenda.`, q.agentId)
      return s
    }
    case 'closeOut': {
      const q = state.queue.find((x) => x.id === action.queueId)
      const a = q.agentId
      let s = { ...state, queue: state.queue.map((x) => (x.id === q.id ? { ...x, status: 'closed', closeOut: action.closeOut } : x)) }
      if (action.closeOut.happened) {
        const before = levelFor(s.progress[a].xp)
        const p = { ...s.progress[a], sessions: s.progress[a].sessions + 1, xp: s.progress[a].xp + XP_RULES.sessionAttended }
        s = { ...s, progress: { ...s.progress, [a]: p } }
        const cel = [{ id: id('c'), type: 'xp', amount: XP_RULES.sessionAttended, reason: 'Attended your 1:1' }]
        const after = levelFor(p.xp)
        if (after.level > before.level) cel.push({ id: id('c'), type: 'level', level: after.level, name: after.name })
        s.celebrations = pushCelebrations(s, a, cel)
        s.notifications = notify(s, a, `+${XP_RULES.sessionAttended} XP for attending your 1:1.`, 'xp')
      }
      s.coachDone = done(state, `Closed out ${firstName(a)}'s 1:1 on ${q.topic.toLowerCase()}`)
      s.events = log(s, 'session_closed_out', `${agents[a].name}: ${q.topic} · ${action.closeOut.happened ? action.closeOut.outcome : 'did not happen'}${action.closeOut.smart ? ' · SMART form' : ''}`, a)
      return s
    }
    case 'addToWeekly': {
      const item = action.item
      const wk = state.queue.find((q) => q.agentId === item.agentId && q.type === 'weekly' && q.status !== 'closed' && q.status !== 'declined')
      let s = { ...state, flagsDone: { ...state.flagsDone, [item.id]: true } }
      if (wk) {
        s.queue = state.queue.map((q) => (q.id === wk.id ? { ...q, focus: [...q.focus, { topic: item.type, saw: item.text, workOn: 'Added by you from a QIQ flag.', sop: null, training: [], followup: null, coachAdded: true }] } : q))
      }
      s.coachDone = done(state, `Added "${item.type}" to ${firstName(item.agentId)}'s weekly 1:1`)
      return s
    }
    case 'training': {
      const t = trainingRecos.find((x) => x.id === action.recoId)
      let s = { ...state, training: { ...state.training, [t.id]: { status: action.status, reason: action.reason || null } } }
      s.coachDone = done(state, `Training for ${firstName(t.agentId)} marked ${action.status.replace('_', ' ')}`)
      s.events = log(s, 'training_status_changed', `${agents[t.agentId].name}: ${t.topic} → ${action.status}`, t.agentId)
      return s
    }
    case 'note':
      return { ...state, notes: { ...state.notes, [action.agentId]: [{ text: action.text, at: now() }, ...(state.notes[action.agentId] || [])] } }
    case 'markRead':
      return { ...state, notifications: { ...state.notifications, [action.recipient]: state.notifications[action.recipient].map((n) => ({ ...n, read: true })) } }
    default:
      return state
  }
}

export function StoreProvider({ children }) {
  // Demo runs fresh on every load: no persistence, so a page refresh
  // always returns to the day's starting state.
  const [state, dispatch] = useReducer(reducer, null, initState)
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)

export function cardsFor(state, agentId) {
  return allCards
    .filter((c) => c.agentId === agentId)
    .map((c) => ({ ...c, ...state.cards[c.id], nudgedAt: state.nudges[c.id] || null, overdue: state.cards[c.id].status !== 'done' && !c.heldForReview && !c.withdrawn && c.deliveredDaysAgo >= OVERDUE_AFTER_DAYS }))
}
