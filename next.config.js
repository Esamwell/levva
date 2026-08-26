/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Camada extra de defesa: o nginx (nginx.active.conf, fora do git) já
  // aplica esses cabeçalhos no domínio real, HTTPS, cobrindo tudo — inclusive
  // /api/*. Isso aqui garante o mesmo mesmo se a app for acessada sem passar
  // pelo nginx (dev, teste, ou config futura divergente).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
