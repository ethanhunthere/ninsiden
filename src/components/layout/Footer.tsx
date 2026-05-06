import Link from "next/link";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import { BRAND } from "@/lib/constants/brand";

export function Footer() {
  return (
    <footer className="border-t border-panel-border mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center sm:items-start gap-1">
          <span className="text-sm font-semibold">
            <span className="text-accent-cyan">N</span>
            <span className="text-foreground/80">Inside</span>
            <span className="text-accent-violet">N</span>
            <span className="text-foreground/50 ml-2">— {BRAND.full}</span>
          </span>
          <span className="text-xs text-muted">Built to make AI visible.</span>
        </div>

        <nav className="flex items-center gap-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs text-muted hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
