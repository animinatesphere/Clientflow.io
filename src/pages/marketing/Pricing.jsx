import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Minus } from "lucide-react";
import { Button, Card, Badge, Segmented, Table, Th, Td, Tr } from "../../components/ui";
import { PLANS } from "../../lib/mock";
import { money, num } from "../../lib/format";
import { useEntrance } from "../../lib/hooks";

const MATRIX = [
  { row: "Connected mailboxes", starter: "2", growth: "10", agency: "50" },
  { row: "Stored contacts", starter: "2,500", growth: "25,000", agency: "150,000" },
  { row: "Emails a month", starter: "6,000", growth: "40,000", agency: "250,000" },
  { row: "Team seats", starter: "1", growth: "3", agency: "15" },
  { row: "Sequence steps", starter: "Up to 4", growth: "Unlimited", agency: "Unlimited" },
  { row: "Reply detection", starter: true, growth: true, agency: true },
  { row: "Workspace suppression list", starter: true, growth: true, agency: true },
  { row: "CSV import with column mapping", starter: true, growth: true, agency: true },
  { row: "Per-mailbox pacing rules", starter: true, growth: true, agency: true },
  { row: "Sending windows and time zones", starter: false, growth: true, agency: true },
  { row: "A/B subject line testing", starter: false, growth: true, agency: true },
  { row: "Domain health monitoring", starter: false, growth: true, agency: true },
  { row: "Separate client workspaces", starter: false, growth: false, agency: true },
  { row: "White-label reporting", starter: false, growth: false, agency: true },
  { row: "Webhooks and REST API", starter: false, growth: false, agency: true },
  { row: "Support", starter: "Email", growth: "Email", agency: "Priority" },
];

export default function Pricing() {
  const [interval, setInterval] = useState("month");
  const scope = useEntrance();
  const yearly = interval === "year";

  return (
    <div ref={scope} className="mx-auto max-w-shell px-5 pb-8 pt-14 sm:px-8">
      <div className="max-w-prose">
        <h1 data-enter className="text-[clamp(2.1rem,4.4vw,3rem)] font-bold leading-tight">
          Pay for volume, not for people
        </h1>
        <p data-enter className="mt-5 text-[17px] leading-relaxed text-slate">
          Adding a colleague does not change your bill. Sending more email does. Every plan
          includes reply detection, suppression and pacing — the parts that keep you out of
          trouble are not an upsell.
        </p>
      </div>

      <div data-enter className="mt-8 flex items-center gap-4">
        <Segmented
          value={interval}
          onChange={setInterval}
          options={[
            { value: "month", label: "Monthly" },
            { value: "year", label: "Yearly" },
          ]}
        />
        {yearly && <span className="text-[13.5px] text-signal">Two months free on every plan</span>}
      </div>

      <div data-enter className="mt-8 grid gap-4 lg:grid-cols-3">
        {PLANS.map((p) => (
          <Card
            key={p.id}
            className={`flex flex-col p-7 ${p.popular ? "border-ink ring-1 ring-ink" : ""}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[19px] font-semibold">{p.name}</h2>
              {p.popular && <Badge tone="info">Most chosen</Badge>}
            </div>
            <p className="mt-2 min-h-[44px] text-[14.5px] text-slate">{p.tagline}</p>

            <p className="mt-5 font-display text-[38px] font-semibold leading-none tnum">
              {money(yearly ? Math.round(p.yearly / 12) : p.monthly)}
              <span className="text-[15px] font-normal text-slate"> /month</span>
            </p>
            <p className="mt-1.5 text-[13px] text-slate-soft">
              {yearly ? `${money(p.yearly)} billed once a year` : "Billed monthly, cancel any time"}
            </p>

            <Button
              as={Link}
              to="/signup"
              variant={p.popular ? "primary" : "secondary"}
              className="mt-6 w-full"
            >
              Start 14-day trial
            </Button>

            <ul className="mt-6 space-y-2.5 border-t border-rule pt-6 text-[14px]">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2.5 text-slate">
                  <Check size={15} className="mt-[3px] shrink-0 text-signal" />
                  {f}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <p data-enter className="mt-6 text-[14px] text-slate">
        Need more than 250,000 emails a month, or a private sending domain?{" "}
        <Link to="/contact" className="text-route underline underline-offset-4">
          Tell us what you need
        </Link>
        .
      </p>

      {/* comparison */}
      <section className="mt-20">
        <h2 data-enter className="text-[24px] font-semibold">
          Everything side by side
        </h2>
        <Card data-enter className="mt-6 overflow-hidden">
          <Table>
            <thead>
              <tr>
                <Th className="w-[38%]">Feature</Th>
                <Th>Starter</Th>
                <Th>Growth</Th>
                <Th>Agency</Th>
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((m) => (
                <Tr key={m.row}>
                  <Td className="font-medium">{m.row}</Td>
                  {["starter", "growth", "agency"].map((k) => (
                    <Td key={k} className="text-slate">
                      {m[k] === true ? (
                        <Check size={16} className="text-signal" />
                      ) : m[k] === false ? (
                        <Minus size={16} className="text-slate-soft" />
                      ) : (
                        <span className="tnum">{m[k]}</span>
                      )}
                    </Td>
                  ))}
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-2">
        <Card data-enter className="p-7">
          <h3 className="text-[17px] font-semibold">What counts as an email?</h3>
          <p className="mt-3 text-[14.5px] leading-relaxed text-slate">
            One message delivered to one recipient. A three-step sequence to {num(1000)} contacts
            uses up to {num(3000)} — fewer in practice, because replies and opt-outs stop the
            remaining steps. Failed sends and bounces are not counted against you.
          </p>
        </Card>
        <Card data-enter className="p-7">
          <h3 className="text-[17px] font-semibold">What happens if I go over?</h3>
          <p className="mt-3 text-[14.5px] leading-relaxed text-slate">
            The queue holds and you get a notice — nothing is sent past your allowance and no
            surprise charge appears. Upgrade and the queue resumes where it stopped. You can also
            set a hard stop that pauses campaigns instead of prompting.
          </p>
        </Card>
      </section>
    </div>
  );
}
