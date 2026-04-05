/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        cream: '#F5EFE0',
        terracotta: '#C4603A',
        sage: '#7A9E7E',
        bark: '#3D2B1F',
      },
      fontFamily: {
        fraunces: ['Fraunces_400Regular'],
        'fraunces-bold': ['Fraunces_700Bold'],
        sans: ['DMSans_400Regular'],
        'sans-medium': ['DMSans_500Medium'],
        'sans-bold': ['DMSans_700Bold'],
      },
    },
  },
  plugins: [],
};
