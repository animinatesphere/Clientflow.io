import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Card, Button, Badge } from "../../components/ui";
import { useEntrance } from "../../lib/hooks";

const CHECKS = [
  {
    name: "SPF",
    what: "A DNS record naming the servers allowed to send for your domain.",
    who: "You publish it. ClientFlow tells you if it is missing or malformed.",
  },
  {
    name: "DKIM",
    what: "A cryptographic signature proving the message was not altered in transit.",
    who: "Your mail provider signs it. ClientFlow checks that signing is switched on.",
  },
  {
    name: "DMARC",
    what: "A policy telling receivers what to do when SPF or DKIM fails.",
    who: "You publish it. ClientFlow reads the record and flags a missing or permissive policy.",
  },
  {
    name: "Reverse DNS and MX",
    what: "Basic sanity checks that your domain is set up to receive as well as send.",
    who: "Checked on connection and re-checked weekly.",
  },
];

const OURS = [
  "Spacing sends so a mailbox never fires a burst",
  "Holding the queue when a mailbox hits its daily ceiling",
  "Removing bounced and complained addresses from every future send",
  "Stopping a sequence the moment someone replies or opts out",
  "Pausing a campaign that crosses your bounce or complaint ceiling",
  "Putting a working opt-out link in every message",
];

const YOURS = [
  "Whether the people on your list have any reason to hear from you",
  "Whether the addresses on it are real and current",
  "Whether your subject line reads like a person or a broadcast",
  "Your domain's authentication records and its sending history",
  "How long you warm up before you scale volume",
  "Whether what you are sending is legal where the recipient lives",
];

export default function Deliverability() {
  const scope = useEntrance();
  return (
    <div ref={scope} className="mx-auto max-w-shell px-5 pb-8 pt-14 sm:px-8">
      <div className="max-w-prose">
        <h1 data-enter className="text-[clamp(2.1rem,4.4vw,3rem)] font-bold leading-tight">
          Nobody can guarantee the inbox
        </h1>
        <p data-enter className="mt-5 text-[17px] leading-relaxed text-slate">
          Any vendor promising you a delivery rate is selling something they do not control.
          Mailbox providers decide where your email lands, using signals about your domain, your
          history and how recipients react. What a tool can do is stop you generating bad signals.
          That is the job ClientFlow takes on, and here is exactly where the line sits.
        </p>
      </div>

      <div data-enter className="mt-10 grid gap-4 md:grid-cols-2">
        <Card className="p-7">
          <Badge tone="live">Handled for you</Badge>
          <h2 className="mt-4 text-[18px] font-semibold">What ClientFlow controls</h2>
          <ul className="mt-4 space-y-3">
            {OURS.map((o) => (
              <li key={o} className="flex gap-3 text-[14.5px] leading-relaxed text-slate">
                <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-signal" />
                {o}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-7">
          <Badge tone="hold">Yours to get right</Badge>
          <h2 className="mt-4 text-[18px] font-semibold">What no tool can do for you</h2>
          <ul className="mt-4 space-y-3">
            {YOURS.map((o) => (
              <li key={o} className="flex gap-3 text-[14.5px] leading-relaxed text-slate">
                <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-hold" />
                {o}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <section className="mt-20">
        <h2 data-enter className="text-[24px] font-semibold">
          The four records we check on your domain
        </h2>
        <p data-enter className="mt-3 max-w-prose text-[15.5px] leading-relaxed text-slate">
          ClientFlow reads these when you connect a mailbox and re-reads them weekly. It cannot
          publish them for you — they live in your DNS — but it will tell you plainly which one is
          wrong.
        </p>
        <div data-enter className="mt-8 grid gap-px overflow-hidden rounded-card border border-rule bg-rule sm:grid-cols-2">
          {CHECKS.map((c) => (
            <div key={c.name} className="bg-paper-card p-6">
              <h3 className="font-display text-[17px] font-semibold">{c.name}</h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-slate">{c.what}</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-slate-soft">{c.who}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <Card data-enter className="border-hold/40 bg-hold-soft p-7">
          <div className="flex gap-4">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-hold" />
            <div>
              <h2 className="text-[18px] font-semibold">Before you send to a purchased list</h2>
              <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-slate">
                Bought and scraped lists are the fastest way to destroy a domain, and in several
                jurisdictions mailing them without consent is unlawful rather than merely unwise.
                Rules differ by country and by whether the recipient is a business or an
                individual — this is not legal advice, and you should check what applies to the
                people you intend to contact.
              </p>
              <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-slate">
                ClientFlow monitors bounce and complaint rates and will pause a campaign that
                crosses the ceiling. Accounts that repeatedly trip it are suspended. We would
                rather lose the subscription than host the sending.
              </p>
              <Button as={Link} to="/acceptable-use" variant="secondary" size="sm" className="mt-5">
                Read the acceptable use policy
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-16">
        <h2 data-enter className="text-[24px] font-semibold">A warm-up schedule that works</h2>
        <p data-enter className="mt-3 max-w-prose text-[15.5px] leading-relaxed text-slate">
          This is the default ClientFlow applies to a newly connected mailbox. You can override it,
          but the numbers exist because moving faster is where most domains get burned.
        </p>
        <Card data-enter className="mt-8 overflow-hidden">
          <ol className="divide-y divide-rule">
            {[
              ["Days 1–7", "10 emails a day", "Enough to prove the connection works and catch setup problems early."],
              ["Days 8–14", "20 emails a day", "Replies start arriving. Watch whether they are positive or annoyed."],
              ["Days 15–30", "35 emails a day", "If the bounce rate is under 3%, keep climbing. If not, stop and fix the list."],
              ["Day 30 onward", "Your ceiling", "Raise it gradually. There is no prize for reaching it in a week."],
            ].map(([period, vol, note]) => (
              <li key={period} className="grid gap-x-8 gap-y-1 px-6 py-5 sm:grid-cols-[130px_150px_1fr]">
                <span className="text-[14px] font-medium text-stamp">{period}</span>
                <span className="text-[14.5px] font-medium tnum">{vol}</span>
                <span className="text-[14.5px] leading-relaxed text-slate">{note}</span>
              </li>
            ))}
          </ol>
        </Card>
      </section>
    </div>
  );
}
