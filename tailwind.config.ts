import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#06070d",
        foreground: "#e2e8f0",
        muted: "#64748b",
        panel: "#0d1117",
        "panel-border": "#1e2230",
        "accent-cyan": "#00d4ff",
        "accent-violet": "#8b5cf6",
        "accent-green": "#10b981",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "grid-dark":
          "linear-gradient(rgba(30,34,48,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(30,34,48,0.5) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        "flow-dash": "flowDash 2s linear infinite",
        "float": "float 4s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%": { opacity: "0.4" },
          "100%": { opacity: "1" },
        },
        flowDash: {
          "0%": { strokeDashoffset: "100" },
          "100%": { strokeDashoffset: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(0,212,255,0.3), 0 0 40px rgba(0,212,255,0.1)",
        "glow-violet": "0 0 20px rgba(139,92,246,0.3), 0 0 40px rgba(139,92,246,0.1)",
        "glow-green": "0 0 20px rgba(16,185,129,0.3), 0 0 40px rgba(16,185,129,0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
