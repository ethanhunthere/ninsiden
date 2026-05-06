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
        background: "#04050a",
        surface: "#080b12",
        foreground: "#dce8f5",
        "foreground-dim": "#8ea4bc",
        muted: "#4a5a72",
        panel: "#080d16",
        "panel-raised": "#0c1220",
        "panel-border": "#16213a",
        "panel-border-bright": "#1e3054",
        "accent-cyan": "#00e5ff",
        "accent-cyan-dim": "#00b3cc",
        "accent-violet": "#9d7aff",
        "accent-violet-dim": "#7c5ccc",
        "accent-green": "#00e5a0",
        "accent-green-dim": "#00b87d",
        "accent-amber": "#f59e0b",
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
        "glow-cyan": "0 0 24px rgba(0,229,255,0.3), 0 0 60px rgba(0,229,255,0.1)",
        "glow-violet": "0 0 24px rgba(157,122,255,0.3), 0 0 60px rgba(157,122,255,0.1)",
        "glow-green": "0 0 24px rgba(0,229,160,0.3), 0 0 60px rgba(0,229,160,0.1)",
        "glow-sm-cyan": "0 0 12px rgba(0,229,255,0.25)",
        "glow-sm-violet": "0 0 12px rgba(157,122,255,0.25)",
        "glow-sm-green": "0 0 12px rgba(0,229,160,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
