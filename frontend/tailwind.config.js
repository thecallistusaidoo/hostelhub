/** @type {import('tailwindcss').Config} */
module.exports = {
  // IMPORTANT: "class" strategy means dark mode is toggled by adding .dark to <html>
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1E40AF",
          dark:    "#1e3a8a",
          deeper:  "#172554",
        },
        gold: {
          DEFAULT: "#F59E0B",
          dark:    "#D97706",
        },
      },
      fontFamily: {
        sans:    ["DM Sans", "system-ui", "sans-serif"],
        heading: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass:    "0 8px 32px rgba(30, 64, 175, 0.10)",
        "glass-lg":"0 20px 60px rgba(30, 64, 175, 0.15)",
        gold:     "0 4px 14px rgba(245, 158, 11, 0.35)",
        brand:    "0 4px 14px rgba(30, 64, 175, 0.35)",
      },
      animation: {
        "fade-up":   "fadeInUp 0.4s ease both",
        "pulse-slow":"pulse 3s infinite",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};