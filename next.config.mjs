// Plain JavaScript on purpose: Hostinger's build servers can't run Next's native
// compiler (older glibc), and the WASM fallback can't load a TypeScript config.

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The app demo moved from /demo to /app; keep old shared links working.
  // The nightly report is a plain HTML file with a fixed name, so browsers would
  // otherwise keep showing an old copy after an update. Make them re-check it.
  async headers() {
    return [{ source: "/app/nightly-report.html", headers: [{ key: "Cache-Control", value: "no-cache" }] }];
  },
  async redirects() {
    return [
      { source: "/demo", destination: "/app", permanent: true },
      { source: "/demo/:path*", destination: "/app/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
