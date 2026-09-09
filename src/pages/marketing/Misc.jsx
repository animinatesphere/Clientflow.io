import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MessageSquare, LifeBuoy } from "lucide-react";
import { Card, Button, Field, Input, Textarea, useToast, AirmailRule } from "../../components/ui";
import { useEntrance } from "../../lib/hooks";

/* ── About ────────────────────────────────────────────────────────────── */

export function About() {
  const scope = useEntrance();
  return (
    <div ref={scope} className="mx-auto max-w-shell px-5 pb-8 pt-14 sm:px-8">
      <div className="max-w-prose">
        <h1 data-enter className="text-[clamp(2.1rem,4.4vw,3rem)] font-bold leading-tight">
          We built the boring half
        </h1>
        <p data-enter className="mt-5 text-[17px] leading-relaxed text-slate">
          ClientFlow started because a small agency kept losing domains. Not because the writing
          was bad — the writing was fine — but because every tool they tried was optimised to help
          them send more, faster, with no opinion about whether that was survivable.
        </p>
        <p data-enter className="mt-5 text-[17px] leading-relaxed text-slate">
          So the product has an opinion. Conservative defaults you have to consciously raise.
          Sequences that stop themselves. A suppression list checked on every send rather than at
          import. Bounce ceilings that pause a campaign instead of quietly logging a warning.
        </p>
        <p data-enter className="mt-5 text-[17px] leading-relaxed text-slate">
          None of that is exciting, and none of it will make your copy better. It just means the
          domain you spent three years building is still worth something after your first
          campaign.
        </p>
      </div>

      <div data-enter className="mt-14 grid gap-4 md:grid-cols-3">
        {[
          ["Send less than you can", "Every default is set below the provider's limit, and raising it takes a deliberate action."],
          ["Say what happened", "Import reports name the rows they rejected. Failed sends show the provider's actual error, not a shrug."],
          ["Make leaving easy", "Export everything as CSV whenever you like. No retention call, no dark pattern in the cancel flow."],
        ].map(([t, b]) => (
          <Card key={t} className="p-6">
            <h2 className="text-[16px] font-semibold">{t}</h2>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-slate">{b}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Contact ──────────────────────────────────────────────────────────── */

export function Contact() {
  const scope = useEntrance();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [sending, setSending] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    setForm({ name: "", email: "", company: "", message: "" });
    toast("Message sent. We reply within one working day.");
  };

  return (
    <div ref={scope} className="mx-auto max-w-shell px-5 pb-8 pt-14 sm:px-8">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <h1 data-enter className="text-[clamp(2.1rem,4.4vw,3rem)] font-bold leading-tight">
            Talk to a person
          </h1>
          <p data-enter className="mt-5 max-w-prose text-[17px] leading-relaxed text-slate">
            Questions about volume, agency workspaces, or whether your use case is a fit. We would
            rather tell you no early than take a subscription that will not work.
          </p>

          <dl data-enter className="mt-10 space-y-5">
            {[
              [Mail, "Sales and plans", "sales@clientflow.io"],
              [LifeBuoy, "Existing customers", "support@clientflow.io"],
              [MessageSquare, "Abuse reports", "abuse@clientflow.io"],
            ].map(([Icon, label, value]) => (
              <div key={label} className="flex items-start gap-3.5">
                <Icon size={18} className="mt-0.5 shrink-0 text-route" />
                <div>
                  <dt className="text-[14px] font-medium">{label}</dt>
                  <dd className="text-[14px] text-slate">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <Card data-enter className="p-7">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your name">
                <Input required value={form.name} onChange={set("name")} placeholder="Adaeze Nwosu" />
              </Field>
              <Field label="Work email">
                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="you@company.com"
                />
              </Field>
            </div>
            <Field label="Company" hint="Optional, but it helps us answer properly.">
              <Input value={form.company} onChange={set("company")} placeholder="Brightfold Studio" />
            </Field>
            <Field label="What do you need?">
              <Textarea
                required
                rows={6}
                value={form.message}
                onChange={set("message")}
                placeholder="How many mailboxes, roughly what volume, and who you are contacting."
              />
            </Field>
            <Button type="submit" loading={sending} className="w-full">
              Send message
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

/* ── Legal pages ──────────────────────────────────────────────────────── */

function LegalShell({ title, updated, children }) {
  const scope = useEntrance();
  return (
    <div ref={scope} className="mx-auto max-w-shell px-5 pb-8 pt-14 sm:px-8">
      <div className="max-w-prose">
        <h1 data-enter className="text-[clamp(2rem,4vw,2.6rem)] font-bold leading-tight">{title}</h1>
        <p data-enter className="mt-3 text-[14px] text-slate-soft">Last updated {updated}</p>
        <AirmailRule data-enter className="mt-8 h-[4px]" />
        <Card data-enter className="mt-8 border-hold/40 bg-hold-soft px-6 py-5">
          <p className="text-[14.5px] leading-relaxed text-slate">
            This is placeholder text written to show the shape of the page. It is not a legal
            document and it has not been reviewed by a lawyer. Replace it before launch with terms
            drafted for your jurisdiction and your actual data practices.
          </p>
        </Card>
        <div data-enter className="mt-10 space-y-8">{children}</div>
      </div>
    </div>
  );
}

const Clause = ({ n, title, children }) => (
  <section>
    <h2 className="text-[18px] font-semibold">
      <span className="mr-2.5 text-slate-soft tnum">{n}</span>
      {title}
    </h2>
    <div className="mt-3 space-y-3 text-[15.5px] leading-relaxed text-slate">{children}</div>
  </section>
);

export function Privacy() {
  return (
    <LegalShell title="Privacy policy" updated="the date you publish it">
      <Clause n="1" title="What we hold">
        <p>
          Account details you give us, the contact records you upload, campaign content and
          statistics, and an encrypted authorisation token for each mailbox you connect. We never
          receive or store your email password.
        </p>
      </Clause>
      <Clause n="2" title="Mailbox access">
        <p>
          Connecting a mailbox grants ClientFlow permission to send on your behalf and to read the
          conversation threads it started, so replies can be detected. It is not used to read the
          rest of your inbox. You can revoke access from your Google or Microsoft account settings
          at any time and the token stops working immediately.
        </p>
      </Clause>
      <Clause n="3" title="The people on your lists">
        <p>
          Contact records you upload are yours. You are the controller of that data and ClientFlow
          processes it on your instruction. You are responsible for having a lawful basis to hold
          and contact those people. If one of them asks us to erase their data, we will tell you
          and act on it.
        </p>
      </Clause>
      <Clause n="4" title="Retention and deletion">
        <p>
          Cancel and the account goes read-only for 30 days so you can export. After that,
          contacts, campaigns and tokens are deleted. Invoices are kept as long as tax law
          requires.
        </p>
      </Clause>
      <Clause n="5" title="Sub-processors">
        <p>
          Payments, hosting, error tracking and transactional email are handled by third parties.
          The current list should be published here and kept up to date.
        </p>
      </Clause>
    </LegalShell>
  );
}

export function Terms() {
  return (
    <LegalShell title="Terms of service" updated="the date you publish it">
      <Clause n="1" title="The agreement">
        <p>Using ClientFlow means accepting these terms and the acceptable use policy.</p>
      </Clause>
      <Clause n="2" title="Subscriptions and billing">
        <p>
          Plans are billed monthly or yearly in advance. Cancelling stops the next renewal; it does
          not refund the period already paid for. Prices can change with 30 days' notice, and
          existing subscribers keep their rate for the term they have paid.
        </p>
      </Clause>
      <Clause n="3" title="Limits">
        <p>
          Each plan carries a monthly email allowance and a mailbox count. Reaching the allowance
          holds the queue rather than incurring a charge.
        </p>
      </Clause>
      <Clause n="4" title="Suspension">
        <p>
          We may pause a campaign or suspend an account that breaches the acceptable use policy,
          crosses the bounce or complaint ceilings, or puts our platform's standing with mailbox
          providers at risk. Where the situation allows, we tell you first.
        </p>
      </Clause>
      <Clause n="5" title="What we do not promise">
        <p>
          ClientFlow does not guarantee inbox placement, reply rates, or any commercial outcome.
          Mailbox providers decide where your email lands and we have no control over their
          decisions.
        </p>
      </Clause>
    </LegalShell>
  );
}

export function AcceptableUse() {
  return (
    <LegalShell title="Acceptable use policy" updated="the date you publish it">
      <Clause n="1" title="You must not send to">
        <p>
          Lists you bought, scraped, or otherwise obtained without a lawful basis. Addresses that
          have opted out, anywhere. Recipients in jurisdictions where what you are sending requires
          consent you do not have.
        </p>
      </Clause>
      <Clause n="2" title="You must not send">
        <p>
          Anything deceptive about who you are or who you represent. Falsified headers or return
          paths. Malware, phishing, or links designed to mislead. Content that is unlawful where
          the recipient lives.
        </p>
      </Clause>
      <Clause n="3" title="Every message must carry">
        <p>
          A working opt-out that takes effect within one working day, a real identity, and a
          physical or verifiable business address where the law requires one.
        </p>
      </Clause>
      <Clause n="4" title="Ceilings we enforce">
        <p>
          A campaign is paused automatically if its hard bounce rate passes 8% or its complaint
          rate passes 0.3%. Repeatedly tripping either results in suspension. These are platform
          limits, not a target to aim just underneath.
        </p>
      </Clause>
      <Clause n="5" title="Reporting abuse">
        <p>
          Anyone can report a ClientFlow sender to abuse@clientflow.io. Reports are investigated and
          the sender is not told who complained.
        </p>
      </Clause>
    </LegalShell>
  );
}

/* ── 404 ──────────────────────────────────────────────────────────────── */

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-shell flex-col items-center px-5 py-32 text-center sm:px-8">
      <p className="font-display text-[64px] font-bold leading-none text-rule tnum">404</p>
      <h1 className="mt-6 text-[26px] font-semibold">That page has moved on</h1>
      <p className="mt-3 max-w-[44ch] text-[15.5px] text-slate">
        The link is broken or the page no longer exists. The product pages are all reachable from
        the navigation above.
      </p>
      <div className="mt-8 flex gap-3">
        <Button as={Link} to="/">
          Back to the homepage
        </Button>
        <Button as={Link} to="/contact" variant="secondary">
          Report a broken link
        </Button>
      </div>
    </div>
  );
}
