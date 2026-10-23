import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageCircle, X, ArrowLeft, Maximize2 } from "lucide-react";
import { ChannelList, ChatThread, useChannels, useTeam } from "./Chat";
import { useAuth, hasTeamChat } from "../../lib/auth";

/* The chat box: a bubble in the corner of every workspace page that opens a
   small chat window, so nobody has to leave a campaign to answer a teammate.
   Hidden on the full chat page, and on plans without team chat. */
export default function ChatDock() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  if (!user || !hasTeamChat(user) || pathname.startsWith("/app/chat")) return null;
  return <Dock user={user} />;
}

function Dock({ user }) {
  const [open, setOpen] = useState(false);
  const [channelId, setChannelId] = useState(null);
  const team = useTeam();
  const { channels } = useChannels(user.id);

  const unread = (channels || []).reduce((n, c) => n + (c.unread || 0), 0);
  const active = channels?.find((c) => c.id === channelId);

  return (
    <>
      {open && (
        <div className="fixed inset-x-3 bottom-24 z-40 flex h-[min(540px,calc(100vh-8rem))] flex-col overflow-hidden rounded-2xl border border-rule bg-paper-card shadow-panel sm:inset-x-auto sm:right-6 sm:w-[370px]">
          {active ? (
            <>
              <div className="flex items-center justify-between border-b border-rule bg-paper px-2 py-1.5">
                <button
                  onClick={() => setChannelId(null)}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[12.5px] text-slate hover:text-ink"
                >
                  <ArrowLeft size={14} /> Chats
                </button>
                <Link
                  to={`/app/chat?c=${active.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[12.5px] text-route hover:underline"
                >
                  <Maximize2 size={12} /> Open full chat
                </Link>
              </div>
              <div className="min-h-0 flex-1">
                <ChatThread key={active.id} channel={active} team={team} meId={user.id} compact />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-rule px-4 py-3">
                <div>
                  <p className="text-[15px] font-semibold">Team chat</p>
                  <p className="text-[12px] text-slate">{user.company || "Your team"}</p>
                </div>
                <Link to="/app/chat" onClick={() => setOpen(false)} className="text-[12.5px] text-route hover:underline">
                  Open full chat
                </Link>
              </div>
              <div className="thin-scroll min-h-0 flex-1 overflow-y-auto p-2">
                {channels && (
                  <ChannelList channels={channels} team={team} meId={user.id} onSelect={setChannelId} compact />
                )}
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close team chat" : "Open team chat"}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-panel transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X size={22} /> : <MessageCircle size={23} />}
        {!open && unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-paper bg-stamp px-1 text-[11px] font-semibold tnum">
            {unread}
          </span>
        )}
      </button>
    </>
  );
}
