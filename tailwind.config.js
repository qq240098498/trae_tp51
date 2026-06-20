/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        forest: {
          50: "#eef3ee",
          100: "#d6e2d8",
          200: "#aac6ae",
          300: "#7da884",
          400: "#52845c",
          500: "#2f4a37",
          600: "#273d2e",
          700: "#1f3024",
          800: "#17231a",
          900: "#0f160f",
        },
        clay: {
          50: "#fbf0ea",
          100: "#f4d6c5",
          200: "#e9ad8a",
          300: "#df8454",
          400: "#c9632f",
          500: "#a8501f",
          600: "#853f17",
          700: "#633012",
          800: "#42200c",
          900: "#291405",
        },
        wheat: {
          50: "#fbf6e8",
          100: "#f5e8c0",
          200: "#ecd185",
          300: "#e3bd4f",
          400: "#d9a441",
          500: "#b88527",
          600: "#94681d",
          700: "#6f4d16",
          800: "#4a3310",
          900: "#2a1d09",
        },
        paper: "#f6f1e7",
        card: "#fbf8f1",
        ink: "#2b2620",
        muted: "#7c7264",
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
        mono: ['"DM Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(43,38,32,0.04), 0 8px 24px -12px rgba(43,38,32,0.12)",
        lift: "0 2px 4px rgba(43,38,32,0.05), 0 16px 40px -16px rgba(43,38,32,0.22)",
        inset: "inset 0 1px 2px rgba(43,38,32,0.08)",
      },
      borderRadius: {
        xl2: "1rem",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "slide-in": "slide-in 0.32s cubic-bezier(0.22,1,0.36,1) both",
        "scale-in": "scale-in 0.2s ease-out both",
      },
    },
  },
  plugins: [],
};
