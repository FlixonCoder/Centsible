import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F8FC",
        surface: "#FFFFFF",
        navy: {
          950: "#0F0E2A",
          900: "#1E1B4B",
          800: "#2B2A6E",
          700: "#3730A3",
        },
        primary: {
          DEFAULT: "#2B2A6E",
          accent: "#4F46E5",
          light: "#EEF2FF",
        },
        lavender: {
          50: "#FAF5FF",
          100: "#F3E8FF",
          500: "#A855F7",
          600: "#7C3AED",
        },
        safe: {
          DEFAULT: "#16A34A",
          bg: "#ECFDF3",
          border: "#BBF7D0",
          text: "#15803D",
        },
        caution: {
          DEFAULT: "#D97706",
          bg: "#FFF7E6",
          border: "#FED7AA",
          text: "#B45309",
        },
        risk: {
          DEFAULT: "#DC2626",
          bg: "#FEF2F2",
          border: "#FECACA",
          text: "#B91C1C",
        },
        cardborder: "#E8EAF3",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        card: "0 4px 12px 0 rgba(30, 27, 75, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.03)",
        glow: "0 0 20px -5px rgba(79, 70, 229, 0.3)",
      },
    },
  },
  plugins: [],
};
export default config;

