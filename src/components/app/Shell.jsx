import { useState } from "react";
import { Link, NavLink, useNavigate, Outlet } from "react-router-dom";
import { Menu, X, LogOut, ChevronDown, ExternalLink, ShieldAlert } from "lucide-react";
import { LogoMark } from "../Logo";
import { Avatar, Button, Meter, useToast } from "../ui";
import { useAuth, isWorker } from "../../lib/auth";
import ChatDock from "./ChatDock";
import { useDismiss } from "../../lib/hooks";
import { num } from "../../lib/format";

/**
 * One shell, two products. The customer workspace and the admin console share
 * the same chrome so the team only has to learn one layout; the sidebar tint
 * is what tells you which side you are on.
 */
export default function Shell({ nav, variant = "app", title }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const admin = variant === "admin";

  return (
    <div className="flex min-h-screen bg-paper">
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r transition-transform duration-200 lg:static lg:translate-x-0
          ${admin ? "border-ink-line bg-ink" : "border-rule bg-white"}
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div
          className={`flex h-16 shrink-0 items-center justify-between gap-2 border-b px-5 ${
            admin ? "border-ink-line" : "border-rule"
          }`}
        >
          <Link to={admin ? "/admin" : "/app"} className="flex items-center gap-2.5">
            <LogoMark size={26} reverse={admin} />
            <span
              className="wordmark text-[17px]"
              style={{ color: admin ? "#fff" : "#0E1B2A" }}
            >
              ClientFlow
            </span>
          </Link>
          <button
            className={`rounded p-1 lg:hidden ${admin ? "text-white/70" : "text-slate"}`}
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {admin && (
          <div className="flex items-center gap-2 border-b border-ink-line px-5 py-2.5">
            <ShieldAlert size={13} className="text-stamp" />
            <span className="text-[12px] text-white/60">Platform administration</span>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto thin-scroll px-3 py-4">
          {nav.map((group, gi) => (
            <div key={gi} className={gi ? "mt-6" : ""}>
              {group.label && (
                <p
                  className={`mb-1.5 px-3 text-[11.5px] font-medium ${
                    admin ? "text-white/35" : "text-slate-soft"
                  }`}
                >
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-md px-3 py-2 text-[14px] transition-colors ${
                          admin
                            ? isActive
                              ? "bg-white/10 text-white"
                              : "text-white/60 hover:bg-white/5 hover:text-white"
                            : isActive
                            ? "bg-ink text-white"
                            : "text-slate hover:bg-paper-sunk hover:text-ink"
                        }`
                      }
                    >
                      <item.icon size={16} className="shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge ? (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[11px] tnum ${
                            admin ? "bg-stamp text-white" : "bg-stamp-soft text-stamp-deep"
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {!admin && !isWorker(user) && user?.usage && <UsageFoot usage={user.usage} />}
        {!admin && isWorker(user) && (
          <div className="border-t border-rule px-5 py-4">
            <p className="truncate text-[13px] font-medium">{user.company}</p>
            <p className="mt-0.5 text-[12.5px] text-slate">
              {user.role === "viewer" ? "Viewer, read only" : "Worker"}
              {user.invitedBy ? ` · added by ${user.invitedBy.split(" ")[0]}` : ""}
            </p>
          </div>
        )}
        {admin && (
          <div className="border-t border-ink-line px-5 py-4">
            <Link
              to="/app"
              className="flex items-center gap-2 text-[13px] text-white/60 hover:text-white"
            >
              <ExternalLink size={14} />
              Open a customer workspace
            </Link>
          </div>
        )}
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setOpen(true)} admin={admin} title={title} />
        <main className="min-w-0 flex-1 px-5 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>

      {!admin && <ChatDock />}
    </div>
  );
}

function UsageFoot({ usage }) {
  const cap = 40000;
  const over = usage.sendsThisMonth / cap > 0.85;
  return (
    <div className="border-t border-rule px-5 py-4">
      <div className="flex items-baseline justify-between">
        <p className="text-[13px] text-slate">Emails this month</p>
        <p className="text-[13px] font-medium tnum">
          {num(usage.sendsThisMonth)}
          <span className="text-slate-soft"> / {num(cap)}</span>
        </p>
      </div>
      <div className="mt-2">
        <Meter value={usage.sendsThisMonth} max={cap} tone={over ? "hold" : "signal"} />
      </div>
      <Link
        to="/app/billing"
        className="mt-2.5 inline-block text-[13px] text-route underline underline-offset-4"
      >
        {over ? "Raise your allowance" : "Growth plan"}
      </Link>
    </div>
  );
}

function Topbar({ onMenu, admin, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [menu, setMenu] = useState(false);
  const ref = useDismiss(menu, () => setMenu(false));

  const signOut = async () => {
    await logout();
    toast("Signed out");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-rule bg-paper/85 px-5 backdrop-blur-md sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button className="rounded p-2 text-slate lg:hidden" onClick={onMenu} aria-label="Open menu">
          <Menu size={19} />
        </button>
        <h1 className="truncate text-[17px] font-semibold">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {!admin && user?.role !== "viewer" && (
          <Button as={Link} to="/app/campaigns/new" size="sm" className="hidden sm:inline-flex">
            New campaign
          </Button>
        )}

        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenu((m) => !m)}
            className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 transition-colors hover:bg-paper-sunk"
            aria-expanded={menu}
          >
            <Avatar name={user?.name} size={30} tint={user?.avatarTint} />
            <span className="hidden text-[14px] font-medium sm:block">{user?.name}</span>
            <ChevronDown size={15} className="text-slate" />
          </button>

          {menu && (
            <div className="absolute right-0 top-full z-30 mt-1.5 w-64 rounded-card border border-rule bg-white py-1.5 shadow-lift">
              <div className="border-b border-rule px-4 py-2.5">
                <p className="truncate text-[14px] font-medium">{user?.name}</p>
                <p className="truncate text-[13px] text-slate">{user?.email}</p>
              </div>
              {!isWorker(user) && (
              <Link
                to={admin ? "/admin/settings" : "/app/settings"}
                onClick={() => setMenu(false)}
                className="block px-4 py-2 text-[14px] text-slate hover:bg-paper hover:text-ink"
              >
                Settings
              </Link>
              )}
              {!admin && !isWorker(user) && (
                <Link
                  to="/app/billing"
                  onClick={() => setMenu(false)}
                  className="block px-4 py-2 text-[14px] text-slate hover:bg-paper hover:text-ink"
                >
                  Plan and billing
                </Link>
              )}
              <button
                onClick={signOut}
                className="flex w-full items-center gap-2 border-t border-rule px-4 py-2 text-left text-[14px] text-slate hover:bg-paper hover:text-ink"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
