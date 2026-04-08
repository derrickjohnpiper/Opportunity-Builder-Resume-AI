/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "rgba(15, 17, 21, 0.12)",
        input: "rgba(15, 17, 21, 0.20)",
        ring: "#1D3557",
        background: "#FFFFFF",
        foreground: "#0F1115",
        surface: "#F9FAFB",
        surface_alt: "#F3F4F6",
        primary: {
          DEFAULT: "#1D3557",
          hover: "#2A4B7C",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F3F4F6",
          foreground: "#0F1115",
        },
        destructive: {
          DEFAULT: "#E07A5F",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F9FAFB",
          foreground: "#4B5563",
        },
        accent: {
          DEFAULT: "#F3F4F6",
          foreground: "#0F1115",
          warm: "#E07A5F",
          success: "#2A9D8F",
          warning: "#E9C46A",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F1115",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F1115",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      fontFamily: {
        heading: ["Cabinet Grotesk", "sans-serif"],
        body: ["IBM Plex Sans", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}