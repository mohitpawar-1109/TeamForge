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
          50: '#F6E8E2',
          100: '#F0DCD3',
          200: '#DDA081',
          300: '#CB6B5A',
          400: '#B85551',
          500: '#A84A4D',
          600: '#8C3D49',
          700: '#703344',
          800: '#4A2A35',
          900: '#351F28',
          950: '#150d10ff',
        },
        dark: {
          bg: '#150d10ff',
          surface: '#4A2A35',
          card: '#4A2A35',
          elevated: '#703344',
          border: '#703344',
          'border-subtle': 'rgba(221, 160, 129, 0.15)',
        },
        autumn: {
          bg: '#150d10ff',
          'bg-alt': '#351F28',
          'bg-deep': '#150d10ff',
          surface: '#4A2A35',
          'surface-hover': '#703344',
          card: '#4A2A35',
          'card-elevated': '#703344',
          accent: '#A84A4D',
          'accent-bright': '#CB6B5A',
          'accent-secondary': '#CB6B5A',
          terracotta: '#A84A4D',
          highlight: '#CB6B5A',
          peach: '#DDA081',
          cream: '#F6E8E2',
          text: '#F6E8E2',
          'text-secondary': '#DDA081',
          'text-muted': '#B8826D',
          border: '#703344',
          'border-subtle': 'rgba(221, 160, 129, 0.15)',
        },
        slate: {
          850: '#351F28',
          950: '#150d10ff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(0, 0, 0, 0.35)',
        'soft-lg': '0 14px 40px rgba(0, 0, 0, 0.45)',
        'glow': '0 0 25px -5px rgba(203, 107, 90, 0.25)',
        'glow-terracotta': '0 0 25px -5px rgba(168, 74, 77, 0.35)',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 7s ease-in-out 2s infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.05)' },
        }
      }
    },
  },
  plugins: [],
}
