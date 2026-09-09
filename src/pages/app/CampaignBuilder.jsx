import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Eye,
  Check,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Clock,
} from "lucide-react";
import {
  Card,
  Button,
  Field,
  Input,
  Textarea,
  Select,
  Checkbox,
  Badge,
  Modal,
  SearchInput,
  Loading,
  StatusDot,
  useToast,
  AirmailRule,
} from "../../components/ui";
import { useAsync } from "../../lib/hooks";
import api from "../../lib/api";
import { num } from "../../lib/format";

const MERGE_TAGS = ["first_name", "last_name", "full_name", "company", "email"];

const STAGES = [
  { id: "basics", label: "Basics" },
  { id: "sequence", label: "Sequence" },
  { id: "mailboxes", label: "Mailboxes" },
  { id: "audience", label: "Audience" },
  { id: "schedule", label: "Schedule" },
  { id: "review", label: "Review" },
];

const BLANK_STEP = () => ({ subject: "", body: "", waitDays: 3 });

export default function CampaignBuilder() {
  const navigate = useNavigate();
  const toast = useToast();
  const [stage, setStage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);

  const [form, setForm] = useState({
    name: "",
    fromName: "",
    steps: [{ subject: "", body: "", waitDays: 0 }],
    mailboxIds: [],
    contactIds: [],
    sendWindow: { days: ["mon", "tue", "wed", "thu", "fri"], start: "09:00", end: "17:00" },
    stopOnReply: true,
    trackList: "all",
  });

  const { data: boxes } = useAsync(() => api.mailboxes.list());
  const { data: contactData } = useAsync(() => api.contacts.list({ status: "active" }));

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const audienceCount = form.contactIds.length;
  const estimatedSends = audienceCount * form.steps.length;
  const dailyCapacity = (boxes || [])
    .filter((b) => form.mailboxIds.includes(b.id))
    .reduce((a, b) => a + b.dailyLimit, 0);
  const daysToFinish = dailyCapacity ? Math.ceil(estimatedSends / dailyCapacity) : null;

  const problems = useMemo(() => {
    const p = [];
    if (!form.name.trim()) p.push("Give the campaign a name.");
    if (form.steps.some((s) => !s.subject.trim() || !s.body.trim()))
      p.push("Every step needs a subject and a body.");
    if (!form.mailboxIds.length) p.push("Choose at least one mailbox to send from.");
    if (!form.contactIds.length) p.push("Select at least one contact.");
    return p;
  }, [form]);

  const save = async (launch) => {
    setSaving(true);
    try {
      const created = await api.campaigns.create({ ...form, status: launch ? "active" : "draft" });
      if (launch) await api.campaigns.launch(created.id);
      toast(launch ? `${form.name} launched` : "Saved as a draft");
      navigate("/app/campaigns");
    } catch (e) {
      toast(e.message || "Could not save the campaign", "stop");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)]">
      {/* stage rail */}
      <nav className="lg:sticky lg:top-24 lg:self-start">
        <ol className="flex gap-1 overflow-x-auto thin-scroll lg:block lg:space-y-0.5">
          {STAGES.map((s, i) => {
            const done = i < stage;
            const here = i === stage;
            return (
              <li key={s.id} className="shrink-0">
                <button
                  onClick={() => setStage(i)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[14px] transition-colors ${
                    here ? "bg-ink text-white" : done ? "text-ink hover:bg-paper-sunk" : "text-slate hover:bg-paper-sunk"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] tnum ${
                      here
                        ? "border-white/40 text-white"
                        : done
                        ? "border-signal bg-signal text-white"
                        : "border-rule text-slate-soft"
                    }`}
                  >
                    {done ? <Check size={11} strokeWidth={3} /> : i + 1}
                  </span>
                  {s.label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="min-w-0 space-y-5">
        {stage === 0 && <Basics form={form} set={set} />}
        {stage === 1 && (
          <Sequence form={form} set={set} onPreview={setPreview} />
        )}
        {stage === 2 && <Mailboxes form={form} set={set} boxes={boxes} />}
        {stage === 3 && <Audience form={form} set={set} contacts={contactData?.rows} />}
        {stage === 4 && <Schedule form={form} set={set} />}
        {stage === 5 && (
          <Review
            form={form}
            problems={problems}
            estimatedSends={estimatedSends}
            dailyCapacity={dailyCapacity}
            daysToFinish={daysToFinish}
            boxes={boxes}
          />
        )}

        {/* footer controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-5">
          <Button
            variant="ghost"
            onClick={() => setStage((s) => Math.max(0, s - 1))}
            disabled={stage === 0}
          >
            <ChevronLeft size={15} /> Back
          </Button>

          <div className="flex gap-2">
            <Button variant="secondary" loading={saving} onClick={() => save(false)}>
              Save draft
            </Button>
            {stage < STAGES.length - 1 ? (
              <Button onClick={() => setStage((s) => s + 1)}>
                Continue <ChevronRight size={15} />
              </Button>
            ) : (
              <Button
                variant="stamp"
                loading={saving}
                disabled={problems.length > 0}
                onClick={() => save(true)}
              >
                Launch campaign
              </Button>
            )}
          </div>
        </div>
      </div>

      <PreviewModal step={preview} onClose={() => setPreview(null)} fromName={form.fromName} />
    </div>
  );
}

/* ── Stage 1: basics ──────────────────────────────────────────────────── */

function Basics({ form, set }) {
  return (
    <Card className="p-6">
      <h2 className="text-[18px] font-semibold">What is this campaign?</h2>
      <p className="mt-1.5 max-w-prose text-[14.5px] text-slate">
        The name is for you — recipients never see it. The sender name is what appears in their
        inbox next to your address.
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Campaign name" hint="Something you will recognise in six months.">
          <Input
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Q3 — UK manufacturing ops leads"
          />
        </Field>
        <Field label="Sender name" hint="Shown as: Sender Name <your@address.com>">
          <Input
            value={form.fromName}
            onChange={(e) => set({ fromName: e.target.value })}
            placeholder="Adaeze at Brightfold"
          />
        </Field>
      </div>
    </Card>
  );
}

/* ── Stage 2: sequence ────────────────────────────────────────────────── */

function Sequence({ form, set, onPreview }) {
  const update = (i, patch) =>
    set({ steps: form.steps.map((s, j) => (i === j ? { ...s, ...patch } : s)) });

  const insertTag = (i, tag) => {
    const step = form.steps[i];
    update(i, { body: `${step.body}{{${tag}}}` });
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-[18px] font-semibold">The sequence</h2>
        <p className="mt-1.5 max-w-prose text-[14.5px] text-slate">
          Each step waits the stated number of days after the previous one. A reply, bounce or
          opt-out cancels every remaining step for that person.
        </p>
      </Card>

      {form.steps.map((step, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule bg-paper px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-white tnum">
                {i + 1}
              </span>
              <span className="text-[14.5px] font-medium">
                {i === 0 ? "Sent on launch" : `Sent ${step.waitDays} days after step ${i}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {i > 0 && (
                <label className="flex items-center gap-2 text-[13px] text-slate">
                  <Clock size={14} />
                  wait
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={step.waitDays}
                    onChange={(e) => update(i, { waitDays: Number(e.target.value) })}
                    className="w-16 rounded border border-rule px-2 py-1 text-[13px] tnum"
                  />
                  days
                </label>
              )}
              <Button size="sm" variant="ghost" onClick={() => onPreview({ ...step, index: i })}>
                <Eye size={14} /> Preview
              </Button>
              {form.steps.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => set({ steps: form.steps.filter((_, j) => j !== i) })}
                  aria-label={`Remove step ${i + 1}`}
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4 p-5">
            <Field label="Subject">
              <Input
                value={step.subject}
                onChange={(e) => update(i, { subject: e.target.value })}
                placeholder={
                  i === 0 ? "quick one about {{company}}'s despatch times" : "Re: your first subject line"
                }
              />
            </Field>
            <Field label="Body">
              <Textarea
                rows={9}
                value={step.body}
                onChange={(e) => update(i, { body: e.target.value })}
                placeholder={"Hi {{first_name}},\n\nI noticed…"}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-slate">Insert:</span>
              {MERGE_TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => insertTag(i, t)}
                  className="rounded-full border border-rule bg-white px-2.5 py-1 text-[12.5px] text-slate transition-colors hover:border-ink/40 hover:text-ink"
                >
                  {`{{${t}}}`}
                </button>
              ))}
            </div>
          </div>
        </Card>
      ))}

      <Button
        variant="secondary"
        onClick={() => set({ steps: [...form.steps, BLANK_STEP()] })}
        className="w-full"
      >
        <Plus size={15} /> Add a follow-up step
      </Button>
    </div>
  );
}

/* ── Stage 3: mailboxes ───────────────────────────────────────────────── */

function Mailboxes({ form, set, boxes }) {
  if (!boxes) return <Loading rows={4} />;
  const toggle = (id) =>
    set({
      mailboxIds: form.mailboxIds.includes(id)
        ? form.mailboxIds.filter((x) => x !== id)
        : [...form.mailboxIds, id],
    });

  const total = boxes
    .filter((b) => form.mailboxIds.includes(b.id))
    .reduce((a, b) => a + b.dailyLimit, 0);

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-rule p-6">
        <h2 className="text-[18px] font-semibold">Send from</h2>
        <p className="mt-1.5 max-w-prose text-[14.5px] text-slate">
          Sends rotate across everything you pick. More mailboxes means more capacity per day and
          less load on any one of them.
        </p>
      </div>

      <ul className="divide-y divide-rule">
        {boxes.map((b) => {
          const on = form.mailboxIds.includes(b.id);
          const broken = b.status === "error";
          return (
            <li
              key={b.id}
              className={`flex flex-wrap items-center justify-between gap-4 px-5 py-4 ${
                broken ? "opacity-55" : ""
              }`}
            >
              <Checkbox
                checked={on}
                onChange={() => !broken && toggle(b.id)}
                label={
                  <span className="flex flex-col">
                    <span className="flex items-center gap-2 text-[14.5px] font-medium">
                      <StatusDot status={b.status} />
                      {b.email}
                    </span>
                    <span className="text-[13px] text-slate">
                      {b.provider === "gmail" ? "Google" : "Microsoft"} · {b.dailyLimit} a day ·
                      warm-up day {b.warmupDay}
                    </span>
                  </span>
                }
              />
              {broken ? (
                <Badge status="error">Needs reconnecting</Badge>
              ) : (
                <span className="text-[13px] text-slate tnum">
                  {b.sentToday}/{b.dailyLimit} used today
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="border-t border-rule bg-paper px-5 py-3.5">
        <p className="text-[14px] text-slate">
          Combined capacity:{" "}
          <span className="font-medium text-ink tnum">{num(total)} emails a day</span>
        </p>
      </div>
    </Card>
  );
}

/* ── Stage 4: audience ────────────────────────────────────────────────── */

function Audience({ form, set, contacts }) {
  const [q, setQ] = useState("");
  if (!contacts) return <Loading rows={6} />;

  const shown = contacts.filter(
    (c) =>
      !q ||
      `${c.firstName} ${c.lastName} ${c.email} ${c.company}`.toLowerCase().includes(q.toLowerCase())
  );
  const allSelected = shown.length > 0 && shown.every((c) => form.contactIds.includes(c.id));

  const toggle = (id) =>
    set({
      contactIds: form.contactIds.includes(id)
        ? form.contactIds.filter((x) => x !== id)
        : [...form.contactIds, id],
    });

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-rule p-6">
        <h2 className="text-[18px] font-semibold">Who receives it</h2>
        <p className="mt-1.5 max-w-prose text-[14.5px] text-slate">
          Suppressed contacts are hidden here and would be skipped even if they were selected.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-rule px-5 py-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search by name, company or address" className="max-w-sm flex-1" />
        <Checkbox
          checked={allSelected}
          onChange={() =>
            set({
              contactIds: allSelected
                ? form.contactIds.filter((id) => !shown.some((c) => c.id === id))
                : [...new Set([...form.contactIds, ...shown.map((c) => c.id)])],
            })
          }
          label={`Select all ${shown.length} shown`}
        />
        <span className="ml-auto text-[13.5px] text-slate tnum">
          {num(form.contactIds.length)} selected
        </span>
      </div>

      <ul className="max-h-[420px] divide-y divide-rule overflow-y-auto thin-scroll">
        {shown.map((c) => (
          <li key={c.id} className="px-5 py-3">
            <Checkbox
              checked={form.contactIds.includes(c.id)}
              onChange={() => toggle(c.id)}
              label={
                <span className="flex flex-col">
                  <span className="text-[14.5px]">
                    {c.firstName} {c.lastName}
                    <span className="text-slate"> · {c.company}</span>
                  </span>
                  <span className="text-[13px] text-slate-soft">{c.email}</span>
                </span>
              }
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ── Stage 5: schedule ────────────────────────────────────────────────── */

const DAYS = [
  ["mon", "Mon"],
  ["tue", "Tue"],
  ["wed", "Wed"],
  ["thu", "Thu"],
  ["fri", "Fri"],
  ["sat", "Sat"],
  ["sun", "Sun"],
];

function Schedule({ form, set }) {
  const w = form.sendWindow;
  const setW = (patch) => set({ sendWindow: { ...w, ...patch } });

  return (
    <Card className="p-6">
      <h2 className="text-[18px] font-semibold">When it is allowed to send</h2>
      <p className="mt-1.5 max-w-prose text-[14.5px] text-slate">
        Sends only happen inside this window, in the recipient's time zone where it is known and
        yours otherwise. Anything queued outside it waits.
      </p>

      <div className="mt-6">
        <p className="label">Days</p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map(([id, label]) => {
            const on = w.days.includes(id);
            return (
              <button
                key={id}
                onClick={() =>
                  setW({ days: on ? w.days.filter((d) => d !== id) : [...w.days, id] })
                }
                className={`rounded-md border px-3.5 py-2 text-[13.5px] transition-colors ${
                  on ? "border-ink bg-ink text-white" : "border-rule bg-white text-slate hover:border-ink/40"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Start">
          <Input type="time" value={w.start} onChange={(e) => setW({ start: e.target.value })} />
        </Field>
        <Field label="Stop">
          <Input type="time" value={w.end} onChange={(e) => setW({ end: e.target.value })} />
        </Field>
      </div>

      <div className="mt-6 space-y-4 border-t border-rule pt-6">
        <Checkbox
          checked={form.stopOnReply}
          onChange={(v) => set({ stopOnReply: v })}
          label="Stop the sequence for anyone who replies"
        />
        <Field label="If a contact is already in another running campaign">
          <Select value={form.trackList} onChange={(e) => set({ trackList: e.target.value })}>
            <option value="all">Send anyway</option>
            <option value="skip">Skip them here</option>
            <option value="wait">Wait until the other campaign finishes</option>
          </Select>
        </Field>
      </div>
    </Card>
  );
}

/* ── Stage 6: review ──────────────────────────────────────────────────── */

function Review({ form, problems, estimatedSends, dailyCapacity, daysToFinish, boxes }) {
  return (
    <div className="space-y-4">
      {problems.length > 0 && (
        <Card className="border-hold/40 bg-hold-soft p-5">
          <div className="flex gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-hold" />
            <div>
              <p className="text-[14.5px] font-medium">Fix these before launching</p>
              <ul className="mt-2 space-y-1 text-[14px] text-slate">
                {problems.map((p) => (
                  <li key={p}>· {p}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <AirmailRule className="h-[5px]" />
        <div className="p-6">
          <h2 className="text-[18px] font-semibold">{form.name || "Untitled campaign"}</h2>
          <p className="mt-1 text-[14px] text-slate">
            From {form.fromName || "your mailbox name"}
          </p>
        </div>
        <dl className="grid divide-y divide-rule border-t border-rule sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 [&>*+*]:sm:border-l [&>*+*]:sm:border-rule">
          {[
            ["Contacts", num(form.contactIds.length)],
            ["Steps", form.steps.length],
            ["Emails at most", num(estimatedSends)],
            ["Capacity a day", num(dailyCapacity)],
          ].map(([k, v]) => (
            <div key={k} className="px-5 py-4">
              <dt className="text-[13px] text-slate">{k}</dt>
              <dd className="mt-1 font-display text-[24px] font-semibold tnum">{v}</dd>
            </div>
          ))}
        </dl>
        {daysToFinish != null && (
          <p className="border-t border-rule bg-paper px-5 py-3.5 text-[14px] text-slate">
            At this capacity the sequence finishes in roughly{" "}
            <span className="font-medium text-ink tnum">{daysToFinish}</span> sending days. Adding
            a mailbox shortens it; raising a daily limit is the riskier way to get there.
          </p>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-[16px] font-semibold">Sending from</h3>
        <ul className="mt-3 space-y-2">
          {(boxes || [])
            .filter((b) => form.mailboxIds.includes(b.id))
            .map((b) => (
              <li key={b.id} className="flex items-center gap-2 text-[14px] text-slate">
                <StatusDot status={b.status} /> {b.email}{" "}
                <span className="text-slate-soft tnum">· {b.dailyLimit}/day</span>
              </li>
            ))}
          {form.mailboxIds.length === 0 && (
            <li className="text-[14px] text-slate-soft">Nothing selected yet.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}

/* ── Preview ──────────────────────────────────────────────────────────── */

function PreviewModal({ step, onClose, fromName }) {
  if (!step) return null;
  const sample = { first_name: "Marcus", last_name: "Bello", full_name: "Marcus Bello", company: "Halden Logistics", email: "marcus.bello@halden.com" };
  const fill = (t = "") => t.replace(/\{\{(\w+)\}\}/g, (_, k) => sample[k] ?? `{{${k}}}`);

  return (
    <Modal
      open
      onClose={onClose}
      width="max-w-2xl"
      title={`Step ${step.index + 1} preview`}
      description="Rendered against a sample contact, including the footer every message carries."
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <div className="rounded-card border border-rule bg-white">
        <div className="border-b border-rule px-5 py-3.5">
          <p className="text-[13px] text-slate">
            From <span className="text-ink">{fromName || "Your Name"}</span> &lt;you@company.com&gt;
          </p>
          <p className="text-[13px] text-slate">
            To <span className="text-ink">{sample.full_name}</span> &lt;{sample.email}&gt;
          </p>
          <p className="mt-1.5 text-[15px] font-medium">{fill(step.subject) || "(no subject)"}</p>
        </div>
        <div className="whitespace-pre-wrap px-5 py-5 text-[14.5px] leading-relaxed text-ink">
          {fill(step.body) || "(empty body)"}
        </div>
        <div className="border-t border-rule bg-paper px-5 py-4 text-center text-[12px] text-slate-soft">
          You received this because you are on our outreach list.
          <br />
          <span className="underline">Unsubscribe</span> · Brightfold Studio, Lagos, Nigeria
        </div>
      </div>
    </Modal>
  );
}
