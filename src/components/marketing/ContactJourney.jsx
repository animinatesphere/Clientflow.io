import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Send, CornerDownRight, MessageSquareReply, Ban } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

/* One contact's sequence, played out as the visitor scrolls. The section pins
   on wide screens and scrubs through four moments; the last one is the point
   of the product — a step that never sends because the person replied.
   Narrow screens and reduced-motion visitors get the same content, static. */

const EVENTS = [
  {
    icon: Send,
    when: "Day 0 · 09:14",
    title: "Step 1 sent",
    meta: "from adaeze@brightfold.co",
    subject: "quick one about Halden's despatch times",
    caption:
      "The first email leaves your own mailbox, spaced out inside the daily ceiling you set.",
  },
  {
    icon: CornerDownRight,
    when: "Day 3 · 10:02",
    title: "Step 2 sent, same thread",
    meta: "no reply yet, so the follow-up goes",
    subject: "Re: quick one about Halden's despatch times",
    caption:
      "No answer, so the follow-up lands in the same thread, the way a person would follow up.",
  },
  {
    icon: MessageSquareReply,
    when: "Day 4 · 16:41",
    title: "Marcus replied",
    meta: "tagged Interested",
    quote: "Happy to take a look. Does Thursday 2pm work for a short call?",
    caption: "Marcus answers. ClientFlow picks the reply up and puts it at the top of your inbox.",
    tone: "reply",
  },
  {
    icon: Ban,
    when: "Day 8 · 09:30",
    title: "Step 3 cancelled",
    meta: "never sent",
    subject: "closing the loop, Marcus",
    caption:
      "Step three never goes out. The sequence stopped the moment he replied, in every campaign he is in.",
    tone: "stop",
  },
];

export default function ContactJourney() {
  const root = useRef(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      el.classList.add("is-cinematic");
      const q = gsap.utils.selector(el);
      const events = q("[data-event]");
      const captions = q("[data-caption]");

      gsap.set(events, { opacity: 0.16, y: 18 });
      gsap.set(captions, { opacity: 0, y: 24 });
      gsap.set(captions[0], { opacity: 1, y: 0 });
      gsap.set(events[0], { opacity: 1, y: 0 });
      gsap.set(q("[data-rail]"), { scaleY: 0, transformOrigin: "top" });
      gsap.set(q("[data-strike]"), { scaleX: 0, transformOrigin: "left" });
      gsap.set(q("[data-stamp]"), { opacity: 0, scale: 1.6, rotate: -14 });

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "+=2200",
          pin: true,
          scrub: 0.8,
        },
      });

      tl.to(q("[data-rail]"), { scaleY: 1, ease: "none", duration: EVENTS.length }, 0);
      for (let i = 1; i < EVENTS.length; i++) {
        const at = i - 0.3;
        tl.to(events[i], { opacity: 1, y: 0, duration: 0.5 }, at)
          .to(captions[i - 1], { opacity: 0, y: -24, duration: 0.35 }, at)
          .to(captions[i], { opacity: 1, y: 0, duration: 0.45 }, at + 0.15);
      }
      tl.to(q("[data-strike]"), { scaleX: 1, duration: 0.4 }, EVENTS.length - 0.9)
        .to(q("[data-stamp]"), { opacity: 1, scale: 1, rotate: -8, duration: 0.3, ease: "back.out(2)" }, EVENTS.length - 0.6)
        .to({}, { duration: 0.4 });

      return () => el.classList.remove("is-cinematic");
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={root} className="group relative mt-24 overflow-hidden bg-ink text-white">
      <div aria-hidden className="envelope-grid pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-1/3 h-[420px] w-[420px] rounded-full bg-route/30 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 h-[360px] w-[360px] rounded-full bg-stamp/20 blur-[120px]"
      />

      <div className="relative mx-auto grid max-w-shell gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-20 group-[.is-cinematic]:min-h-screen group-[.is-cinematic]:py-0">
        {/* narrative */}
        <div>
          <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-stamp">
            One contact, start to finish
          </p>
          <h2 className="mt-4 max-w-[16ch] text-[clamp(1.9rem,3.6vw,2.8rem)] font-semibold leading-[1.08] text-white">
            Watch a sequence stop itself.
          </h2>

          <div className="relative mt-8 space-y-4 group-[.is-cinematic]:h-[120px] group-[.is-cinematic]:space-y-0">
            {EVENTS.map((e, i) => (
              <p
                key={e.title}
                data-caption
                className="max-w-[40ch] text-[17px] leading-relaxed text-white/75 group-[.is-cinematic]:absolute group-[.is-cinematic]:inset-x-0 group-[.is-cinematic]:top-0"
              >
                <span className="mr-2 font-display text-[13px] font-semibold text-white/40 tnum">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {e.caption}
              </p>
            ))}
          </div>
        </div>

        {/* the thread */}
        <div className="relative rounded-card border border-ink-line bg-ink-soft/80 p-6 shadow-panel backdrop-blur sm:p-8">
          <div className="absolute bottom-10 left-[39px] top-10 w-px bg-white/10 sm:left-[47px]">
            <div data-rail className="h-full w-full bg-gradient-to-b from-signal via-route to-stamp" />
          </div>

          <ol className="relative space-y-7">
            {EVENTS.map((e) => (
              <li key={e.title} data-event className="relative flex gap-4">
                <span
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                    e.tone === "reply"
                      ? "border-route bg-route text-white"
                      : e.tone === "stop"
                      ? "border-stamp/60 bg-ink text-stamp"
                      : "border-signal/50 bg-ink text-signal"
                  }`}
                >
                  <e.icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-white/45 tnum">{e.when}</p>
                  <p className="mt-0.5 text-[15px] font-medium text-white">
                    {e.title} <span className="font-normal text-white/45">· {e.meta}</span>
                  </p>
                  {e.subject && (
                    <p className="relative mt-2 inline-block max-w-full truncate rounded-md border border-ink-line bg-ink px-3 py-1.5 text-[13.5px] text-white/80">
                      {e.subject}
                      {e.tone === "stop" && (
                        <span
                          data-strike
                          aria-hidden
                          className="absolute inset-x-2 top-1/2 h-[1.5px] bg-stamp"
                        />
                      )}
                    </p>
                  )}
                  {e.quote && (
                    <blockquote className="mt-2 rounded-md border-l-2 border-route bg-route/15 px-3.5 py-2.5 text-[14px] italic leading-relaxed text-white/90">
                      “{e.quote}”
                    </blockquote>
                  )}
                  {e.tone === "stop" && (
                    <span
                      data-stamp
                      className="absolute -top-1 right-0 rounded border-2 border-stamp px-2 py-0.5 font-display text-[12px] font-bold uppercase tracking-[0.12em] text-stamp"
                      style={{ transform: "rotate(-8deg)" }}
                    >
                      Not sent
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
