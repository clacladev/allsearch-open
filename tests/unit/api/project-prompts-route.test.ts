import { mock } from 'bun:test';

import { mockModuleForSuite } from '../moduleMocks';

// Note: next/server is mocked globally in tests/setup.ts

const mockProjectRow = {
  id: 'project-123',
  url: 'https://example.com',
  name: 'Test Project',
  target_location: null,
};
const mockTopicRow = { id: 'topic-123', name: 'Custom', project_id: 'project-123' };
const mockPromptRow = {
  id: 'prompt-123',
  name: 'Test prompt',
  topic_id: 'topic-123',
  project_id: 'project-123',
  is_archived: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetPromptRowsWithProjectId = mock(async (): Promise<any[]> => []);
const mockGetPromptRowWithId = mock(async () => mockPromptRow);
const mockInsertPromptRow = mock(async () => mockPromptRow);
const mockUpdatePromptRowWithId = mock(async () => mockPromptRow);
const mockGetTopicRowWithId = mock(async () => mockTopicRow);
const mockFindOrCreateCustomTopic = mock(async () => mockTopicRow);
const mockGetProjectRowWithId = mock(async () => mockProjectRow);

// Raw `mock.module`, not `mockModuleForSuite`: `@/libs/posthog` and `@/libs/subscriptions` below
// are hosted-AllSearch modules that do not exist in this port, so there is nothing to snapshot —
// and nothing real for the stub to leak in front of either.
mock.module('@/libs/posthog', () => ({
  getPostHogServer: () => ({ captureException: () => {} }),
  searchParamsToObject: () => ({}),
}));

// `mockModuleForSuite` rather than a raw `mock.module`: Bun's module registry is process-wide and
// `mock.restore()` does not undo `mock.module`, so these query-layer stubs would otherwise stay
// installed for every file that runs after this one — see tests/unit/moduleMocks.ts. Each stub
// also spreads the real namespace it is handed, because `mock.module` swaps the whole export
// namespace: a partial stub would make this module's other exports cease to exist for any suite
// linked against the real module while the stub is installed.
await mockModuleForSuite('@/libs/database/Prompts/queries', (actual) => ({
  ...actual,
  getPromptRowsWithProjectId: mockGetPromptRowsWithProjectId,
  getPromptRowWithId: mockGetPromptRowWithId,
  insertPromptRow: mockInsertPromptRow,
  updatePromptRowWithId: mockUpdatePromptRowWithId,
}));

await mockModuleForSuite('@/libs/database/Topics/queries', (actual) => ({
  ...actual,
  getTopicRowWithId: mockGetTopicRowWithId,
}));

await mockModuleForSuite('@/app/api/project/[projectId]/prompts/helpers', (actual) => ({
  ...actual,
  findOrCreateCustomTopic: mockFindOrCreateCustomTopic,
}));

await mockModuleForSuite('@/libs/database/Projects/queries', (actual) => ({
  ...actual,
  getProjectRowWithId: mockGetProjectRowWithId,
}));

mock.module('@/libs/subscriptions', () => ({
  MAX_PROMPTS_DURING_TRIAL: 25,
}));

import { describe, expect, it, beforeEach } from 'bun:test';
import { POST, PATCH } from '@/app/api/project/[projectId]/prompts/route';

// Extend Request with nextUrl so the route's error handler can access searchParams
function makeRequest(body: unknown, projectId = 'project-123', method = 'POST') {
  const url = `http://localhost/api/project/${projectId}/prompts`;
  const req = new Request(url, {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  Object.defineProperty(req, 'nextUrl', { value: new URL(url) });
  return req;
}

function makeParams(projectId = 'project-123') {
  return { params: Promise.resolve({ projectId }) };
}

describe('POST /api/project/[projectId]/prompts', () => {
  beforeEach(() => {
    mockGetPromptRowsWithProjectId.mockReset();
    mockInsertPromptRow.mockReset();
    mockGetTopicRowWithId.mockReset();
    mockFindOrCreateCustomTopic.mockReset();
    mockGetProjectRowWithId.mockReset();
    mockUpdatePromptRowWithId.mockReset();

    mockGetPromptRowsWithProjectId.mockImplementation(async () => []);
    mockInsertPromptRow.mockImplementation(async () => mockPromptRow);
    mockGetTopicRowWithId.mockImplementation(async () => mockTopicRow);
    mockFindOrCreateCustomTopic.mockImplementation(async () => mockTopicRow);
    mockGetProjectRowWithId.mockImplementation(async () => mockProjectRow);
    mockUpdatePromptRowWithId.mockImplementation(async () => mockPromptRow);
  });

  it('returns 500 when names is missing', async () => {
    const req = makeRequest({ topicId: 'topic-123' });
    const res = await POST(req as never, makeParams());
    expect(res.status).toBe(500); // zod parse throws → caught as 500
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('returns 500 when names is not an array', async () => {
    const req = makeRequest({ names: 'not-an-array' });
    const res = await POST(req as never, makeParams());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('returns 400 for missing projectId', async () => {
    const req = makeRequest({ names: ['test'] }, '');
    const res = await POST(req as never, { params: Promise.resolve({ projectId: '' }) });
    expect(res.status).toBe(400);
    expect(await res.text()).toBe('Missing projectId');
  });

  it('inserts a single prompt and returns an array', async () => {
    const req = makeRequest({ names: ['Test prompt'] });
    const res = await POST(req as never, makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe('Test prompt');
    expect(mockFindOrCreateCustomTopic).toHaveBeenCalledTimes(1);
    expect(mockInsertPromptRow).toHaveBeenCalledTimes(1);
  });

  it('accepts valid names array with optional topicId', async () => {
    const req = makeRequest({ names: ['Prompt A', 'Prompt B'], topicId: 'topic-123' });
    const res = await POST(req as never, makeParams());
    expect(res.status).toBe(200);
    expect(mockGetTopicRowWithId).toHaveBeenCalledWith('topic-123');
    expect(mockFindOrCreateCustomTopic).not.toHaveBeenCalled();
    expect(mockInsertPromptRow).toHaveBeenCalledTimes(2);
  });

  it('returns array of inserted prompt rows on success', async () => {
    const promptA = { ...mockPromptRow, id: 'p-a', name: 'Prompt A' };
    const promptB = { ...mockPromptRow, id: 'p-b', name: 'Prompt B' };
    mockInsertPromptRow
      .mockImplementationOnce(async () => promptA)
      .mockImplementationOnce(async () => promptB);

    const req = makeRequest({ names: ['Prompt A', 'Prompt B'] });
    const res = await POST(req as never, makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].id).toBe('p-a');
    expect(body[1].id).toBe('p-b');
  });

  it('returns 500 when topicId does not belong to the project', async () => {
    mockGetTopicRowWithId.mockImplementation(async () => ({
      ...mockTopicRow,
      project_id: 'other-project',
    }));
    const req = makeRequest({ names: ['Test prompt'], topicId: 'topic-123' });
    const res = await POST(req as never, makeParams());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('topic');
  });

  it('skips duplicate active prompts without error', async () => {
    const existing = { ...mockPromptRow, name: 'Existing Prompt', is_archived: false };
    mockGetPromptRowsWithProjectId.mockImplementation(async () => [existing]);

    const req = makeRequest({ names: ['Existing Prompt'] });
    const res = await POST(req as never, makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(0); // skipped silently
    expect(mockInsertPromptRow).not.toHaveBeenCalled();
  });

  it('restores archived prompts instead of inserting', async () => {
    const archived = { ...mockPromptRow, name: 'Archived Prompt', is_archived: true };
    mockGetPromptRowsWithProjectId.mockImplementation(async () => [archived]);
    mockUpdatePromptRowWithId.mockImplementation(async () => ({
      ...archived,
      is_archived: false,
    }));

    const req = makeRequest({ names: ['Archived Prompt'] });
    const res = await POST(req as never, makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].is_archived).toBe(false);
    expect(mockInsertPromptRow).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/project/[projectId]/prompts', () => {
  beforeEach(() => {
    mockGetPromptRowWithId.mockReset();
    mockGetTopicRowWithId.mockReset();
    mockUpdatePromptRowWithId.mockReset();

    mockGetPromptRowWithId.mockImplementation(async () => mockPromptRow);
    mockGetTopicRowWithId.mockImplementation(async () => mockTopicRow);
    mockUpdatePromptRowWithId.mockImplementation(async () => mockPromptRow);
  });

  it('returns 400 for missing projectId', async () => {
    const req = makeRequest({ name: 'Updated', promptId: 'prompt-123' }, '', 'PATCH');
    const res = await PATCH(req as never, { params: Promise.resolve({ projectId: '' }) });
    expect(res.status).toBe(400);
    expect(await res.text()).toBe('Missing projectId');
  });

  it('returns 500 when body is invalid', async () => {
    const req = makeRequest({ name: 'Updated' }, 'project-123', 'PATCH'); // missing promptId
    const res = await PATCH(req as never, makeParams());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('updates prompt name without topicId', async () => {
    const updated = { ...mockPromptRow, name: 'Updated name' };
    mockUpdatePromptRowWithId.mockImplementation(async () => updated);

    const req = makeRequest({ name: 'Updated name', promptId: 'prompt-123' }, 'project-123', 'PATCH');
    const res = await PATCH(req as never, makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Updated name');
    expect(mockUpdatePromptRowWithId).toHaveBeenCalledWith('prompt-123', { name: 'Updated name' });
    expect(mockGetTopicRowWithId).not.toHaveBeenCalled();
  });

  it('updates prompt name and topic when valid topicId is provided', async () => {
    const updated = { ...mockPromptRow, name: 'Updated name', topic_id: 'topic-123' };
    mockUpdatePromptRowWithId.mockImplementation(async () => updated);

    const req = makeRequest(
      { name: 'Updated name', promptId: 'prompt-123', topicId: 'topic-123' },
      'project-123',
      'PATCH'
    );
    const res = await PATCH(req as never, makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.topic_id).toBe('topic-123');
    expect(mockGetTopicRowWithId).toHaveBeenCalledWith('topic-123');
    expect(mockUpdatePromptRowWithId).toHaveBeenCalledWith('prompt-123', {
      name: 'Updated name',
      topic_id: 'topic-123',
    });
  });

  it('returns 500 when topicId does not belong to the project', async () => {
    mockGetTopicRowWithId.mockImplementation(async () => ({
      ...mockTopicRow,
      project_id: 'other-project',
    }));

    const req = makeRequest(
      { name: 'Updated', promptId: 'prompt-123', topicId: 'topic-123' },
      'project-123',
      'PATCH'
    );
    const res = await PATCH(req as never, makeParams());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('topic');
  });

  it('returns 500 when prompt does not belong to the project', async () => {
    mockGetPromptRowWithId.mockImplementation(async () => ({
      ...mockPromptRow,
      project_id: 'other-project',
    }));

    const req = makeRequest({ name: 'Updated', promptId: 'prompt-123' }, 'project-123', 'PATCH');
    const res = await PATCH(req as never, makeParams());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('prompt');
  });
});
