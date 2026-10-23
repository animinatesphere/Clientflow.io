import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Check,
  Upload,
  FileSpreadsheet,
  Rocket,
  MessageSquareReply,
  Mail,
} from "lucide-react";

/* A product tour that plays like a video but is built from the product's own
   UI, so it stays sharp at any size and never goes stale against a redesign.

   To use a real screen recording instead, drop the file in /public and set
   VIDEO_SRC (and optionally VIDEO_POSTER). The animated tour is then skipped. */
const VIDEO_SRC = null; // e.g. "/video/clientflow-tour.mp4"
const VIDEO_POSTER = null;

const SCENE_MS = 6000;

const SCENES = [
  { id: "connect", label: "Connect", caption: "Sign in with Google or Microsoft. Your own mailbox does the sending." },
  { id: "import", label: "Import", caption: "Drop in a CSV. Duplicates merge, bad addresses are rejected." },
  { id: "write", label: "Write", caption: "Write the sequence once. Merge fields make every email personal." },
  { id: "launch", label: "Launch", caption: "Launch, and sends spread across your mailboxes at a safe pace." },
  { id: "reply", label: "Reply", caption: "Someone replies, and their remaining steps cancel on their own." },
];

const d = (ms) => ({ animationDelay: `${ms}ms` });

export default function ProductFilm() {
  const [scene, setScene] = useState(0);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const root = useRef(null);
  const started = useRef(0);

  // Autoplay while on screen (unless the visitor paused or prefers less motion).
  useEffect(() => {
    if (VIDEO_SRC) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const io = new IntersectionObserver(
      ([e]) => setPlaying(e.isIntersecting && !userPaused),
      { threshold: 0.45 }
    );
    io.observe(root.current);
    return () => io.disconnect();
  }, [userPaused]);

  // The clock: fills the current chapter, then advances (looping at the end).
  useEffect(() => {
    if (!playing) return;
    let raf;
    started.current = performance.now() - progress * SCENE_MS;
    const tick = (now) => {
      const p = (now - started.current) / SCENE_MS;
      if (p >= 1) {
        setScene((s) => (s + 1) % SCENES.length);
        setProgress(0);
        started.current = now;
      } else {
        setProgress(p);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const jump = (i) => {
    setScene(i);
    setProgress(0);
    started.current = performance.now();
  };

  const togglePlay = () => {
    setUserPaused(playing);
    setPlaying(!playing);
  };

  if (VIDEO_SRC) {
    return (
      <div ref={root} className="overflow-hidden rounded-card border border-ink-line bg-ink shadow-panel">
        <video
          src={VIDEO_SRC}
          poster={VIDEO_POSTER || undefined}
          className="block w-full"
          autoPlay
          muted
          loop
          playsInline
          controls
        />
      </div>
    );
  }

  const current = SCENES[scene];

  return (
    <div ref={root} className="overflow-hidden rounded-[14px] border border-ink-line bg-ink shadow-panel">
      {/* window chrome */}
      <div className="flex items-center gap-3 border-b border-ink-line px-4 py-3">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-stamp/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-hold/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-signal/80" />
        </span>
        <span className="mx-auto max-w-[60%] truncate rounded-md bg-white/5 px-4 py-1 text-center text-[12px] text-white/50">
          app.sendclientflow.com/{current.id}
        </span>
        <button
          onClick={togglePlay}
          aria-label={playing ? "Pause tour" : "Play tour"}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          {playing ? <Pause size={13} /> : <Play size={13} className="translate-x-px" />}
        </button>
      </div>

      {/* stage */}
      <div className="relative bg-paper">
        <div
          key={scene}
          className="relative flex min-h-[340px] flex-col justify-center overflow-hidden px-5 py-7 sm:aspect-[2/1] sm:min-h-0 sm:px-10 sm:pb-16 sm:pt-8"
        >
          {scene === 0 && <SceneConnect />}
          {scene === 1 && <SceneImport />}
          {scene === 2 && <SceneWrite />}
          {scene === 3 && <SceneLaunch />}
          {scene === 4 && <SceneReply />}

          {/* subtitle */}
          <p
            className="film-rise relative mx-auto mt-5 w-fit sm:absolute sm:inset-x-4 sm:bottom-4 sm:mt-0 max-w-[92%] rounded-md bg-ink/90 px-3.5 py-2 text-center text-[13px] text-white shadow-panel backdrop-blur sm:text-[14px]"
            style={d(300)}
          >
            {current.caption}
          </p>
        </div>

        {!playing && !userPaused && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-ink/20 backdrop-blur-[1px]"
            aria-label="Play tour"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-white shadow-panel transition-transform hover:scale-105">
              <Play size={24} className="translate-x-0.5" />
            </span>
          </button>
        )}
      </div>

      {/* chapters */}
      <div className="grid grid-cols-5 gap-2 border-t border-ink-line px-4 py-3">
        {SCENES.map((s, i) => (
          <button key={s.id} onClick={() => jump(i)} className="group text-left" aria-current={i === scene}>
            <span className="block h-[3px] overflow-hidden rounded-full bg-white/10">
              <span
                className="block h-full rounded-full bg-white"
                style={{ width: i < scene ? "100%" : i === scene ? `${progress * 100}%` : "0%" }}
              />
            </span>
            <span
              className={`mt-2 block truncate text-[11.5px] transition-colors sm:text-[12.5px] ${
                i === scene ? "text-white" : "text-white/45 group-hover:text-white/75"
              }`}
            >
              <span className="hidden tnum sm:inline">{i + 1}. </span>
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Scenes ───────────────────────────────────────────────────────────── */

/** A pointer that glides in from an offset and clicks the element it sits in. */
function Cursor({ from = ["140px", "110px"], at = 900, travel = 1100 }) {
  return (
    <>
      <span
        aria-hidden
        className="film-cursor pointer-events-none absolute z-20"
        style={{
          "--x0": `calc(60% + ${from[0]})`,
          "--y0": `calc(55% + ${from[1]})`,
          "--x1": "60%",
          "--y1": "55%",
          "--dur": `${travel}ms`,
          ...d(at),
        }}
      >
        <svg width="18" height="22" viewBox="0 0 18 22" className="drop-shadow">
          <path d="M1 1l15 9.5-6.5 1.4L6 19 1 1z" fill="#0E1B2A" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </span>
      <span
        aria-hidden
        className="film-ripple pointer-events-none absolute left-[60%] top-[55%] z-10 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-route/40"
        style={d(at + travel)}
      />
    </>
  );
}

const Panel = ({ children, className = "", delay = 0 }) => (
  <div
    className={`film-rise rounded-card border border-rule bg-paper-card shadow-lift ${className}`}
    style={d(delay)}
  >
    {children}
  </div>
);

function SceneConnect() {
  return (
    <div className="mx-auto max-w-[420px]">
      <Panel className="p-5 sm:p-6">
        <p className="text-[15px] font-semibold text-ink">Connect a mailbox</p>
        <p className="mt-1 text-[12.5px] text-slate">ClientFlow sends through your own account.</p>
        <div className="mt-4 space-y-2.5">
          <div className="relative">
            <div className="flex items-center gap-3 rounded-md border border-rule bg-white px-4 py-2.5 text-[13.5px] font-medium text-ink">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[conic-gradient(#EA4335_0_25%,#FBBC05_0_50%,#34A853_0_75%,#4285F4_0)] text-[10px] font-bold text-white">
                G
              </span>
              Continue with Google
            </div>
            <Cursor at={700} />
          </div>
          <div className="flex items-center gap-3 rounded-md border border-rule bg-white px-4 py-2.5 text-[13.5px] font-medium text-ink">
            <span className="grid h-5 w-5 grid-cols-2 gap-[2px]">
              <span className="bg-[#F25022]" />
              <span className="bg-[#7FBA00]" />
              <span className="bg-[#00A4EF]" />
              <span className="bg-[#FFB900]" />
            </span>
            Continue with Microsoft
          </div>
        </div>
      </Panel>
      <div
        className="film-pop mt-3 flex items-center gap-3 rounded-card border border-signal/30 bg-signal-soft px-4 py-3"
        style={d(2300)}
      >
        <Check size={16} className="text-signal" />
        <span className="min-w-0 flex-1 truncate text-[13px] text-ink">adaeze@brightfold.co</span>
        <span className="text-[12px] font-medium text-signal">Connected</span>
      </div>
    </div>
  );
}

function SceneImport() {
  return (
    <div className="mx-auto max-w-[480px]">
      <Panel className="p-5 sm:p-6">
        <p className="text-[15px] font-semibold text-ink">Import contacts</p>
        <div className="mt-4 flex flex-col items-center rounded-md border-2 border-dashed border-rule bg-paper px-4 py-5 text-center">
          <Upload size={18} className="text-slate-soft" />
          <p className="mt-1.5 text-[12.5px] text-slate">Drop a CSV here</p>
          <div
            className="film-drop mt-3 flex items-center gap-2 rounded-md border border-rule bg-white px-3 py-1.5 text-[12.5px] text-ink shadow-lift"
            style={d(500)}
          >
            <FileSpreadsheet size={14} className="text-signal" /> q3-uk-ops-leads.csv
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-paper-sunk">
          <div className="film-fill h-full rounded-full bg-ink" style={{ width: "100%", "--dur": "1500ms", ...d(1300) }} />
        </div>
      </Panel>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          ["1,840", "imported", "text-signal"],
          ["37", "duplicates merged", "text-route"],
          ["12", "invalid, rejected", "text-stamp"],
        ].map(([n, l, c], i) => (
          <div key={l} className="film-pop rounded-card border border-rule bg-paper-card px-3 py-2.5" style={d(3000 + i * 180)}>
            <p className={`font-display text-[18px] font-semibold tnum ${c}`}>{n}</p>
            <p className="text-[11.5px] text-slate">{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SceneWrite() {
  return (
    <div className="mx-auto grid max-w-[620px] gap-3 sm:grid-cols-[150px_1fr]">
      <div className="hidden space-y-2 sm:block">
        {["Step 1 · Day 0", "Step 2 · Day 3", "Step 3 · Day 8"].map((s, i) => (
          <div
            key={s}
            className={`film-rise rounded-md border px-3 py-2 text-[12px] ${
              i === 0 ? "border-ink bg-white font-medium text-ink" : "border-rule bg-paper-card text-slate"
            }`}
            style={d(150 + i * 140)}
          >
            {s}
          </div>
        ))}
      </div>
      <Panel className="p-4 sm:p-5" delay={100}>
        <p className="text-[11.5px] font-medium text-slate">Subject</p>
        <p className="mt-1 rounded-md border border-rule bg-white px-3 py-2 text-[13.5px] text-ink">
          <span className="film-type" style={{ "--dur": "1500ms", "--steps": 34, ...d(600) }}>
            quick one about {"{{company}}"}'s despatch
          </span>
        </p>
        <p className="mt-3 text-[11.5px] font-medium text-slate">Body</p>
        <div className="mt-1 space-y-1.5 rounded-md border border-rule bg-white px-3 py-2.5 text-[13px] leading-relaxed text-ink">
          <p className="film-rise" style={d(2200)}>
            Hi <Chip delay={2400}>first_name</Chip>,
          </p>
          <p className="film-rise" style={d(2700)}>
            I noticed <Chip delay={2900}>company</Chip> runs its own despatch rather than outsourcing…
          </p>
          <p className="film-rise text-slate" style={d(3300)}>
            Worth a 12-minute look?
          </p>
        </div>
        <p className="film-pop mt-3 inline-flex items-center gap-1.5 rounded-full bg-route-soft px-2.5 py-1 text-[11.5px] text-route" style={d(3900)}>
          Preview: “Hi Marcus, I noticed Halden Logistics…”
        </p>
      </Panel>
    </div>
  );
}

const Chip = ({ children, delay }) => (
  <span className="film-pop inline-block rounded bg-route-soft px-1.5 text-[12px] font-medium text-route" style={d(delay)}>
    {`{{${children}}}`}
  </span>
);

function SceneLaunch() {
  const rows = [
    ["Marcus Bello", "Halden Logistics", "adaeze@"],
    ["Priya Raman", "Northgate Health", "hello@"],
    ["Chidi Okonkwo", "Kestrel Foods", "a.nwosu@"],
    ["Sara Lindqvist", "Vantage Studio", "adaeze@"],
  ];
  return (
    <div className="mx-auto max-w-[560px]">
      <Panel className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold text-ink">Q3 — UK manufacturing</p>
            <p className="text-[12px] text-slate">1,840 contacts · 3 steps · 3 mailboxes</p>
          </div>
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3.5 py-2 text-[13px] font-medium text-white">
              <Rocket size={14} /> Launch
            </span>
            <Cursor at={400} travel={900} from={["-120px", "90px"]} />
          </div>
        </div>
        <div className="film-fill mt-4 h-[5px] overflow-hidden rounded-full" style={{ width: "100%", "--dur": "600ms", ...d(1500) }}>
          <div className="airmail-running h-full w-full" />
        </div>
        <ul className="mt-3 divide-y divide-rule">
          {rows.map(([name, co, box], i) => (
            <li key={name} className="film-rise flex items-center gap-3 py-2 text-[12.5px]" style={d(1800 + i * 450)}>
              <Mail size={13} className="text-slate-soft" />
              <span className="min-w-0 flex-1 truncate text-ink">
                {name} <span className="text-slate">· {co}</span>
              </span>
              <span className="hidden text-slate-soft sm:inline">via {box}</span>
              <span className="film-pop text-signal" style={d(2100 + i * 450)}>
                delivered
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function SceneReply() {
  return (
    <div className="relative mx-auto max-w-[560px]">
      <Panel className="p-4 sm:p-5">
        <p className="text-[12px] font-medium text-slate">Marcus Bello · sequence</p>
        <ul className="mt-3 space-y-2 text-[12.5px]">
          <li className="flex items-center gap-2.5">
            <Check size={14} className="text-signal" /> Step 1 sent · Day 0
          </li>
          <li className="flex items-center gap-2.5">
            <Check size={14} className="text-signal" /> Step 2 sent · Day 3
          </li>
          <li className="flex items-center gap-2.5 text-slate">
            <span className="relative">
              Step 3 scheduled · Day 8
              <span className="film-strike absolute inset-x-0 top-1/2 h-[1.5px] bg-stamp" style={d(2600)} />
            </span>
            <span className="film-pop rounded border border-stamp px-1.5 text-[10.5px] font-bold uppercase tracking-wider text-stamp" style={d(3000)}>
              Cancelled
            </span>
          </li>
        </ul>
      </Panel>

      <div
        className="film-slide mt-3 flex gap-3 rounded-card border border-route/30 bg-white p-4 shadow-panel sm:absolute sm:-right-6 sm:-top-6 sm:mt-0 sm:w-[300px]"
        style={d(900)}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-route text-white">
          <MessageSquareReply size={14} />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-ink">
            Marcus replied <span className="ml-1 rounded-full bg-signal-soft px-1.5 py-0.5 text-[10.5px] font-medium text-signal">Interested</span>
          </p>
          <p className="mt-1 text-[12.5px] leading-snug text-slate">“Happy to take a look. Does Thursday 2pm work?”</p>
        </div>
      </div>
    </div>
  );
}
