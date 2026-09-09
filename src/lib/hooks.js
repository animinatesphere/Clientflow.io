import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";

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
 * One orchestrated entrance for a page. Elements carrying [data-enter] rise
 * into place in document order. Deliberately used on marketing pages only —
 * the application shell does not animate on every navigation.
 */
export function useEntrance(enabled = true) {
  const scope = useRef(null);
  useEffect(() => {
    if (!enabled || !scope.current || reduced()) return;
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray("[data-enter]");
      if (!items.length) return;
      gsap.set(items, { opacity: 0, y: 18 });
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.62,
        ease: "power3.out",
        stagger: 0.07,
        delay: 0.05,
      });
    }, scope);
    return () => ctx.revert();
  }, [enabled]);
  return scope;
}

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
