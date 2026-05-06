import Link from "next/link";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import { Github, Twitter, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-panel-border relative overflow-hidden">
      {/* Top seam glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[820px] h-[1px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(0,229,255,0.2), rgba(157,122,255,0.18), transparent)",
        }}
        aria-hidden
      />

      <div className="max-w-[1440px] mx-auto px-5 lg:px-10 py-12">
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr] gap-10 mb-10">
          {/* Brand block */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-7 h-7 rounded-md flex items-center justify-center bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 border border-accent-violet/30">
                <span className="w-2 h-2 rounded-full bg-accent-cyan shadow-glow-sm-cyan" />
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-foreground">
                NInsideN<span className="text-foreground-dim font-normal">.com</span>
              </span>
            </div>
            <p className="text-sm text-foreground-dim leading-relaxed max-w-sm">
              Neural Inside Network — the observable AI pipeline. We show
              what AI uses, not how it secretly thinks.
            </p>
            <div className="flex items-center gap-2 mt-5">
              {[
                { Icon: Github,  label: "GitHub",  href: "https://github.com" },
                { Icon: Twitter, label: "Twitter", href: "https://twitter.com" },
                { Icon: Mail,    label: "Email",   href: "mailto:hello@ninsiden.com" },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-md border border-panel-border text-foreground-dim hover:text-accent-cyan hover:border-accent-cyan/40 transition-all"
                >
                  <Icon size={13} />
                </a>
              ))}
            </div>
          </div>

          {/* Product nav */}
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.18em] uppercase text-foreground-dim mb-3">
              Product
            </h4>
            <ul className="space-y-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-foreground-dim hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Honest manifesto */}
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.18em] uppercase text-foreground-dim mb-3">
              Promise
            </h4>
            <p className="text-sm text-foreground-dim leading-relaxed">
              NInsideN shows the observable process: inputs, sources, context,
              and outputs. We do not claim to expose hidden reasoning or
              chain-of-thought.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-panel-border opacity-60 mb-5" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-muted">
          <span>© {new Date().getFullYear()} NInsideN.com — All rights reserved.</span>
          <span className="font-mono">v1.0 · observable pipeline</span>
        </div>
      </div>
    </footer>
  );
}
