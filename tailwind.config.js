/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          500: '#1195dc',
          600: '#0d7ab8',
        },
        green: {
          500: '#29BAA5',
          600: '#22a591',
        },
        red: {
          500: '#dc6062',
          600: '#c54d4f',
          700: '#b03d3f',
        },
      }
    },
  },
  plugins: [],
}
