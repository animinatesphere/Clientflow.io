import { Link } from "react-router-dom";
import Logo from "../Logo";
import { AirmailRule } from "../ui";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { to: "/product", label: "How it works" },
      { to: "/deliverability", label: "Deliverability" },
      { to: "/pricing", label: "Pricing" },
      { to: "/signup", label: "Start a trial" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About" },
      { to: "/contact", label: "Contact" },
      { to: "/pricing#faq", label: "Questions" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/privacy", label: "Privacy policy" },
      { to: "/terms", label: "Terms of service" },
      { to: "/acceptable-use", label: "Acceptable use" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-24 bg-ink text-white/70">
      <AirmailRule className="h-[6px]" />
      <div className="mx-auto max-w-shell px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo size={30} reverse />
            <p className="mt-4 max-w-[34ch] text-[14px] leading-relaxed">
              Outbound email infrastructure for teams who would rather send fewer, better
              emails than burn a domain.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-[14px] font-semibold text-white">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-[14px] transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink-line pt-6 text-[13px] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ClientFlow. All rights reserved.</p>
          <p>
            You are responsible for the lists you upload. Read the{" "}
            <Link to="/acceptable-use" className="underline hover:text-white">
              acceptable use policy
            </Link>{" "}
            before you send.
          </p>
        </div>
      </div>
    </footer>
  );
}
