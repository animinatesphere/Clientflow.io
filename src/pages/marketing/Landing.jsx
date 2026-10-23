import { Fragment, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Inbox,
  GitBranch,
  ShieldCheck,
  Gauge,
  Users,
  FileSpreadsheet,
  Plus,
  Minus,
  Rocket,
  Building2,
  UsersRound,
  Check,
  X,
  PlayCircle,
  MessageSquareReply,
  ShieldAlert,
  Flame,
} from "lucide-react";
import SendConsole from "../../components/marketing/SendConsole";
import ContactJourney from "../../components/marketing/ContactJourney";
import ProductFilm from "../../components/marketing/ProductFilm";
import { Button, AirmailRule, Card, Badge } from "../../components/ui";
import { useEntrance, useCountUp } from "../../lib/hooks";
import { useAuth } from "../../lib/auth";
import { PLANS } from "../../lib/mock";
import { money } from "../../lib/format";

// /* ── Content ──────────────────────────────────────────────────────────── */

const HEADLINE = "Cold email that sends from your own mailboxes, at a pace they survive.";

const HERO_NOTICES = [
  {
    icon: MessageSquareReply,
    title: "Priya replied",
    sub: "Sequence stopped automatically",
    tint: "bg-route-soft text-route",
    pos: "-left-10 -bottom-20",
    delay: 2600,
  },
  {
    icon: ShieldAlert,
    title: "Bounce added to suppression",
    sub: "Never emailed again",
    tint: "bg-stamp-soft text-stamp",
    pos: "right-10 -top-12",
    delay: 3400,
  },
  {
    icon: Flame,
    title: "Warm-up day 12",
    sub: "Daily ceiling raised to 24",
    tint: "bg-hold-soft text-hold",
    pos: "-right-8 -bottom-20",
    delay: 4200,
  },
];

const WORKS_WITH = [
  "Gmail",
  "Google Workspace",
  "Outlook",
  "Microsoft 365",
  "CSV from any CRM",
  "HubSpot export",
  "Pipedrive export",
  "Google Sheets",
];

/* Words wrapped in *asterisks* are tinted. Each word lights up with scroll. */
const STATEMENT =
  "Every email leaves a *real* *mailbox,* at a *human* *pace,* and stops the moment a *human* *answers.*";

const FAILURES = [
  {
    when: "Week one",
    what: "You send 2,000 emails from a domain that has never sent 20.",
    then: "The domain gets filtered. Every email after that lands in spam, including the ones from your accounts team.",
  },
  {
    when: "Week two",
    what: "Someone replies, and the sequence sends them step three anyway.",
    then: "You look automated, which is the one thing cold email cannot look. The conversation dies.",
  },
  {
    when: "Week three",
    what: "A quarter of the list bounces because nobody verified it.",
    then: "Bounce rate crosses the line where providers stop trusting you. The next campaign never had a chance.",
  },
];

const STEPS = [
  {
    title: "Connect the mailboxes you already own",
    body: "Sign in with Google or Microsoft. ClientFlow sends through your real account, so the email arrives with your address on it, not a shared sending service.",
  },
  {
    title: "Bring your list",
    body: "Upload a CSV and map the columns. Duplicates collapse, malformed addresses are rejected, and anyone on your suppression list is filtered out before they can be added.",
  },
  {
    title: "Write the sequence",
    body: "Up to any number of steps, each with its own wait. Merge fields pull in first name, company and anything else in your file. Preview against a real contact before you commit.",
  },
  {
    title: "Launch and leave it",
    body: "Sends are spread across your mailboxes inside a daily ceiling you set. Replies, bounces and opt-outs stop the sequence for that person automatically.",
  },
];

const CAPABILITIES = [
  {
    icon: Gauge,
    title: "Pacing and rotation",
    body: "Set a daily ceiling per mailbox. ClientFlow rotates across them, spaces each send, and holds the queue when a mailbox is full rather than pushing past the limit.",
    wide: true,
  },
  {
    icon: GitBranch,
    title: "Sequences with real stops",
    body: "A reply, a bounce, or an opt-out cancels every remaining step for that contact — across every campaign they are in, not just the one that reached them.",
    wide: true,
  },
  { icon: Inbox, title: "One reply inbox", body: "Every response from every mailbox in one thread list, sorted by whether it needs an answer." },
  { icon: ShieldCheck, title: "Suppression that holds", body: "Unsubscribes, bounces and complaints go to a workspace-wide list that is checked on every single send." },
  { icon: FileSpreadsheet, title: "Import you can trust", body: "Column mapping, duplicate collapse, syntax validation, and a report of exactly what was rejected and why." },
  { icon: Users, title: "Client workspaces", body: "Agencies keep each client's mailboxes, lists and reporting separate, under one bill." },
];

const AUDIENCES = [
  {
    icon: Rocket,
    who: "Founders doing their own sales",
    body: "You are the sales team. Write the sequence once, connect your inbox, and get back to the product while the follow-ups take care of themselves.",
    plan: "Most start on Starter",
  },
  {
    icon: UsersRound,
    who: "Small sales teams",
    body: "Several people, several mailboxes, one list. Sends are shared across everyone's inbox and every reply lands in one place, so nobody answers the same lead twice.",
    plan: "Most choose Growth",
  },
  {
    icon: Building2,
    who: "Agencies running outbound for clients",
    body: "A separate workspace per client, with its own mailboxes, contacts and suppression list. Reports go out under your name, not ours.",
    plan: "Built into Agency",
  },
];

const COMPARISON = [
  ["Who the email comes from", "A shared pool, or a domain bought last week", "Your own Gmail or Outlook mailbox"],
  ["When someone replies", "The next step may still go out", "Every remaining step cancels, in every campaign"],
  ["Daily volume", "Whatever you upload, as fast as it goes", "A ceiling per mailbox that rises slowly during warm-up"],
  ["Bounces and complaints", "Noticed once the domain is already burned", "The campaign pauses itself above the ceiling"],
  ["Opt-outs", "Tracked per list, easy to re-import by mistake", "One workspace-wide list, checked on every send"],
];

const FAQS = [
  {
    q: "Does this send from your servers or mine?",
    a: "From your mailbox. You authorise ClientFlow through Google or Microsoft, and each email is sent through your own account using their API. The recipient sees your address and your signature. Nothing is relayed through a shared pool.",
  },
  {
    q: "How many emails a day can I actually send?",
    a: "That is set by your provider, not by us. Consumer Gmail and Workspace accounts have their own daily ceilings, and a new domain should start far below whatever that ceiling is. ClientFlow lets you set a per-mailbox limit and holds the queue when it is reached. Check your provider's current published limits before you plan volume.",
  },
  {
    q: "Will this keep me out of spam?",
    a: "No tool can promise that, and you should be suspicious of one that does. Deliverability comes from your domain authentication, your list quality, your sending history and what you write. ClientFlow helps with pacing, suppression and bounce handling — the parts that are mechanical. The rest is on you.",
  },
  {
    q: "Is cold email legal?",
    a: "It depends on where your recipients are. The rules differ across jurisdictions, and some require prior consent for marketing email while others allow it with an opt-out. We are not lawyers and this is not legal advice — check the rules that apply to the people you are contacting before you send.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "Your contacts and campaign history are exportable at any time as CSV. Cancel and the account moves to read-only for 30 days so you can export, then the data is deleted along with the OAuth tokens for every connected mailbox.",
  },
  {
    q: "Can I run this for clients?",
    a: "Yes, on the Agency plan. Each client gets a separate workspace with its own mailboxes, contacts and suppression list, and reports can carry your branding rather than ours.",
  },
];

const H2 = "text-[clamp(1.7rem,3.2vw,2.3rem)] font-semibold leading-tight";

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function Landing() {
  const scope = useEntrance();
  const navigate = useNavigate();
  const { demoSignIn } = useAuth();
  const [openFaq, setOpenFaq] = useState(0);

  const openDemo = () => {
    demoSignIn("user");
    navigate("/app");
  };

  return (
    <div ref={scope} className="overflow-x-clip">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-shell px-5 pb-8 pt-12 sm:px-8 sm:pt-20">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          <div className="lg:pt-4">
            <p data-enter className="mb-5 inline-flex items-center gap-2 rounded-full border border-rule bg-paper-card px-3 py-1 text-[12.5px] text-slate">
              <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulseDot" />
              Gmail and Outlook, sending from your own address
            </p>

            <h1
              aria-label={HEADLINE}
              className="max-w-[13ch] text-[clamp(2.1rem,3.5vw,3rem)] font-bold leading-[1.06]"
              style={{ fontVariationSettings: '"wdth" 88' }}
            >
              {HEADLINE.split(" ").map((w, i) => (
                <Fragment key={i}>
                  <span aria-hidden className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
                    <span data-word className="inline-block will-change-transform">
                      {w}
                    </span>
                  </span>{" "}
                </Fragment>
              ))}
            </h1>

            <p data-enter className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-slate">
              Connect Gmail or Outlook, load your list, and let ClientFlow spread the sequence
              across your inboxes — stopping the moment someone replies, bounces or opts out.
            </p>

            <div data-enter className="mt-8 flex flex-wrap gap-3">
              <Button as={Link} to="/signup" size="lg">
                Start 14-day trial
              </Button>
              <Button variant="secondary" size="lg" onClick={openDemo}>
                Open the demo workspace
              </Button>
            </div>

            <p data-enter className="mt-4 text-[13.5px] text-slate-soft">
              No card for the trial. The demo workspace is filled with sample data and sends
              nothing.
            </p>

            <a
              data-enter
              href="#tour"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("tour")?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className="group mt-7 inline-flex items-center gap-3 text-[14.5px] font-medium text-ink"
            >
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-stamp text-white">
                <span className="absolute inset-0 animate-ping rounded-full bg-stamp/40" />
                <PlayCircle size={20} className="relative" />
              </span>
              <span className="underline-offset-4 group-hover:underline">Watch the 30-second tour</span>
            </a>
          </div>

          <div data-parallax="40" className="relative isolate">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-10 -inset-y-12 -z-10 bg-[radial-gradient(closest-side,rgba(27,75,143,0.22),transparent)] blur-2xl"
            />
            <div data-tilt className="relative">
              <SendConsole />
              <p className="mt-3 text-[13px] text-slate-soft">
                A live depiction of the send queue. Two contacts drop out mid-sequence — one
                replied, one opted out.
              </p>

              {/* floating notices — the three things the product does for you */}
              {HERO_NOTICES.map((n) => (
                <div
                  key={n.title}
                  aria-hidden
                  className={`film-pop pointer-events-none absolute z-10 hidden xl:block ${n.pos}`}
                  style={{ animationDelay: `${n.delay}ms` }}
                >
                  <div
                    className="float-y flex items-center gap-2.5 rounded-xl border border-rule bg-white/95 px-3.5 py-2.5 shadow-panel backdrop-blur"
                    style={{ animationDelay: `${n.delay / 2}ms` }}
                  >
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full ${n.tint}`}>
                      <n.icon size={14} />
                    </span>
                    <span>
                      <span className="block text-[12.5px] font-semibold text-ink">{n.title}</span>
                      <span className="block text-[11.5px] text-slate">{n.sub}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Works with ───────────────────────────────────────────────── */}
      <section data-enter className="mx-auto mt-14 max-w-shell px-5 sm:px-8">
        <p className="text-center text-[12.5px] font-medium uppercase tracking-[0.14em] text-slate-soft">
          Sends through the accounts you already have
        </p>
        <div className="group relative mt-5 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
          <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
            {[0, 1].map((copy) => (
              <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center">
                {WORKS_WITH.map((name) => (
                  <li key={name} className="flex items-center gap-10 pr-10 font-display text-[19px] font-semibold text-ink/40">
                    {name}
                    <span className="h-1.5 w-1.5 rounded-full bg-stamp/50" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product tour, played like a video ────────────────────────── */}
      <section id="tour" className="relative mx-auto mt-24 max-w-shell scroll-mt-24 px-5 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-24 -z-10 mx-auto h-[420px] max-w-[900px] rounded-full bg-[radial-gradient(closest-side,rgba(208,52,44,0.10),transparent)] blur-2xl"
        />
        <div className="mx-auto max-w-[60ch] text-center">
          <p data-enter className="text-[13px] font-medium uppercase tracking-[0.14em] text-stamp">
            The 30-second tour
          </p>
          <h2 data-enter className={`${H2} mt-3`}>
            From an empty account to a booked call
          </h2>
          <p data-enter className="mt-4 text-[16px] leading-relaxed text-slate">
            Five moments, start to finish. Click any chapter to jump to it.
          </p>
        </div>
        <div data-enter className="mx-auto mt-10 max-w-[980px]">
          <ProductFilm />
        </div>
      </section>

      {/* ── The failure ledger ───────────────────────────────────────── */}
      <section className="mx-auto mt-24 max-w-shell px-5 sm:px-8">
        <div className="max-w-prose">
          <h2 data-enter className={H2}>
            Most outbound does not fail on the writing.
          </h2>
          <p data-enter className="mt-4 text-[16px] leading-relaxed text-slate">
            It fails on the mechanics — sending too much too early, following up after someone
            already answered, and mailing a list nobody checked. Those three are fixable.
          </p>
        </div>

        <ol className="mt-10 border-t border-rule">
          {FAILURES.map((f) => (
            <li
              key={f.when}
              data-enter
              className="group grid gap-x-8 gap-y-2 border-b border-rule py-6 transition-colors hover:bg-stamp-soft/40 sm:grid-cols-[140px_1fr_1fr]"
            >
              <p className="text-[14px] font-medium text-stamp">{f.when}</p>
              <p className="text-[15.5px] font-medium leading-snug text-ink">{f.what}</p>
              <p className="text-[14.5px] leading-relaxed text-slate">{f.then}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Statement, lit word by word on scroll ────────────────────── */}
      <section className="mx-auto mt-28 max-w-shell px-5 sm:px-8">
        <p
          data-scrub-words
          className="mx-auto max-w-[22ch] text-center font-display text-[clamp(1.9rem,4.6vw,3.6rem)] font-semibold leading-[1.12] text-ink"
          style={{ fontVariationSettings: '"wdth" 90', letterSpacing: "-0.02em" }}
        >
          {STATEMENT.split(" ").map((w, i) => {
            const accent = w.startsWith("*");
            return (
              <span key={i} data-sw className={accent ? "text-stamp" : ""}>
                {w.replace(/\*/g, "")}{" "}
              </span>
            );
          })}
        </p>
      </section>

      {/* ── The four steps (a genuine sequence) ──────────────────────── */}
      <section className="mx-auto mt-28 max-w-shell px-5 sm:px-8">
        <h2 data-enter className={H2}>
          Four steps from a spreadsheet to a reply
        </h2>

        <div className="mt-10 grid gap-px overflow-hidden rounded-card border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.title} data-enter className="group bg-paper-card p-6 transition-colors hover:bg-paper">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stamp/30 font-display text-[13px] font-semibold text-stamp tnum transition-colors group-hover:bg-stamp group-hover:text-white">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-[16px] font-semibold leading-snug">{s.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-slate">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── One contact's journey (pinned, scroll-driven) ────────────── */}
      <ContactJourney />

      {/* ── Capabilities ─────────────────────────────────────────────── */}
      <section className="mx-auto mt-24 max-w-shell px-5 sm:px-8">
        <div className="max-w-prose">
          <h2 data-enter className={H2}>
            What is in the box
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((c) => (
            <Card
              key={c.title}
              data-enter
              className={`group p-6 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-ink/25 hover:shadow-lift ${
                c.wide ? "lg:col-span-2" : ""
              }`}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-route-soft text-route transition-transform duration-300 group-hover:scale-110">
                <c.icon size={19} />
              </span>
              <h3 className={`mt-4 font-semibold ${c.wide ? "text-[18px]" : "text-[15.5px]"}`}>
                {c.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-slate">{c.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Who it is for ────────────────────────────────────────────── */}
      <section className="mx-auto mt-24 max-w-shell px-5 sm:px-8">
        <h2 data-enter className={H2}>
          Who it is for
        </h2>
        <p data-enter className="mt-4 max-w-prose text-[16px] leading-relaxed text-slate">
          People who need replies from strangers and cannot afford to lose the domain they do
          business on.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {AUDIENCES.map((a) => (
            <Card
              key={a.who}
              data-enter
              className="group relative flex flex-col overflow-hidden p-7 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-stamp transition-transform duration-500 group-hover:scale-x-100"
              />
              <a.icon size={22} className="text-stamp" />
              <h3 className="mt-5 text-[18px] font-semibold leading-snug">{a.who}</h3>
              <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-slate">{a.body}</p>
              <p className="mt-6 text-[13px] font-medium text-route">{a.plan}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Comparison ───────────────────────────────────────────────── */}
      <section className="mx-auto mt-24 max-w-shell px-5 sm:px-8">
        <h2 data-enter className={`${H2} max-w-[24ch]`}>
          The difference between sending email and getting replies
        </h2>

        <div data-enter className="mt-10 overflow-hidden rounded-card border border-rule bg-paper-card">
          <div className="hidden grid-cols-[1fr_1.2fr_1.2fr] border-b border-rule bg-paper text-[13px] font-semibold text-slate md:grid">
            <p className="px-6 py-3.5" />
            <p className="px-6 py-3.5">Blasting from a bulk tool</p>
            <p className="px-6 py-3.5 text-ink">With ClientFlow</p>
          </div>
          {COMPARISON.map(([row, them, us]) => (
            <div
              key={row}
              className="grid gap-2 border-b border-rule px-6 py-5 last:border-b-0 md:grid-cols-[1fr_1.2fr_1.2fr] md:gap-0 md:px-0 md:py-0"
            >
              <p className="text-[14.5px] font-medium text-ink md:px-6 md:py-4">{row}</p>
              <p className="flex gap-2.5 text-[14px] text-slate md:px-6 md:py-4">
                <X size={16} className="mt-0.5 shrink-0 text-stamp" />
                {them}
              </p>
              <p className="flex gap-2.5 text-[14px] text-ink md:bg-signal-soft/40 md:px-6 md:py-4">
                <Check size={16} className="mt-0.5 shrink-0 text-signal" />
                {us}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Deliverability stance ────────────────────────────────────── */}
      <DeliverabilityBand />

      {/* ── Pricing preview ──────────────────────────────────────────── */}
      <section className="mx-auto mt-24 max-w-shell px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 data-enter className={H2}>
            Priced on volume, not seats
          </h2>
          <Link data-enter to="/pricing" className="text-[14.5px] text-route underline underline-offset-4">
            Full comparison
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <Card
              key={p.id}
              data-enter
              className={`flex flex-col p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lift ${
                p.popular ? "border-ink ring-1 ring-ink" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[17px] font-semibold">{p.name}</h3>
                {p.popular && <Badge tone="info">Most chosen</Badge>}
              </div>
              <p className="mt-2 min-h-[42px] text-[14px] text-slate">{p.tagline}</p>
              <p className="mt-4 font-display text-[32px] font-semibold leading-none tnum">
                {money(p.monthly)}
                <span className="text-[15px] font-normal text-slate"> /month</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-[14px] text-slate">
                {p.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-slate-soft" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                as={Link}
                to="/signup"
                variant={p.popular ? "primary" : "secondary"}
                className="mt-6 w-full"
              >
                Start with {p.name}
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" className="mx-auto mt-24 max-w-shell px-5 sm:px-8">
        <h2 data-enter className={H2}>
          Questions worth asking before you buy
        </h2>

        <div data-enter className="mt-8 max-w-[76ch] border-t border-rule">
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={f.q} className="border-b border-rule">
                <button
                  onClick={() => setOpenFaq(open ? -1 : i)}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                  aria-expanded={open}
                >
                  <span className="text-[16px] font-medium">{f.q}</span>
                  <span className={`shrink-0 text-slate transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
                    {open ? <Minus size={17} /> : <Plus size={17} />}
                  </span>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <p className="max-w-prose overflow-hidden text-[15px] leading-relaxed text-slate">
                    <span className="block pb-6">{f.a}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Closing ──────────────────────────────────────────────────── */}
      <section className="mx-auto mt-24 max-w-shell px-5 sm:px-8">
        <div data-expand className="relative overflow-hidden rounded-card bg-ink">
          <div aria-hidden className="envelope-grid pointer-events-none absolute inset-0" />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-route/25 blur-[100px]"
          />
          <div className="relative px-8 py-16 text-center sm:px-14 sm:py-20">
            <h2 className="mx-auto max-w-[22ch] text-[clamp(1.7rem,3.4vw,2.5rem)] font-semibold text-white">
              Start with one mailbox and fifty contacts.
            </h2>
            <p className="mx-auto mt-4 max-w-[48ch] text-[16px] leading-relaxed text-white/70">
              That is the honest way to begin. Prove the message works before you scale the
              volume, and your domain will still be usable in six months.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button as={Link} to="/signup" variant="onDark" size="lg">
                Start 14-day trial
              </Button>
              <Button variant="onDarkGhost" size="lg" onClick={openDemo}>
                Look around the demo first
              </Button>
            </div>
          </div>
          <AirmailRule className="relative h-[6px]" />
        </div>
      </section>
    </div>
  );
}

/* Counters run once on scroll. These are illustrative product limits and
   defaults, not customer results — worded so they cannot be read as claims. */
function DeliverabilityBand() {
  const a = useCountUp(30, { duration: 1 });
  const b = useCountUp(0.3, { duration: 1, decimals: 1 });
  const c = useCountUp(3, { duration: 1 });

  return (
    <section className="mt-24 border-y border-rule bg-paper-sunk">
      <div className="mx-auto grid max-w-shell gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div>
          <h2 data-enter className={`${H2} max-w-[20ch]`}>
            We will slow you down on purpose
          </h2>
          <p data-enter className="mt-5 max-w-prose text-[16px] leading-relaxed text-slate">
            ClientFlow ships with conservative defaults and keeps them until you change them.
            A new mailbox starts low and climbs. Bounce and complaint rates are watched, and a
            campaign that crosses the ceiling is paused rather than left running.
          </p>
          <p data-enter className="mt-4 max-w-prose text-[16px] leading-relaxed text-slate">
            This costs you volume in the first month. It is the difference between a domain that
            still works next year and one you have to replace.
          </p>
        </div>

        <dl data-enter className="grid grid-cols-1 gap-px self-start overflow-hidden rounded-card border border-rule bg-rule sm:grid-cols-3 lg:grid-cols-1">
          {[
            { ref: a, suffix: "/day", label: "Default ceiling for a newly connected mailbox, before warm-up raises it." },
            { ref: b, suffix: "%", label: "Complaint rate at which a campaign is paused for review." },
            { ref: c, suffix: " strikes", label: "Failed sends from one mailbox before it is taken out of rotation." },
          ].map((s, i) => (
            <div key={i} className="bg-paper-card px-6 py-5">
              <dt className="font-display text-[30px] font-semibold leading-none tnum">
                <span ref={s.ref}>0</span>
                <span className="text-[18px] text-slate">{s.suffix}</span>
              </dt>
              <dd className="mt-2 text-[13.5px] leading-relaxed text-slate">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
