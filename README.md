# ClientFlow

Cold email sending from your own mailboxes, at a pace they survive.

This repository is the **frontend**: a marketing site, a customer workspace, and a platform
admin dashboard. It runs standalone in demo mode with sample data, so you can click through
every screen before any backend exists.

---

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
```

```bash
npm run build        # production build into dist/
npm run preview      # serve the build locally
```

Node 18 or newer.

---

## Demo mode

With no backend connected, the app serves data from `src/lib/mock.js`. On the sign-in page
there are two buttons that drop you straight into a populated account:

- **Customer workspace** — Adaeze Nwosu at Brightfold Studio, on the Growth plan, with four
  mailboxes (one deliberately broken), five campaigns, and a reply inbox.
- **Admin dashboard** — the platform side: revenue, accounts, subscriptions, campaign
  oversight, support queue, audit log.

Demo mode sends nothing and calls nothing. It is controlled by `VITE_DEMO_MODE` in `.env`.

---

## Connecting a backend

1. Copy `.env.example` to `.env`.
2. Set `VITE_API_URL` to your API's base URL and `VITE_DEMO_MODE=false`.
3. Build the backend described in [`BACKEND_SPEC.md`](./BACKEND_SPEC.md).

Every network call in this app lives in **one file**: `src/lib/api.js`. Each method carries
the REST path it expects in a comment above it. That file is the contract between the two
halves of the product — if the backend matches it, nothing else here needs to change.

```env
VITE_API_URL=https://api.clientflow.io/api
VITE_DEMO_MODE=false
VITE_PAYMENTS_PUBLIC_KEY=pk_live_...
```

---

## Layout

```
src/
├── components/
│   ├── ui/index.jsx          Buttons, fields, tables, modals, toasts — the whole kit
│   ├── app/Shell.jsx         One shell serving both the customer and admin sides
│   ├── marketing/            Nav, Footer, and the animated hero send console
│   └── Logo.jsx
├── lib/
│   ├── api.js                Every network call. The backend contract.
│   ├── mock.js               Demo dataset
│   ├── auth.jsx              Session provider
│   ├── format.js             Money, dates, percentages
│   └── hooks.js              useAsync, GSAP entrance, count-up
├── pages/
│   ├── marketing/            Landing, Product, Deliverability, Pricing, legal
│   ├── auth/                 Sign in, sign up, password reset
│   ├── app/                  The customer workspace
│   └── admin/                The platform dashboard
└── App.jsx                   All routes and the two navigation configs
```

---

## Design system

Everything visual is a token in `tailwind.config.js`. Change it there and it changes
everywhere.

| Token | Value | Used for |
|---|---|---|
| `ink` | `#0E1B2A` | Primary text, dark panels, admin sidebar |
| `paper` | `#F4F5F2` | Page background |
| `stamp` | `#D0342C` | Errors, suspensions, the logo's motion line |
| `route` | `#1B4B8F` | Links, informational states |
| `signal` | `#1F7A5C` | Active, delivered, healthy |
| `hold` | `#B07203` | At limit, paused, waiting |
| `slate` | `#5A6472` | Secondary text |

**Type** is Archivo for display (a variable font — the wordmark and headlines set different
`wdth` axis values) and Instrument Sans for body. Both load from Google Fonts in `index.html`.
Numeric data uses `tabular-nums` so columns line up.

**Status colours are a vocabulary, not decoration.** Roughly thirty status strings map onto
five tones through `STATUS_TONE` in `src/components/ui/index.jsx`. Green always means
running, amber always means waiting, red always means stopped. Add a new status string to
that map rather than picking a colour at the call site.

**The airmail rule** — the diagonal red-and-blue stripe from a postal envelope — appears in
exactly three places: under the hero, on the send-queue progress bar, and along active
campaign rows. It marks *sending in progress* and nothing else. Used more widely it stops
meaning anything.

---

## Accessibility

Focus rings are visible and never removed. Every animation is wrapped in a
`prefers-reduced-motion` check in `src/index.css`. Colour is never the only signal — status
pills carry text as well as a tone.

---

## Documents

- [`BACKEND_SPEC.md`](./BACKEND_SPEC.md) — the full backend build specification. Paste it
  into an AI assistant or hand it to a developer.
- [`docs/ClientFlow-Business-Plan.pdf`](./docs/) — revenue model, costs, go-to-market, risks.

---

## A note on the legal pages

The privacy policy, terms, and acceptable use pages carry real structure but placeholder
content, and say so on the page. They have not been reviewed by a lawyer. Cold email is
regulated differently in every market you will sell into. Get them reviewed before you take
your first payment.
