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
        }
      }
    },
  },
  plugins: [],
}
