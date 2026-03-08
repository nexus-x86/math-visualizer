/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    // /api/query is handled by app/api/query/route.ts (with proper 290s timeout)
    // All other /api/* paths (except /api/tts which is also a local route) still proxy to backend
    return process.env.NODE_ENV === "development"
      ? [
        {
          source: "/api/:path*",
          destination: "http://127.0.0.1:8000/api/:path*",
          // These local routes take precedence over the rewrite:
          // - /api/query  → app/api/query/route.ts
          // - /api/tts    → app/api/tts/route.ts
        },
      ]
      : [];
  },
};

module.exports = nextConfig;
