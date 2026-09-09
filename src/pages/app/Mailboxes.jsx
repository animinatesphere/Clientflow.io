import { useState } from "react";
import { Plus, AlertTriangle, Trash2, ShieldCheck, ShieldAlert } from "lucide-react";
import {
  Card,
  Button,
  Badge,
  Meter,
  Modal,
  Field,
  Input,
  Loading,
  EmptyState,
  StatusDot,
  useToast,
} from "../../components/ui";
import { useAsync } from "../../lib/hooks";
import api from "../../lib/api";
import { fullDate, num } from "../../lib/format";

const PROVIDERS = [
  {
    id: "google",
    name: "Google",
    detail: "Gmail and Google Workspace",
    note: "You will be sent to Google's own consent screen. ClientFlow receives a token, never your password.",
  },
  {
    id: "microsoft",
    name: "Microsoft",
    detail: "Outlook.com and Microsoft 365",
    note: "Same flow through Microsoft. Revoke access from your account settings at any time.",
  },
  {
    id: "smtp",
    name: "Any other provider",
    detail: "SMTP and IMAP",
    note: "For providers without an API. Reply detection uses IMAP, which is slower to notice a response.",
  },
];

/* Illustrative DNS results for the demo. In production these come from the
   backend's weekly domain check. */
const DNS = [
  { record: "SPF", state: "pass", detail: "Includes your provider's sending servers" },
  { record: "DKIM", state: "pass", detail: "Signing is enabled on brightfold.co" },
  { record: "DMARC", state: "warn", detail: "Policy is p=none — receivers are told to do nothing on failure" },
  { record: "MX", state: "pass", detail: "Domain accepts mail as well as sending it" },
];

export default function Mailboxes() {
  const { data, loading, reload } = useAsync(() => api.mailboxes.list());
  const [connectOpen, setConnectOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const toast = useToast();

  if (loading) return <Loading rows={6} />;

  const boxes = data ?? [];
  const capacity = boxes.filter((b) => b.status !== "error").reduce((a, b) => a + b.dailyLimit, 0);
  const usedToday = boxes.reduce((a, b) => a + b.sentToday, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[14px] text-slate">
            <span className="font-medium text-ink tnum">{num(usedToday)}</span> of{" "}
            <span className="tnum">{num(capacity)}</span> sends used today across{" "}
            {boxes.length} mailboxes
          </p>
        </div>
        <Button onClick={() => setConnectOpen(true)}>
          <Plus size={15} /> Connect a mailbox
        </Button>
      </div>

      {boxes.length === 0 ? (
        <Card>
          <EmptyState
            title="No mailboxes connected"
            description="ClientFlow sends through accounts you own, so recipients see your real address. Connect one to start."
            action={<Button onClick={() => setConnectOpen(true)}>Connect a mailbox</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {boxes.map((b) => {
            const broken = b.status === "error";
            return (
              <Card key={b.id} className={`overflow-hidden ${broken ? "border-stamp/40" : ""}`}>
                <div className="flex items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[15.5px] font-medium">
                      <StatusDot status={b.status} pulse={b.status === "active"} />
                      <span className="truncate">{b.email}</span>
                    </p>
                    <p className="mt-1 text-[13.5px] text-slate">
                      {b.provider === "gmail" ? "Google" : "Microsoft"} · {b.displayName} ·
                      connected {fullDate(b.connectedAt)}
                    </p>
                  </div>
                  <Badge status={b.status} />
                </div>

                {broken && (
                  <div className="flex items-start gap-2.5 border-y border-stamp/20 bg-stamp-soft px-5 py-3">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-stamp" />
                    <div>
                      <p className="text-[13.5px] text-ink">{b.errorMessage}</p>
                      <Button size="sm" variant="stamp" className="mt-2.5">
                        Reconnect
                      </Button>
                    </div>
                  </div>
                )}

                <dl className="grid grid-cols-3 divide-x divide-rule border-t border-rule">
                  <div className="px-4 py-3">
                    <dt className="text-[12.5px] text-slate">Today</dt>
                    <dd className="mt-0.5 text-[15px] font-medium tnum">
                      {b.sentToday}/{b.dailyLimit}
                    </dd>
                  </div>
                  <div className="px-4 py-3">
                    <dt className="text-[12.5px] text-slate">Warm-up</dt>
                    <dd className="mt-0.5 text-[15px] font-medium tnum">day {b.warmupDay}</dd>
                  </div>
                  <div className="px-4 py-3">
                    <dt className="text-[12.5px] text-slate">Health</dt>
                    <dd
                      className={`mt-0.5 text-[15px] font-medium tnum ${
                        b.health > 85 ? "text-signal" : b.health > 60 ? "text-hold" : "text-stamp"
                      }`}
                    >
                      {b.health}%
                    </dd>
                  </div>
                </dl>

                <div className="border-t border-rule px-5 py-4">
                  <Meter
                    value={b.sentToday}
                    max={b.dailyLimit}
                    tone={broken ? "stop" : b.sentToday >= b.dailyLimit ? "hold" : "signal"}
                    label={
                      b.sentToday >= b.dailyLimit
                        ? "At the ceiling — the queue resumes at midnight"
                        : `${b.dailyLimit - b.sentToday} sends left today`
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-rule bg-paper px-5 py-3">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(b)}>
                    Change daily limit
                  </Button>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await api.mailboxes.update(b.id, {
                          status: b.status === "paused" ? "active" : "paused",
                        });
                        toast(b.status === "paused" ? "Mailbox resumed" : "Mailbox paused");
                        reload();
                      }}
                    >
                      {b.status === "paused" ? "Resume" : "Pause"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await api.mailboxes.remove(b.id);
                        toast("Mailbox disconnected", "stop");
                        reload();
                      }}
                      aria-label="Disconnect"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* domain health */}
      <Card className="overflow-hidden">
        <div className="border-b border-rule px-5 py-4">
          <h2 className="text-[16px] font-semibold">Domain records — brightfold.co</h2>
          <p className="mt-1 text-[13.5px] text-slate">
            Re-checked weekly. ClientFlow reads these; you publish them in your DNS.
          </p>
        </div>
        <ul className="divide-y divide-rule">
          {DNS.map((d) => (
            <li key={d.record} className="flex items-start gap-3.5 px-5 py-3.5">
              {d.state === "pass" ? (
                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-signal" />
              ) : (
                <ShieldAlert size={17} className="mt-0.5 shrink-0 text-hold" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-medium">{d.record}</p>
                <p className="mt-0.5 text-[13.5px] text-slate">{d.detail}</p>
              </div>
              <Badge status={d.state === "pass" ? "active" : "paused"}>
                {d.state === "pass" ? "Passing" : "Needs work"}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>

      <ConnectModal open={connectOpen} onClose={() => setConnectOpen(false)} />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Daily send limit"
        description={editing?.email}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await api.mailboxes.update(editing.id, { dailyLimit: editing.dailyLimit });
                toast("Daily limit updated");
                setEditing(null);
                reload();
              }}
            >
              Save limit
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <Field
              label="Emails a day"
              hint="Your provider has its own ceiling on top of this. Raising it faster than your warm-up schedule is the most common cause of a burned domain."
            >
              <Input
                type="number"
                min={1}
                max={200}
                value={editing.dailyLimit}
                onChange={(e) => setEditing({ ...editing, dailyLimit: Number(e.target.value) })}
              />
            </Field>
            {editing.dailyLimit > 60 && (
              <Card className="border-hold/40 bg-hold-soft px-4 py-3">
                <p className="text-[13.5px] text-slate">
                  Above 60 a day from a single mailbox is aggressive for cold outreach. Consider
                  connecting another mailbox instead of raising this one.
                </p>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function ConnectModal({ open, onClose }) {
  const toast = useToast();
  const go = async (id) => {
    const r = await api.mailboxes.connectUrl(id);
    if (r?.url) {
      window.location.href = r.url;
    } else {
      toast("Demo mode — no provider is contacted", "hold");
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Connect a mailbox"
      description="Sends go through your own account, so recipients see your real address."
      width="max-w-lg"
    >
      <ul className="space-y-3">
        {PROVIDERS.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => go(p.id)}
              className="w-full rounded-card border border-rule bg-white p-4 text-left transition-colors hover:border-ink/40"
            >
              <p className="text-[15px] font-medium">{p.name}</p>
              <p className="mt-0.5 text-[13.5px] text-slate">{p.detail}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-soft">{p.note}</p>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
