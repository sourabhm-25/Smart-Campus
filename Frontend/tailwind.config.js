/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#256af4",
        "background-dark": "#101622",
        "scholar-blue": "#3b82f6",
        "mentorship-purple": "#8b5cf6",
        "support-teal": "#14b8a6",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"],
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