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
        mt: {
          bg: "var(--mt-bg)",
          panel: "var(--mt-panel)",
          text: "var(--mt-text)",
          muted: "var(--mt-muted)",
          accent: "var(--mt-accent)",
          accent2: "var(--mt-accent-2)",
          error: "var(--mt-error)",
          errorExtra: "var(--mt-error-extra)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sarabun)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "var(--font-sarabun)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
