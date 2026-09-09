import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Plus, Ban, Trash2, Download } from "lucide-react";
import {
  Card,
  Button,
  Badge,
  Stat,
  Modal,
  Field,
  Input,
  Select,
  SearchInput,
  Segmented,
  Table,
  Th,
  Td,
  Tr,
  Loading,
  EmptyState,
  useToast,
} from "../../components/ui";
import { useAsync } from "../../lib/hooks";
import api from "../../lib/api";
import { num, pct, fullDate } from "../../lib/format";

const CHART_FONT = { fontSize: 11, fill: "#8A929D" };
const TIP = {
  border: "1px solid #DBDDD6",
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "'Instrument Sans', system-ui",
};

/* ── Suppression ──────────────────────────────────────────────────────── */

const REASONS = [
  { value: "all", label: "All" },
  { value: "unsubscribed", label: "Opted out" },
  { value: "bounced", label: "Bounced" },
  { value: "complained", label: "Complained" },
  { value: "manual", label: "Added by you" },
];

export function Suppression() {
  const { data, loading, reload } = useAsync(() => api.suppression.list());
  const [q, setQ] = useState("");
  const [reason, setReason] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ email: "", reason: "manual" });
  const toast = useToast();

  if (loading) return <Loading rows={6} />;
  const all = data ?? [];
  const rows = all.filter(
    (s) =>
      (reason === "all" || s.reason === reason) &&
      (!q || s.email.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      <Card className="border-ink bg-ink px-5 py-4">
        <p className="text-[14.5px] text-white/80">
          Every address here is checked before each send, across every campaign. Removing someone
          from this list puts them back in play — do it only when they have asked to hear from you
          again.
        </p>
      </Card>

      <Card className="grid divide-y divide-rule sm:grid-cols-4 sm:divide-y-0 [&>*+*]:sm:border-l [&>*+*]:sm:border-rule">
        {[
          ["Total suppressed", all.length],
          ["Opted out", all.filter((s) => s.reason === "unsubscribed").length],
          ["Bounced", all.filter((s) => s.reason === "bounced").length],
          ["Complained", all.filter((s) => s.reason === "complained").length],
        ].map(([k, v]) => (
          <Stat key={k} label={k} value={num(v)} />
        ))}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented options={REASONS} value={reason} onChange={setReason} />
        <div className="flex flex-1 justify-end gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search addresses" className="w-full max-w-xs" />
          <Button variant="secondary">
            <Download size={15} /> Export
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={15} /> Add address
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={Ban}
            title={q || reason !== "all" ? "Nothing matches" : "Nobody is suppressed"}
            description="Opt-outs, hard bounces and complaints are added here automatically."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className="w-[40%]">Address</Th>
                <Th>Reason</Th>
                <Th>Campaign</Th>
                <Th className="text-right">Added</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <Tr key={s.id}>
                  <Td className="font-medium">{s.email}</Td>
                  <Td>
                    <Badge status={s.reason === "unsubscribed" ? "unsubscribe" : s.reason} />
                  </Td>
                  <Td className="text-[13.5px] text-slate">{s.campaignName ?? "—"}</Td>
                  <Td className="text-right text-[13.5px] text-slate">{fullDate(s.addedAt)}</Td>
                  <Td className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await api.suppression.remove(s.email);
                        toast(`${s.email} removed from the suppression list`, "hold");
                        reload();
                      }}
                      aria-label={`Remove ${s.email}`}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Suppress an address"
        description="They will never receive another email from any of your campaigns."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!form.email}
              onClick={async () => {
                await api.suppression.add(form.email, form.reason);
                toast(`${form.email} suppressed`);
                setForm({ email: "", reason: "manual" });
                setAddOpen(false);
                reload();
              }}
            >
              Add to list
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Email address">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="someone@company.com"
            />
          </Field>
          <Field label="Reason" hint="Kept for your own records and for audit.">
            <Select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
              <option value="manual">Added by me</option>
              <option value="unsubscribed">Asked to be removed</option>
              <option value="complained">Complained</option>
              <option value="bounced">Address does not exist</option>
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}

/* ── Analytics ────────────────────────────────────────────────────────── */

export function Analytics() {
  const { data, loading } = useAsync(() => api.analytics.overview());
  const [range, setRange] = useState("14d");

  if (loading || !data) return <Loading rows={8} />;

  const totals = data.campaigns.reduce(
    (a, c) => ({
      sent: a.sent + c.stats.sent,
      replied: a.replied + c.stats.replied,
      bounced: a.bounced + c.stats.bounced,
      positive: a.positive + (c.stats.positive || 0),
    }),
    { sent: 0, replied: 0, bounced: 0, positive: 0 }
  );

  const byCampaign = data.campaigns
    .filter((c) => c.stats.sent > 0)
    .map((c) => ({
      name: c.name.length > 22 ? `${c.name.slice(0, 22)}…` : c.name,
      replyRate: Number(((c.stats.replied / c.stats.sent) * 100).toFixed(2)),
      bounceRate: Number(((c.stats.bounced / c.stats.sent) * 100).toFixed(2)),
    }));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Segmented
          value={range}
          onChange={setRange}
          options={[
            { value: "7d", label: "7 days" },
            { value: "14d", label: "14 days" },
            { value: "30d", label: "30 days" },
          ]}
        />
      </div>

      <Card className="grid divide-y divide-rule sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 [&>*+*]:sm:border-l [&>*+*]:sm:border-rule">
        <Stat label="Emails sent" value={num(totals.sent)} />
        <Stat label="Reply rate" value={pct(totals.replied, totals.sent)} foot={`${num(totals.replied)} replies`} />
        <Stat label="Interested" value={num(totals.positive)} foot={pct(totals.positive, totals.replied) + " of replies"} />
        <Stat label="Bounce rate" value={pct(totals.bounced, totals.sent)} foot="Keep this under 3%" />
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-rule px-5 py-4">
          <h2 className="text-[16px] font-semibold">Volume over time</h2>
        </div>
        <div className="h-[300px] px-2 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.series} margin={{ top: 4, right: 16, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="#DBDDD6" vertical={false} />
              <XAxis dataKey="date" tick={CHART_FONT} tickLine={false} axisLine={{ stroke: "#DBDDD6" }} />
              <YAxis tick={CHART_FONT} tickLine={false} axisLine={false} width={44} />
              <Tooltip contentStyle={TIP} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Line type="monotone" dataKey="sent" name="Sent" stroke="#0E1B2A" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="replied" name="Replied" stroke="#1B4B8F" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="bounced" name="Bounced" stroke="#D0342C" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-rule px-5 py-4">
          <h2 className="text-[16px] font-semibold">Reply and bounce rate by campaign</h2>
          <p className="mt-1 text-[13.5px] text-slate">
            A campaign with a high bounce rate is damaging the campaigns beside it.
          </p>
        </div>
        <div className="h-[300px] px-2 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCampaign} margin={{ top: 4, right: 16, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="#DBDDD6" vertical={false} />
              <XAxis dataKey="name" tick={CHART_FONT} tickLine={false} axisLine={{ stroke: "#DBDDD6" }} />
              <YAxis tick={CHART_FONT} tickLine={false} axisLine={false} width={44} unit="%" />
              <Tooltip contentStyle={TIP} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="replyRate" name="Reply rate" fill="#1B4B8F" radius={[3, 3, 0, 0]} />
              <Bar dataKey="bounceRate" name="Bounce rate" fill="#D0342C" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
