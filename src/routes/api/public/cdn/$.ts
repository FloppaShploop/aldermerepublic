import { createFileRoute } from "@tanstack/react-router";
import { CDN_PROXY_PATH, upstreamFromRelayPath } from "@/lib/cdn-proxy";

// Public relay for game assets on an allowlist of CDN hosts. It serves only
// public files from those hosts (no cookies or credentials are forwarded),
// so it cannot be used to reach arbitrary sites.
const PASS_HEADERS = ["content-type", "content-range", "accept-ranges", "etag", "last-modified"];

async function relay(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const idx = url.pathname.indexOf(CDN_PROXY_PATH);
  const rest = idx === -1 ? "" : url.pathname.slice(idx + CDN_PROXY_PATH.length);
  const upstreamUrl = upstreamFromRelayPath(rest, url.search);
  if (!upstreamUrl) return new Response("host not allowed", { status: 403 });

  const headers: Record<string, string> = {
    "user-agent": "Mozilla/5.0 (compatible; ArcadeRelay/1.0)",
    accept: request.headers.get("accept") ?? "*/*",
  };
  const range = request.headers.get("range");
  if (range) headers.range = range;

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, { headers, redirect: "follow" });
  } catch {
    return new Response("upstream unreachable", { status: 502, headers: { "access-control-allow-origin": "*" } });
  }

  const out = new Headers();
  for (const h of PASS_HEADERS) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  out.set("access-control-allow-origin", "*");
  out.set("cross-origin-resource-policy", "cross-origin");
  out.set("cache-control", upstream.ok ? "public, max-age=86400" : "no-store");
  return new Response(request.method === "HEAD" ? null : upstream.body, { status: upstream.status, headers: out });
}

export const Route = createFileRoute("/api/public/cdn/$")({
  server: {
    handlers: {
      GET: ({ request }) => relay(request),
      HEAD: ({ request }) => relay(request),
      OPTIONS: () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, HEAD, OPTIONS",
            "access-control-allow-headers": "*",
          },
        }),
    },
  },
});
