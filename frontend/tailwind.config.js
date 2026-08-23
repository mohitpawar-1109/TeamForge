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
        nothing: {
          bg: '#050505',
          'bg-secondary': '#0A0A0A',
          surface: '#111111',
          'surface-secondary': '#161616',
          'surface-elevated': '#1B1B1B',
          border: '#242424',
          'border-subtle': '#1F1F1F',
          'border-bright': '#333333',
          red: '#E50914',
          'red-bright': '#FF1F2D',
          'red-dark': '#7A080F',
          'red-glow': 'rgba(229, 9, 20, 0.4)',
          text: '#F5F5F5',
          'text-secondary': '#A1A1A1',
          'text-muted': '#6F6F6F',
          green: '#20D47A',
          yellow: '#F2B705',
          purple: '#8B5CF6',
          blue: '#2AA8FF',
        },
        dark: {
          bg: '#050505',
          surface: '#111111',
          card: '#111111',
          elevated: '#1B1B1B',
          border: '#242424',
          'border-subtle': '#1F1F1F',
        },
        brand: {
          50: '#F5F5F5',
          100: '#E5E5E5',
          200: '#A1A1A1',
          300: '#6F6F6F',
          400: '#FF1F2D',
          500: '#E50914',
          600: '#C00711',
          700: '#7A080F',
          800: '#161616',
          900: '#111111',
          950: '#050505',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"SFMono-Regular"', '"Roboto Mono"', '"JetBrains Mono"', 'monospace'],
        display: ['"Nothing NDot"', 'Ndot', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(0, 0, 0, 0.6)',
        'soft-lg': '0 14px 40px rgba(0, 0, 0, 0.8)',
        'glow-red': '0 0 25px -5px rgba(229, 9, 20, 0.5)',
        'glow-red-lg': '0 0 35px 0px rgba(229, 9, 20, 0.6)',
        'glow-white': '0 0 20px -5px rgba(255, 255, 255, 0.2)',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'pulse-red': 'pulseRed 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.03)' },
        },
        pulseRed: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)', boxShadow: '0 0 10px rgba(229, 9, 20, 0.6)' },
          '50%': { opacity: 0.8, transform: 'scale(1.05)', boxShadow: '0 0 20px rgba(229, 9, 20, 0.9)' },
        }
      }
    },
  },
  plugins: [],
}
