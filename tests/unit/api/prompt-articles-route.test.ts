import { mock } from 'bun:test';

// Note: next/server is mocked globally in tests/setup.ts

const mockUser = { id: 'user-123', email: 'test@example.com' };
const mockProjectRow = {
  id: 'project-123',
  organization_id: 'org-123',
  url: 'https://example.com',
  hostname: 'example.com',
  name: 'Test Project',
  author_id: 'user-123',
  target_location: null,
};
const mockPromptRow = {
  id: 'prompt-123',
  name: 'best AI SEO tools',
  project_id: 'project-123',
  organization_id: 'org-123',
  author_id: 'user-123',
  topic_id: 'topic-123',
  is_archived: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};
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
      { tag: 'h1' as const, text: 'Title', keyPoint: 'Intro the topic.' },
      { tag: 'h2' as const, text: 'Section One', keyPoint: 'Cover basics.' },
    ],
  },
  user_edited_outline: null,
  article_markdown: null,
  article_model_id: null,
  outline_model_id: 'google/gemini-3-flash',
  created_at: '2026-04-24T00:00:00Z',
  updated_at: '2026-04-24T00:00:00Z',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetUserOrThrow = mock(async () => mockUser as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetUserId = mock(async () => mockUser.id);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetProjectRowWithId = mock(async (): Promise<any> => mockProjectRow);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetPromptRowWithId = mock(async (): Promise<any> => mockPromptRow);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockInsertPromptArticleRow = mock(async (): Promise<any> => mockOutlineRow);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetPromptResponseRows = mock(async (): Promise<any[]> => [
  { id: 'pr-1', project_id: 'project-123' },
]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetSourceRows = mock(async (): Promise<any[]> => []);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetPromptResponsesWorkRows = mock((): any[] => []);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetOpportunitiesSummary = mock(async (): Promise<any> => ({
  data: [
    {
      id: 'opp-123',
      type: 'ProjectSourceNotFoundOpportunity',
      promptId: 'prompt-123',
      inspirationSources: [
        {
          isCited: true,
          url: 'https://competitor.com/a',
          cleanUrl: 'competitor.com/a',
          hostname: 'competitor.com',
          title: 'Competitor',
          headings: [{ tag: 'h1', text: 'Competitor Title' }],
          citationCount: 3,
        },
      ],
      promptResponseIds: ['pr-1'],
      priorityScore: 100,
    },
  ],
}));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGenerateOutline = mock(async (): Promise<any> => ({
  headings: [
    { tag: 'h1' as const, text: 'Title', keyPoint: 'Intro the topic.' },
    { tag: 'h2' as const, text: 'Section One', keyPoint: 'Cover basics.' },
  ],
}));
const mockCapture = mock(() => {});
const mockFlush = mock(async () => {});
const mockCaptureException = mock(() => {});

mock.module('@/libs/database/supabase/server', () => ({
  getUserOrThrow: mockGetUserOrThrow,
  getUserId: mockGetUserId,
}));

mock.module('@/libs/posthog', () => ({
  getPostHogServer: () => ({
    capture: mockCapture,
    flush: mockFlush,
    captureException: mockCaptureException,
  }),
  searchParamsToObject: () => ({}),
}));

mock.module('@/libs/database/Projects/queries', () => ({
  getProjectRowWithId: mockGetProjectRowWithId,
}));

mock.module('@/libs/database/Prompts/queries', () => ({
  getPromptRowWithId: mockGetPromptRowWithId,
}));

mock.module('@/libs/database/PromptResponses/queries', () => ({
  getPromptResponseRowsWithProjectIdInDateRange: mockGetPromptResponseRows,
}));

mock.module('@/libs/database/Sources/queries', () => ({
  getSourceRowsWithProjectIdInDateRange: mockGetSourceRows,
}));

mock.module('@/libs/database/PromptArticles/queries', () => ({
  insertPromptArticleRow: mockInsertPromptArticleRow,
}));

mock.module('@/libs/utils/project-analysis/helpers', () => ({
  getPromptResponsesWorkRows: mockGetPromptResponsesWorkRows,
}));

mock.module('@/libs/utils/project-analysis/getOpportunitiesSummary', () => ({
  getOpportunitiesSummary: mockGetOpportunitiesSummary,
}));

mock.module('@/libs/ai/promptArticles/generateOutline', () => ({
  generateOutline: mockGenerateOutline,
  OUTLINE_MODEL_ID: 'google/gemini-3-flash',
}));

import { describe, expect, it, beforeEach } from 'bun:test';
import { POST } from '@/app/api/project/[projectId]/prompts/[promptId]/prompt-articles/route';

function makeRequest(body: unknown, projectId = 'project-123', promptId = 'prompt-123') {
  const url = `http://localhost/api/project/${projectId}/prompts/${promptId}/prompt-articles`;
  const req = new Request(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  Object.defineProperty(req, 'nextUrl', { value: new URL(url) });
  return req;
}

function makeParams(projectId = 'project-123', promptId = 'prompt-123') {
  return { params: Promise.resolve({ projectId, promptId }) };
}

const validBody = {
  opportunityType: 'ProjectSourceNotFoundOpportunity' as const,
  opportunityId: 'opp-123',
  targetSourceCleanUrl: null,
  startDate: '2026-01-01',
  endDate: '2026-04-24',
};

describe('POST /api/project/[projectId]/prompts/[promptId]/prompt-articles', () => {
  beforeEach(() => {
    mockInsertPromptArticleRow.mockReset();
    mockGenerateOutline.mockReset();
    mockGetOpportunitiesSummary.mockReset();
    mockGetProjectRowWithId.mockReset();
    mockGetPromptRowWithId.mockReset();
    mockGetPromptResponseRows.mockReset();
    mockGetSourceRows.mockReset();
    mockCapture.mockReset();
    mockFlush.mockReset();

    mockInsertPromptArticleRow.mockImplementation(async () => mockOutlineRow);
    mockGenerateOutline.mockImplementation(async () => ({
      headings: [
        { tag: 'h1' as const, text: 'Title', keyPoint: 'Intro.' },
        { tag: 'h2' as const, text: 'Section', keyPoint: 'Explain.' },
      ],
    }));
    mockGetOpportunitiesSummary.mockImplementation(async () => ({
      data: [
        {
          id: 'opp-123',
          type: 'ProjectSourceNotFoundOpportunity' as const,
          promptId: 'prompt-123',
          inspirationSources: [
            {
              isCited: true,
              url: 'https://competitor.com/a',
              cleanUrl: 'competitor.com/a',
              hostname: 'competitor.com',
              title: 'Competitor',
              headings: [{ tag: 'h1', text: 'Competitor Title' }],
              citationCount: 3,
            },
          ],
          promptResponseIds: ['pr-1'],
          priorityScore: 100,
        },
      ],
    }));
    mockGetProjectRowWithId.mockImplementation(async () => mockProjectRow);
    mockGetPromptRowWithId.mockImplementation(async () => mockPromptRow);
    mockGetPromptResponseRows.mockImplementation(async () => [
      { id: 'pr-1', project_id: 'project-123' },
    ]);
    mockGetSourceRows.mockImplementation(async () => []);
    mockFlush.mockImplementation(async () => {});
  });

  it('generates a new outline on the happy path', async () => {
    const res = await POST(makeRequest(validBody) as never, makeParams());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.promptArticle).toBeDefined();
    expect(mockGenerateOutline).toHaveBeenCalledTimes(1);
    expect(mockInsertPromptArticleRow).toHaveBeenCalledTimes(1);
    expect(mockCapture).toHaveBeenCalledTimes(1);
  });

  it('inserts a fresh row on every POST without checking for an existing one', async () => {
    // Two consecutive POSTs should both produce a new row — there is no
    // idempotency check anymore. The "Generate outline" CTA always lands
    // here without a promptArticleId, so each click must insert a new row.
    await POST(makeRequest(validBody) as never, makeParams());
    await POST(makeRequest(validBody) as never, makeParams());
    expect(mockGenerateOutline).toHaveBeenCalledTimes(2);
    expect(mockInsertPromptArticleRow).toHaveBeenCalledTimes(2);
  });

  it('returns 403 when project is not found or unauthorized', async () => {
    mockGetProjectRowWithId.mockImplementation(async () => undefined);
    const res = await POST(makeRequest(validBody) as never, makeParams());
    expect(res.status).toBe(403);
  });

  it('returns 410 when the prompt does not belong to the project', async () => {
    mockGetPromptRowWithId.mockImplementation(async () => ({
      ...mockPromptRow,
      project_id: 'other-project',
    }));
    const res = await POST(makeRequest(validBody) as never, makeParams());
    expect(res.status).toBe(410);
  });

  it('returns 422 when there are no prompt responses in the date range', async () => {
    mockGetPromptResponseRows.mockImplementation(async () => []);
    const res = await POST(makeRequest(validBody) as never, makeParams());
    expect(res.status).toBe(422);
  });

  it('returns 422 when no opportunity sources have headings', async () => {
    mockGetOpportunitiesSummary.mockImplementation(async () => ({
      data: [
        {
          id: 'opp-123',
          type: 'ProjectSourceNotFoundOpportunity' as const,
          promptId: 'prompt-123',
          inspirationSources: [
            {
              isCited: true,
              url: 'https://competitor.com/a',
              cleanUrl: 'competitor.com/a',
              hostname: 'competitor.com',
              title: 'Competitor',
              headings: undefined,
              citationCount: 3,
            },
          ],
          promptResponseIds: ['pr-1'],
          priorityScore: 100,
        },
      ],
    }));
    const res = await POST(makeRequest(validBody) as never, makeParams());
    expect(res.status).toBe(422);
  });

  it('returns 410 when the matching opportunity is not in the summary (improve-content type)', async () => {
    // ProjectSourceNotCitedOpportunity has no synthetic fallback — only the
    // create-content (ProjectSourceNotFoundOpportunity, null target) flow does.
    mockGetOpportunitiesSummary.mockImplementation(async () => ({ data: [] }));
    const res = await POST(
      makeRequest({
        ...validBody,
        opportunityType: 'ProjectSourceNotCitedOpportunity',
        targetSourceCleanUrl: 'mybrand.com/a',
      }) as never,
      makeParams()
    );
    expect(res.status).toBe(410);
  });

  it('falls back to synthetic create-content sources when no opportunity is in the summary', async () => {
    // The opportunity listing intentionally skips prompts where the project is
    // already cited; the API still lets the user generate a Create-content
    // article for any prompt, sourcing inspiration from that prompt's
    // responses directly. With no eligible sources the fallback exits with
    // NOT_ENOUGH_SOURCES (422), confirming the path was taken instead of the
    // legacy 410 OPPORTUNITY_NOT_FOUND.
    mockGetOpportunitiesSummary.mockImplementation(async () => ({ data: [] }));
    const res = await POST(makeRequest(validBody) as never, makeParams());
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.code).toBe('NOT_ENOUGH_SOURCES');
  });

  it('returns 400 for an invalid body shape', async () => {
    const res = await POST(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeRequest({ foo: 'bar' } as any) as never,
      makeParams()
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe('INVALID_BODY');
  });

  it('maps a generation error (502) from PromptArticleError', async () => {
    const { PromptArticleError } = await import('@/libs/ai/promptArticles/errors');
    mockGenerateOutline.mockImplementation(async () => {
      throw new PromptArticleError(
        'GENERATION_FAILED',
        'The outline generator could not produce a valid structured response.'
      );
    });
    const res = await POST(makeRequest(validBody) as never, makeParams());
    expect(res.status).toBe(502);
  });
});
