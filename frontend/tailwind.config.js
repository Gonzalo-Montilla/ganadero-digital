/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3faf4",
          100: "#ddf3e1",
          200: "#bce7c6",
          300: "#8dd3a1",
          400: "#56b776",
          500: "#349b5b",
          600: "#257f48",
          700: "#1f663c",
          800: "#1d5132",
          900: "#19432a",
        },
        soil: "#7a4e2b",
      },
      boxShadow: {
        soft: "0 10px 30px -14px rgba(16, 24, 40, 0.25)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
