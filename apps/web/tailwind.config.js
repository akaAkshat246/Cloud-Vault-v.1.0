/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vault: {
          950: '#060a10',
          900: '#0a0f1a', // Primary dark background
          850: '#0f172a',
          800: '#111827', // Card surface
          750: '#1e293b',
          700: '#1e3a4a', // Border accent
          teal: '#0f766e',
          cyan: '#0891b2',
          purple: '#7c3aed',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}

