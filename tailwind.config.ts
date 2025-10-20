import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'sv-esting': {
          DEFAULT: '#509f28',
          50: '#f0f8eb',
          100: '#dff0d3',
          200: '#c1e2ab',
          300: '#9dce79',
          400: '#7ab94d',
          500: '#509f28',
          600: '#3d7a1f',
          700: '#30601a',
          800: '#284c18',
          900: '#234117',
        },
      },
    },
  },
  plugins: [],
};
export default config;