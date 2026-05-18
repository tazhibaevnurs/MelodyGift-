/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Accent: Indigo / Violet (premium fintech style)
        'primary': '#6366f1',
        'primary-light': '#818cf8',
        'primary-dark': '#4f46e5',
        'accent': '#8b5cf6',
        'accent-light': '#a78bfa',
        'accent-dark': '#7c3aed',
        // Text: deep slate (light) / soft white (dark)
        'slate-deep': '#1e293b',
        'telegram-dark': '#17212B',
        'telegram-light': '#2B5278',
        'telegram-accent': '#62D906',
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
      },
      fontFamily: {
        'inter': ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      backgroundImage: {
        'gradient-soft': 'linear-gradient(135deg, var(--tg-theme-bg-color, #17212B) 0%, color-mix(in srgb, var(--tg-theme-bg-color, #17212B) 85%, #6366f1) 50%, color-mix(in srgb, var(--tg-theme-bg-color, #17212B) 90%, #8b5cf6) 100%)',
      },
    },
  },
  plugins: [],
}
