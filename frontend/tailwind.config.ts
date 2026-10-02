import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "#4F46E5",
          foreground: "#ffffff",
          dark: "#4338CA",
          light: "#6366F1",
        },
        secondary: {
          DEFAULT: "#0F172A",
          foreground: "#F8FAFC",
        },
        accent: {
          DEFAULT: "#06B6D4",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#64748B",
        },
        border: "#E2E8F0",
      },
    },
  },
  plugins: [],
};
export default config;
