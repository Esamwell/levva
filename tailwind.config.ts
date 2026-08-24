import type { Config } from "tailwindcss";

// Design tokens da Levva — mesma identidade da landing page.
// Mantenha esse arquivo como fonte única de verdade pra cor/tipografia
// em todo o app (pai, motorista, admin).
//
// Os tokens semânticos do shadcn/ui (primary, card, border, ring, etc.)
// apontam pras variáveis CSS definidas em app/globals.css, que por sua
// vez usam os MESMOS valores de navy/amber/cream/sage/ink — assim os
// componentes de components/ui/ saem com a cara da Levva.
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
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        serif: ["'Instrument Serif'", "serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["'Space Mono'", "monospace"],
      },
      borderRadius: {
        card: "20px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
