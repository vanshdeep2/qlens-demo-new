// QLens demo data, aligned to QLens BRD v2.0 and QLens Design Document v1.
//
// REAL: the four Q-tips for Aidza Machuca and Hady Magdy (topic, evidence, quotes,
// validator results) come from the dry run of the QIQ email-channel Training &
// Coaching pipeline on HexClad data. Their text has been condensed into the v2
// three-section format (what we saw / what to try / why it matters).
// Customer message bodies are deliberately NOT included (they contain customer names).
//
// ILLUSTRATIVE: everything else (other agents, KPIs, XP, streaks, badges, sessions,
// follow-up checks, training recommendations, leaderboards).

import evidenceRefs from './evidenceRefs.json'

export const TIERS = { DAILY: 'daily', WEEKLY: 'weekly' }

// Client-configurable labels for the three Q-tip sections (design doc 3.2).
export const SECTION_LABELS = { saw: 'What we saw', try: 'What to try', why: 'Why it matters' }

export const COACH = { name: 'Kagiso de Villiers', initials: 'KV', email: 'kagiso.devilliers@quantanite.com', team: "Kagiso's team" }

// Time rules (design doc 5). Working days, proposed defaults.
export const OVERDUE_AFTER_DAYS = 2
export const LATE_AFTER = { weekly: 2, additional: 2, critical_failure: 1 }

// XP published by QIQ in config (T&C design doc 10.1).
export const XP_RULES = {
  dailyRead: 10,
  weeklyRead: 15,
  dailyGoal: 25,
  sessionAttended: 50,
  implementedBonus: 40,
  streak7: 20,
  streak30: 50,
  confirmDays: 14,
}

export const LEVELS = [
  { level: 1, name: 'Rookie', min: 0 },
  { level: 2, name: 'Starter', min: 100 },
  { level: 3, name: 'Regular', min: 250 },
  { level: 4, name: 'Pro', min: 450 },
  { level: 5, name: 'Expert', min: 700 },
  { level: 6, name: 'Ace', min: 1000 },
  { level: 7, name: 'Mentor', min: 1400 },
  { level: 8, name: 'Legend', min: 1900 },
]

export function levelFor(xp) {
  let cur = LEVELS[0]
  for (const l of LEVELS) if (xp >= l.min) cur = l
  const next = LEVELS.find((l) => l.min > xp) || null
  return { ...cur, next, toNext: next ? next.min - xp : 0, pct: next ? (xp - cur.min) / (next.min - cur.min) : 1 }
}

// Topic badges: tier by confirmed improvements on a topic (T&C design doc 10.4).
export const BADGE_TIERS = [
  { tier: 'Bronze', min: 1, color: '#c98a4b' },
  { tier: 'Silver', min: 3, color: '#9aa4ad' },
  { tier: 'Gold', min: 6, color: '#d6a531' },
  { tier: 'Platinum', min: 10, color: '#5f8fa3' },
]
export function badgeTier(resolved) {
  let t = null
  for (const b of BADGE_TIERS) if (resolved >= b.min) t = b
  const next = BADGE_TIERS.find((b) => b.min > resolved) || null
  return { current: t, next, toNext: next ? next.min - resolved : 0 }
}

// ---------------------------------------------------------------------------
// Q-tips
// ---------------------------------------------------------------------------
const allPass = ['readiness', 'pii', 'single_customer_narration', 'evidence_language', 'performance_language', 'length', 'schema'].map((name) => ({ name, pass: true }))
const S = (saw, tryIt, why) => ({ saw, try: tryIt, why })

const realCards = [
  {
    id: 'aidza-serial-number', agentId: 'aidza', tier: TIERS.DAILY, topicKey: 'serial_number_generation_when_unavailable',
    title: 'Complete the Claim with the Right Identifier',
    evidenceScope: 'single_signal',
    sections: S(
      'You confirmed warranty coverage clearly. The customer could not find a serial number, and the replacement claim was completed without one being generated.',
      'When there is no serial number, generate it before you complete the claim. No serial number → Generate it → Complete the claim.',
      'It keeps the warranty claim complete and ready for the next step.',
    ),
    checks: allPass,
    evidence: { threadCount: 1, channel: 'email', supportStrength: 'Explicit' },
    brief: {
      evidenceSummary: 'A warranty replacement claim where the customer could not provide a serial number was processed, but the required serial number was not generated in line with the SOP.',
      coachingAngle: 'Generate the required serial number before completing the claim, as specified by the SOP.',
      priorityReason: 'Ranked first because the evidence explicitly identifies a required SOP step that was not completed.',
      history: 'new',
    },
    quotes: [
      { thread: '2f81b7', seq: 4, from: 'Customer', date: '29 Jul', text: "I carefully checked underneath the rim of the pot, around both handles, and the bottom, but I couldn't find a serial number anywhere." },
      { thread: '2f81b7', seq: 5, from: 'Agent', date: '29 Jul', text: "Please don't worry, since this falls under our warranty coverage, we'll go ahead and process the replacement for you. Your 8 QT pot is approved for replacement!" },
    ],
    deliveredDaysAgo: 0,
  },
  {
    id: 'hady-data-erasure', agentId: 'hady', tier: TIERS.DAILY, topicKey: 'data_erasure_request_routing',
    title: 'Route Data-Removal Requests Correctly',
    evidenceScope: 'single_signal',
    sections: S(
      'A customer asked for their personal data to be deleted. The reply pointed them to the unsubscribe link, and the case closed without the erasure route or a confirmation.',
      'Treat a deletion request as data erasure, not unsubscribe: Hear → Route for erasure → Escalate → Confirm before closing. Try: “I’ll route this as a data-erasure request and confirm with you once it’s done.”',
      'The request reaches the right process and the case closes accurately.',
    ),
    checks: allPass,
    evidence: { threadCount: 1, channel: 'email', supportStrength: 'Explicit' },
    brief: {
      evidenceSummary: 'A customer data-erasure request was handled as an unsubscribe request. It was not escalated through the required route, and the ticket was closed without confirmation that removal was complete.',
      coachingAngle: 'Use the data-erasure route for deletion requests rather than the unsubscribe route, and keep the case open until confirmation.',
      priorityReason: 'Promoted to first under the compliance and customer-risk rule.',
      history: 'new',
    },
    quotes: [
      { thread: 'd580a0', seq: 1, from: 'Customer', date: '28 Jul', text: 'I ask you to please delete any personal data of mine you have stored on your systems. Would appreciate your cooperation and an email confirming when the deletion has been completed.' },
      { thread: 'd580a0', seq: 2, from: 'Agent', date: '28 Jul', text: "You can easily click the unsubscribe link at the bottom of any HexClad email we've sent to you." },
    ],
    deliveredDaysAgo: 0,
  },
  {
    id: 'hady-warranty-intake', agentId: 'hady', tier: TIERS.WEEKLY, topicKey: 'warranty_claim_intake_completeness',
    title: 'Before You Progress: Proof, Photos, Purchase Details',
    evidenceScope: 'multi_signal',
    sections: S(
      'In 3 warranty threads this week, claims moved forward with proof of purchase, photos or the purchase date still missing, so customers were asked again in several rounds.',
      'Run one complete check before progressing a claim: Proof → Photos → Purchase date → Progress.',
      'One complete ask means fewer repeat requests and a faster resolution for the customer.',
    ),
    checks: allPass,
    evidence: { threadCount: 3, channel: 'email', supportStrength: 'Pattern across 3 threads' },
    weekly: [
      { v: '3', k: 'warranty threads this week showed the same gap' },
      { v: '3 of 3', k: 'moved forward with proof, photos or purchase date missing' },
    ],
    brief: {
      evidenceSummary: 'Across three warranty threads, claims moved forward before proof of purchase, photos and purchase date were all confirmed, so the customer was asked for information in several rounds.',
      coachingAngle: 'Use one complete intake check before progressing the case, covering every required document and detail.',
      priorityReason: 'Recurs across three threads in the week and repeatedly delayed the claim.',
      history: 'new',
    },
    quotes: [
      { thread: '10b0aa', seq: 2, from: 'Agent', date: '28 Jul', text: 'Could you please confirm whether the item in question is a pan or a wok? Additionally, we kindly ask that you send us clear photos of the cookware cleaned and dried.' },
      { thread: '10b0aa', seq: 6, from: 'Agent', date: '28 Jul', text: 'To move forward with providing a replacement, we kindly ask that you share the following details: Order Number, confirm your current shipping address, confirm the size of the affected cookware, serial number, proof of warranty registration.' },
      { thread: '10b0aa', seq: 7, from: 'Customer', date: '28 Jul', text: "Lastly I'm not jumping through a bunch of hoops to get a replacement." },
    ],
    deliveredDaysAgo: 0,
  },
  {
    id: 'hady-courtesy-replacement', agentId: 'hady', tier: TIERS.DAILY, topicKey: 'courtesy_replacement_without_proof',
    title: 'Missing Proof? Check the Courtesy Route',
    evidenceScope: 'multi_signal',
    sections: S(
      'In 2 recent warranty threads with no proof of purchase, the claim was deferred without checking the one-time courtesy replacement or warranty-registration route.',
      'When proof is missing, check the permitted route before closing or deferring: Missing proof → Check the route → Apply it, or continue with registration.',
      'An allowed route gets the customer a resolution instead of a dead end.',
    ),
    checks: allPass,
    evidence: { threadCount: 2, channel: 'email', supportStrength: 'Limited pattern across 2 threads' },
    brief: {
      evidenceSummary: 'In two warranty threads where proof of purchase was missing, the claim was deferred without checking the one-time courtesy replacement or warranty-registration route.',
      coachingAngle: 'When proof of purchase is missing, check and apply the permitted courtesy-replacement or registration route before closing or deferring.',
      priorityReason: 'Limited pattern across two threads; an allowed resolution route was available and not used.',
      history: 'new',
    },
    quotes: [
      { thread: '6d02a8', seq: 4, from: 'Agent', date: '18 Jul', text: 'Unfortunately, without a valid proof of purchase or order number, we cannot provide a replacement.' },
      { thread: '3138a9', seq: 10, from: 'Agent', date: '25 Jul', text: 'To move forward with your claim and process a replacement, we need a Proof of Purchase.' },
    ],
    deliveredDaysAgo: 0,
  },
  {
    id: 'hady-uk-warranty-blocked', agentId: 'hady', tier: TIERS.DAILY, topicKey: 'uk_warranty_replacement_escalation',
    title: 'UK warranty replacement escalation',
    heldForReview: true,
    validator: 'pii',
    blockedReason: "The card reused the name 'International' from the source evidence; a Q-tip never names a customer or any individual.",
    checks: [
      { name: 'readiness', pass: true }, { name: 'pii', pass: false }, { name: 'schema', pass: true }, { name: 'length', pass: true },
    ],
    evidence: { threadCount: 4, channel: 'email', supportStrength: 'Pattern across 4 threads' },
    brief: {
      evidenceSummary: 'UK warranty replacements were approved and shipped without the International-team or Team Lead escalation and assignment step.',
      coachingAngle: 'Before processing a UK warranty replacement, complete the required escalation and assignment step.',
      priorityReason: 'Process step skipped across four UK threads.',
      history: 'new',
    },
    quotes: [
      { thread: 'f00707', seq: 4, from: 'Agent', date: '28 Jul', text: 'Your 20cm Hybrid Frying Pan is approved for replacement! We will process it and ship it to the address you have provided below within 3 to 5 business days!' },
    ],
    deliveredDaysAgo: 0,
  },
]

// ILLUSTRATIVE
function ill(id, agentId, tier, topicKey, title, sections, extra = {}) {
  return {
    id, agentId, tier, topicKey, title, sections,
    evidenceScope: tier === TIERS.WEEKLY ? 'multi_signal' : 'single_signal',
    checks: allPass,
    evidence: { threadCount: tier === TIERS.WEEKLY ? 3 : 1, channel: 'email', supportStrength: tier === TIERS.WEEKLY ? 'Pattern across 3 threads' : 'Explicit' },
    illustrative: true,
    brief: {
      evidenceSummary: sections.saw,
      coachingAngle: sections.try,
      priorityReason: tier === TIERS.WEEKLY ? 'Recurs across several contacts this week.' : 'Clear single signal with direct customer impact.',
      history: 'new',
    },
    quotes: [],
    deliveredDaysAgo: 0,
    ...extra,
  }
}

const illustrativeCards = [
  // "You did it": a positive Q-tip from the follow-up check (T&C design doc 4.6)
  ill('hady-ack-win', 'hady', TIERS.DAILY, 'acknowledge_before_asking', 'You Did It: Acknowledge Before Asking',
    S('Last week’s tip was to acknowledge the customer’s frustration before asking for details. In 4 of the 5 frustrated-customer threads since, you opened with acknowledgement.',
      'Keep doing it. It is now part of how you handle these threads.',
      'Customers who feel heard first are quicker to share what you need.'),
    {
      positive: true,
      brief: { evidenceSummary: 'Follow-up check on last week’s Q-tip: applied in 4 of 5 relevant threads.', coachingAngle: 'Reinforce the change.', priorityReason: 'Positive follow-up result.', history: 'repeat_improved' },
      followup: { verdict: 'applied', relevant: 5, applied: 4, quote: 'I’m really sorry this has dragged on. Let’s get it sorted today.' },
    }),
  ill('aidza-next-step', 'aidza', TIERS.WEEKLY, 'warranty_next_step_communication', 'End Every Warranty Reply with the Next Step',
    S('In 4 of your 11 warranty replies this week, the email confirmed the outcome but did not say what happens next. In 3 of those, the customer wrote again within two days to ask.',
      'End every warranty reply with one next step and a timeframe: Confirm → Next step → When → How they’ll hear.',
      'Customers who know what to expect do not need to chase, so threads close faster.'),
    { evidence: { threadCount: 4, channel: 'email', supportStrength: 'Pattern across 4 of 11 threads' }, weekly: [{ v: '4 of 11', k: 'warranty replies ended without a next step' }, { v: '3', k: 'customers emailed again within 2 days' }] }),
  ill('aidza-care-guide', 'aidza', TIERS.DAILY, 'care_before_warranty', 'Check Care Steps Before Warranty',
    S('A sticking-pan email went straight to a warranty claim without checking whether heat or seasoning was the cause.',
      'For sticking or discolouration, share the care steps first, then offer warranty if it persists.',
      'Solving it on the first reply is faster for the customer and avoids an unnecessary claim.')),
  ill('michael-closing', 'michael', TIERS.DAILY, 'personalised_closing', 'Personalise the Close',
    S('Your process adherence leads the team. Your closings used the same standard wording whatever the issue.',
      'Add one line to the close that refers back to what the customer asked for.',
      'A tailored close helps the reply land with the customer.')),
  ill('michael-empathy', 'michael', TIERS.DAILY, 'empathy_statement', 'Match Empathy to the Moment',
    S('A damaged wedding gift got the same opening line as a routine query.',
      'When the customer shares why it matters, reflect it in your first sentence.',
      'Customers who feel heard are more patient with the fix.')),
  ill('janine-verification', 'janine', TIERS.DAILY, 'closing_and_verification', 'Verify Before You Close',
    S('One replacement was closed without confirming the delivery address on file.',
      'Confirm the delivery address before closing any replacement.',
      'It prevents a lost parcel and a second contact.')),
  ill('janine-recap', 'janine', TIERS.DAILY, 'closing_recap', 'Recap What Happens Next',
    S('Longer replies left the customer to work out which step was theirs and which was ours.',
      'End longer replies with a two-line recap: our step, your step, when.',
      'Clear ownership cuts follow-up questions.')),
  ill('ayanda-t1', 'ayanda', TIERS.WEEKLY, 'escalation_eligibility', 'T1 Escalation: Check Eligibility First',
    S('Across several contacts this week, cases went to Tier 1 before the order value and warranty window checks were done, and T1 sent them back.',
      'Before escalating: Check value → Check window → Escalate or resolve.',
      'Fewer returned escalations means a faster answer for the customer.')),
  ill('ayanda-hold', 'ayanda', TIERS.DAILY, 'expectation_setting', 'Set the Wait Time Up Front',
    S('An escalated case had no wait time given to the customer.',
      'When you escalate, tell the customer how long the specialist team usually takes.',
      'Customers wait more patiently when they know how long.')),
  ill('nomsa-payment', 'nomsa', TIERS.WEEKLY, 'payment_resolution_protocol', 'Payment Issues: Resolve on First Reply',
    S('Several payment queries this week were passed to finance even though the refund tool covered them, and customers came back asking again.',
      'For duplicate charges and partial refunds under the limit, resolve in the refund tool on the first reply.',
      'First-reply resolution removes repeat contacts.')),
  ill('nomsa-ref', 'nomsa', TIERS.DAILY, 'refund_reference', 'Always Share the Refund Reference',
    S('A refund was confirmed without the reference number.',
      'Include the refund reference in every refund confirmation.',
      'It saves the customer a “where is my refund” contact.')),
  ill('pieter-empathy', 'pieter', TIERS.DAILY, 'empathy_and_communication', 'Empathy Before Process',
    S('A frustrated customer was asked for order details in the first line.',
      'Acknowledge the frustration in one sentence, then ask.',
      'It calms the conversation and speeds up the fix.')),
  ill('pieter-tone', 'pieter', TIERS.DAILY, 'plain_language', 'Swap Jargon for Plain Words',
    S('Internal terms like RMA and SKU appeared in customer replies.',
      'Say what the term means instead: “I’ve set up your return, and here’s the prepaid label.”',
      'Plain words mean fewer clarifying questions.')),
  ill('thabo-hold', 'thabo', TIERS.DAILY, 'handle_efficiency', 'Gather Everything in One Ask',
    S('Details for one case were requested across two separate emails.',
      'Ask for everything you need in one message: order number, photos, address.',
      'One ask saves a round trip for the customer.')),
  ill('thabo-template', 'thabo', TIERS.DAILY, 'macro_use', 'Use the Warranty Macro, Then Tailor',
    S('Standard warranty replies were being written from scratch.',
      'Start from the approved macro and tailor one line.',
      'Faster replies without losing the personal touch.')),
  ill('sipho-legal', 'sipho', TIERS.WEEKLY, 'legal_escalation_protocol', 'Legal Mentions: Escalate, Don’t Respond',
    S('Several emails this week that mentioned legal action were answered directly instead of being routed to the legal queue.',
      'Spot the legal mention → Acknowledge only → Route to legal. Don’t discuss the case.',
      'Correct routing protects the customer and the company.'),
    { followup: { verdict: 'not_applied', relevant: 4, applied: 1, quote: 'I understand you are considering legal action, but our policy is clear on this.' } }),
  ill('sipho-tag', 'sipho', TIERS.DAILY, 'case_tagging', 'Tag the Case Before You Close',
    S('Several closed cases had no contact-reason tag.',
      'Tag the contact reason before you close.',
      'Accurate tags improve the insight your team gets back.')),
  ill('lerato-id', 'lerato', TIERS.WEEKLY, 'deactivation_process_adherence', 'Identity Verification Before Account Changes',
    S('Across several account change requests this week, changes were made before identity verification was complete.',
      'Verify email → Verify order → Then make the change.',
      'Verification protects customers from unauthorised changes.')),
  // Withdrawn by QIQ: the critical-failure 1:1 on the same process replaced it (design doc 4.1)
  ill('lerato-workflow', 'lerato', TIERS.DAILY, 'deactivation_workflow', 'Follow the Deactivation Checklist',
    S('A deactivation was processed without the confirmation email.',
      'Follow every step of the deactivation checklist, including the confirmation email.',
      'It keeps a clear record for the customer and for audit.'),
    { withdrawn: true, withdrawnReason: 'Replaced by the critical-failure 1:1 on the same process' }),
]

// Older unread Q-tips: drive the overdue and nudge flow. ILLUSTRATIVE.
const overdueCards = [
  ill('nomsa-old-1', 'nomsa', TIERS.DAILY, 'refund_method', 'Confirm the Refund Method',
    S('A refund went to a different method than the original payment.', 'Confirm the refund goes back to the original payment method.', 'It avoids failed refunds and repeat contacts.'), { deliveredDaysAgo: 3 }),
  ill('lerato-old-1', 'lerato', TIERS.DAILY, 'open_order_check', 'Two Checks Before Deactivation',
    S('An account was closed with an order still pending.', 'Check for open orders before deactivating.', 'It stops orders getting lost.'), { deliveredDaysAgo: 4 }),
  ill('sipho-old-1', 'sipho', TIERS.DAILY, 'chargeback_routing', 'Chargeback Mentions Need Routing Too',
    S('A chargeback threat was handled like a standard refund query.', 'Route chargeback threats to the payments escalation queue.', 'Correct routing speeds up resolution.'), { deliveredDaysAgo: 3 }),
]

export const allCards = [...realCards, ...illustrativeCards, ...overdueCards].map((c) => ({
  ...c,
  xp: c.heldForReview ? 0 : c.tier === TIERS.WEEKLY ? XP_RULES.weeklyRead : XP_RULES.dailyRead,
  readSecs: c.tier === TIERS.WEEKLY ? 30 : 20,
}))
allCards.find((c) => c.id === 'sipho-legal').brief.history = 'repeat_worsened'

export function evidenceFor(topicKey) {
  return evidenceRefs[topicKey] || []
}

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------
function seededTrend(seed, end, drift, volatility, decimals = 0) {
  let s = seed
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  const pts = [end]
  for (let i = 1; i < 30; i++) {
    const step = drift + (rand() - 0.5) * volatility
    pts.unshift(Number((pts[0] - step).toFixed(decimals)))
  }
  return pts
}

// Email agents: only metrics valid and attributable on email (no handle time).
function kpiSet(seed, csat, pa, ab) {
  return {
    csat: { key: 'csat', label: 'Predicted CSAT', value: csat, unit: '/5', target: 4.2, direction: 'higher_better', trend: seededTrend(seed, csat, 0.01, 0.12, 1) },
    pa: { key: 'pa', label: 'Process Adherence', value: pa, unit: '%', target: 75, direction: 'higher_better', trend: seededTrend(seed + 7, pa, 0.15, 0.9, 1) },
    agentBehaviour: { key: 'agentBehaviour', label: 'Agent Behaviour Score', value: ab, unit: '/5', target: 4.0, direction: 'higher_better', trend: seededTrend(seed + 13, ab, 0.01, 0.15, 1) },
  }
}

// streakHistory: last 14 days before today, oldest first.
// x = read at least one Q-tip, f = freeze used, - = no Q-tips delivered (neutral), . = missed
function hist(pattern) {
  return pattern.split('').map((c) => (c === 'x' ? 'done' : c === 'f' ? 'freeze' : c === '-' ? 'none' : 'miss'))
}

function streakFrom(h) {
  let n = 0
  for (let i = h.length - 1; i >= 0; i--) {
    if (h[i] === 'done') n++
    else if (h[i] === 'freeze' || h[i] === 'none') continue
    else break
  }
  return n
}

const AGENT_SEED = [
  // id, name, email, initials, [seed, csat, adherence, behaviour], xp, weekXp, history, freezes
  ['aidza', 'Aidza Machuca', 'aidza.machuca@hexclad.com', 'AM', [11, 4.4, 74.2, 4.3], 470, 95, 'xxx--xxxfx--xx', 1],
  ['hady', 'Hady Magdy', 'hady.magdy@quantanite.com', 'HM', [23, 4.1, 68.9, 3.8], 235, 60, 'x.x--xxxxx--xx', 1],
  ['michael', 'Michael Naidoo', 'michael.naidoo@hexclad.com', 'MN', [31, 4.7, 96.0, 4.7], 1850, 160, 'xxx--xxxxx--xx', 2],
  ['janine', 'Janine Jacobs', 'janine.jacobs@hexclad.com', 'JJ', [37, 4.5, 89.4, 4.4], 1320, 140, 'xxx--xxfxx--xx', 1],
  ['ayanda', 'Ayanda Mbeki', 'ayanda.mbeki@hexclad.com', 'AB', [41, 4.2, 71.2, 3.9], 610, 120, 'x.x--xxxxx--xx', 1],
  ['nomsa', 'Nomsa Dlamini', 'nomsa.dlamini@hexclad.com', 'ND', [47, 3.8, 53.3, 3.6], 190, 30, 'xx.--x.x.x--..', 0],
  ['pieter', 'Pieter Botha', 'pieter.botha@hexclad.com', 'PB', [53, 4.0, 60.0, 3.7], 720, 110, 'xxx--xx.xx--xx', 1],
  ['thabo', 'Thabo van der Merwe', 'thabo.vandermerwe@hexclad.com', 'TV', [59, 4.6, 46.7, 4.0], 1700, 150, 'xxx--xxxxx--xx', 2],
  ['sipho', 'Sipho Khumalo', 'sipho.khumalo@hexclad.com', 'SK', [61, 3.7, 24.4, 3.5], 140, 25, 'x.x--..x.x--.x', 0],
  ['lerato', 'Lerato Nkosi', 'lerato.nkosi@hexclad.com', 'LN', [67, 3.6, 17.8, 3.2], 95, 20, '.x.--x..x.--..', 0],
]

export const agents = Object.fromEntries(
  AGENT_SEED.map(([id, name, email, initials, k, xp, weekXp, pattern, freezes]) => {
    const history = hist(pattern)
    return [id, {
      id, name, email, initials, channel: 'email',
      real: id === 'aidza' || id === 'hady',
      kpis: kpiSet(...k),
      seed: { xp, weekXp, history, streakBeforeToday: streakFrom(history), freezes },
    }]
  }),
)

// Topic badges: confirmed improvements per topic (resolved_count). ILLUSTRATIVE.
export const topicBadges = {
  aidza: [{ topic: 'Clear next steps', resolved: 3 }, { topic: 'Care before warranty', resolved: 1 }, { topic: 'Serial number generation', resolved: 0 }],
  hady: [{ topic: 'Calm tone on sensitive requests', resolved: 1 }, { topic: 'Acknowledge before asking', resolved: 0 }, { topic: 'Warranty claim intake', resolved: 0 }],
  michael: [{ topic: 'Process adherence', resolved: 7 }, { topic: 'Personalised closing', resolved: 3 }, { topic: 'Empathy statement', resolved: 2 }],
  janine: [{ topic: 'Closing and verification', resolved: 6 }, { topic: 'Closing recap', resolved: 1 }],
  ayanda: [{ topic: 'Escalation eligibility', resolved: 2 }, { topic: 'Expectation setting', resolved: 1 }],
  nomsa: [{ topic: 'Refund reference', resolved: 0 }],
  pieter: [{ topic: 'Empathy and communication', resolved: 3 }, { topic: 'Plain language', resolved: 1 }],
  thabo: [{ topic: 'Handle efficiency', resolved: 6 }, { topic: 'Macro use', resolved: 3 }],
  sipho: [{ topic: 'Case tagging', resolved: 1 }],
  lerato: [],
}

// Growth XP already in the pipeline (Pending → Earned). ILLUSTRATIVE.
export const seedGrowth = {
  aidza: [
    { id: 'g-aidza-1', topic: 'Clear next steps', amount: XP_RULES.implementedBonus, status: 'earned', when: '3 days ago' },
    { id: 'g-aidza-2', topic: 'Care before warranty', amount: XP_RULES.implementedBonus, status: 'pending', confirmsInDays: 9 },
  ],
  hady: [{ id: 'g-hady-1', topic: 'Calm tone on sensitive requests', amount: XP_RULES.implementedBonus, status: 'earned', when: 'last week' }],
  ayanda: [{ id: 'g-ayanda-1', topic: 'Escalation eligibility', amount: XP_RULES.implementedBonus, status: 'pending', confirmsInDays: 5 }],
  pieter: [{ id: 'g-pieter-1', topic: 'Empathy and communication', amount: XP_RULES.implementedBonus, status: 'earned', when: '4 days ago' }],
}

// Leaderboards (QIQ sends these; design doc 10.3). XP earned this week, not lifetime.
export const LEADERBOARD = {
  named: true, // leaderboard_named for the team board in this demo client
  otherTeams: [
    { name: 'Team Ndlovu', xp: 1240 },
    { name: 'Team Reyes', xp: 1180 },
    { name: 'Team Okafor', xp: 990 },
    { name: 'Team Patel', xp: 870 },
  ],
  agentOfWeek: { agentId: 'michael', period: 'last week' },
  mostImproved: { agentId: 'ayanda', period: 'September' },
}

// ---------------------------------------------------------------------------
// Sessions: a standing weekly 1:1 for every agent, plus additional 1:1s
// (critical failure, repeat worsened, convergence). ILLUSTRATIVE except Hady's focus.
// ---------------------------------------------------------------------------
export function localISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function dayOffset(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return localISO(d)
}

// Session dates land on working days only.
export function workday(n) {
  const d = new Date()
  let left = n
  while (left > 0) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) left--
  }
  return localISO(d)
}

export const TRIGGER_LABEL = {
  weekly: 'Weekly 1:1',
  critical_failure: 'Additional · critical failure',
  repeat_worsened: 'Additional · repeat worsened',
  convergence: 'Additional · several topics',
}

export const DECLINE_REASONS = ['Already addressed', 'Agent on leave', 'Agent left team', 'Other']

const SOP = {
  intake: 'Warranty Claims SOP, 3.1 Intake: confirm proof of purchase, photos and purchase date before progressing (v4, MUST)',
  verify: 'Account Management SOP, 4.2 Account closure: verify the account holder before any change (v3, MUST · BLOCKER)',
  refund: 'Payments and Refunds SOP, 2.3 Refund method: refund to the original payment method only (v2, MUST · BLOCKER)',
  legal: 'Escalations SOP, 5.1 Legal mentions: acknowledge and route to the legal queue (v2, MUST)',
  nextStep: 'Warranty Claims SOP, 3.4 Closing the reply: state the next step and timeframe (v4, SHOULD)',
  t1: 'Escalations SOP, 2.2 Tier 1 criteria: order value and warranty window (v2, MUST)',
}

export const initialQueue = [
  {
    id: 'q-hady-w', agentId: 'hady', type: 'weekly', trigger: 'weekly', topicKey: 'warranty_claim_intake_completeness', topic: 'Warranty claim intake',
    kpiKey: 'pa', status: 'scheduled', date: workday(3), time: '11:00', arrivedDaysAgo: 2,
    whyFlagged: 'The weekly run found claims progressing with proof of purchase, photos or purchase date missing in 3 email threads. QIQ also sent Hady a weekly Q-tip on it; this 1:1 is the conversation.',
    focus: [{
      topic: 'Warranty claim intake completeness', saw: 'Claims progressed with required information missing in 3 of this week’s warranty threads.', workOn: 'One complete intake check before progressing: Proof → Photos → Purchase date.',
      sop: SOP.intake, training: [{ title: 'HexClad Warranty Claims Training (deck)', location: 'Slides 12 to 15: required intake documents', why: 'Shows the exact intake checklist agents were taught.' }], followup: null,
    }],
    positives: ['Opened with acknowledgement in 4 of 5 frustrated-customer threads since last week’s tip (follow-up check: applied).', 'Calm, professional tone on sensitive requests.'],
    talkingPoints: ['Walk through one recent warranty claim and check the intake at each step.', 'Ask what makes it tempting to progress before all three items are in.', 'Agree the Proof → Photos → Purchase date check as a habit for two weeks.'],
    realEvidence: true,
  },
  {
    id: 'q-lerato-cf', agentId: 'lerato', type: 'additional', trigger: 'critical_failure', topicKey: 'deactivation_process_adherence', topic: 'Account deactivation without verification',
    kpiKey: 'pa', status: 'scheduled', date: workday(1), time: '09:00', arrivedDaysAgo: 1, cfId: 'cf-lerato',
    whyFlagged: 'Critical failure: a permanent account deactivation was processed without verifying the account holder. Process adherence has been under target all week.',
    focus: [{ topic: 'Verify before any account change', saw: 'Account permanently deactivated without verifying the sender owned it; no confirmation email.', workOn: 'Verify email and one order number before any change; send the closure confirmation.', sop: SOP.verify, training: [{ title: 'Account Management Training (deck)', location: 'Slides 6 to 9: verifying the account holder', why: 'The verification steps as taught at induction.' }], followup: null }],
    positives: ['Replies are polite and clear.'],
    talkingPoints: ['Review the deactivation workflow step by step.', 'Role-play an identity verification.', 'Agree to run full verification on every account change this week.'],
  },
  {
    id: 'q-nomsa-cf', agentId: 'nomsa', type: 'additional', trigger: 'critical_failure', topicKey: 'refund_method', topic: 'Refund to the wrong payment method',
    kpiKey: 'pa', status: 'awaiting', arrivedDaysAgo: 2, cfId: 'cf-nomsa', emailed: true,
    whyFlagged: 'Critical failure: a duplicate charge was refunded to a new card instead of the original payment method. Finance flagged the mismatch.',
    focus: [{ topic: 'Refund to the original method only', saw: 'Refund sent to a card the customer mentioned, not the original payment method.', workOn: 'Refund to the original method; if that card is cancelled, follow the cancelled-card route.', sop: SOP.refund, training: [{ title: 'Refund Tool Guide (PDF)', location: 'Pages 3 to 5: refund method rules', why: 'Covers the cancelled-card case directly.' }], followup: null }],
    positives: ['Thorough with payment details and quick to resolve.'],
    talkingPoints: ['Walk through why the refund method is a hard rule.', 'Practise the reply for a customer whose card is cancelled.'],
  },
  {
    id: 'q-nomsa-w', agentId: 'nomsa', type: 'weekly', trigger: 'weekly', topicKey: 'payment_resolution_protocol', topic: 'Payment resolution on first reply',
    kpiKey: 'pa', status: 'awaiting', arrivedDaysAgo: 1,
    whyFlagged: 'Weekly review: eligible payment queries were passed to finance when the refund tool covered them, leading to repeat contacts.',
    focus: [{ topic: 'Resolve eligible payment queries directly', saw: 'Duplicate charges and small partial refunds were routed to finance.', workOn: 'Use the refund tool for scenarios under the limit.', sop: 'Payments and Refunds SOP, 2.1 Agent refund limit (v2, SHOULD)', training: [{ title: 'Refund Tool Guide (PDF)', location: 'Pages 3 to 5: duplicate charges and partial refunds', why: 'Same section covers both scenarios.' }], followup: null }],
    positives: [],
    talkingPoints: ['Show which payment scenarios the refund tool covers.', 'Walk through two recent examples.'],
  },
  {
    id: 'q-sipho-rw', agentId: 'sipho', type: 'additional', trigger: 'repeat_worsened', topicKey: 'legal_escalation_protocol', topic: 'Legal escalation protocol',
    kpiKey: 'pa', status: 'awaiting', arrivedDaysAgo: 4, history: 'repeat_worsened',
    whyFlagged: 'Legal-mention emails were answered directly again. The topic was covered in last week’s 1:1 and the pattern got worse.',
    focus: [{ topic: 'Route legal mentions, do not respond', saw: 'Several legal-mention emails answered directly this week.', workOn: 'Acknowledge only, then route to the legal queue.', sop: SOP.legal, training: [{ title: 'HexClad Escalations Training (PDF)', location: 'Pages 8 to 11: legal and chargeback mentions', why: 'The routing rule with worked examples.' }], followup: { verdict: 'not_applied', relevant: 4, applied: 1, quote: 'I understand you are considering legal action, but our policy is clear on this.' } }],
    positives: ['Responds quickly and politely.'],
    talkingPoints: ['Go through what counts as a legal mention.', 'Practise the acknowledge-and-route reply.', 'Check he knows where the legal queue is.'],
  },
  {
    id: 'q-thabo-w', agentId: 'thabo', type: 'weekly', trigger: 'weekly', topicKey: 'handle_efficiency', topic: 'Escalations that could be resolved directly',
    kpiKey: 'pa', status: 'awaiting', arrivedDaysAgo: 3,
    whyFlagged: 'Weekly review: two contacts went to Tier 1 that met the criteria to resolve directly. Quality is otherwise strong.',
    focus: [{ topic: 'Resolve before escalating', saw: 'Two contacts escalated to Tier 1 that met the criteria to resolve directly.', workOn: 'Check the Tier 1 criteria before escalating.', sop: SOP.t1, training: [], followup: null }],
    positives: ['Quality scores consistently high.', 'Uses the warranty macro well.'],
    talkingPoints: ['Look at the two escalations together.', 'Confirm the Tier 1 criteria.'],
  },
  {
    id: 'q-michael-w', agentId: 'michael', type: 'weekly', trigger: 'weekly', topicKey: 'progress_review', topic: 'Progress review',
    kpiKey: 'pa', status: 'scheduled', date: workday(1), time: '14:00', arrivedDaysAgo: 2, progressReview: true,
    whyFlagged: 'Nothing negative was routed this week, so this is a progress review.',
    focus: [], positives: ['Agent of the Week last week.', 'Process adherence 96%, the team benchmark.', 'Read every Q-tip on the day this week.'],
    talkingPoints: ['Recognise the week.', 'Ask what would help him mentor newer agents.'],
  },
  {
    id: 'q-aidza-w', agentId: 'aidza', type: 'weekly', trigger: 'weekly', topicKey: 'warranty_next_step_communication', topic: 'Next steps in warranty replies',
    kpiKey: 'csat', status: 'scheduled', date: workday(2), time: '13:30', arrivedDaysAgo: 2,
    whyFlagged: 'Weekly review: 4 of 11 warranty replies ended without a next step, and 3 customers wrote back to ask.',
    focus: [{ topic: 'One next step and a timeframe', saw: '4 of 11 warranty replies ended without a next step.', workOn: 'Close every warranty reply with who does what, and by when.', sop: SOP.nextStep, training: [], followup: null }],
    positives: ['Implemented Bonus earned on clear next steps earlier this month.', 'Confirms coverage quickly and warmly.'],
    talkingPoints: ['Reread two recent replies together.', 'Agree the closing-line check.'],
  },
  {
    id: 'q-janine-w', agentId: 'janine', type: 'weekly', trigger: 'weekly', topicKey: 'closing_and_verification', topic: 'Verify before closing',
    kpiKey: 'pa', status: 'scheduled', date: workday(2), time: '10:30', arrivedDaysAgo: 2,
    whyFlagged: 'Weekly review: one replacement closed without confirming the delivery address.',
    focus: [{ topic: 'Address check before closing', saw: 'One replacement closed without confirming the address.', workOn: 'Confirm the address on every replacement.', sop: 'Warranty Claims SOP, 3.5 Replacement dispatch (v4, MUST)', training: [], followup: null }],
    positives: ['Gold badge in closing and verification.', 'Strong quality scores all month.'], talkingPoints: ['Quick check-in; mostly positives.'],
  },
  {
    id: 'q-ayanda-w', agentId: 'ayanda', type: 'weekly', trigger: 'weekly', topicKey: 'escalation_eligibility', topic: 'Progress review',
    kpiKey: 'pa', status: 'scheduled', date: workday(3), time: '15:00', arrivedDaysAgo: 2, progressReview: true,
    whyFlagged: 'Nothing negative was routed this week, so this is a progress review. The T1 eligibility topic is improving.',
    focus: [], positives: ['Follow-up check on the T1 eligibility tip: applied in 5 of 6 relevant contacts.', 'Most Improved in September.'],
    talkingPoints: ['Recognise the improvement.', 'Agree what to keep doing.'],
  },
  {
    id: 'q-pieter-w', agentId: 'pieter', type: 'weekly', trigger: 'weekly', topicKey: 'plain_language', topic: 'Plain language',
    kpiKey: 'agentBehaviour', status: 'scheduled', date: workday(4), time: '11:30', arrivedDaysAgo: 2,
    whyFlagged: 'Weekly review: internal terms like RMA appeared in customer replies.',
    focus: [{ topic: 'Plain words for internal terms', saw: 'RMA and SKU appeared in replies.', workOn: 'Say what the term means instead.', sop: null, training: [], followup: null }],
    positives: ['Critical failures down to zero after last week’s 1:1.'], talkingPoints: ['Spot jargon in two recent replies.'],
  },
  {
    id: 'q-lerato-w', agentId: 'lerato', type: 'weekly', trigger: 'weekly', topicKey: 'open_order_check', topic: 'Open orders before deactivation',
    kpiKey: 'pa', status: 'scheduled', date: workday(4), time: '10:00', arrivedDaysAgo: 2,
    whyFlagged: 'Weekly review: an account was closed with an order still pending. The critical-failure 1:1 covers verification.',
    focus: [{ topic: 'Check open orders first', saw: 'An account closed with an order still pending.', workOn: 'Check open orders before any deactivation.', sop: 'Account Management SOP, 4.2 step 3 (v3, MUST)', training: [], followup: null }],
    positives: ['Polite and clear replies.'], talkingPoints: ['Follow up on the critical-failure session.'],
  },
  {
    id: 'q-sipho-w', agentId: 'sipho', type: 'weekly', trigger: 'weekly', topicKey: 'case_tagging', topic: 'Case tagging',
    kpiKey: 'pa', status: 'scheduled', date: workday(2), time: '15:30', arrivedDaysAgo: 2,
    whyFlagged: 'Weekly review: several closed cases had no contact-reason tag.',
    focus: [{ topic: 'Tag before closing', saw: 'Several cases closed without a tag.', workOn: 'Tag every case before closing.', sop: null, training: [], followup: null }],
    positives: ['Strong volume this week.'], talkingPoints: ['Quick check on tagging.'],
  },
  {
    id: 'q-pieter-last', agentId: 'pieter', type: 'weekly', trigger: 'weekly', topicKey: 'empathy_and_communication', topic: 'Empathy and communication',
    kpiKey: 'agentBehaviour', status: 'closed', date: dayOffset(-6), time: '14:00', arrivedDaysAgo: 8,
    whyFlagged: 'Critical failures linked to tone on frustrated contacts.', focus: [], positives: [], talkingPoints: [],
    closeOut: { happened: true, outcome: 'Improving', note: 'Agreed to open every frustrated contact with one line of acknowledgement. Critical failures now at zero.', smart: null },
  },
]

// Quality Cluster critical-failure records (arrive with the session instruction)
export const criticalFailures = [
  {
    id: 'cf-lerato', agentId: 'lerato', type: 'Critical failure', emailedAgo: 'yesterday',
    text: 'Permanent account deactivation processed without identity verification.',
    what: 'Account permanently deactivated without verifying the account holder',
    interactionId: 'EM-7f3a19', daysAgo: 1, channel: 'email', source: 'Quality Cluster · Process Adherence',
    summary: 'A customer emailed asking to close their HexClad account. The account was permanently deactivated in the same reply, without confirming the sender owned the account. The thread was closed with no confirmation email sent.',
    sop: { name: 'Account Management SOP', section: '4.2 Account closure', flow: 'Permanent deactivation' },
    step: 'Verify the account holder (email and order number) before any account change',
    steps: [
      { text: 'Acknowledge the closure request', status: 'done' },
      { text: 'Verify the account holder: email match plus one order number', status: 'missed', level: 'MUST', severity: 'BLOCKER' },
      { text: 'Check for open orders or active warranty claims', status: 'missed', level: 'MUST' },
      { text: 'Deactivate the account', status: 'done' },
      { text: 'Send the closure confirmation email', status: 'missed', level: 'SHOULD' },
    ],
    outcome: { cell: 'Process not followed · Resolved · Low predicted CSAT', resolution: 'Resolved (request completed)', csat: '2 / 5 predicted' },
    behaviour: [
      { dim: 'Ownership', score: 2, rationale: 'Actioned an irreversible change without the checks that protect the customer.', quote: 'I have gone ahead and closed your account as requested.' },
      { dim: 'Communication clarity', score: 3, rationale: 'Did not explain that deactivation is permanent or what happens to warranty records.', quote: 'Your account is now closed.' },
    ],
    quotes: [
      { from: 'Customer', text: 'Please close my account, I no longer want it.' },
      { from: 'Agent', text: 'I have gone ahead and closed your account as requested. Your account is now closed.' },
    ],
    pattern: 'Second deactivation this month with verification skipped. QIQ withdrew an unread Q-tip on the deactivation checklist because this 1:1 replaces it.',
  },
  {
    id: 'cf-nomsa', agentId: 'nomsa', type: 'Critical failure', emailedAgo: '2 days ago',
    text: 'Refund issued to a different card than the original payment method.',
    what: 'Refund sent to a card that was not the original payment method',
    interactionId: 'EM-42c8d0', daysAgo: 2, channel: 'email', source: 'Quality Cluster · Process Adherence',
    summary: 'A customer reported being charged twice for a cookware set. The duplicate charge was refunded to a new card the customer mentioned in the thread, not to the original payment method. Finance flagged the mismatch the next day.',
    sop: { name: 'Payments and Refunds SOP', section: '2.3 Refund method', flow: 'Duplicate charge refund' },
    step: 'Refund to the original payment method only',
    steps: [
      { text: 'Confirm the duplicate charge in the order system', status: 'done' },
      { text: 'Check the refund is within the agent limit', status: 'done' },
      { text: 'Refund to the original payment method only', status: 'missed', level: 'MUST', severity: 'BLOCKER' },
      { text: 'Share the refund reference and timeframe', status: 'missed', level: 'SHOULD' },
    ],
    outcome: { cell: 'Process not followed · Resolved · High predicted CSAT', resolution: 'Resolved (refund sent)', csat: '4 / 5 predicted' },
    behaviour: [
      { dim: 'Ownership', score: 3, rationale: 'Resolved the charge quickly but bypassed a payment control to do it.', quote: "No problem, I'll send the refund to your new card instead." },
    ],
    quotes: [
      { from: 'Customer', text: "I've cancelled that card, can you send it to my new one instead?" },
      { from: 'Agent', text: "No problem, I'll send the refund to your new card instead." },
    ],
    pattern: 'First critical failure for Nomsa.',
  },
]

// Other QIQ coach flags (neither a card nor a session)
export const attentionItems = [
  { id: 'att-thabo', agentId: 'thabo', type: 'Escalation Monitoring', text: 'Two contacts escalated to Tier 1 that met the criteria to resolve directly.', source: 'Quality Cluster · Escalation Monitoring' },
  { id: 'att-janine', agentId: 'janine', type: 'Positive pattern', text: 'Address checks on every replacement for three weeks running. Worth recognising in her 1:1.', source: 'Coaching Decision Trace · repeat improved' },
]

// Training recommendations: point to the client's own training material (no LMS this phase)
export const trainingRecos = [
  {
    id: 'tr-sipho', agentId: 'sipho', topic: 'Legal escalation protocol', route: 'Escalation', status: 'open', dueBy: dayOffset(14),
    rationale: 'Covered in two 1:1s within 6 weeks and the topic got worse after the last one.',
    refs: [{ title: 'HexClad Escalations Training (PDF)', location: 'Pages 8 to 11: legal and chargeback mentions' }, { title: 'New-hire induction recording', location: 'Video 2, 14:20 to 18:05' }],
  },
  {
    id: 'tr-lerato', agentId: 'lerato', topic: 'Verification before account changes', route: 'Direct (knowledge gap)', status: 'open', dueBy: dayOffset(14),
    rationale: 'No sign of the verification steps across 4 account changes, and no prior coaching on it.',
    refs: [{ title: 'Account Management Training (deck)', location: 'Slides 6 to 9: verifying the account holder' }],
  },
  {
    id: 'tr-thabo', agentId: 'thabo', topic: 'Tier 1 escalation criteria', route: 'Direct (knowledge gap)', status: 'open', dueBy: dayOffset(14), contentGap: true,
    rationale: 'Two contacts escalated that met the criteria to resolve directly.',
    refs: [],
  },
  {
    id: 'tr-nomsa', agentId: 'nomsa', topic: 'Refund tool', route: 'Direct (knowledge gap)', status: 'arranged', dueBy: dayOffset(10),
    rationale: 'Eligible refunds passed to finance across several contacts.',
    refs: [{ title: 'Refund Tool Guide (PDF)', location: 'Pages 3 to 5: duplicate charges and partial refunds' }],
  },
  {
    id: 'tr-ayanda', agentId: 'ayanda', topic: 'Escalation criteria', route: 'Escalation', status: 'completed', dueBy: dayOffset(-5),
    rationale: 'Repeated returns from Tier 1 last month.',
    refs: [{ title: 'HexClad Escalations Training (PDF)', location: 'Pages 4 to 7: Tier 1 criteria' }],
  },
]
