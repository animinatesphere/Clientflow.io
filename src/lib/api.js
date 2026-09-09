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

export const auth = {
  // POST /auth/register  { name, email, password, company }
  register: async (data) => {
    if (DEMO) {
      await wait();
      token.set("demo-token");
      return { user: { ...demo.DEMO_USER, ...data, plan: null, planStatus: "trialing" }, token: "demo-token" };
    }
    const r = await request("/auth/register", { method: "POST", body: data });
    token.set(r.token);
    return r;
  },

  // POST /auth/login  { email, password }
  login: async ({ email, password }) => {
    if (DEMO) {
      await wait();
      token.set("demo-token");
      const isAdmin = email.trim().toLowerCase().startsWith("admin");
      return {
        user: isAdmin ? demo.DEMO_ADMIN : demo.DEMO_USER,
        token: "demo-token",
      };
    }
    const r = await request("/auth/login", { method: "POST", body: { email, password } });
    token.set(r.token);
    return r;
  },

  // GET /auth/me
  me: async () => {
    if (DEMO) {
      await wait(120);
      return token.get() ? { user: demo.DEMO_USER } : null;
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
  list: async () => (DEMO ? (await wait(), demo.CAMPAIGNS) : request("/campaigns")),

  // GET /campaigns/:id
  get: async (id) =>
    DEMO
      ? (await wait(), demo.CAMPAIGNS.find((c) => c.id === id) || null)
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
  list: async () => (DEMO ? (await wait(), demo.REPLIES) : request("/replies")),
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
      ? (await wait(), { series: demo.SEND_SERIES, campaigns: demo.CAMPAIGNS })
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
  admin,
  DEMO,
};
