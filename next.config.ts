import path from "node:path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:56321";
const supabase = new URL(supabaseUrl);

const csp = [
  "default-src 'self'",
  // maps.googleapis.com / maps.gstatic.com are only contacted on school pages, and only when GOOGLE_MAPS_KEY is set
  `script-src 'self' 'unsafe-inline' https://maps.googleapis.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com",
  `img-src 'self' data: blob: ${supabase.origin} https://*.mapbox.com https://maps.gstatic.com https://maps.googleapis.com https://*.ggpht.com https://*.google.com`,
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' ${supabase.origin} ${supabase.protocol === "https:" ? `wss://${supabase.host}` : `ws://${supabase.host}`} https://*.mapbox.com https://maps.googleapis.com`,
  "worker-src 'self' blob:",
  "child-src blob:",
  "frame-src https://www.youtube-nocookie.com https://player.vimeo.com https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname),
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: supabase.protocol.replace(":", "") as "http" | "https",
        hostname: supabase.hostname,
        port: supabase.port,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
    serverActions: { bodySizeLimit: "9mb" },
    // Prerendering reads from the database: keep parallelism modest and retry transient timeouts.
    staticGenerationMaxConcurrency: 4,
    staticGenerationRetryCount: 3,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
