import { mock } from 'bun:test';

const mockOutlineRow = {
  id: 'outline-123',
  project_id: 'project-123',
  prompt_id: 'prompt-123',
  opportunity_id: 'opp-123',
  opportunity_type: 'ProjectSourceNotFoundOpportunity',
  target_source_clean_url: null,
  outline: {
    version: 1 as const,
    headings: [
      { tag: 'h1' as const, text: 'Original Title', keyPoint: 'Introduce the topic.' },
      { tag: 'h2' as const, text: 'Section', keyPoint: 'Cover the basics.' },
      { tag: 'h2' as const, text: 'Wrap up', keyPoint: 'Summarize the takeaways.' },
    ],
  },
  user_edited_outline: null,
  article_markdown: null,
  article_model_id: null,
  outline_model_id: 'google/gemini-3-flash',
  created_at: '2026-04-25T00:00:00Z',
  updated_at: '2026-04-25T00:00:00Z',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetPromptArticleRowWithId = mock(async (): Promise<any> => mockOutlineRow);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUpdateArticleOutlineUserEdits = mock(
  async (id: string, userEditedOutline: unknown): Promise<any> => ({
    ...mockOutlineRow,
    id,
    user_edited_outline: userEditedOutline,
  })
);
const mockCaptureException = mock(() => {});

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
  updatePromptArticleOutlineEdits: mockUpdateArticleOutlineUserEdits,
}));

import { describe, expect, it, beforeEach } from 'bun:test';
import { PATCH } from '@/app/api/project/[projectId]/prompts/[promptId]/prompt-articles/[promptArticleId]/route';

const validEditedOutline = {
  version: 1 as const,
  headings: [
    { tag: 'h1' as const, text: 'My Title', keyPoint: 'Introduce the topic clearly.' },
    { tag: 'h2' as const, text: 'Section', keyPoint: 'Cover the basics in detail.' },
    { tag: 'h2' as const, text: 'Wrap up', keyPoint: 'Summarize the takeaways here.' },
  ],
};

function makeRequest(
  body: unknown,
  projectId = 'project-123',
  promptId = 'prompt-123',
  outlineId = 'outline-123'
) {
  const url = `http://localhost/api/project/${projectId}/prompts/${promptId}/prompt-articles/${outlineId}`;
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

describe('PATCH /api/project/[projectId]/prompts/[promptId]/prompt-articles/[promptArticleId]', () => {
  beforeEach(() => {
    mockGetPromptArticleRowWithId.mockReset();
    mockUpdateArticleOutlineUserEdits.mockReset();
    mockGetPromptArticleRowWithId.mockImplementation(async () => mockOutlineRow);
    mockUpdateArticleOutlineUserEdits.mockImplementation(async (id, userEditedOutline) => ({
      ...mockOutlineRow,
      id,
      user_edited_outline: userEditedOutline,
    }));
  });

  it('persists a valid user-edited outline', async () => {
    const res = await PATCH(
      makeRequest({ userEditedOutline: validEditedOutline }) as never,
      makeParams()
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.promptArticle.user_edited_outline).toEqual(validEditedOutline);
    expect(mockUpdateArticleOutlineUserEdits).toHaveBeenCalledTimes(1);
  });

  it('persists a null user-edited outline (restore-from-AI)', async () => {
    const res = await PATCH(makeRequest({ userEditedOutline: null }) as never, makeParams());
    expect(res.status).toBe(200);
    expect(mockUpdateArticleOutlineUserEdits).toHaveBeenCalledTimes(1);
    const callArgs = mockUpdateArticleOutlineUserEdits.mock.calls[0];
    expect(callArgs[1]).toBeNull();
  });

  it('returns 400 with VALIDATION_FAILED when the outline fails Zod validation', async () => {
    const invalid = {
      userEditedOutline: {
        version: 1 as const,
        headings: [
          // Below the 3-heading minimum.
          { tag: 'h1' as const, text: 'Solo', keyPoint: 'Only a single heading here.' },
        ],
      },
    };
    const res = await PATCH(makeRequest(invalid) as never, makeParams());
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe('VALIDATION_FAILED');
  });

  it('returns 400 when the body is missing the required field', async () => {
    const res = await PATCH(makeRequest({}) as never, makeParams());
    expect(res.status).toBe(400);
  });

  it('returns 400 when there are two h1 headings', async () => {
    const invalid = {
      userEditedOutline: {
        version: 1 as const,
        headings: [
          { tag: 'h1' as const, text: 'Title One', keyPoint: 'First introduction text.' },
          { tag: 'h1' as const, text: 'Title Two', keyPoint: 'Second introduction text.' },
          { tag: 'h2' as const, text: 'Section', keyPoint: 'Cover the basics here.' },
        ],
      },
    };
    const res = await PATCH(makeRequest(invalid) as never, makeParams());
    expect(res.status).toBe(400);
  });

  it('returns 404 when the outline does not exist', async () => {
    mockGetPromptArticleRowWithId.mockImplementation(async () => undefined);
    const res = await PATCH(
      makeRequest({ userEditedOutline: validEditedOutline }) as never,
      makeParams()
    );
    expect(res.status).toBe(404);
  });

  it('returns 403 when the outline is for a different project', async () => {
    mockGetPromptArticleRowWithId.mockImplementation(async () => ({
      ...mockOutlineRow,
      project_id: 'other-project',
    }));
    const res = await PATCH(
      makeRequest({ userEditedOutline: validEditedOutline }) as never,
      makeParams()
    );
    expect(res.status).toBe(403);
  });

  it('returns 403 when the outline belongs to a different prompt', async () => {
    mockGetPromptArticleRowWithId.mockImplementation(async () => ({
      ...mockOutlineRow,
      prompt_id: 'other-prompt',
    }));
    const res = await PATCH(
      makeRequest({ userEditedOutline: validEditedOutline }) as never,
      makeParams()
    );
    expect(res.status).toBe(403);
  });
});
