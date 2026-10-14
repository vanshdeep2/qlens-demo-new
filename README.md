# QLens demo

A clickable demo of QLens's two personas, Agent and Coach, styled on the live Q-Bytes screens.

## Run it

```
npm install
npm run dev
```

Opens at http://localhost:5173. `npm run build` outputs a static site to `dist/` for Vercel, Netlify or any static host.

## How to drive it

- **Switch persona:** the Employee / Coach pill in the top bar.
- **Switch agent (Employee view):** click your name in the top right and pick from the list. Aidza Machuca and Hady Magdy are marked REAL DATA.
- **Reset:** the red log-out icon, or simply refreshing the page, puts everything back to the start of the day. Nothing is saved between page loads, so a refresh is a clean run-through every time.
- The UI carries no real/seeded labels. The section below is the record of what is real.

### How the pages are organised

- **Agent home answers "what do I do next?"** Order: greeting and progress pill, 1:1 banner, the three KPI tiles, then one Q-Byte at a time in the "Up next" card (headline and content only, centred actions). The progress pill opens a centred card with Level / Streak / Badges tabs.
- **Coach home answers "what needs me today?"** Order: Critical failures, Upcoming 1:1s (today and tomorrow flagged for prep), To do grouped by type (schedule, nudge with "Nudge all", QIQ flags, held cards), then a sortable team table with AHT, FCR and Agent Behaviour.
- **Every pop-up is the same centred card.** The evidence view is built on QIQ's Decision Agent brief fields: evidence summary, coaching angle, support strength, priority reason, coaching history, and quotes from the conversations with customer names and details removed. The 1:1 prep shows why the session exists, QIQ's recommended focus, the related KPI's 30-day trend, the history of cards on the topic, quotes, and the last session and notes.

### A good demo path

1. As Hady (or Aidza, who has a weekly Coaching card): Start now, read the card, press Got it. Watch the XP toast and level-up, then the next card slides in.
2. Finish the day to see the completion moment. Click the progress pill to show levels, streak and badges.
3. Switch to Coach. Work down the to-do list: nudge, schedule, open prep, mark complete. Watch items tick off into "done".
4. Review Hady's held card to show the PII validator block. Open Hady from the team list, Cards tab, for the evidence trail.
5. Switch back to Hady: +50 XP and the Showed Up badge if you closed his session. Switch to a nudged agent and check their bell.

## What's real vs. seeded

Real, from the HexClad dry run (`phase5_evidence_traceability.csv`, `phase5_coaching_run_report.html`):

- Every card for Aidza Machuca and Hady Magdy that isn't tagged Illustrative: titles, copy, evidence scope, validator checks.
- Evidence summary, priority reason and support strength for Aidza's card and Hady's data-erasure card; coaching angle for all five topics (the Decision Agent brief in the run report).
- The conversation quotes in the evidence view and 1:1 prep, taken from the CSV message bodies with customer names, addresses and order numbers removed.
- Hady's UK warranty card being held by the PII validator.

Seeded and tagged **Illustrative** in the UI:

- The other eight agents and all their cards (names reused from the Team Leader View screenshot).
- Two extra cards for Aidza, so her day has three: one Q-Byte and one weekly Coaching card ("End Every Warranty Reply with the Next Step"), including its weekly stats. The T&C redesign keeps coaching-tier content on the future-tier list, so this card's copy is written to match what the weekly analysis would produce.
- All KPI values and trends, XP, levels, streak history, badges.
- The critical failures and every field in their detail view (summary, SOP step, step list, Outcome Matrix cell, Agent Behaviour scores and quotes, pattern check). Each field maps to a Quality Cluster output; the dry run itself had no critical failures.
- The QIQ flags, coaching queue, session dates, detection notes and training status.
- The evidence summary and priority reason for Hady's intake, courtesy and UK warranty topics (the run report only carries the coaching angle for those), and coaching-history classifications.
- The "Your coaching is working" card. QIQ doesn't attribute KPI change to a card yet, so this is a proposal.

## Gamification rules (QLens-owned state)

- XP comes from engaging with coaching: Q-Bytes 15 to 20 XP, Coaching cards 35 to 50 XP, +25 for finishing the day's cards, +50 for attending a 1:1.
- Eight levels, the first reachable within a couple of days.
- Streak counts days with at least one acknowledgement. Streak freezes cover missed days automatically.
- Effort badges only. Skill-threshold badges wait on the badging decision.
- No colleague leaderboard.

## Rules the demo encodes

- A card unread for more than 2 days is overdue (QLens's clock-based rule). Judgement-based escalation stays with QIQ.
- An awaiting-schedule 1:1 flagged 3+ days ago shows as late and is reported to QIQ.
- The agent sees only the date and time of a 1:1. Topic, prep and notes stay on the Coach side.
- Evidence, validator checks and notes are Coach-only.
- The close-out always captures whether the session happened, the outcome and a note. The SMART form is an optional add-on.
