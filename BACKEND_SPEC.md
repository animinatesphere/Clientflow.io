# ClientFlow — Backend Build Specification

> **How to use this file.** Paste it whole into your AI coding assistant. It describes a
> multi-tenant SaaS backend that the ClientFlow frontend in this repository already expects.
> Every endpoint here maps to a function in `src/lib/api.js`. Build them and set
> `VITE_API_URL` in `.env`, and the UI stops using demo data.

---

## 0. Read this before you write any code

The uploaded reference spec you may have seen describes a **single-admin** cold email tool.
ClientFlow is a **multi-tenant SaaS product**. That is not a small difference. Almost every
bug that will cost you a customer comes from getting this wrong.

**Rule: every collection except `User` and `Plan` carries an `orgId`, and every query filters
on it.** Not "most queries". Every one. A missing `orgId` filter means one customer sees or
emails another customer's contacts, and that ends the business.

Enforce it structurally rather than by remembering:

```js
// middleware/scope.js — attach the org to the request once, then never trust req.body for it
module.exports = (req, res, next) => {
  if (!req.user?.orgId) return res.status(401).json({ message: "Not authenticated" });
  req.orgId = req.user.orgId;
  next();
};

// Every model query goes through a helper that cannot forget:
const scoped = (Model, req, filter = {}) => Model.find({ ...filter, orgId: req.orgId });
```

Write an integration test that creates two organisations, adds a contact to each, and asserts
that org A's `GET /contacts` returns exactly one row. Run it in CI. If that test ever fails,
stop shipping.

---

## 1. Architecture

```
                    ┌─────────────────────────────────────┐
   Browser  ───────▶│  Nginx (TLS, reverse proxy)         │
   (React SPA)      │  api.clientflow.io → :5000          │
                    │  app.clientflow.io → static /dist   │
                    └───────────────┬─────────────────────┘
                                    │
                    ┌───────────────▼─────────────────────┐
                    │  Node 20 + Express (PM2, 2 procs)   │
                    │  - REST API                          │
                    │  - OAuth callbacks                   │
                    │  - Payment webhooks                  │
                    └──────┬──────────────────┬────────────┘
                           │                  │
              ┌────────────▼───────┐   ┌──────▼──────────┐
              │  MongoDB 7         │   │  Redis 7        │
              │  (all app data)    │   │  (BullMQ queues,│
              │                    │   │   rate limits)  │
              └────────────────────┘   └──────┬──────────┘
                                              │
                                  ┌───────────▼───────────┐
                                  │  Worker process       │
                                  │  - send queue          │
                                  │  - reply detection     │
                                  │  - warm-up scheduler   │
                                  │  - domain checks       │
                                  └───────────────────────┘
```

**Run the worker as a separate PM2 process from the API.** A long reply-detection sweep must
never make an HTTP request time out, and you want to restart one without the other.

**Stack:** Node 20 LTS, Express 4, MongoDB 7 (Mongoose 8), Redis 7, BullMQ, googleapis,
@azure/msal-node, Stripe, argon2, zod.

---

## 2. The single most important decision: OAuth scopes

Read this section before you create a Google Cloud project. Getting it wrong costs weeks and
money.

Google classifies OAuth scopes into three tiers, and the tier decides your launch timeline:

| Scope | Google's classification | What it costs you |
|---|---|---|
| `gmail.send` | **Sensitive** | App verification review. No third-party security audit. |
| `gmail.readonly` | **Restricted** | Verification **plus** an annual CASA security assessment by a Google-approved assessor. |
| `gmail.modify`, `gmail.compose` | **Restricted** | Same as above. |

The reference spec detects replies by reading Gmail threads, which needs `gmail.readonly` — a
restricted scope. Published costs for a CASA assessment vary widely by tier and assessor, and
it must be repeated every twelve months. Confirm current requirements and pricing directly at
Google's restricted-scope verification documentation and with an approved assessor before you
budget for it; do not rely on a figure quoted in a blog post.

### The recommended MVP architecture

**Request `gmail.send` only, and detect replies over IMAP.**

- `gmail.send` (sensitive) + `userinfo.email` (sensitive) gets you through verification
  without the annual audit.
- For reply detection, connect the same mailbox over IMAP using a Google App Password, or ask
  the user to add a forwarding rule. Slower and clunkier than the Gmail API, but it ships.
- When revenue justifies it, add `gmail.readonly` and go through CASA. Build the reply
  detector behind an interface (`ReplyDetector.forMailbox(mailbox)`) so swapping the
  implementation later is one file, not a rewrite.

For Microsoft, `Mail.Send` and `Mail.Read` via Microsoft Graph do not carry an equivalent
annual third-party assessment requirement. Verify Microsoft's current publisher verification
requirements yourself before launch.

**Also plan for:** a published privacy policy that specifically names how you handle Google
user data, a homepage on the same verified domain, and a demo video of the consent flow.
Verification typically takes weeks, not days. Start it the day you have a working OAuth flow,
not the week you want to launch.

---

## 3. Environment variables

```env
# ── Core ────────────────────────────────────────────────────────────────
NODE_ENV=production
PORT=5000
API_URL=https://api.clientflow.io
APP_URL=https://app.clientflow.io
MARKETING_URL=https://clientflow.io

MONGODB_URI=mongodb://127.0.0.1:27017/clientflow
REDIS_URL=redis://127.0.0.1:6379

# ── Secrets — generate with: openssl rand -hex 32 ───────────────────────
JWT_SECRET=
JWT_REFRESH_SECRET=
TOKEN_ENCRYPTION_KEY=            # 32 bytes hex. Encrypts OAuth tokens at rest.
UNSUBSCRIBE_SECRET=              # Signs unsubscribe links.

# ── Google OAuth ────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://api.clientflow.io/api/mailboxes/callback/google

# ── Microsoft OAuth ─────────────────────────────────────────────────────
MS_CLIENT_ID=
MS_CLIENT_SECRET=
MS_TENANT_ID=common
MS_REDIRECT_URI=https://api.clientflow.io/api/mailboxes/callback/microsoft

# ── Payments ────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER_MONTH=
STRIPE_PRICE_STARTER_YEAR=
STRIPE_PRICE_GROWTH_MONTH=
STRIPE_PRICE_GROWTH_YEAR=
STRIPE_PRICE_AGENCY_MONTH=
STRIPE_PRICE_AGENCY_YEAR=

# Optional second processor for Nigerian cards. Keep the interface identical
# to Stripe's so billing code does not branch everywhere.
PAYSTACK_SECRET_KEY=
PAYSTACK_WEBHOOK_SECRET=

# ── Transactional email (your own notices, not customer campaigns) ──────
POSTMARK_TOKEN=
SYSTEM_FROM_EMAIL=noreply@clientflow.io

# ── Safety rails ────────────────────────────────────────────────────────
PLATFORM_MAX_PER_MAILBOX_PER_DAY=60
BOUNCE_RATE_CEILING=8            # percent — campaign auto-pauses above this
COMPLAINT_RATE_CEILING=0.3       # percent
TRIAL_DAYS=14
DRY_RUN=false                    # true = log instead of sending. Use in staging.
```

---

## 4. Data models

All timestamps are `Date`. All models use `{ timestamps: true }`.

### 4.1 Organization

The tenant. One per customer account. Everything hangs off this.

```js
const organizationSchema = new Schema({
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true, lowercase: true },
  ownerId:     { type: ObjectId, ref: "User", required: true },

  plan:        { type: String, enum: ["starter","growth","agency"], default: null },
  planStatus:  { type: String, enum: ["trialing","active","past_due","cancelled","suspended"], default: "trialing" },
  planInterval:{ type: String, enum: ["month","year"], default: "month" },
  trialEndsAt: { type: Date },
  renewsAt:    { type: Date },

  stripeCustomerId:     { type: String, index: true },
  stripeSubscriptionId: { type: String, index: true },

  // Rolling counters, reset by a scheduled job. Enforced on every send.
  usage: {
    sendsThisMonth:   { type: Number, default: 0 },
    usagePeriodStart: { type: Date, default: () => new Date() },
    contacts:         { type: Number, default: 0 },
    mailboxes:        { type: Number, default: 0 },
    seats:            { type: Number, default: 1 },
  },

  // Per-org overrides. Never allowed to exceed the platform env ceilings.
  settings: {
    hardStopOnLimit:  { type: Boolean, default: false },
    defaultDailyLimit:{ type: Number,  default: 30 },
    timezone:         { type: String,  default: "UTC" },
  },

  suspendedAt:     { type: Date },
  suspendedReason: { type: String },
}, { timestamps: true });
```

### 4.2 User

```js
const userSchema = new Schema({
  orgId:        { type: ObjectId, ref: "Organization", index: true },  // null for platform admins
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role:         { type: String, enum: ["owner","member","viewer","admin"], default: "owner" },
  //  owner/member/viewer  → scoped to their org
  //  admin                → platform staff. orgId is null. Never mixed with customer roles.

  emailVerifiedAt:  { type: Date },
  lastActiveAt:     { type: Date },
  resetTokenHash:   { type: String, select: false },
  resetTokenExpires:{ type: Date,   select: false },
}, { timestamps: true });
```

> **Never** let a customer role be escalated to `admin` through any customer-facing endpoint.
> Platform admins are created by a seed script or a CLI command, never by the API.

### 4.3 Mailbox

```js
const mailboxSchema = new Schema({
  orgId:        { type: ObjectId, ref: "Organization", required: true, index: true },
  email:        { type: String, required: true, lowercase: true, trim: true },
  provider:     { type: String, enum: ["gmail","microsoft","smtp"], required: true },
  displayName:  { type: String, default: "" },

  // AES-256-GCM ciphertext. NEVER returned by any endpoint. Use select:false.
  accessToken:  { type: String, select: false },
  refreshToken: { type: String, select: false },
  tokenExpiry:  { type: Date },
  smtpConfig:   { type: String, select: false },   // encrypted JSON for provider "smtp"

  dailyLimit:   { type: Number, default: 30 },
  sentToday:    { type: Number, default: 0 },
  lastResetDate:{ type: Date, default: () => new Date() },

  // Warm-up: the effective ceiling is min(dailyLimit, warmupCeiling()).
  warmupStartedAt: { type: Date, default: () => new Date() },
  warmupEnabled:   { type: Boolean, default: true },

  status:       { type: String, enum: ["active","paused","at_limit","error"], default: "active" },
  errorMessage: { type: String },
  consecutiveFailures: { type: Number, default: 0 },
  healthScore:  { type: Number, default: 100 },
}, { timestamps: true });

mailboxSchema.index({ orgId: 1, email: 1 }, { unique: true });
```

### 4.4 Contact

```js
const contactSchema = new Schema({
  orgId:     { type: ObjectId, ref: "Organization", required: true, index: true },
  email:     { type: String, required: true, lowercase: true, trim: true },
  firstName: { type: String, default: "" },
  lastName:  { type: String, default: "" },
  company:   { type: String, default: "" },
  title:     { type: String, default: "" },
  lists:     [{ type: String }],
  custom:    { type: Map, of: String, default: {} },   // every unmapped CSV column

  status:      { type: String, enum: ["active","suppressed"], default: "active" },
  importBatch: { type: String, index: true },
}, { timestamps: true });

contactSchema.index({ orgId: 1, email: 1 }, { unique: true });   // dedupe is per-org
contactSchema.index({ orgId: 1, status: 1 });
```

### 4.5 Campaign

```js
const stepSchema = new Schema({
  order:    { type: Number, required: true },
  subject:  { type: String, required: true },
  body:     { type: String, required: true },
  waitDays: { type: Number, default: 3, min: 0, max: 60 },
}, { _id: false });

const campaignSchema = new Schema({
  orgId:      { type: ObjectId, ref: "Organization", required: true, index: true },
  name:       { type: String, required: true, trim: true },
  fromName:   { type: String, default: "" },
  status:     { type: String, enum: ["draft","active","paused","completed","suspended"], default: "draft" },

  steps:      [stepSchema],
  mailboxIds: [{ type: ObjectId, ref: "Mailbox" }],
  contactIds: [{ type: ObjectId, ref: "Contact" }],

  sendWindow: {
    days:  { type: [String], default: ["mon","tue","wed","thu","fri"] },
    start: { type: String, default: "09:00" },
    end:   { type: String, default: "17:00" },
    timezone: { type: String, default: "UTC" },
  },
  stopOnReply: { type: Boolean, default: true },

  stats: {
    sent: { type: Number, default: 0 },  delivered:    { type: Number, default: 0 },
    replied: { type: Number, default: 0 }, positive:   { type: Number, default: 0 },
    bounced: { type: Number, default: 0 }, unsubscribed:{ type: Number, default: 0 },
    complained: { type: Number, default: 0 }, failed:  { type: Number, default: 0 },
  },

  launchedAt:      { type: Date },
  suspendedReason: { type: String },
}, { timestamps: true });
```

### 4.6 Send

One document per contact per step. This is your largest collection — index it properly.

```js
const sendSchema = new Schema({
  orgId:      { type: ObjectId, ref: "Organization", required: true, index: true },
  campaignId: { type: ObjectId, ref: "Campaign", required: true },
  contactId:  { type: ObjectId, ref: "Contact",  required: true },
  contactEmail:{ type: String, required: true, lowercase: true },
  stepIndex:  { type: Number, default: 0 },
  mailboxId:  { type: ObjectId, ref: "Mailbox" },

  status: { type: String,
    enum: ["pending","sent","failed","skipped","replied","bounced","unsubscribed"],
    default: "pending", index: true },

  scheduledAt: { type: Date, required: true },
  sentAt:      { type: Date },
  providerMessageId: { type: String },
  providerThreadId:  { type: String, index: true },
  rfcMessageId:      { type: String, index: true },  // the Message-ID: header you generated

  error:      { type: String },
  attempts:   { type: Number, default: 0 },

  replyFrom:    { type: String },
  replySubject: { type: String },
  replyBody:    { type: String },
  repliedAt:    { type: Date },
  sentiment:    { type: String, enum: ["positive","later","referral","negative","unsubscribe"] },
  replyRead:    { type: Boolean, default: false },
}, { timestamps: true });

// Idempotency: makes double-launch harmless with insertMany({ ordered: false }).
sendSchema.index({ campaignId: 1, contactId: 1, stepIndex: 1 }, { unique: true });
// The worker's hot query.
sendSchema.index({ status: 1, scheduledAt: 1 });
```

### 4.7 Suppression

```js
const suppressionSchema = new Schema({
  orgId:      { type: ObjectId, ref: "Organization", required: true, index: true },
  email:      { type: String, required: true, lowercase: true, trim: true },
  reason:     { type: String, enum: ["unsubscribed","bounced","complained","manual"], default: "manual" },
  campaignId: { type: ObjectId, ref: "Campaign" },
}, { timestamps: true });

suppressionSchema.index({ orgId: 1, email: 1 }, { unique: true });
```

### 4.8 AuditLog

Append-only. No update or delete route may exist for it, at any privilege level.

```js
const auditSchema = new Schema({
  orgId:     { type: ObjectId, ref: "Organization" },   // null for platform-wide actions
  actorId:   { type: ObjectId, ref: "User" },           // null when actor is "system"
  actorLabel:{ type: String, required: true },
  action:    { type: String, required: true },   // suspended_campaign, issued_refund, changed_plan…
  target:    { type: String, required: true },
  note:      { type: String },
  ip:        { type: String },
}, { timestamps: true });
```

### 4.9 Plan

Seed these from a migration. Store limits in the database rather than in code so the admin
plan editor can change them without a deploy.

```js
const planSchema = new Schema({
  key:      { type: String, enum: ["starter","growth","agency"], unique: true },
  name:     String,
  monthly:  Number,
  yearly:   Number,
  stripePriceMonthly: String,
  stripePriceYearly:  String,
  limits: {
    mailboxes: Number, contacts: Number, sendsPerMonth: Number,
    seats: Number, sequenceSteps: Number,
  },
  features: [String],
  active:   { type: Boolean, default: true },
}, { timestamps: true });
```

Seed values matching the frontend: Starter $29/$290 (2 / 2,500 / 6,000 / 1 / 4),
Growth $79/$790 (10 / 25,000 / 40,000 / 3 / unlimited),
Agency $199/$1,990 (50 / 150,000 / 250,000 / 15 / unlimited).

---

## 5. Encryption helper

```js
// utils/crypto.js
const crypto = require("crypto");
const KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY, "hex");   // 32 bytes
if (KEY.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes of hex");

exports.encrypt = (plain) => {
  if (!plain) return "";
  const iv = crypto.randomBytes(12);                       // GCM standard is 12 bytes
  const c  = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([c.update(String(plain), "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64url")).join(".");
};

exports.decrypt = (packed) => {
  if (!packed) return "";
  const [iv, tag, enc] = packed.split(".").map((s) => Buffer.from(s, "base64url"));
  const d = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
};
```

Rotating this key re-encrypts nothing automatically. Write a rotation script before you need
one, and keep the previous key in `TOKEN_ENCRYPTION_KEY_OLD` so decrypt can fall back.

---

## 6. API surface

Mount everything under `/api`. Every route below requires a valid JWT unless marked public.
The frontend's `src/lib/api.js` calls these exact paths.

### Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | Creates User **and** Organization in one transaction. Starts the trial. Returns `{ user, token }`. |
| POST | `/auth/login` | Rate limit to 5 attempts per 15 min per IP **and** per email. |
| GET | `/auth/me` | Returns `{ user }` with `usage` and plan hydrated from the org. |
| POST | `/auth/logout` | Invalidates the refresh token. |
| POST | `/auth/forgot-password` | Public. **Always** returns 200 regardless of whether the email exists. |
| POST | `/auth/reset-password` | Public. Consumes a single-use hashed token. |

### Mailboxes
| Method | Path | Notes |
|---|---|---|
| GET | `/mailboxes` | Never include `accessToken` / `refreshToken` / `smtpConfig`. |
| GET | `/mailboxes/connect/:provider` | Returns `{ url }`. Put a signed, short-lived `state` in the URL carrying `orgId` + a CSRF nonce. |
| GET | `/mailboxes/callback/:provider` | **Public** (the provider calls it). Verify `state`. Exchange the code, encrypt tokens, upsert the mailbox, then 302 to `${APP_URL}/app/mailboxes?connected=1`. |
| PATCH | `/mailboxes/:id` | `dailyLimit` or `status`. Reject `dailyLimit > PLATFORM_MAX_PER_MAILBOX_PER_DAY`. |
| DELETE | `/mailboxes/:id` | Revoke the token with the provider, then delete. Cancel that mailbox's pending sends. |

### Contacts
| Method | Path | Notes |
|---|---|---|
| GET | `/contacts?page&limit&search&status` | Paginated. Default limit 50, hard max 200. |
| POST | `/contacts` | Rejects if the address is suppressed. |
| POST | `/contacts/import` | multipart, field `file`. See §8. |
| DELETE | `/contacts/:id` | |
| DELETE | `/contacts` | Body `{ ids: [] }`. Cap at 5,000 per call. |

### Campaigns
| Method | Path | Notes |
|---|---|---|
| GET | `/campaigns` | |
| POST | `/campaigns` | Validate step count against the plan's `sequenceSteps`. |
| GET | `/campaigns/:id` | |
| PUT | `/campaigns/:id` | Editing steps on an **active** campaign only affects sends not yet dispatched. |
| DELETE | `/campaigns/:id` | Deletes its sends. Does **not** un-suppress anyone. |
| POST | `/campaigns/:id/launch` | See §7. |
| POST | `/campaigns/:id/pause` | Sets status; the worker skips paused campaigns on its next tick. |
| POST | `/campaigns/:id/resume` | Refuse if the org is `past_due` or over its monthly allowance. |
| GET | `/campaigns/:id/sends?page&limit&status` | |
| POST | `/campaigns/:id/preview` | `{ stepIndex, contactId }` → `{ html }` fully rendered. |

### Replies, suppression, analytics
| Method | Path | Notes |
|---|---|---|
| GET | `/replies?sentiment&read&campaignId` | |
| PATCH | `/replies/:id` | `{ read?, sentiment? }`. |
| POST | `/replies/check` | Enqueues an immediate detection job for this org. Rate limit to once a minute. |
| GET | `/suppression?page&search&reason` | |
| POST | `/suppression` | `{ email, reason }`. Also sets the matching contact to `suppressed` and cancels their pending sends. |
| DELETE | `/suppression/:email` | Reactivates the contact. Log it to the audit trail. |
| GET | `/analytics/overview?range=14d` | `{ series: [{date,sent,replied,bounced}], campaigns: [...] }`. |

### Billing
| Method | Path | Notes |
|---|---|---|
| GET | `/billing/plans` | Public. |
| GET | `/billing/subscription` | Current plan, status, renewal date, live usage. |
| GET | `/billing/invoices` | Proxied from the processor; do not mirror amounts in your own database. |
| POST | `/billing/checkout` | `{ planId, interval }` → `{ url }` (Stripe Checkout session). |
| POST | `/billing/portal` | → `{ url }` (Stripe customer portal). |
| POST | `/billing/webhook` | **Public, raw body, signature-verified.** See §10. |

### Public
| Method | Path | Notes |
|---|---|---|
| GET | `/u/:token` | Unsubscribe. Verify the JWT, suppress, cancel pending sends, render a plain confirmation page. Must work with no JavaScript. |

### Admin — all require `role === "admin"`
| Method | Path |
|---|---|
| GET | `/admin/metrics` |
| GET | `/admin/revenue` |
| GET | `/admin/users?search&plan&status` |
| GET | `/admin/users/:id` |
| PATCH | `/admin/users/:id` |
| GET | `/admin/campaigns` |
| POST | `/admin/campaigns/:id/suspend` — body `{ reason }`, required |
| GET | `/admin/tickets` |
| GET | `/admin/audit-log` |
| PUT | `/admin/plans/:id` |
| GET/PUT | `/admin/settings` |

Every admin mutation writes an `AuditLog` row in the same transaction as the change. If the
audit write fails, the change rolls back.

---

## 7. The send engine

This is the heart of the product. Get it wrong and you damage customers' domains.

### 7.1 Launch

```js
// POST /campaigns/:id/launch
async function launch(req, res) {
  const campaign = await Campaign.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!campaign) return res.status(404).json({ message: "Campaign not found" });

  // Guards — fail loudly and specifically. The UI shows these strings.
  if (!campaign.steps.length)      return res.status(400).json({ message: "Add at least one step." });
  if (!campaign.mailboxIds.length) return res.status(400).json({ message: "Choose at least one mailbox." });
  if (!campaign.contactIds.length) return res.status(400).json({ message: "Select at least one contact." });

  const org = await Organization.findById(req.orgId);
  if (["past_due","suspended","cancelled"].includes(org.planStatus))
    return res.status(402).json({ message: "Your subscription is not active." });

  // Filter the audience: active contacts only, minus everyone suppressed.
  const suppressed = await Suppression.find({ orgId: req.orgId }).distinct("email");
  const contacts = await Contact.find({
    _id: { $in: campaign.contactIds },
    orgId: req.orgId,
    status: "active",
    email: { $nin: suppressed },
  }).select("_id email").lean();

  if (!contacts.length)
    return res.status(400).json({ message: "Every selected contact is suppressed or inactive." });

  // Allowance check BEFORE scheduling, not during sending.
  const plan = await Plan.findOne({ key: org.plan });
  const projected = contacts.length * campaign.steps.length;
  if (org.usage.sendsThisMonth + projected > plan.limits.sendsPerMonth && org.settings.hardStopOnLimit)
    return res.status(402).json({ message: "This campaign would exceed your monthly allowance." });

  // Schedule step 0 only. Later steps are created after the previous one sends,
  // so a paused or replied contact never has orphaned future rows.
  const now = Date.now();
  const docs = contacts.map((c, i) => ({
    orgId: req.orgId, campaignId: campaign._id, contactId: c._id, contactEmail: c.email,
    stepIndex: 0, status: "pending",
    // Spread across the day rather than firing a burst. 40–180s apart.
    scheduledAt: new Date(now + i * (40000 + Math.random() * 140000)),
  }));
  await Send.insertMany(docs, { ordered: false }).catch((e) => {
    if (e.code !== 11000) throw e;   // duplicate key = already scheduled. Fine.
  });

  campaign.status = "active";
  campaign.launchedAt = campaign.launchedAt ?? new Date();
  await campaign.save();

  await sendQueue.add("tick", { orgId: String(req.orgId) }, { removeOnComplete: true });
  res.json({ ok: true, scheduled: docs.length });
}
```

### 7.2 Warm-up ceiling

The effective limit is the lower of the user's setting and the warm-up schedule:

```js
function warmupCeiling(mailbox) {
  if (!mailbox.warmupEnabled) return mailbox.dailyLimit;
  const days = Math.floor((Date.now() - mailbox.warmupStartedAt) / 86400000);
  if (days < 7)  return 10;
  if (days < 14) return 20;
  if (days < 30) return 35;
  return mailbox.dailyLimit;
}
const effectiveLimit = (mb) => Math.min(mb.dailyLimit, warmupCeiling(mb),
                                        Number(process.env.PLATFORM_MAX_PER_MAILBOX_PER_DAY));
```

### 7.3 Worker tick

Runs every 60 seconds. Use a **Redis lock**, not an in-process boolean — a module-level flag
does not protect you once you run two PM2 instances.

```js
async function tick() {
  const lock = await redis.set("lock:send", "1", "NX", "PX", 55000);
  if (!lock) return;                     // another worker has it
  try {
    await resetDailyCounters();          // where lastResetDate < today, in the mailbox's tz

    const due = await Send.find({ status: "pending", scheduledAt: { $lte: new Date() } })
      .sort({ scheduledAt: 1 }).limit(200).lean();

    for (const batch of chunk(due, 5)) { // 5 at a time, never more
      await Promise.all(batch.map(processSend));
    }
  } finally {
    await redis.del("lock:send");
  }
}
```

### 7.4 Processing one send

Order matters. Each check is cheaper than the one after it, and each one prevents a send you
would regret.

```js
async function processSend(send) {
  const campaign = await Campaign.findById(send.campaignId);
  if (!campaign || campaign.status !== "active")
    return skip(send, "Campaign is not running");

  // 1. Send window — is it allowed to send right now, in the campaign's timezone?
  if (!insideSendWindow(campaign.sendWindow))
    return Send.updateOne({ _id: send._id }, { scheduledAt: nextWindowOpening(campaign.sendWindow) });

  // 2. Suppression. Checked here, on every send, not only at launch.
  if (await Suppression.exists({ orgId: send.orgId, email: send.contactEmail }))
    return skip(send, "Suppressed");

  // 3. Contact still active?
  const contact = await Contact.findById(send.contactId);
  if (!contact || contact.status !== "active") return skip(send, "Contact inactive");

  // 4. Did this contact already reply to this campaign? Belt and braces —
  //    the reply detector should have cancelled it, but never send twice.
  if (campaign.stopOnReply &&
      await Send.exists({ campaignId: campaign._id, contactId: contact._id, status: "replied" }))
    return skip(send, "Already replied");

  // 5. Org allowance.
  const org  = await Organization.findById(send.orgId);
  const plan = await Plan.findOne({ key: org.plan });
  if (org.usage.sendsThisMonth >= plan.limits.sendsPerMonth) {
    if (org.settings.hardStopOnLimit) return skip(send, "Monthly allowance reached");
    return Send.updateOne({ _id: send._id }, { scheduledAt: addHours(new Date(), 6) });
  }

  // 6. A mailbox with capacity left. If none, retry in an hour — do NOT exceed the limit.
  const mailbox = await pickMailbox(campaign.mailboxIds, send.orgId);
  if (!mailbox) return Send.updateOne({ _id: send._id }, { scheduledAt: addHours(new Date(), 1) });

  // 7. Render.
  const step = campaign.steps[send.stepIndex];
  const unsubUrl = buildUnsubscribeUrl(send);        // signed JWT, see §9
  const subject  = personalize(step.subject, contact);
  const html     = buildEmailHtml(personalize(step.body, contact), unsubUrl, org);

  // 8. Threading — follow-ups must land in the same conversation.
  const previous = send.stepIndex > 0
    ? await Send.findOne({ campaignId: campaign._id, contactId: contact._id, stepIndex: send.stepIndex - 1 })
    : null;

  if (process.env.DRY_RUN === "true") {
    console.log(`[DRY RUN] → ${contact.email} step ${send.stepIndex + 1}: ${subject}`);
    return markSent(send, mailbox, campaign, { id: "dry", threadId: "dry" });
  }

  try {
    const result = await providerFor(mailbox).send({
      mailbox, to: contact.email, subject, html,
      fromName: campaign.fromName,
      inReplyTo:  previous?.rfcMessageId,
      references: previous?.rfcMessageId,
      listUnsubscribe: unsubUrl,        // see §9 — this header is not optional
    });
    await markSent(send, mailbox, campaign, result);
    await scheduleNextStep(send, campaign);
  } catch (err) {
    await handleSendError(send, mailbox, err);
  }
}
```

### 7.5 Mailbox rotation

```js
async function pickMailbox(ids, orgId) {
  const boxes = await Mailbox.find({ _id: { $in: ids }, orgId, status: "active" })
    .select("+accessToken +refreshToken");
  // Least-recently-used with capacity, so load spreads evenly rather than
  // draining box one before touching box two.
  return boxes
    .filter((b) => b.sentToday < effectiveLimit(b))
    .sort((a, b) => a.sentToday / effectiveLimit(a) - b.sentToday / effectiveLimit(b))[0] ?? null;
}
```

### 7.6 Error handling

```js
async function handleSendError(send, mailbox, err) {
  const msg = err.message || String(err);

  // Auth failure — the whole mailbox is dead, not just this send.
  if (/invalid_grant|Invalid Credentials|unauthorized|401/i.test(msg)) {
    await Mailbox.updateOne({ _id: mailbox._id }, {
      status: "error",
      errorMessage: "The provider revoked access. Reconnect this mailbox.",
    });
    await notifyOwner(send.orgId, "mailbox_disconnected", mailbox.email);
    return Send.updateOne({ _id: send._id }, { status: "pending", scheduledAt: addMinutes(new Date(), 30) });
  }

  // Hard bounce — the address does not exist. Suppress permanently.
  if (/550|5\.1\.1|does not exist|user unknown/i.test(msg)) {
    await Suppression.updateOne(
      { orgId: send.orgId, email: send.contactEmail },
      { $setOnInsert: { reason: "bounced", campaignId: send.campaignId } },
      { upsert: true }
    );
    await Contact.updateOne({ _id: send.contactId }, { status: "suppressed" });
    await Send.updateMany(
      { orgId: send.orgId, contactId: send.contactId, status: "pending" },
      { status: "skipped", error: "Bounced" }
    );
    await Campaign.updateOne({ _id: send.campaignId }, { $inc: { "stats.bounced": 1 } });
    await checkBounceCeiling(send.campaignId);
    return Send.updateOne({ _id: send._id }, { status: "bounced", error: msg });
  }

  // Rate limited — back off, do not burn an attempt.
  if (/429|rate.?limit|quota/i.test(msg))
    return Send.updateOne({ _id: send._id }, { scheduledAt: addMinutes(new Date(), 15) });

  // Anything else: three attempts with exponential backoff, then give up.
  const attempts = (send.attempts || 0) + 1;
  if (attempts < 3)
    return Send.updateOne({ _id: send._id },
      { attempts, scheduledAt: addMinutes(new Date(), 5 * 2 ** attempts) });

  await Campaign.updateOne({ _id: send.campaignId }, { $inc: { "stats.failed": 1 } });
  return Send.updateOne({ _id: send._id }, { status: "failed", error: msg, attempts });
}
```

### 7.7 The bounce ceiling

```js
async function checkBounceCeiling(campaignId) {
  const c = await Campaign.findById(campaignId);
  if (c.stats.sent < 50) return;                      // too small a sample to judge
  const bounceRate    = (c.stats.bounced   / c.stats.sent) * 100;
  const complaintRate = (c.stats.complained / c.stats.sent) * 100;

  if (bounceRate    > Number(process.env.BOUNCE_RATE_CEILING) ||
      complaintRate > Number(process.env.COMPLAINT_RATE_CEILING)) {
    c.status = "paused";
    c.suspendedReason = `Auto-paused: ${bounceRate.toFixed(1)}% bounce, ${complaintRate.toFixed(2)}% complaint`;
    await c.save();
    await AuditLog.create({
      orgId: c.orgId, actorLabel: "system", action: "auto_paused_campaign",
      target: c.name, note: c.suspendedReason,
    });
    await notifyOwner(c.orgId, "campaign_paused", c.name);
  }
}
```

This runs automatically and is **not** a user preference. A customer can make their own limits
stricter; nobody can switch this off.

---

## 8. CSV import

```
POST /contacts/import   multipart/form-data, field "file"
→ { imported, duplicates, invalid, suppressed, rejectedRowsUrl }
```

1. Stream the file with `csv-parse` — never `readFileSync` a 100MB upload into memory.
2. Detect the email column: exact match on `email`, then case-insensitive, then any header
   containing "email". If none is found, return 400 with the header list you did find so the
   user can see why.
3. Map `first_name` / `firstName` / `First Name`, same for last name, `company`, `title`.
   Split `full_name` on the first space. Every unmapped column goes into `custom`.
4. Validate with a real parser, not a regex you wrote — a bad regex rejects valid addresses
   with apostrophes and plus signs.
5. Lowercase and trim. Deduplicate **within the file** as well as against the database.
6. Drop anything on the org's suppression list and count it separately. Never silently
   re-add a suppressed address.
7. `bulkWrite` with `upsert` in batches of 1,000.
8. Keep the rejected rows for 24 hours and return a signed download URL for them.
9. Enforce the plan's contact limit and stop with a clear message when it is hit — do not
   import 40% of a file and report success.

---

## 9. Compliance requirements in the email itself

These are not optional extras. Getting them wrong is how the platform ends up blocklisted.

**Every message must include:**

```
List-Unsubscribe: <https://api.clientflow.io/api/u/TOKEN>, <mailto:unsubscribe@clientflow.io>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

Major mailbox providers now expect one-click unsubscribe support from bulk senders. A `POST`
to that URL must suppress the address without any further interaction — no confirmation page,
no login.

**Also required in the body:** a visible unsubscribe link, the sender's real identity, and a
physical postal address where the applicable law requires one. Store the org's postal address
at signup and refuse to launch a campaign without it.

The unsubscribe token is a signed JWT, not a database id:

```js
const token = jwt.sign(
  { sendId: String(send._id), orgId: String(send.orgId), email: send.contactEmail },
  process.env.UNSUBSCRIBE_SECRET,
  { expiresIn: "365d" }
);
```

On unsubscribe: upsert into `Suppression`, set the contact to `suppressed`, cancel every
pending send for that contact **across all campaigns in that org**, increment
`campaign.stats.unsubscribed`, and return a plain HTML confirmation that needs no JavaScript.

---

## 10. Billing

Use Stripe Checkout and the customer portal. Do not build card forms; you do not want the PCI
scope.

**Webhook handling.** Mount it before `express.json()` so you get the raw body for signature
verification, and make it idempotent by storing processed `event.id` values in Redis with a
30-day TTL — Stripe retries, and you must not double-apply.

| Event | What to do |
|---|---|
| `checkout.session.completed` | Set `plan`, `planStatus: "active"`, `stripeSubscriptionId`, `renewsAt`. |
| `customer.subscription.updated` | Sync plan, interval, status, `renewsAt`. Handles upgrades and downgrades. |
| `customer.subscription.deleted` | `planStatus: "cancelled"`. Read-only for 30 days, then a scheduled job purges. |
| `invoice.payment_failed` | `planStatus: "past_due"`. Email the owner. Keep sending for 7 days, then pause every campaign. |
| `invoice.payment_succeeded` | Back to `active`. Resume campaigns paused for non-payment only — not ones paused for bounce rate. |

**Grandfathering.** When an admin edits a plan's price, only the `Plan` document changes.
Existing subscriptions keep their Stripe price id until the customer changes plan themselves.
The admin UI states this; the backend must actually enforce it.

**Nigerian cards.** Stripe does not support payouts to Nigerian entities in every
configuration, and local cards often fail on international processors. If your customers are
primarily Nigerian, integrate Paystack alongside Stripe behind one interface:

```js
// services/payments/index.js
const provider = (org) => (org.currency === "NGN" ? paystack : stripe);
// Both expose: createCheckout(), createPortal(), handleWebhook(), cancelSubscription()
```

Confirm current availability and terms with both processors directly before you commit —
their supported-country lists change.

---

## 11. Plan enforcement

Enforce limits in middleware, not scattered through controllers:

```js
// middleware/enforceLimit.js
module.exports = (resource) => async (req, res, next) => {
  const org  = await Organization.findById(req.orgId).lean();
  const plan = await Plan.findOne({ key: org.plan }).lean();
  if (!plan) return res.status(402).json({ message: "No active plan." });

  const map = {
    mailbox: [org.usage.mailboxes, plan.limits.mailboxes, "connected mailboxes"],
    contact: [org.usage.contacts,  plan.limits.contacts,  "stored contacts"],
    seat:    [org.usage.seats,     plan.limits.seats,     "team seats"],
  };
  const [used, cap, label] = map[resource];
  if (used >= cap)
    return res.status(402).json({
      message: `Your ${plan.name} plan allows ${cap} ${label}. Upgrade to add more.`,
      code: "PLAN_LIMIT",
    });
  next();
};

// router.post("/mailboxes/connect/:provider", auth, scope, enforceLimit("mailbox"), ...)
```

The frontend already renders `message` from a 402 directly, so write these strings for the
person reading them.

---

## 12. Security checklist

Work through every line before you accept a payment.

- [ ] `helmet()` on, CORS restricted to `APP_URL` and `MARKETING_URL` only.
- [ ] Passwords hashed with argon2id. Never bcrypt with a low cost factor, never MD5/SHA.
- [ ] Access tokens 15 minutes; refresh tokens 30 days in an httpOnly, Secure, SameSite=Lax cookie.
- [ ] Rate limits: 5/15min on login and password reset; 100/min general; 1/min on `/replies/check`.
- [ ] Every request body validated with zod. Reject unknown keys rather than ignoring them.
- [ ] `orgId` never read from the request body — only from the authenticated session.
- [ ] Mailbox tokens `select: false` and asserted absent in an automated test of every response.
- [ ] Mongoose queries sanitised against operator injection (`{ $ne: null }` in a search field).
- [ ] Uploads capped at 100MB, extension **and** content-type checked, stored outside the web root.
- [ ] OAuth `state` signed and single-use; reject a replayed one.
- [ ] Webhook signatures verified on the raw body for every processor.
- [ ] Structured logs with no tokens, passwords, or full email bodies in them.
- [ ] Nightly `mongodump` to off-server storage. **Test a restore** — an untested backup is not a backup.
- [ ] Audit log written for every admin action, in the same transaction as the change.

---

## 13. VPS deployment

Assumes Ubuntu 22.04 or 24.04, 2 vCPU / 4GB minimum. Below that, MongoDB and the worker will
fight each other under load.

```bash
# ── System ──────────────────────────────────────────────────────────────
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx redis-server ufw fail2ban git curl

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2

# MongoDB 7 — follow the current official instructions for your Ubuntu release
# at mongodb.com/docs rather than an older repo line copied from a blog post.

# ── Firewall: nothing but SSH and HTTP(S) reaches the internet ──────────
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
# Mongo and Redis MUST bind to 127.0.0.1 only:
#   /etc/mongod.conf   → net.bindIp: 127.0.0.1
#   /etc/redis/redis.conf → bind 127.0.0.1  + requirepass <long-random-string>
sudo systemctl restart mongod redis-server

# ── Deploy ──────────────────────────────────────────────────────────────
sudo mkdir -p /var/www/clientflow && sudo chown $USER:$USER /var/www/clientflow
cd /var/www/clientflow
git clone <your-backend-repo> api && cd api
npm ci --omit=dev
cp .env.example .env && nano .env         # fill in every value from §3

pm2 start ecosystem.config.js
pm2 save && pm2 startup
```

```js
// ecosystem.config.js — API and worker as separate processes
module.exports = {
  apps: [
    { name: "clientflow-api",    script: "src/server.js", instances: 2, exec_mode: "cluster",
      max_memory_restart: "500M", env: { NODE_ENV: "production" } },
    { name: "clientflow-worker", script: "src/worker.js", instances: 1,
      max_memory_restart: "700M", env: { NODE_ENV: "production" } },
  ],
};
```

```nginx
# /etc/nginx/sites-available/clientflow
server {
  server_name api.clientflow.io;

  # Stripe's webhook needs the raw body — no buffering games.
  location /api/billing/webhook {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_request_buffering off;
  }

  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 100M;          # CSV uploads
    proxy_read_timeout 120s;
  }
}

server {
  server_name app.clientflow.io;
  root /var/www/clientflow/web/dist;

  # Hashed asset filenames can be cached hard.
  location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }

  # SPA fallback — every unknown path serves index.html so React Router works.
  location / { try_files $uri $uri/ /index.html; }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/clientflow /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo snap install --classic certbot
sudo certbot --nginx -d api.clientflow.io -d app.clientflow.io -d clientflow.io
```

**Frontend deploy:** build locally or in CI and copy the output.

```bash
npm run build
rsync -avz --delete dist/ user@your-vps:/var/www/clientflow/web/dist/
```

---

## 14. Build order

Do not build this in the order the file is written. Build it so that something works at every
stage:

1. **Foundation** — Express, Mongo, models, auth, the org/user split, the two-tenant isolation test.
2. **Contacts** — CRUD and CSV import. Now the UI has real data in it.
3. **Mailboxes** — Google OAuth only, `gmail.send` only. Get token encryption right here.
4. **Campaigns** — CRUD, then launch, then the worker with `DRY_RUN=true`. Watch the logs
   until the pacing and rotation behave, before a single real email leaves.
5. **Real sending** — flip `DRY_RUN`, send to your own addresses first, in volumes of ten.
6. **Suppression and unsubscribe** — including the `List-Unsubscribe` headers.
7. **Reply detection** — IMAP first. Ship without the Gmail API.
8. **Billing** — Stripe Checkout, portal, webhooks. Test with the CLI's event triggers.
9. **Admin** — metrics, accounts, oversight, audit log.
10. **Microsoft**, then everything else.

Start Google's verification review at step 3, not step 10. It runs in parallel with the rest
of the build and it is the thing most likely to delay your launch.

---

## 15. Definition of done

The backend is finished when all of the following are true:

- Two organisations cannot see each other's data, proven by an automated test.
- No endpoint, under any role, returns a mailbox token. Proven by an automated test.
- A campaign launched with 500 contacts across 2 mailboxes limited to 30/day sends 60 on day
  one, not 500.
- Replying to a step-one email stops step two, verified end to end with real mailboxes.
- Clicking unsubscribe stops every campaign in that org for that address, within one send cycle.
- A campaign at 9% bounce rate pauses itself without anyone intervening.
- Stripe webhooks are idempotent: firing the same event twice changes nothing the second time.
- A restore from last night's backup produces a working system.
