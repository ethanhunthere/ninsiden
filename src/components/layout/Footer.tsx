import Link from "next/link";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import { BRAND } from "@/lib/constants/brand";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-panel-border relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px]"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.14), rgba(157,122,255,0.1), transparent)" }}
        aria-hidden
      />

      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex flex-col items-center sm:items-start gap-1.5">
          <span className="text-sm font-semibold tracking-tight">
            <span className="text-accent-cyan">N</span>
            <span className="text-foreground/50 font-light">Inside</span>
            <span className="text-accent-violet">N</span>
          </span>
          <span className="text-xs text-muted">{BRAND.tagline} — AI made visible.</span>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs text-muted hover:text-foreground-dim transition-colors duration-150"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

