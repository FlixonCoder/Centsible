import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F6F7FC",
        navy: {
          950: "#0E0C2B",
          900: "#1E1B4B",
          800: "#2B2A6E",
          700: "#3730A3",
        },
        primary: { DEFAULT: "#2B2A6E", accent: "#4F46E5" },
        safe: { DEFAULT: "#16A34A", bg: "#ECFDF3", border: "#BBF7D0", text: "#15803D" },
        caution: { DEFAULT: "#D97706", bg: "#FFF7E6", border: "#FDE2B0", text: "#B45309" },
        risk: { DEFAULT: "#DC2626", bg: "#FEF2F2", border: "#FECACA", text: "#B91C1C" },
        cardborder: "#E8EAF3",
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "-apple-system", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(30,27,75,0.04), 0 8px 24px -12px rgba(30,27,75,0.10)",
        lift: "0 2px 4px rgba(30,27,75,0.05), 0 18px 40px -16px rgba(30,27,75,0.22)",
        glow: "0 0 0 1px rgba(129,140,248,0.4), 0 8px 30px -6px rgba(99,102,241,0.55)",
      },
    },
  },
  plugins: [],
};
export default config;
