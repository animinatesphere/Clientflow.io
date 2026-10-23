import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Fetch-on-mount with loading/error state. `deps` re-runs the fetcher. */
export function useAsync(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.resolve(fetcher())
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, loading, error, reload, setData };
}

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The page's motion, driven by data attributes so markup stays declarative.
 * Deliberately used on marketing pages only — the application shell does not
 * animate on every navigation.
 *
 *   [data-word]         hero headline words, rising out of a mask on load
 *   [data-tilt]         settles from a 3D tilt into place on load
 *   [data-scrub-words]  its [data-sw] words light up one by one with scroll
 *   [data-enter]        rises into place as it scrolls into view, in batches
 *   [data-parallax="n"] drifts n px upward across its pass through the viewport
 *   [data-expand]       opens from an inset frame to full size as it arrives
 */
export function useEntrance(enabled = true) {
  const scope = useRef(null);
  useEffect(() => {
    if (!enabled || !scope.current || reduced()) return;
    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray("[data-word]");
      if (words.length) {
        gsap.fromTo(
          words,
          { yPercent: 110, rotate: 4, opacity: 0 },
          { yPercent: 0, rotate: 0, opacity: 1, duration: 1.05, ease: "expo.out", stagger: 0.045, delay: 0.1 }
        );
      }

      const items = gsap.utils.toArray("[data-enter]");
      if (items.length) {
        gsap.set(items, { opacity: 0, y: 26, filter: "blur(6px)" });
        ScrollTrigger.batch(items, {
          start: "top 88%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.9,
              ease: "power3.out",
              stagger: 0.08,
              delay: words.length ? 0.35 : 0,
              clearProps: "filter",
            }),
        });
      }

      gsap.utils.toArray("[data-tilt]").forEach((el) => {
        gsap.fromTo(
          el,
          { rotateX: 16, rotateY: -12, y: 70, opacity: 0, transformPerspective: 1600 },
          { rotateX: 0, rotateY: 0, y: 0, opacity: 1, duration: 1.6, ease: "expo.out", delay: 0.35 }
        );
      });

      gsap.utils.toArray("[data-scrub-words]").forEach((el) => {
        gsap.fromTo(
          el.querySelectorAll("[data-sw]"),
          { opacity: 0.14 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.1,
            scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.5 },
          }
        );
      });

      gsap.utils.toArray("[data-parallax]").forEach((el) => {
        gsap.to(el, {
          y: -Number(el.dataset.parallax || 40),
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        });
      });

      gsap.utils.toArray("[data-expand]").forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: "inset(6% 5% 6% 5% round 28px)", scale: 0.96 },
          {
            clipPath: "inset(0% 0% 0% 0% round 10px)",
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top 95%", end: "top 45%", scrub: 0.6 },
          }
        );
      });
    }, scope);
    return () => ctx.revert();
  }, [enabled]);
  return scope;
}

export const prefersReducedMotion = reduced;

/** Counts a number up once, when it first scrolls into view. */
export function useCountUp(target, { duration = 1.1, decimals = 0 } = {}) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced()) {
      el.textContent = Number(target).toFixed(decimals);
      return;
    }
    const obj = { v: 0 };
    let tween;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        tween = gsap.to(obj, {
          v: target,
          duration,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = Number(obj.v).toLocaleString("en-US", {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            });
          },
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      tween?.kill();
    };
  }, [target, duration, decimals]);
  return ref;
}

/** Closes a panel on Escape and on outside click. */
export function useDismiss(open, onClose) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, onClose]);
  return ref;
}

/** Locks body scroll while a modal or drawer is open. */
export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}
