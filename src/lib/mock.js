import { daysAgo, minsAgo, daysAhead } from "./format";

/* ─────────────────────────────────────────────────────────────────────────
   Demo dataset.

   Everything here is fabricated sample data used to make the UI legible
   before the API exists. None of it is real. When VITE_API_URL is set and
   VITE_DEMO_MODE is not "true", src/lib/api.js talks to your server instead
   and this file is never imported at runtime.
   ───────────────────────────────────────────────────────────────────────── */

export const PLANS = [
  {
    id: "starter",
    name: "Starter",
    tagline: "One sender, one offer, proof it works.",
    monthly: 29,
    yearly: 290,
    limits: {
      mailboxes: 2,
      contacts: 2500,
      sendsPerMonth: 6000,
      seats: 1,
    },
    features: [
      "2 connected mailboxes",
      "2,500 stored contacts",
      "6,000 emails a month",
      "4-step sequences",
      "Reply detection and unified inbox",
      "CSV import with column mapping",
      "Email support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "Several senders sharing the load across a real list.",
    monthly: 79,
    yearly: 790,
    popular: true,
    limits: {
      mailboxes: 10,
      contacts: 25000,
      sendsPerMonth: 40000,
      seats: 3,
    },
    features: [
      "10 connected mailboxes",
      "25,000 stored contacts",
      "40,000 emails a month",
      "Unlimited sequence steps",
      "Sending-window and pacing rules",
      "A/B subject line testing",
      "Domain health monitoring",
      "3 team seats",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    tagline: "Client workspaces, kept apart and reported on separately.",
    monthly: 199,
    yearly: 1990,
    limits: {
      mailboxes: 50,
      contacts: 150000,
      sendsPerMonth: 250000,
      seats: 15,
    },
    features: [
      "50 connected mailboxes",
      "150,000 stored contacts",
      "250,000 emails a month",
      "Separate client workspaces",
      "White-label reports and sending domain",
      "Webhooks and REST API",
      "15 team seats",
      "Priority support",
    ],
  },
];

export const DEMO_USER = {
  id: "u_1042",
  name: "Adaeze Nwosu",
  email: "adaeze@brightfold.co",
  company: "Brightfold Studio",
  role: "owner",
  avatarTint: "#1B4B8F",
  plan: "growth",
  planStatus: "active",
  trialEndsAt: null,
  renewsAt: daysAhead(19),
  createdAt: daysAgo(214),
  usage: { mailboxes: 4, contacts: 8420, sendsThisMonth: 12680, seats: 2 },
};

export const DEMO_ADMIN = {
  id: "u_0001",
  name: "Tobi Adeyemi",
  email: "tobi@sendclientflow.com",
  role: "admin",
  avatarTint: "#0E1B2A",
};

export const MAILBOXES = [
  {
    id: "mb_1",
    email: "adaeze@brightfold.co",
    provider: "gmail",
    displayName: "Adaeze Nwosu",
    dailyLimit: 45,
    sentToday: 41,
    status: "active",
    health: 96,
    warmupDay: 34,
    connectedAt: daysAgo(96),
  },
  {
    id: "mb_2",
    email: "hello@brightfold.co",
    provider: "gmail",
    displayName: "Brightfold Team",
    dailyLimit: 40,
    sentToday: 40,
    status: "at_limit",
    health: 91,
    warmupDay: 61,
    connectedAt: daysAgo(88),
  },
  {
    id: "mb_3",
    email: "a.nwosu@brightfold-studio.com",
    provider: "outlook",
    displayName: "Adaeze N.",
    dailyLimit: 35,
    sentToday: 12,
    status: "active",
    health: 78,
    warmupDay: 11,
    connectedAt: daysAgo(12),
  },
  {
    id: "mb_4",
    email: "partnerships@brightfold.co",
    provider: "gmail",
    displayName: "Partnerships",
    dailyLimit: 30,
    sentToday: 0,
    status: "error",
    health: 40,
    warmupDay: 3,
    errorMessage: "Google revoked the refresh token. Reconnect this mailbox.",
    connectedAt: daysAgo(40),
  },
];

const NAMES = [
  ["Marcus", "Bello", "Halden Logistics"],
  ["Priya", "Raman", "Northgate Health"],
  ["Chidi", "Okonkwo", "Kestrel Foods"],
  ["Sara", "Lindqvist", "Vantage Studio"],
  ["Tom", "Whitfield", "Orbit Freight"],
  ["Amara", "Diallo", "Lumen Retail"],
  ["Ben", "Osei", "Foundry Works"],
  ["Elena", "Marchetti", "Casa Verde"],
  ["Ravi", "Shah", "Delta Manufacturing"],
  ["Grace", "Mensah", "Tidewater Group"],
  ["Jonas", "Kruger", "Brightline Legal"],
  ["Nneka", "Eze", "Palmwood Interiors"],
  ["Owen", "Blake", "Sable Analytics"],
  ["Mei", "Chen", "Anchor Point"],
  ["Diego", "Ferreira", "Rua Nova Cafe"],
  ["Fatima", "Al-Sayed", "Crescent Media"],
  ["Peter", "Nagy", "Ironvale Tools"],
  ["Zoe", "Hartman", "Fielding & Co"],
];

export const CONTACTS = NAMES.map(([first, last, company], i) => ({
  id: `c_${100 + i}`,
  firstName: first,
  lastName: last,
  company,
  email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, "")}@${company
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .slice(0, 12)}.com`,
  title: [
    "Operations Manager",
    "Head of Growth",
    "Founder",
    "Procurement Lead",
    "Marketing Director",
    "COO",
  ][i % 6],
  status: i === 5 || i === 14 ? "suppressed" : "active",
  lists: [["Q3 UK manufacturing", "Warm — webinar 2024", "Lagos SMB"][i % 3]],
  addedAt: daysAgo(90 - i * 3),
}));

export const CAMPAIGNS = [
  {
    id: "cp_1",
    name: "Q3 — UK manufacturing ops leads",
    status: "active",
    fromName: "Adaeze at Brightfold",
    createdAt: daysAgo(18),
    launchedAt: daysAgo(14),
    mailboxIds: ["mb_1", "mb_2"],
    contactCount: 1840,
    steps: [
      {
        order: 1,
        subject: "quick one about {{company}}'s despatch times",
        waitDays: 0,
        body: "Hi {{first_name}},\n\nI noticed {{company}} runs its own despatch rather than outsourcing. Most operations teams your size lose about a day a week to manual pick lists.\n\nWe built a scheduling layer that cut that to under an hour for Halden Logistics. Worth a 12-minute look?\n\nAdaeze",
      },
      {
        order: 2,
        subject: "Re: quick one about {{company}}'s despatch times",
        waitDays: 3,
        body: "Hi {{first_name}},\n\nFollowing up in case this got buried. I put together a one-page breakdown of how the Halden rollout went — happy to send it over, no call needed.\n\nAdaeze",
      },
      {
        order: 3,
        subject: "closing the loop, {{first_name}}",
        waitDays: 5,
        body: "Hi {{first_name}},\n\nI'll stop here so I'm not cluttering your inbox. If despatch scheduling becomes a priority later in the year, just reply and I'll pick it back up.\n\nAdaeze",
      },
    ],
    stats: { sent: 3420, delivered: 3301, replied: 214, positive: 63, bounced: 119, unsubscribed: 41, failed: 8 },
  },
  {
    id: "cp_2",
    name: "Lagos SMB — bookkeeping offer",
    status: "active",
    fromName: "Brightfold Team",
    createdAt: daysAgo(9),
    launchedAt: daysAgo(6),
    mailboxIds: ["mb_2"],
    contactCount: 620,
    steps: [
      {
        order: 1,
        subject: "{{company}} — bookkeeping without the January panic",
        waitDays: 0,
        body: "Hi {{first_name}},\n\nMost {{company}}-sized businesses I speak to in Lagos only look at their books when filings are due.\n\nWe run monthly close for a flat fee so there is no January scramble. Would it help to see what that looks like?\n\nBrightfold",
      },
      {
        order: 2,
        subject: "Re: {{company}} — bookkeeping without the January panic",
        waitDays: 4,
        body: "Hi {{first_name}},\n\nJust bumping this once. If it is not relevant, a one-word reply and I will close the file.\n\nBrightfold",
      },
    ],
    stats: { sent: 840, delivered: 812, replied: 71, positive: 24, bounced: 28, unsubscribed: 9, failed: 2 },
  },
  {
    id: "cp_3",
    name: "Webinar no-shows — re-engagement",
    status: "paused",
    fromName: "Adaeze at Brightfold",
    createdAt: daysAgo(31),
    launchedAt: daysAgo(28),
    mailboxIds: ["mb_1"],
    contactCount: 410,
    steps: [
      {
        order: 1,
        subject: "you signed up but didn't make it",
        waitDays: 0,
        body: "Hi {{first_name}},\n\nYou registered for the despatch scheduling session and couldn't make it — no problem, the recording is here if it's still useful.\n\nAdaeze",
      },
    ],
    stats: { sent: 410, delivered: 402, replied: 58, positive: 19, bounced: 8, unsubscribed: 4, failed: 0 },
  },
  {
    id: "cp_4",
    name: "Agency partners — Q4 referral push",
    status: "draft",
    fromName: "Adaeze at Brightfold",
    createdAt: daysAgo(2),
    launchedAt: null,
    mailboxIds: [],
    contactCount: 0,
    steps: [
      { order: 1, subject: "", waitDays: 0, body: "" },
    ],
    stats: { sent: 0, delivered: 0, replied: 0, positive: 0, bounced: 0, unsubscribed: 0, failed: 0 },
  },
  {
    id: "cp_5",
    name: "Dormant accounts — winter check-in",
    status: "completed",
    fromName: "Brightfold Team",
    createdAt: daysAgo(120),
    launchedAt: daysAgo(115),
    mailboxIds: ["mb_1", "mb_2"],
    contactCount: 980,
    steps: [
      { order: 1, subject: "still worth staying in touch?", waitDays: 0, body: "Hi {{first_name}},\n\nWe worked together back in the spring...\n\nBrightfold" },
      { order: 2, subject: "Re: still worth staying in touch?", waitDays: 6, body: "One quick bump, {{first_name}}." },
    ],
    stats: { sent: 1940, delivered: 1902, replied: 187, positive: 52, bounced: 38, unsubscribed: 22, failed: 1 },
  },
];

const REPLY_BODIES = [
  "Interesting timing — we're actually reviewing our despatch setup this quarter. Can you send that one-pager?",
  "Not me, but you want Fola on our ops team. Copying her in.",
  "Please remove me from this list.",
  "We're locked into a contract until March. Try me again then?",
  "Happy to take a look. Does Thursday 2pm work for a short call?",
  "How much does this cost roughly? Ballpark is fine.",
  "Already using something similar, thanks anyway.",
  "Who gave you my email address?",
];

const SENTIMENTS = ["positive", "referral", "unsubscribe", "later", "positive", "positive", "negative", "negative"];

export const REPLIES = REPLY_BODIES.map((body, i) => {
  const c = CONTACTS[i + 2];
  return {
    id: `r_${200 + i}`,
    contactId: c.id,
    contactName: `${c.firstName} ${c.lastName}`,
    contactEmail: c.email,
    company: c.company,
    campaignId: i % 3 === 0 ? "cp_2" : "cp_1",
    campaignName: i % 3 === 0 ? "Lagos SMB — bookkeeping offer" : "Q3 — UK manufacturing ops leads",
    stepIndex: i % 3,
    subject: i % 3 === 0 ? "Re: bookkeeping without the January panic" : "Re: quick one about despatch times",
    body,
    sentiment: SENTIMENTS[i],
    read: i > 3,
    repliedAt: minsAgo(18 + i * 137),
  };
});

export const SUPPRESSION = [
  { id: "s_1", email: "amara.diallo@lumenretail.com", reason: "unsubscribed", campaignName: "Q3 — UK manufacturing ops leads", addedAt: daysAgo(4) },
  { id: "s_2", email: "diego.ferreira@ruanovacafe.com", reason: "unsubscribed", campaignName: "Lagos SMB — bookkeeping offer", addedAt: daysAgo(6) },
  { id: "s_3", email: "info@orbitfreight.com", reason: "bounced", campaignName: "Q3 — UK manufacturing ops leads", addedAt: daysAgo(9) },
  { id: "s_4", email: "noreply@kestrelfoods.com", reason: "bounced", campaignName: "Q3 — UK manufacturing ops leads", addedAt: daysAgo(11) },
  { id: "s_5", email: "legal@brightlinelegal.com", reason: "manual", campaignName: null, addedAt: daysAgo(14) },
  { id: "s_6", email: "p.nagy@ironvaletools.com", reason: "complained", campaignName: "Dormant accounts — winter check-in", addedAt: daysAgo(21) },
];

/* Send activity for the last 14 days — drives the dashboard chart. */
export const SEND_SERIES = Array.from({ length: 14 }, (_, i) => {
  const day = 13 - i;
  const weekend = [0, 6].includes(new Date(Date.now() - day * 86400000).getDay());
  const base = weekend ? 40 : 300 + Math.round(Math.sin(i / 2) * 60);
  return {
    date: new Date(Date.now() - day * 86400000).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    sent: base + (i % 3) * 18,
    replied: Math.round(base * (weekend ? 0.04 : 0.062)),
    bounced: Math.round(base * 0.031),
  };
});

/* ── Admin-side data ──────────────────────────────────────────────────── */

export const ADMIN_METRICS = {
  mrr: 48720,
  mrrChange: 8.4,
  arr: 584640,
  activeSubs: 612,
  subsChange: 4.1,
  trials: 88,
  trialConversion: 27.5,
  churnRate: 3.2,
  totalUsers: 1943,
  usersChange: 6.7,
  emailsSent30d: 4128900,
  deliveryRate: 96.4,
  openMailboxes: 3184,
  failedMailboxes: 47,
  supportOpen: 12,
  supportOverdue: 3,
};

export const MRR_SERIES = [
  { month: "Oct", mrr: 21400, new: 4200, churned: 1100 },
  { month: "Nov", mrr: 25900, new: 5600, churned: 1100 },
  { month: "Dec", mrr: 29300, new: 4900, churned: 1500 },
  { month: "Jan", mrr: 34100, new: 6300, churned: 1500 },
  { month: "Feb", mrr: 38200, new: 5700, churned: 1600 },
  { month: "Mar", mrr: 41600, new: 5100, churned: 1700 },
  { month: "Apr", mrr: 44300, new: 4600, churned: 1900 },
  { month: "May", mrr: 46100, new: 4000, churned: 2200 },
  { month: "Jun", mrr: 48720, new: 4800, churned: 2180 },
];

export const PLAN_SPLIT = [
  { plan: "Starter", users: 284, mrr: 8236 },
  { plan: "Growth", users: 251, mrr: 19829 },
  { plan: "Agency", users: 77, mrr: 15323 },
  { plan: "Trial", users: 88, mrr: 0 },
];

const ADMIN_NAMES = [
  ["Kwame Boateng", "kwame@northbridge.io", "Northbridge Consulting", "agency", "active", 12],
  ["Laura Simmons", "laura@simmonshr.com", "Simmons HR", "starter", "active", 2],
  ["Rahul Verma", "rahul@dataleap.in", "DataLeap", "growth", "past_due", 6],
  ["Ifeoma Balogun", "ifeoma@greenmile.ng", "Green Mile Logistics", "growth", "active", 8],
  ["Daniel Ortiz", "d.ortiz@ortizmedia.mx", "Ortiz Media", "starter", "trialing", 1],
  ["Hannah Reid", "hannah@reidpartners.co.uk", "Reid Partners", "agency", "active", 22],
  ["Sunil Nair", "sunil@arcsupply.com", "Arc Supply Co", "growth", "cancelled", 0],
  ["Bola Adeniran", "bola@zenithcreative.ng", "Zenith Creative", "starter", "active", 2],
  ["Marta Nowak", "marta@nowakdesign.pl", "Nowak Design", "growth", "active", 5],
  ["Chen Wei", "chen@pacificroute.sg", "Pacific Route", "agency", "active", 31],
  ["Femi Oyelaran", "femi@lagostech.ng", "Lagos Tech Partners", "growth", "trialing", 3],
  ["Anna Kovacs", "anna@budapestbrand.hu", "Budapest Brand", "starter", "active", 1],
];

export const ADMIN_USERS = ADMIN_NAMES.map(([name, email, company, plan, status, mailboxes], i) => ({
  id: `u_${2000 + i}`,
  name,
  email,
  company,
  plan,
  status,
  mailboxes,
  contacts: [4200, 900, 18400, 12100, 320, 96000, 0, 1400, 7300, 121000, 5600, 480][i],
  sent30d: [21400, 3100, 48200, 33900, 610, 214000, 0, 4100, 19800, 302000, 12400, 1300][i],
  mrr: { starter: 29, growth: 79, agency: 199 }[plan] * (status === "active" || status === "past_due" ? 1 : 0),
  joinedAt: daysAgo(400 - i * 27),
  lastActiveAt: minsAgo([12, 340, 55, 8, 1900, 30, 43200, 700, 190, 5, 90, 2600][i]),
  flagged: i === 2 || i === 6,
}));

export const ADMIN_CAMPAIGNS = [
  { id: "acp_1", name: "Q4 outbound — enterprise", user: "Chen Wei", org: "Pacific Route", sent: 84200, replyRate: 4.1, bounceRate: 2.2, complaintRate: 0.04, status: "active" },
  { id: "acp_2", name: "Cold list — bulk import", user: "Rahul Verma", org: "DataLeap", sent: 31800, replyRate: 0.6, bounceRate: 14.8, complaintRate: 0.51, status: "flagged" },
  { id: "acp_3", name: "UK recruiters", user: "Hannah Reid", org: "Reid Partners", sent: 62400, replyRate: 6.8, bounceRate: 1.9, complaintRate: 0.02, status: "active" },
  { id: "acp_4", name: "Warm re-engage", user: "Ifeoma Balogun", org: "Green Mile Logistics", sent: 18900, replyRate: 9.2, bounceRate: 1.1, complaintRate: 0.01, status: "active" },
  { id: "acp_5", name: "Scraped directory blast", user: "Sunil Nair", org: "Arc Supply Co", sent: 12400, replyRate: 0.2, bounceRate: 22.4, complaintRate: 0.94, status: "suspended" },
];

export const SUPPORT_TICKETS = [
  { id: "t_301", subject: "Gmail keeps disconnecting after 2 days", user: "Ifeoma Balogun", plan: "growth", priority: "high", status: "open", openedAt: minsAgo(90) },
  { id: "t_302", subject: "Invoice needs our VAT number on it", user: "Hannah Reid", plan: "agency", priority: "low", status: "open", openedAt: minsAgo(400) },
  { id: "t_303", subject: "Can I move contacts between workspaces?", user: "Kwame Boateng", plan: "agency", priority: "normal", status: "waiting", openedAt: minsAgo(1500) },
  { id: "t_304", subject: "Charged twice this month", user: "Marta Nowak", plan: "growth", priority: "high", status: "open", openedAt: minsAgo(2900) },
  { id: "t_305", subject: "Bounce rate suddenly jumped to 18%", user: "Rahul Verma", plan: "growth", priority: "high", status: "open", openedAt: minsAgo(60) },
  { id: "t_306", subject: "Request to delete my account and data", user: "Sunil Nair", plan: "growth", priority: "normal", status: "resolved", openedAt: minsAgo(9000) },
];

export const AUDIT_LOG = [
  { id: "a_1", actor: "Tobi Adeyemi", action: "suspended_campaign", target: "Scraped directory blast — Arc Supply Co", note: "Complaint rate 0.94%, above the 0.3% ceiling", at: minsAgo(45) },
  { id: "a_2", actor: "system", action: "flagged_account", target: "DataLeap", note: "Bounce rate 14.8% on cp Cold list — bulk import", at: minsAgo(180) },
  { id: "a_3", actor: "Tobi Adeyemi", action: "issued_refund", target: "Marta Nowak — $79", note: "Duplicate charge confirmed with processor", at: minsAgo(320) },
  { id: "a_4", actor: "Tobi Adeyemi", action: "changed_plan", target: "Pacific Route → Agency (annual)", note: "Moved from monthly at customer request", at: minsAgo(1400) },
  { id: "a_5", actor: "system", action: "mailbox_revoked", target: "partnerships@brightfold.co", note: "Provider returned invalid_grant", at: minsAgo(2600) },
  { id: "a_6", actor: "Tobi Adeyemi", action: "updated_plan_pricing", target: "Growth: $75 → $79/mo", note: "Existing subscribers grandfathered", at: minsAgo(6000) },
];

export const ADMIN_INVOICES = [
  { id: "in_9001", customer: "Pacific Route", plan: "Agency (annual)", amount: 1990, status: "paid", at: daysAgo(1) },
  { id: "in_9002", customer: "Reid Partners", plan: "Agency", amount: 199, status: "paid", at: daysAgo(2) },
  { id: "in_9003", customer: "DataLeap", plan: "Growth", amount: 79, status: "failed", at: daysAgo(2) },
  { id: "in_9004", customer: "Green Mile Logistics", plan: "Growth", amount: 79, status: "paid", at: daysAgo(3) },
  { id: "in_9005", customer: "Simmons HR", plan: "Starter", amount: 29, status: "paid", at: daysAgo(4) },
  { id: "in_9006", customer: "Nowak Design", plan: "Growth", amount: 79, status: "refunded", at: daysAgo(5) },
  { id: "in_9007", customer: "Zenith Creative", plan: "Starter", amount: 29, status: "paid", at: daysAgo(6) },
];

export const USER_INVOICES = [
  { id: "in_5501", period: "This month", plan: "Growth", amount: 79, status: "paid", at: daysAgo(11) },
  { id: "in_5502", period: "Last month", plan: "Growth", amount: 79, status: "paid", at: daysAgo(41) },
  { id: "in_5503", period: "Two months ago", plan: "Growth", amount: 79, status: "paid", at: daysAgo(71) },
  { id: "in_5504", period: "Three months ago", plan: "Starter", amount: 29, status: "paid", at: daysAgo(101) },
];
