import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AlertTriangle, ArrowUpRight, LifeBuoy, ShieldAlert } from "lucide-react";
import {
  Card,
  Stat,
  Badge,
  Button,
  Table,
  Th,
  Td,
  Tr,
  Loading,
  Meter,
  useToast,
} from "../../components/ui";
import { useAsync } from "../../lib/hooks";
import api from "../../lib/api";
import { money, num, relative, fullDate } from "../../lib/format";

const CHART_FONT = { fontSize: 11, fill: "#8A929D" };
const TIP = {
  border: "1px solid #DBDDD6",
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "'Instrument Sans', system-ui",
};

export function AdminOverview() {
  const { data, loading } = useAsync(() =>
    Promise.all([
      api.admin.metrics(),
      api.admin.revenue(),
      api.admin.campaigns(),
      api.admin.tickets(),
      api.admin.auditLog(),
    ]).then(([m, rev, campaigns, tickets, audit]) => ({ m, rev, campaigns, tickets, audit }))
  );

  if (loading || !data) return <Loading rows={8} />;
  const { m, rev, campaigns, tickets, audit } = data;

  const risky = campaigns.filter((c) => c.status !== "active");
  const urgent = tickets.filter((t) => t.priority === "high" && t.status === "open");

  return (
    <div className="space-y-6">
      {/* things that need a human */}
      {(risky.length > 0 || urgent.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="flex items-start gap-3.5 border-stamp/35 bg-stamp-soft p-4">
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-stamp" />
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-medium">
                {risky.length} campaigns flagged or suspended
              </p>
              <p className="mt-1 text-[13.5px] text-slate">
                Highest complaint rate: {risky[0]?.complaintRate}% on {risky[0]?.org}
              </p>
              <Link
                to="/admin/campaigns"
                className="mt-2 inline-block text-[13.5px] text-stamp-deep underline underline-offset-4"
              >
                Review them
              </Link>
            </div>
          </Card>
          <Card className="flex items-start gap-3.5 border-hold/40 bg-hold-soft p-4">
            <LifeBuoy size={18} className="mt-0.5 shrink-0 text-hold" />
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-medium">{urgent.length} urgent support tickets</p>
              <p className="mt-1 truncate text-[13.5px] text-slate">
                Oldest: {urgent[0]?.subject}
              </p>
              <Link
                to="/admin/support"
                className="mt-2 inline-block text-[13.5px] text-hold underline underline-offset-4"
              >
                Open the queue
              </Link>
            </div>
          </Card>
        </div>
      )}

      {/* headline */}
      <Card className="grid divide-y divide-rule sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 [&>*+*]:sm:border-l [&>*+*]:sm:border-rule">
        <Stat label="Monthly recurring revenue" value={money(m.mrr)} delta={m.mrrChange} foot="vs last month" />
        <Stat label="Paying subscriptions" value={num(m.activeSubs)} delta={m.subsChange} foot={`${m.trials} on trial`} />
        <Stat label="Registered users" value={num(m.totalUsers)} delta={m.usersChange} foot="all time" />
        <Stat label="Monthly churn" value={`${m.churnRate}%`} foot={`${m.trialConversion}% trial conversion`} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-4">
            <div>
              <h2 className="text-[16px] font-semibold">Recurring revenue</h2>
              <p className="mt-0.5 text-[13px] text-slate">Nine months, with new and churned split out</p>
            </div>
            <Button as={Link} to="/admin/revenue" variant="secondary" size="sm">
              Detail <ArrowUpRight size={14} />
            </Button>
          </div>
          <div className="h-[290px] px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rev.series} margin={{ top: 4, right: 16, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="gMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1F7A5C" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#1F7A5C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#DBDDD6" vertical={false} />
                <XAxis dataKey="month" tick={CHART_FONT} tickLine={false} axisLine={{ stroke: "#DBDDD6" }} />
                <YAxis
                  tick={CHART_FONT}
                  tickLine={false}
                  axisLine={false}
                  width={58}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <Tooltip contentStyle={TIP} formatter={(v) => money(v)} />
                <Area type="monotone" dataKey="mrr" name="MRR" stroke="#1F7A5C" strokeWidth={2} fill="url(#gMrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-rule px-5 py-4">
            <h2 className="text-[16px] font-semibold">Where the revenue sits</h2>
          </div>
          <ul className="divide-y divide-rule">
            {rev.planSplit.map((p) => (
              <li key={p.plan} className="px-5 py-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[14.5px] font-medium">{p.plan}</span>
                  <span className="text-[14px] tnum">{money(p.mrr)}</span>
                </div>
                <div className="mt-2">
                  <Meter
                    value={p.mrr}
                    max={Math.max(...rev.planSplit.map((x) => x.mrr))}
                    tone={p.plan === "Trial" ? "hold" : "ink"}
                    label={`${num(p.users)} accounts`}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* platform health */}
      <Card className="overflow-hidden">
        <div className="border-b border-rule px-5 py-4">
          <h2 className="text-[16px] font-semibold">Platform sending health</h2>
          <p className="mt-0.5 text-[13px] text-slate">
            Aggregate across every customer. A bad actor here damages deliverability for everyone.
          </p>
        </div>
        <div className="grid divide-y divide-rule sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 [&>*+*]:sm:border-l [&>*+*]:sm:border-rule">
          <Stat label="Emails sent, 30 days" value={num(m.emailsSent30d)} />
          <Stat label="Delivery rate" value={`${m.deliveryRate}%`} foot="provider-accepted" />
          <Stat label="Connected mailboxes" value={num(m.openMailboxes)} />
          <Stat label="Mailboxes in error" value={num(m.failedMailboxes)} foot="need reconnection" />
        </div>
      </Card>

      {/* riskiest campaigns */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-4">
          <h2 className="text-[16px] font-semibold">Campaigns worth watching</h2>
          <Link to="/admin/campaigns" className="text-[13.5px] text-route underline underline-offset-4">
            All campaigns
          </Link>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Campaign</Th>
              <Th>Account</Th>
              <Th className="text-right">Sent</Th>
              <Th className="text-right">Reply</Th>
              <Th className="text-right">Bounce</Th>
              <Th className="text-right">Complaint</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {[...campaigns]
              .sort((a, b) => b.complaintRate - a.complaintRate)
              .slice(0, 5)
              .map((c) => (
                <Tr key={c.id}>
                  <Td className="font-medium">{c.name}</Td>
                  <Td className="text-[13.5px] text-slate">{c.org}</Td>
                  <Td className="text-right tnum">{num(c.sent)}</Td>
                  <Td className="text-right tnum text-slate">{c.replyRate}%</Td>
                  <Td className={`text-right tnum ${c.bounceRate > 8 ? "text-stamp" : "text-slate"}`}>
                    {c.bounceRate}%
                  </Td>
                  <Td className={`text-right tnum ${c.complaintRate > 0.3 ? "text-stamp" : "text-slate"}`}>
                    {c.complaintRate}%
                  </Td>
                  <Td>
                    <Badge status={c.status} />
                  </Td>
                </Tr>
              ))}
          </tbody>
        </Table>
      </Card>

      {/* recent actions */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-4">
          <h2 className="text-[16px] font-semibold">Recent platform actions</h2>
          <Link to="/admin/audit" className="text-[13.5px] text-route underline underline-offset-4">
            Full audit log
          </Link>
        </div>
        <ul className="divide-y divide-rule">
          {audit.slice(0, 5).map((a) => (
            <li key={a.id} className="flex flex-wrap items-start gap-x-4 gap-y-1 px-5 py-3.5">
              <span className="min-w-[150px] text-[13.5px] text-slate">
                {a.actor === "system" ? "Automatic" : a.actor}
              </span>
              <span className="min-w-[200px] flex-1 text-[14px]">
                <span className="font-medium">{a.action.replace(/_/g, " ")}</span>
                <span className="text-slate"> — {a.target}</span>
              </span>
              <span className="text-[13px] text-slate-soft">{relative(a.at)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ── Revenue ──────────────────────────────────────────────────────────── */

export function AdminRevenue() {
  const { data, loading } = useAsync(() =>
    Promise.all([api.admin.revenue(), api.admin.metrics()]).then(([rev, m]) => ({ rev, m }))
  );
  const toast = useToast();

  if (loading || !data) return <Loading rows={8} />;
  const { rev, m } = data;
  const net = rev.series.map((s) => ({ ...s, net: s.new - s.churned }));
  const failed = rev.invoices.filter((i) => i.status === "failed");

  return (
    <div className="space-y-6">
      <Card className="grid divide-y divide-rule sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 [&>*+*]:sm:border-l [&>*+*]:sm:border-rule">
        <Stat label="MRR" value={money(m.mrr)} delta={m.mrrChange} />
        <Stat label="ARR, annualised" value={money(m.arr)} foot="MRR × 12" />
        <Stat label="Average revenue per account" value={money(Math.round(m.mrr / m.activeSubs))} />
        <Stat label="Failed payments" value={num(failed.length)} foot="need chasing" />
      </Card>

      {failed.length > 0 && (
        <Card className="flex items-start gap-3.5 border-stamp/35 bg-stamp-soft p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-stamp" />
          <div>
            <p className="text-[14.5px] font-medium">
              {failed.length} payment{failed.length > 1 ? "s" : ""} failed in the last week
            </p>
            <p className="mt-1 text-[13.5px] text-slate">
              {failed.map((f) => f.customer).join(", ")} — accounts stay active for 7 days before
              they are suspended.
            </p>
            <Button size="sm" variant="stamp" className="mt-3" onClick={() => toast("Dunning emails queued")}>
              Send dunning emails
            </Button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="border-b border-rule px-5 py-4">
          <h2 className="text-[16px] font-semibold">New against churned revenue</h2>
          <p className="mt-0.5 text-[13px] text-slate">
            Net is the number that matters. Churn climbing while new is flat is the early warning.
          </p>
        </div>
        <div className="h-[320px] px-2 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={net} margin={{ top: 4, right: 16, bottom: 0, left: 4 }}>
              <CartesianGrid stroke="#DBDDD6" vertical={false} />
              <XAxis dataKey="month" tick={CHART_FONT} tickLine={false} axisLine={{ stroke: "#DBDDD6" }} />
              <YAxis
                tick={CHART_FONT}
                tickLine={false}
                axisLine={false}
                width={58}
                tickFormatter={(v) => `$${v / 1000}k`}
              />
              <Tooltip contentStyle={TIP} formatter={(v) => money(v)} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="new" name="New" fill="#1F7A5C" radius={[3, 3, 0, 0]} />
              <Bar dataKey="churned" name="Churned" fill="#D0342C" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-rule px-5 py-4">
          <h2 className="text-[16px] font-semibold">Recent invoices</h2>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Customer</Th>
              <Th>Plan</Th>
              <Th className="text-right">Amount</Th>
              <Th>Status</Th>
              <Th className="text-right">Date</Th>
            </tr>
          </thead>
          <tbody>
            {rev.invoices.map((i) => (
              <Tr key={i.id}>
                <Td className="font-medium">{i.customer}</Td>
                <Td className="text-slate">{i.plan}</Td>
                <Td className="text-right tnum">{money(i.amount)}</Td>
                <Td>
                  <Badge status={i.status} />
                </Td>
                <Td className="text-right text-[13.5px] text-slate">{fullDate(i.at)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
