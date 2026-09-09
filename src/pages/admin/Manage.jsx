import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Flag,
  Pause,
  Mail,
  ShieldOff,
  Save,
  ShieldAlert,
} from "lucide-react";
import {
  Card,
  Button,
  Badge,
  Stat,
  Field,
  Input,
  Select,
  Toggle,
  Modal,
  Textarea,
  SearchInput,
  Segmented,
  Table,
  Th,
  Td,
  Tr,
  Loading,
  EmptyState,
  Avatar,
  StatusDot,
  useToast,
} from "../../components/ui";
import { useAsync } from "../../lib/hooks";
import api from "../../lib/api";
import { money, num, fullDate, relative, dateTime } from "../../lib/format";
import { PLANS } from "../../lib/mock";

/* ── Users ────────────────────────────────────────────────────────────── */

export function AdminUsers() {
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");
  const { data, loading } = useAsync(() => api.admin.users({ search: q, plan, status }), [q, plan, status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search name, email or company" className="w-full max-w-sm" />
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "trialing", label: "Trial" },
            { value: "past_due", label: "Past due" },
            { value: "cancelled", label: "Cancelled" },
          ]}
        />
        <Select value={plan} onChange={(e) => setPlan(e.target.value)} className="w-auto">
          <option value="all">All plans</option>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="agency">Agency</option>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <Loading rows={8} />
        ) : data.rows.length === 0 ? (
          <EmptyState title="No accounts match" description="Try clearing a filter." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className="w-[26%]">Account</Th>
                <Th>Plan</Th>
                <Th>Status</Th>
                <Th className="text-right">MRR</Th>
                <Th className="text-right">Mailboxes</Th>
                <Th className="text-right">Sent 30d</Th>
                <Th className="text-right">Last seen</Th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((u) => (
                <Tr key={u.id}>
                  <Td>
                    <Link to={`/admin/users/${u.id}`} className="flex items-center gap-3">
                      <Avatar name={u.name} size={32} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-medium">{u.name}</span>
                          {u.flagged && <Flag size={12} className="shrink-0 text-stamp" />}
                        </span>
                        <span className="block truncate text-[13px] text-slate">{u.company}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td className="capitalize text-slate">{u.plan}</Td>
                  <Td>
                    <Badge status={u.status} />
                  </Td>
                  <Td className="text-right tnum">{u.mrr ? money(u.mrr) : "—"}</Td>
                  <Td className="text-right tnum text-slate">{u.mailboxes}</Td>
                  <Td className="text-right tnum text-slate">{num(u.sent30d)}</Td>
                  <Td className="text-right text-[13.5px] text-slate">{relative(u.lastActiveAt)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

export function AdminUserDetail() {
  const { id } = useParams();
  const { data: user, loading } = useAsync(() => api.admin.user(id), [id]);
  const [action, setAction] = useState(null);
  const [note, setNote] = useState("");
  const toast = useToast();

  if (loading) return <Loading rows={8} />;
  if (!user)
    return (
      <EmptyState
        title="Account not found"
        action={
          <Button as={Link} to="/admin/users">
            Back to accounts
          </Button>
        }
      />
    );

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-[13.5px] text-slate hover:text-ink">
          <ArrowLeft size={14} /> All accounts
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar name={user.name} size={44} />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[22px] font-semibold">{user.name}</h1>
                <Badge status={user.status} />
                {user.flagged && <Badge status="flagged">Flagged</Badge>}
              </div>
              <p className="mt-0.5 text-[14px] text-slate">
                {user.company} · {user.email} · joined {fullDate(user.joinedAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setAction("email")}>
              <Mail size={15} /> Email them
            </Button>
            <Button variant="secondary" onClick={() => setAction("plan")}>
              Change plan
            </Button>
            <Button variant="danger" onClick={() => setAction("suspend")}>
              <ShieldOff size={15} /> Suspend
            </Button>
          </div>
        </div>
      </div>

      <Card className="grid divide-y divide-rule sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 [&>*+*]:sm:border-l [&>*+*]:sm:border-rule">
        <Stat label="Plan" value={<span className="capitalize">{user.plan}</span>} />
        <Stat label="MRR" value={user.mrr ? money(user.mrr) : "—"} />
        <Stat label="Mailboxes" value={num(user.mailboxes)} />
        <Stat label="Contacts" value={num(user.contacts)} />
        <Stat label="Sent, 30 days" value={num(user.sent30d)} />
      </Card>

      {user.flagged && (
        <Card className="flex items-start gap-3.5 border-stamp/35 bg-stamp-soft p-5">
          <ShieldAlert size={19} className="mt-0.5 shrink-0 text-stamp" />
          <div>
            <p className="text-[15px] font-medium">This account was flagged automatically</p>
            <p className="mt-1.5 max-w-prose text-[14px] leading-relaxed text-slate">
              A campaign crossed the bounce ceiling, which usually means an unverified or purchased
              list. Review the sending before deciding — a genuine mistake and a deliberate blast
              look different in the send log.
            </p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setAction("email")}>
                Warn the account
              </Button>
              <Button size="sm" variant="stamp" onClick={() => setAction("suspend")}>
                Suspend sending
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="border-b border-rule px-5 py-4">
          <h2 className="text-[16px] font-semibold">Account timeline</h2>
        </div>
        <ul className="divide-y divide-rule">
          {[
            ["Signed up", user.joinedAt],
            ["Started trial", user.joinedAt],
            ["Subscribed to " + user.plan, user.joinedAt],
            ["Last signed in", user.lastActiveAt],
          ].map(([label, at], i) => (
            <li key={i} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <span className="flex items-center gap-2.5 text-[14.5px]">
                <StatusDot status="active" />
                <span className="capitalize">{label}</span>
              </span>
              <span className="text-[13.5px] text-slate">{dateTime(at)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Modal
        open={action === "suspend"}
        onClose={() => setAction(null)}
        title={`Suspend ${user.company}?`}
        description="Sending stops immediately. They keep access to their data and can still export."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAction(null)}>
              Cancel
            </Button>
            <Button
              variant="stamp"
              disabled={!note.trim()}
              onClick={() => {
                toast(`${user.company} suspended`, "stop");
                setNote("");
                setAction(null);
              }}
            >
              Suspend account
            </Button>
          </>
        }
      >
        <Field label="Reason" hint="Recorded in the audit log and shown to the customer.">
          <Textarea
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Complaint rate of 0.94% across two campaigns, above the 0.3% platform ceiling."
          />
        </Field>
      </Modal>

      <Modal
        open={action === "plan"}
        onClose={() => setAction(null)}
        title="Change plan"
        description="Takes effect at the next renewal unless you prorate."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAction(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast("Plan updated");
                setAction(null);
              }}
            >
              Save change
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Plan">
            <Select defaultValue={user.plan}>
              {PLANS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {money(p.monthly)}/mo
                </option>
              ))}
            </Select>
          </Field>
          <Field label="When">
            <Select>
              <option>At next renewal</option>
              <option>Immediately, prorated</option>
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal
        open={action === "email"}
        onClose={() => setAction(null)}
        title={`Email ${user.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAction(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast("Message sent");
                setAction(null);
              }}
            >
              Send
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Subject">
            <Input defaultValue="About your recent sending" />
          </Field>
          <Field label="Message">
            <Textarea rows={7} placeholder="Write plainly. Say what happened, what you need them to do, and by when." />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

/* ── Subscriptions ────────────────────────────────────────────────────── */

export function AdminSubscriptions() {
  const { data, loading } = useAsync(() =>
    Promise.all([api.admin.users(), api.admin.revenue()]).then(([u, r]) => ({ u, r }))
  );
  if (loading || !data) return <Loading rows={8} />;

  const subs = data.u.rows.filter((u) => u.status !== "cancelled");
  const byStatus = (s) => subs.filter((u) => u.status === s).length;

  return (
    <div className="space-y-5">
      <Card className="grid divide-y divide-rule sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 [&>*+*]:sm:border-l [&>*+*]:sm:border-rule">
        <Stat label="Active" value={num(byStatus("active"))} />
        <Stat label="On trial" value={num(byStatus("trialing"))} />
        <Stat label="Payment failed" value={num(byStatus("past_due"))} />
        <Stat label="Cancelled, all time" value={num(data.u.rows.length - subs.length)} />
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-rule px-5 py-4">
          <h2 className="text-[16px] font-semibold">Every subscription</h2>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Account</Th>
              <Th>Plan</Th>
              <Th>Status</Th>
              <Th className="text-right">MRR</Th>
              <Th className="text-right">Started</Th>
            </tr>
          </thead>
          <tbody>
            {subs.map((u) => (
              <Tr key={u.id}>
                <Td>
                  <Link to={`/admin/users/${u.id}`} className="font-medium hover:underline">
                    {u.company}
                  </Link>
                  <p className="text-[13px] text-slate">{u.email}</p>
                </Td>
                <Td className="capitalize text-slate">{u.plan}</Td>
                <Td>
                  <Badge status={u.status} />
                </Td>
                <Td className="text-right tnum">{u.mrr ? money(u.mrr) : "—"}</Td>
                <Td className="text-right text-[13.5px] text-slate">{fullDate(u.joinedAt)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

/* ── Campaign oversight ───────────────────────────────────────────────── */

export function AdminCampaigns() {
  const { data, loading } = useAsync(() => api.admin.campaigns());
  const [target, setTarget] = useState(null);
  const [reason, setReason] = useState("");
  const toast = useToast();

  if (loading) return <Loading rows={7} />;

  return (
    <div className="space-y-5">
      <Card className="border-ink bg-ink px-5 py-4">
        <p className="text-[14.5px] leading-relaxed text-white/80">
          One customer mailing a scraped list damages delivery for every other customer sending
          from the same platform. This queue exists so that never runs for more than a day.
        </p>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <thead>
            <tr>
              <Th className="w-[24%]">Campaign</Th>
              <Th>Account</Th>
              <Th className="text-right">Sent</Th>
              <Th className="text-right">Reply</Th>
              <Th className="text-right">Bounce</Th>
              <Th className="text-right">Complaint</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {data.map((c) => {
              const bad = c.bounceRate > 8 || c.complaintRate > 0.3;
              return (
                <Tr key={c.id} className={bad ? "bg-stamp-soft/40" : ""}>
                  <Td className="font-medium">{c.name}</Td>
                  <Td>
                    <p className="text-[13.5px]">{c.org}</p>
                    <p className="text-[13px] text-slate">{c.user}</p>
                  </Td>
                  <Td className="text-right tnum">{num(c.sent)}</Td>
                  <Td className="text-right tnum text-slate">{c.replyRate}%</Td>
                  <Td className={`text-right tnum ${c.bounceRate > 8 ? "font-medium text-stamp" : "text-slate"}`}>
                    {c.bounceRate}%
                  </Td>
                  <Td className={`text-right tnum ${c.complaintRate > 0.3 ? "font-medium text-stamp" : "text-slate"}`}>
                    {c.complaintRate}%
                  </Td>
                  <Td>
                    <Badge status={c.status} />
                  </Td>
                  <Td className="text-right">
                    {c.status !== "suspended" && (
                      <Button size="sm" variant="danger" onClick={() => setTarget(c)}>
                        <Pause size={14} /> Suspend
                      </Button>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title={`Suspend "${target?.name}"?`}
        description={`${target?.org} will be told immediately.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="stamp"
              disabled={!reason.trim()}
              onClick={async () => {
                await api.admin.suspendCampaign(target.id, reason);
                toast(`${target.name} suspended`, "stop");
                setReason("");
                setTarget(null);
              }}
            >
              Suspend campaign
            </Button>
          </>
        }
      >
        <Field label="Reason" hint="Written to the audit log and sent to the customer verbatim.">
          <Textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Bounce rate of 22.4% indicates an unverified list."
          />
        </Field>
      </Modal>
    </div>
  );
}

/* ── Support ──────────────────────────────────────────────────────────── */

export function AdminSupport() {
  const { data, loading } = useAsync(() => api.admin.tickets());
  const [filter, setFilter] = useState("open");
  if (loading) return <Loading rows={7} />;

  const rows = data.filter((t) => filter === "all" || t.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "open", label: "Open" },
            { value: "waiting", label: "Waiting on customer" },
            { value: "resolved", label: "Resolved" },
            { value: "all", label: "All" },
          ]}
        />
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState title="Queue is clear" description="Nothing with that status." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className="w-[38%]">Subject</Th>
                <Th>Account</Th>
                <Th>Plan</Th>
                <Th>Priority</Th>
                <Th>Status</Th>
                <Th className="text-right">Opened</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <Tr key={t.id}>
                  <Td className="font-medium">{t.subject}</Td>
                  <Td className="text-slate">{t.user}</Td>
                  <Td className="capitalize text-slate">{t.plan}</Td>
                  <Td>
                    <Badge status={t.priority === "high" ? "error" : t.priority === "low" ? "draft" : "paused"}>
                      {t.priority}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge status={t.status} />
                  </Td>
                  <Td className="text-right text-[13.5px] text-slate">{relative(t.openedAt)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

/* ── Plans ────────────────────────────────────────────────────────────── */

export function AdminPlans() {
  const [plans, setPlans] = useState(PLANS);
  const toast = useToast();

  const update = (id, patch) =>
    setPlans((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  return (
    <div className="space-y-5">
      <Card className="border-hold/40 bg-hold-soft px-5 py-4">
        <p className="text-[14.5px] leading-relaxed text-slate">
          Changing a price affects new subscribers only. Everyone already paying keeps their rate
          until they change plan themselves — that grandfathering is enforced by the backend, not
          by this screen.
        </p>
      </Card>

      {plans.map((p) => (
        <Card key={p.id} className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[18px] font-semibold">{p.name}</h2>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                await api.admin.savePlan(p.id, p);
                toast(`${p.name} saved`);
              }}
            >
              <Save size={14} /> Save
            </Button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Monthly price (USD)">
              <Input
                type="number"
                value={p.monthly}
                onChange={(e) => update(p.id, { monthly: Number(e.target.value) })}
              />
            </Field>
            <Field label="Yearly price (USD)">
              <Input
                type="number"
                value={p.yearly}
                onChange={(e) => update(p.id, { yearly: Number(e.target.value) })}
              />
            </Field>
            <Field label="Mailbox limit">
              <Input
                type="number"
                value={p.limits.mailboxes}
                onChange={(e) => update(p.id, { limits: { ...p.limits, mailboxes: Number(e.target.value) } })}
              />
            </Field>
            <Field label="Emails a month">
              <Input
                type="number"
                value={p.limits.sendsPerMonth}
                onChange={(e) =>
                  update(p.id, { limits: { ...p.limits, sendsPerMonth: Number(e.target.value) } })
                }
              />
            </Field>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ── Audit log ────────────────────────────────────────────────────────── */

export function AdminAudit() {
  const { data, loading } = useAsync(() => api.admin.auditLog());
  if (loading) return <Loading rows={8} />;

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-rule px-5 py-4">
        <h2 className="text-[16px] font-semibold">Every administrative action</h2>
        <p className="mt-0.5 text-[13px] text-slate">
          Append-only. Entries cannot be edited or removed from this screen or the API.
        </p>
      </div>
      <ul className="divide-y divide-rule">
        {data.map((a) => (
          <li key={a.id} className="px-5 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-[14.5px]">
                <span className="font-medium capitalize">{a.action.replace(/_/g, " ")}</span>
                <span className="text-slate"> — {a.target}</span>
              </p>
              <p className="text-[13px] text-slate-soft">
                {a.actor === "system" ? "Automatic" : a.actor} · {dateTime(a.at)}
              </p>
            </div>
            <p className="mt-1 text-[13.5px] text-slate">{a.note}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ── Platform settings ────────────────────────────────────────────────── */

export function AdminSettings() {
  const { data, loading } = useAsync(() => api.admin.settings());
  const [form, setForm] = useState(null);
  const toast = useToast();

  if (loading) return <Loading rows={7} />;
  const s = form ?? data;
  const set = (patch) => setForm({ ...s, ...patch });

  return (
    <div className="max-w-3xl space-y-5">
      <Card className="p-6">
        <h2 className="text-[17px] font-semibold">Sending limits</h2>
        <p className="mt-1.5 max-w-prose text-[14px] text-slate">
          Platform-wide ceilings. A customer can set something lower for themselves; nobody can go
          above these.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Field label="Max per mailbox, per day">
            <Input
              type="number"
              value={s.sendingCeilingPerMailbox}
              onChange={(e) => set({ sendingCeilingPerMailbox: Number(e.target.value) })}
            />
          </Field>
          <Field label="Bounce ceiling (%)" hint="Campaign auto-pauses above this.">
            <Input
              type="number"
              value={s.bounceRateCeiling}
              onChange={(e) => set({ bounceRateCeiling: Number(e.target.value) })}
            />
          </Field>
          <Field label="Complaint ceiling (%)">
            <Input
              type="number"
              step="0.1"
              value={s.complaintRateCeiling}
              onChange={(e) => set({ complaintRateCeiling: Number(e.target.value) })}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-[17px] font-semibold">Signups and trials</h2>
        <div className="mt-5 space-y-5">
          <Field label="Trial length in days">
            <Input
              type="number"
              value={s.trialDays}
              onChange={(e) => set({ trialDays: Number(e.target.value) })}
              className="max-w-[160px]"
            />
          </Field>
          <Toggle
            label="Accept new signups"
            description="Turning this off hides the signup form and rejects registration requests."
            checked={s.signupsOpen}
            onChange={(v) => set({ signupsOpen: v })}
          />
          <Toggle
            label="Maintenance mode"
            description="Shows a notice to every customer and halts the send processor. Queued emails are not lost."
            checked={s.maintenanceMode}
            onChange={(v) => set({ maintenanceMode: v })}
          />
        </div>
      </Card>

      <Button
        onClick={async () => {
          await api.admin.saveSettings(s);
          toast("Platform settings saved");
        }}
      >
        Save settings
      </Button>
    </div>
  );
}
