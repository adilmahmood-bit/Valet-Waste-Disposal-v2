// Plain JavaScript on purpose: Hostinger's build servers can't run Next's native
// compiler (older glibc), and the WASM fallback can't load a TypeScript config.

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The app demo moved from /demo to /app; keep old shared links working.
  // The nightly report is a plain HTML file with a fixed name, so browsers would
  // otherwise keep showing an old copy after an update. Make them re-check it.
  async headers() {
    return [
      { source: "/app/nightly-report.html", headers: [{ key: "Cache-Control", value: "no-cache" }] },
      // AI crawlers read /llms.txt directly; keep it out of search results so it
      // doesn't compete with the real pages.
      { source: "/llms.txt", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
      // HSTS: browsers always use HTTPS for this host (one year). No includeSubDomains, so
      // subdomains (mail etc.) aren't affected.
      { source: "/:path*", headers: [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] },
    ];
  },
  async redirects() {
    return [
      // One canonical host: www.yourdoorstepdisposal.com/... -> yourdoorstepdisposal.com/...
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.yourdoorstepdisposal.com" }],
        destination: "https://yourdoorstepdisposal.com/:path*",
        permanent: true,
      },
      { source: "/demo", destination: "/app", permanent: true },
      { source: "/demo/:path*", destination: "/app/:path*", permanent: true },
      // The hosts page moved to a shorter URL on 2026-11-03.
      { source: "/residential/hosts", destination: "/hosts", permanent: true },
      { source: "/hosts/demo", destination: "/hosts/portal", permanent: true },
    ];
  },
};

export default nextConfig;
