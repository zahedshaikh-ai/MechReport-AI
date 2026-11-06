import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        industrial: {
          orange: '#FF7A00',
          'orange-hover': '#E66E00',
          'orange-light': '#FFF1E5',
          black: '#111111',
          dark: '#181A1D',
          card: '#202428',
          border: '#2E343B',
          muted: '#8A94A0',
          ok: '#10B981',
          notok: '#EF4444',
          warn: '#F59E0B',
          blue: '#3B82F6',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;

