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
        // WhatsApp Reference Design Palette
        cosmic: {
          void: '#0D0B18',        // AppBackgroundDark (8.12.31 PM)
          surface: '#161226',     // CardBackgroundDark (8.12.31 PM)
          elevated: '#221C38',    // SurfaceLayer / Elevated dark
          border: '#352C55',      // Input outline / Border dark
          divider: '#2D234D',     // Divider track
          light: '#F0F0F0',       // AppBackgroundLight
          cardLight: '#F0E0F0',   // CardBackgroundLight
          borderLight: '#D0D0F0', // DividerBorderLight
        },
        brand: {
          purple: '#B090F0',       // PrimaryPurple (8.12.31 PM (1))
          accent: '#A080F0',       // BrightAccentPurple
          hover: '#C0B0F0',        // HoverLavender
          chip: '#B4A8E8',         // MediumLavender
          deep: '#9070E0',         // DeepSoftPurple
          glow: '#A890FF',         // LogoGlowPurple
          link: '#8F6BFF',         // LinkPurple
          start: '#A784FF',        // PrimaryButton start
          end: '#8F6BFF',          // PrimaryButton end
        },
        textToken: {
          headingDark: '#FFFFFF',
          headingLight: '#2B2B3C',
          secondaryDark: '#A3A1BD',
          secondaryLight: '#5E5E73',
          placeholder: '#8D8DA5',
          disabled: '#B6B6C9',
        },
        vault: {
          950: '#060a10',
          900: '#0D0B18',
          850: '#161226',
          800: '#221C38',
          750: '#2D234D',
          700: '#352C55',
          purple: '#8F6BFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #A784FF 0%, #8F6BFF 100%)',
        'fab-gradient': 'linear-gradient(180deg, #B090F0 0%, #8F6BFF 100%)',
        'squircle-gradient': 'radial-gradient(circle, #7C3AED 0%, #4C1D95 100%)',
      },
      boxShadow: {
        'glow-purple': '0 4px 24px -2px rgba(168, 144, 255, 0.35)',
        'glow-fab': '0 8px 30px rgba(176, 144, 240, 0.45)',
        'cosmic-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-14px) rotate(3deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        'orbit-rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        'orbit-rotate': 'orbit-rotate 24s linear infinite',
        shimmer: 'shimmer 2s infinite',
        'fade-in-up': 'fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fade-in 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
}
