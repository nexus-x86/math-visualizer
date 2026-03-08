/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    return {
      // beforeFiles runs BEFORE Next.js filesystem routes — so /api/tts always
      // goes to FastAPI regardless of whether a local route.ts file exists.
      beforeFiles: [
        {
          source: '/api/tts',
          destination: `${backendUrl}/api/tts`,
        },
      ],
      // afterFiles runs after filesystem routes — local /api/query/route.ts still
      // takes precedence in both envs. Wildcard catches anything else in dev.
      afterFiles: [
        ...(process.env.NODE_ENV === 'development'
          ? [{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }]
          : []),
      ],
      fallback: [],
    };
  },
};

module.exports = nextConfig;
