import { mock } from 'bun:test';

const mockUser = { id: 'user-123', email: 'test@example.com' };
const mockOutlineRow = {
  id: 'outline-123',
  project_id: 'project-123',
  organization_id: 'org-123',
  author_id: 'user-123',
  prompt_id: 'prompt-123',
  opportunity_id: 'opp-123',
  opportunity_type: 'ProjectSourceNotFoundOpportunity',
  target_source_clean_url: null,
  outline: {
    version: 1 as const,
    headings: [
      { tag: 'h1' as const, text: 'Title', keyPoint: 'Introduce the topic clearly.' },
      { tag: 'h2' as const, text: 'Section A', keyPoint: 'Cover A in detail.' },
      { tag: 'h2' as const, text: 'Section B', keyPoint: 'Cover B in detail.' },
    ],
  },
  user_edited_outline: null,
  article_markdown: '# Title\n\nBody.',
  user_edited_article_markdown: null,
  sources_used: { sources: [] },
  outline_used: null,
  article_model_id: 'google/gemini-3-flash',
  outline_model_id: 'google/gemini-3-flash',
  created_at: '2026-04-30T00:00:00Z',
  updated_at: '2026-04-30T00:00:00Z',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetUserOrThrow = mock(async () => mockUser as any);
const mockGetUserId = mock(async () => mockUser.id);
// Hold the row to return in a closure so tests can swap it without relying on
// mockImplementation rebinding (Bun's mock.module captures function refs at
// import time; the closure is the reliable way to vary behavior per-test).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let outlineRowToReturn: any = mockOutlineRow;
const mockGetPromptArticleRowWithId = mock(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async (): Promise<any> => outlineRowToReturn
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUpdate = mock(async (id: string, value: string | null): Promise<any> => ({
  ...mockOutlineRow,
  id,
  user_edited_article_markdown: value,
}));
const mockCaptureException = mock(() => {});

mock.module('@/libs/database/supabase/server', () => ({
  getUserOrThrow: mockGetUserOrThrow,
  getUserId: mockGetUserId,
}));

mock.module('@/libs/posthog', () => ({
  getPostHogServer: () => ({
    capture: () => {},
    flush: async () => {},
    captureException: mockCaptureException,
  }),
  searchParamsToObject: () => ({}),
}));

mock.module('@/libs/database/PromptArticles/queries', () => ({
  getPromptArticleRowWithId: mockGetPromptArticleRowWithId,
  setArticleGeneratedFromStream: mock(async () => mockOutlineRow),
  updatePromptArticleUserEditedMarkdown: mockUpdate,
}));

mock.module('@vercel/functions', () => ({
  waitUntil: () => {},
}));

import { describe, expect, it, beforeEach } from 'bun:test';
import { PATCH } from '@/app/api/project/[projectId]/prompts/[promptId]/prompt-articles/[promptArticleId]/article/route';

function makeRequest(
  body: unknown,
  projectId = 'project-123',
  promptId = 'prompt-123',
  outlineId = 'outline-123'
) {
  const url = `http://localhost/api/project/${projectId}/prompts/${promptId}/prompt-articles/${outlineId}/article`;
  const req = new Request(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  Object.defineProperty(req, 'nextUrl', { value: new URL(url) });
  return req;
}

function makeParams(
  projectId = 'project-123',
  promptId = 'prompt-123',
  outlineId = 'outline-123'
) {
  return { params: Promise.resolve({ projectId, promptId, promptArticleId: outlineId }) };
}

describe('PATCH /prompt-articles/[promptArticleId]/article', () => {
  beforeEach(() => {
    outlineRowToReturn = mockOutlineRow;
    mockUpdate.mockReset();
    mockUpdate.mockImplementation(async (id, value) => ({
      ...mockOutlineRow,
      id,
      user_edited_article_markdown: value,
    }));
  });

  it('persists a string user-edited article', async () => {
    const res = await PATCH(
      makeRequest({ userEditedArticleMarkdown: '# My edits\n\nBetter content.' }) as never,
      makeParams()
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.promptArticle.user_edited_article_markdown).toBe('# My edits\n\nBetter content.');
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('persists null (restore-to-AI)', async () => {
    const res = await PATCH(
      makeRequest({ userEditedArticleMarkdown: null }) as never,
      makeParams()
    );
    expect(res.status).toBe(200);
    expect(mockUpdate.mock.calls[0][1]).toBeNull();
  });

  it('returns 400 with VALIDATION_FAILED for body over 50_000 chars', async () => {
    const huge = 'x'.repeat(50_001);
    const res = await PATCH(
      makeRequest({ userEditedArticleMarkdown: huge }) as never,
      makeParams()
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe('VALIDATION_FAILED');
  });

  it('returns 400 when the field is missing entirely', async () => {
    const res = await PATCH(makeRequest({}) as never, makeParams());
    expect(res.status).toBe(400);
  });

  it('returns 404 when the outline does not exist', async () => {
    outlineRowToReturn = undefined;
    const res = await PATCH(
      makeRequest({ userEditedArticleMarkdown: 'edits' }) as never,
      makeParams()
    );
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.code).toBe('PROMPT_ARTICLE_NOT_FOUND');
  });

  it('returns 404 when the outline belongs to a different author (no info leak)', async () => {
    outlineRowToReturn = { ...mockOutlineRow, author_id: 'someone-else' };
    const res = await PATCH(
      makeRequest({ userEditedArticleMarkdown: 'edits' }) as never,
      makeParams()
    );
    expect(res.status).toBe(404);
  });

  it('returns 404 when the outline does not match the URL projectId', async () => {
    outlineRowToReturn = { ...mockOutlineRow, project_id: 'different-project' };
    const res = await PATCH(
      makeRequest({ userEditedArticleMarkdown: 'edits' }) as never,
      makeParams()
    );
    expect(res.status).toBe(404);
  });

  it('returns 400 when projectId param is missing', async () => {
    const res = await PATCH(
      makeRequest({ userEditedArticleMarkdown: 'edits' }) as never,
      { params: Promise.resolve({ projectId: '', promptId: 'p', promptArticleId: 'o' }) }
    );
    expect(res.status).toBe(400);
  });
});
