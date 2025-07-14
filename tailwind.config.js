/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./views/**/*.ejs',
    './public/**/*.html',
    './src/**/*.js',],
  theme: {
    extend: { 
      colors: {
        primary: {
        100: '#DBEAFE',
        500: '#3B82F6',
        600: '#2563EB',
        700: '#1D4ED8',
      },
        secondary: {
        500: '#10B981',
        600: '#059669',
      },
    },},
  },
  plugins: [],
}

