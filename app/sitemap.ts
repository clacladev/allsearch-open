import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { config } from '@/config';
import type { MetadataRoute } from 'next';

const BASE_URL = 'https://' + config.domainName;

const EXCLUDED_SLUGS = new Set(['privacy-policy', 'tos']);

function getGitLastModified(filePath: string): Date {
  try {
    const timestamp = execFileSync('git', ['log', '-1', '--format=%aI', '--', filePath], {
      encoding: 'utf-8',
    }).trim();
    if (timestamp) return new Date(timestamp);
  } catch {
    // Fall back to file mtime if git is unavailable
  }
  return fs.statSync(filePath).mtime;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const publicDir = path.join(process.cwd(), 'app', '(public)');
  const entries = fs.readdirSync(publicDir, { withFileTypes: true });

  const homePagePath = path.join(process.cwd(), 'app', 'page.tsx');
  const homepage: MetadataRoute.Sitemap = fs.existsSync(homePagePath)
    ? [
        {
          url: BASE_URL,
          lastModified: getGitLastModified(homePagePath),
          changeFrequency: 'monthly' as const,
          priority: 1.0,
        },
      ]
    : [];

  const subpages = entries
    .filter((entry) => {
      if (!entry.isDirectory()) return false;
      if (EXCLUDED_SLUGS.has(entry.name)) return false;
      return fs.existsSync(path.join(publicDir, entry.name, 'page.tsx'));
    })
    .map((entry) => {
      const pagePath = path.join(publicDir, entry.name, 'page.tsx');

      return {
        url: `${BASE_URL}/${entry.name}`,
        lastModified: getGitLastModified(pagePath),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      };
    });

  return [...homepage, ...subpages];
}
