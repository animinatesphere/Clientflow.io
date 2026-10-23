import { Link, useNavigate } from "react-router-dom";
import { Pin, MessagesSquare, Inbox, Send, ArrowUpRight, MessageCircle } from "lucide-react";
import { Card, Badge, Button, Meter, Loading, EmptyState, Avatar, AirmailRule } from "../../components/ui";
import { channelTitle } from "../../components/app/Chat";
import { useAsync } from "../../lib/hooks";
import { useAuth, hasTeamChat } from "../../lib/auth";
import api from "../../lib/api";
import { num, pct, relative } from "../../lib/format";

const SENTIMENT_LABEL = {
  positive: "Interested",
  referral: "Referred on",
  later: "Not now",
  negative: "Not relevant",
  unsubscribe: "Opted out",
};

/* What a worker sees on sign-in: only the campaigns they were assigned, the
   replies on those campaigns, and their team. No company-wide revenue,
   billing, or mailbox settings. */
export default function WorkerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const chatOn = hasTeamChat(user);

  const { data, loading } = useAsync(() =>
    Promise.all([
      api.analytics.overview(),
      api.replies.list(),
      api.team.list(),
      chatOn ? api.chat.channels(user.id) : [],
    ]).then(([overview, replies, team, channels]) => ({ overview, replies, team, channels }))
  );

  if (loading || !data) return <Loading rows={8} />;

  const mine = new Set(user.campaignIds || []);
  const campaigns = data.overview.campaigns.filter((c) => mine.has(c.id));
  const replies = data.replies.filter((r) => mine.has(r.campaignId));
  const toAnswer = replies.filter((r) => !r.read);
  const totals = campaigns.reduce(
    (a, c) => ({ sent: a.sent + c.stats.sent, replied: a.replied + c.stats.replied, positive: a.positive + c.stats.positive }),
    { sent: 0, replied: 0, positive: 0 }
  );
  const general = data.channels.find((c) => c.pinned);
  const pinnedBy = data.team.find((m) => m.id === general?.pinned.authorId);
  const teammates = data.team.filter((m) => m.id !== user.id && m.status === "active");
  const chatUnread = data.channels.reduce((n, c) => n + (c.unread || 0), 0);

  const message = async (personId) => {
    const dm = await api.chat.openDirect(personId, user.id);
    navigate(`/app/chat?c=${dm.id}`);
  };

  return (
    <div className="space-y-6">
      {/* welcome */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-5 px-6 py-5">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} size={52} tint={user.avatarTint} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[21px] font-semibold">Hi {user.name.split(" ")[0]}</h2>
                <Badge tone="info">{user.role === "viewer" ? "Viewer" : "Worker"}</Badge>
              </div>
              <p className="mt-1 max-w-[56ch] text-[14px] leading-relaxed text-slate">
                You're working on {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"} for{" "}
                <span className="font-medium text-ink">{user.company}</span>.{" "}
                {toAnswer.length
                  ? `${toAnswer.length} ${toAnswer.length === 1 ? "reply needs" : "replies need"} an answer.`
                  : "No replies waiting on you."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {chatOn && (
              <Button as={Link} to="/app/chat" variant="secondary">
                <MessagesSquare size={15} /> Team chat
                {chatUnread > 0 && (
                  <span className="rounded-full bg-stamp px-1.5 text-[11px] font-semibold text-white tnum">{chatUnread}</span>
                )}
              </Button>
            )}
            <Button as={Link} to="/app/replies">
              <Inbox size={15} /> Answer replies
            </Button>
          </div>
        </div>
        {campaigns.some((c) => c.status === "active") && <AirmailRule running className="h-[3px]" />}
      </Card>

      {/* note from the owner, pinned in a group chat */}
      {general && (
        <Card className="flex items-start gap-3.5 border-hold/30 bg-hold-soft p-4">
          <Pin size={17} className="mt-0.5 shrink-0 text-hold" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-hold">
              Pinned by {pinnedBy?.name.split(" ")[0] || "your manager"} in {general.name}
            </p>
            <p className="mt-1 text-[14.5px] leading-relaxed text-ink">{general.pinned.body}</p>
          </div>
        </Card>
      )}

      {/* their numbers only */}
      <Card className="grid divide-y divide-rule sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[
          ["Sent on your campaigns", num(totals.sent), `${campaigns.filter((c) => c.status === "active").length} running now`],
          ["Replies", num(totals.replied), `${pct(totals.replied, totals.sent)} reply rate`],
          ["Interested", num(totals.positive), `${pct(totals.positive, totals.replied)} of replies`],
        ].map(([label, value, foot]) => (
          <div key={label} className="px-5 py-4">
            <p className="text-[13px] text-slate">{label}</p>
            <p className="mt-1.5 font-display text-[26px] font-semibold leading-none tnum">{value}</p>
            <p className="mt-2 text-[13px] text-slate">{foot}</p>
          </div>
        ))}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        {/* assigned campaigns */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-4">
            <h2 className="text-[16px] font-semibold">Assigned to you</h2>
            <Link to="/app/campaigns" className="text-[13.5px] text-route underline underline-offset-4">
              All campaigns
            </Link>
          </div>
          {campaigns.length === 0 ? (
            <EmptyState icon={Send} title="Nothing assigned yet" description="Your manager will assign campaigns to you from the Team page." />
          ) : (
            <ul className="divide-y divide-rule">
              {campaigns.map((c) => (
                <li key={c.id}>
                  <Link to={`/app/campaigns/${c.id}`} className="block px-5 py-4 transition-colors hover:bg-paper">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-[15px] font-medium">{c.name}</p>
                      <Badge status={c.status} />
                    </div>
                    <p className="mt-0.5 text-[13px] text-slate">
                      {num(c.contactCount)} contacts · {c.steps.length} steps ·{" "}
                      {c.launchedAt ? `launched ${relative(c.launchedAt)}` : "not launched"}
                    </p>
                    <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3">
                      <Meter value={c.stats.replied} max={Math.max(1, c.stats.sent * 0.15)} tone="route" />
                      <span className="text-[12.5px] text-slate tnum">
                        {pct(c.stats.replied, c.stats.sent)} replied
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* replies on their campaigns */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-4">
            <h2 className="text-[16px] font-semibold">Replies to handle</h2>
            <Link to="/app/replies" className="text-[13.5px] text-route underline underline-offset-4">
              Open inbox
            </Link>
          </div>
          {replies.length === 0 ? (
            <EmptyState icon={Inbox} title="No replies yet" description="Replies on your campaigns will show up here." />
          ) : (
            <ul className="divide-y divide-rule">
              {replies.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <Link to="/app/replies" className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-paper">
                    <Avatar name={r.contactName} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`truncate text-[14px] ${r.read ? "" : "font-semibold"}`}>
                          {!r.read && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-route align-middle" />}
                          {r.contactName}
                        </p>
                        <span className="shrink-0 text-[12px] text-slate-soft">{relative(r.repliedAt)}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[13px] text-slate">{r.body}</p>
                    </div>
                    <Badge status={r.sentiment} className="hidden self-center normal-case sm:inline-flex">
                      {SENTIMENT_LABEL[r.sentiment]}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {chatOn && (
        <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          {/* chat preview */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-4">
              <h2 className="text-[16px] font-semibold">Team chat</h2>
              <Link to="/app/chat" className="text-[13.5px] text-route underline underline-offset-4">
                Open chat
              </Link>
            </div>
            <ul className="divide-y divide-rule">
              {data.channels.slice(0, 4).map((c) => {
                const author = data.team.find((m) => m.id === c.lastMessage?.authorId);
                return (
                  <li key={c.id}>
                    <Link to={`/app/chat?c=${c.id}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-paper">
                      {c.type === "direct" ? (
                        <Avatar
                          name={channelTitle(c, data.team, user.id)}
                          size={36}
                          tint={data.team.find((m) => m.id !== user.id && c.memberIds.includes(m.id))?.avatarTint}
                        />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-route-soft text-route">
                          <MessagesSquare size={16} />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-[14px] ${c.unread ? "font-semibold" : "font-medium"}`}>
                          {channelTitle(c, data.team, user.id)}
                        </span>
                        <span className="block truncate text-[13px] text-slate">
                          {c.lastMessage
                            ? `${c.lastMessage.authorId === user.id ? "You" : author?.name.split(" ")[0]}: ${c.lastMessage.body}`
                            : "No messages yet"}
                        </span>
                      </span>
                      {c.unread > 0 && (
                        <span className="rounded-full bg-stamp px-1.5 text-[11px] font-semibold text-white tnum">{c.unread}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* team */}
          <Card className="overflow-hidden">
            <div className="border-b border-rule px-5 py-4">
              <h2 className="text-[16px] font-semibold">Your team</h2>
            </div>
            <ul className="divide-y divide-rule">
              {teammates.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar name={m.name} size={34} tint={m.avatarTint} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium">{m.name}</span>
                    <span className="block truncate text-[12.5px] text-slate">
                      {m.role === "owner" ? "Owner" : m.title || "Worker"} · active {relative(m.lastActiveAt)}
                    </span>
                  </span>
                  <Button size="sm" variant="secondary" onClick={() => message(m.id)}>
                    <MessageCircle size={14} /> Message
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <p className="flex items-center gap-1.5 text-[12.5px] text-slate-soft">
        <ArrowUpRight size={13} />
        Billing, mailbox connections and team settings are managed by the account owner.
      </p>
    </div>
  );
}
