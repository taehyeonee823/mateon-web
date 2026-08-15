/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pretendard: ['Pretendard Variable', 'Pretendard', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#F0F4FF',
          100: '#E1E9FF',
          200: '#C3D3FF',
          300: '#A5BDFF',
          400: '#8BA9FF',
          500: '#6D8EF5',
          600: '#5170D6',
          700: '#3B54AD',
          800: '#283A7D',
          900: '#1A2554',
        },
      },
    },
  },
  plugins: [],
}
