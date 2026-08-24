/**
 * Utilitários de requisição.
 *
 * O app roda atrás do Nginx, então o IP do socket é sempre o do proxy —
 * o IP real do cliente vem em X-Forwarded-For, que o nginx.conf preenche.
 */

export function ipDoCliente(req: Request): string {
  const encaminhado = req.headers.get("x-forwarded-for");
  if (encaminhado) {
    // X-Forwarded-For pode ter vários IPs; o primeiro é o cliente original.
    const primeiro = encaminhado.split(",")[0]?.trim();
    if (primeiro) return primeiro;
  }
  return req.headers.get("x-real-ip")?.trim() || "desconhecido";
}

export function userAgentDoCliente(req: Request): string | null {
  return req.headers.get("user-agent")?.slice(0, 255) ?? null;
}
