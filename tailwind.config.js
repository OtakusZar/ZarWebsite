/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Latin display face + CJK fallback so mixed EN/中文 stays even.
        sans: [
          '"Inter var"',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          '"Noto Sans SC"',
          'sans-serif',
        ],
        display: [
          '"Fraunces"',
          '"Iowan Old Style"',
          '"Palatino Linotype"',
          '"Songti SC"',
          '"Noto Serif SC"',
          'Georgia',
          'serif',
        ],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        paper: '#faf8f4',
        ink: {
          50: '#f7f8fa',
          100: '#eceef2',
          200: '#d6dae2',
          300: '#b0b7c5',
          400: '#848ea3',
          500: '#626d84',
          600: '#4c566b',
          700: '#3d4557',
          800: '#2a3040',
          900: '#1b1f2b',
          950: '#0f1219',
        },
        accent: {
          50: '#eef4ff',
          100: '#dbe7ff',
          200: '#bed2ff',
          300: '#92b4ff',
          400: '#5e8bff',
          500: '#3a63f2',
          600: '#2947d4',
          700: '#2238ab',
          800: '#1f318b',
          900: '#1e2d6e',
        },
        sand: {
          50: '#fbf8f3',
          100: '#f5efe3',
          200: '#e9dfc9',
          300: '#d9c8a5',
          400: '#c3a97e',
          500: '#b0905f',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,18,27,0.04), 0 12px 32px -12px rgba(16,18,27,0.14)',
        'card-hover': '0 2px 6px rgba(16,18,27,0.06), 0 20px 48px -16px rgba(16,18,27,0.22)',
        float: '0 24px 80px -32px rgba(16,18,27,0.35)',
        ring: '0 0 0 1px rgba(255,255,255,0.06)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      keyframes: {
        'grid-pan': {
          '0%': { transform: 'translate3d(0,0,0)' },
          '100%': { transform: 'translate3d(-56px,-56px,0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'aurora-a': {
          '0%,100%': { transform: 'translate3d(-6%, -4%, 0) scale(1)' },
          '50%': { transform: 'translate3d(6%, 6%, 0) scale(1.12)' },
        },
        'aurora-b': {
          '0%,100%': { transform: 'translate3d(5%, 3%, 0) scale(1.08)' },
          '50%': { transform: 'translate3d(-7%, -6%, 0) scale(1)' },
        },
      },
      animation: {
        'grid-pan': 'grid-pan 9s linear infinite',
        shimmer: 'shimmer 1.8s ease-in-out infinite',
        'aurora-a': 'aurora-a 18s ease-in-out infinite',
        'aurora-b': 'aurora-b 22s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
