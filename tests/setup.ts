/**
 * Bun test preload file.
 * Sets up global mocks that are needed across multiple test files.
 * Loaded before any test file via bunfig.toml.
 */
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mock } from 'bun:test';

// libs/database/client.ts's getDatabase() is now keyed on ALLSEARCH_DB_PATH (see that file's
// comment) so tests/unit/collection/ can open its own database without colliding with
// tests/unit/database/settings.test.ts. That keying is only safe with this default in place: a
// suite that deletes ALLSEARCH_DB_PATH in afterAll must never let a later, unrelated
// getDatabase() call fall through to the user's real database at the platform app-data path.
process.env.ALLSEARCH_DB_PATH ??= join(
  mkdtempSync(join(tmpdir(), 'allsearch-test-default-')),
  'test.db'
);

// server-only throws when imported outside a Next.js server context.
// In tests we don't need the guard, so mock it as an empty module.
mock.module('server-only', () => ({}));

// next/server is not resolvable in the bun test environment.
// Provide lightweight stubs for NextRequest and NextResponse.
mock.module('next/server', () => {
  class NextRequest extends Request {
    nextUrl: URL;
    constructor(input: string | URL, init?: RequestInit) {
      super(input, init);
      this.nextUrl = new URL(typeof input === 'string' ? input : input.toString());
    }
  }
  class NextResponse extends Response {
    static json(data: unknown, init?: ResponseInit) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      });
    }
  }
  return { NextRequest, NextResponse };
});
