import { useState } from "react";
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
} from "lucide-react";
import SendConsole from "../../components/marketing/SendConsole";
import { Button, AirmailRule, Card, Badge } from "../../components/ui";
import { useEntrance, useCountUp } from "../../lib/hooks";
import { useAuth } from "../../lib/auth";
import { PLANS } from "../../lib/mock";
import { money } from "../../lib/format";

/* ── Content ──────────────────────────────────────────────────────────── */

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
    <div ref={scope}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-shell px-5 pb-8 pt-12 sm:px-8 sm:pt-20">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          <div className="lg:pt-4">
            <h1
              data-enter
              className="max-w-[13ch] text-[clamp(2.1rem,3.5vw,3rem)] font-bold leading-[1.06]"
              style={{ fontVariationSettings: '"wdth" 88' }}
            >
              Cold email that sends from your own mailboxes, at a pace they survive.
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
          </div>

          <div data-enter>
            <SendConsole />
            <p className="mt-3 text-[13px] text-slate-soft">
              A live depiction of the send queue. Two contacts drop out mid-sequence — one
              replied, one opted out.
            </p>
          </div>
        </div>
      </section>

      {/* ── The failure ledger ───────────────────────────────────────── */}
      <section className="mx-auto mt-20 max-w-shell px-5 sm:px-8">
        <div className="max-w-prose">
          <h2 data-enter className="text-[clamp(1.7rem,3.2vw,2.3rem)] font-semibold leading-tight">
            Most outbound does not fail on the writing.
          </h2>
          <p data-enter className="mt-4 text-[16px] leading-relaxed text-slate">
            It fails on the mechanics — sending too much too early, following up after someone
            already answered, and mailing a list nobody checked. Those three are fixable.
          </p>
        </div>

        <ol data-enter className="mt-10 border-t border-rule">
          {FAILURES.map((f) => (
            <li
              key={f.when}
              className="grid gap-x-8 gap-y-2 border-b border-rule py-6 sm:grid-cols-[140px_1fr_1fr]"
            >
              <p className="text-[14px] font-medium text-stamp">{f.when}</p>
              <p className="text-[15.5px] font-medium leading-snug text-ink">{f.what}</p>
              <p className="text-[14.5px] leading-relaxed text-slate">{f.then}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── The four steps (a genuine sequence) ──────────────────────── */}
      <section className="mx-auto mt-24 max-w-shell px-5 sm:px-8">
        <h2 data-enter className="text-[clamp(1.7rem,3.2vw,2.3rem)] font-semibold">
          Four steps from a spreadsheet to a reply
        </h2>

        <div data-enter className="mt-10 grid gap-px overflow-hidden rounded-card border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="bg-paper-card p-6">
              <span className="font-display text-[13px] font-semibold text-stamp tnum">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-[16px] font-semibold leading-snug">{s.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-slate">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Capabilities ─────────────────────────────────────────────── */}
      <section className="mx-auto mt-24 max-w-shell px-5 sm:px-8">
        <div className="max-w-prose">
          <h2 data-enter className="text-[clamp(1.7rem,3.2vw,2.3rem)] font-semibold">
            What is in the box
          </h2>
        </div>

        <div data-enter className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((c) => (
            <Card
              key={c.title}
              className={`p-6 ${c.wide ? "lg:col-span-2" : ""}`}
            >
              <c.icon size={19} className="text-route" />
              <h3 className={`mt-4 font-semibold ${c.wide ? "text-[18px]" : "text-[15.5px]"}`}>
                {c.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-slate">{c.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Deliverability stance ────────────────────────────────────── */}
      <DeliverabilityBand />

      {/* ── Pricing preview ──────────────────────────────────────────── */}
      <section className="mx-auto mt-24 max-w-shell px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 data-enter className="text-[clamp(1.7rem,3.2vw,2.3rem)] font-semibold">
            Priced on volume, not seats
          </h2>
          <Link data-enter to="/pricing" className="text-[14.5px] text-route underline underline-offset-4">
            Full comparison
          </Link>
        </div>

        <div data-enter className="mt-8 grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <Card
              key={p.id}
              className={`flex flex-col p-6 ${p.popular ? "border-ink ring-1 ring-ink" : ""}`}
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
        <h2 data-enter className="text-[clamp(1.7rem,3.2vw,2.3rem)] font-semibold">
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
                  <span className="shrink-0 text-slate">
                    {open ? <Minus size={17} /> : <Plus size={17} />}
                  </span>
                </button>
                {open && (
                  <p className="max-w-prose pb-6 text-[15px] leading-relaxed text-slate">{f.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Closing ──────────────────────────────────────────────────── */}
      <section className="mx-auto mt-24 max-w-shell px-5 sm:px-8">
        <div className="overflow-hidden rounded-card bg-ink">
          <div className="px-8 py-14 text-center sm:px-14">
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
          <AirmailRule className="h-[6px]" />
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
          <h2 data-enter className="max-w-[20ch] text-[clamp(1.7rem,3.2vw,2.3rem)] font-semibold">
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
