import { useEffect, useState } from "react";
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
import { ArrowUpRight, Inbox, AlertTriangle, Send, Ban, Flame, MessageSquare } from "lucide-react";
import {
  Card,
  Badge,
  Button,
  Meter,
  AirmailRule,
  Loading,
  EmptyState,
  StatusDot,
  Avatar,
} from "../../components/ui";
import { useAsync, useCountUp } from "../../lib/hooks";
import { useAuth } from "../../lib/auth";
import api from "../../lib/api";
import { num, pct, relative } from "../../lib/format";

/* Sentiment vocabulary, matching the reply inbox's labels. */
const SENTIMENT = [
  { key: "positive", label: "Interested", bar: "bg-signal" },
  { key: "referral", label: "Referred on", bar: "bg-route" },
  { key: "later", label: "Not now", bar: "bg-hold" },
  { key: "negative", label: "Not relevant", bar: "bg-slate-soft" },
  { key: "unsubscribe", label: "Opted out", bar: "bg-stamp" },
];

const SERIES = [
  { key: "sent", label: "Sent", color: "#0E1B2A" },
  { key: "replied", label: "Replied", color: "#1B4B8F" },
  { key: "bounced", label: "Bounced", color: "#D0342C" },
];

export default function Dashboard() {
  const { data, loading } = useAsync(() =>
    Promise.all([
      api.analytics.overview(),
      api.mailboxes.list(),
      api.replies.list(),
    ]).then(([overview, boxes, replies]) => ({ overview, boxes, replies }))
  );

  if (loading || !data) return <Loading rows={8} />;
  return <DashboardBody {...data} />;
}

/** True one frame after mount, so bars and rings animate in from zero. */
function useMounted() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return on;
}

function DashboardBody({ overview, boxes, replies }) {
  const { user } = useAuth();
  const mounted = useMounted();
  const [hidden, setHidden] = useState(() => new Set());

  const active = overview.campaigns.filter((c) => c.status === "active");
  const totals = overview.campaigns.reduce(
    (a, c) => ({
      sent: a.sent + c.stats.sent,
      replied: a.replied + c.stats.replied,
      positive: a.positive + c.stats.positive,
      bounced: a.bounced + c.stats.bounced,
      unsub: a.unsub + c.stats.unsubscribed,
    }),
    { sent: 0, replied: 0, positive: 0, bounced: 0, unsub: 0 }
  );

  const unread = replies.filter((r) => !r.read);
  const brokenBoxes = boxes.filter((b) => b.status === "error");
  const fullBoxes = boxes.filter((b) => b.sentToday >= b.dailyLimit);
  const liveBoxes = boxes.filter((b) => b.status !== "error");
  const sentToday = liveBoxes.reduce((a, b) => a + b.sentToday, 0);
  const capacity = liveBoxes.reduce((a, b) => a + b.dailyLimit, 0);

  const latest = [...replies].sort((a, b) => new Date(b.repliedAt) - new Date(a.repliedAt)).slice(0, 4);
  const mix = SENTIMENT.map((s) => ({ ...s, count: replies.filter((r) => r.sentiment === s.key).length }));

  // Last 7 days against the 7 before, straight from the chart series.
  const trend = (key) => {
    const s = overview.series.map((d) => d[key]);
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    const now = sum(s.slice(-7));
    const before = sum(s.slice(-14, -7));
    return { points: s, delta: before ? Math.round(((now - before) / before) * 100) : null };
  };

  const toggle = (key) =>
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* greeting and today's progress */}
      <Card className="relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-6 px-6 py-5">
          <div className="flex items-center gap-5">
            <ProgressRing value={mounted ? sentToday : 0} max={capacity} />
            <div>
              <h2 className="text-[21px] font-semibold">
                {greeting}, {user?.name?.split(" ")[0] || "there"}
              </h2>
              <p className="mt-1 max-w-[52ch] text-[14px] leading-relaxed text-slate">
                <span className="font-medium text-ink tnum">{num(sentToday)}</span> of{" "}
                <span className="tnum">{num(capacity)}</span> sends done today across{" "}
                {liveBoxes.length} mailboxes.{" "}
                {unread.length > 0
                  ? `${unread.length} ${unread.length > 1 ? "replies are" : "reply is"} waiting for you.`
                  : "Your inbox is clear."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button as={Link} to="/app/replies" variant="secondary">
              <MessageSquare size={15} /> Replies
              {unread.length > 0 && (
                <span className="rounded-full bg-route px-1.5 text-[11px] font-semibold text-white tnum">
                  {unread.length}
                </span>
              )}
            </Button>
          </div>
        </div>
        {active.length > 0 && <AirmailRule running className="h-[3px]" />}
      </Card>

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
        <TrendStat label="Sent, all time" value={totals.sent} trend={trend("sent")} upIsGood foot={`${active.length} campaigns running`} />
        <TrendStat label="Replies" value={totals.replied} trend={trend("replied")} upIsGood foot={`${pct(totals.replied, totals.sent)} of sends`} color="#1B4B8F" />
        <TrendStat label="Bounced" value={totals.bounced} trend={trend("bounced")} foot={`${pct(totals.bounced, totals.sent)} — keep under 3%`} color="#D0342C" />
        <TrendStat label="Opted out" value={totals.unsub} foot={`${pct(totals.unsub, totals.sent)} of sends`} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* activity */}
        <Card className="flex flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule px-5 py-4">
            <div>
              <h2 className="text-[16px] font-semibold">Last 14 days</h2>
              <p className="mt-0.5 text-[13px] text-slate">Click a series to show or hide it</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {SERIES.map((s) => {
                const off = hidden.has(s.key);
                return (
                  <button
                    key={s.key}
                    onClick={() => toggle(s.key)}
                    aria-pressed={!off}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] transition-colors ${
                      off ? "border-rule text-slate-soft" : "border-rule bg-paper text-ink"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: off ? "#C9CCC4" : s.color }} />
                    {s.label}
                  </button>
                );
              })}
              <Link to="/app/analytics" className="ml-2 text-[13.5px] text-route underline underline-offset-4">
                Full analytics
              </Link>
            </div>
          </div>
          <div className="h-[280px] px-2 py-4 lg:h-auto lg:min-h-[280px] lg:flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview.series} margin={{ top: 4, right: 16, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0E1B2A" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="#0E1B2A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gReplied" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1B4B8F" stopOpacity={0.14} />
                    <stop offset="100%" stopColor="#1B4B8F" stopOpacity={0} />
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
                <Area type="monotone" dataKey="sent" hide={hidden.has("sent")} stroke="#0E1B2A" strokeWidth={2} fill="url(#gSent)" name="Sent" animationDuration={900} />
                <Area type="monotone" dataKey="replied" hide={hidden.has("replied")} stroke="#1B4B8F" strokeWidth={2} fill="url(#gReplied)" name="Replied" animationDuration={1100} />
                <Area type="monotone" dataKey="bounced" hide={hidden.has("bounced")} stroke="#D0342C" strokeWidth={1.5} fill="none" name="Bounced" animationDuration={1300} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* sender health */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-4">
            <div>
              <h2 className="text-[16px] font-semibold">Sender health</h2>
              <p className="mt-0.5 text-[13px] text-slate">Today's sends, health score and warm-up</p>
            </div>
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
                  {b.health != null && <HealthChip score={b.health} />}
                </div>
                <div className="mt-2.5">
                  <Meter
                    value={mounted ? b.sentToday : 0}
                    max={b.dailyLimit}
                    tone={b.status === "error" ? "stop" : b.sentToday >= b.dailyLimit ? "hold" : "signal"}
                  />
                </div>
                <p className="mt-1.5 flex items-center justify-between gap-3 text-[12.5px] text-slate">
                  <span className="tnum">
                    {b.sentToday}/{b.dailyLimit} today
                  </span>
                  {b.warmupDay != null && (
                    <span className="inline-flex items-center gap-1">
                      <Flame size={12} className={b.warmupDay < 30 ? "text-hold" : "text-slate-soft"} />
                      {b.warmupDay < 30 ? `Warming up · day ${b.warmupDay} of 30` : "Fully warmed"}
                    </span>
                  )}
                </p>
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

      {/* replies: newest, and what people are saying */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-4">
            <h2 className="text-[16px] font-semibold">Latest replies</h2>
            <Link to="/app/replies" className="text-[13.5px] text-route underline underline-offset-4">
              Open inbox
            </Link>
          </div>
          {latest.length === 0 ? (
            <EmptyState icon={Inbox} title="No replies yet" description="Replies from every mailbox will collect here." />
          ) : (
            <ul className="divide-y divide-rule">
              {latest.map((r) => {
                const s = SENTIMENT.find((x) => x.key === r.sentiment);
                return (
                  <li key={r.id}>
                    <Link to="/app/replies" className="flex gap-3.5 px-5 py-4 transition-colors hover:bg-paper">
                      <Avatar name={r.contactName} size={34} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className={`truncate text-[14px] ${r.read ? "" : "font-semibold"}`}>
                            {!r.read && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-route align-middle" />}
                            {r.contactName}
                            <span className="font-normal text-slate"> · {r.company}</span>
                          </p>
                          <span className="shrink-0 text-[12px] text-slate-soft">{relative(r.repliedAt)}</span>
                        </div>
                        <p className="mt-1 line-clamp-1 text-[13.5px] text-slate">{r.body}</p>
                      </div>
                      {s && (
                        <Badge status={r.sentiment} className="hidden self-center normal-case sm:inline-flex">
                          {s.label}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col overflow-hidden">
          <div className="border-b border-rule px-5 py-4">
            <h2 className="text-[16px] font-semibold">What people are saying</h2>
            <p className="mt-0.5 text-[13px] text-slate">How your {replies.length} replies were tagged</p>
          </div>
          <div className="flex-1 px-5 py-5">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-paper-sunk">
              {mix.map((m) =>
                m.count ? (
                  <div
                    key={m.key}
                    className={`${m.bar} h-full transition-[width] duration-700 ease-out`}
                    style={{ width: mounted ? `${(m.count / replies.length) * 100}%` : "0%" }}
                    title={`${m.label}: ${m.count}`}
                  />
                ) : null
              )}
            </div>
            <ul className="mt-5 space-y-2.5">
              {mix.map((m) => (
                <li key={m.key} className="flex items-center justify-between gap-3 text-[13.5px]">
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${m.bar}`} />
                    {m.label}
                  </span>
                  <span className="text-slate tnum">
                    {m.count} <span className="text-slate-soft">· {pct(m.count, replies.length)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-rule bg-paper px-5 py-3.5">
            <p className="text-[13px] text-slate">
              <span className="font-semibold text-signal tnum">{pct(totals.positive, totals.sent)}</span> of
              all sends led to an interested reply.
            </p>
          </div>
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
                  <div className="w-[110px]">
                    <p className="text-[12px] text-slate-soft">
                      Reply rate <span className="font-medium text-ink tnum">{pct(c.stats.replied, c.stats.sent)}</span>
                    </p>
                    <div className="mt-1.5">
                      <Meter
                        value={mounted ? c.stats.replied : 0}
                        max={Math.max(1, c.stats.sent * 0.15)}
                        tone="route"
                      />
                    </div>
                  </div>
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

/* ── Pieces ───────────────────────────────────────────────────────────── */

function TrendStat({ label, value, trend, upIsGood = false, foot, color = "#0E1B2A" }) {
  const ref = useCountUp(value, { duration: 1.2 });
  const d = trend?.delta;
  const good = d == null || d === 0 ? null : upIsGood ? d > 0 : d < 0;
  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] text-slate">{label}</p>
        {d != null && (
          <span
            title="Last 7 days compared with the 7 before"
            className={`rounded-full px-1.5 py-0.5 text-[11.5px] font-medium tnum ${
              good == null ? "bg-paper-sunk text-slate" : good ? "bg-signal-soft text-signal" : "bg-stamp-soft text-stamp-deep"
            }`}
          >
            {d > 0 ? "+" : ""}
            {d}%
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-end justify-between gap-3">
        <p className="font-display text-[26px] font-semibold leading-none tnum">
          <span ref={ref}>0</span>
        </p>
        {trend && <Sparkline points={trend.points} color={color} />}
      </div>
      {foot && <p className="mt-2 text-[13px] text-slate">{foot}</p>}
    </div>
  );
}

function Sparkline({ points, color, width = 84, height = 28 }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const xy = points.map((p, i) => [
    (i / (points.length - 1)) * width,
    height - 2 - ((p - min) / span) * (height - 4),
  ]);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="shrink-0 overflow-visible">
      <path d={`${line} L${width},${height} L0,${height} Z`} fill={color} opacity={0.07} />
      <path d={line} pathLength={1} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" className="spark-draw" />
    </svg>
  );
}

function ProgressRing({ value, max, size = 64 }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const frac = max ? Math.min(1, value / max) : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EAEBE6" strokeWidth={6} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#1F7A5C"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-[14px] font-semibold tnum">
        {Math.round(frac * 100)}%
      </span>
    </div>
  );
}

function HealthChip({ score }) {
  const tone =
    score >= 85 ? "bg-signal-soft text-signal" : score >= 60 ? "bg-hold-soft text-hold" : "bg-stamp-soft text-stamp-deep";
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-medium tnum ${tone}`} title="Mailbox health score">
      Health {score}
    </span>
  );
}
