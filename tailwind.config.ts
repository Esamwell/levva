import type { Config } from "tailwindcss";

// Design tokens da Mova — mesma identidade da landing page.
// Mantenha esse arquivo como fonte única de verdade pra cor/tipografia
// em todo o app (pai, motorista, admin).
//
// Os NOMES dos tokens (navy, amber, cream, ink, sage) ficaram do rebrand
// anterior — só os VALORES mudaram pra paleta da Mova (amarelo #FEDB1A +
// preto). Renomear centenas de `bg-navy`/`text-amber` espalhados pelo app
// seria puro risco sem ganho visível; "navy" hoje é o preto de marca e
// "amber" é o amarelo — pense neles como slots semânticos, não cores
// literais.
//
// Os tokens semânticos do shadcn/ui (primary, card, border, ring, etc.)
// apontam pras variáveis CSS definidas em app/globals.css, que por sua
// vez usam os MESMOS valores — assim os componentes de components/ui/
// saem com a cara da Mova.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#111111",
          soft: "#262626",
        },
        amber: {
          DEFAULT: "#FEDB1A",
          soft: "#FFEB80",
        },
        cream: {
          DEFAULT: "#FFFFFF",
          line: "#E5E5E5",
        },
        ink: {
          DEFAULT: "#111111",
          soft: "#6B6B6B",
        },
        // Não é cor de marca — é o acento semântico de "verificado/aprovado"
        // (CNH conferida, assinatura ativa etc.). Fica à parte do par
        // amarelo+preto de propósito: um check preto ou amarelo perderia o
        // sinal visual de "confirmado".
        sage: {
          DEFAULT: "#4A7A5E",
          soft: "#E4EFE7",
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
        // Token "serif" mantido pelo mesmo motivo das cores acima — hoje é
        // a fonte de título/wordmark da marca, não literalmente uma serifa.
        // Fredoka é a fonte redonda/geométrica que bate com o "mova" da logo.
        serif: ["Fredoka", "sans-serif"],
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
