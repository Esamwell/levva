import type { Config } from "tailwindcss";

// Design tokens da Levva — mesma identidade da landing page.
// Mantenha esse arquivo como fonte única de verdade pra cor/tipografia
// em todo o app (pai, motorista, admin).
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#12203D",
          soft: "#1B2E52",
        },
        amber: {
          DEFAULT: "#E8A33D",
          soft: "#F4C767",
        },
        cream: {
          DEFAULT: "#FBF8F1",
          line: "#E6E0D2",
        },
        ink: {
          DEFAULT: "#161510",
          soft: "#5B584C",
        },
        sage: {
          DEFAULT: "#4F6D5C",
          soft: "#E5EBE4",
        },
      },
      fontFamily: {
        serif: ["'Instrument Serif'", "serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["'Space Mono'", "monospace"],
      },
      borderRadius: {
        card: "20px",
      },
    },
  },
  plugins: [],
};
export default config;
