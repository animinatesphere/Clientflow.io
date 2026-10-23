#!/usr/bin/env python3
"""Generates the ClientFlow launch-cost estimate PDF, styled to match the business plan."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak, NextPageTemplate,
    KeepTogether,
)

from build_plan import (
    S, P, bullets, AirmailRule, Hairline, stat_row, data_table, callout, logo, cover_page,
    PW, PH, MARGIN, W, PAPER, RULE, SLATE, SLATE_S,
)


# ── Cost model (USD; low, high) ─────────────────────────────────────────
# Every figure is a planning estimate from published pricing checked in October 2026.
# Ranges exist because prices differ by provider, region, and promo.

SETUPS = {
    "lean": {
        "Server (2 vCPU / 4GB, Hetzner-class)":  (5, 9),
        "Server backups":                         (1, 2),
        "Frontend hosting (Cloudflare Pages)":    (0, 0),
        "System email (Resend / Brevo free tier)":(0, 0),
        "Company inbox (Cloudflare forwarding)":  (0, 0),
        "Error tracking + uptime (free tiers)":   (0, 0),
        "SSL + DNS (Let's Encrypt, Cloudflare)":  (0, 0),
    },
    "recommended": {
        "Server (4 vCPU / 8GB Hetzner, or 2 vCPU / 4GB DigitalOcean)": (8, 24),
        "Server backups + off-server copy":       (2, 5),
        "Frontend hosting (Cloudflare Pages or same server)": (0, 0),
        "System email (Postmark Basic)":          (15, 15),
        "Company inbox (Google Workspace, 1 user)": (7, 9),
        "Error tracking + uptime (free tiers)":   (0, 0),
        "SSL + DNS (Let's Encrypt, Cloudflare)":  (0, 0),
    },
    "managed": {
        "API + worker (Render / Railway)":        (14, 50),
        "MongoDB Atlas (managed database)":       (10, 60),
        "Redis (managed, small plan)":            (5, 15),
        "Frontend hosting (Vercel Pro)":          (20, 20),
        "System email (Postmark Basic)":          (15, 15),
        "Company inbox (Google Workspace, 1 user)": (7, 9),
        "Error tracking + uptime (free tiers)":   (0, 0),
    },
}

ONE_TIME = {
    # name: (low, high) for year one
    "domain_new_com": (10, 12),
    "domain_new_io":  (35, 76),
    "legal_docs":     (0, 150),
}


def total(setup):
    lo = sum(v[0] for v in SETUPS[setup].values())
    hi = sum(v[1] for v in SETUPS[setup].values())
    return lo, hi


def money(lo, hi=None):
    if hi is None or lo == hi:
        return "Free" if lo == 0 else f"${lo:,}"
    return f"${lo:,} – ${hi:,}"


def year_one(setup, domain="domain_new_com"):
    lo, hi = total(setup)
    d, l = ONE_TIME[domain], ONE_TIME["legal_docs"]
    return lo * 12 + d[0] + l[0], hi * 12 + d[1] + l[1]


LEAN, REC, MAN = total("lean"), total("recommended"), total("managed")
Y_LEAN, Y_REC, Y_MAN = year_one("lean", "domain_new_com"), year_one("recommended"), year_one("managed")


# ── Page furniture ──────────────────────────────────────────────────────
def body_page(c, doc):
    c.saveState()
    c.setFillColor(PAPER)
    c.rect(0, 0, PW, PH, fill=1, stroke=0)
    logo(c, MARGIN, PH - 30, 10)
    c.setFillColor(SLATE)
    c.setFont("Helvetica-Bold", 7.4)
    c.drawString(MARGIN + 14, PH - 27, "CLIENTFLOW")
    c.setFont("Helvetica", 7.4)
    c.setFillColor(SLATE_S)
    c.drawRightString(PW - MARGIN, PH - 27, "Launch cost estimate")
    c.setStrokeColor(RULE)
    c.setLineWidth(0.6)
    c.line(MARGIN, PH - 36, PW - MARGIN, PH - 36)
    c.line(MARGIN, 30, PW - MARGIN, 30)
    c.setFont("Helvetica", 7.4)
    c.drawString(MARGIN, 21, "Prices checked October 2026. Confirm on each provider's own pricing page before paying.")
    c.drawRightString(PW - MARGIN, 21, str(doc.page - 1))
    c.restoreState()


def section(title):
    return [P(title, "h1"), AirmailRule(96, 4), Spacer(1, 12)]


def setup_rows(setup):
    rows = [[name, money(*v)] for name, v in SETUPS[setup].items()]
    rows.append(["Total per month", money(*total(setup))])
    return rows


# ── Document ────────────────────────────────────────────────────────────
def build(path):
    doc = BaseDocTemplate(path, pagesize=A4,
                          leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=MARGIN, bottomMargin=MARGIN,
                          title="ClientFlow — Launch Cost Estimate",
                          author="ClientFlow")
    cover_frame = Frame(MARGIN, MARGIN, W, PH - 2 * MARGIN, id="cover",
                        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    body_frame = Frame(MARGIN, MARGIN + 16, W, PH - 2 * MARGIN - 30, id="body",
                       leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=cover_page),
        PageTemplate(id="body", frames=[body_frame], onPage=body_page),
    ])

    s = []

    # ─── COVER ───
    s += [Spacer(1, 210)]
    s += [Paragraph("What it costs to<br/>put ClientFlow live.", S["coverT"])]
    s += [Spacer(1, 22), AirmailRule(150, 5), Spacer(1, 20)]
    s += [Paragraph(
        "Hosting, domain, email, payments, and everything else the backend needs to run, "
        "priced line by line, with three budget options and a timeline of when "
        "each cost actually starts.", S["coverS"])]
    s += [Spacer(1, 150)]
    s += [Paragraph("PREPARED", S["coverL"]),
          Paragraph('<font color="#FFFFFF" size="9">October 2026</font>', S["coverS"]),
          Spacer(1, 10),
          Paragraph("STATUS", S["coverL"]),
          Paragraph('<font color="#FFFFFF" size="9">Planning only. Nothing purchased yet.</font>', S["coverS"])]
    s += [NextPageTemplate("body"), PageBreak()]

    # ─── 1. SUMMARY ───
    s += section("The short answer")
    s += [P(
        f"Running ClientFlow costs roughly <b>{money(*REC)} a month</b> on the recommended "
        f"setup, or as little as <b>{money(*LEAN)} a month</b> if you use free tiers "
        "wherever possible. On top of that you pay once a year for a domain, and a percentage "
        "of every customer payment goes to the payment processor.", "lead")]
    s += [stat_row([
        ("Lean", f"{money(*LEAN)}", "per month. Cheapest workable setup, you manage the server"),
        ("Recommended", f"{money(*REC)}", "per month. Same server approach, paid email and inbox"),
        ("Managed", f"{money(*MAN)}", "per month. No server to look after, costs more"),
    ], W)]
    s += [Spacer(1, 10)]
    s += [data_table(
        ["", "Lean", "Recommended", "Managed"],
        [["Per month", money(*LEAN), money(*REC), money(*MAN)],
         ["One-time / yearly extras", "Domain + legal docs", "Domain + legal docs", "Domain + legal docs"],
         ["Year one, all in*", money(*Y_LEAN), money(*Y_REC), money(*Y_MAN)],
         ["Server work for you", "Yes — Linux, backups, updates", "Yes — same", "Very little"],
         ["Customers to cover it**", "1 Starter", "1 Growth", "1–3 Growth"]],
        [W * 0.28, W * 0.24, W * 0.24, W * 0.24], highlight=2)]
    s += [Spacer(1, 4)]
    s += [P(
        "* Year one includes 12 months of running costs, one year of domain, and privacy "
        "policy / terms, with the domain priced as sendclientflow.com. It excludes "
        "payment processing fees and the cost of building the backend.<br/>"
        "** Starter is $29/month, Growth $79/month, from the pricing page.", "small")]
    s += [Spacer(1, 8)]
    s += [callout(
        "The biggest cost is not hosting",
        "If you are hiring someone to build the backend, that bill will be larger than "
        "several years of hosting combined. Section 5 covers it. If you build it yourself with "
        "an AI coding assistant, the cost is mostly your time plus a subscription.",
        "route")]
    s += [Spacer(1, 8)]
    s += [callout(
        "Domain chosen: sendclientflow.com",
        "clientflow.com, clientflow.io and most variants are registered by others, so the "
        "product runs on sendclientflow.com while the company and brand stay ClientFlow. "
        "It was available when checked in October 2026 and costs about $10 a year at "
        "Cloudflare or Namecheap. Register it before anything else, because the Google "
        "verification, the system emails and the code all point at it.",
        "signal")]

    # ─── 2. ONE-TIME ───
    s += [PageBreak()]
    s += section("One-time and yearly costs")
    s += [P(
        "These are paid once before launch, or once a year. Most of the \"setup\" work for "
        "this product, such as Google and Microsoft app registration, is free; it costs "
        "time, not money.", "small")]
    s += [Spacer(1, 4)]
    s += [data_table(
        ["Item", "Cost", "Notes"],
        [["Domain: sendclientflow.com", "$10 – $12 / year",
          "Cloudflare sells at cost with no renewal markup. Turn on auto-renew so it never lapses."],
         ["Privacy policy + terms of service", "$0 – $150",
          "Required by Google before it will approve your app. A generator works to start; "
          "the Google policy must specifically describe how you use Gmail data."],
         ["Lawyer review of the above (optional)", "$300 – $1,500",
          "Worth it once paying customers arrive, given the product sends email on their behalf."],
         ["Google OAuth app verification", "Free",
          "For the gmail.send scope recommended in BACKEND_SPEC.md. Takes weeks, so start early."],
         ["Microsoft app / publisher verification", "Free",
          "Needs a free Microsoft Partner Network account and your verified domain."],
         ["SSL certificates", "Free", "Let's Encrypt, renewed automatically."],
         ["Stripe or Paystack account", "Free to open", "They charge per payment instead (section 4)."],
         ["Business registration", "Varies by country",
          "Payment processors need a registered business. See the note in section 4 about Stripe."]],
        [W * 0.30, W * 0.18, W * 0.52])]

    # ─── 3. MONTHLY ───
    s += [PageBreak()]
    s += section("Monthly running costs, line by line")
    s += [P(
        "All three setups run the same backend from BACKEND_SPEC.md: a Node API, a "
        "background worker that sends the email, MongoDB, and Redis. They differ in who "
        "looks after the machines.", "small")]

    for key, title, blurb in [
        ("lean", "Lean", "One small server holds everything. Free tiers for the rest. "
         "Good for building, testing, and the first handful of customers."),
        ("recommended", "Recommended", "Still one server, but with room to grow, a reliable "
         "paid service for password-reset and billing emails, and a proper support@ inbox. "
         "This is what the backend spec was written for."),
        ("managed", "Managed", "Each piece is rented from a company that runs it for you. "
         "No Linux, no manual backups. You pay for that convenience."),
    ]:
        rows = setup_rows(key)
        s += [KeepTogether([
            P(title, "h3"), P(blurb, "note"), Spacer(1, 3),
            data_table(["Item", "Per month"], rows, [W * 0.72, W * 0.28],
                       aligns=["l", "r"], highlight=len(rows) - 1),
        ])]
        s += [Spacer(1, 4)]

    s += [Spacer(1, 6)]
    s += [callout(
        "About the frontend hosting",
        "The repo has a vercel.json, so it was set up for Vercel. Vercel's free Hobby plan "
        "is for non-commercial use only; a paid SaaS needs Vercel Pro at $20/month per member. "
        "Cloudflare Pages is free for commercial sites, and the backend spec also shows how to "
        "serve the built frontend from the same server for $0. Either saves the $20.",
        "hold")]

    # ─── 4. GROWS WITH CUSTOMERS ───
    s += [PageBreak()]
    s += section("Costs that grow with customers")
    s += [P(
        "These are zero until you have customers, then scale with them. None of them should "
        "worry you: each one is a sign the business is working.", "small")]
    s += [Spacer(1, 4)]
    s += [data_table(
        ["Item", "How it is charged", "Example"],
        [["Stripe card payments", "2.9% + $0.30 per successful charge (US rate). "
          "+1.5% for international cards, +1% if currency conversion applies.",
          "A $79 Growth payment costs $2.59; you keep $76.41."],
         ["Paystack card payments", "Local Nigerian cards: 1.5% + NGN 100 (fee capped at NGN 2,000). "
          "International cards: 3.9% + NGN 100.",
          "Cheaper for local customers. Confirm current rates at paystack.com."],
         ["System email over the free/Basic quota", "Postmark Basic includes 10,000 emails; "
          "about $1.80 per extra 1,000.",
          "Only password resets, receipts and alerts go through this. Customer campaigns "
          "send from their own mailboxes, so they cost you nothing here."],
         ["Bigger server", "Upgrade when the server is busy.",
          "Roughly 100+ active customers: plan for $25 – $100 / month."],
         ["Google CASA security assessment", "Yearly, by a Google-approved assessor.",
          "Only if you later switch to reading Gmail via the API (gmail.readonly). Vendor "
          "estimates start around $540 – $1,000 / year for self-serve Tier 2 and go much "
          "higher. The spec's IMAP approach avoids this at launch."],
         ["More team inboxes", "Google Workspace, about $7 – $9 per person per month.",
          "When someone joins to help with support."]],
        [W * 0.24, W * 0.40, W * 0.36])]
    s += [Spacer(1, 10)]
    s += [callout(
        "Stripe and where your business is registered",
        "Stripe only accepts businesses registered in the countries it supports, and Nigeria "
        "is not one of them. If that applies to you, the options are Paystack (owned by "
        "Stripe, already planned for in the spec), or forming a US company through Stripe "
        "Atlas, which costs $500 once plus yearly US registered-agent, state and tax-filing "
        "costs. Paystack alone is the cheaper way to start.",
        "route")]

    # ─── 5. BACKEND BUILD ───
    s += [PageBreak()]
    s += section("Building the backend")
    s += [P(
        "Hosting is cheap. Building the thing you host is where the real money or time goes. "
        "BACKEND_SPEC.md describes a serious system: separate accounts per customer, Gmail "
        "and Outlook sign-in, a sending engine with daily limits and warm-up, reply detection, "
        "billing webhooks, and an admin panel. The business plan breaks it into ten stages.",
        "small")]
    s += [Spacer(1, 4)]
    s += [data_table(
        ["Route", "Rough cost", "What to know"],
        [["Build it yourself with an AI coding assistant",
          "$20 – $200 / month while building",
          "The spec was written to be pasted into one. You still need to understand what it "
          "writes, especially the security checklist in section 12 of the spec."],
         ["Freelance backend developer",
          "Typically $2,000 – $10,000+",
          "Depends heavily on country and experience. Get fixed-price quotes per stage, not "
          "one lump sum, and own the code and server accounts yourself."],
         ["Agency", "$10,000 – $40,000+",
          "Faster and more managed, rarely necessary at this stage."],
         ["Ongoing maintenance", "A few hours a month",
          "Security updates, fixing broken mailboxes, answering deliverability questions. "
          "If someone else does this, budget for a monthly retainer."]],
        [W * 0.30, W * 0.24, W * 0.46])]
    s += [Spacer(1, 10)]
    s += [callout(
        "These ranges are deliberately wide",
        "Developer rates vary more than any other number in this document. Treat the "
        "freelance and agency figures as a sense of scale, and replace them with real quotes "
        "once you share the spec with two or three developers.",
        "hold")]

    # ─── 6. TIMELINE ───
    s += [PageBreak()]
    s += section("When each cost starts")
    s += [P(
        "You do not need to pay for anything until the backend is being built. Here is the "
        "order, so money goes out only when it has to.", "small")]
    s += [Spacer(1, 4)]
    s += [data_table(
        ["Stage", "What to pay for", "Running total / month"],
        [["Now (planning)", "Register sendclientflow.com (about $10 for the year) so nobody "
          "else takes it. Nothing else yet.", "$0 + $10 once"],
         ["Backend build starts", "Develop locally, or on free MongoDB Atlas "
          "and Redis tiers. Create the Google Cloud and Microsoft app registrations (free). "
          "AI coding tool or developer, if used.", "$0 – $1 + build cost"],
         ["Working Gmail sign-in", "Put the landing page, privacy policy and terms live on the "
          "domain (Cloudflare Pages, free). Submit Google verification now; it takes weeks.",
          "$0 – $1"],
         ["Staging / testing", f"Rent the server and turn on backups. Run with DRY_RUN=true.",
          f"{money(*LEAN)}"],
         ["Launch", "Postmark, Google Workspace for support@, payment account live.",
          f"{money(*REC)}"],
         ["~100 customers", "Bigger server, possibly a second one for the worker.",
          "$60 – $150"]],
        [W * 0.20, W * 0.56, W * 0.24], highlight=4)]
    s += [Spacer(1, 12)]
    s += [P("Before you spend anything", "h3")]
    s += bullets([
        "Register sendclientflow.com, with auto-renew on.",
        "Check which payment processor can accept your business, based on where it is registered.",
        "Decide who builds the backend, and get quotes if it is not you.",
        "Choose Lean or Recommended hosting. You can start Lean and move up without rebuilding anything.",
        "Re-check the prices in this document on each provider's page. Several (Hetzner, "
        "Postmark, .io domains) changed in 2026.",
    ])

    s += [Spacer(1, 14), Hairline(W), Spacer(1, 10)]
    s += [P("Where these figures come from", "h3")]
    s += [P(
        "Published pricing and comparison pages checked in October 2026: Hetzner Cloud "
        "(prices changed in April and June 2026 for new orders), DigitalOcean, Postmark, "
        "Resend, Cloudflare Registrar and Pages, Vercel, MongoDB Atlas, Render, Google "
        "Workspace, Stripe, Paystack, and Google's OAuth verification documentation. Exchange "
        "rates, taxes such as VAT, and promotional discounts are not included. These are "
        "estimates for planning, not quotes.", "note")]

    doc.build(s)


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                       "ClientFlow-Launch-Costs.pdf")
    build(out)
    print("written:", out)
