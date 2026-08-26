import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mova — Transporte escolar verificado em Salvador",
  description:
    "A Mova conecta famílias a transportadores escolares 100% verificados em Salvador e Lauro de Freitas. #vaidemova",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Inter:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-cream text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
