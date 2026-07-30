import { mock } from 'bun:test';

// Note: next/server is mocked globally in tests/setup.ts

// Held in a closure so each test can control exactly what the "current" stored
// selection looks like after `setStoredEnabledChatbotIds` runs, independently of
// what was actually passed in — this is what lets a single mock double for all
// three storage states (`null`, `[]`, a partial array) the route must relay
// faithfully.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let storedIdsToReturn: any = null;

const mockSetStoredEnabledChatbotIds = mock(async () => undefined);
const mockGetStoredEnabledChatbotIds = mock(async () => storedIdsToReturn);

mock.module('@/libs/database/Settings/queries', () => ({
  setStoredEnabledChatbotIds: mockSetStoredEnabledChatbotIds,
  getStoredEnabledChatbotIds: mockGetStoredEnabledChatbotIds,
}));

import { describe, expect, it, beforeEach } from 'bun:test';
import { PATCH } from '@/app/api/settings/chatbots/route';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';

function makeRequest(body: unknown) {
  const url = 'http://localhost/api/settings/chatbots';
  const req = new Request(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  Object.defineProperty(req, 'nextUrl', { value: new URL(url) });
  return req;
}

describe('PATCH /api/settings/chatbots', () => {
  beforeEach(() => {
    mockSetStoredEnabledChatbotIds.mockReset();
    mockGetStoredEnabledChatbotIds.mockReset();
    mockSetStoredEnabledChatbotIds.mockImplementation(async () => undefined);
    mockGetStoredEnabledChatbotIds.mockImplementation(async () => storedIdsToReturn);
    storedIdsToReturn = null;
  });

  it('persists a deliberate all-off selection ([]) and echoes it back', async () => {
    storedIdsToReturn = [];
    const req = makeRequest({ chatbotIds: [] });
    const res = await PATCH(req as never);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(mockSetStoredEnabledChatbotIds).toHaveBeenCalledWith([]);
    expect(body.chatbotIds).toEqual([]);
  });

  it('persists a partial selection and echoes it back', async () => {
    const partial = [ChatbotId.GoogleAIOverview];
    storedIdsToReturn = partial;
    const req = makeRequest({ chatbotIds: partial });
    const res = await PATCH(req as never);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(mockSetStoredEnabledChatbotIds).toHaveBeenCalledWith(partial);
    expect(body.chatbotIds).toEqual(partial);
  });

  it('persists the full selection and echoes it back', async () => {
    const all = [ChatbotId.ChatGPT, ChatbotId.GoogleAIOverview, ChatbotId.Perplexity];
    storedIdsToReturn = all;
    const req = makeRequest({ chatbotIds: all });
    const res = await PATCH(req as never);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(mockSetStoredEnabledChatbotIds).toHaveBeenCalledWith(all);
    expect(body.chatbotIds).toEqual(all);
  });

  it('passes through a null read result verbatim rather than coercing it to an array', async () => {
    // Contrived (a real `getStoredEnabledChatbotIds` never returns `null` right after a `set`
    // call), but it pins down that the route relays whatever storage says rather than assuming
    // storage always echoes back what was just written.
    storedIdsToReturn = null;
    const req = makeRequest({ chatbotIds: [] });
    const res = await PATCH(req as never);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.chatbotIds).toBeNull();
  });

  it('returns 500 for an invalid chatbot id', async () => {
    const req = makeRequest({ chatbotIds: ['not-a-real-chatbot'] });
    const res = await PATCH(req as never);
    expect(res.status).toBe(500);
    expect(mockSetStoredEnabledChatbotIds).not.toHaveBeenCalled();
  });
});
