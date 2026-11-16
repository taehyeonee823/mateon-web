import defaultTheme from 'tailwindcss/defaultTheme'
import containerQueries from '@tailwindcss/container-queries'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontFamily: {
      sans: ['Pretendard Variable', 'Pretendard', ...defaultTheme.fontFamily.sans],
      pretendard: ['Pretendard Variable', 'Pretendard', 'sans-serif'],
      'seoul-alrim': ['SeoulAlrim', 'Pretendard Variable', 'sans-serif'],
      handwriting: ['Nanum Pen Script', 'cursive'],
    },
    extend: {
      // 탑바처럼 뷰포트가 아니라 자기 폭(채팅 패널이 열리면 줄어듦)에 반응해야 하는 요소용
      containers: {
        tablet: '768px',
        desktop: '1024px',
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
  plugins: [containerQueries],
}
