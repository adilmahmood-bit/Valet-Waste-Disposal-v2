// Plain JavaScript on purpose: Hostinger's build servers can't run Next's native
// compiler (older glibc), and the WASM fallback can't load a TypeScript config.

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

export default nextConfig;
