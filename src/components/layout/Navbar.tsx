"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import { BRAND } from "@/lib/constants/brand";
import { motion } from "framer-motion";

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-panel-border bg-background/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group"
          aria-label="NInsideN home"
        >
          <span className="text-lg font-bold tracking-tight">
            <span className="text-accent-cyan">N</span>
            <span className="text-foreground/80">Inside</span>
            <span className="text-accent-violet">N</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150",
                  active
                    ? "text-accent-cyan"
                    : "text-foreground/60 hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-accent-cyan/10 rounded-lg border border-accent-cyan/20"
                    transition={{ type: "spring", duration: 0.3 }}
                  />
                )}
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* CTA */}
        <Link
          href="/lab"
          className={cn(
            "hidden sm:inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium",
            "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30",
            "hover:bg-accent-cyan/20 hover:border-accent-cyan/60 transition-all duration-200"
          )}
        >
          Open Lab
        </Link>
      </div>
    </header>
  );
}
