/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#030303',
          900: '#050505', // Core Obsidian Black
          850: '#0A0A0A',
          800: '#111111', // Card & Panel Surface
          750: '#161616',
          700: '#1F1F1F',
          600: '#2A2A2A',
        },
        chrome: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5', // Bright Metallic Silver
          300: '#D4D4D4',
          400: '#C0C0C0', // Core Chrome Silver
          500: '#A3A3A3', // Muted Silver
          600: '#737373',
          700: '#525252',
          800: '#404040',
        },
        laser: {
          300: '#FF6680',
          400: '#FF3355',
          500: '#FF0033', // Core Laser Crimson Red
          600: '#CC0029',
          700: '#99001F',
          800: '#660014',
          glow: 'rgba(255, 0, 51, 0.45)',
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Orbitron', 'Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'laser-red': '0 0 25px -2px rgba(255, 0, 51, 0.5), 0 0 10px 0px rgba(255, 0, 51, 0.3)',
        'laser-glow': '0 0 35px -5px rgba(255, 0, 51, 0.65)',
        'chrome-edge': '0 0 20px -2px rgba(192, 192, 192, 0.15)',
        'obsidian-glass': '0 12px 40px 0 rgba(0, 0, 0, 0.85)',
      },
      animation: {
        'laser-scan': 'laserScan 2.4s ease-in-out infinite',
        'pulse-glow': 'laserPulse 2.8s ease-in-out infinite',
        'spin-slow': 'spin 16s linear infinite',
        'radar': 'radar 5s linear infinite',
        'float': 'float 5s ease-in-out infinite',
      },
      keyframes: {
        laserScan: {
          '0%, 100%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(100%)' },
        },
        laserPulse: {
          '0%, 100%': { opacity: 0.8, filter: 'drop-shadow(0 0 15px rgba(255, 0, 51, 0.6))' },
          '50%': { opacity: 1, filter: 'drop-shadow(0 0 25px rgba(255, 0, 51, 0.9))' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
