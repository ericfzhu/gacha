/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#37352f',
        paper: '#ffffff',
        cloud: '#f7f6f3',
        line: '#e9e9e7',
      },
      fontFamily: {
        heading: ['"IBM Plex Sans"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
