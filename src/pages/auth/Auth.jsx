import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import Logo from "../../components/Logo";
import { Button, Field, Input, Card, AirmailRule, Checkbox, useToast } from "../../components/ui";
import { useAuth } from "../../lib/auth";

/* ── Shared shell ─────────────────────────────────────────────────────── */

function AuthShell({ title, subtitle, children, foot, aside }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      {/* form side */}
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Link to="/" className="inline-flex w-fit items-center gap-2 text-slate hover:text-ink">
          <ArrowLeft size={16} />
          <span className="text-[14px]">Back to site</span>
        </Link>

        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
          <Logo size={32} />
          <h1 className="mt-8 text-[28px] font-semibold leading-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-slate">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {foot && <div className="mt-6 text-[14px] text-slate">{foot}</div>}
        </div>
      </div>

      {/* context side */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink px-12 py-12 lg:flex">
        <div className="envelope-grid absolute inset-0" aria-hidden />
        <div className="relative">{aside}</div>
        <AirmailRule className="absolute bottom-0 left-0 h-[6px]" />
      </aside>
    </div>
  );
}

const AsideList = ({ heading, items }) => (
  <div className="max-w-[42ch]">
    <h2 className="text-[26px] font-semibold leading-snug text-white">{heading}</h2>
    <ul className="mt-8 space-y-4">
      {items.map((i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-white/70">
          <Check size={17} className="mt-[3px] shrink-0 text-signal" />
          {i}
        </li>
      ))}
    </ul>
  </div>
);

/* ── Login ────────────────────────────────────────────────────────────── */

export function Login() {
  const { login, demoSignIn, isDemo } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(form);
      navigate(user.role === "admin" ? "/admin" : "/app");
    } catch (err) {
      setError(err.message || "Could not sign you in. Check the address and password.");
    } finally {
      setBusy(false);
    }
  };

  const jump = (as) => {
    demoSignIn(as);
    toast(
      as === "admin"
        ? "Signed in to the admin demo"
        : as === "worker"
        ? "Signed in as Ken, a worker at Brightfold"
        : "Signed in to the demo workspace"
    );
    navigate(as === "admin" ? "/admin" : "/app");
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Pick up where your campaigns left off."
      foot={
        <>
          No account yet?{" "}
          <Link to="/signup" className="text-route underline underline-offset-4">
            Start a 14-day trial
          </Link>
        </>
      }
      aside={
        <AsideList
          heading="Your queue kept its pace while you were away."
          items={[
            "Sends stayed inside every mailbox ceiling you set",
            "Sequences stopped for anyone who replied or opted out",
            "Bounces went straight to the suppression list",
            "Nothing went out during your paused hours",
          ]}
        />
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email address" error={error}>
          <Input
            required
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@company.com"
          />
        </Field>
        <Field label="Password">
          <Input
            required
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-[13.5px] text-route underline underline-offset-4">
            Forgotten your password?
          </Link>
        </div>
        <Button type="submit" loading={busy} className="w-full" size="lg">
          Sign in
        </Button>
      </form>

      {isDemo && (
        <Card className="mt-6 bg-paper p-4">
          <p className="text-[13px] text-slate">
            No backend connected yet, so this build runs on sample data. Jump straight in:
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Button size="sm" variant="secondary" onClick={() => jump("user")}>
              Company owner
            </Button>
            <Button size="sm" variant="secondary" onClick={() => jump("worker")}>
              Worker
            </Button>
            <Button size="sm" variant="secondary" onClick={() => jump("admin")}>
              Platform admin
            </Button>
          </div>
        </Card>
      )}
    </AuthShell>
  );
}

/* ── Signup ───────────────────────────────────────────────────────────── */

export function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", company: "", password: "" });
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setError("You need to accept the terms and acceptable use policy to continue.");
      return;
    }
    if (form.password.length < 10) {
      setError("Use at least 10 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register(form);
      navigate("/app/onboarding");
    } catch (err) {
      setError(err.message || "Could not create the account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Start your trial"
      subtitle="Fourteen days, every feature, no card. Connect one mailbox and send your first sequence today."
      foot={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-route underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
      aside={
        <AsideList
          heading="Set up in about ten minutes."
          items={[
            "Connect a Gmail or Outlook account through their own consent screen",
            "Upload a CSV and confirm the column mapping",
            "Write two or three steps with merge fields",
            "Launch — and watch the first sends go out at a survivable pace",
          ]}
        />
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Your name">
          <Input required value={form.name} onChange={set("name")} placeholder="Adaeze Nwosu" autoComplete="name" />
        </Field>
        <Field label="Work email" hint="Use the domain you intend to send from.">
          <Input
            required
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="you@company.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Company">
          <Input required value={form.company} onChange={set("company")} placeholder="Brightfold Studio" />
        </Field>
        <Field label="Password" hint="At least 10 characters." error={error}>
          <Input
            required
            type="password"
            value={form.password}
            onChange={set("password")}
            placeholder="••••••••••"
            autoComplete="new-password"
          />
        </Field>

        <Checkbox
          checked={agreed}
          onChange={setAgreed}
          className="items-start pt-1"
          label={
            <span className="text-[13.5px] leading-relaxed text-slate">
              I accept the{" "}
              <Link to="/terms" className="text-route underline underline-offset-2">
                terms
              </Link>{" "}
              and the{" "}
              <Link to="/acceptable-use" className="text-route underline underline-offset-2">
                acceptable use policy
              </Link>
              , and I confirm I have a lawful basis to contact the people I upload.
            </span>
          }
        />

        <Button type="submit" loading={busy} className="w-full" size="lg">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}

/* ── Forgot password ──────────────────────────────────────────────────── */

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    setBusy(false);
    setSent(true);
  };

  return (
    <AuthShell
      title={sent ? "Check your inbox" : "Reset your password"}
      subtitle={
        sent
          ? `If an account exists for ${email}, a reset link is on its way. It expires in one hour.`
          : "Give us the address on the account and we will send a link to set a new password."
      }
      foot={
        <Link to="/login" className="text-route underline underline-offset-4">
          Back to sign in
        </Link>
      }
      aside={
        <AsideList
          heading="Your campaigns are untouched."
          items={[
            "Resetting a password does not disconnect your mailboxes",
            "Scheduled sends carry on at their normal pace",
            "Reset links expire after an hour and can only be used once",
          ]}
        />
      }
    >
      {!sent && (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email address">
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </Field>
          <Button type="submit" loading={busy} className="w-full" size="lg">
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
