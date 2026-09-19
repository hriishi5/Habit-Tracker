/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        momentum: {
          bg: "#0B0F17",
          card: "#131B2A",
          cardHover: "#1A2438",
          border: "#1E293B",
          borderHover: "#334155",
          primary: "#3B82F6",
          accent: "#10B981",
          gold: "#F59E0B",
          flame: "#FF5722",
          purple: "#8B5CF6",
          text: "#F8FAFC",
          muted: "#94A3B8"
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flame-flicker': 'flicker 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        flicker: {
          '0%': { transform: 'scale(1) rotate(-1deg)', filter: 'drop-shadow(0 0 4px rgba(255, 87, 34, 0.4))' },
          '100%': { transform: 'scale(1.08) rotate(1deg)', filter: 'drop-shadow(0 0 10px rgba(255, 87, 34, 0.8))' }
        }
      }
    },
  },
  plugins: [],
}
