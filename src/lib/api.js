import * as demo from "./mock";

/* ─────────────────────────────────────────────────────────────────────────
   API client.

   This is the ONLY file that talks to the network. Every endpoint the
   backend must implement is listed here, so this file doubles as the
   contract your server has to satisfy. BACKEND_SPEC.md describes each one.

   Demo mode: with no VITE_API_URL, or VITE_DEMO_MODE=true, every call is
   served from src/lib/mock.js after a short artificial delay so loading
   states are visible. Flip the env var and the same calls hit your VPS.
   ───────────────────────────────────────────────────────────────────────── */

const BASE = import.meta.env.VITE_API_URL || "";
export const DEMO =
  import.meta.env.VITE_DEMO_MODE === "true" || !BASE;

const TOKEN_KEY = "clientflow.token";

export const token = {
  get: () => {
    try {
      return window.sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (v) => {
    try {
      v
        ? window.sessionStorage.setItem(TOKEN_KEY, v)
        : window.sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable — token stays in memory for this page load */
    }
  },
};

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token.get() ? { Authorization: `Bearer ${token.get()}` } : {}),
      ...headers,
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(
      payload?.message || `Request failed (${res.status})`,
      res.status,
      payload
    );
  }
  return payload;
}

const wait = (ms = 260) => new Promise((r) => setTimeout(r, ms));

/* ── Auth ─────────────────────────────────────────────────────────────── */

/** Demo tokens carry the persona ("demo:user" | "demo:worker" | "demo:admin")
    so a page refresh keeps you on the same side of the product. */
export const demoUserFor = (as) =>
  as === "admin" ? demo.DEMO_ADMIN : as === "worker" ? demo.DEMO_WORKER : demo.DEMO_USER;

/* A worker only ever receives the campaigns they are assigned, and the
   replies on them. The real server must apply the same filter (spec §16). */
const demoAssigned = () =>
  token.get() === "demo:worker" ? new Set(demo.DEMO_WORKER.campaignIds) : null;
const demoCampaigns = () => {
  const only = demoAssigned();
  return only ? demo.CAMPAIGNS.filter((c) => only.has(c.id)) : demo.CAMPAIGNS;
};
const demoReplies = () => {
  const only = demoAssigned();
  return only ? demo.REPLIES.filter((r) => only.has(r.campaignId)) : demo.REPLIES;
};

export const auth = {
  // POST /auth/register  { name, email, password, company }
  register: async (data) => {
    if (DEMO) {
      await wait();
      token.set("demo:user");
      return { user: { ...demo.DEMO_USER, ...data, plan: null, planStatus: "trialing" }, token: "demo:user" };
    }
    const r = await request("/auth/register", { method: "POST", body: data });
    token.set(r.token);
    return r;
  },

  // POST /auth/login  { email, password }
  login: async ({ email, password }) => {
    if (DEMO) {
      await wait();
      const e = email.trim().toLowerCase();
      const as = e.startsWith("admin") ? "admin" : e.startsWith("ken") || e.startsWith("worker") ? "worker" : "user";
      token.set(`demo:${as}`);
      return { user: demoUserFor(as), token: `demo:${as}` };
    }
    const r = await request("/auth/login", { method: "POST", body: { email, password } });
    token.set(r.token);
    return r;
  },

  // GET /auth/me
  me: async () => {
    if (DEMO) {
      await wait(120);
      const t = token.get();
      return t ? { user: demoUserFor(t.split(":")[1]) } : null;
    }
    return request("/auth/me");
  },

  // POST /auth/logout
  logout: async () => {
    token.set(null);
    if (DEMO) return { ok: true };
    return request("/auth/logout", { method: "POST" }).catch(() => ({ ok: true }));
  },

  // POST /auth/forgot-password  { email }
  forgotPassword: async (email) => {
    if (DEMO) {
      await wait();
      return { ok: true };
    }
    return request("/auth/forgot-password", { method: "POST", body: { email } });
  },
};

/* ── Mailboxes ────────────────────────────────────────────────────────── */

export const mailboxes = {
  // GET /mailboxes
  list: async () => (DEMO ? (await wait(), demo.MAILBOXES) : request("/mailboxes")),

  // GET /mailboxes/connect/:provider  → returns { url } to redirect to
  connectUrl: (provider) =>
    DEMO
      ? Promise.resolve({ url: null, demo: true })
      : request(`/mailboxes/connect/${provider}`),

  // PATCH /mailboxes/:id  { dailyLimit?, status? }
  update: async (id, patch) =>
    DEMO ? (await wait(), { id, ...patch }) : request(`/mailboxes/${id}`, { method: "PATCH", body: patch }),

  // DELETE /mailboxes/:id
  remove: async (id) =>
    DEMO ? (await wait(), { ok: true }) : request(`/mailboxes/${id}`, { method: "DELETE" }),
};

/* ── Contacts ─────────────────────────────────────────────────────────── */

export const contacts = {
  // GET /contacts?page&limit&search&status
  list: async (params = {}) => {
    if (DEMO) {
      await wait();
      const q = (params.search || "").toLowerCase();
      const rows = demo.CONTACTS.filter(
        (c) =>
          (!q ||
            `${c.firstName} ${c.lastName} ${c.email} ${c.company}`.toLowerCase().includes(q)) &&
          (!params.status || params.status === "all" || c.status === params.status)
      );
      return { rows, total: rows.length, page: 1, pages: 1 };
    }
    const qs = new URLSearchParams(params).toString();
    return request(`/contacts?${qs}`);
  },

  // POST /contacts
  create: async (data) =>
    DEMO ? (await wait(), { id: `c_${Date.now()}`, ...data }) : request("/contacts", { method: "POST", body: data }),

  // POST /contacts/import  (multipart, field name "file")
  import: async (file, listName) => {
    if (DEMO) {
      await wait(900);
      return { imported: 412, duplicates: 37, invalid: 9, suppressed: 4 };
    }
    const fd = new FormData();
    fd.append("file", file);
    if (listName) fd.append("list", listName);
    return request("/contacts/import", { method: "POST", body: fd });
  },

  // DELETE /contacts  { ids: [] }
  removeMany: async (ids) =>
    DEMO ? (await wait(), { deleted: ids.length }) : request("/contacts", { method: "DELETE", body: { ids } }),
};

/* ── Campaigns ────────────────────────────────────────────────────────── */

export const campaigns = {
  // GET /campaigns
  list: async () => (DEMO ? (await wait(), demoCampaigns()) : request("/campaigns")),

  // GET /campaigns/:id
  get: async (id) =>
    DEMO
      ? (await wait(), demoCampaigns().find((c) => c.id === id) || null)
      : request(`/campaigns/${id}`),

  // POST /campaigns
  create: async (data) =>
    DEMO ? (await wait(), { id: `cp_${Date.now()}`, ...data }) : request("/campaigns", { method: "POST", body: data }),

  // PUT /campaigns/:id
  update: async (id, data) =>
    DEMO ? (await wait(), { id, ...data }) : request(`/campaigns/${id}`, { method: "PUT", body: data }),

  // DELETE /campaigns/:id
  remove: async (id) =>
    DEMO ? (await wait(), { ok: true }) : request(`/campaigns/${id}`, { method: "DELETE" }),

  // POST /campaigns/:id/launch | /pause | /resume
  launch: async (id) =>
    DEMO ? (await wait(700), { ok: true, scheduled: 1840 }) : request(`/campaigns/${id}/launch`, { method: "POST" }),
  pause: async (id) =>
    DEMO ? (await wait(), { ok: true }) : request(`/campaigns/${id}/pause`, { method: "POST" }),
  resume: async (id) =>
    DEMO ? (await wait(), { ok: true }) : request(`/campaigns/${id}/resume`, { method: "POST" }),

  // GET /campaigns/:id/sends?page&status
  sends: async (id, params = {}) => {
    if (DEMO) {
      await wait();
      const rows = demo.CONTACTS.slice(0, 12).map((c, i) => ({
        id: `snd_${i}`,
        contactName: `${c.firstName} ${c.lastName}`,
        contactEmail: c.email,
        company: c.company,
        stepIndex: i % 3,
        status: ["sent", "sent", "replied", "sent", "bounced", "pending", "sent", "failed", "sent", "replied", "sent", "skipped"][i],
        scheduledAt: demo.SEND_SERIES ? new Date(Date.now() - i * 3600000).toISOString() : null,
        sentAt: new Date(Date.now() - i * 3600000).toISOString(),
        mailbox: i % 2 ? "adaeze@brightfold.co" : "hello@brightfold.co",
      }));
      return { rows, total: rows.length };
    }
    const qs = new URLSearchParams(params).toString();
    return request(`/campaigns/${id}/sends?${qs}`);
  },

  // POST /campaigns/:id/preview  { stepIndex, contactId } → rendered HTML
  preview: async (id, body) =>
    DEMO ? (await wait(), { html: null }) : request(`/campaigns/${id}/preview`, { method: "POST", body }),
};

/* ── Replies ──────────────────────────────────────────────────────────── */

export const replies = {
  // GET /replies?sentiment&read&campaignId
  list: async () => (DEMO ? (await wait(), demoReplies()) : request("/replies")),
  // PATCH /replies/:id  { read?, sentiment? }
  update: async (id, patch) =>
    DEMO ? (await wait(120), { id, ...patch }) : request(`/replies/${id}`, { method: "PATCH", body: patch }),
  // POST /replies/check  → triggers reply detection immediately
  check: async () =>
    DEMO ? (await wait(900), { found: 2 }) : request("/replies/check", { method: "POST" }),
};

/* ── Suppression ──────────────────────────────────────────────────────── */

export const suppression = {
  list: async () => (DEMO ? (await wait(), demo.SUPPRESSION) : request("/suppression")),
  add: async (email, reason = "manual") =>
    DEMO ? (await wait(), { id: `s_${Date.now()}`, email, reason }) : request("/suppression", { method: "POST", body: { email, reason } }),
  remove: async (email) =>
    DEMO ? (await wait(), { ok: true }) : request(`/suppression/${encodeURIComponent(email)}`, { method: "DELETE" }),
};

/* ── Analytics ────────────────────────────────────────────────────────── */

export const analytics = {
  // GET /analytics/overview?range=14d
  overview: async () =>
    DEMO
      ? (await wait(), { series: demo.SEND_SERIES, campaigns: demoCampaigns() })
      : request("/analytics/overview"),
};

/* ── Billing ──────────────────────────────────────────────────────────── */

export const billing = {
  // GET /billing/plans
  plans: async () => (DEMO ? (await wait(120), demo.PLANS) : request("/billing/plans")),

  // GET /billing/subscription
  subscription: async () =>
    DEMO
      ? (await wait(), {
          plan: "growth",
          status: "active",
          interval: "month",
          renewsAt: demo.DEMO_USER.renewsAt,
          usage: demo.DEMO_USER.usage,
        })
      : request("/billing/subscription"),

  // GET /billing/invoices
  invoices: async () => (DEMO ? (await wait(), demo.USER_INVOICES) : request("/billing/invoices")),

  // POST /billing/checkout  { planId, interval } → { url } to redirect to
  checkout: async (planId, interval) =>
    DEMO
      ? (await wait(500), { url: null, demo: true })
      : request("/billing/checkout", { method: "POST", body: { planId, interval } }),

  // POST /billing/portal → { url } to the processor's customer portal
  portal: async () =>
    DEMO ? (await wait(400), { url: null, demo: true }) : request("/billing/portal", { method: "POST" }),
};

/* ── Team ─────────────────────────────────────────────────────────────── */

const demoTeam = demo.TEAM.map((m) => ({ ...m }));

export const team = {
  // GET /team  → every seat in the caller's organisation, including pending invites
  list: async () => (DEMO ? (await wait(), demoTeam.map((m) => ({ ...m }))) : request("/team")),

  // POST /team/invite  { email, role, campaignIds }  (owner only)
  invite: async ({ email, role, campaignIds = [] }) => {
    if (!DEMO) return request("/team/invite", { method: "POST", body: { email, role, campaignIds } });
    await wait(400);
    const name = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const seat = { id: `u_${Date.now()}`, name, email, role, title: "", status: "invited", campaignIds, lastActiveAt: null };
    demoTeam.push(seat);
    return seat;
  },

  // PATCH /team/:id  { role?, campaignIds? }  (owner only)
  update: async (id, patch) => {
    if (!DEMO) return request(`/team/${id}`, { method: "PATCH", body: patch });
    await wait();
    const m = demoTeam.find((x) => x.id === id);
    Object.assign(m, patch);
    return { ...m };
  },

  // DELETE /team/:id  (owner only; cannot remove the last owner)
  remove: async (id) => {
    if (!DEMO) return request(`/team/${id}`, { method: "DELETE" });
    await wait();
    demoTeam.splice(demoTeam.findIndex((x) => x.id === id), 1);
    return { ok: true };
  },
};

/* ── Team chat ────────────────────────────────────────────────────────────
   Live updates: in demo mode, listeners are notified in-process. Against a
   real backend, subscribe() polls every few seconds; swap it for a WebSocket
   when the server supports one, and nothing else in the UI changes. */

const demoChannels = demo.CHANNELS.map((c) => ({ ...c, unread: { ...c.unread } }));
const demoMessages = demo.MESSAGES.map((m) => ({ ...m }));
const listeners = new Set();
const emit = (event) => listeners.forEach((fn) => fn(event));

const CANNED = [
  "On it.",
  "Makes sense — I'll update the sheet.",
  "Got it, thanks!",
  "Will do. Give me 10 minutes.",
  "Agreed 👍",
];

function demoTeammateReply(channel, fromId) {
  const others = channel.memberIds.filter((id) => id !== fromId);
  if (!others.length) return;
  const authorId = others[Math.floor(Math.random() * others.length)];
  setTimeout(() => emit({ type: "typing", channelId: channel.id, userId: authorId }), 700);
  setTimeout(() => {
    demoMessages.push({
      id: `m_${Date.now()}`,
      channelId: channel.id,
      authorId,
      body: CANNED[Math.floor(Math.random() * CANNED.length)],
      at: new Date().toISOString(),
    });
    channel.unread[fromId] = (channel.unread[fromId] || 0) + 1;
    emit({ type: "message", channelId: channel.id });
  }, 2600);
}

export const chat = {
  // GET /chat/channels  → channels the caller belongs to, with lastMessage and unread
  channels: async (meId) => {
    if (!DEMO) return request("/chat/channels");
    await wait(120);
    return demoChannels
      .filter((c) => c.memberIds.includes(meId))
      .map((c) => {
        const msgs = demoMessages.filter((m) => m.channelId === c.id);
        return { ...c, unread: c.unread[meId] || 0, lastMessage: msgs[msgs.length - 1] || null };
      })
      .sort((a, b) => new Date(b.lastMessage?.at || 0) - new Date(a.lastMessage?.at || 0));
  },

  // GET /chat/channels/:id/messages
  messages: async (channelId) => {
    if (!DEMO) return request(`/chat/channels/${channelId}/messages`);
    await wait(80);
    return demoMessages.filter((m) => m.channelId === channelId).map((m) => ({ ...m }));
  },

  // POST /chat/channels/:id/messages  { body }
  send: async (channelId, body, meId) => {
    if (!DEMO) return request(`/chat/channels/${channelId}/messages`, { method: "POST", body: { body } });
    const msg = { id: `m_${Date.now()}`, channelId, authorId: meId, body, at: new Date().toISOString() };
    demoMessages.push(msg);
    const channel = demoChannels.find((c) => c.id === channelId);
    channel.memberIds.forEach((id) => id !== meId && (channel.unread[id] = (channel.unread[id] || 0) + 1));
    emit({ type: "message", channelId });
    demoTeammateReply(channel, meId);
    return msg;
  },

  // POST /chat/channels  { name, description, memberIds }  (owner only)
  createGroup: async ({ name, description = "", memberIds }, meId) => {
    if (!DEMO) return request("/chat/channels", { method: "POST", body: { name, description, memberIds } });
    await wait(300);
    const channel = {
      id: `ch_${Date.now()}`,
      type: "group",
      name,
      description,
      memberIds: [...new Set([meId, ...memberIds])],
      createdBy: meId,
      unread: {},
    };
    demoChannels.push(channel);
    emit({ type: "channels" });
    return channel;
  },

  // POST /chat/direct  { userId }  → the existing DM with that person, or a new one
  openDirect: async (userId, meId) => {
    if (!DEMO) return request("/chat/direct", { method: "POST", body: { userId } });
    await wait(120);
    let dm = demoChannels.find(
      (c) => c.type === "direct" && c.memberIds.includes(userId) && c.memberIds.includes(meId)
    );
    if (!dm) {
      dm = { id: `dm_${meId}_${userId}`, type: "direct", memberIds: [meId, userId], unread: {} };
      demoChannels.push(dm);
      emit({ type: "channels" });
    }
    return dm;
  },

  // POST /chat/channels/:id/read
  markRead: async (channelId, meId) => {
    if (!DEMO) return request(`/chat/channels/${channelId}/read`, { method: "POST" });
    const c = demoChannels.find((x) => x.id === channelId);
    if (c && c.unread[meId]) {
      c.unread[meId] = 0;
      emit({ type: "read", channelId });
    }
    return { ok: true };
  },

  /** Calls fn on every chat change. Returns an unsubscribe function. */
  subscribe: (fn) => {
    if (!DEMO) {
      const id = setInterval(() => fn({ type: "poll" }), 4000);
      return () => clearInterval(id);
    }
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

/* ── Admin ────────────────────────────────────────────────────────────── */

export const admin = {
  metrics: async () => (DEMO ? (await wait(), demo.ADMIN_METRICS) : request("/admin/metrics")),
  revenue: async () =>
    DEMO
      ? (await wait(), { series: demo.MRR_SERIES, planSplit: demo.PLAN_SPLIT, invoices: demo.ADMIN_INVOICES })
      : request("/admin/revenue"),
  users: async (params = {}) => {
    if (DEMO) {
      await wait();
      const q = (params.search || "").toLowerCase();
      const rows = demo.ADMIN_USERS.filter(
        (u) =>
          (!q || `${u.name} ${u.email} ${u.company}`.toLowerCase().includes(q)) &&
          (!params.plan || params.plan === "all" || u.plan === params.plan) &&
          (!params.status || params.status === "all" || u.status === params.status)
      );
      return { rows, total: rows.length };
    }
    return request(`/admin/users?${new URLSearchParams(params)}`);
  },
  user: async (id) =>
    DEMO ? (await wait(), demo.ADMIN_USERS.find((u) => u.id === id)) : request(`/admin/users/${id}`),
  updateUser: async (id, patch) =>
    DEMO ? (await wait(), { id, ...patch }) : request(`/admin/users/${id}`, { method: "PATCH", body: patch }),
  campaigns: async () => (DEMO ? (await wait(), demo.ADMIN_CAMPAIGNS) : request("/admin/campaigns")),
  suspendCampaign: async (id, reason) =>
    DEMO ? (await wait(), { ok: true }) : request(`/admin/campaigns/${id}/suspend`, { method: "POST", body: { reason } }),
  tickets: async () => (DEMO ? (await wait(), demo.SUPPORT_TICKETS) : request("/admin/tickets")),
  auditLog: async () => (DEMO ? (await wait(), demo.AUDIT_LOG) : request("/admin/audit-log")),
  savePlan: async (planId, data) =>
    DEMO ? (await wait(), { planId, ...data }) : request(`/admin/plans/${planId}`, { method: "PUT", body: data }),
  settings: async () =>
    DEMO
      ? (await wait(), {
          sendingCeilingPerMailbox: 60,
          bounceRateCeiling: 8,
          complaintRateCeiling: 0.3,
          trialDays: 14,
          signupsOpen: true,
          maintenanceMode: false,
        })
      : request("/admin/settings"),
  saveSettings: async (patch) =>
    DEMO ? (await wait(), patch) : request("/admin/settings", { method: "PUT", body: patch }),
};

export default {
  auth,
  mailboxes,
  contacts,
  campaigns,
  replies,
  suppression,
  analytics,
  billing,
  team,
  chat,
  admin,
  DEMO,
};
