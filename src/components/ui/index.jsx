import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Search, Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useDismiss, useScrollLock } from "../../lib/hooks";
import { initials, tintFor } from "../../lib/format";

/* ── Button ───────────────────────────────────────────────────────────── */

const BTN = {
  primary:
    "bg-ink text-white hover:bg-ink-soft active:bg-ink border border-ink disabled:bg-slate-soft disabled:border-slate-soft",
  stamp:
    "bg-stamp text-white hover:bg-stamp-deep active:bg-stamp-deep border border-stamp hover:border-stamp-deep",
  secondary:
    "bg-white text-ink border border-rule hover:border-ink/40 hover:bg-paper active:bg-paper-sunk",
  ghost: "bg-transparent text-slate border border-transparent hover:bg-paper-sunk hover:text-ink",
  danger: "bg-white text-stamp border border-stamp/35 hover:bg-stamp-soft",
  onDark:
    "bg-white text-ink border border-white hover:bg-paper active:bg-paper-sunk",
  onDarkGhost:
    "bg-transparent text-white/80 border border-white/20 hover:border-white/50 hover:text-white",
};

const SIZE = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-[14px] gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
};

export function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}) {
  return (
    <Tag
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors duration-150
        disabled:cursor-not-allowed disabled:opacity-60 ${BTN[variant]} ${SIZE[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </Tag>
  );
}

/* ── Status vocabulary ────────────────────────────────────────────────────
   Every state in the product resolves to one of five tones, so a colour
   always means the same thing whichever screen you are on. */

const TONE = {
  live: "bg-signal-soft text-signal border-signal/25",
  hold: "bg-hold-soft text-hold border-hold/30",
  stop: "bg-stamp-soft text-stamp-deep border-stamp/25",
  idle: "bg-paper-sunk text-slate border-rule",
  info: "bg-route-soft text-route border-route/25",
};

export const STATUS_TONE = {
  active: "live",
  sent: "live",
  delivered: "live",
  paid: "live",
  replied: "info",
  positive: "live",
  referral: "info",
  trialing: "info",
  pending: "idle",
  draft: "idle",
  skipped: "idle",
  completed: "idle",
  cancelled: "idle",
  resolved: "idle",
  negative: "idle",
  paused: "hold",
  waiting: "hold",
  at_limit: "hold",
  past_due: "hold",
  later: "hold",
  open: "hold",
  refunded: "hold",
  error: "stop",
  failed: "stop",
  bounced: "stop",
  flagged: "stop",
  suspended: "stop",
  suppressed: "stop",
  unsubscribe: "stop",
  complained: "stop",
};

const LABEL = {
  at_limit: "At daily limit",
  past_due: "Payment failed",
  trialing: "On trial",
  unsubscribe: "Unsubscribed",
};

export function Badge({ status, children, tone, className = "" }) {
  const t = tone || STATUS_TONE[status] || "idle";
  const text = children || LABEL[status] || (status || "").replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-medium capitalize ${TONE[t]} ${className}`}
    >
      {text}
    </span>
  );
}

export function StatusDot({ status, pulse = false }) {
  const t = STATUS_TONE[status] || "idle";
  const color = { live: "bg-signal", hold: "bg-hold", stop: "bg-stamp", idle: "bg-slate-soft", info: "bg-route" }[t];
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0">
      <span className={`h-2 w-2 rounded-full ${color} ${pulse ? "animate-pulseDot" : ""}`} />
    </span>
  );
}

/* ── Surfaces ─────────────────────────────────────────────────────────── */

export function Card({ className = "", children, ...props }) {
  return (
    <div
      className={`rounded-card border border-rule bg-paper-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function SectionHead({ title, description, action, className = "" }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div>
        <h2 className="text-[19px] font-semibold">{title}</h2>
        {description && <p className="mt-1 max-w-prose text-[14px] text-slate">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** The signature device. Only used for send progress and live campaign rows. */
export function AirmailRule({ running = false, className = "h-[6px]" }) {
  return (
    <div
      aria-hidden
      className={`w-full overflow-hidden ${running ? "airmail-running" : "airmail"} ${className}`}
    />
  );
}

export function Meter({ value, max, tone = "signal", label }) {
  const pct = Math.min(100, max ? (value / max) * 100 : 0);
  const bar = { signal: "bg-signal", hold: "bg-hold", stop: "bg-stamp", route: "bg-route", ink: "bg-ink" }[tone];
  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-sunk">
        <div className={`h-full rounded-full ${bar} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
      </div>
      {label && <p className="mt-1.5 text-2xs text-slate">{label}</p>}
    </div>
  );
}

/* ── Form controls ────────────────────────────────────────────────────── */

export function Field({ label, hint, error, children, className = "" }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
      {error ? (
        <p className="mt-1.5 text-[13px] text-stamp">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] text-slate-soft">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = (props) => <input className="field" {...props} />;
export const Textarea = (props) => <textarea className="field resize-y" {...props} />;
export const Select = ({ children, ...props }) => (
  <select className="field appearance-none bg-white pr-8" {...props}>
    {children}
  </select>
);

export function Checkbox({ checked, onChange, label, className = "" }) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2.5 ${className}`}>
      <span
        onClick={(e) => {
          e.preventDefault();
          onChange?.(!checked);
        }}
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors
          ${checked ? "border-ink bg-ink text-white" : "border-rule bg-white"}`}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={!!checked}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      {label && <span className="text-[14px] text-ink">{label}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <p className="text-[14px] font-medium text-ink">{label}</p>
        {description && <p className="mt-0.5 max-w-prose text-[13px] text-slate">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        onClick={() => onChange?.(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-signal" : "bg-rule"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[left] duration-200 ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search", className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-soft" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field pl-9"
      />
    </div>
  );
}

export function Segmented({ options, value, onChange, className = "" }) {
  return (
    <div className={`inline-flex rounded-md border border-rule bg-white p-0.5 ${className}`}>
      {options.map((o) => {
        const val = o.value ?? o;
        const label = o.label ?? o;
        const on = val === value;
        return (
          <button
            key={val}
            onClick={() => onChange(val)}
            className={`rounded px-3 py-1.5 text-[13px] font-medium transition-colors ${
              on ? "bg-ink text-white" : "text-slate hover:text-ink"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Table ────────────────────────────────────────────────────────────── */

export const Table = ({ children, className = "" }) => (
  <div className={`w-full overflow-x-auto thin-scroll ${className}`}>
    <table className="w-full min-w-[640px] border-collapse text-left">{children}</table>
  </div>
);

export const Th = ({ children, className = "", ...p }) => (
  <th
    className={`border-b border-rule px-4 py-2.5 text-[12px] font-semibold tracking-wide text-slate ${className}`}
    {...p}
  >
    {children}
  </th>
);

export const Td = ({ children, className = "", ...p }) => (
  <td className={`border-b border-rule/70 px-4 py-3 align-middle text-[14px] ${className}`} {...p}>
    {children}
  </td>
);

export const Tr = ({ children, className = "", ...p }) => (
  <tr className={`transition-colors hover:bg-paper/70 ${className}`} {...p}>
    {children}
  </tr>
);

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <p className="text-[13px] text-slate">
        Page {page} of {pages}
      </p>
      <div className="flex gap-1.5">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft size={14} /> Previous
        </Button>
        <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}

/* ── Overlays ─────────────────────────────────────────────────────────── */

export function Modal({ open, onClose, title, description, children, footer, width = "max-w-lg" }) {
  useScrollLock(open);
  const ref = useDismiss(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${width} rounded-card border border-rule bg-white shadow-panel`}
      >
        <div className="flex items-start justify-between gap-6 border-b border-rule px-5 py-4">
          <div>
            <h3 className="text-[17px] font-semibold">{title}</h3>
            {description && <p className="mt-1 text-[14px] text-slate">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate hover:bg-paper-sunk hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto thin-scroll px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-rule bg-paper px-5 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function Drawer({ open, onClose, title, description, children, footer, width = "max-w-2xl" }) {
  useScrollLock(open);
  const ref = useDismiss(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" />
      <aside
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={`absolute right-0 top-0 flex h-full w-full ${width} flex-col border-l border-rule bg-paper shadow-panel`}
      >
        <header className="flex items-start justify-between gap-6 border-b border-rule bg-white px-6 py-4">
          <div>
            <h3 className="text-[18px] font-semibold">{title}</h3>
            {description && <p className="mt-1 text-[14px] text-slate">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate hover:bg-paper-sunk hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto thin-scroll px-6 py-6">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-rule bg-white px-6 py-4">{footer}</footer>}
      </aside>
    </div>,
    document.body
  );
}

/* ── Toasts ───────────────────────────────────────────────────────────── */

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((message, tone = "live") => {
    const id = Math.random().toString(36).slice(2);
    setItems((s) => [...s, { id, message, tone }]);
    setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: push }}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
          {items.map((i) => (
            <div
              key={i.id}
              className="pointer-events-auto flex items-center gap-2.5 rounded-md border border-ink-line bg-ink px-4 py-2.5 text-[14px] text-white shadow-panel"
            >
              <StatusDot status={i.tone === "stop" ? "error" : i.tone === "hold" ? "paused" : "active"} />
              {i.message}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext)?.toast ?? (() => {});

/* ── States ───────────────────────────────────────────────────────────── */

export function EmptyState({ icon: Icon, title, description, action, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${className}`}>
      {Icon && (
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-rule bg-paper text-slate">
          <Icon size={19} />
        </span>
      )}
      <h3 className="text-[16px] font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-[38ch] text-[14px] text-slate">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const Spinner = ({ size = 18, className = "" }) => (
  <Loader2 size={size} className={`animate-spin text-slate-soft ${className}`} />
);

export function Loading({ rows = 4, className = "" }) {
  return (
    <div className={`space-y-2.5 p-4 ${className}`} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-9 animate-pulse rounded bg-paper-sunk" style={{ opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  );
}

export function Avatar({ name, size = 32, tint }) {
  const bg = tint || tintFor(name || "");
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-white"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}

/** Small labelled figure used across dashboards. */
export function Stat({ label, value, delta, tone = "idle", foot, className = "" }) {
  return (
    <div className={`px-5 py-4 ${className}`}>
      <p className="text-[13px] text-slate">{label}</p>
      <p className="mt-1.5 font-display text-[26px] font-semibold leading-none tnum">{value}</p>
      {(delta || foot) && (
        <p className="mt-2 flex items-center gap-1.5 text-[13px] text-slate">
          {delta != null && (
            <span className={delta >= 0 ? "text-signal" : "text-stamp"}>
              {delta >= 0 ? "+" : ""}
              {delta}%
            </span>
          )}
          {foot}
        </p>
      )}
    </div>
  );
}

/** Renders children only after mount — avoids portal/SSR mismatch noise. */
export function ClientOnly({ children }) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(true), []);
  return on ? children : null;
}
