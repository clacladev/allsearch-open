import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // `bunx allsearch` ships the built server itself, not a repo checkout (ADR 0010), so the build
  // has to emit a self-contained `.next/standalone/` tree with its own pruned `node_modules`.
  // `bun run build:cli` copies `.next/static`, `public/` and `drizzle/` in beside it — see
  // `scripts/buildCli.ts`.
  output: 'standalone',
  // Note: `.next/standalone/` comes out carrying a copy of the whole repository — sources, tests,
  // docs — because `readMigrationFiles()` (drizzle-orm) calls `readdirSync()` on a path the file
  // tracer cannot evaluate statically, and the tracer's fallback for an unknown read is to claim
  // the project root. `outputFileTracingExcludes` does not fix it: Next applies those excludes
  // per *route* entry, and the trace doing the claiming is `instrumentation.js`, which is not a
  // route. `scripts/buildCli.ts` prunes the standalone tree to the files the server actually
  // runs instead.
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  // pdfkit reads its base-14 AFM font files via `fs.readFileSync(__dirname +
  // '/data/*.afm')`. When Next.js bundles the route those files don't get
  // copied, so the runtime require path becomes invalid (`/ROOT/.../data/...`).
  // Keeping pdfmake/pdfkit and html-to-docx external preserves __dirname so
  // they resolve their data/templates from node_modules at runtime.
  serverExternalPackages: ['pdfmake', 'pdfkit', 'html-to-docx'],
  images: {
    formats: ['image/webp'],
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
};

export default nextConfig;
