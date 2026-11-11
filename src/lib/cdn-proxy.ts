// Game files hosted on public CDNs are served through this app's own
// /api/public/cdn/<host>/<path> relay, so a network that blocks the CDN
// (common on school networks) still lets the games load.
export const CDN_PROXY_HOSTS = [
  "cdn.jsdelivr.net",
  "fastly.jsdelivr.net",
  "gcore.jsdelivr.net",
  "testingcf.jsdelivr.net",
  "cdnjs.cloudflare.com",
  "unpkg.com",
  "raw.githack.com",
  "rawcdn.githack.com",
  "raw.githubusercontent.com",
];

export const CDN_PROXY_PATH = "/api/public/cdn/";

export function isProxiedHost(host: string): boolean {
  return CDN_PROXY_HOSTS.includes(host.toLowerCase());
}

const HOST_PATTERN = CDN_PROXY_HOSTS.map((h) => h.replace(/\./g, "\\.")).join("|");

/** Rewrite absolute and protocol-relative CDN URLs in pasted game code to the relay. */
export function rewriteCdnUrls(html: string, origin: string): string {
  const re = new RegExp(`(?:https?:)?//(${HOST_PATTERN})/`, "gi");
  return html.replace(re, (_m, host: string) => `${origin}${CDN_PROXY_PATH}${host.toLowerCase()}/`);
}

/** Map a relay request path (after the prefix) back to the upstream CDN URL, or null if not allowed. */
export function upstreamFromRelayPath(rest: string, search: string): string | null {
  const slash = rest.indexOf("/");
  const host = (slash === -1 ? rest : rest.slice(0, slash)).toLowerCase();
  if (!isProxiedHost(host)) return null;
  const path = slash === -1 ? "/" : rest.slice(slash);
  return `https://${host}${path}${search}`;
}
