// QLens demo data.
//
// REAL: every card for Aidza Machuca and Hady Magdy (title, copy, validator checks,
// evidence scope, thread/message references) comes from the dry run of the QIQ
// email-channel Training & Coaching pipeline on HexClad data
// (phase5_evidence_traceability.csv + phase5_coaching_run_report.html).
// Customer message bodies are deliberately NOT included (they contain customer names).
//
// ILLUSTRATIVE: everything flagged `illustrative: true`, plus all KPI values/trends,
// XP, streak history, badges, sessions, the attention panel and training status.
// The other eight agents exist only to give the Coach page a realistic team size.

import evidenceRefs from './evidenceRefs.json'

export const TIERS = { MICRO: 'micro_coaching', COACHING: 'coaching' }

export const COACH = { name: 'Kagiso de Villiers', initials: 'KV', email: 'kagiso.devilliers@quantanite.com' }

// Days after which an unacknowledged card counts as overdue. QLens owns this
// clock-based rule; judgement-based escalation stays with QIQ.
export const OVERDUE_AFTER_DAYS = 2

// ---------------------------------------------------------------------------
// Gamification rules (QLens-owned state)
// ---------------------------------------------------------------------------
export const XP_RULES = {
  qbyte: 'XP varies by the size of the finding (15 to 20 XP)',
  coachingCard: 'Coaching cards carry bigger findings (35 to 50 XP)',
  dailyGoal: 25,
  sessionAttended: 50,
}

export const LEVELS = [
  { level: 1, name: 'Rookie', min: 0 },
  { level: 2, name: 'Starter', min: 100 },
  { level: 3, name: 'Regular', min: 250 },
  { level: 4, name: 'Pro', min: 500 },
  { level: 5, name: 'Expert', min: 900 },
  { level: 6, name: 'Ace', min: 1400 },
  { level: 7, name: 'Mentor', min: 2000 },
  { level: 8, name: 'Legend', min: 2800 },
]

export function levelFor(xp) {
  let cur = LEVELS[0]
  for (const l of LEVELS) if (xp >= l.min) cur = l
  const next = LEVELS.find((l) => l.min > xp) || null
  return { ...cur, next, toNext: next ? next.min - xp : 0, pct: next ? (xp - cur.min) / (next.min - cur.min) : 1 }
}

// Effort badges: fast, frequent, fully within the agent's control.
// Skill-threshold badges (Bronze to Platinum) are deliberately left out until the
// badging mechanism is decided.
export const BADGES = [
  { id: 'first-qbyte', name: 'First Step', icon: 'Footprints', desc: 'Acknowledge your first Q-Byte.', goal: 1, metric: 'acked' },
  { id: 'daily-goal', name: 'Full House', icon: 'CheckCheck', desc: "Finish all of a day's Q-Bytes.", goal: 1, metric: 'dailyGoals' },
  { id: 'streak-5', name: 'On a Roll', icon: 'Flame', desc: 'Reach a 5-day streak.', goal: 5, metric: 'streak' },
  { id: 'streak-10', name: 'Habit Formed', icon: 'Zap', desc: 'Reach a 10-day streak.', goal: 10, metric: 'streak' },
  { id: 'acked-25', name: 'Curious Mind', icon: 'BookOpen', desc: 'Acknowledge 25 cards.', goal: 25, metric: 'acked' },
  { id: 'coaching-card', name: 'Big Picture', icon: 'Telescope', desc: 'Acknowledge a Coaching card.', goal: 1, metric: 'coachingAcked' },
  { id: 'showed-up', name: 'Showed Up', icon: 'CalendarCheck', desc: 'Attend a 1:1 coaching session.', goal: 1, metric: 'sessions' },
]

// ---------------------------------------------------------------------------
// REAL cards (HexClad dry run)
// ---------------------------------------------------------------------------
const allPass = ['readiness', 'pii', 'single_customer_narration', 'recurrence_support', 'unsupported_claims', 'length', 'single_focus'].map((name) => ({ name, pass: true }))

const realCards = [
  {
    id: 'aidza-serial-number',
    agentId: 'aidza',
    tier: TIERS.MICRO,
    topicKey: 'serial_number_generation_when_unavailable',
    title: 'Complete the Claim with the Right Identifier',
    summary: 'When a customer cannot provide a serial number on a warranty replacement, this is the step to take before the claim is finished.',
    category: 'process',
    evidenceScope: 'single_signal',
    readMins: 1,
    xp: 15,
    sections: {
      opening: 'The claim was handled with clear communication, confirmed warranty coverage, and helpful next steps for the customer.',
      trend: 'In a warranty replacement situation where the customer cannot provide a serial number, the claim can be left incomplete if the required serial number is not generated before processing is finished.',
      focus: 'When the customer cannot provide a serial number, generate the required serial number before completing the warranty claim.',
      guidance: 'No serial number → Generate it → Complete the claim.',
      example: "I'll generate the required serial number now, then complete the replacement claim and explain the next steps.",
      challenge: 'On your next three warranty replacement conversations where the customer cannot provide a serial number, use the no-number checkpoint before completing each claim.',
      why: 'This can support process adherence and help keep warranty claims complete and ready for the next step.',
    },
    checks: allPass,
    evidence: { threadCount: 1, channel: 'email', supportStrength: 'Explicit', detectionReasoning: 'A warranty replacement claim where the customer could not provide a serial number was processed, but the required serial number was not generated in line with the SOP.' },
    brief: {
      evidenceSummary: 'A warranty replacement claim where the customer could not provide a serial number was processed, but the required serial number was not generated in line with the SOP.',
      coachingAngle: 'Generate the required serial number before completing the claim, as specified by the SOP.',
      priorityReason: 'Ranked first because the evidence explicitly identifies a required SOP step that was not completed, creating a supported compliance and case-processing risk.',
      history: 'new',
    },
    quotes: [
      { thread: '2f81b7', seq: 4, from: 'Customer', date: '29 Jul', text: 'I carefully checked underneath the rim of the pot, around both handles, and the bottom, but I couldn\'t find a serial number anywhere.' },
      { thread: '2f81b7', seq: 5, from: 'Agent', date: '29 Jul', text: 'Please don\'t worry, since this falls under our warranty coverage, we\'ll go ahead and process the replacement for you. Your 8 QT pot is approved for replacement!' },
    ],
    deliveredDaysAgo: 0,
  },
  {
    id: 'hady-data-erasure',
    agentId: 'hady',
    tier: TIERS.MICRO,
    topicKey: 'data_erasure_request_routing',
    title: 'Route Data-Removal Requests Correctly',
    summary: 'A request to erase personal data is not an unsubscribe request. Here is the route that gets it to the right process.',
    category: 'process',
    evidenceScope: 'single_signal',
    readMins: 1,
    xp: 15,
    sections: {
      opening: 'Your calm, professional tone is a strong foundation for handling sensitive requests clearly.',
      trend: 'When a customer asks for their personal data to be erased, treat that as a data-removal request, not an unsubscribe request. In the supported interaction, unsubscribe guidance was given instead, the required escalation was missed, and the case was closed without confirmation that removal was complete.',
      focus: 'When the customer specifically requests data erasure, select the data-erasure route, escalate it through the required channel, and keep the case open until the required confirmation is available.',
      guidance: 'Hear the request → Route it for erasure → Escalate and confirm before closure.',
      example: "I understand you're asking for your personal data to be erased, which is different from unsubscribing. I'll route this as a data-erasure request and follow the required escalation and confirmation process before closing the case.",
      challenge: 'On your next three conversations that include a request to remove personal data, use the sequence Hear → Route → Escalate → Confirm before closing the case.',
      why: "Using the correct route can help the customer's specific request reach the right process, reduce avoidable frustration, and support accurate case closure.",
    },
    checks: allPass,
    evidence: { threadCount: 1, channel: 'email', supportStrength: 'Explicit', detectionReasoning: 'A customer data-erasure request was handled as an unsubscribe request instead. The request was not escalated through the required route, and the ticket was closed without confirmation that the data-removal process had been completed.' },
    brief: {
      evidenceSummary: 'A customer data-erasure request was handled as an unsubscribe request instead. The request was not escalated through the required route, and the ticket was closed without confirmation that the data-removal process had been completed.',
      coachingAngle: 'Use the data-erasure route for deletion requests rather than the unsubscribe route, and keep the case aligned with the required escalation and confirmation process.',
      priorityReason: 'Ranked first under the supported compliance-breach and serious customer-risk override.',
      history: 'new',
    },
    quotes: [
      { thread: 'd580a0', seq: 1, from: 'Customer', date: '28 Jul', text: 'I ask you to please delete any personal data of mine you have stored on your systems. Would appreciate your cooperation and an email confirming when the deletion has been completed.' },
      { thread: 'd580a0', seq: 2, from: 'Agent', date: '28 Jul', text: 'You can easily click the unsubscribe link at the bottom of any HexClad email we\'ve sent to you.' },
    ],
    deliveredDaysAgo: 0,
  },
  {
    id: 'hady-warranty-intake',
    agentId: 'hady',
    tier: TIERS.COACHING,
    topicKey: 'warranty_claim_intake_completeness',
    title: 'Before You Progress: Proof, Photos, Purchase Details',
    summary: 'A pattern across several warranty contacts: cases moved forward with required information still missing.',
    category: 'process',
    evidenceScope: 'multi_interaction_trend',
    readMins: 2,
    xp: 40,
    sections: {
      opening: 'Your calm, professional approach gives you a strong base for making this check feel clear and purposeful.',
      trend: 'Across several recent warranty-claim contacts about defective pans or other items, cases progressed with required information still missing, including proof of purchase or order details, photos, and the purchase date. Repeating requests without completing the intake check can leave the claim unresolved.',
      focus: 'When a customer provides information for a defective-item warranty claim, complete and document the full required-information check, including proof of purchase or order details, photos, and purchase date, before progressing the case.',
      guidance: '"Proof → Photos → Purchase date → Progress": check each item, confirm what is recorded, then move the claim forward.',
      example: "Before I progress the claim, I'll check that we have your proof of purchase or order details, the item photos, and the purchase date recorded.",
      challenge: 'On your next three defective-item warranty-claim contacts, use the Proof → Photos → Purchase date check before progressing any case.',
      why: 'A complete intake can help reduce repeated information requests, support accurate documentation, and give the customer a clearer path toward resolution.',
    },
    checks: allPass,
    evidence: { threadCount: 3, channel: 'email', supportStrength: 'Pattern across 3 threads' },
    weekly: [
      { v: '3', k: 'warranty threads this week showed the same gap' },
      { v: '3 of 3', k: 'moved forward with proof, photos or purchase date missing' },
    ],
    brief: {
      evidenceSummary: 'Across three warranty threads, claims moved forward before proof of purchase, photos and purchase date were all confirmed, so the customer was asked for information in several rounds.',
      coachingAngle: 'Use one complete warranty-claim intake check before progressing the case, covering every required document and customer or order detail.',
      priorityReason: 'Recurs across three threads in the lookback window and repeatedly delayed the claim.',
      history: 'new',
    },
    quotes: [
      { thread: '10b0aa', seq: 2, from: 'Agent', date: '28 Jul', text: 'Could you please confirm whether the item in question is a pan or a wok? Additionally, we kindly ask that you send us clear photos of the cookware cleaned and dried.' },
      { thread: '10b0aa', seq: 6, from: 'Agent', date: '28 Jul', text: 'To move forward with providing a replacement, we kindly ask that you share the following details: Order Number, confirm your current shipping address, confirm the size of the affected cookware, serial number, proof of warranty registration.' },
      { thread: '10b0aa', seq: 7, from: 'Customer', date: '28 Jul', text: 'Lastly I\'m not jumping through a bunch of hoops to get a replacement.' },
      { thread: 'a846e9', seq: 5, from: 'Agent', date: '28 Jul', text: 'To move forward with assessing the warranty, we kindly ask that you provide the following information: confirm your current shipping address, size of the affected cookware, serial number, proof of warranty registration.' },
    ],
    deliveredDaysAgo: 0,
  },
  {
    id: 'hady-courtesy-replacement',
    agentId: 'hady',
    tier: TIERS.MICRO,
    topicKey: 'courtesy_replacement_without_proof',
    title: 'Missing Proof? Check the Courtesy Route',
    summary: 'When proof of purchase is missing, check the permitted courtesy route before closing or deferring the claim.',
    category: 'process',
    evidenceScope: 'limited_pattern',
    readMins: 1,
    xp: 20,
    sections: {
      opening: 'You already communicate warranty requirements clearly and keep a professional tone; this reminder helps carry that clarity through to the available resolution.',
      trend: 'In some recent warranty conversations where proof of purchase was missing, the claim was left without checking and applying the permitted one-time courtesy replacement or warranty-registration route.',
      focus: 'When proof of purchase is unavailable, check the permitted courtesy-replacement or warranty-registration route before closing or deferring the claim.',
      guidance: 'Missing proof → Check the permitted route → Apply it or continue with the allowed registration path.',
      example: "I can see the proof of purchase isn't available, so I'll check the permitted courtesy-replacement or warranty-registration route before we close this claim.",
      challenge: 'On your next three warranty conversations where proof of purchase is missing, use the cue before closing or deferring the claim.',
      why: 'This can support clearer ownership and may reduce claims being left unresolved when an allowed route is available.',
    },
    checks: allPass,
    evidence: { threadCount: 2, channel: 'email', supportStrength: 'Limited pattern across 2 threads' },
    brief: {
      evidenceSummary: 'In two warranty threads where proof of purchase was missing, the claim was deferred without checking the one-time courtesy replacement or warranty-registration route.',
      coachingAngle: 'When proof of purchase is missing, check and apply the permitted one-time courtesy-replacement or warranty-registration route before closing or deferring the claim.',
      priorityReason: 'Limited pattern across two threads; an allowed resolution route was available and not used.',
      history: 'new',
    },
    quotes: [
      { thread: '6d02a8', seq: 5, from: 'Customer', date: '20 Jul', text: 'I unfortunately do not remember the specific platform or retailer where I placed the orders. I have already completed the warranty registration using the link provided in your previous email.' },
      { thread: '6d02a8', seq: 4, from: 'Agent', date: '18 Jul', text: 'Unfortunately, without a valid proof of purchase or order number, we cannot provide a replacement.' },
      { thread: '3138a9', seq: 10, from: 'Agent', date: '25 Jul', text: 'To move forward with your claim and process a replacement, we need a Proof of Purchase.' },
    ],
    deliveredDaysAgo: 0,
  },
  {
    id: 'hady-uk-warranty-blocked',
    agentId: 'hady',
    tier: TIERS.MICRO,
    topicKey: 'uk_warranty_replacement_escalation',
    title: 'UK warranty replacement escalation',
    summary: 'Held by the PII validator. Never sent to the agent.',
    category: 'process',
    heldForReview: true,
    blockedReason: "PII: card reuses the name 'International' from the source evidence; never name a customer or any individual",
    blockedSummary: 'The generator produced this card twice. Both attempts wrote a team name from the source evidence into the copy, which the deterministic PII validator rejects. Nothing was sent to the agent. This is the safety mechanism working as designed.',
    coachingAngle: 'Before processing a UK warranty replacement, complete the required International-team or Team Lead escalation and assignment step.',
    checks: [
      { name: 'readiness', pass: true },
      { name: 'pii', pass: false },
      { name: 'unsupported_claims', pass: true },
      { name: 'card_constraints', pass: true },
    ],
    evidence: { threadCount: 4, channel: 'email', supportStrength: 'Pattern across 4 threads' },
    brief: {
      evidenceSummary: 'UK warranty replacements were approved and shipped without the International-team or Team Lead escalation and assignment step.',
      coachingAngle: 'Before processing a UK warranty replacement, complete the required International-team or Team Lead escalation and assignment step.',
      priorityReason: 'Process step skipped across four UK threads.',
      history: 'new',
    },
    quotes: [
      { thread: 'f00707', seq: 4, from: 'Agent', date: '28 Jul', text: 'Your 20cm Hybrid Frying Pan is approved for replacement! We will process it and ship it to the address you have provided below within 3 to 5 business days!' },
      { thread: '6db038', seq: 3, from: 'Agent', date: '28 Jul', text: 'Your 20cm, 25cm and 30cm Hybrid Frying Pans are approved for replacement!' },
    ],
    xp: 0,
    readMins: 1,
    deliveredDaysAgo: 0,
  },
]

// ---------------------------------------------------------------------------
// ILLUSTRATIVE card pool (for the eight roster agents, plus two extra for Aidza)
// ---------------------------------------------------------------------------
function ill(id, agentId, tier, topicKey, title, summary, xp, s, extra = {}) {
  return {
    id, agentId, tier, topicKey, title, summary, xp,
    category: 'process',
    evidenceScope: tier === TIERS.COACHING ? 'multi_interaction_trend' : 'single_signal',
    readMins: tier === TIERS.COACHING ? 2 : 1,
    sections: s,
    checks: allPass,
    evidence: { threadCount: tier === TIERS.COACHING ? 3 : 1, channel: 'email', supportStrength: tier === TIERS.COACHING ? 'Pattern across 3 threads' : 'Explicit' },
    illustrative: true,
    brief: {
      evidenceSummary: s.trend,
      coachingAngle: s.focus,
      priorityReason: tier === TIERS.COACHING ? 'Recurs across several contacts in the lookback window.' : 'Clear single signal with direct customer impact.',
      history: 'new',
    },
    quotes: [],
    deliveredDaysAgo: 0,
    ...extra,
  }
}

const S = (opening, trend, focus, guidance, example, challenge, why) => ({ opening, trend, focus, guidance, example, challenge, why })

const illustrativeCards = [
  ill('aidza-next-step', 'aidza', TIERS.COACHING, 'warranty_next_step_communication', 'End Every Warranty Reply with the Next Step', 'Your weekly review: several warranty replies this week confirmed the claim but left the customer unsure what happens next.', 40,
    S(
      'Looking across your warranty emails this week, your replies are friendly and you confirm coverage quickly, which customers clearly appreciate.',
      'In 4 of your 11 warranty replies this week, the email confirmed the replacement or the next document needed, but did not say what happens next or when the customer will hear back. In 3 of those 4 threads the customer wrote again within two days to ask for an update, and those threads took longer to close than your other warranty cases.',
      'Close every warranty reply with one clear next step: who does what, and by when. If you are waiting on the customer, say exactly what you need from them; if they are waiting on us, give a timeframe.',
      'Confirm the outcome → Name the next step → Give the timeframe → Say how they will hear from us.',
      "Your replacement is approved. Next, our warehouse ships it within 3 to 5 business days, and you'll get a tracking email as soon as it leaves us. You don't need to do anything else.",
      'For the rest of this week, reread the last paragraph of every warranty reply before you send it and check it answers "what happens next, and when?"',
      'Customers who know what to expect rarely need to chase. Across a week this can cut follow-up emails, shorten time to close, and lift how customers rate the whole thread.',
    ),
    {
      evidence: { threadCount: 4, channel: 'email', supportStrength: 'Pattern across 4 of 11 threads' },
      weekly: [
        { v: '4 of 11', k: 'warranty replies ended without a next step' },
        { v: '3', k: 'customers emailed again within 2 days' },
        { v: '+1.4 days', k: 'longer to close than your other warranty threads' },
      ],
      brief: {
        evidenceSummary: 'Across the weekly lookback, 4 of Aidza\'s 11 warranty replies confirmed the outcome but gave no next step or timeframe. 3 of those 4 threads received a customer follow-up within 48 hours asking for an update, and those threads closed later than her other warranty cases.',
        coachingAngle: 'End every warranty reply with one explicit next step and a timeframe, covering who acts next and how the customer will hear back.',
        priorityReason: 'Recurring across the week (4 threads) and linked to repeat contacts, so it cleared the multi-interaction bar for a Coaching card rather than a Q-Byte.',
        history: 'new',
      },
    }),
  ill('aidza-care-guide', 'aidza', TIERS.MICRO, 'care_before_warranty', 'Check Care Steps Before Warranty', 'For sticking or discoloured pans, a quick care check often solves it before a claim is needed.', 20,
    S('You handle warranty questions confidently.', 'A sticking-pan email went straight to warranty without checking whether seasoning or heat level was the cause.', 'For sticking or discolouration, run the care checklist before starting a warranty claim.', 'Ask about heat and oil → Share the re-seasoning steps → Offer warranty if it persists.', "Before we look at a replacement, could you try re-seasoning the pan using these steps? If it's still sticking after that, I'll start the warranty claim straight away.", 'On your next three sticking-pan contacts, share the care steps first.', 'Solving it on the first reply is faster for the customer and avoids an unnecessary claim.')),
  ill('michael-closing', 'michael', TIERS.MICRO, 'personalised_closing', 'Personalise the Close', 'Your closings are consistent. One line tied to the customer\'s issue makes them land better.', 15,
    S('Your process adherence is the benchmark for the team.', 'Closings used the same standard wording regardless of the issue handled.', 'Add one line to the close that refers back to what the customer asked for.', 'Resolve → Recap their issue in one line → Close.', 'Your replacement pan is on its way, so you should be cooking again by the weekend.', 'Personalise the closing line on your next five emails.', 'A tailored close can lift how customers rate the interaction.')),
  ill('michael-empathy', 'michael', TIERS.MICRO, 'empathy_statement', 'Match Empathy to the Moment', 'A gift that arrived damaged calls for a different opening than a routine query.', 15,
    S('Your replies are accurate and complete.', 'Emotional contacts received the same opening line as routine ones.', 'When the customer shares why it matters, reflect that in your first sentence.', 'Notice the context → Reflect it → Then solve.', "I'm sorry the set arrived damaged, especially when it was meant as a wedding gift.", 'Try a context-specific opening on your next three emotional contacts.', 'Customers who feel heard are more patient with the fix.')),
  ill('janine-verification', 'janine', TIERS.MICRO, 'closing_and_verification', 'Verify Before You Close', 'A final address check before closing a replacement stops parcels going to old addresses.', 15,
    S('Your quality scores are among the strongest on the team.', 'One replacement was closed without confirming the delivery address on file.', 'Confirm the delivery address before closing any replacement.', 'Replacement approved → Confirm address → Close.', 'Before I send this out, can you confirm the delivery address is still 12 Oak Lane?', 'Use the address check on your next three replacements.', 'This can prevent a lost parcel and a second contact.')),
  ill('janine-recap', 'janine', TIERS.MICRO, 'closing_recap', 'Recap What Happens Next', 'A two-line recap at the end of the email removes guesswork for the customer.', 15,
    S('Your tone is consistently friendly.', 'Longer replies left the customer to work out which action was theirs and which was ours.', 'End longer replies with a short "what happens next" recap.', 'Our step → Your step → When.', "Next steps: we'll ship the replacement today, and you'll get tracking by email within 24 hours.", 'Add a recap to your next three multi-step replies.', 'Clear ownership can reduce follow-up questions.')),
  ill('ayanda-t1', 'ayanda', TIERS.COACHING, 'escalation_eligibility', 'T1 Escalation: Check Eligibility First', 'Across several contacts, cases were escalated to T1 before the eligibility checks were done.', 40,
    S('Your resolution rate has improved a lot this month.', 'Across several recent contacts, cases were escalated to Tier 1 before the order value and warranty window checks were complete, and T1 returned them.', 'Before escalating to T1, confirm the order value and warranty window meet the escalation criteria.', 'Check value → Check window → Escalate or resolve.', "I've checked your order details and this qualifies for our specialist team, so I'm passing it to them now.", 'On your next three escalations, run both eligibility checks first.', 'Fewer returned escalations means faster resolution for the customer.')),
  ill('ayanda-hold', 'ayanda', TIERS.MICRO, 'expectation_setting', 'Set the Wait Time Up Front', 'Telling the customer how long the specialist team takes stops the "any update?" email.', 15,
    S('Your escalation notes are clear.', 'An escalated case had no wait time given to the customer.', 'When escalating, tell the customer the expected response time.', 'Escalate → Share the timeframe → Offer a contact route.', 'Our specialist team usually replies within two working days.', 'Give a timeframe on your next three escalations.', 'Customers wait more patiently when they know how long.')),
  ill('nomsa-payment', 'nomsa', TIERS.COACHING, 'payment_resolution_protocol', 'Payment Issues: Resolve on First Reply', 'A pattern: payment queries were passed on when the refund tool could have resolved them directly.', 45,
    S('You are thorough with payment details.', 'Across several payment queries, the case was passed to finance even though the refund tool covered the scenario, leading to repeat contacts.', 'For duplicate charges and partial refunds under the limit, use the refund tool directly.', 'Identify the payment type → Check the limit → Resolve or route.', "I can see the duplicate charge and I've refunded it now. You'll see it back in 3 to 5 working days.", 'Resolve your next three eligible payment queries in the tool.', 'First-reply resolution can lift FCR and remove repeat contacts.')),
  ill('nomsa-ref', 'nomsa', TIERS.MICRO, 'refund_reference', 'Always Share the Refund Reference', 'Giving the refund reference in the reply helps customers track it with their bank.', 15,
    S('Your refunds are processed accurately.', 'A refund was confirmed without the reference number.', 'Include the refund reference in every refund confirmation.', 'Process → Copy the reference → Share it.', 'Your refund reference is RF-20931, in case your bank asks for it.', 'Include the reference in your next three refund emails.', 'It can reduce "where is my refund" contacts.')),
  ill('pieter-empathy', 'pieter', TIERS.MICRO, 'empathy_and_communication', 'Empathy Before Process', 'Lead with one line of acknowledgement before asking for order details.', 15,
    S('Your critical failures have dropped to zero, which is a big step.', 'A frustrated customer was asked for order details in the first line.', 'Acknowledge the frustration in one sentence before any request.', 'Acknowledge → Then ask → Then solve.', "I'm sorry this has taken so long to sort out. Could you share your order number so I can fix it today?", 'Open with acknowledgement on your next three frustrated contacts.', 'It can calm the conversation and speed up resolution.')),
  ill('pieter-tone', 'pieter', TIERS.MICRO, 'plain_language', 'Swap Jargon for Plain Words', 'Terms like "RMA" confuse customers. Say what it means instead.', 15,
    S('Your replies are well structured.', 'Internal terms such as RMA and SKU appeared in customer replies.', 'Replace internal terms with plain descriptions.', 'Spot the jargon → Say what it means.', "I've set up your return, and here's the prepaid label.", 'Check your next five emails for internal terms before sending.', 'Plain language reduces clarifying questions.')),
  ill('thabo-hold', 'thabo', TIERS.MICRO, 'handle_efficiency', 'Gather Everything in One Ask', 'Asking for photos, order number and address together saves a round trip.', 15,
    S('Your quality scores are consistently high.', 'Information was requested across two separate emails on the same case.', 'Request all the details you need in a single message.', 'List what you need → Ask once → Confirm receipt.', 'To get this moving, please send the order number, two photos of the pan, and your delivery address.', 'Use a single ask on your next three claims.', 'Fewer back-and-forths can cut handle time.')),
  ill('thabo-template', 'thabo', TIERS.MICRO, 'macro_use', 'Use the Warranty Macro, Then Tailor', 'Starting from the approved macro saves time on standard claims.', 15,
    S('Your writing is clear and friendly.', 'Standard warranty replies were being written from scratch.', 'Start standard warranty replies from the approved macro and tailor one line.', 'Load macro → Tailor one line → Send.', '(Macro) plus: "Your 12-inch pan will ship today."', 'Use the macro on your next five warranty replies.', 'It can reduce handle time without losing the personal touch.')),
  ill('sipho-legal', 'sipho', TIERS.COACHING, 'legal_escalation_protocol', 'Legal Mentions: Escalate, Don\'t Respond', 'A pattern: emails mentioning legal action were answered directly instead of routed to the legal queue.', 50,
    S('You respond quickly and politely.', 'Across several contacts, emails that mentioned legal action or a lawyer were answered directly rather than routed to the legal queue.', 'When a customer mentions legal action, acknowledge receipt and route to the legal queue without discussing the case.', 'Spot the legal mention → Acknowledge only → Route to legal.', "Thank you for your email. I've passed this to the team who handle these matters, and they'll be in touch directly.", 'Apply this on every legal mention this week.', 'Correct routing protects the customer and the company.')),
  ill('sipho-tag', 'sipho', TIERS.MICRO, 'case_tagging', 'Tag the Case Before You Close', 'Correct tags make sure the case reaches the right report.', 15,
    S('Your volume this week has been strong.', 'Several closed cases had no contact-reason tag.', 'Add the contact-reason tag before closing.', 'Resolve → Tag → Close.', '(Tag: Warranty / Damaged on arrival)', 'Tag your next ten cases before closing.', 'Accurate tags improve the insight your team gets back.')),
  ill('lerato-id', 'lerato', TIERS.COACHING, 'deactivation_process_adherence', 'Identity Verification Before Account Changes', 'A pattern across account changes: verification steps were skipped before changes were made.', 50,
    S('You are building confidence with account queries.', 'Across several account change requests, changes were made before the identity verification steps were completed.', 'Complete all identity verification steps before any account change or deactivation.', 'Verify email → Verify order → Then change.', "Before I make that change, I need to confirm a couple of details to keep your account safe.", 'Run full verification on every account change this week.', 'Verification protects customers from unauthorised changes.')),
  ill('lerato-workflow', 'lerato', TIERS.MICRO, 'deactivation_workflow', 'Follow the Deactivation Checklist', 'Each step of the deactivation workflow has a reason. Here is the order.', 20,
    S('Your replies are polite and clear.', 'A deactivation was processed without the confirmation email step.', 'Complete every step of the deactivation checklist, including the confirmation email.', 'Verify → Deactivate → Confirm by email.', "Your account has been closed, and you'll receive a confirmation email shortly.", 'Use the checklist on your next three deactivations.', 'It keeps a clear record for the customer and for audit.')),
]

// Older, unacknowledged cards (delivered in previous days) — these drive the
// Coach's process-escalation view (overdue). ILLUSTRATIVE.
const overdueCards = [
  ill('nomsa-old-1', 'nomsa', TIERS.MICRO, 'payment_resolution_protocol', 'Confirm the Refund Method', 'Check the original payment method before issuing a refund.', 15,
    S('You are thorough with payment details.', 'A refund was issued to a different method than the original payment.', 'Confirm the refund goes back to the original payment method.', 'Check method → Refund → Confirm.', "The refund will go back to the card you paid with.", 'Check the method on your next three refunds.', 'It avoids failed refunds and repeat contacts.'), { deliveredDaysAgo: 3 }),
  ill('lerato-old-1', 'lerato', TIERS.MICRO, 'deactivation_process_adherence', 'Two Checks Before Deactivation', 'Two quick checks before closing an account.', 20,
    S('You are building confidence with account queries.', 'An account was closed with an open order still pending.', 'Check for open orders before deactivating.', 'Open orders? → Resolve → Deactivate.', 'I can see one order still on its way, so I will close the account once it arrives.', 'Check for open orders on your next three deactivations.', 'It prevents orders getting lost.'), { deliveredDaysAgo: 4 }),
  ill('sipho-old-1', 'sipho', TIERS.MICRO, 'legal_escalation_protocol', 'Chargeback Mentions Need Routing Too', 'Chargeback threats follow the same routing as legal mentions.', 15,
    S('You respond quickly.', 'A chargeback threat was handled like a standard refund query.', 'Route chargeback threats to the payments escalation queue.', 'Spot it → Acknowledge → Route.', "I've passed this to our payments team, who'll contact you directly.", 'Route every chargeback mention this week.', 'Correct routing speeds up resolution.'), { deliveredDaysAgo: 3 }),
]

export const allCards = [...realCards, ...illustrativeCards, ...overdueCards]
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

function kpiSet(seed, aht, fcr, ab) {
  return {
    aht: { key: 'aht', label: 'Average Handle Time', value: aht, unit: 's', target: 450, direction: 'lower_better', trend: seededTrend(seed, aht, -1.1, 6, 0) },
    fcr: { key: 'fcr', label: 'First Contact Resolution', value: fcr, unit: '%', target: 75, direction: 'higher_better', trend: seededTrend(seed + 7, fcr, 0.15, 0.9, 1) },
    agentBehaviour: { key: 'agentBehaviour', label: 'Agent Behaviour Score', value: ab, unit: '/5', target: 4.0, direction: 'higher_better', trend: seededTrend(seed + 13, ab, 0.01, 0.15, 1) },
  }
}

// streakHistory: last 14 days before today, oldest first. 'done' | 'freeze' | 'miss'
function hist(pattern) {
  return pattern.split('').map((c) => (c === 'x' ? 'done' : c === 'f' ? 'freeze' : 'miss'))
}

function streakFrom(h) {
  let n = 0
  for (let i = h.length - 1; i >= 0; i--) {
    if (h[i] === 'done') n++
    else if (h[i] === 'freeze') continue
    else break
  }
  return n
}

const AGENT_SEED = [
  // id, name, email, initials, kpi seed/values, xp, acked, dailyGoals, sessions, coachingAcked, history, freezes, team, win
  ['aidza', 'Aidza Machuca', 'aidza.machuca@hexclad.com', 'AM', [11, 421, 74.2, 4.3], 470, 22, 6, 0, 1, '..xxxxfxxxxxxx', 1, false],
  ['hady', 'Hady Magdy', 'hady.magdy@quantanite.com', 'HM', [23, 388, 68.9, 3.8], 235, 11, 2, 0, 0, 'x.xx..xxfxxxxx', 1, false],
  ['michael', 'Michael Naidoo', 'michael.naidoo@hexclad.com', 'MN', [31, 405, 96.0, 4.7], 2150, 96, 30, 3, 6, 'xxxxxxxxxxxxxx', 2, false],
  ['janine', 'Janine Jacobs', 'janine.jacobs@hexclad.com', 'JJ', [37, 399, 89.4, 4.4], 1480, 71, 21, 2, 4, 'xxxxxxxfxxxxxx', 1, false],
  ['ayanda', 'Ayanda Mbeki', 'ayanda.mbeki@hexclad.com', 'AB', [41, 440, 71.2, 3.9], 610, 30, 8, 1, 2, 'xx.xxx.xxxxxxx', 2, true],
  ['nomsa', 'Nomsa Dlamini', 'nomsa.dlamini@hexclad.com', 'ND', [47, 460, 53.3, 3.6], 190, 9, 1, 0, 0, 'xx.x...x......', 0, false],
  ['pieter', 'Pieter Botha', 'pieter.botha@hexclad.com', 'PB', [53, 470, 60.0, 3.7], 720, 35, 11, 1, 1, 'x.xxxxx..xxxxx', 1, true],
  ['thabo', 'Thabo van der Merwe', 'thabo.vandermerwe@hexclad.com', 'TV', [59, 477, 46.7, 4.0], 1980, 88, 26, 2, 5, 'xxxxxxxxxxxxxx', 2, false],
  ['sipho', 'Sipho Khumalo', 'sipho.khumalo@hexclad.com', 'SK', [61, 452, 24.4, 3.5], 140, 7, 1, 0, 0, 'xx..x.x..x....', 0, false],
  ['lerato', 'Lerato Nkosi', 'lerato.nkosi@hexclad.com', 'LN', [67, 468, 17.8, 3.2], 95, 5, 0, 0, 0, '.x..x..x......', 0, false],
]

export const agents = Object.fromEntries(
  AGENT_SEED.map(([id, name, email, initials, k, xp, acked, dailyGoals, sessions, coachingAcked, pattern, freezes, win]) => {
    const history = hist(pattern)
    return [id, {
      id, name, email, initials,
      real: id === 'aidza' || id === 'hady',
      kpis: kpiSet(...k),
      seed: { xp, acked, dailyGoals, sessions, coachingAcked, history, streakBeforeToday: streakFrom(history), freezes },
      // "Your coaching is working" moment. ILLUSTRATIVE: QIQ does not yet attribute KPI change to a card.
      win: win ? { kpi: 'First Contact Resolution', delta: '+4.1 pts', since: 'the T1 eligibility card 2 weeks ago' } : null,
    }]
  }),
)
agents.hady.win = { kpi: 'First Contact Resolution', delta: '+3.2 pts', since: 'your courtesy-route card last week', illustrative: true }
agents.ayanda.win = { kpi: 'First Contact Resolution', delta: '+4.1 pts', since: 'your T1 eligibility card 2 weeks ago', illustrative: true }
agents.pieter.win = { kpi: 'Agent Behaviour Score', delta: '+0.3', since: 'your empathy card last week', illustrative: true }

// Cards that were already acknowledged before the demo starts (so the Coach matrix has a mix). ILLUSTRATIVE.
export const PRE_ACKED = ['michael-closing', 'michael-empathy', 'janine-verification', 'thabo-hold', 'pieter-empathy', 'ayanda-hold']

// ---------------------------------------------------------------------------
// Sessions, queue, attention, training (ILLUSTRATIVE)
// ---------------------------------------------------------------------------
export function localISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function dayOffset(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return localISO(d)
}

export const initialQueue = [
  {
    id: 'q-hady', kpiKey: 'fcr', detection: 'Flagged by the weekly pattern check: the same intake gap appeared in 3 separate warranty threads within the lookback window, above the multi-interaction threshold.', agentId: 'hady', topicKey: 'warranty_claim_intake_completeness', topic: 'Warranty claim intake completeness',
    source: 'QIQ weekly pattern · multi-interaction trend', status: 'scheduled', date: dayOffset(3), time: '11:00',
    whyFlagged: 'The weekly analysis found cases progressing with proof of purchase, photos, or purchase date missing across 3 email threads. QIQ judged this a pattern worth a live conversation, and separately issued a Coaching card on the same finding.',
    talkingPoints: ['Walk through one recent warranty claim together and check the intake at each step.', 'Ask what makes it tempting to progress before all three items are in.', 'Agree the Proof → Photos → Purchase date check as a habit for the next two weeks.'],
    realEvidence: true,
  },
  {
    id: 'q-lerato', kpiKey: 'agentBehaviour', detection: 'Critical failure raised by Process Adherence on a deactivation contact, on top of adherence sitting well under target all week.', agentId: 'lerato', topicKey: 'deactivation_process_adherence', topic: 'Deactivation process adherence',
    source: 'QIQ weekly pattern · critical failure', status: 'scheduled', date: dayOffset(1), time: '09:00',
    whyFlagged: 'Process adherence at 17.8% with a critical failure on a permanent deactivation. Verification steps were skipped before account changes.',
    talkingPoints: ['Review the deactivation workflow step by step.', 'Role-play an identity verification.', 'Agree a target: process adherence above 60% within two weeks.'],
  },
  {
    id: 'q-sipho', kpiKey: 'fcr', detection: 'Repeat classification from the Decision Trace: the topic was carded last week and the signal got stronger this week.', agentId: 'sipho', topicKey: 'legal_escalation_protocol', topic: 'Legal escalation protocol', history: 'repeat_worsened',
    source: 'QIQ weekly pattern · repeat-worsened', status: 'awaiting', flaggedDaysAgo: 4,
    whyFlagged: 'Legal-mention emails were answered directly on several occasions. The same topic was coached last week and the pattern got worse.',
    talkingPoints: ['Go through what counts as a legal mention.', 'Practise the acknowledge-and-route reply.', 'Check he knows where the legal queue is.'],
  },
  {
    id: 'q-nomsa', kpiKey: 'fcr', detection: 'Repeat contacts on payment queries rose against the 30-day trend; the related interactions show eligible refunds passed to finance.', agentId: 'nomsa', topicKey: 'payment_resolution_protocol', topic: 'Payment resolution on first reply',
    source: 'QIQ weekly pattern · repeat contacts', status: 'awaiting', flaggedDaysAgo: 1,
    whyFlagged: 'Payment queries passed to finance when the refund tool covered the scenario, leading to repeat contacts.',
    talkingPoints: ['Show which payment scenarios the refund tool covers.', 'Walk through two recent examples.', 'Agree to resolve eligible cases directly.'],
  },
  {
    id: 'q-pieter', kpiKey: 'agentBehaviour', detection: 'Agent Behaviour empathy scores dropped on frustrated contacts.', agentId: 'pieter', topicKey: 'empathy_and_communication', topic: 'Empathy and communication',
    source: 'QIQ weekly pattern · critical failures', status: 'closed', date: dayOffset(-6), time: '14:00',
    whyFlagged: 'High count of critical failures linked to tone on frustrated contacts.',
    talkingPoints: [],
    closeOut: { happened: true, outcome: 'Improving', note: 'Agreed to open every frustrated contact with one line of acknowledgement. Critical failures now at zero.', smart: null },
  },
]

// Quality Cluster critical-failure flags (live field; rows seeded for the demo)
export const criticalFailures = [
  {
    id: 'cf-lerato', agentId: 'lerato', type: 'Critical failure',
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
    pattern: 'Second deactivation this month with verification skipped. Process adherence has been under target all week, and a 1:1 on deactivation adherence is already booked.',
  },
  {
    id: 'cf-nomsa', agentId: 'nomsa', type: 'Critical failure',
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
    pattern: 'First critical failure for Nomsa. A 1:1 on payment resolution is already in the queue, waiting to be scheduled.',
  },
]

// Other QIQ flags the Coach should review
export const attentionItems = [
  { id: 'att-sipho', agentId: 'sipho', type: 'Repeat, worsened', text: 'Legal escalation topic coached last week. Pattern got worse this week.', source: 'Coaching Decision Trace · repeat classification' },
  { id: 'att-thabo', agentId: 'thabo', type: 'Escalation Monitoring', text: 'Two contacts escalated to Tier 1 that met the criteria to resolve directly.', source: 'Quality Cluster · Escalation Monitoring' },
]

export const trainingStatus = {
  aidza: [{ course: 'Warranty Claims Essentials', status: 'Completed' }],
  hady: [{ course: 'Warranty Claims Essentials', status: 'In progress', progress: 60 }, { course: 'Data Protection Basics', status: 'Assigned' }],
  michael: [{ course: 'Advanced De-escalation', status: 'Completed' }],
  janine: [{ course: 'Advanced De-escalation', status: 'In progress', progress: 30 }],
  ayanda: [{ course: 'Escalation Criteria', status: 'Completed' }],
  nomsa: [{ course: 'Refund Tool Masterclass', status: 'Assigned' }],
  pieter: [{ course: 'Empathy in Writing', status: 'Completed' }],
  thabo: [{ course: 'Efficient Case Handling', status: 'In progress', progress: 80 }],
  sipho: [{ course: 'Legal and Compliance Routing', status: 'Assigned' }],
  lerato: [{ course: 'Account Security and Verification', status: 'In progress', progress: 20 }],
}
