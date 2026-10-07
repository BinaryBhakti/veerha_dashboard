/* ============================================================================
   VEERHA — SCREENS
   The Rivergrove fixture.

   One fictional world, used across all 77 screens so a lead on the dashboard
   is the same lead in the drawer, the quote, the booking and analytics.

   EVERY VALUE HERE IS INVENTED. Nothing comes from audit/ or from the
   prototype's dataset — both contain real customer records. Emails use
   example.com, which IANA reserves for documentation. Phone numbers use a
   sequential +91 90000 100xx block that cannot be a real allocation.

   This file is a reference for authoring the static screens; the deliverable
   ships no JavaScript. Keep it in sync by hand — it is the reason counts
   agree across files.
   ============================================================================ */

export const workspace = {
  name: 'Rivergrove Retreat',
  kind: 'River-side wellness resort',
  domain: 'rivergrove.example.com',
  user: { name: 'Anita', role: 'Owner', initial: 'A' },
  today: 'Monday, 21 September 2026',
};

/* --- The narrative -------------------------------------------------------
   Carried forward from the client-reviewed prototype and rescaled to the
   live app's volumes. It is the thread that makes a design review about the
   product rather than the pixels:

     17 of 27 open leads arrived on WhatsApp.
     WhatsApp Business is disconnected — Veerha can read those threads but
     cannot answer them.

   It surfaces on: the dashboard insight card, the Support Executive's
   "Needs attention" state, the Channels screen, and the analytics source
   chart. Every one of those must agree with the numbers below. */

export const totals = {
  leadsOpen: 27,
  leadsOnWhatsApp: 17,
  opportunities: 61,
  overdueFollowUps: 5,
  decisionsWaiting: 20,
  pipelineOpenValue: 241000,      // ₹2.41L
  estimatedWorkMins: 34,
};

/* --- Leads ---------------------------------------------------------------
   Eight are authored in full; the counts above are the population they sit
   in. Schema mirrors the prototype's, which was client-reviewed. */

export const leads = [
  {
    id: 'LEAD-0129', name: 'Arjun Mehta', initial: 'AM', score: 80, temp: 'Hot',
    stage: 'Proposal', seg: 'Direct', channel: 'WhatsApp', touch: 35, conf: 4,
    owner: 'Anita', verified: true, repeat: '10th enquiry',
    phone: '+91 90000 10001', email: 'arjun.mehta@example.com',
    req: { type: 'Rooms', from: '15 Oct', to: '17 Oct 2026', rooms: 1, guests: 2 },
    stay: 'Premier Riverside Room', value: 43700,
    followUp: null, updated: { rel: '2m ago', abs: '21 Sep, 10:42 AM' },
    read: {
      title: 'Ready for a callback, not another message.',
      body: 'Arjun asked for a callback about a two-adult booking for 15–17 October and has already settled on the Premier Riverside Room. He is negotiating on price for a personal trip, not a corporate one, and has enquired ten times before without booking. He proposed 11:00 tomorrow.',
      tags: ['High intent', 'Callback requested', 'Price sensitive'],
      based: '4 replies · confirmed dates · a chosen room · 10 previous enquiries',
    },
    next: {
      title: 'Call Arjun tomorrow at 11:00',
      why: 'He asked for it, and he has replied within the hour every time.',
      a1: 'Schedule', a2: 'Call now',
    },
    ev: [
      { ok: true,  t: 'Settled on <b>Premier Riverside Room</b>', s: 'Options' },
      { ok: false, t: 'Nothing scheduled with him yet',           s: 'Follow-ups' },
      { ok: true,  t: 'Replied 4 times, always within the hour',  s: 'Conversation' },
      { ok: true,  t: 'Enquired <b>10 times</b> before, never booked', s: 'Past dealings' },
      { ok: true,  t: 'Asked twice for a better rate',            s: 'Conversation' },
    ],
  },
  {
    id: 'LEAD-0131', name: 'Priya Nair', initial: 'PN', score: 91, temp: 'Hot',
    stage: 'Qualified', seg: 'Group', channel: 'Website form', touch: 9, conf: 5,
    owner: 'Anita', verified: true, repeat: null,
    phone: '+91 90000 10002', email: 'priya.nair@example.com',
    req: { type: 'Group block', from: '12 Nov', to: '14 Nov 2026', rooms: 6, guests: 16 },
    stay: 'Riverside block · 6 rooms', value: 164800, budget: 180000,
    followUp: { label: 'Call agreed on the thread', when: 'Today, 4:00 PM', overdue: false },
    updated: { rel: '22m ago', abs: '21 Sep, 10:20 AM' },
    read: {
      title: 'Wants a person, and has the budget to justify one.',
      body: 'Priya is organising a 16-guest family block for 12–14 November and has confirmed dates, headcount and a ₹1.8L ceiling. She asked twice to speak to someone about group rates, which sits outside what Veerha may quote. She is comparing two other properties on the same stretch.',
      tags: ['Group booking', 'Needs a person', 'Comparing options'],
      based: '9 replies · confirmed headcount · a stated budget · 5 opens of the options page',
    },
    next: {
      title: 'Take over the thread and call her',
      why: 'She asked for a person twice. Group rates are above Veerha’s pricing limit.',
      a1: 'Assign', a2: 'Take over',
    },
    ev: [
      { ok: true,  t: 'Confirmed <b>16 guests</b> across 6 rooms', s: 'Facts' },
      { ok: true,  t: 'Stated a ceiling of <b>₹1,80,000</b>',      s: 'Conversation' },
      { ok: false, t: 'Asked for a person twice, still waiting',   s: 'Conversation' },
      { ok: true,  t: 'Opened the options page 5 times',           s: 'Options' },
      { ok: false, t: 'Comparing two other properties',            s: 'Conversation' },
    ],
  },
  {
    id: 'LEAD-0124', name: 'Devang Joshi', initial: 'DJ', score: 72, temp: 'Warm',
    stage: 'Contacted', seg: 'Direct', channel: 'WhatsApp', touch: 12, conf: 3,
    owner: 'Anita', verified: false, repeat: '2nd enquiry',
    phone: '+91 90000 10003', email: 'devang.joshi@example.com',
    req: { type: 'Rooms', from: 'Dates flexible', to: null, rooms: 1, guests: 2 },
    stay: 'Anniversary package', value: 26400,
    followUp: { label: 'Never confirmed', when: '14 Sep, 1:30 PM', overdue: true },
    updated: { rel: '7d ago', abs: '14 Sep, 1:12 PM' },
    read: {
      title: 'Gone quiet because we missed the call.',
      body: 'Devang was engaged and flexible on dates for an anniversary stay. A call was set for Sunday 14 September at 13:30 and was never confirmed from our side. He has not written since. The thread is recoverable, but every day of silence costs.',
      tags: ['Anniversary', 'Dates open', 'Call missed'],
      based: '12 replies before the silence · a missed confirmation · flexible dates',
    },
    next: {
      title: 'Apologise and offer two call slots',
      why: 'The drop-off starts the day we missed the call, not before it.',
      a1: 'Reschedule', a2: 'Send message',
    },
    ev: [
      { ok: false, t: 'Call on <b>14 Sep, 13:30</b> was never confirmed', s: 'Follow-ups' },
      { ok: false, t: 'No reply in <b>7 days</b> after 12 exchanges',     s: 'Conversation' },
      { ok: true,  t: 'Said dates are flexible either side of the 20th',  s: 'Facts' },
      { ok: true,  t: 'Asked about the spa and in-room dining',           s: 'Conversation' },
    ],
  },
  {
    id: 'LEAD-0127', name: 'Vikram Rao', initial: 'VR', score: 58, temp: 'Warm',
    stage: 'Negotiation', seg: 'Direct', channel: 'Phone', touch: 18, conf: 3,
    owner: 'Anita', verified: true, repeat: null,
    phone: '+91 90000 10004', email: 'vikram.rao@example.com',
    req: { type: 'Rooms', from: '22 Oct', to: '26 Oct 2026', rooms: 2, guests: 4 },
    stay: 'Panorama Suite', value: 28320, asked: 24900, budget: 25000,
    followUp: { label: 'Discount decision', when: 'Yesterday', overdue: true },
    updated: { rel: '3h ago', abs: '21 Sep, 7:45 AM' },
    read: {
      title: 'Will book, but only at a rate you have to approve.',
      body: 'Vikram has locked dates, room and headcount for a four-night stay in the Panorama Suite and is now purely on price. He is asking ₹24,900 against ₹28,320 — a 12% discount, one point above the standing limit. This is a decision, not a negotiation Veerha should continue.',
      tags: ['Price only', 'Above policy', 'Returning guest'],
      based: '18 exchanges · everything confirmed but price · a 2024 booking',
    },
    next: {
      title: 'Approve ₹24,900, or counter at ₹26,400',
      why: 'Everything else is settled. Price is the only thing holding the booking.',
      a1: 'Counter', a2: 'Review discount',
    },
    ev: [
      { ok: true,  t: 'Dates, room and guests all confirmed',        s: 'Facts' },
      { ok: false, t: 'Asked for <b>12% off</b> — above the 11% limit', s: 'Conversation' },
      { ok: true,  t: 'Opened the quote 4 times in two days',        s: 'Options' },
      { ok: true,  t: 'Booked here once in 2024',                    s: 'Past dealings' },
    ],
  },
  {
    id: 'LEAD-0130', name: 'Sameer Bhat', initial: 'SB', score: 34, temp: 'Cold',
    stage: 'New', seg: 'Direct', channel: 'WhatsApp', touch: 4, conf: 2,
    owner: null, verified: false, repeat: null,
    phone: '+91 90000 10005', email: 'sameer.bhat@example.com',
    req: { type: 'Rooms', from: null, to: null, rooms: 0, guests: 0 },
    stay: null, value: null,
    followUp: { label: 'Sequence step 2', when: 'Tomorrow, 10:00 AM', overdue: false },
    updated: { rel: '11h ago', abs: '20 Sep, 11:04 PM' },
    read: {
      title: 'Browsing, not planning anything yet.',
      body: 'Sameer asked one open question about room availability and has not answered either follow-up about dates or headcount. There is nothing here to qualify. Veerha has put him on a light three-touch sequence rather than spend a call on him.',
      tags: ['Low intent', 'No dates', 'On a sequence'],
      based: '4 messages · no dates · one page view',
    },
    next: {
      title: 'Leave him on the sequence',
      why: 'Nothing to call about yet. Veerha will raise him if he answers on dates.',
      a1: 'Mark lost', a2: 'View sequence',
    },
    ev: [
      { ok: false, t: 'No dates or guest count given',       s: 'Facts' },
      { ok: false, t: 'Two questions unanswered in 11 hours', s: 'Conversation' },
      { ok: true,  t: 'Opened the rooms page once',           s: 'Options' },
    ],
  },
  {
    id: 'LEAD-0132', name: 'Kavya Reddy', initial: 'KR', score: 76, temp: 'Hot',
    stage: 'Proposal', seg: 'Group', channel: 'Website form', touch: 14, conf: 4,
    owner: 'Anita', verified: true, repeat: null,
    phone: '+91 90000 10006', email: 'kavya.reddy@example.com',
    req: { type: 'Rooms', from: '2 Jan', to: '5 Jan 2027', rooms: 2, guests: 5 },
    stay: 'Riverside block · 2 rooms', value: 92400, budget: 95000,
    followUp: { label: 'Quote walkthrough', when: '23 Sep, 11:00 AM', overdue: false },
    updated: { rel: '1d ago', abs: '20 Sep, 9:15 AM' },
    read: {
      title: 'Ready to book, waiting on one answer.',
      body: 'Kavya has confirmed dates, rooms and headcount for a New Year stay and opened the quote three times. The only thing holding her is whether a 2pm checkout on the 5th is possible — nobody has answered that yet.',
      tags: ['High intent', 'New Year', 'Awaiting an answer'],
      based: '14 replies · a confirmed party · 3 opens of the quote',
    },
    next: {
      title: 'Answer the late-checkout question today',
      why: 'It is the only open item, and New Year rooms will not hold long.',
      a1: 'Draft a reply', a2: 'Call now',
    },
    ev: [
      { ok: true,  t: 'Confirmed <b>2 rooms, 5 guests</b>, 2–5 January', s: 'Facts' },
      { ok: true,  t: 'Opened the quote 3 times',                        s: 'Options' },
      { ok: false, t: 'Asked twice about a <b>2pm checkout</b>, unanswered', s: 'Conversation' },
      { ok: true,  t: 'Replied within a day, every time',                s: 'Conversation' },
    ],
  },
  {
    id: 'LEAD-0128', name: 'Nandini Gokhale', initial: 'NG', score: 47, temp: 'Warm',
    stage: 'Contacted', seg: 'Corporate', channel: 'Phone', touch: 7, conf: 3,
    owner: 'Anita', verified: false, repeat: null,
    phone: '+91 90000 10007', email: 'nandini.gokhale@example.com',
    req: { type: 'Day visit', from: '28 Sep 2026', to: null, rooms: 0, guests: 12 },
    stay: 'Lawn and lunch · 12 guests', value: 18000,
    followUp: { label: 'Menu options promised', when: '19 Sep, 5:00 PM', overdue: true },
    updated: { rel: '4d ago', abs: '17 Sep, 4:02 PM' },
    read: {
      title: 'We owe her something, and never sent it.',
      body: 'Nandini wants the lawn and lunch for twelve on 28 September. She was told menu options would follow the same evening. Four days later nothing has gone out, and she has not chased — which usually means she is asking someone else.',
      tags: ['Day visit', 'We are late', 'Lawn and lunch'],
      based: '7 exchanges · a promise made on 17 Sep · no reply since',
    },
    next: {
      title: 'Send the lunch menus with an apology',
      why: 'We broke the promise, not her. A same-day send still recovers most of these.',
      a1: 'Open menus', a2: 'Send now',
    },
    ev: [
      { ok: false, t: 'Menu options promised on <b>17 Sep</b>, never sent', s: 'Follow-ups' },
      { ok: true,  t: 'Confirmed <b>12 guests</b> and the date',            s: 'Facts' },
      { ok: false, t: 'No contact in 4 days',                               s: 'Conversation' },
      { ok: true,  t: 'Asked about the lawn twice',                         s: 'Conversation' },
    ],
  },
  {
    id: 'LEAD-0133', name: 'Farhan Qureshi', initial: 'FQ', score: 63, temp: 'Warm',
    stage: 'New', seg: 'Direct', channel: 'WhatsApp', touch: 5, conf: 3,
    owner: null, verified: false, repeat: '3rd enquiry',
    phone: '+91 90000 10008', email: 'farhan.qureshi@example.com',
    req: { type: 'Rooms', from: '19 Dec', to: '22 Dec 2026', rooms: 3, guests: 6 },
    stay: null, value: null,
    followUp: null, updated: { rel: '6h ago', abs: '21 Sep, 4:30 AM' },
    read: {
      title: 'Real dates, no budget, nobody assigned.',
      body: 'Farhan gave firm dates and a room count within two messages, which usually signals a genuine plan. Nothing has been asked about budget or occasion yet, and the lead is still unassigned eight hours after it arrived.',
      tags: ['Firm dates', 'Unassigned', 'December'],
      based: '5 messages · confirmed dates and rooms · no owner',
    },
    next: {
      title: 'Assign her, then ask about the occasion',
      why: 'December fills early, and an unassigned lead has nobody watching it.',
      a1: 'Ask Veerha', a2: 'Assign to me',
    },
    ev: [
      { ok: true,  t: 'Gave <b>firm dates</b> in the second message', s: 'Facts' },
      { ok: true,  t: 'Asked for three rooms together',               s: 'Conversation' },
      { ok: false, t: 'No owner assigned after 8 hours',              s: 'Facts' },
      { ok: false, t: 'Occasion and budget never asked',              s: 'Facts' },
    ],
  },
];

/* --- Pipeline. Bar widths derive from value share, not eyeballed. -------- */
export const pipeline = [
  { stage: 'New',         count: 17, value: 17500 },
  { stage: 'Qualified',   count: 4,  value: 31200 },
  { stage: 'Proposal',    count: 4,  value: 110400 },
  { stage: 'Negotiation', count: 1,  value: 28320 },
  { stage: 'Won',         count: 2,  value: 64200 },
];
export const pipelineMax = 110400;   // Proposal. Every bar is value / this.

/* --- AI employees -------------------------------------------------------- */
export const employees = [
  { role: 'Sales Executive', state: 'Working', dot: 'ok',
    status: 'on shift since 6:40 PM', badge: 'Autonomous',
    scope: 'Answers enquiries on every channel, qualifies them, and books calls for you.',
    stats: [['24', 'Conversations'], ['5', 'Qualified'], ['3', 'Meetings booked']],
    foot: '2 decisions waiting on you' },
  { role: 'Support Executive', state: 'Needs attention', dot: 'danger',
    status: 'WhatsApp disconnected', badge: 'Read only',
    scope: 'Handles questions from guests who have already booked.',
    stats: [['9', 'Conversations'], ['11', 'Unanswered'], ['—', 'Resolved']],
    foot: 'Blocked 3 h' },
  { role: 'Marketing Executive', state: 'Not configured', dot: 'muted',
    status: null, badge: null,
    scope: 'Runs campaigns to your existing guest list.',
    stats: [['—', 'Campaigns'], ['142', 'Guests reachable'], ['38', 'Leads gone cold']],
    foot: 'About 10 min' },
  { role: 'Operations Executive', state: 'Paused by you', dot: 'warn',
    status: '15 Sep', badge: null,
    scope: 'Watches arrivals, payments and the day’s tasks.',
    stats: [['0', 'Tasks today'], ['6', 'Arrivals this week'], ['2', 'Payments due']],
    foot: 'Paused 6 d' },
];

/* --- Veerha is working — the overnight timeline -------------------------- */
export const working = [
  { t: '10:42', act: 'Replied to <b>Arjun Mehta</b> about weekend availability', obj: 'WhatsApp' },
  { t: '10:38', act: 'Qualified <b>Priya Nair</b> after a nine-message exchange', obj: 'Score 72 → 91' },
  { t: '10:21', act: 'Booked a site call with <b>Devang Joshi</b>',               obj: 'Tomorrow · 11:00' },
  { t: '09:58', act: 'Sent four room options to <b>Vikram Rao</b>',               obj: 'Opened twice' },
  { t: '09:44', act: 'Paused on <b>Arjun Mehta</b> — the quote needs approval',   obj: '₹43,700', flag: 'Waiting' },
  { t: '07:12', act: 'Logged an inbound call and created <b>two new leads</b>',   obj: 'Voice' },
];

/* --- Waiting on you ------------------------------------------------------ */
export const waiting = [
  { title: 'Approve quote for Arjun Mehta', ctx: 'Hot · ₹43,700 · 2 nights · Premier Riverside, room only · 1 h ago', verb: 'Approve' },
  { title: 'Customer asked for a person',   ctx: 'Priya Nair · wants to discuss a 16-guest block · 22 min ago',       verb: 'Take over' },
  { title: 'Discount above policy',         ctx: 'Vikram Rao · ₹28,320 → ₹24,900 · 12% asked, 11% limit · 3 h ago',   verb: 'Review' },
  { title: 'Confirm call with Devang Joshi',ctx: 'Was set for Sun 14 Sep, 13:30 · never confirmed · 7 d ago',         verb: 'Confirm' },
  { title: 'Approve weekday rate, Panorama Suite', ctx: '₹28,320 → ₹26,400 · 15–19 Oct · yesterday',                  verb: 'Review' },
];

/* --- The three insight cards -------------------------------------------- */
export const insights = [
  { kind: 'Slipping', tone: 'wn',
    h: 'Five follow-ups have gone past their date',
    p: 'A promised follow-up that slips is the most common reason a warm lead goes cold. Two of these are on Hot leads.',
    a: 'See the five leads' },
  { kind: 'Blocked', tone: 'dn',
    h: 'WhatsApp Business is disconnected',
    p: 'Seventeen of your last twenty-seven leads wrote in on WhatsApp first. Veerha can read those threads but cannot answer them.',
    a: 'Reconnect WhatsApp' },
  { kind: 'Worth automating', tone: 'ai',
    h: 'Let Veerha confirm calls on its own',
    p: 'You approved the last 23 call confirmations without changing anything. Handing this rule over clears about nine minutes a day.',
    a: 'Review the rule' },
];

/* --- The plan: suggested order for the day ------------------------------ */
export const plan = [
  { n: '01', t: 'Approve the quote for Arjun',        m: '2 min' },
  { n: '02', t: 'Clear 5 overdue call confirmations', m: '11 min' },
  { n: '03', t: 'Take over Priya — she asked for a person', m: '6 min' },
  { n: '04', t: 'Reconnect WhatsApp Business',        m: '4 min' },
];

/* --- Charts. Every series here must agree with the totals above. --------- */
export const charts = {
  leadsPerDay: { label: 'Volume', title: 'Leads captured each day',
    when: '8 – 21 September 2026',
    series: [3, 5, 4, 7, 6, 9, 12, 8, 6, 7, 11, 14, 10, 17], max: 18,
    take: '<b>Weekends run hottest.</b> The three highest days were all Saturdays or Sundays — the days nobody was at the desk before Veerha started answering.' },
  autonomy: { label: 'Autonomy', title: 'Conversations Veerha finished alone',
    when: 'Share of all threads, by week',
    series: [41, 48, 52, 58, 61, 67, 73, 78], target: 85,
    take: '<b>From 41% to 78% in eight weeks.</b> Nearly every handover left is a price decision — the quote-approval rule is what stands between you and 85%.' },
  funnel: { label: 'Conversion', title: 'Where leads stop', when: '84 leads captured, last 30 days',
    rows: [['Captured', 84, null], ['Qualified', 39, '46% carried on'], ['Proposal', 21, '54%'],
           ['Negotiation', 11, '52%'], ['Won', 7, '64%']],
    take: '<b>The drop is at qualification.</b> 45 leads never gave enough to qualify — 31 of those never answered a single question about dates.' },
  sources: { label: 'Sources', title: 'Where the last 27 leads came in', when: 'By first contact channel',
    rows: [['WhatsApp', 17, 'Read only — cannot reply'], ['Website form', 5, null],
           ['Phone', 3, null], ['Email', 2, null]],
    take: '<b>Nearly two in three arrive on WhatsApp</b> — the one channel Veerha can read but not answer. Reconnecting it is the highest-value fix on this page.' },
};

/* ============================================================================
   OCTOBER ADDITIONS — screens #78–#99 (see PLAN-2026-10.md)
   Same rules as everything above: invented, reserved domains, +91 90000 1xxxx.
   ============================================================================ */

/* --- Navigation ---------------------------------------------------------
   The live sidebar badges only two rows. Tasks counts what a person owes;
   Review Queue counts what the AI is asking permission to do and must agree
   with totals.decisionsWaiting. */
export const navBadges = { tasks: 10, review: 20 };

/* A second persona. The owner never sees Front Desk (the live app hides it
   for owner and admin, who see arrivals on Bookings), so Front Desk frames
   are drawn as the person who does. */
export const frontDeskUser = { name: 'Rohan Pillai', role: 'Manager', initial: 'R' };

/* --- Google Reviews (#81) ------------------------------------------------ */
export const reviews = [
  { who: 'Meghna S.', stars: 5, when: '2 days ago', state: 'Draft ready',
    text: 'The river-facing room was worth every rupee. Breakfast on the deck was the highlight.',
    draft: 'Thank you, Meghna — we are glad the deck breakfasts made the stay. We hope to see you back by the river soon.' },
  { who: 'Karan D.', stars: 3, when: '4 days ago', state: 'Needs you',
    text: 'Lovely property, but check-in took forty minutes on a Friday evening.',
    draft: null, why: 'Mentions a service failure — Veerha drafts nothing public about a complaint without you.' },
  { who: 'Ishita P.', stars: 5, when: '1 week ago', state: 'Answered', text: 'Spa was excellent.', reply: 'Thank you, Ishita.' },
];
export const reviewTotals = { rating: 4.6, count: 128, unanswered: 2, answeredIn: '6 h median' };

/* --- Marketing: contact lists (#83) -------------------------------------- */
export const contactLists = [
  { name: 'Diwali 2025 guests', desc: 'Stayed between 20 Oct and 5 Nov last year', people: 64, used: 'Campaign · 12 Sep' },
  { name: 'Corporate offsite enquiries', desc: 'Asked about 10+ rooms on a weekday', people: 18, used: 'Never used' },
  { name: 'Spa package buyers', desc: 'Added by hand at check-out', people: 41, used: 'Sequence · running' },
];

/* --- Automation (#80, #84, #87) ----------------------------------------- */
export const tiers = { premiumAbove: 50000, vipAbove: 150000, inactiveAfterMonths: 9 };
export const occasions = [
  { name: 'Stay anniversary', date: 'One year after check-out', send: 'WhatsApp template · anniversary_offer', on: true,  reach: 212 },
  { name: 'Birthday',         date: 'Guest birthday',          send: 'WhatsApp template · birthday_wish',    on: false, reach: 37, gap: 'Only 37 guests have a birthday on file' },
  { name: 'Usual travel month', date: 'The month a guest has booked twice before', send: 'Email · come_back_season', on: false, reach: 19 },
];
export const entryPoints = [
  { order: 1, match: 'Message contains “corporate” or “offsite”', journey: 'Group enquiry intake', source: 'Any channel', hits: 14 },
  { order: 2, match: 'Comment on an Instagram post',               journey: 'Send rate card by DM',  source: 'Instagram', hits: 31 },
  { order: 3, match: 'Click on ad “Monsoon escape”',                journey: 'Monsoon package nurture', source: 'Meta ad', hits: 9 },
  { order: 4, match: 'Reply “STOP”',                                journey: 'Unsubscribe and confirm', source: 'WhatsApp', hits: 2 },
];

/* --- AI: synonyms, learning, teach (#85, #86, #89) ------------------------ */
export const synonyms = [
  { said: 'cottage',      maps: 'Garden Villa',          field: 'Room type', seen: 6, state: 'Pending' },
  { said: 'river view',   maps: 'Premier Riverside Room', field: 'Room type', seen: 11, state: 'Pending' },
  { said: 'honeymoon',    maps: 'Occasion · Anniversary', field: 'Occasion',  seen: 4, state: 'Approved' },
];
export const learning = [
  { from: 'Review Queue · refused', lesson: 'Do not offer the Panorama Suite below ₹26,000 on weekends', state: 'Needs curation' },
  { from: 'Review Queue · edited',  lesson: 'Say “check-in from 2 PM”, not “after lunch”',             state: 'In learning set' },
];
export const teach = {
  business: { name: 'Rivergrove Retreat', site: 'rivergrove.example.com', industry: 'Hospitality',
              what: 'A 24-room wellness resort on the river, two hours from the city.' },
  waitsFor: ['Enquiry type', 'Check-in', 'Check-out', 'Guests', 'Children', 'Rooms', 'Occasion', 'Budget'],
  talk: { assistant: 'Mira', tone: 'Warm', firstName: true, saysAI: true },
};

/* --- Integrations (#79) --------------------------------------------------- */
export const connections = [
  { name: 'AI engine',              state: 'Connected', note: 'Included in your plan — nothing to connect' },
  { name: 'WhatsApp Cloud API',     state: 'Disconnected', note: 'Token expired 18 Sep — Veerha can read threads but not answer' },
  { name: 'Razorpay',               state: 'Test mode', note: 'Payment links work but no money moves' },
  { name: 'Channel manager',        state: 'Connected', note: 'Rates synced 6 min ago' },
  { name: 'Elastic Email',          state: 'Not set',   note: null },
  { name: 'External dialer webhook',state: 'Not set',   note: null },
];

/* --- Wallet and Grow (#50b, #90) ----------------------------------------- */
export const walletLow = { balance: 140, burnPerDay: 95, daysLeft: 1 };
export const grow = [
  { name: 'Connect your calendar', does: 'Veerha books calls into free slots', cost: 'Included' },
  { name: 'Connect your mailbox',  does: 'Guest email lands beside WhatsApp, with drafted replies', cost: 'Included' },
  { name: 'Bring your old CRM',    does: 'Contacts, leads and owners in one go', cost: 'Included' },
  { name: 'Have Veerha set it up', does: 'Our team configures the workspace with you on a call', cost: '₹9,000 once' },
];

/* --- CRM migration (#91) -------------------------------------------------- */
export const migration = { from: 'Zoho CRM', people: 1840, deals: 212, dupes: 37, noConsent: 410,
  stages: [['Prospect', 'New'], ['Contacted', 'Engaged'], ['Proposal', 'Proposal'], ['Closed Won', 'Won']] };

/* --- E-commerce edition (#94–#97) — a different workspace -----------------
   Designed from the sitemap, not observed: the Hotels workspace redirects
   these routes. A separate fictional shop keeps the two editions apart. */
export const shop = {
  name: 'Riverbank Organics', domain: 'riverbank.example.com', user: { name: 'Neha', role: 'Owner', initial: 'N' },
  products: [
    { sku: 'RB-101', name: 'Cold-pressed groundnut oil, 1 L', price: 420, stock: 38 },
    { sku: 'RB-114', name: 'Forest honey, 500 g',             price: 360, stock: 6 },
    { sku: 'RB-120', name: 'Millet breakfast mix, 750 g',     price: 280, stock: 0 },
    { sku: 'RB-133', name: 'A2 ghee, 500 ml',                 price: 890, stock: 21 },
  ],
  offers: [ { code: 'DIWALI10', what: '10% off over ₹1,000', used: 48, ends: '5 Nov' },
            { code: 'FIRSTORDER', what: '₹150 off a first order', used: 112, ends: 'No end date' } ],
  orders: [
    { id: 'ORD-2208', who: 'Aditi Kulkarni', items: 3, total: 1570, pay: 'Paid · UPI', state: 'To pack',    via: 'WhatsApp' },
    { id: 'ORD-2207', who: 'Sanjay Menon',   items: 1, total: 890,  pay: 'Cash on delivery', state: 'Shipped', via: 'Storefront' },
    { id: 'ORD-2206', who: 'Walk-in',        items: 2, total: 700,  pay: 'Paid · card', state: 'Collected', via: 'Counter' },
    { id: 'ORD-2205', who: 'Leela Thomas',   items: 4, total: 2140, pay: 'Payment failed', state: 'Needs action', via: 'WhatsApp' },
  ],
};
