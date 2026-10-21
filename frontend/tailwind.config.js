/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bgDark: '#050204',
        cardDark: '#121012',
        hotPink: '#FF1F6B',
        deepCrimson: '#B0004A',
        darkWine: '#3A0620',
        wirePink: '#FF2D7A',
        mutedPink: '#B9A9B1',
        allowGreen: '#3DDC97',
        askAmber: '#FFBD6B',
        blockRed: '#FF1F6B',
        // Legacy aliases
        cyberCyan: '#FF1F6B',
        cyberBlue: '#B0004A',
        neonCyan: '#FF2D7A',
        deepNavy: '#3A0620',
        slateMuted: '#B9A9B1',
        iceBlue: '#FFD1E3',
      },
      animation: {
        'spin-slow': 'spin 40s linear infinite',
        'spin-reverse-slow': 'spinReverse 45s linear infinite',
        'float-slow': 'float 5.5s ease-in-out infinite',
        'float-delayed': 'float 6.2s ease-in-out 1.8s infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        'marquee': 'marquee 28s linear infinite',
        'shimmer-slow': 'shimmerSweep 6s ease-in-out infinite',
        'flow-beam': 'beamFlow 2s linear infinite',
        'badge-shine': 'badgeShine 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'cursorBlink 1s step-end infinite',
      },
      keyframes: {
        spinReverse: {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmerSweep: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        beamFlow: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        badgeShine: {
          '0%': { transform: 'translateX(-150%) skewX(-20deg)' },
          '25%, 100%': { transform: 'translateX(250%) skewX(-20deg)' },
        },
        cursorBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        }
      }
    }
  },
  plugins: [],
}
