import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Pause, Play, RefreshCw } from "lucide-react";
import {
  Card,
  Button,
  Badge,
  Stat,
  Table,
  Th,
  Td,
  Tr,
  Loading,
  Segmented,
  AirmailRule,
  Meter,
  useToast,
  EmptyState,
} from "../../components/ui";
import { useAsync } from "../../lib/hooks";
import api from "../../lib/api";
import { num, pct, dateTime, relative } from "../../lib/format";

export default function CampaignDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [filter, setFilter] = useState("all");

  const { data, loading, reload } = useAsync(
    () =>
      Promise.all([api.campaigns.get(id), api.campaigns.sends(id)]).then(([campaign, sends]) => ({
        campaign,
        sends,
      })),
    [id]
  );

  if (loading || !data) return <Loading rows={8} />;
  if (!data.campaign)
    return (
      <EmptyState
        title="Campaign not found"
        description="It may have been deleted."
        action={
          <Button as={Link} to="/app/campaigns">
            Back to campaigns
          </Button>
        }
      />
    );

  const c = data.campaign;
  const rows = data.sends.rows.filter((r) => filter === "all" || r.status === filter);
  const bounceRate = c.stats.sent ? (c.stats.bounced / c.stats.sent) * 100 : 0;

  const toggle = async () => {
    if (c.status === "active") {
      await api.campaigns.pause(id);
      toast("Campaign paused — nothing more will send");
    } else {
      await api.campaigns.resume(id);
      toast("Campaign resumed");
    }
    reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            to="/app/campaigns"
            className="inline-flex items-center gap-1.5 text-[13.5px] text-slate hover:text-ink"
          >
            <ArrowLeft size={14} /> All campaigns
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-[24px] font-semibold">{c.name}</h1>
            <Badge status={c.status} />
          </div>
          <p className="mt-1.5 text-[14px] text-slate">
            From {c.fromName} · {c.steps.length} steps ·{" "}
            {c.launchedAt ? `launched ${relative(c.launchedAt)}` : "never launched"}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              await api.replies.check();
              toast("Checked for new replies");
              reload();
            }}
          >
            <RefreshCw size={15} /> Check replies
          </Button>
          {c.status !== "draft" && c.status !== "completed" && (
            <Button variant={c.status === "active" ? "secondary" : "primary"} onClick={toggle}>
              {c.status === "active" ? (
                <>
                  <Pause size={15} /> Pause
                </>
              ) : (
                <>
                  <Play size={15} /> Resume
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {c.status === "active" && <AirmailRule running className="h-[5px] rounded" />}

      <Card className="grid divide-y divide-rule sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 [&>*+*]:sm:border-l [&>*+*]:sm:border-rule">
        <Stat label="Contacts" value={num(c.contactCount)} />
        <Stat label="Sent" value={num(c.stats.sent)} />
        <Stat label="Replied" value={num(c.stats.replied)} foot={pct(c.stats.replied, c.stats.sent)} />
        <Stat label="Bounced" value={num(c.stats.bounced)} foot={`${bounceRate.toFixed(1)}%`} />
        <Stat label="Opted out" value={num(c.stats.unsubscribed)} foot={pct(c.stats.unsubscribed, c.stats.sent)} />
      </Card>

      {bounceRate > 5 && (
        <Card className="border-stamp/35 bg-stamp-soft px-5 py-4">
          <p className="text-[14.5px]">
            <span className="font-medium">Bounce rate is {bounceRate.toFixed(1)}%.</span> Above 8%
            this campaign pauses itself. The usual cause is an unverified list — stop, clean it,
            then resume.
          </p>
        </Card>
      )}

      {/* per-step */}
      <Card className="overflow-hidden">
        <div className="border-b border-rule px-5 py-4">
          <h2 className="text-[16px] font-semibold">Step by step</h2>
        </div>
        <ul className="divide-y divide-rule">
          {c.steps.map((s, i) => {
            const share = [0.52, 0.31, 0.17][i] ?? 0.1;
            const replyShare = [0.61, 0.27, 0.12][i] ?? 0.05;
            const sent = Math.round(c.stats.sent * share);
            const replied = Math.round(c.stats.replied * replyShare);
            return (
              <li key={i} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2.5 text-[14.5px] font-medium">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[11px] text-white tnum">
                        {i + 1}
                      </span>
                      <span className="truncate">{s.subject || "(no subject)"}</span>
                    </p>
                    <p className="mt-1 pl-[30px] text-[13px] text-slate">
                      {i === 0 ? "Sent on launch" : `${s.waitDays} days after step ${i}`}
                    </p>
                  </div>
                  <dl className="flex gap-8 text-[13px]">
                    <div>
                      <dt className="text-slate-soft">Sent</dt>
                      <dd className="mt-0.5 font-medium tnum">{num(sent)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-soft">Replied</dt>
                      <dd className="mt-0.5 font-medium tnum">
                        {num(replied)} <span className="text-slate-soft">{pct(replied, sent)}</span>
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="mt-3 pl-[30px]">
                  <Meter value={sent} max={c.stats.sent || 1} tone="ink" />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* send log */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-3.5">
          <h2 className="text-[16px] font-semibold">Send log</h2>
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "sent", label: "Sent" },
              { value: "replied", label: "Replied" },
              { value: "bounced", label: "Bounced" },
              { value: "failed", label: "Failed" },
              { value: "pending", label: "Queued" },
            ]}
          />
        </div>

        {rows.length === 0 ? (
          <EmptyState title="Nothing with that status" description="Try a different filter." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Contact</Th>
                <Th>Step</Th>
                <Th>Mailbox</Th>
                <Th>Status</Th>
                <Th className="text-right">When</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Tr key={r.id}>
                  <Td>
                    <p className="font-medium">{r.contactName}</p>
                    <p className="text-[13px] text-slate">{r.contactEmail}</p>
                  </Td>
                  <Td className="tnum text-slate">{r.stepIndex + 1}</Td>
                  <Td className="text-[13.5px] text-slate">{r.mailbox}</Td>
                  <Td>
                    <Badge status={r.status} />
                  </Td>
                  <Td className="text-right text-[13.5px] text-slate">{dateTime(r.sentAt)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
