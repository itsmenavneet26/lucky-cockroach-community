/**
 * Server-side URL allowlist used wherever user-supplied URLs are stored
 * (link posts, future link previews, webhook endpoints, etc.).
 *
 * The bar is intentionally narrow:
 *  - scheme must be http/https
 *  - hostname cannot be localhost, an IP address, or a known private
 *    range (defence against blind SSRF if we ever fetch link previews
 *    server-side)
 *  - URL length cannot exceed 2048 characters
 */

const PRIVATE_HOSTS = new Set([
  "localhost",
  "0.0.0.0",
  "127.0.0.1",
  "::1",
  "::",
  "metadata.google.internal",
  "169.254.169.254", // AWS/GCP/Azure metadata endpoint
]);

function isPrivateIPv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [, a, b] = m.map(Number) as unknown as [number, number, number, number, number];
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 0) return true;
  return false;
}

function isIPv6Literal(host: string): boolean {
  return host.includes(":");
}

export function isSafeExternalUrl(raw: string): boolean {
  if (typeof raw !== "string") return false;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2048) return false;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  if (!host) return false;
  if (PRIVATE_HOSTS.has(host)) return false;
  if (host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (isPrivateIPv4(host)) return false;
  // Bracketed IPv6 literals → URL strips the brackets in hostname.
  if (isIPv6Literal(host)) return false;
  return true;
}
