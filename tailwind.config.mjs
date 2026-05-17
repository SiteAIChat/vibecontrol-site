/** @type {import('tailwindcss').Config} */
const brandColors = ['blue', 'teal', 'orange', 'coral'];
const opacities = ['10', '15', '20', '25', '30', '40'];

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  safelist: [
    ...brandColors.map((c) => `text-brand-${c}`),
    ...brandColors.map((c) => `bg-brand-${c}`),
    ...brandColors.flatMap((c) => opacities.map((o) => `bg-brand-${c}/${o}`)),
    ...brandColors.flatMap((c) => opacities.map((o) => `border-brand-${c}/${o}`)),
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#4A90D9',
          orange: '#E8855E',
          teal: '#4DC9A0',
          coral: '#E86B6B',
        },
      },
    },
  },
  plugins: [],
};
