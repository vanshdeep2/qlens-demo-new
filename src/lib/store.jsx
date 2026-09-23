import { createContext, useContext, useEffect, useReducer } from 'react'
import { agents, allCards, BADGES, PRE_ACKED, initialQueue, levelFor, TIERS, XP_RULES, OVERDUE_AFTER_DAYS } from '../data/qlensData'

const KEY = 'qlens-demo-v5'
const Ctx = createContext(null)

let uid = 0
const id = (p) => `${p}-${Date.now().toString(36)}-${(uid++).toString(36)}`
const now = () => new Date().toISOString()

export function streakOf(state, agentId) {
  const p = state.progress[agentId]
  return agents[agentId].seed.streakBeforeToday + (p.todayDone ? 1 : 0)
}

function metrics(state, agentId) {
  const p = state.progress[agentId]
  return { acked: p.acked, dailyGoals: p.dailyGoals, streak: streakOf(state, agentId), coachingAcked: p.coachingAcked, sessions: p.sessions }
}

export function badgeProgress(state, agentId) {
  const m = metrics(state, agentId)
  return BADGES.map((b) => ({ ...b, value: Math.min(m[b.metric], b.goal), earnedAt: state.badgesEarned[agentId]?.[b.id] || null }))
}

function awardBadges(state, agentId, celebrate) {
  const m = metrics(state, agentId)
  const earned = { ...(state.badgesEarned[agentId] || {}) }
  for (const b of BADGES) {
    if (!earned[b.id] && m[b.metric] >= b.goal) {
      earned[b.id] = now()
      if (celebrate) celebrate.push({ id: id('c'), type: 'badge', badgeId: b.id })
    }
  }
  return { ...state, badgesEarned: { ...state.badgesEarned, [agentId]: earned } }
}

function initState() {
  const cards = {}
  for (const c of allCards) cards[c.id] = { status: c.heldForReview ? 'held' : PRE_ACKED.includes(c.id) ? 'done' : 'pending', ackAt: PRE_ACKED.includes(c.id) ? now() : null }
  const progress = {}
  for (const a of Object.values(agents)) {
    const preAcked = allCards.filter((c) => c.agentId === a.id && PRE_ACKED.includes(c.id))
    progress[a.id] = {
      xp: a.seed.xp,
      acked: a.seed.acked,
      dailyGoals: a.seed.dailyGoals,
      sessions: a.seed.sessions,
      coachingAcked: a.seed.coachingAcked,
      freezes: a.seed.freezes,
      todayDone: preAcked.length > 0,
      goalAwarded: false,
    }
  }
  let s = {
    persona: 'agent',
    agentId: 'hady',
    cards,
    progress,
    badgesEarned: {},
    notifications: { coach: [], ...Object.fromEntries(Object.keys(agents).map((k) => [k, []])) },
    celebrations: {},
    nudges: {},
    queue: initialQueue,
    notes: { hady: [{ text: 'Strong tone on email. Keep an eye on warranty intake.', at: now() }] },
    events: [],
    popupSeen: {},
    queuedFromAttention: {},
    sidebarCollapsed: false,
    showSources: false,
    coachDone: [],
    reviewed: {},
  }
  // seed notifications
  s.notifications.hady = [
    { id: id('n'), text: '3 new Q-Bytes are ready for you.', at: now(), read: false, kind: 'cards' },
    { id: id('n'), text: 'A coaching session has been set up for you.', at: now(), read: false, kind: 'session' },
  ]
  s.notifications.aidza = [{ id: id('n'), text: '3 new Q-Bytes are ready for you.', at: now(), read: false, kind: 'cards' }]
  s.notifications.coach = [
    { id: id('n'), text: 'Cards delivered to 10 agents this morning.', at: now(), read: false, kind: 'cards' },
    { id: id('n'), text: '3 cards are overdue for acknowledgement.', at: now(), read: false, kind: 'overdue' },
  ]
  for (const a of Object.keys(agents)) s = awardBadges(s, a, null)
  return s
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* storage unavailable */
  }
  return initState()
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
      s.coachDone = [{ text: action.text, at: now() }, ...state.coachDone]
      return s
    }

    case 'ack': {
      const card = allCards.find((c) => c.id === action.cardId)
      if (!card || state.cards[card.id].status === 'done') return state
      const a = card.agentId
      const before = levelFor(state.progress[a].xp)
      const cel = [{ id: id('c'), type: 'xp', amount: card.xp, reason: card.tier === TIERS.COACHING ? 'Coaching card' : 'Q-Byte' }]
      let p = { ...state.progress[a], xp: state.progress[a].xp + card.xp, acked: state.progress[a].acked + 1, todayDone: true }
      if (card.tier === TIERS.COACHING) p.coachingAcked += 1
      let s = { ...state, cards: { ...state.cards, [card.id]: { status: 'done', ackAt: now() } } }
      const todays = allCards.filter((c) => c.agentId === a && c.deliveredDaysAgo === 0 && !c.heldForReview)
      if (!p.goalAwarded && todays.every((c) => s.cards[c.id].status === 'done')) {
        p = { ...p, xp: p.xp + XP_RULES.dailyGoal, dailyGoals: p.dailyGoals + 1, goalAwarded: true }
        cel.push({ id: id('c'), type: 'goal', amount: XP_RULES.dailyGoal })
      }
      s = { ...s, progress: { ...s.progress, [a]: p } }
      s = awardBadges(s, a, cel)
      const after = levelFor(p.xp)
      if (after.level > before.level) cel.push({ id: id('c'), type: 'level', level: after.level, name: after.name })
      s.celebrations = pushCelebrations(s, a, cel)
      s.events = log(s, 'card_acknowledged', `${agents[a].name} acknowledged "${card.title}" (+${card.xp} XP)`, a)
      s.notifications = notify(s, 'coach', `${agents[a].name} acknowledged "${card.title}".`, 'ack')
      return s
    }
    case 'later': {
      const card = allCards.find((c) => c.id === action.cardId)
      const s = { ...state, cards: { ...state.cards, [card.id]: { status: 'later', ackAt: null } } }
      s.events = log(s, 'card_deferred', `${agents[card.agentId].name} saved "${card.title}" for later`, card.agentId)
      return s
    }
    case 'reopen': {
      return { ...state, cards: { ...state.cards, [action.cardId]: { status: 'pending', ackAt: null } } }
    }
    case 'dismissCelebration': {
      const list = (state.celebrations[action.agentId] || []).filter((c) => c.id !== action.id)
      return { ...state, celebrations: { ...state.celebrations, [action.agentId]: list } }
    }
    case 'useFreeze': {
      const p = state.progress[action.agentId]
      if (p.freezes <= 0) return state
      return { ...state, progress: { ...state.progress, [action.agentId]: { ...p, freezes: p.freezes - 1 } } }
    }

    case 'nudge': {
      const card = allCards.find((c) => c.id === action.cardId)
      let s = { ...state, nudges: { ...state.nudges, [card.id]: now() } }
      s.notifications = notify(s, card.agentId, `Your coach sent a reminder: "${card.title}" is waiting for you.`, 'nudge')
      s.coachDone = [{ text: `Nudged ${agents[card.agentId].name.split(' ')[0]} on "${card.title}"`, at: now() }, ...state.coachDone]
      s.events = log(s, 'nudge_sent', `Coach nudged ${agents[card.agentId].name} on "${card.title}"`, card.agentId)
      return s
    }
    case 'schedule': {
      const q = state.queue.find((x) => x.id === action.queueId)
      const wasScheduled = q.status === 'scheduled'
      let s = { ...state, queue: state.queue.map((x) => (x.id === q.id ? { ...x, status: 'scheduled', date: action.date, time: action.time } : x)) }
      s.notifications = notify(s, q.agentId, wasScheduled ? 'Your coaching session has been moved.' : 'A coaching session has been set up for you.', 'session')
      s.coachDone = [{ text: `${wasScheduled ? 'Moved' : 'Scheduled'} ${agents[q.agentId].name.split(' ')[0]}'s 1:1 on ${q.topic.toLowerCase()}`, at: now() }, ...state.coachDone]
      s.events = log(s, 'coaching_status_changed', `${agents[q.agentId].name}: ${q.topic} → Scheduled for ${action.date} ${action.time}`, q.agentId)
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
        s = awardBadges(s, a, cel)
        const after = levelFor(p.xp)
        if (after.level > before.level) cel.push({ id: id('c'), type: 'level', level: after.level, name: after.name })
        s.celebrations = pushCelebrations(s, a, cel)
        s.notifications = notify(s, a, `+${XP_RULES.sessionAttended} XP for attending your coaching session.`, 'xp')
      }
      s.coachDone = [{ text: `Closed out ${agents[a].name.split(' ')[0]}'s 1:1 on ${q.topic.toLowerCase()}`, at: now() }, ...state.coachDone]
      s.events = log(s, 'coaching_status_changed', `${agents[a].name}: ${q.topic} → Closed (${action.closeOut.outcome})${action.closeOut.smart ? ' with SMART form' : ''}`, a)
      return s
    }
    case 'queueFromAttention': {
      const item = action.item
      const q = {
        id: id('q'), agentId: item.agentId, topicKey: item.id, topic: item.text.split('.')[0], source: `Coach-initiated · ${item.type}`,
        status: 'awaiting', flaggedDaysAgo: 0, whyFlagged: item.text, talkingPoints: ['Review the flagged interaction together.', 'Agree one change to try this week.'],
      }
      let s = { ...state, queue: [q, ...state.queue], queuedFromAttention: { ...state.queuedFromAttention, [item.id]: true } }
      s.coachDone = [{ text: `Added ${agents[item.agentId].name.split(' ')[0]} to the 1:1 queue (${item.type})`, at: now() }, ...state.coachDone]
      s.events = log(s, 'coaching_requested', `Coach added ${agents[item.agentId].name} to the coaching queue (${item.type})`, item.agentId)
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
  const [state, dispatch] = useReducer(reducer, null, load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)

export function cardsFor(state, agentId) {
  return allCards.filter((c) => c.agentId === agentId).map((c) => ({ ...c, ...state.cards[c.id], nudgedAt: state.nudges[c.id] || null, overdue: state.cards[c.id].status !== 'done' && !c.heldForReview && c.deliveredDaysAgo >= OVERDUE_AFTER_DAYS }))
}
