import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Download, UserPlus, Trash2, ArrowRight, Mail, Upload, Send, MessageCircle } from "lucide-react";
import {
  Card,
  Button,
  Badge,
  Field,
  Input,
  Select,
  Toggle,
  Meter,
  Modal,
  Segmented,
  Table,
  Th,
  Td,
  Tr,
  Loading,
  Avatar,
  AirmailRule,
  Checkbox,
  useToast,
} from "../../components/ui";
import { useAsync } from "../../lib/hooks";
import { useAuth, planFor, hasTeamChat } from "../../lib/auth";
import api from "../../lib/api";
import { money, num, fullDate, relative } from "../../lib/format";

/* ── Billing ──────────────────────────────────────────────────────────── */

export function Billing() {
  const { data, loading } = useAsync(() =>
    Promise.all([api.billing.plans(), api.billing.subscription(), api.billing.invoices()]).then(
      ([plans, sub, invoices]) => ({ plans, sub, invoices })
    )
  );
  const [interval, setInterval] = useState("month");
  const [confirm, setConfirm] = useState(null);
  const toast = useToast();

  if (loading || !data) return <Loading rows={8} />;
  const { plans, sub, invoices } = data;
  const current = plans.find((p) => p.id === sub.plan);
  const yearly = interval === "year";

  const usageRows = [
    ["Emails this month", sub.usage.sendsThisMonth, current.limits.sendsPerMonth],
    ["Stored contacts", sub.usage.contacts, current.limits.contacts],
    ["Connected mailboxes", sub.usage.mailboxes, current.limits.mailboxes],
    ["Team seats", sub.usage.seats, current.limits.seats],
  ];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <AirmailRule className="h-[5px]" />
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] font-semibold">{current.name}</h2>
              <Badge status={sub.status} />
            </div>
            <p className="mt-1.5 text-[14.5px] text-slate">
              {money(current.monthly)} a month · renews {fullDate(sub.renewsAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                const r = await api.billing.portal();
                if (r?.url) window.location.href = r.url;
                else toast("Demo mode — no payment processor connected", "hold");
              }}
            >
              Manage payment method
            </Button>
            <Button variant="danger" onClick={() => setConfirm("cancel")}>
              Cancel plan
            </Button>
          </div>
        </div>

        <div className="grid gap-x-8 gap-y-5 border-t border-rule p-6 sm:grid-cols-2">
          {usageRows.map(([label, used, cap]) => {
            const ratio = used / cap;
            return (
              <div key={label}>
                <div className="flex items-baseline justify-between">
                  <p className="text-[14px] text-slate">{label}</p>
                  <p className="text-[14px] font-medium tnum">
                    {num(used)} <span className="text-slate-soft">/ {num(cap)}</span>
                  </p>
                </div>
                <div className="mt-2">
                  <Meter
                    value={used}
                    max={cap}
                    tone={ratio > 0.9 ? "stop" : ratio > 0.75 ? "hold" : "signal"}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[19px] font-semibold">Change plan</h2>
          <Segmented
            value={interval}
            onChange={setInterval}
            options={[
              { value: "month", label: "Monthly" },
              { value: "year", label: "Yearly — 2 months free" },
            ]}
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {plans.map((p) => {
            const here = p.id === sub.plan;
            return (
              <Card key={p.id} className={`flex flex-col p-6 ${here ? "border-ink ring-1 ring-ink" : ""}`}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[17px] font-semibold">{p.name}</h3>
                  {here && <Badge tone="live">Current</Badge>}
                </div>
                <p className="mt-4 font-display text-[30px] font-semibold leading-none tnum">
                  {money(yearly ? Math.round(p.yearly / 12) : p.monthly)}
                  <span className="text-[14px] font-normal text-slate"> /month</span>
                </p>
                <ul className="mt-5 flex-1 space-y-2 text-[13.5px] text-slate">
                  {p.features.slice(0, 5).map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check size={14} className="mt-[3px] shrink-0 text-signal" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={here ? "secondary" : "primary"}
                  disabled={here}
                  className="mt-5 w-full"
                  onClick={async () => {
                    const r = await api.billing.checkout(p.id, interval);
                    if (r?.url) window.location.href = r.url;
                    else toast("Demo mode — no payment processor connected", "hold");
                  }}
                >
                  {here ? "Your current plan" : `Switch to ${p.name}`}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-4">
          <h2 className="text-[16px] font-semibold">Invoices</h2>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Period</Th>
              <Th>Plan</Th>
              <Th className="text-right">Amount</Th>
              <Th>Status</Th>
              <Th className="text-right">Date</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <Tr key={i.id}>
                <Td className="font-medium">{i.period}</Td>
                <Td className="text-slate">{i.plan}</Td>
                <Td className="text-right tnum">{money(i.amount)}</Td>
                <Td>
                  <Badge status={i.status} />
                </Td>
                <Td className="text-right text-[13.5px] text-slate">{fullDate(i.at)}</Td>
                <Td className="text-right">
                  <Button size="sm" variant="ghost" aria-label="Download invoice">
                    <Download size={14} />
                  </Button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal
        open={confirm === "cancel"}
        onClose={() => setConfirm(null)}
        title="Cancel your plan?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Keep my plan
            </Button>
            <Button
              variant="stamp"
              onClick={() => {
                setConfirm(null);
                toast("Plan cancelled — read-only until the period ends", "hold");
              }}
            >
              Cancel plan
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-[15px] leading-relaxed text-slate">
          <p>
            Your campaigns stop sending at the end of the period you have already paid for. After
            that the account is read-only for 30 days so you can export everything.
          </p>
          <p>
            Connected mailbox tokens are revoked immediately on cancellation, so nothing can send
            by accident.
          </p>
        </div>
      </Modal>
    </div>
  );
}

/* ── Team ─────────────────────────────────────────────────────────────── */

const ROLE_LABEL = { owner: "Owner", member: "Worker", viewer: "Viewer" };

export function Team() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const plan = planFor(user);
  const seatLimit = plan?.limits.seats ?? 1;

  const { data, loading, setData } = useAsync(() =>
    Promise.all([api.team.list(), api.campaigns.list()]).then(([team, campaigns]) => ({ team, campaigns }))
  );
  const [editing, setEditing] = useState(null); // null | "new" | seat
  const [form, setForm] = useState({ email: "", role: "member", campaignIds: [] });
  const [busy, setBusy] = useState(false);

  if (loading || !data) return <Loading rows={5} />;

  const { team, campaigns } = data;
  const used = team.length;
  const full = used >= seatLimit;
  const campaignName = (id) => campaigns.find((c) => c.id === id)?.name || "Campaign";

  const openInvite = () => {
    setForm({ email: "", role: "member", campaignIds: [] });
    setEditing("new");
  };
  const openEdit = (seat) => {
    setForm({ email: seat.email, role: seat.role, campaignIds: seat.campaignIds || [] });
    setEditing(seat);
  };

  const save = async () => {
    setBusy(true);
    if (editing === "new") {
      const seat = await api.team.invite(form);
      setData({ ...data, team: [...team, seat] });
      toast(`Invitation sent to ${seat.email}`);
    } else {
      const seat = await api.team.update(editing.id, { role: form.role, campaignIds: form.campaignIds });
      setData({ ...data, team: team.map((m) => (m.id === seat.id ? seat : m)) });
      toast(`Updated ${seat.name}`);
    }
    setBusy(false);
    setEditing(null);
  };

  const remove = async (seat) => {
    await api.team.remove(seat.id);
    setData({ ...data, team: team.filter((m) => m.id !== seat.id) });
    toast(`${seat.name} removed from the team`);
  };

  const message = async (seat) => {
    const dm = await api.chat.openDirect(seat.id, user.id);
    navigate(`/app/chat?c=${dm.id}`);
  };

  const toggleCampaign = (id, on) =>
    setForm((f) => ({ ...f, campaignIds: on ? [...f.campaignIds, id] : f.campaignIds.filter((x) => x !== id) }));

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="max-w-[62ch]">
          <p className="text-[14px] text-slate">
            <span className="font-medium text-ink tnum">
              {used} of {seatLimit}
            </span>{" "}
            seats used on the {plan?.name || "current"} plan.
          </p>
          <p className="mt-1 text-[13px] text-slate-soft">
            Workers get their own dashboard: the campaigns you assign them, the replies on those
            campaigns, and team chat. They never see billing, mailbox settings or this page.
          </p>
        </div>
        {seatLimit <= 1 ? (
          <Button as={Link} to="/app/billing" variant="secondary">
            Upgrade to add workers
          </Button>
        ) : (
          <Button onClick={openInvite} disabled={full} title={full ? "Every seat is in use" : undefined}>
            <UserPlus size={15} /> {full ? "All seats in use" : "Add a worker"}
          </Button>
        )}
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <thead>
            <tr>
              <Th>Person</Th>
              <Th>Role</Th>
              <Th>Works on</Th>
              <Th>Last active</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {team.map((s) => (
              <Tr key={s.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} size={32} tint={s.avatarTint} />
                    <div className="min-w-0">
                      <p className="font-medium">
                        {s.name} {s.id === user.id && <span className="font-normal text-slate">(you)</span>}
                      </p>
                      <p className="text-[13px] text-slate">{s.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone={s.role === "owner" ? "info" : s.role === "member" ? "live" : "idle"}>{ROLE_LABEL[s.role]}</Badge>
                    {s.status === "invited" && <Badge tone="hold">Invite sent</Badge>}
                  </div>
                </Td>
                <Td className="max-w-[260px]">
                  {s.role === "owner" ? (
                    <span className="text-[13px] text-slate">Everything</span>
                  ) : s.campaignIds?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {s.campaignIds.map((id) => (
                        <span key={id} className="max-w-[200px] truncate rounded bg-paper-sunk px-1.5 py-0.5 text-[12px] text-slate">
                          {campaignName(id)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[13px] text-slate-soft">Nothing assigned</span>
                  )}
                </Td>
                <Td className="text-[13.5px] text-slate">{s.lastActiveAt ? relative(s.lastActiveAt) : "Not yet"}</Td>
                <Td className="text-right">
                  {s.id !== user.id && (
                    <div className="flex justify-end gap-1">
                      {hasTeamChat(user) && s.status === "active" && (
                        <Button size="sm" variant="ghost" onClick={() => message(s)} aria-label={`Message ${s.name}`}>
                          <MessageCircle size={14} />
                        </Button>
                      )}
                      {s.role !== "owner" && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(s)} aria-label={`Remove ${s.name}`}>
                            <Trash2 size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add a worker" : `Edit ${editing?.name}`}
        description={
          editing === "new"
            ? "They get an email invitation and their own sign-in. Mailboxes stay connected to whoever authorised them."
            : "Change what they can do and which campaigns they work on."
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button disabled={!form.email} loading={busy} onClick={save}>
              {editing === "new" ? "Send invitation" : "Save changes"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {editing === "new" && (
            <Field label="Email address">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="colleague@brightfold.co"
              />
            </Field>
          )}
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="member">Worker — runs assigned campaigns, answers replies, uses team chat</option>
              <option value="viewer">Viewer — read only, can use team chat</option>
            </Select>
          </Field>
          <div>
            <p className="label">Campaigns they work on</p>
            <ul className="divide-y divide-rule rounded-md border border-rule">
              {campaigns.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Checkbox checked={form.campaignIds.includes(c.id)} onChange={(on) => toggleCampaign(c.id, on)} />
                  <span className="min-w-0 flex-1 truncate text-[14px]">{c.name}</span>
                  <Badge status={c.status} />
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-[13px] text-slate-soft">You can change this any time.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ── Settings ─────────────────────────────────────────────────────────── */

export function Settings() {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    company: user?.company ?? "",
    timezone: "Africa/Lagos",
  });
  const [prefs, setPrefs] = useState({
    replyEmails: true,
    weeklyDigest: true,
    limitWarnings: true,
    hardStopOnLimit: false,
    pauseOnBounce: true,
  });

  return (
    <div className="max-w-3xl space-y-5">
      <Card className="p-6">
        <h2 className="text-[17px] font-semibold">Your details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </Field>
          <Field label="Email address" hint="Used for sign-in and notifications.">
            <Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          </Field>
          <Field label="Company">
            <Input value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} />
          </Field>
          <Field label="Time zone" hint="Sending windows are interpreted in this zone.">
            <Select value={profile.timezone} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}>
              <option>Africa/Lagos</option>
              <option>Europe/London</option>
              <option>America/New_York</option>
              <option>Asia/Dubai</option>
              <option>Australia/Sydney</option>
            </Select>
          </Field>
        </div>
        <Button className="mt-5" onClick={() => toast("Details saved")}>
          Save details
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-[17px] font-semibold">Notifications</h2>
        <div className="mt-5 space-y-5">
          <Toggle
            label="Email me when someone replies"
            description="One email per reply, sent to the address above."
            checked={prefs.replyEmails}
            onChange={(v) => setPrefs({ ...prefs, replyEmails: v })}
          />
          <Toggle
            label="Weekly summary"
            description="Sends, replies, bounces and anything that needs attention."
            checked={prefs.weeklyDigest}
            onChange={(v) => setPrefs({ ...prefs, weeklyDigest: v })}
          />
          <Toggle
            label="Warn me before I hit my monthly allowance"
            description="At 80% and again at 95%."
            checked={prefs.limitWarnings}
            onChange={(v) => setPrefs({ ...prefs, limitWarnings: v })}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-[17px] font-semibold">Safety</h2>
        <p className="mt-1.5 max-w-prose text-[14px] text-slate">
          These are on by default. Turning them off puts your domain at risk, so the product will
          not do it quietly.
        </p>
        <div className="mt-5 space-y-5">
          <Toggle
            label="Pause a campaign when its bounce rate passes 8%"
            description="This is a platform limit as well as a preference — the campaign pauses whether or not this is on."
            checked={prefs.pauseOnBounce}
            onChange={(v) => setPrefs({ ...prefs, pauseOnBounce: v })}
          />
          <Toggle
            label="Hard stop at my monthly allowance"
            description="Campaigns pause instead of prompting you to upgrade."
            checked={prefs.hardStopOnLimit}
            onChange={(v) => setPrefs({ ...prefs, hardStopOnLimit: v })}
          />
        </div>
      </Card>

      <Card className="border-stamp/30 p-6">
        <h2 className="text-[17px] font-semibold">Export or delete everything</h2>
        <p className="mt-1.5 max-w-prose text-[14px] text-slate">
          Export gives you contacts, campaigns and send history as CSV. Deletion removes all of it
          along with every mailbox token, and cannot be undone.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => toast("Export started — we will email the file")}>
            <Download size={15} /> Export my data
          </Button>
          <Button variant="danger">Delete my account</Button>
        </div>
      </Card>
    </div>
  );
}

/* ── Onboarding ───────────────────────────────────────────────────────── */

const TASKS = [
  {
    icon: Mail,
    title: "Connect a mailbox",
    body: "Sign in with Google or Microsoft. This is the account your emails will be sent from.",
    to: "/app/mailboxes",
    cta: "Connect",
  },
  {
    icon: Upload,
    title: "Import your list",
    body: "Upload a CSV. You will confirm the column mapping and see exactly what was rejected.",
    to: "/app/contacts",
    cta: "Import contacts",
  },
  {
    icon: Send,
    title: "Write your first sequence",
    body: "Two or three short steps beat one long one. Preview it before you launch.",
    to: "/app/campaigns/new",
    cta: "Build a campaign",
  },
];

export function Onboarding() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-2xl space-y-5 py-6">
      <div>
        <h1 className="text-[26px] font-semibold">Three things and you are sending</h1>
        <p className="mt-2 text-[15.5px] leading-relaxed text-slate">
          Your trial has started. Nothing sends until you launch a campaign, so you can set all of
          this up without risk.
        </p>
      </div>

      <ol className="space-y-3">
        {TASKS.map((t, i) => (
          <li key={t.title}>
            <Card className="flex flex-wrap items-center gap-4 p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rule bg-paper">
                <t.icon size={17} className="text-route" />
              </span>
              <div className="min-w-[200px] flex-1">
                <p className="text-[15.5px] font-medium">
                  <span className="mr-2 text-slate-soft tnum">{i + 1}</span>
                  {t.title}
                </p>
                <p className="mt-1 text-[14px] text-slate">{t.body}</p>
              </div>
              <Button variant="secondary" onClick={() => navigate(t.to)}>
                {t.cta} <ArrowRight size={14} />
              </Button>
            </Card>
          </li>
        ))}
      </ol>

      <Card className="bg-paper p-5">
        <p className="text-[14px] leading-relaxed text-slate">
          One suggestion before you start: send your first sequence to fifty people, not five
          thousand. If the reply rate is bad at fifty it will be worse at five thousand, and you
          will have spent your domain's reputation finding that out.
        </p>
        <Link to="/app" className="mt-3 inline-block text-[14px] text-route underline underline-offset-4">
          Skip for now — go to the dashboard
        </Link>
      </Card>
    </div>
  );
}
