import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowUpRight, Inbox, AlertTriangle, Send, Ban } from "lucide-react";
import {
  Card,
  Stat,
  Badge,
  Button,
  Meter,
  AirmailRule,
  Loading,
  EmptyState,
  StatusDot,
} from "../../components/ui";
import { useAsync } from "../../lib/hooks";
import api from "../../lib/api";
import { num, pct, relative } from "../../lib/format";

export default function Dashboard() {
  const { data, loading } = useAsync(() =>
    Promise.all([
      api.analytics.overview(),
      api.mailboxes.list(),
      api.replies.list(),
    ]).then(([overview, boxes, replies]) => ({ overview, boxes, replies }))
  );

  if (loading || !data) return <Loading rows={8} />;

  const { overview, boxes, replies } = data;
  const active = overview.campaigns.filter((c) => c.status === "active");
  const totals = overview.campaigns.reduce(
    (a, c) => ({
      sent: a.sent + c.stats.sent,
      replied: a.replied + c.stats.replied,
      bounced: a.bounced + c.stats.bounced,
      unsub: a.unsub + c.stats.unsubscribed,
    }),
    { sent: 0, replied: 0, bounced: 0, unsub: 0 }
  );

  const unread = replies.filter((r) => !r.read);
  const brokenBoxes = boxes.filter((b) => b.status === "error");
  const fullBoxes = boxes.filter((b) => b.sentToday >= b.dailyLimit);

  return (
    <div className="space-y-6">
      {/* attention first — anything broken outranks the numbers */}
      {(brokenBoxes.length > 0 || unread.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {brokenBoxes.length > 0 && (
            <Card className="flex items-start gap-3.5 border-stamp/35 bg-stamp-soft p-4">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-stamp" />
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-medium">
                  {brokenBoxes.length} mailbox{brokenBoxes.length > 1 ? "es" : ""} stopped sending
                </p>
                <p className="mt-1 truncate text-[13.5px] text-slate">
                  {brokenBoxes[0].email} — {brokenBoxes[0].errorMessage}
                </p>
                <Link
                  to="/app/mailboxes"
                  className="mt-2 inline-block text-[13.5px] text-stamp-deep underline underline-offset-4"
                >
                  Reconnect now
                </Link>
              </div>
            </Card>
          )}
          {unread.length > 0 && (
            <Card className="flex items-start gap-3.5 border-route/30 bg-route-soft p-4">
              <Inbox size={18} className="mt-0.5 shrink-0 text-route" />
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-medium">
                  {unread.length} repl{unread.length > 1 ? "ies" : "y"} waiting for you
                </p>
                <p className="mt-1 truncate text-[13.5px] text-slate">
                  Newest from {unread[0].contactName} at {unread[0].company}
                </p>
                <Link
                  to="/app/replies"
                  className="mt-2 inline-block text-[13.5px] text-route underline underline-offset-4"
                >
                  Open the reply inbox
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* headline figures */}
      <Card className="grid divide-y divide-rule sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 [&>*+*]:sm:border-l [&>*+*]:sm:border-rule">
        <Stat label="Sent, all time" value={num(totals.sent)} foot={`${active.length} campaigns running`} />
        <Stat label="Replies" value={num(totals.replied)} foot={`${pct(totals.replied, totals.sent)} of sends`} />
        <Stat label="Bounced" value={num(totals.bounced)} foot={`${pct(totals.bounced, totals.sent)} — keep under 3%`} />
        <Stat label="Opted out" value={num(totals.unsub)} foot={`${pct(totals.unsub, totals.sent)} of sends`} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* activity */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-4">
            <div>
              <h2 className="text-[16px] font-semibold">Last 14 days</h2>
              <p className="mt-0.5 text-[13px] text-slate">Sends, replies and bounces per day</p>
            </div>
            <Link to="/app/analytics" className="text-[13.5px] text-route underline underline-offset-4">
              Full analytics
            </Link>
          </div>
          <div className="h-[280px] px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview.series} margin={{ top: 4, right: 16, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0E1B2A" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="#0E1B2A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#DBDDD6" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#8A929D" }}
                  tickLine={false}
                  axisLine={{ stroke: "#DBDDD6" }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11, fill: "#8A929D" }} tickLine={false} axisLine={false} width={44} />
                <Tooltip
                  contentStyle={{
                    border: "1px solid #DBDDD6",
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: "'Instrument Sans', system-ui",
                  }}
                />
                <Area type="monotone" dataKey="sent" stroke="#0E1B2A" strokeWidth={2} fill="url(#gSent)" name="Sent" />
                <Area type="monotone" dataKey="replied" stroke="#1B4B8F" strokeWidth={2} fill="none" name="Replied" />
                <Area type="monotone" dataKey="bounced" stroke="#D0342C" strokeWidth={1.5} fill="none" name="Bounced" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* mailbox capacity */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-4">
            <h2 className="text-[16px] font-semibold">Today's capacity</h2>
            <Link to="/app/mailboxes" className="text-[13.5px] text-route underline underline-offset-4">
              Manage
            </Link>
          </div>
          <ul className="divide-y divide-rule">
            {boxes.map((b) => (
              <li key={b.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <StatusDot status={b.status} pulse={b.status === "active"} />
                    <span className="truncate text-[14px]">{b.email}</span>
                  </span>
                  <span className="shrink-0 text-[13px] text-slate tnum">
                    {b.sentToday}/{b.dailyLimit}
                  </span>
                </div>
                <div className="mt-2.5">
                  <Meter
                    value={b.sentToday}
                    max={b.dailyLimit}
                    tone={b.status === "error" ? "stop" : b.sentToday >= b.dailyLimit ? "hold" : "signal"}
                  />
                </div>
              </li>
            ))}
          </ul>
          {fullBoxes.length > 0 && (
            <p className="border-t border-rule bg-paper px-5 py-3 text-[13px] text-slate">
              {fullBoxes.length} at the daily ceiling. The queue holds and resumes at midnight.
            </p>
          )}
        </Card>
      </div>

      {/* running campaigns */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-4">
          <h2 className="text-[16px] font-semibold">Campaigns</h2>
          <Button as={Link} to="/app/campaigns" variant="secondary" size="sm">
            See all <ArrowUpRight size={14} />
          </Button>
        </div>

        {overview.campaigns.length === 0 ? (
          <EmptyState
            icon={Send}
            title="No campaigns yet"
            description="Connect a mailbox, import a list, and write your first sequence."
            action={
              <Button as={Link} to="/app/campaigns/new">
                Create a campaign
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-rule">
            {overview.campaigns.slice(0, 4).map((c) => (
              <li key={c.id}>
                {c.status === "active" && <AirmailRule running className="h-[3px]" />}
                <Link
                  to={`/app/campaigns/${c.id}`}
                  className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 transition-colors hover:bg-paper"
                >
                  <div className="min-w-[200px] flex-1">
                    <p className="text-[15px] font-medium">{c.name}</p>
                    <p className="mt-0.5 text-[13px] text-slate">
                      {c.steps.length} step{c.steps.length > 1 ? "s" : ""} ·{" "}
                      {num(c.contactCount)} contacts ·{" "}
                      {c.launchedAt ? `launched ${relative(c.launchedAt)}` : "not launched"}
                    </p>
                  </div>
                  <dl className="flex gap-7 text-[13px]">
                    {[
                      ["Sent", num(c.stats.sent)],
                      ["Replied", num(c.stats.replied)],
                      ["Bounced", num(c.stats.bounced)],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-slate-soft">{k}</dt>
                        <dd className="mt-0.5 font-medium tnum">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <Badge status={c.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <p className="flex items-center gap-2.5 text-[14px] text-slate">
          <Ban size={16} className="text-slate-soft" />
          Your suppression list is checked before every single send.
        </p>
        <Link to="/app/suppression" className="text-[13.5px] text-route underline underline-offset-4">
          Review it
        </Link>
      </Card>
    </div>
  );
}
