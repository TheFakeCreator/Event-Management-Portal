/** @type {import('tailwindcss').Config} */
import { safelist } from "./tailwind.safelist.js";

export default {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
    "./public/index.html",
    "./views/**/*.ejs",
  ],
  safelist: safelist,
  darkMode: "class", // Enable class-based dark mode
  theme: {
    extend: {
      screens: {
        xs: "475px",
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#3762EC",
          50: "#eaf0fe",
          100: "#dbe6fd",
          200: "#b7cdfb",
          300: "#8baaf7",
          400: "#5c85f2",
          500: "#3762EC",
          600: "#2b4ec2",
          700: "#223d99",
          800: "#192b70",
          900: "#101947",
        }, // Dark theme color palette
        dark: {
          bg: "#04050A", // Dark background
          surface: "#04050A", // Card/surface backgrounds
          card: "#13172b", // Elevated surfaces
          border: "#0d0d0f", // Borders and dividers (fixed missing #)
          text: {
            primary: "#ffffff", // Primary text - white for dark mode
            secondary: "#cbd5e1", // Secondary text
            muted: "#94a3b8", // Muted text
          },
        },
      },
    },
  },
  plugins: [],
};
