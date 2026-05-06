"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants/navigation";

/**
 * Brand mark — six-point neural snowflake/star.
 * Built as inline SVG so it inherits theme colours and stays crisp.
 */
function BrandMark({ size = 26 }: { size?: number }) {
  const r = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      style={{ filter: "drop-shadow(0 0 6px rgba(0,229,255,0.5))" }}
    >
      <defs>
        <linearGradient id="brand-grad" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#00e5ff" />
          <stop offset="100%" stopColor="#9d7aff" />
        </linearGradient>
      </defs>
      {/* 6 radial spokes */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const x2 = r + Math.cos(angle) * (r - 3);
        const y2 = r + Math.sin(angle) * (r - 3);
        return (
          <line
            key={i}
            x1={r}
            y1={r}
            x2={x2}
            y2={y2}
            stroke="url(#brand-grad)"
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        );
      })}
      {/* 6 mid-spoke crosses */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const mx = r + Math.cos(angle) * (r - 6);
        const my = r + Math.sin(angle) * (r - 6);
        const px = Math.cos(angle + Math.PI / 2) * 3;
        const py = Math.sin(angle + Math.PI / 2) * 3;
        return (
          <line
            key={"c" + i}
            x1={mx - px}
            y1={my - py}
            x2={mx + px}
            y2={my + py}
            stroke="url(#brand-grad)"
            strokeWidth={1.2}
            strokeLinecap="round"
            opacity={0.7}
          />
        );
      })}
      {/* Centre core */}
      <circle cx={r} cy={r} r={2.4} fill="url(#brand-grad)" />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div
        className="border-b border-panel-border"
        style={{
          background: "rgba(4,5,10,0.72)",
          backdropFilter: "blur(28px) saturate(140%)",
          WebkitBackdropFilter: "blur(28px) saturate(140%)",
        }}
      >
        <div className="max-w-[1440px] mx-auto px-5 lg:px-10 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group select-none shrink-0"
            aria-label="NInsideN home"
          >
            <BrandMark size={26} />
            <span className="text-[15px] font-semibold tracking-tight leading-none text-foreground">
              NInsideN<span className="text-foreground-dim font-normal">.com</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-3.5 py-1.5 rounded-lg text-[13.5px] transition-colors duration-150",
                    active
                      ? "text-foreground font-medium"
                      : "text-foreground-dim hover:text-foreground font-normal"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-bg"
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(157,122,255,0.15) 0%, rgba(0,229,255,0.06) 100%)",
                        border: "1px solid rgba(157,122,255,0.25)",
                      }}
                      transition={{ type: "spring", duration: 0.4, bounce: 0.18 }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            <Link
              href="/about"
              className="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-lg text-[13.5px] font-medium text-foreground-dim hover:text-foreground border border-panel-border hover:border-panel-border-bright bg-[rgba(8,13,22,0.5)] transition-all duration-150"
            >
              Log in
            </Link>
            <Link
              href="/lab"
              className="inline-flex items-center px-4 py-1.5 rounded-lg text-[13.5px] font-semibold text-white border transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #7c5ccc 0%, #9d7aff 100%)",
                borderColor: "rgba(157,122,255,0.6)",
                boxShadow:
                  "0 4px 18px rgba(157,122,255,0.32), 0 0 0 1px rgba(255,255,255,0.06) inset",
              }}
            >
              Try NInsideN
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden ml-1 w-9 h-9 inline-flex items-center justify-center rounded-lg text-foreground-dim hover:text-foreground border border-panel-border"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-panel-border bg-[rgba(4,5,10,0.95)]">
            <div className="px-5 py-3 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm",
                      active
                        ? "text-foreground bg-accent-violet/10 border border-accent-violet/25"
                        : "text-foreground-dim hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom seam glow */}
      <div
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.18) 30%, rgba(157,122,255,0.18) 70%, transparent 100%)",
        }}
      />
    </header>
  );
}
