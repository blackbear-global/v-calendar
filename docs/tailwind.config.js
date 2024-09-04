import colors from 'tailwindcss/colors';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './.vitepress/**/*.{js,ts,vue}',
    './calendar/**/*.md',
    './datepicker/**/*.md',
    './event-calendar/**/*.md',
    './examples/**/*.md',
    './getting-started/**/*.md',
    './i18n/**/*.md',
  ],
  darkMode: 'class',
  theme: {
    fontFamily: {
      display: ['Lexend', 'sans-serif'],
      sans: ['Inter', 'sans-serif'],
    },
    extend: {
      colors: {
        accent: colors.indigo,
      },
    },
  },
  plugins: [forms, typography],
};
