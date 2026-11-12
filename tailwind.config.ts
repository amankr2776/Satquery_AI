import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        gunmetal: '#1C232E',
        surface: {
          DEFAULT: '#232B38',
          hover: '#2C3646',
          light: '#E8E6E1',
        },
        concrete: {
          DEFAULT: '#E8E6E1',
          text: '#D1D5DB',
        },
        slateText: '#2A323C',
        gold: {
          DEFAULT: '#FFB800',
          bright: '#FFC526',
          dark: '#D99B00',
        },
        cyberBlue: '#1F4BFF',
        bloodOrange: '#FF4F1F',
        borderSubtle: 'rgba(232, 230, 225, 0.1)',
      },
      fontFamily: {
        calibri: ['Calibri', 'system-ui', 'sans-serif'],
        sans: ['Calibri', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
