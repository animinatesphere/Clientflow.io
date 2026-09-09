export const money = (n, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n ?? 0);

export const num = (n) => new Intl.NumberFormat("en-US").format(n ?? 0);

export const pct = (part, whole) =>
  !whole ? "0%" : `${Math.round((part / whole) * 1000) / 10}%`;

export const shortDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

export const fullDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const dateTime = (d) =>
  new Date(d).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export function relative(d) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fullDate(d);
}

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/** Deterministic pastel-free avatar tint drawn from the brand palette. */
const TINTS = ["#0E1B2A", "#1B4B8F", "#1F7A5C", "#B07203", "#A82820", "#5A6472"];
export const tintFor = (seed = "") => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  return TINTS[h % TINTS.length];
};

export const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
export const minsAgo = (n) => new Date(Date.now() - n * 60000).toISOString();
export const daysAhead = (n) => new Date(Date.now() + n * 86400000).toISOString();
