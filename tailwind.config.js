/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        canvas: '#f7f8fa',
        surface: '#ffffff',
        border: '#e8eaed',
        'border-light': '#f1f3f5',
        brand: {
          hero: '#5B9BD5',
          cta: '#00A86B',
          'cta-hover': '#00915d',
          emerald: '#007A4D',
          features: '#E8F5E9',
          body: '#333333',
          secondary: '#4A4A4A',
        },
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.06), 0 1px 3px -1px rgb(0 0 0 / 0.04)',
        'float': '0 8px 24px -4px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.04)',
      },
      keyframes: {
        letterIn: {
          '0%': { opacity: '0', transform: 'translateY(0.5rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        letterWave: {
          '0%, 100%': { opacity: '0.45', transform: 'translateY(0.45rem)' },
          '22%': { opacity: '1', transform: 'translateY(0)' },
          '55%': { opacity: '1', transform: 'translateY(0)' },
          '78%': { opacity: '0.45', transform: 'translateY(0.35rem)' },
        },
        loadingSweep: {
          '0%': { transform: 'translateX(-140%) skewX(-18deg)' },
          '100%': { transform: 'translateX(320%) skewX(-18deg)' },
        },
      },
      animation: {
        'letter-in': 'letterIn 0.42s ease forwards',
        'letter-wave': 'letterWave 2.35s ease-in-out infinite',
        'loading-sweep': 'loadingSweep 1.75s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
