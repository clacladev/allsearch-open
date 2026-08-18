import { describe, expect, it } from 'bun:test';

import { getSourcesFromResponse } from '@/libs/ai/responseSources';

function responseWithSources(sources: Array<{ sourceType: string; url: string; title?: string }>) {
  return { sources, toolResults: [] } as any;
}

function responseWithToolOutput(toolSources: Array<{ type: string; url: string }>) {
  return { sources: [], toolResults: [{ toolName: 'web_search', output: { sources: toolSources } }] } as any;
}

describe('getSourcesFromResponse', () => {
  it('keeps https sources from response.sources', () => {
    const result = getSourcesFromResponse(
      responseWithSources([{ sourceType: 'url', url: 'https://example.com/a?utm_source=x', title: 'A' }])
    );
    expect(result).toEqual([
      { isCited: true, url: 'https://example.com/a?utm_source=x', cleanUrl: 'example.com/a', hostname: 'example.com', title: 'A' },
    ]);
  });

  it('keeps https sources from web_search tool output', () => {
    const result = getSourcesFromResponse(responseWithToolOutput([{ type: 'url', url: 'https://example.com/b' }]));
    expect(result).toEqual([{ isCited: false, url: 'https://example.com/b', cleanUrl: 'example.com/b', hostname: 'example.com' }]);
  });

  it('drops javascript: URLs from response.sources', () => {
    const result = getSourcesFromResponse(
      responseWithSources([
        { sourceType: 'url', url: 'javascript:alert(1)', title: 'evil' },
        { sourceType: 'url', url: 'javascript://x/%0aalert(1)', title: 'evil' },
      ])
    );
    expect(result).toEqual([]);
  });

  it('drops javascript: URLs from web_search tool output', () => {
    const result = getSourcesFromResponse(
      responseWithToolOutput([
        { type: 'url', url: 'javascript:alert(1)' },
        { type: 'url', url: 'javascript://x/%0aalert(1)' },
      ])
    );
    expect(result).toEqual([]);
  });
});
