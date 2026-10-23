import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useMatch,
} from "react-router-dom";
import {
  LayoutDashboard,
  Send,
  Users,
  Mailbox,
  Inbox,
  Ban,
  BarChart3,
  CreditCard,
  Users2,
  Settings as SettingsIcon,
  Building2,
  Receipt,
  Wallet,
  ShieldAlert,
  LifeBuoy,
  Layers,
  ScrollText,
  MessagesSquare,
} from "lucide-react";

import { AuthProvider, useAuth, isWorker, hasTeamChat } from "./lib/auth";
import { ToastProvider, Spinner } from "./components/ui";
import Shell from "./components/app/Shell";
import Nav from "./components/marketing/Nav";
import Footer from "./components/marketing/Footer";

import Landing from "./pages/marketing/Landing";
import Pricing from "./pages/marketing/Pricing";
import Product from "./pages/marketing/Product";
import DeliverabilityPage from "./pages/marketing/Deliverability";
import { About, Contact, Privacy, Terms, AcceptableUse, NotFound } from "./pages/marketing/Misc";
import { Login, Signup, ForgotPassword } from "./pages/auth/Auth";

import Dashboard from "./pages/app/Dashboard";
import WorkerDashboard from "./pages/app/WorkerDashboard";
import TeamChat from "./pages/app/TeamChat";
import Campaigns from "./pages/app/Campaigns";
import CampaignBuilder from "./pages/app/CampaignBuilder";
import CampaignDetail from "./pages/app/CampaignDetail";
import Contacts from "./pages/app/Contacts";
import MailboxesPage from "./pages/app/Mailboxes";
import Replies from "./pages/app/Replies";
import { Suppression, Analytics } from "./pages/app/SuppressionAnalytics";
import { Billing, Team, Settings, Onboarding } from "./pages/app/Account";

import { AdminOverview, AdminRevenue } from "./pages/admin/Overview";
import {
  AdminUsers,
  AdminUserDetail,
  AdminSubscriptions,
  AdminCampaigns,
  AdminSupport,
  AdminPlans,
  AdminAudit,
  AdminSettings,
} from "./pages/admin/Manage";

/* ── Navigation configuration ─────────────────────────────────────────── */

const APP_NAV = [
  {
    items: [
      { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/app/campaigns", label: "Campaigns", icon: Send },
      { to: "/app/contacts", label: "Contacts", icon: Users },
      { to: "/app/mailboxes", label: "Mailboxes", icon: Mailbox },
      { to: "/app/replies", label: "Replies", icon: Inbox, badge: 4 },
      { to: "/app/chat", label: "Team chat", icon: MessagesSquare, chat: true },
      { to: "/app/suppression", label: "Suppression", icon: Ban },
      { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/app/billing", label: "Plan and billing", icon: CreditCard },
      { to: "/app/team", label: "Team", icon: Users2 },
      { to: "/app/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

/* Workers see their own work and their team — nothing that touches billing,
   seats, mailbox credentials, or the organisation's settings. */
const WORKER_NAV = [
  {
    items: [
      { to: "/app", label: "My work", icon: LayoutDashboard, end: true },
      { to: "/app/campaigns", label: "Campaigns", icon: Send },
      { to: "/app/replies", label: "Replies", icon: Inbox, badge: 2 },
      { to: "/app/contacts", label: "Contacts", icon: Users },
      { to: "/app/chat", label: "Team chat", icon: MessagesSquare, chat: true },
    ],
  },
];

/* Team chat only appears in the menu on plans that include it. */
const navFor = (user) =>
  (isWorker(user) ? WORKER_NAV : APP_NAV).map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.chat || hasTeamChat(user)),
  }));

const ADMIN_NAV = [
  {
    items: [
      { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/admin/users", label: "Accounts", icon: Building2 },
      { to: "/admin/subscriptions", label: "Subscriptions", icon: Receipt },
      { to: "/admin/revenue", label: "Revenue", icon: Wallet },
    ],
  },
  {
    label: "Platform",
    items: [
      { to: "/admin/campaigns", label: "Campaign oversight", icon: ShieldAlert, badge: 2 },
      { to: "/admin/support", label: "Support", icon: LifeBuoy, badge: 5 },
      { to: "/admin/plans", label: "Plans and pricing", icon: Layers },
      { to: "/admin/audit", label: "Audit log", icon: ScrollText },
      { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

/* Page titles for the shell's topbar, longest path first. */
const TITLES = [
  ["/app/campaigns/new", "New campaign"],
  ["/app/campaigns", "Campaigns"],
  ["/app/contacts", "Contacts"],
  ["/app/mailboxes", "Mailboxes"],
  ["/app/replies", "Replies"],
  ["/app/suppression", "Suppression list"],
  ["/app/analytics", "Analytics"],
  ["/app/billing", "Plan and billing"],
  ["/app/team", "Team"],
  ["/app/chat", "Team chat"],
  ["/app/settings", "Settings"],
  ["/app/onboarding", "Getting started"],
  ["/app", "Overview"],
  ["/admin/users", "Accounts"],
  ["/admin/subscriptions", "Subscriptions"],
  ["/admin/revenue", "Revenue"],
  ["/admin/campaigns", "Campaign oversight"],
  ["/admin/support", "Support queue"],
  ["/admin/plans", "Plans and pricing"],
  ["/admin/audit", "Audit log"],
  ["/admin/settings", "Platform settings"],
  ["/admin", "Platform overview"],
];

const titleFor = (pathname) =>
  TITLES.find(([p]) => pathname === p || pathname.startsWith(`${p}/`))?.[1] ?? "ClientFlow";

/* ── Layouts and guards ───────────────────────────────────────────────── */

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function MarketingLayout() {
  return (
    <>
      <Nav />
      <Outlet />
      <Footer />
    </>
  );
}

function Protected({ role }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size={22} />
      </div>
    );

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role === "admin" && user.role !== "admin") return <Navigate to="/app" replace />;

  return <Outlet />;
}

function AppShellRoute() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const title = pathname === "/app" && isWorker(user) ? "My work" : titleFor(pathname);
  return <Shell nav={navFor(user)} variant="app" title={title} />;
}

/** Pages only the account owner may open. Workers are sent to their dashboard. */
function OwnerOnly() {
  const { user } = useAuth();
  return isWorker(user) ? <Navigate to="/app" replace /> : <Outlet />;
}

function Home() {
  const { user } = useAuth();
  return isWorker(user) ? <WorkerDashboard /> : <Dashboard />;
}

function AdminShellRoute() {
  const { pathname } = useLocation();
  return <Shell nav={ADMIN_NAV} variant="admin" title={titleFor(pathname)} />;
}

/* ── Routes ───────────────────────────────────────────────────────────── */

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ScrollToTop />
          <Routes>
            {/* marketing */}
            <Route element={<MarketingLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/product" element={<Product />} />
              <Route path="/deliverability" element={<DeliverabilityPage />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/acceptable-use" element={<AcceptableUse />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* customer workspace */}
            <Route element={<Protected />}>
              <Route element={<AppShellRoute />}>
                <Route path="/app" element={<Home />} />
                <Route path="/app/campaigns" element={<Campaigns />} />
                <Route path="/app/campaigns/new" element={<CampaignBuilder />} />
                <Route path="/app/campaigns/:id" element={<CampaignDetail />} />
                <Route path="/app/contacts" element={<Contacts />} />
                <Route path="/app/replies" element={<Replies />} />
                <Route path="/app/chat" element={<TeamChat />} />
                <Route element={<OwnerOnly />}>
                  <Route path="/app/onboarding" element={<Onboarding />} />
                  <Route path="/app/mailboxes" element={<MailboxesPage />} />
                  <Route path="/app/suppression" element={<Suppression />} />
                  <Route path="/app/analytics" element={<Analytics />} />
                  <Route path="/app/billing" element={<Billing />} />
                  <Route path="/app/team" element={<Team />} />
                  <Route path="/app/settings" element={<Settings />} />
                </Route>
              </Route>
            </Route>

            {/* admin */}
            <Route element={<Protected role="admin" />}>
              <Route element={<AdminShellRoute />}>
                <Route path="/admin" element={<AdminOverview />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/users/:id" element={<AdminUserDetail />} />
                <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
                <Route path="/admin/revenue" element={<AdminRevenue />} />
                <Route path="/admin/campaigns" element={<AdminCampaigns />} />
                <Route path="/admin/support" element={<AdminSupport />} />
                <Route path="/admin/plans" element={<AdminPlans />} />
                <Route path="/admin/audit" element={<AdminAudit />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
