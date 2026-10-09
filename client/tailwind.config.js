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
          bg: '#101114',           // Ink black main background
          surface: '#16171B',      // Secondary surface
          panel: '#1C1E24',        // Card / elevated container
          hover: '#24262E',        // Interactive hover state
          border: '#282A33',       // Precise border
          borderSubtle: '#1E2026', // Muted boundary
          borderStrong: '#3A3D4A', // Focused / prominent border
          primary: '#D6F279',      // Vivid lime accent
          primaryHover: '#C3E065', // Lime hover
          text: '#F2F0E9',         // Warm off-white primary text
          muted: '#8E919C',        // Restrained cool gray secondary text
          subtle: '#5E606A',       // Subtle / helper text
          gold: '#E5A84B',         // Host badge
          mod: '#82A8F8',          // Moderator badge
          danger: '#F87171',       // Error / decline
          success: '#D6F279',      // Success / live sync
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'cinema': '0 8px 32px -4px rgba(0, 0, 0, 0.65)',
        'fine': '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
        'lime-ring': '0 0 0 1px #D6F279',
      },
    },
  },
  plugins: [],
}
