import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        harlo: {
          ink: "#111827",
          muted: "#5f6876",
          line: "#e2e8ee",
          canvas: "#f8fafc",
          surface: "#ffffff",
          teal: "#087f95",
          blue: "#0d8faa",
          mist: "#e6f3f6",
          navy: "#066375"
        }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
