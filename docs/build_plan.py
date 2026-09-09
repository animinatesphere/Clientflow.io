#!/usr/bin/env python3
"""Generates the ClientFlow business plan PDF using the product's own palette."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
    PageBreak, NextPageTemplate, Flowable,
)

# ── Palette (RGB tuples, converted below) ───────────────────────────────
def C(r, g, b):
    return colors.Color(r / 255, g / 255, b / 255)

INK    = C(14, 27, 42)
INK_S  = C(19, 38, 56)
PAPER  = C(244, 245, 242)
SUNK   = C(234, 235, 230)
RULE   = C(219, 221, 214)
SLATE  = C(90, 100, 114)
SLATE_S= C(138, 146, 157)
STAMP  = C(208, 52, 44)
STAMP_S= C(246, 228, 226)
ROUTE  = C(27, 75, 143)
ROUTE_S= C(226, 233, 244)
SIGNAL = C(31, 122, 92)
SIGNAL_S=C(224, 240, 234)
HOLD   = C(176, 114, 3)
HOLD_S = C(250, 239, 216)
WHITE  = colors.white

PW, PH = A4
MARGIN = 19 * mm

# ── Styles ──────────────────────────────────────────────────────────────
def st(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9.6, leading=15.2, textColor=INK,
                alignment=TA_LEFT, spaceAfter=0)
    base.update(kw)
    return ParagraphStyle(name, **base)

S = {
    "h1":     st("h1", fontName="Helvetica-Bold", fontSize=19, leading=23,
                 spaceBefore=0, spaceAfter=3),
    "h2":     st("h2", fontName="Helvetica-Bold", fontSize=12.6, leading=16,
                 spaceBefore=15, spaceAfter=5),
    "h3":     st("h3", fontName="Helvetica-Bold", fontSize=10, leading=13.5,
                 spaceBefore=10, spaceAfter=3),
    "body":   st("body", spaceAfter=7),
    "lead":   st("lead", fontSize=10.6, leading=17, textColor=SLATE, spaceAfter=9),
    "small":  st("small", fontSize=8.4, leading=12.6, textColor=SLATE, spaceAfter=5),
    "cap":    st("cap", fontName="Helvetica-Bold", fontSize=7.4, leading=10,
                 textColor=SLATE_S, spaceAfter=4),
    "bullet": st("bullet", spaceAfter=4, leftIndent=11, bulletIndent=1,
                 firstLineIndent=0),
    "th":     st("th", fontName="Helvetica-Bold", fontSize=8, leading=11, textColor=SLATE),
    "td":     st("td", fontSize=8.7, leading=12.4),
    "tdm":    st("tdm", fontSize=8.7, leading=12.4, textColor=SLATE),
    "note":   st("note", fontSize=8.6, leading=13.2, textColor=SLATE),
    "coverT": st("coverT", fontName="Helvetica-Bold", fontSize=34, leading=37,
                 textColor=WHITE, spaceAfter=0),
    "coverS": st("coverS", fontSize=12.4, leading=19, textColor=C(200, 208, 218)),
    "coverL": st("coverL", fontName="Helvetica-Bold", fontSize=7.6, leading=11,
                 textColor=C(120, 135, 152)),
}


def P(text, style="body"):
    return Paragraph(text, S[style])


def bullets(items, style="bullet"):
    return [Paragraph(t, S[style], bulletText="\u2013") for t in items]


# ── Custom flowables ────────────────────────────────────────────────────
class AirmailRule(Flowable):
    """The diagonal red/blue postal stripe used throughout the product."""
    def __init__(self, width, height=4.5):
        super().__init__()
        self.width, self.height = width, height

    def wrap(self, *a):
        return self.width, self.height

    def draw(self):
        c, h, seg = self.canv, self.height, 9.0
        x = 0
        i = 0
        while x < self.width:
            c.setFillColor(STAMP if i % 2 == 0 else ROUTE)
            p = c.beginPath()
            p.moveTo(x, 0)
            p.lineTo(x + seg * 0.55, 0)
            p.lineTo(min(x + seg, self.width), h)
            p.lineTo(min(x + seg * 0.45, self.width), h)
            p.close()
            c.drawPath(p, fill=1, stroke=0)
            x += seg * 0.55
            i += 1


class Hairline(Flowable):
    def __init__(self, width, color=RULE, thickness=0.6, pad=0):
        super().__init__()
        self.width, self.color, self.thickness, self.pad = width, color, thickness, pad

    def wrap(self, *a):
        return self.width, self.thickness + self.pad

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, self.pad, self.width, self.pad)


class MRRChart(Flowable):
    """Simple column chart of projected MRR."""
    def __init__(self, width, height, labels, values):
        super().__init__()
        self.width, self.height = width, height
        self.labels, self.values = labels, values

    def wrap(self, *a):
        return self.width, self.height

    def draw(self):
        c = self.canv
        pad_l, pad_b, pad_t = 34, 20, 10
        plot_w = self.width - pad_l - 6
        plot_h = self.height - pad_b - pad_t
        top = max(self.values) * 1.12

        # gridlines
        c.setFont("Helvetica", 6.6)
        for k in range(4):
            y = pad_b + plot_h * k / 3
            c.setStrokeColor(RULE)
            c.setLineWidth(0.5)
            c.line(pad_l, y, pad_l + plot_w, y)
            c.setFillColor(SLATE_S)
            c.drawRightString(pad_l - 5, y - 2.2, f"${int(top * k / 3 / 1000)}k")

        n = len(self.values)
        slot = plot_w / n
        bw = slot * 0.5
        for i, (lab, v) in enumerate(zip(self.labels, self.values)):
            x = pad_l + slot * i + (slot - bw) / 2
            h = plot_h * (v / top)
            c.setFillColor(INK if i < n - 1 else SIGNAL)
            c.rect(x, pad_b, bw, h, fill=1, stroke=0)
            c.setFillColor(SLATE)
            c.setFont("Helvetica", 6.6)
            c.drawCentredString(x + bw / 2, pad_b - 9, lab)
            c.setFillColor(INK)
            c.setFont("Helvetica-Bold", 6.8)
            c.drawCentredString(x + bw / 2, pad_b + h + 3, f"${v/1000:.1f}k")


def stat_row(items, width):
    """A row of label/number cells with hairline separators."""
    cells = []
    for label, value, note in items:
        cells.append([
            Paragraph(label.upper(), S["cap"]),
            Paragraph(f'<font size="15"><b>{value}</b></font>', S["body"]),
            Paragraph(note, S["small"]),
        ])
    data = [[Table([[c] for c in cell], style=[
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]) for cell in cells]]
    n = len(items)
    t = Table(data, colWidths=[width / n] * n)
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (0, -1), 9),
        ("LEFTPADDING", (1, 0), (-1, -1), 11),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("BACKGROUND", (0, 0), (-1, -1), WHITE),
        ("BOX", (0, 0), (-1, -1), 0.6, RULE),
        ("LINEAFTER", (0, 0), (-2, -1), 0.6, RULE),
    ]))
    return t


def data_table(header, rows, widths, aligns=None, highlight=None):
    data = [[Paragraph(h, S["th"]) for h in header]]
    for r in rows:
        data.append([Paragraph(str(x), S["td"] if i == 0 else S["tdm"])
                     for i, x in enumerate(r)])
    t = Table(data, colWidths=widths, repeatRows=1)
    style = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5.5),
        ("LINEBELOW", (0, 0), (-1, 0), 0.8, INK),
        ("LINEBELOW", (0, 1), (-1, -2), 0.4, RULE),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
    ]
    for i, col in enumerate(aligns or []):
        if col == "r":
            style.append(("ALIGN", (i, 0), (i, -1), "RIGHT"))
    if highlight is not None:
        style.append(("BACKGROUND", (0, highlight + 1), (-1, highlight + 1), SUNK))
    t.setStyle(TableStyle(style))
    return t


def callout(title, body, tone="hold"):
    fill = {"hold": HOLD_S, "stamp": STAMP_S, "route": ROUTE_S, "signal": SIGNAL_S}[tone]
    edge = {"hold": HOLD, "stamp": STAMP, "route": ROUTE, "signal": SIGNAL}[tone]
    inner = [Paragraph(f"<b>{title}</b>", S["td"]), Spacer(1, 3),
             Paragraph(body, S["note"])]
    t = Table([[inner]], colWidths=[PW - 2 * MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), fill),
        ("LINEBEFORE", (0, 0), (0, -1), 2.2, edge),
        ("LEFTPADDING", (0, 0), (-1, -1), 11),
        ("RIGHTPADDING", (0, 0), (-1, -1), 11),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return t


# ── Page furniture ──────────────────────────────────────────────────────
def logo(c, x, y, size=13, bg=None, fg=None):
    c.setFillColor(bg or INK)
    c.roundRect(x, y, size, size, size * 0.26, fill=1, stroke=0)
    c.setStrokeColor(fg or WHITE)
    c.setLineWidth(size * 0.11)
    c.setLineCap(1)
    p = c.beginPath()
    p.moveTo(x + size * 0.24, y + size * 0.63)
    p.lineTo(x + size * 0.50, y + size * 0.40)
    p.lineTo(x + size * 0.76, y + size * 0.63)
    c.drawPath(p, fill=0, stroke=1)
    # red motion line through the mark
    c.setStrokeColor(STAMP)
    c.setLineWidth(size * 0.10)
    c.line(x + size * 0.28, y + size * 0.29, x + size * 0.72, y + size * 0.29)


def cover_page(c, doc):
    c.saveState()
    c.setFillColor(INK)
    c.rect(0, 0, PW, PH, fill=1, stroke=0)
    # faint envelope grid
    c.setStrokeColor(INK_S)
    c.setLineWidth(0.5)
    for i in range(0, int(PW) + 40, 40):
        c.line(i, 0, i - PH, PH)
    # airmail band
    x, i = 0, 0
    while x < PW:
        c.setFillColor(STAMP if i % 2 == 0 else ROUTE)
        p = c.beginPath()
        p.moveTo(x, PH - 92)
        p.lineTo(x + 8.8, PH - 92)
        p.lineTo(x + 16, PH - 84)
        p.lineTo(x + 7.2, PH - 84)
        p.close()
        c.drawPath(p, fill=1, stroke=0)
        x += 8.8
        i += 1
    logo(c, MARGIN, PH - 66, 20, bg=WHITE, fg=INK)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(MARGIN + 27, PH - 62, "ClientFlow")
    c.restoreState()


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
    c.drawRightString(PW - MARGIN, PH - 27, "Business plan")
    c.setStrokeColor(RULE)
    c.setLineWidth(0.6)
    c.line(MARGIN, PH - 36, PW - MARGIN, PH - 36)
    c.line(MARGIN, 30, PW - MARGIN, 30)
    c.setFont("Helvetica", 7.4)
    c.setFillColor(SLATE_S)
    c.drawString(MARGIN, 21, "Figures marked as assumptions are planning inputs, not forecasts.")
    c.drawRightString(PW - MARGIN, 21, str(doc.page - 1))
    c.restoreState()


# ── Financial model (all inputs stated as assumptions) ──────────────────
PRICE = {"starter": 29, "growth": 79, "agency": 199}
MIX   = {"starter": 0.55, "growth": 0.33, "agency": 0.12}
ARPA  = sum(PRICE[k] * MIX[k] for k in PRICE)
CHURN = 0.06

NEW_PER_MONTH = [4, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47,
                 51, 55, 58, 61, 64, 67, 70, 73, 76, 79, 82, 85]


def project():
    rows, cust = [], 0.0
    for m, new in enumerate(NEW_PER_MONTH, start=1):
        churned = cust * CHURN
        cust = cust - churned + new
        rows.append({"m": m, "new": new, "churned": churned,
                     "cust": cust, "mrr": cust * ARPA})
    return rows


MODEL = project()
W = PW - 2 * MARGIN


# ── Document ────────────────────────────────────────────────────────────
def build(path):
    doc = BaseDocTemplate(path, pagesize=A4,
                          leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=MARGIN, bottomMargin=MARGIN,
                          title="ClientFlow — Business Plan",
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
    s += [Paragraph("Cold email that sends<br/>from your own mailboxes,<br/>at a pace they survive.", S["coverT"])]
    s += [Spacer(1, 22), AirmailRule(150, 5), Spacer(1, 20)]
    s += [Paragraph(
        "A business plan for ClientFlow: a subscription platform that lets small B2B "
        "teams and agencies run sequenced outbound email through mailboxes they already "
        "own, without burning the domains they depend on.", S["coverS"])]
    s += [Spacer(1, 130)]
    s += [Paragraph("PREPARED", S["coverL"]),
          Paragraph('<font color="#FFFFFF" size="9">September 2026</font>', S["coverS"]),
          Spacer(1, 10),
          Paragraph("STATUS", S["coverL"]),
          Paragraph('<font color="#FFFFFF" size="9">Pre-launch. Frontend built, backend specified.</font>', S["coverS"])]

    s += [NextPageTemplate("body"), PageBreak()]

    # ─── 1. SUMMARY ───
    s += [P("Executive summary", "h1"), AirmailRule(96, 4), Spacer(1, 12)]
    s += [P(
        "ClientFlow is a cold email platform sold by subscription. Customers connect the "
        "Gmail or Outlook mailboxes they already own, upload a contact list, write a short "
        "sequence, and let the system send it across those mailboxes inside a daily ceiling. "
        "Replies, bounces and opt-outs stop the sequence automatically.", "lead")]
    s += [P(
        "The product does not sell mailboxes, lead databases, or guaranteed inbox placement. "
        "It sells pacing and control: the mechanics that decide whether an outbound programme "
        "still works in month six. That focus is the position, and it is also the constraint — "
        "the plan below does not assume ClientFlow wins on feature count against larger, "
        "better-funded competitors, because it will not.")]
    s += [Spacer(1, 6)]
    s += [stat_row([
        ("Model", "SaaS", "Monthly and annual subscription"),
        ("Tiers", "3", "$29 / $79 / $199 per month"),
        ("Blended ARPA", f"${ARPA:.0f}", "At the assumed plan mix"),
        ("Break-even", "3\u20138", "Paying customers, at assumed costs"),
    ], W)]
    s += [Spacer(1, 12)]
    s += [callout(
        "How to read the numbers in this document",
        "Every financial figure here is derived from assumptions that are stated explicitly "
        "beside it. None of them is a forecast, and none is based on ClientFlow's own trading "
        "history, because there is none yet. Competitor prices are drawn from third-party "
        "reporting and are cited as such; they should be re-checked on each vendor's own "
        "pricing page before any decision rests on them.", "route")]

    s += [P("What is already built", "h2")]
    s += [P(
        "The complete frontend exists and runs: a marketing site, a customer workspace "
        "(campaign builder, contacts and CSV import, mailbox management with warm-up and "
        "capacity meters, a unified reply inbox, suppression list, analytics, billing), and "
        "a platform admin dashboard (revenue, accounts, subscriptions, campaign oversight, "
        "support queue, plan editor, audit log). It runs in demo mode against sample data, so "
        "it can be shown to a prospective customer or investor today.")]
    s += [P(
        "The backend is fully specified but not written. The specification covers multi-tenant "
        "data isolation, the send engine, OAuth, billing webhooks, compliance headers and VPS "
        "deployment. It is the next piece of work.")]

    s += [PageBreak()]

    # ─── 2. PROBLEM ───
    s += [P("The problem", "h1"), AirmailRule(96, 4), Spacer(1, 12)]
    s += [P(
        "Outbound email fails for mechanical reasons far more often than for creative ones. "
        "Three failures account for most of it, and all three are avoidable:", "lead")]
    s += [data_table(
        ["Failure", "What happens", "Consequence"],
        [["Sending too much, too early",
          "A domain that has never sent 20 emails sends 2,000 in a week.",
          "Providers filter the domain. Every subsequent email suffers, including invoices and support replies."],
         ["Following up after a reply",
          "The sequence sends step three to someone who already answered step one.",
          "The sender looks automated, which is the one thing cold email cannot look. The conversation dies."],
         ["Mailing an unverified list",
          "A quarter of addresses bounce because nobody cleaned the file.",
          "Bounce rate crosses the threshold where providers stop trusting the sender at all."]],
        [W * 0.22, W * 0.36, W * 0.42])]
    s += [Spacer(1, 10)]
    s += [P(
        "Existing tools can all technically prevent these. In practice their defaults favour "
        "volume, because volume is what demos well and what the pricing page counts. "
        "ClientFlow's defaults favour survival, and the product says so out loud — including "
        "on the marketing site, which tells prospective customers that the platform will "
        "deliberately slow them down in month one.")]

    s += [P("Who this is for", "h2")]
    s += [Paragraph(
        "<b>Founders and small B2B teams</b> selling a considered-purchase product, sending "
        "hundreds rather than hundreds of thousands of emails a month, whose company domain "
        "is also the domain their customers and investors email them on. The cost of burning "
        "it is not abstract to them.", S["body"])]
    s += [Paragraph(
        "<b>Small lead-generation and recruiting agencies</b> running outbound for a handful "
        "of clients, who need each client's mailboxes, lists and reporting kept separate but "
        "billed together.", S["body"])]
    s += [Spacer(1, 4)]
    s += [callout(
        "Who this is explicitly not for",
        "Teams sending scraped lists at six-figure monthly volume. They are the customers who "
        "generate complaints, damage shared sending reputation, consume support time, and "
        "churn when a cheaper tool appears. The bounce and complaint ceilings in the product "
        "are designed to make ClientFlow an uncomfortable place for them, and that is "
        "intentional rather than a limitation to be removed later.", "stamp")]

    s += [PageBreak()]

    # ─── 3. MARKET ───
    s += [P("Market and competition", "h1"), AirmailRule(96, 4), Spacer(1, 12)]
    s += [callout(
        "This is a crowded market, and the plan should not pretend otherwise",
        "Cold email sending is a mature category with several established, well-funded "
        "products competing largely on price and volume. A new entrant with the same feature "
        "set and no distribution has no reason to win. The strategy below therefore rests on "
        "segment focus and billing reach rather than on being a better sequencer.", "stamp")]
    s += [Spacer(1, 10)]
    s += [P("Reported competitor pricing", "h2")]
    s += [P(
        "The figures below come from third-party reviews and comparison sites published "
        "during 2026, not from the vendors' own pricing pages. Reported prices for the same "
        "plan differ noticeably between sources — partly because annual billing is often "
        "quoted as a monthly figure, and partly because these vendors change prices. Treat "
        "the column as a range, and verify before relying on it.", "small")]
    s += [Spacer(1, 4)]
    s += [data_table(
        ["Product", "Reported entry price", "Pricing basis", "Notable"],
        [["Instantly", "$30–$47 / month", "Email volume",
          "Unlimited mailboxes; lead database and CRM sold as separate subscriptions"],
         ["Smartlead", "$32.50–$39 / month", "Workspace + volume",
          "Unlimited mailboxes; deliverability testing and white-label are paid add-ons"],
         ["Saleshandy", "$25 / month", "Workspace",
          "Includes a lead finder; frequently cited as the lowest entry price"],
         ["lemlist", "$39–$79 / user / month", "Per seat",
          "Multichannel including LinkedIn steps; cost multiplies with team size"]],
        [W * 0.15, W * 0.21, W * 0.19, W * 0.45])]
    s += [Spacer(1, 8)]
    s += [P(
        "Two things follow. First, ClientFlow's proposed $29 entry price is competitive but "
        "not differentiating — it sits inside the existing band. Second, several competitors "
        "advertise unlimited mailboxes at the entry tier, so a mailbox-limited Starter plan "
        "will be compared unfavourably on a feature grid. That is a real objection and the "
        "answer has to be a reason to care about something other than the grid.")]

    s += [P("Where a new entrant can actually win", "h2")]
    s += [Paragraph(
        "<b>1. Local payment rails.</b> Most competitors bill through international card "
        "processors. Founders and agencies in Nigeria and comparable markets routinely have "
        "cards declined by them. A platform that bills in local currency through a local "
        "processor removes a purchase barrier that no amount of feature parity addresses. "
        "This is the single most defensible advantage available here, and it is available "
        "specifically because of where the business is based.", S["body"])]
    s += [Paragraph(
        "<b>2. A narrow first segment.</b> Winning \"cold email tools\" is not possible. "
        "Winning \"outbound for African B2B SaaS and agencies selling into Europe and North "
        "America\" is a smaller, reachable target where the founder has context competitors "
        "do not.", S["body"])]
    s += [Paragraph(
        "<b>3. Honesty as positioning.</b> The category markets volume. A product that leads "
        "with what it will not let you do is memorable in a way a feature list is not, and it "
        "self-selects for customers who churn less.", S["body"])]
    s += [Spacer(1, 6)]
    s += [P(
        "Market sizing has been left out of this plan on purpose. Any total-addressable-market "
        "figure available for this category would be an unverified number copied from a "
        "vendor's marketing page, and it would not change a single decision on the next page.",
        "note")]

    s += [PageBreak()]

    # ─── 4. REVENUE ───
    s += [P("How the business earns", "h1"), AirmailRule(96, 4), Spacer(1, 12)]
    s += [P(
        "Recurring subscription revenue is the whole model at launch. Everything else listed "
        "below is a later addition and none of it is assumed in the projection.", "lead")]

    s += [P("Primary: subscription tiers", "h2")]
    s += [data_table(
        ["Plan", "Monthly", "Yearly", "Mailboxes", "Contacts", "Emails / month", "Seats"],
        [["Starter", "$29", "$290", "2", "2,500", "6,000", "1"],
         ["Growth", "$79", "$790", "10", "25,000", "40,000", "3"],
         ["Agency", "$199", "$1,990", "50", "150,000", "250,000", "15"]],
        [W * 0.13, W * 0.12, W * 0.12, W * 0.14, W * 0.15, W * 0.21, W * 0.13],
        aligns=["l", "r", "r", "r", "r", "r", "r"])]
    s += [Spacer(1, 8)]
    s += [P(
        "Annual billing is priced at ten months for twelve. It is worth more than the "
        "discount costs: it converts a monthly churn decision into an annual one and moves "
        "cash forward, which matters more than margin when the business is small.")]
    s += [Paragraph(
        "<b>Why limits sit on volume and mailboxes rather than seats.</b> Seat pricing "
        "punishes the agency customers who are the most valuable segment here, and it is the "
        "specific complaint that drives teams away from per-user competitors. Volume pricing "
        "also aligns the bill with the cost to serve, since sending is where the "
        "infrastructure cost actually sits.", S["body"])]

    s += [P("Later revenue lines, not modelled", "h2")]
    s += [data_table(
        ["Line", "Mechanism", "Why it fits", "When"],
        [["Email verification credits", "Usage-based, resold at a margin",
           "Customers must clean lists anyway; doing it in-product removes a tool and reduces bounces the platform pays for", "After launch"],
         ["Done-for-you onboarding", "One-off fee, roughly $200–$500",
           "Domain, SPF, DKIM and DMARC setup is the hardest part of week one and the most common reason a trial fails", "Immediately"],
         ["White-label agency tier", "Higher monthly price",
           "Agencies pay for a client-facing dashboard in their own branding; competitors charge separately for this", "Month 6+"],
         ["Affiliate programme", "Revenue share on referrals",
           "The category's buyers are reached through operator newsletters and communities, not paid search", "Month 3+"]],
        [W * 0.20, W * 0.20, W * 0.45, W * 0.15])]
    s += [Spacer(1, 8)]
    s += [callout(
        "One revenue line deliberately excluded",
        "Selling a lead database is the obvious adjacent product and most competitors do it. "
        "It is excluded here because the data is expensive to license, its quality is the "
        "single most common complaint in reviews of the vendors who sell it, and lists bought "
        "in-product are exactly what drives the bounce rates the platform exists to prevent. "
        "Selling the disease and the cure at once is not a coherent position.", "hold")]

    s += [PageBreak()]

    # ─── 5. PROJECTION ───
    s += [P("Financial projection", "h1"), AirmailRule(96, 4), Spacer(1, 12)]
    s += [callout(
        "Assumptions, stated plainly",
        f"Plan mix of {int(MIX['starter']*100)}% Starter, {int(MIX['growth']*100)}% Growth and "
        f"{int(MIX['agency']*100)}% Agency, giving a blended ARPA of ${ARPA:.2f}. Monthly customer "
        f"churn of {int(CHURN*100)}%. New paying customers rising from 4 in month one to 85 in "
        "month twenty-four. Every one of these is a guess. The churn rate in particular is a "
        "planning input, not an observation — self-serve SMB tools in this category are widely "
        "reported to churn heavily, but no verified figure specific to cold email software was "
        "found, and none should be invented. Re-run this model against real numbers as soon as "
        "there are twenty paying customers.", "hold")]
    s += [Spacer(1, 12)]

    marks = [1, 3, 6, 9, 12, 18, 24]
    s += [MRRChart(W, 128, [f"M{m}" for m in marks],
                   [MODEL[m - 1]["mrr"] for m in marks])]
    s += [Spacer(1, 14)]

    rows = []
    for m in marks:
        r = MODEL[m - 1]
        rows.append([f"Month {m}", f"{r['new']}", f"{r['churned']:.1f}",
                     f"{r['cust']:.0f}", f"${r['mrr']:,.0f}", f"${r['mrr']*12:,.0f}"])
    s += [data_table(
        ["Period", "New", "Churned", "Customers", "MRR", "Run rate"],
        rows,
        [W * 0.17, W * 0.12, W * 0.14, W * 0.17, W * 0.20, W * 0.20],
        aligns=["l", "r", "r", "r", "r", "r"], highlight=4)]
    s += [Spacer(1, 8)]
    s += [P(
        "The shape matters more than the values. Churn compounds against acquisition: at 6% "
        "monthly, roughly half of each cohort is gone within a year, so the business is "
        "running to stand still long before the numbers look impressive. If the real churn "
        "figure turns out to be 3%, the month-24 MRR is materially higher for exactly the same "
        "sales effort. Reducing churn is worth more than any acquisition tactic in this model, "
        "which is the argument for the conservative-defaults positioning.", "note")]

    s += [PageBreak()]
    s += [P("Operating costs", "h1"), AirmailRule(96, 4), Spacer(1, 12)]
    s += [P(
        "Monthly, in the first year, at the volumes above. Infrastructure is genuinely cheap "
        "for this product because the send workload is spread deliberately rather than "
        "bursty.", "small")]
    s += [Spacer(1, 4)]
    s += [data_table(
        ["Item", "Estimate / month", "Basis"],
        [["VPS (4GB, 2 vCPU)", "$25 – $50",
          "Published pricing at mainstream providers; hosts the API, worker, MongoDB and Redis"],
         ["Backups, off-server", "$5 – $10", "Object storage for nightly dumps"],
         ["Domains and own mailboxes", "$20 – $40", "The company's own sending and support addresses"],
         ["Transactional email", "$0 – $15", "System notices; free tiers cover early volume"],
         ["Payment processing", "~3% of revenue", "Stripe's published US rate is 2.9% + $0.30 per successful card charge. Local-processor rates differ and must be confirmed directly."],
         ["Error tracking and uptime", "$0 – $30", "Free tiers are adequate below roughly 100 customers"],
         ["Total, fixed", "$50 – $145", "Excluding the founder's own time"]],
        [W * 0.24, W * 0.19, W * 0.57], highlight=6)]
    s += [Spacer(1, 8)]
    s += [P(
        f"At the assumed ${ARPA:.0f} blended ARPA, fixed costs are covered by roughly three to "
        "eight paying customers. The business is not capital-intensive. Its scarce resource is "
        "founder time, and the largest unbudgeted cost is support — deliverability questions "
        "are hard to answer briefly, and every one of them lands on the same person until "
        "there is documentation good enough to deflect them.")]

    s += [PageBreak()]

    # ─── 6. GTM ───
    s += [P("Getting the first customers", "h1"), AirmailRule(96, 4), Spacer(1, 12)]
    s += [P(
        "Paid acquisition is not viable here. The category's search terms are contested by "
        "companies with far larger budgets, and a $29 entry price cannot absorb that cost of "
        "acquisition. The route in is narrower and slower.", "lead")]
    s += [Spacer(1, 4)]
    s += [data_table(
        ["Phase", "What to do", "Target"],
        [["Months 1–2\nFirst ten",
          "Hand-recruit ten customers from the founder's own network and from communities where the segment already gathers. Onboard each one personally, including their DNS setup. Watch them use it. The goal is evidence and testimonials, not revenue.",
          "10 paying"],
         ["Months 3–6\nProof",
          "Publish what the onboarding taught: domain warm-up, SPF/DKIM/DMARC, why a list bounces. Deliverability content is durable, ranks over time, and attracts exactly the buyer this product wants. Launch the affiliate programme.",
          "40 paying"],
         ["Months 7–12\nRepeatable",
          "Partner with small lead-generation agencies who resell under the white-label tier. One agency relationship is worth more than a dozen self-serve signups and churns far less.",
          "150 paying"]],
        [W * 0.16, W * 0.66, W * 0.18])]
    s += [Spacer(1, 10)]
    s += [P(
        "The trial is fourteen days without a card. That is a deliberate cost: it fills the "
        "funnel with people who will never pay. It is accepted because the product's value "
        "only becomes visible after a sequence has run for a week, and a card wall in front of "
        "that converts worse than the wasted trials cost.", "note")]

    s += [P("What has to be true for this to work", "h2")]
    s += [P(
        "Stated so they can be checked, rather than assumed quietly:", "small")]
    s += (bullets([
        "Google approves the OAuth application. Without it, nothing ships.",
        "Ten people in the founder's reachable network will pay $29 a month for this. If that is hard, the positioning is wrong, and it is better to learn that in month one than month nine.",
        "Monthly churn settles below 8%. Above that, acquisition never outruns it at this price point.",
        "Support stays under roughly one hour per customer per month. Above that, the unit economics stop working long before the infrastructure does.",
        "Local-currency billing genuinely converts customers who would otherwise not buy. If it does not, the main differentiator is gone and the plan needs rewriting.",
    ]))

    s += [PageBreak()]

    # ─── 6b. FEATURE LEVERAGE ───
    s += [P("Features worth building, in order of leverage", "h1"),
          AirmailRule(96, 4), Spacer(1, 12)]
    s += [P(
        "Ranked by how much each one moves either acquisition or retention, not by how "
        "interesting it is to build. The first three are worth more than the rest combined, "
        "and the first two directly reduce the bounce rates the platform is otherwise "
        "penalised for.", "lead")]
    s += [Spacer(1, 2)]
    s += [data_table(
        ["Feature", "What it does", "Why it earns its place"],
        [["Built-in email verification",
          "Checks addresses at import: syntax, domain, mailbox existence. Rejects or quarantines the bad ones before they can be mailed.",
          "Bounces are the single largest cause of a campaign failing, and the platform is what gets blamed. Sold as usage credits, it is also a margin line rather than a cost."],
         ["Domain and DNS setup wizard",
          "Checks SPF, DKIM, DMARC and MX for the sending domain and tells the customer exactly what record to add and where.",
          "This is where most trials die. Removing it converts trials that would otherwise churn silently in week one, and it deflects the support questions that consume the most founder time."],
         ["Inbox placement testing",
          "Sends to a set of seed mailboxes across providers and reports where the message landed.",
          "Turns deliverability from a feeling into a number. Competitors charge for this separately; including it at the Growth tier is a concrete reason to upgrade."],
         ["Warm-up network",
          "Connected mailboxes send and reply to each other on a schedule to build sending history on a new domain.",
          "Widely expected in the category and frequently listed first in competitor marketing. Its absence will be noticed on any feature comparison."],
         ["AI copy assistance",
          "Drafts sequence steps and suggests merge fields from the product description and the target persona.",
          "Not a differentiator any more, but its absence reads as dated. Cheap to add over an existing model API."],
         ["CRM integrations",
          "Pushes replies and campaign activity into HubSpot, Pipedrive or a webhook.",
          "The most common reason a team outgrows a standalone sequencer. An integration is far cheaper to build than a CRM and removes the exit reason."],
         ["White-label agency portal",
          "Client-facing dashboards under the agency\u2019s own domain and branding.",
          "The clearest upgrade trigger for the highest-value, lowest-churn segment, and directly monetisable as a tier."],
         ["LinkedIn as a sequence step",
          "A manual task step that pauses the sequence until the user confirms a connection request or message.",
          "Multichannel without automating a platform that bans automation. Low risk, and it closes the gap against per-seat multichannel competitors."],
         ["Shared inbox with assignment",
          "Replies routed to a teammate, with status and internal notes.",
          "Turns a single-user tool into one a team standardises on, which raises the switching cost."]],
        [W * 0.20, W * 0.38, W * 0.42])]
    s += [Spacer(1, 10)]
    s += [callout(
        "What not to build",
        "A lead database, an AI agent that sends without review, and anything that raises the "
        "sending ceiling. All three are visible in competitors\u2019 marketing and all three "
        "attract the customer segment this product is specifically designed to repel. Adding "
        "them would not be an expansion of the plan; it would be a reversal of it.", "stamp")]

    s += [PageBreak()]

    # ─── 7. RISKS ───
    s += [P("Risks", "h1"), AirmailRule(96, 4), Spacer(1, 12)]
    s += [P(
        "In rough order of how likely each is to end the business.", "lead")]
    s += [Spacer(1, 2)]
    s += [data_table(
        ["Risk", "Why it matters", "What reduces it"],
        [["Platform dependency on Google and Microsoft",
          "The entire product runs on OAuth access those two companies grant and can withdraw. Verification is required before launch and takes weeks. Scope policy has tightened before and can again.",
          "Request only the minimum scope needed to send. Build reply detection behind an interface so IMAP can substitute for the Gmail API. Start verification the day OAuth works, not the week before launch. Support plain SMTP as an escape hatch."],
         ["Reputation damage from one bad customer",
          "Cold email platforms attract senders who ruin shared sending reputation for everyone else on it.",
          "Automatic pausing at bounce and complaint ceilings, enforced platform-wide and not switchable off by the customer. An oversight queue reviewed daily from day one, not added later."],
         ["Commoditisation and price pressure",
          "Established competitors compete on price and volume, and several already advertise unlimited mailboxes at the entry tier.",
          "Do not compete on the feature grid. Hold the segment focus and the billing advantage. Accept a smaller market."],
         ["Legal exposure on the customer's behalf",
          "Cold email is regulated differently in every market. GDPR requires a lawful basis for processing; other jurisdictions have their own rules, including Nigeria's data protection regime.",
          "Get the terms and privacy policy reviewed by a lawyer before the first payment — the versions in the repository are placeholders and say so. Enforce unsubscribe handling in the product rather than in the terms."],
         ["Single-founder concentration",
          "One person holds all product, support and infrastructure knowledge. Illness or burnout stops everything.",
          "Document the deployment. Automate backups and test a restore. Keep the stack boring enough that a contractor could pick it up."],
         ["Churn higher than modelled",
          "The projection is sensitive to this above all other inputs.",
          "Measure it from the first cohort. Interview everyone who cancels. Treat month-two retention as the primary metric, ahead of signups."]],
        [W * 0.21, W * 0.36, W * 0.43])]

    s += [PageBreak()]

    # ─── 8. ROADMAP ───
    s += [P("Build sequence", "h1"), AirmailRule(96, 4), Spacer(1, 12)]
    s += [P(
        "Ordered so that something is demonstrable at every stage, and so the slowest external "
        "dependency starts as early as possible.", "lead")]
    s += [Spacer(1, 2)]
    s += [data_table(
        ["Stage", "Work", "Done when"],
        [["1", "Express API, MongoDB, models, authentication, the organisation/user split",
          "Two organisations cannot see each other's data, proven by an automated test"],
         ["2", "Contacts: CRUD and CSV import with column mapping and a rejection report",
          "A messy real-world CSV imports cleanly and reports what it dropped"],
         ["3", "Google OAuth, token encryption, mailbox management. Submit for verification now.",
          "A mailbox connects and its tokens are unreadable in the database"],
         ["4", "Campaigns and the send engine, running in dry-run mode",
          "Pacing, rotation and the send window behave correctly in the logs, with nothing sent"],
         ["5", "Live sending to the founder's own addresses, ten at a time",
          "Threading, merge fields and stop-on-reply all work end to end"],
         ["6", "Suppression, unsubscribe, and the required List-Unsubscribe headers",
          "One-click unsubscribe stops every campaign for that address"],
         ["7", "Reply detection over IMAP",
          "A reply cancels the remaining steps within one send cycle"],
         ["8", "Billing: checkout, customer portal, idempotent webhooks",
          "Replaying the same webhook event twice changes nothing"],
         ["9", "Admin: metrics, oversight, audit log",
          "A campaign over the bounce ceiling appears in the queue automatically"],
         ["10", "Microsoft Graph, then the white-label tier",
          "Outlook mailboxes send alongside Gmail ones in the same campaign"]],
        [W * 0.10, W * 0.44, W * 0.46])]
    s += [Spacer(1, 12)]
    s += [callout(
        "The dependency that decides the launch date",
        "Google's verification review for the sending scope runs on Google's timetable, not "
        "the build's. It is the only item here that cannot be accelerated by working harder, "
        "which is why it belongs at stage three rather than stage ten. Reply detection over "
        "IMAP exists in this plan specifically to avoid the restricted-scope review, which "
        "additionally requires an annual third-party security assessment. Confirm the current "
        "requirements and costs with Google's own documentation before budgeting for them.",
        "route")]

    s += [Spacer(1, 18), Hairline(W), Spacer(1, 10)]
    s += [P("A closing note on this document", "h3")]
    s += [P(
        "Nothing here is a projection in the sense a bank would use the word. There is no "
        "trading history to project from. What this document does is state the assumptions "
        "clearly enough that they can be tested and replaced, name the risks that are most "
        "likely to end the business, and set out what has to be true for the model to hold. "
        "The numbers will be wrong. The point is that when they turn out to be wrong, it will "
        "be obvious which assumption failed.", "note")]

    doc.build(s)


if __name__ == "__main__":
    import os
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                       "ClientFlow-Business-Plan.pdf")
    build(out)
    print("written:", out)
