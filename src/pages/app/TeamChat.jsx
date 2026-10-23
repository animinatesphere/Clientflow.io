import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, MessagesSquare, Plus, PenSquare, Lock } from "lucide-react";
import { Avatar, Button, Card, EmptyState, Loading } from "../../components/ui";
import { ChannelList, ChatThread, NewGroupModal, useChannels, useTeam } from "../../components/app/Chat";
import { useAuth, hasTeamChat, isWorker } from "../../lib/auth";
import { useDismiss } from "../../lib/hooks";
import api from "../../lib/api";

export default function TeamChat() {
  const { user } = useAuth();
  const team = useTeam();
  const { channels } = useChannels(user.id);
  const [params, setParams] = useSearchParams();
  const [newGroup, setNewGroup] = useState(false);
  const [picker, setPicker] = useState(false);
  const pickerRef = useDismiss(picker, () => setPicker(false));
  const owner = !isWorker(user);

  const activeId = params.get("c") || channels?.[0]?.id;
  const active = channels?.find((c) => c.id === activeId);
  const select = (id) => setParams({ c: id });

  // On phones the list and the thread take turns; ?c= in the URL means "thread".
  const showThreadOnMobile = params.has("c");

  if (!hasTeamChat(user)) {
    return (
      <Card>
        <EmptyState
          icon={Lock}
          title="Team chat comes with Growth and Agency"
          description="Talk to your team in group chats and direct messages, right next to your campaigns. Upgrade to add teammates and start chatting."
          action={
            owner ? (
              <Button as={Link} to="/app/billing">
                See plans
              </Button>
            ) : null
          }
        />
      </Card>
    );
  }

  if (!channels) return <Loading rows={6} />;

  const startDirect = async (personId) => {
    setPicker(false);
    const dm = await api.chat.openDirect(personId, user.id);
    select(dm.id);
  };

  return (
    <>
      <Card className="grid h-[calc(100vh-8.5rem)] min-h-[480px] overflow-hidden md:grid-cols-[300px_1fr]">
        {/* channel list */}
        <aside className={`min-h-0 flex-col border-rule md:flex md:border-r ${showThreadOnMobile ? "hidden" : "flex"}`}>
          <div className="flex items-center justify-between gap-2 border-b border-rule px-4 py-3.5">
            <p className="text-[15px] font-semibold">Chats</p>
            <div className="flex gap-1.5">
              <div className="relative" ref={pickerRef}>
                <Button size="sm" variant="secondary" onClick={() => setPicker((p) => !p)} aria-label="New direct message">
                  <PenSquare size={14} />
                </Button>
                {picker && (
                  <div className="absolute right-0 top-full z-20 mt-1.5 w-60 rounded-card border border-rule bg-white py-1.5 shadow-lift">
                    <p className="px-3.5 pb-1.5 pt-1 text-[12px] font-medium text-slate-soft">Message someone</p>
                    {team
                      .filter((m) => m.id !== user.id && m.status === "active")
                      .map((m) => (
                        <button
                          key={m.id}
                          onClick={() => startDirect(m.id)}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left hover:bg-paper"
                        >
                          <Avatar name={m.name} size={26} tint={m.avatarTint} />
                          <span className="min-w-0">
                            <span className="block truncate text-[13.5px] font-medium">{m.name}</span>
                            <span className="block truncate text-[12px] text-slate">{m.title}</span>
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
              {owner && (
                <Button size="sm" onClick={() => setNewGroup(true)}>
                  <Plus size={14} /> Group
                </Button>
              )}
            </div>
          </div>
          <div className="thin-scroll min-h-0 flex-1 overflow-y-auto p-2">
            {channels.length ? (
              <ChannelList channels={channels} team={team} meId={user.id} activeId={activeId} onSelect={select} />
            ) : (
              <p className="px-3 py-6 text-[13.5px] text-slate">No chats yet.</p>
            )}
          </div>
        </aside>

        {/* thread */}
        <section className={`min-h-0 flex-col md:flex ${showThreadOnMobile ? "flex" : "hidden"}`}>
          <button
            onClick={() => setParams({})}
            className="flex items-center gap-1.5 border-b border-rule px-4 py-2 text-[13px] text-slate md:hidden"
          >
            <ArrowLeft size={14} /> All chats
          </button>
          {active ? (
            <ChatThread key={active.id} channel={active} team={team} meId={user.id} />
          ) : (
            <EmptyState
              icon={MessagesSquare}
              title="Pick a chat"
              description={owner ? "Or create a group for a campaign or a client." : "Choose a group or message a teammate."}
              className="m-auto"
            />
          )}
        </section>
      </Card>

      <NewGroupModal
        open={newGroup}
        onClose={() => setNewGroup(false)}
        team={team}
        meId={user.id}
        onCreated={(ch) => select(ch.id)}
      />
    </>
  );
}
