/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'trading-green': '#22c55e',
        'trading-red': '#ef4444',
        'trading-bg': '#0f0f23',
        'trading-card': '#1a1a2e',
        'trading-border': '#2a2a4a',
      }
    },
  },
  plugins: [],
}
