/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'executive-dark': '#0f172a',
        'executive-darker': '#020617',
        'executive-accent': '#0ea5e9',
        'executive-success': '#10b981',
        'executive-warning': '#f59e0b',
        'executive-danger': '#ef4444',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
