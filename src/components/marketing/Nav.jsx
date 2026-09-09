import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "../Logo";
import { Button } from "../ui";

const LINKS = [
  { to: "/product", label: "Product" },
  { to: "/deliverability", label: "Deliverability" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-200 ${
        stuck ? "border-b border-rule bg-paper/90 backdrop-blur-md" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-shell items-center justify-between gap-6 px-5 sm:px-8">
        <Link to="/" aria-label="ClientFlow home">
          <Logo size={30} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded px-3 py-2 text-[14px] transition-colors ${
                  isActive ? "text-ink" : "text-slate hover:text-ink"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button as={Link} to="/login" variant="ghost" size="sm">
            Sign in
          </Button>
          <Button as={Link} to="/signup" size="sm">
            Start free trial
          </Button>
        </div>

        <button
          className="rounded p-2 text-ink md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-rule bg-paper px-5 py-4 md:hidden">
          <nav className="flex flex-col">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="border-b border-rule py-3 text-[15px] text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex gap-2">
            <Button as={Link} to="/login" variant="secondary" className="flex-1">
              Sign in
            </Button>
            <Button as={Link} to="/signup" className="flex-1">
              Start free trial
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
