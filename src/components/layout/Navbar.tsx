"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import { motion } from "framer-motion";
import { FlaskConical } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50">
      {/* Glass bar */}
      <div
        className="border-b border-panel-border"
        style={{
          background: "rgba(4,5,10,0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group select-none"
            aria-label="NInsideN home"
          >
            {/* Neural node icon */}
            <span className="relative flex items-center justify-center w-7 h-7">
              <span className="absolute inset-0 rounded-full bg-accent-cyan/8 group-hover:bg-accent-cyan/14 transition-colors" />
              <span className="w-2.5 h-2.5 rounded-full bg-accent-cyan shadow-glow-sm-cyan" />
            </span>
            <span className="text-base font-bold tracking-tight leading-none">
              <span className="text-accent-cyan">N</span>
              <span className="text-foreground/55 font-light">Inside</span>
              <span className="text-accent-violet">N</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-3 py-1.5 rounded-lg text-sm transition-all duration-150",
                    active
                      ? "text-accent-cyan font-medium"
                      : "text-foreground-dim hover:text-foreground font-normal"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-accent-cyan/8 rounded-lg border border-accent-cyan/16"
                      transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
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
              "hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium",
              "bg-accent-cyan/8 text-accent-cyan border border-accent-cyan/20",
              "hover:bg-accent-cyan/15 hover:border-accent-cyan/45 hover:shadow-glow-sm-cyan",
              "transition-all duration-200"
            )}
          >
            <FlaskConical size={14} />
            Open Lab
          </Link>
        </div>
      </div>

      {/* Bottom glow line */}
      <div
        className="h-px w-full"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.15) 35%, rgba(157,122,255,0.12) 65%, transparent 100%)",
        }}
      />
    </header>
  );
}

