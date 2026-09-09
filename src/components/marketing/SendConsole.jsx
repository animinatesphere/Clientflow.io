import { useEffect, useRef, useState } from "react";
import { AirmailRule } from "../ui";

/* The hero is the product's most characteristic moment: a queue draining at a
   deliberate pace across several mailboxes. Rather than a screenshot or a
   stat block, this is a working depiction of that queue. */

const QUEUE = [
  { name: "Marcus Bello", company: "Halden Logistics", box: 0 },
  { name: "Priya Raman", company: "Northgate Health", box: 1 },
  { name: "Chidi Okonkwo", company: "Kestrel Foods", box: 0 },
  { name: "Sara Lindqvist", company: "Vantage Studio", box: 2 },
  { name: "Tom Whitfield", company: "Orbit Freight", box: 1 },
  { name: "Amara Diallo", company: "Lumen Retail", box: 0 },
  { name: "Ben Osei", company: "Foundry Works", box: 2 },
  { name: "Elena Marchetti", company: "Casa Verde", box: 1 },
];

const BOXES = [
  { email: "adaeze@brightfold.co", limit: 45 },
  { email: "hello@brightfold.co", limit: 40 },
  { email: "partnerships@brightfold.co", limit: 30 },
];

/* Row 2 gets a reply, row 5 unsubscribes — the two events that should stop a
   sequence. Showing them is the point. */
const OUTCOMES = {
  1: "replied",
  5: "opted out",
};

export default function SendConsole() {
  const [cursor, setCursor] = useState(0);
  const [counts, setCounts] = useState([12, 9, 4]);
  const listRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setCursor(QUEUE.length);
      setCounts([31, 26, 14]);
      return;
    }
    const id = setInterval(() => {
      setCursor((c) => {
        if (c >= QUEUE.length) return c;
        const box = QUEUE[c].box;
        setCounts((prev) => prev.map((n, i) => (i === box ? n + 1 : n)));
        return c + 1;
      });
    }, 900);
    return () => clearInterval(id);
  }, []);

  const done = cursor >= QUEUE.length;

  return (
    <div className="overflow-hidden rounded-card border border-ink-line bg-ink shadow-panel">
      {/* console header */}
      <div className="flex items-center justify-between gap-4 border-b border-ink-line px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span
              className={`h-2 w-2 rounded-full ${done ? "bg-slate-soft" : "bg-signal animate-pulseDot"}`}
            />
          </span>
          <p className="text-[13px] font-medium text-white">
            {done ? "Queue drained for today" : "Sending — Q3 UK manufacturing"}
          </p>
        </div>
        <p className="text-[13px] text-slate-soft tnum">
          {counts.reduce((a, b) => a + b, 0)} of 115 today
        </p>
      </div>

      {/* mailbox capacity */}
      <div className="grid gap-3 border-b border-ink-line px-5 py-4 sm:grid-cols-3">
        {BOXES.map((b, i) => {
          const pct = Math.min(100, (counts[i] / b.limit) * 100);
          const full = counts[i] >= b.limit;
          return (
            <div key={b.email}>
              <p className="truncate text-[12px] text-white/70">{b.email}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                    full ? "bg-hold" : "bg-signal"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1.5 text-2xs text-slate-soft tnum">
                {counts[i]} / {b.limit} {full ? "· holding" : "· in pace"}
              </p>
            </div>
          );
        })}
      </div>

      {/* the queue itself */}
      <ul ref={listRef} className="divide-y divide-ink-line/70">
        {QUEUE.map((row, i) => {
          const state = i < cursor ? "sent" : i === cursor ? "sending" : "queued";
          const outcome = i < cursor ? OUTCOMES[i] : null;
          return (
            <li
              key={row.name}
              className="flex items-center gap-3 px-5 py-2.5 transition-opacity duration-500"
              style={{ opacity: state === "queued" ? 0.32 : 1 }}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  outcome === "replied"
                    ? "bg-route"
                    : outcome === "opted out"
                    ? "bg-stamp"
                    : state === "sent"
                    ? "bg-signal"
                    : state === "sending"
                    ? "bg-white animate-pulseDot"
                    : "bg-white/25"
                }`}
              />
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-white">
                {row.name}
                <span className="text-slate-soft"> · {row.company}</span>
              </span>
              <span
                className={`shrink-0 text-[12px] ${
                  outcome === "replied"
                    ? "text-route"
                    : outcome === "opted out"
                    ? "text-stamp"
                    : state === "sent"
                    ? "text-signal"
                    : "text-slate-soft"
                }`}
              >
                {outcome
                  ? outcome === "replied"
                    ? "replied — sequence stopped"
                    : "opted out — suppressed"
                  : state === "sending"
                  ? "sending"
                  : state === "sent"
                  ? "delivered"
                  : "queued"}
              </span>
            </li>
          );
        })}
      </ul>

      <AirmailRule running={!done} className="h-[6px]" />
    </div>
  );
}
