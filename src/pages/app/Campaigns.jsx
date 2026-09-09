import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Send, Play, Pause, Trash2, MoreHorizontal, Copy } from "lucide-react";
import {
  Card,
  Button,
  Badge,
  Segmented,
  SearchInput,
  Table,
  Th,
  Td,
  Tr,
  Loading,
  EmptyState,
  AirmailRule,
  Modal,
  useToast,
} from "../../components/ui";
import { useAsync, useDismiss } from "../../lib/hooks";
import api from "../../lib/api";
import { num, pct, relative } from "../../lib/format";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Running" },
  { value: "paused", label: "Paused" },
  { value: "draft", label: "Drafts" },
  { value: "completed", label: "Finished" },
];

export default function Campaigns() {
  const { data, loading, reload } = useAsync(() => api.campaigns.list());
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const toast = useToast();

  const rows = useMemo(() => {
    if (!data) return [];
    return data.filter(
      (c) =>
        (filter === "all" || c.status === filter) &&
        (!q || c.name.toLowerCase().includes(q.toLowerCase()))
    );
  }, [data, filter, q]);

  const act = async (fn, message) => {
    await fn();
    toast(message);
    reload();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented options={FILTERS} value={filter} onChange={setFilter} />
        <div className="flex flex-1 justify-end gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search campaigns" className="w-full max-w-xs" />
          <Button as={Link} to="/app/campaigns/new">
            New campaign
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <Loading rows={6} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Send}
            title={q || filter !== "all" ? "Nothing matches that" : "No campaigns yet"}
            description={
              q || filter !== "all"
                ? "Try a different filter or clear the search."
                : "A campaign is a sequence of emails sent to a list from the mailboxes you choose."
            }
            action={
              q || filter !== "all" ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQ("");
                    setFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button as={Link} to="/app/campaigns/new">
                  Create your first campaign
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className="w-[34%]">Campaign</Th>
                <Th>Status</Th>
                <Th className="text-right">Contacts</Th>
                <Th className="text-right">Sent</Th>
                <Th className="text-right">Replies</Th>
                <Th className="text-right">Bounce</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const bounce = c.stats.sent ? (c.stats.bounced / c.stats.sent) * 100 : 0;
                return (
                  <Tr key={c.id}>
                    <Td className="relative">
                      {c.status === "active" && (
                        <AirmailRule running className="absolute inset-x-0 top-0 h-[2px]" />
                      )}
                      <Link to={`/app/campaigns/${c.id}`} className="block">
                        <p className="font-medium">{c.name}</p>
                        <p className="mt-0.5 text-[13px] text-slate">
                          {c.steps.length} step{c.steps.length > 1 ? "s" : ""} ·{" "}
                          {c.launchedAt ? `launched ${relative(c.launchedAt)}` : `created ${relative(c.createdAt)}`}
                        </p>
                      </Link>
                    </Td>
                    <Td>
                      <Badge status={c.status} />
                    </Td>
                    <Td className="text-right tnum text-slate">{num(c.contactCount)}</Td>
                    <Td className="text-right tnum">{num(c.stats.sent)}</Td>
                    <Td className="text-right tnum">
                      {num(c.stats.replied)}
                      <span className="ml-1.5 text-[12.5px] text-slate-soft">
                        {pct(c.stats.replied, c.stats.sent)}
                      </span>
                    </Td>
                    <Td className={`text-right tnum ${bounce > 5 ? "text-stamp" : "text-slate"}`}>
                      {bounce.toFixed(1)}%
                    </Td>
                    <Td className="text-right">
                      <RowMenu
                        campaign={c}
                        onLaunch={() => act(() => api.campaigns.launch(c.id), `${c.name} launched`)}
                        onPause={() => act(() => api.campaigns.pause(c.id), `${c.name} paused`)}
                        onResume={() => act(() => api.campaigns.resume(c.id), `${c.name} resumed`)}
                        onDelete={() => setConfirmDelete(c)}
                      />
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title={`Delete "${confirmDelete?.name}"?`}
        description="This removes the campaign and its entire send history."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Keep it
            </Button>
            <Button
              variant="stamp"
              onClick={async () => {
                await api.campaigns.remove(confirmDelete.id);
                toast(`${confirmDelete.name} deleted`, "stop");
                setConfirmDelete(null);
                reload();
              }}
            >
              Delete campaign
            </Button>
          </>
        }
      >
        <p className="text-[15px] leading-relaxed text-slate">
          Pending sends are cancelled immediately. Contacts stay in your list and anyone already
          suppressed stays suppressed — deleting a campaign never puts someone back into play.
        </p>
      </Modal>
    </div>
  );
}

function RowMenu({ campaign, onLaunch, onPause, onResume, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));

  const items = [
    campaign.status === "draft" && { label: "Launch", icon: Play, onClick: onLaunch },
    campaign.status === "active" && { label: "Pause", icon: Pause, onClick: onPause },
    campaign.status === "paused" && { label: "Resume", icon: Play, onClick: onResume },
    { label: "Duplicate", icon: Copy, onClick: () => {} },
    { label: "Delete", icon: Trash2, onClick: onDelete, danger: true },
  ].filter(Boolean);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded p-1.5 text-slate hover:bg-paper-sunk hover:text-ink"
        aria-label="Campaign actions"
      >
        <MoreHorizontal size={17} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-card border border-rule bg-white py-1 shadow-lift">
          {items.map((i) => (
            <button
              key={i.label}
              onClick={() => {
                setOpen(false);
                i.onClick();
              }}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[14px] hover:bg-paper ${
                i.danger ? "text-stamp" : "text-slate hover:text-ink"
              }`}
            >
              <i.icon size={15} /> {i.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
