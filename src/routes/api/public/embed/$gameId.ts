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

function relayFor(value: string, baseUrl: string, gameId: string, relayOrigin: string): string | null {
  try {
    if (/^(data:|blob:|javascript:|about:|mailto:|tel:|#)/i.test(value.trim())) return null;
    const target = new URL(value, baseUrl);
    if (target.origin !== new URL(baseUrl).origin) return null;
    return `${relayOrigin}/api/public/embed/${encodeURIComponent(gameId)}?url=${encodeURIComponent(target.href)}`;
  } catch {
    return null;
  }
}

// Point same-host asset references in the served markup at the relay so scripts,
// styles, images and audio load same-origin inside the sandboxed frame.
function rewriteHtmlAssets(html: string, baseUrl: string, gameId: string, relayOrigin: string): string {
  return html.replace(
    /\s(src|href|data)=("([^"]*)"|'([^']*)')/gi,
    (match, attr: string, _q: string, dq?: string, sq?: string) => {
      const value = dq ?? sq ?? "";
      if (!value) return match;
      const next = relayFor(value, baseUrl, gameId, relayOrigin);
      if (!next) return match;
      return ` ${attr}="${next.replace(/"/g, "&quot;")}"`;
    },
  );
}

function rewriteCssAssets(css: string, baseUrl: string, gameId: string, relayOrigin: string): string {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (match, _q: string, value: string) => {
    const next = relayFor(value, baseUrl, gameId, relayOrigin);
    return next ? `url("${next}")` : match;
  });
}

function injectIntoHtml(html: string, finalUrl: string, gameId: string, relayOrigin: string): string {
  const base = `<base href="${finalUrl.replace(/"/g, "&quot;")}">`;
  const relayNavigation = `<script>
(function(){
  var gameId = ${JSON.stringify(gameId)};
  var sourceOrigin = ${JSON.stringify(new URL(finalUrl).origin)};
  var relayOrigin = ${JSON.stringify(relayOrigin)};
  function relayUrl(value){
    try {
      var target = new URL(value, document.baseURI);
      if (target.origin !== sourceOrigin) return null;
      return relayOrigin + '/api/public/embed/' + encodeURIComponent(gameId) + '?url=' + encodeURIComponent(target.href);
    } catch (e) { return null; }
  }
  document.addEventListener('click', function(event){
    var node = event.target;
    var anchor = node && node.closest ? node.closest('a[href]') : null;
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var next = relayUrl(anchor.href);
    if (!next) return;
    event.preventDefault();
    location.href = next;
  }, true);
  document.addEventListener('submit', function(event){
    var form = event.target;
    if (!form || String(form.method || 'get').toLowerCase() !== 'get') return;
    var target = new URL(form.action || location.href, document.baseURI);
    if (target.origin !== sourceOrigin) return;
    event.preventDefault();
    var values = new URLSearchParams(new FormData(form));
    values.forEach(function(value, key){ target.searchParams.set(key, value); });
    location.href = relayUrl(target.href);
  }, true);
  // Games load their own scripts, art and audio from the source host. Inside a
  // sandboxed frame those requests are cross-origin and often blocked, which is
  // what "cartridge reported an error" really means. Route every same-host
  // request back through this relay so it is same-origin and always allowed.
  function proxied(value){
    if (typeof value !== 'string') return value;
    if (/^(data:|blob:|javascript:|about:|#)/i.test(value)) return value;
    if (value.indexOf(relayOrigin + '/api/public/embed/') === 0) return value;
    var next = relayUrl(value);
    return next || value;
  }
  window.__arcadeProxy = proxied;

  var origFetch = window.fetch;
  if (origFetch) {
    window.fetch = function(input, init){
      try {
        if (typeof input === 'string') input = proxied(input);
        else if (input && input.url) input = new Request(proxied(input.url), input);
      } catch (e) {}
      return origFetch.call(this, input, init);
    };
  }
  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url){
    var args = Array.prototype.slice.call(arguments);
    try { args[1] = proxied(url); } catch (e) {}
    return origOpen.apply(this, args);
  };

  var ATTRS = { IMG: 'src', SCRIPT: 'src', LINK: 'href', AUDIO: 'src', VIDEO: 'src', SOURCE: 'src', IFRAME: 'src', TRACK: 'src', EMBED: 'src', OBJECT: 'data', USE: 'href' };
  function fixNode(node){
    if (!node || node.nodeType !== 1) return;
    var attr = ATTRS[node.tagName];
    if (attr) {
      var raw = node.getAttribute(attr);
      if (raw) {
        var next = proxied(raw);
        if (next !== raw) node.setAttribute(attr, next);
      }
    }
    if (node.getAttribute && node.getAttribute('srcset')) {
      node.setAttribute('srcset', node.getAttribute('srcset').split(',').map(function(part){
        var bits = part.trim().split(/\\s+/);
        bits[0] = proxied(bits[0]);
        return bits.join(' ');
      }).join(', '));
    }
    if (node.children) for (var i = 0; i < node.children.length; i++) fixNode(node.children[i]);
  }
  try {
    new MutationObserver(function(records){
      records.forEach(function(r){
        for (var i = 0; i < r.addedNodes.length; i++) fixNode(r.addedNodes[i]);
      });
    }).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
  document.addEventListener('DOMContentLoaded', function(){ fixNode(document.documentElement); });
})();
</scr` + `ipt>`;
  const injection = base + ARCADE_BRIDGE + relayNavigation;
  // Drop any in-page CSP meta tags that would re-block framing/scripts.
  let cleaned = html.replace(/<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*>/gi, "");
  // Rewrite markup-level asset references up front: a <script src> found during
  // parsing starts downloading before any observer callback can patch it.
  cleaned = rewriteHtmlAssets(cleaned, finalUrl, gameId, relayOrigin);
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
      GET: async ({ params, request }) => {
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
          const approved = new URL(game.url);
          const requestedUrl = new URL(request.url).searchParams.get("url");
          target = requestedUrl ? new URL(requestedUrl) : approved;
          if (target.protocol !== "https:" && target.protocol !== "http:") throw new Error("bad scheme");
          if (target.origin !== approved.origin) throw new Error("unapproved host");
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
          if (upstream.status === 429 || upstream.status === 403) {
            return failPage(
              `the game host blocked this server (HTTP ${upstream.status}). Sites like Google rate-limit automated requests and cannot be embedded — use a game link that allows it.`,
            );
          }
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
        html = injectIntoHtml(
          html,
          upstream.url || target.toString(),
          gameId,
          new URL(request.url).origin,
        );

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
