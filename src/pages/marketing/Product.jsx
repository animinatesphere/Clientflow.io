import { Link } from "react-router-dom";
import { Card, Button, AirmailRule, Badge } from "../../components/ui";
import { useEntrance } from "../../lib/hooks";

const SECTIONS = [
  {
    id: "mailboxes",
    kicker: "Mailboxes",
    title: "Your accounts, rotated and rationed",
    body: [
      "You connect Gmail or Microsoft accounts through their own consent screen. ClientFlow stores an encrypted token and nothing else — no password ever touches our servers, and you can revoke access from your Google or Microsoft account at any time without asking us.",
      "Each mailbox has a daily ceiling you control. When a campaign runs, sends are distributed across the mailboxes assigned to it, spaced apart rather than fired in a burst. A mailbox that reaches its ceiling stops receiving work until the counter resets, and one that starts failing is pulled out of rotation before it damages the rest.",
    ],
    facts: [
      ["Default ceiling on a new mailbox", "30 a day"],
      ["Spacing between sends", "Randomised, 40–180 seconds"],
      ["Token storage", "AES-256-GCM, encrypted at rest"],
      ["On repeated failure", "Mailbox paused, you are notified"],
    ],
  },
  {
    id: "contacts",
    kicker: "Contacts",
    title: "An import that tells you what it threw away",
    body: [
      "Drop in a CSV and map the columns yourself — the importer guesses, but you confirm. Anything that is not a valid address is rejected on the spot. Duplicates collapse into the existing record rather than creating a second one.",
      "Every import ends with a report: how many were added, how many already existed, how many were malformed, and how many were skipped because they are on your suppression list. You can download the rejected rows, fix them, and try again.",
    ],
    facts: [
      ["Formats", "CSV and TSV, up to 100MB"],
      ["Merge fields", "Any column becomes a merge tag"],
      ["Duplicate handling", "Collapsed, newest values win"],
      ["Suppression check", "Applied at import and at send"],
    ],
  },
  {
    id: "sequences",
    kicker: "Sequences",
    title: "Follow-ups that know when to stop",
    body: [
      "A sequence is a list of steps, each with a subject, a body and a wait in days. Merge tags pull values from the contact record, and a preview renders the email against a real contact so you see exactly what they will get, including the footer and the opt-out link.",
      "The important part is what cancels a sequence. A reply, a hard bounce, an opt-out, or a manual suppression stops every remaining step for that person — in every campaign they belong to, not only the one that reached them. This is the single most common way outbound embarrasses a business, and it is handled by default.",
    ],
    facts: [
      ["Steps", "Unlimited on Growth and Agency"],
      ["Waits", "Set per step, in days"],
      ["Sending windows", "Weekdays and hours, per campaign"],
      ["Stops on", "Reply, bounce, opt-out, suppression"],
    ],
  },
  {
    id: "replies",
    kicker: "Replies",
    title: "One place to answer from",
    body: [
      "Responses across every connected mailbox land in a single list, tagged with the campaign and step that produced them. Mark a reply as interested, not now, or not relevant, and the contact's status updates everywhere.",
      "Replies are matched by conversation thread, so a forwarded response or a message from a colleague still ties back to the original send. Out-of-office auto-replies are recognised and do not count as a real reply or stop the sequence.",
    ],
    facts: [
      ["Detection", "Thread-matched, checked every 10 minutes"],
      ["Auto-reply handling", "Detected and set aside"],
      ["Outcomes", "Interested, later, not relevant, opt-out"],
      ["Notifications", "Email or webhook on first reply"],
    ],
  },
];

export default function Product() {
  const scope = useEntrance();
  return (
    <div ref={scope} className="pb-8">
      <section className="mx-auto max-w-shell px-5 pt-14 sm:px-8">
        <div className="max-w-prose">
          <h1 data-enter className="text-[clamp(2.1rem,4.4vw,3rem)] font-bold leading-tight">
            The whole thing, in order
          </h1>
          <p data-enter className="mt-5 text-[17px] leading-relaxed text-slate">
            Four moving parts. Each one has a job, and each one has a limit it will not cross
            without you saying so.
          </p>
        </div>

        <nav data-enter className="mt-8 flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border border-rule bg-white px-3.5 py-1.5 text-[13.5px] text-slate transition-colors hover:border-ink/40 hover:text-ink"
            >
              {s.kicker}
            </a>
          ))}
        </nav>
      </section>

      {SECTIONS.map((s, i) => (
        <section
          key={s.id}
          id={s.id}
          className="mx-auto mt-20 max-w-shell scroll-mt-24 px-5 sm:px-8"
        >
          <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
            <div>
              <Badge tone="info">{s.kicker}</Badge>
              <h2 className="mt-4 max-w-[22ch] text-[clamp(1.6rem,3vw,2.1rem)] font-semibold leading-tight">
                {s.title}
              </h2>
              {s.body.map((p, j) => (
                <p key={j} className="mt-5 max-w-prose text-[16px] leading-relaxed text-slate">
                  {p}
                </p>
              ))}
            </div>

            <Card className="h-fit overflow-hidden">
              {i === 0 && <AirmailRule className="h-[5px]" />}
              <dl className="divide-y divide-rule">
                {s.facts.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-6 px-5 py-3.5">
                    <dt className="text-[14px] text-slate">{k}</dt>
                    <dd className="text-right text-[14px] font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        </section>
      ))}

      <section className="mx-auto mt-24 max-w-shell px-5 sm:px-8">
        <Card className="flex flex-wrap items-center justify-between gap-6 p-8">
          <div>
            <h2 className="text-[20px] font-semibold">See it with data in it</h2>
            <p className="mt-1.5 max-w-prose text-[15px] text-slate">
              The demo workspace is a full account filled with sample campaigns. It sends nothing.
            </p>
          </div>
          <div className="flex gap-3">
            <Button as={Link} to="/signup">
              Start 14-day trial
            </Button>
            <Button as={Link} to="/pricing" variant="secondary">
              See pricing
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
