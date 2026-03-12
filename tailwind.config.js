/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ghibli: {
          blue: 'var(--color-ghibli-blue)',
          green: 'var(--color-ghibli-green)',
          cream: 'var(--color-ghibli-cream)',
          pink: 'var(--color-ghibli-pink)',
        },
      },
      animation: {
        float: 'float 20s infinite ease-in-out',
        bounce: 'bounce 0.6s infinite alternate',
      },
    },
  },
  plugins: [],
};