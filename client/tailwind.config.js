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
          bg: '#09140F',           // Ink black main background
          surface: '#11221A',      // Secondary surface
          panel: '#193225',        // Card / elevated container
          hover: '#224433',        // Interactive hover state
          border: '#234735',       // Precise border
          borderSubtle: '#14291F', // Muted boundary
          borderStrong: '#2A5540', // Focused / prominent border
          primary: '#34D399',      // Vivid lime accent
          primaryHover: '#2BBF88', // Lime hover
          text: '#D1FAE5',         // Warm off-white primary text
          muted: '#8E919C',        // Restrained cool gray secondary text
          subtle: '#5E606A',       // Subtle / helper text
          gold: '#E5A84B',         // Host badge
          mod: '#82A8F8',          // Moderator badge
          danger: '#F87171',       // Error / decline
          success: '#34D399',      // Success / live sync
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
        'lime-ring': '0 0 0 1px #34D399',
      },
    },
  },
  plugins: [],
}
