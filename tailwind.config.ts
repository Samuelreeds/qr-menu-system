// tailwind.config.ts
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
          green: "#5CB85C", // Adjusted to match the 'Add' button and 'Salads' active state
          dark: "#1A1A1A",
          gray: "#F4F5F7",
        }
      },
      borderRadius: {
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
};
export default config;