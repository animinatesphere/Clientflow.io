import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Hash, SendHorizontal, Pin, Users } from "lucide-react";
import { Avatar, Button, Checkbox, Field, Input, Modal, useToast } from "../ui";
import api from "../../lib/api";
import { relative } from "../../lib/format";

/* ── Data hooks ───────────────────────────────────────────────────────────
   Shared by the full chat page and the floating chat box, so a message sent
   in one shows up in the other straight away. */

export function useTeam() {
  const [team, setTeam] = useState([]);
  useEffect(() => {
    api.team.list().then(setTeam);
  }, []);
  return team;
}

export function useChannels(meId) {
  const [channels, setChannels] = useState(null);
  const load = useCallback(() => api.chat.channels(meId).then(setChannels), [meId]);
  useEffect(() => {
    if (!meId) return;
    load();
    return api.chat.subscribe(load);
  }, [meId, load]);
  return { channels, reload: load };
}

export function useMessages(channelId, meId) {
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(null);

  useEffect(() => {
    if (!channelId) return;
    let alive = true;
    const load = () =>
      api.chat.messages(channelId).then((m) => {
        if (!alive) return;
        setMessages(m);
        api.chat.markRead(channelId, meId);
      });
    setMessages([]);
    setTyping(null);
    load();
    const off = api.chat.subscribe((e) => {
      if (e.type === "typing" && e.channelId === channelId) {
        setTyping(e.userId);
      } else if (e.type === "message" ? e.channelId === channelId : e.type === "poll") {
        setTyping(null);
        load();
      }
    });
    return () => {
      alive = false;
      off();
    };
  }, [channelId, meId]);

  const send = useCallback((body) => api.chat.send(channelId, body, meId), [channelId, meId]);
  return { messages, typing, send };
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

const byId = (team) => Object.fromEntries(team.map((m) => [m.id, m]));

export function channelTitle(channel, team, meId) {
  if (channel.type === "group") return channel.name;
  const other = byId(team)[channel.memberIds.find((id) => id !== meId)];
  return other?.name || "Direct message";
}

const isOnline = (m) => m?.lastActiveAt && Date.now() - new Date(m.lastActiveAt) < 15 * 60000;

const time = (iso) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const dayLabel = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
};

function ChannelIcon({ channel, team, meId, size = 34 }) {
  if (channel.type === "group") {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-lg bg-route-soft text-route"
        style={{ width: size, height: size }}
      >
        <Hash size={size * 0.45} />
      </span>
    );
  }
  const other = byId(team)[channel.memberIds.find((id) => id !== meId)];
  return (
    <span className="relative shrink-0">
      <Avatar name={other?.name} size={size} tint={other?.avatarTint} />
      {isOnline(other) && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-signal" />
      )}
    </span>
  );
}

/* ── Channel list ─────────────────────────────────────────────────────── */

export function ChannelList({ channels, team, meId, activeId, onSelect, compact = false }) {
  const people = byId(team);
  const groups = channels.filter((c) => c.type === "group");
  const directs = channels.filter((c) => c.type === "direct");

  const Row = ({ c }) => {
    const last = c.lastMessage;
    const author = last && (last.authorId === meId ? "You" : people[last.authorId]?.name.split(" ")[0]);
    const active = c.id === activeId;
    return (
      <li>
        <button
          onClick={() => onSelect(c.id)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
            active ? "bg-ink text-white" : "hover:bg-paper-sunk"
          }`}
        >
          <ChannelIcon channel={c} team={team} meId={meId} size={compact ? 30 : 34} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className={`truncate text-[14px] ${c.unread ? "font-semibold" : "font-medium"}`}>
                {channelTitle(c, team, meId)}
              </span>
              {last && (
                <span className={`shrink-0 text-[11px] ${active ? "text-white/60" : "text-slate-soft"}`}>
                  {relative(last.at)}
                </span>
              )}
            </span>
            <span className="mt-0.5 flex items-center justify-between gap-2">
              <span className={`truncate text-[12.5px] ${active ? "text-white/70" : "text-slate"}`}>
                {last ? `${author}: ${last.body}` : "No messages yet"}
              </span>
              {c.unread > 0 && !active && (
                <span className="shrink-0 rounded-full bg-stamp px-1.5 text-[11px] font-semibold text-white tnum">
                  {c.unread}
                </span>
              )}
            </span>
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="space-y-4">
      {[
        ["Groups", groups],
        ["Direct messages", directs],
      ].map(([label, list]) =>
        list.length ? (
          <div key={label}>
            <p className="mb-1 px-3 text-[11.5px] font-medium uppercase tracking-wider text-slate-soft">{label}</p>
            <ul className="space-y-0.5">
              {list.map((c) => (
                <Row key={c.id} c={c} />
              ))}
            </ul>
          </div>
        ) : null
      )}
    </div>
  );
}

/* ── Thread ───────────────────────────────────────────────────────────── */

export function ChatThread({ channel, team, meId, compact = false }) {
  const { messages, typing, send } = useMessages(channel.id, meId);
  const [draft, setDraft] = useState("");
  const scroller = useRef(null);
  const people = byId(team);
  const members = channel.memberIds.map((id) => people[id]).filter(Boolean);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const submit = (e) => {
    e?.preventDefault();
    const body = draft.trim();
    if (!body) return;
    send(body);
    setDraft("");
  };

  // Consecutive messages from one person within five minutes share a header.
  const rows = useMemo(
    () =>
      messages.map((m, i) => {
        const prev = messages[i - 1];
        const newDay = !prev || new Date(prev.at).toDateString() !== new Date(m.at).toDateString();
        const grouped = !newDay && prev.authorId === m.authorId && new Date(m.at) - new Date(prev.at) < 5 * 60000;
        return { m, newDay, grouped };
      }),
    [messages]
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* header */}
      <div className={`flex items-center gap-3 border-b border-rule ${compact ? "px-4 py-2.5" : "px-5 py-3.5"}`}>
        <ChannelIcon channel={channel} team={team} meId={meId} size={compact ? 28 : 36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{channelTitle(channel, team, meId)}</p>
          {!compact && (
            <p className="truncate text-[12.5px] text-slate">
              {channel.type === "group"
                ? channel.description || `${members.length} members`
                : isOnline(members.find((m) => m.id !== meId))
                ? "Active now"
                : "Direct message"}
            </p>
          )}
        </div>
        {channel.type === "group" && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {members.slice(0, 4).map((m) => (
                <span key={m.id} className="rounded-full ring-2 ring-white">
                  <Avatar name={m.name} size={compact ? 22 : 26} tint={m.avatarTint} />
                </span>
              ))}
            </div>
            {!compact && (
              <span className="flex items-center gap-1 text-[12.5px] text-slate">
                <Users size={13} /> {members.length}
              </span>
            )}
          </div>
        )}
      </div>

      {/* pinned note */}
      {channel.pinned && !compact && (
        <div className="flex items-start gap-2.5 border-b border-rule bg-hold-soft/60 px-5 py-2.5 text-[13px]">
          <Pin size={14} className="mt-0.5 shrink-0 text-hold" />
          <p className="text-ink">
            <span className="font-medium">{people[channel.pinned.authorId]?.name.split(" ")[0]}:</span>{" "}
            {channel.pinned.body}
          </p>
        </div>
      )}

      {/* messages */}
      <div ref={scroller} className={`thin-scroll min-h-0 flex-1 overflow-y-auto ${compact ? "px-4 py-3" : "px-5 py-4"}`}>
        {rows.length === 0 && (
          <p className="py-10 text-center text-[13.5px] text-slate">
            No messages yet. Say hello to {channelTitle(channel, team, meId)}.
          </p>
        )}
        {rows.map(({ m, newDay, grouped }) => {
          const author = people[m.authorId];
          const mine = m.authorId === meId;
          return (
            <Fragment key={m.id}>
              {newDay && (
                <div className="my-4 flex items-center gap-3 text-[11.5px] font-medium text-slate-soft">
                  <span className="h-px flex-1 bg-rule" />
                  {dayLabel(m.at)}
                  <span className="h-px flex-1 bg-rule" />
                </div>
              )}
              <div className={`flex gap-2.5 ${mine ? "flex-row-reverse" : ""} ${grouped ? "mt-1" : "mt-3"}`}>
                <span className="w-8 shrink-0">
                  {!grouped && !mine && <Avatar name={author?.name} size={compact ? 26 : 30} tint={author?.avatarTint} />}
                </span>
                <div className={`flex max-w-[78%] flex-col ${mine ? "items-end" : "items-start"}`}>
                  {!grouped && (
                    <p className="mb-1 text-[12px] text-slate">
                      {!mine && <span className="mr-1.5 font-medium text-ink">{author?.name || "Someone"}</span>}
                      {time(m.at)}
                    </p>
                  )}
                  <p
                    className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed ${
                      mine ? "rounded-tr-md bg-ink text-white" : "rounded-tl-md border border-rule bg-white text-ink"
                    }`}
                  >
                    {m.body}
                  </p>
                </div>
              </div>
            </Fragment>
          );
        })}
        {typing && (
          <div className="mt-3 flex items-center gap-2.5">
            <Avatar name={people[typing]?.name} size={compact ? 26 : 30} tint={people[typing]?.avatarTint} />
            <span className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-rule bg-white px-3.5 py-3">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-slate-soft" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </span>
            <span className="text-[12px] text-slate-soft">{people[typing]?.name.split(" ")[0]} is typing</span>
          </div>
        )}
      </div>

      {/* composer */}
      <form onSubmit={submit} className={`flex items-end gap-2 border-t border-rule bg-white ${compact ? "p-2.5" : "p-3.5"}`}>
        <textarea
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) submit(e);
          }}
          placeholder={`Message ${channelTitle(channel, team, meId)}`}
          className="field max-h-32 min-h-[40px] resize-none py-2"
        />
        <Button type="submit" disabled={!draft.trim()} aria-label="Send message" className="h-10 w-10 shrink-0 !px-0">
          <SendHorizontal size={16} />
        </Button>
      </form>
    </div>
  );
}

/* ── Create a group ───────────────────────────────────────────────────── */

export function NewGroupModal({ open, onClose, team, meId, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const others = team.filter((m) => m.id !== meId && m.status === "active");

  const create = async () => {
    setBusy(true);
    const ch = await api.chat.createGroup({ name: name.trim(), description: description.trim(), memberIds: picked }, meId);
    setBusy(false);
    toast(`Group "${ch.name}" created`);
    setName("");
    setDescription("");
    setPicked([]);
    onCreated?.(ch);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New group chat"
      description="Everyone you add can read the whole history and post in it."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!name.trim() || !picked.length} loading={busy} onClick={create}>
            Create group
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Group name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q4 referral push" autoFocus />
        </Field>
        <Field label="What is it for?" hint="Optional. Shown under the group name.">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Replies and follow-ups for the partner campaign" />
        </Field>
        <div>
          <p className="label">Members</p>
          {others.length === 0 ? (
            <p className="text-[13.5px] text-slate">Invite someone to your team first.</p>
          ) : (
            <ul className="divide-y divide-rule rounded-md border border-rule">
              {others.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Checkbox
                    checked={picked.includes(m.id)}
                    onChange={(on) => setPicked((p) => (on ? [...p, m.id] : p.filter((x) => x !== m.id)))}
                  />
                  <Avatar name={m.name} size={28} tint={m.avatarTint} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium">{m.name}</span>
                    <span className="block truncate text-[12.5px] text-slate">{m.title || m.email}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
