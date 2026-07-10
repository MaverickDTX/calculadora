/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0B0F17',
          elevated: '#111827',
          hover: '#1F2937',
          active: '#4B5563',
        },
        border: {
          DEFAULT: '#1F2937',
          strong: '#4B5563',
          focus: '#7777EE',
        },
        text: {
          primary: '#F9FAFB',
          secondary: '#9CA3AF',
          muted: '#8B93A1',
        },
        accent: {
          DEFAULT: '#7777EE',
          hover: '#818CF8',
          soft: 'rgba(99,102,241,0.15)',
          glow: 'rgba(99,102,241,0.4)',
        },
        value: {
          DEFAULT: '#10B981',
          soft: 'rgba(16,185,129,0.12)',
          glow: 'rgba(16,185,129,0.3)',
        },
        warn: {
          DEFAULT: '#F59E0B',
          soft: 'rgba(245,158,11,0.12)',
        },
        danger: {
          DEFAULT: '#EF4444',
          soft: 'rgba(239,68,68,0.12)',
        },
        info: {
          DEFAULT: '#38BDF8',
          soft: 'rgba(56,189,248,0.12)',
        },
        kelly: {
          DEFAULT: '#A78BFA',
          soft: 'rgba(139,92,246,0.12)',
        },
      },
      fontFamily: {
        mono: ['"Chivo Mono"', '"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        xl: '12px',
        lg: '10px',
        md: '8px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(99,102,241,0.15)',
        'glow-green': '0 0 20px rgba(16,185,129,0.15)',
        'glow-warn': '0 0 20px rgba(245,158,11,0.15)',
        'glow-danger': '0 0 20px rgba(239,68,68,0.15)',
        panel: '0 4px 24px rgba(0,0,0,0.4)',
        float: '0 8px 32px rgba(0,0,0,0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'count': 'count 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
