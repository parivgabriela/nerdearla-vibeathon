/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#0b1020",
        card: "#121a33",
        text: "#e6e9ef",
        muted: "#98a2b3",
        accent: "#4f46e5",
      },
      boxShadow: {
        card: "0 10px 30px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};
