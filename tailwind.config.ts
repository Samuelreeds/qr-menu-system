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
        brand: {
          green: "#5CB85C",
          dark: "#1A1A1A",
          gray: "#F4F5F7",
        }
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
      // Ensure this is here to link Tailwind to the CSS variables
      fontFamily: {
        sans: ["var(--font-poppins)", "var(--font-chenla)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;