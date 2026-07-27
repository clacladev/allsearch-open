import { NextConfig } from 'next';
import { withWorkflow } from 'workflow/next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  // pdfkit reads its base-14 AFM font files via `fs.readFileSync(__dirname +
  // '/data/*.afm')`. When Next.js bundles the route those files don't get
  // copied, so the runtime require path becomes invalid (`/ROOT/.../data/...`).
  // Keeping pdfmake/pdfkit and html-to-docx external preserves __dirname so
  // they resolve their data/templates from node_modules at runtime.
  serverExternalPackages: ['pdfmake', 'pdfkit', 'html-to-docx'],
  images: {
    formats: ['image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.lemonsqueezy.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://eu.i.posthog.com/decide',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default withWorkflow(nextConfig);
