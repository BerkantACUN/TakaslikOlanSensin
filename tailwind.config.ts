import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5ff",
          100: "#d9e8ff",
          200: "#b8d4ff",
          300: "#87b6ff",
          400: "#5690ff",
          500: "#2f6fff",
          600: "#1f56e6",
          700: "#1942b8",
          800: "#143591",
          900: "#122c75",
        },
        accent: {
          amber: "#f59e0b",
          coral: "#ff5a5f",
        },
        carbon: "#1a1a1a",
        slate: {
          DEFAULT: "#6a6a6a",
          50: "#fafafa",
          100: "#f5f5f5",
        },
        silver: "#c1c1c1",
        stone: "#b0b0b0",
        pebble: "#dddddd",
        mist: "#ebebeb",
        fog: "#f7f7f7",
        cloud: "#ffffff",
        mint: "#e8f7ef",
        success: "#16a34a",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        pill: "999px",
      },
      boxShadow: {
        subtle:
          "rgba(0, 0, 0, 0.02) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 2px 6px 0px, rgba(0, 0, 0, 0.08) 0px 4px 8px 0px",
        card:
          "rgba(0, 0, 0, 0.04) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 8px 24px -4px",
        pop:
          "rgba(0, 0, 0, 0.08) 0px 12px 32px -8px, rgba(0, 0, 0, 0.04) 0px 4px 12px -2px",
        button: "rgba(0, 0, 0, 0.05) 0px 1px 2px 0px",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.35s ease-out",
        shimmer: "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
