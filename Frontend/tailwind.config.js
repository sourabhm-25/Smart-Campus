/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy colors
        "primary": "#256af4",
        "background-dark": "#101622",
        "scholar-blue": "#3b82f6",
        "mentorship-purple": "#8b5cf6",
        "support-teal": "#14b8a6",

        // Stitch Design System (sc- prefix)
        "sc": {
          "bg": "#0b1326",
          "surface": "#0b1326",
          "surface-bright": "#31394d",
          "surface-ctr": "#171f33",
          "surface-ctr-low": "#131b2e",
          "surface-ctr-high": "#222a3d",
          "surface-ctr-highest": "#2d3449",
          "surface-ctr-lowest": "#060e20",
          "surface-variant": "#2d3449",
          "surface-tint": "#c0c1ff",
          "on-bg": "#dae2fd",
          "on-surface": "#dae2fd",
          "on-surface-var": "#c7c4d8",
          "pri": "#c0c1ff",
          "pri-ctr": "#4b4dd8",
          "pri-fixed": "#e1e0ff",
          "on-pri": "#1000a9",
          "on-pri-ctr": "#d9d8ff",
          "on-pri-fixed": "#07006c",
          "inv-pri": "#494bd6",
          "sec": "#89ceff",
          "sec-ctr": "#00a2e6",
          "sec-fixed": "#c9e6ff",
          "on-sec": "#00344d",
          "ter": "#ddb7ff",
          "ter-ctr": "#862dd4",
          "ter-fixed": "#f0dbff",
          "on-ter": "#490080",
          "on-ter-ctr": "#ebd2ff",
          "err": "#ffb4ab",
          "err-ctr": "#93000a",
          "on-err": "#690005",
          "outline": "#918fa1",
          "outline-var": "#464555",
        },
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"],
        "headline": ["Manrope", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"],
      },
      keyframes: {
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-in-left': 'slideInLeft 0.8s ease-out forwards',
        'fade-in': 'fadeIn 1s ease-out forwards',
      },
    },
  },
  plugins: [],
}