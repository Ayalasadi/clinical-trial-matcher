/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        'ds-text-dark': '#0A0A0A',
        'ds-text-body': '#4B5563',
        'ds-surface': '#FFFFFF',
        'ds-border': '#E5E7EB',
        'ds-accent': '#556BFF',
        'ds-cta': '#0A0A0A',
        'ds-cta-text': '#FFFFFF',
        'ds-grad-top': '#F3F6FF',
        'ds-grad-bottom': '#DDE7FF',
      },
      boxShadow: {
        'ds-card': '0 24px 48px -8px rgba(0,0,0,0.12)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        'pill': '9999px',
      },
      maxWidth: {
        '7xl': '80rem',
      },
    },
  },
  plugins: [],
};
