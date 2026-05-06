/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0d0d12',
          1: '#131319',
          2: '#1a1a23',
          3: '#22222d',
          4: '#2a2a38',
        },
        gold: {
          300: '#fde68a',
          400: '#f5c842',
          500: '#e8b800',
          600: '#c49a00',
        },
        bull: '#22c55e',
        bear: '#ef4444',
        neutral: '#6b7280',
        ob: {
          bull: 'rgba(34,197,94,0.15)',
          bear: 'rgba(239,68,68,0.15)',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
