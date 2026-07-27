/**
 * Bun test preload file.
 * Sets up global mocks that are needed across multiple test files.
 * Loaded before any test file via bunfig.toml.
 */
import { mock } from 'bun:test';

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
