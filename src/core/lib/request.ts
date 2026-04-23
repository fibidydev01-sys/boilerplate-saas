/**
 * Request utilities — extract client info dari HTTP request.
 *
 * Generic on web standard `Request` so bisa dipake dengan `NextRequest`
 * maupun plain `Request` (Route Handler dengan signature `GET(request: Request)`).
 */

/**
 * Extract client IP address dari forwarded headers.
 *
 * Order of precedence:
 *   1. x-forwarded-for (first IP in chain — client, bukan proxy)
 *   2. x-real-ip (nginx convention)
 *
 * Returns `null` kalau header tidak ada (e.g., local dev tanpa proxy).
 *
 * SECURITY NOTE: Headers ini bisa di-spoof kalau app gak behind trusted
 * reverse proxy. Di production (Vercel, Cloudflare, dll), proxy-nya
 * override/set header ini, jadi trustable. Di self-hosted tanpa proxy,
 * jangan trust.
 */
export function getClientIP(
  request: Request | { headers: Headers }
): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for bisa berisi chain: "client, proxy1, proxy2"
    // Client IP = first entry.
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return null;
}

/**
 * Extract user-agent string. Returns `null` kalau header gak ada.
 */
export function getUserAgent(
  request: Request | { headers: Headers }
): string | null {
  return request.headers.get("user-agent");
}