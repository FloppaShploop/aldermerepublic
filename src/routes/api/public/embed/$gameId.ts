import { createFileRoute } from "@tanstack/react-router";
import { ARCADE_BRIDGE } from "@/lib/arcade-bridge";

// Headers that make a site refuse to render inside a frame. The relay strips
// them so admin-approved game links can actually load in the arcade player.
const STRIP_RESPONSE_HEADERS = new Set([
  "x-frame-options",
  "frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
  "cross-origin-opener-policy",
  "cross-origin-embedder-policy",
  "cross-origin-resource-policy",
  "set-cookie",
]);

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "content-encoding",
  "content-length",
]);

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB safety cap

function failPage(message: string): Response {
  const safe = message.replace(/[<>&"]/g, "");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;background:#000;color:#f66;font:13px monospace;display:flex;align-items:center;justify-content:center;text-align:center;padding:2rem}</style></head><body><p>Embed relay: ${safe}</p><script>parent.postMessage({__arcade:'error',message:${JSON.stringify("embed relay: " + safe)}},'*');</scr` + `ipt></body></html>`;
  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

function injectIntoHtml(html: string, finalUrl: string): string {
  const base = `<base href="${finalUrl.replace(/"/g, "&quot;")}">`;
  const injection = base + ARCADE_BRIDGE;
  // Drop any in-page CSP meta tags that would re-block framing/scripts.
  const cleaned = html.replace(/<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*>/gi, "");
  if (/<head[^>]*>/i.test(cleaned)) {
    return cleaned.replace(/<head[^>]*>/i, (m) => m + injection);
  }
  if (/<html[^>]*>/i.test(cleaned)) {
    return cleaned.replace(/<html[^>]*>/i, (m) => m + "<head>" + injection + "</head>");
  }
  return injection + cleaned;
}

export const Route = createFileRoute("/api/public/embed/$gameId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { gameId } = params;

        // Look up the admin-approved URL for this game. Only URLs that exist in
        // the games table are relayed, so this cannot be abused as an open proxy.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: game } = await supabaseAdmin
          .from("games")
          .select("url")
          .eq("id", gameId)
          .maybeSingle();

        if (!game?.url) {
          return failPage("no linked game found for this id");
        }

        let target: URL;
        try {
          target = new URL(game.url);
          if (target.protocol !== "https:" && target.protocol !== "http:") throw new Error("bad scheme");
        } catch {
          return failPage("the stored link is not a valid URL");
        }

        let upstream: globalThis.Response;
        try {
          upstream = await fetch(target.toString(), {
            redirect: "follow",
            signal: AbortSignal.timeout(15000),
            headers: {
              "user-agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
              accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "accept-language": "en-US,en;q=0.9",
            },
          });
        } catch {
          return failPage("the game host could not be reached");
        }

        const contentType = upstream.headers.get("content-type") ?? "";

        const outHeaders = new Headers();
        upstream.headers.forEach((value, key) => {
          const k = key.toLowerCase();
          if (STRIP_RESPONSE_HEADERS.has(k) || HOP_BY_HOP.has(k)) return;
          outHeaders.set(k, value);
        });
        outHeaders.set("cache-control", "no-store");
        outHeaders.set("x-content-type-options", "nosniff");

        if (!upstream.ok) {
          return failPage(`the game host answered ${upstream.status}`);
        }

        if (!/text\/html|application\/xhtml/i.test(contentType)) {
          // Non-HTML payload (rare): pass bytes through with safe headers.
          const buf = await upstream.arrayBuffer();
          if (buf.byteLength > MAX_BYTES) return failPage("the game payload is too large");
          outHeaders.set("content-type", contentType || "application/octet-stream");
          return new Response(buf, { status: 200, headers: outHeaders });
        }

        let html = await upstream.text();
        if (html.length > MAX_BYTES) return failPage("the game page is too large");

        // Base points at the final post-redirect URL so relative assets resolve
        // against the original host.
        html = injectIntoHtml(html, upstream.url || target.toString());

        outHeaders.set("content-type", "text/html; charset=utf-8");
        // Defense in depth: keep the relayed document in an opaque-origin sandbox
        // even if the frame attribute were ever loosened.
        outHeaders.set(
          "content-security-policy",
          "sandbox allow-scripts allow-forms allow-modals allow-popups allow-downloads allow-pointer-lock",
        );
        return new Response(html, { status: 200, headers: outHeaders });
      },
    },
  },
});
