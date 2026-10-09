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
        brand: {
          primary: '#8067F5',       // Electric Violet
          hover: '#6E52F0',
          dark: '#0B1020',          // Midnight Navy
          surface: '#12182E',       // Card surface
          card: '#161D38',          // Elevated card
          cardHover: '#1D2547',
          border: '#242F56',        // Subtle glowing border
          highlight: '#A99BFF',     // Lavender Glow
          text: '#FFFFFF',          // Cloud White
          muted: '#94A3B8',
          subtle: '#64748B',
          accent: '#06B6D4',        // Cyan accent for tech spark
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(128, 103, 245, 0.25)',
        'glow': '0 0 25px rgba(128, 103, 245, 0.35)',
        'glow-lg': '0 0 45px rgba(128, 103, 245, 0.45)',
        'glow-lavender': '0 0 25px rgba(169, 155, 255, 0.4)',
      },
      keyframes: {
        float: {
          '0%': { transform: 'translateY(0px) scale(0.8)', opacity: '1' },
          '100%': { transform: 'translateY(-140px) scale(1.3)', opacity: '0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.05)' },
        },
      },
      animation: {
        float: 'float 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
      },
    },
  },
  plugins: [],
}
