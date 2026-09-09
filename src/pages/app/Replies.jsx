import { useState } from "react";
import { RefreshCw, Inbox, Reply as ReplyIcon, Ban } from "lucide-react";
import {
  Card,
  Button,
  Badge,
  Segmented,
  SearchInput,
  Loading,
  EmptyState,
  Avatar,
  useToast,
} from "../../components/ui";
import { useAsync } from "../../lib/hooks";
import api from "../../lib/api";
import { relative, dateTime } from "../../lib/format";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "positive", label: "Interested" },
  { value: "later", label: "Not now" },
  { value: "referral", label: "Referred on" },
  { value: "unsubscribe", label: "Opt-outs" },
];

const OUTCOMES = [
  { value: "positive", label: "Interested" },
  { value: "later", label: "Not now" },
  { value: "referral", label: "Referred on" },
  { value: "negative", label: "Not relevant" },
];

export default function Replies() {
  const { data, loading, reload } = useAsync(() => api.replies.list());
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);
  const [checking, setChecking] = useState(false);
  const toast = useToast();

  if (loading) return <Loading rows={7} />;

  const rows = (data ?? []).filter((r) => {
    const matchQ =
      !q || `${r.contactName} ${r.company} ${r.contactEmail} ${r.body}`.toLowerCase().includes(q.toLowerCase());
    const matchF =
      filter === "all" ||
      (filter === "unread" ? !r.read : r.sentiment === filter);
    return matchQ && matchF;
  });

  const check = async () => {
    setChecking(true);
    const r = await api.replies.check();
    setChecking(false);
    toast(r.found ? `${r.found} new replies found` : "No new replies");
    reload();
  };

  const tag = async (id, sentiment) => {
    await api.replies.update(id, { sentiment });
    toast(`Marked as ${OUTCOMES.find((o) => o.value === sentiment)?.label.toLowerCase()}`);
    reload();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented options={FILTERS} value={filter} onChange={setFilter} />
        <div className="flex flex-1 justify-end gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search replies" className="w-full max-w-xs" />
          <Button variant="secondary" loading={checking} onClick={check}>
            <RefreshCw size={15} /> Check now
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={q || filter !== "all" ? "Nothing here" : "No replies yet"}
            description={
              q || filter !== "all"
                ? "Try a different filter."
                : "Replies from every connected mailbox land here. ClientFlow checks every ten minutes."
            }
          />
        ) : (
          <ul className="divide-y divide-rule">
            {rows.map((r) => {
              const open = openId === r.id;
              return (
                <li key={r.id} className={!r.read ? "bg-route-soft/40" : ""}>
                  <button
                    onClick={() => setOpenId(open ? null : r.id)}
                    className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-paper"
                    aria-expanded={open}
                  >
                    <Avatar name={r.contactName} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className={`text-[15px] ${r.read ? "font-medium" : "font-semibold"}`}>
                          {r.contactName}
                        </span>
                        <span className="text-[13.5px] text-slate">{r.company}</span>
                        <Badge status={r.sentiment} />
                        {!r.read && <Badge tone="info">New</Badge>}
                      </div>
                      <p className="mt-1 text-[13.5px] text-slate">
                        {r.subject} · {r.campaignName} · step {r.stepIndex + 1}
                      </p>
                      <p
                        className={`mt-1.5 text-[14px] text-slate ${open ? "" : "line-clamp-1"}`}
                      >
                        {r.body}
                      </p>
                    </div>
                    <span className="shrink-0 text-[13px] text-slate-soft">{relative(r.repliedAt)}</span>
                  </button>

                  {open && (
                    <div className="border-t border-rule bg-paper px-5 py-4 sm:pl-[70px]">
                      <div className="rounded-card border border-rule bg-white p-4">
                        <p className="text-[13px] text-slate">
                          {r.contactName} &lt;{r.contactEmail}&gt; · {dateTime(r.repliedAt)}
                        </p>
                        <p className="mt-3 whitespace-pre-wrap text-[14.5px] leading-relaxed">
                          {r.body}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button size="sm" as="a" href={`mailto:${r.contactEmail}?subject=${encodeURIComponent(r.subject)}`}>
                          <ReplyIcon size={14} /> Reply in your mail app
                        </Button>
                        <span className="mx-1 hidden h-5 w-px bg-rule sm:block" />
                        {OUTCOMES.map((o) => (
                          <Button
                            key={o.value}
                            size="sm"
                            variant={r.sentiment === o.value ? "primary" : "secondary"}
                            onClick={() => tag(r.id, o.value)}
                          >
                            {o.label}
                          </Button>
                        ))}
                        <Button
                          size="sm"
                          variant="danger"
                          className="ml-auto"
                          onClick={async () => {
                            await api.suppression.add(r.contactEmail, "manual");
                            toast(`${r.contactEmail} suppressed`, "stop");
                            reload();
                          }}
                        >
                          <Ban size={14} /> Suppress
                        </Button>
                      </div>

                      <p className="mt-3 text-[13px] text-slate-soft">
                        This contact's remaining sequence steps were cancelled automatically when
                        they replied.
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
