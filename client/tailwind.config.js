/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#10B981", // emerald-500
        secondary: "#1F2937", // gray-800
        background: "#111827", // gray-900
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
