import { describe, expect, it } from "vitest";
import { rewriteCdnUrls, upstreamFromRelayPath } from "./cdn-proxy";

describe("cdn relay", () => {
  it("rewrites jsdelivr links in game code to the site's own relay", () => {
    const html = '<base href="https://cdn.jsdelivr.net/gh/a/b@main/"><script src="//cdn.jsdelivr.net/x.js"></script>';
    expect(rewriteCdnUrls(html, "https://site.app")).toBe(
      '<base href="https://site.app/api/public/cdn/cdn.jsdelivr.net/gh/a/b@main/"><script src="https://site.app/api/public/cdn/cdn.jsdelivr.net/x.js"></script>',
    );
  });
  it("leaves other hosts untouched", () => {
    expect(rewriteCdnUrls('<a href="https://evil.com/x">', "https://site.app")).toBe('<a href="https://evil.com/x">');
  });
  it("only relays allowlisted hosts", () => {
    expect(upstreamFromRelayPath("cdn.jsdelivr.net/gh/a/b.js", "?v=1")).toBe("https://cdn.jsdelivr.net/gh/a/b.js?v=1");
    expect(upstreamFromRelayPath("evil.com/x", "")).toBeNull();
    expect(upstreamFromRelayPath("localhost/x", "")).toBeNull();
  });
});
