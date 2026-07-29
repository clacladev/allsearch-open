import { GenerateTextResult, ToolSet } from 'ai';
import { getUrlCleanComponents } from '@/libs/utils/urls';
import { SourceItem } from '@/libs/database/Sources/types';

export function getSourcesFromResponse<TTools extends ToolSet>(
  response: GenerateTextResult<TTools, any>
): SourceItem[] {
  const filteredSources: SourceItem[] = [];

  response.sources
    .filter((source) => source.sourceType === 'url')
    .forEach((source) => {
      const cleanUrl = getUrlCleanComponents(source.url);
      if (filteredSources.some((s) => s.cleanUrl === cleanUrl.url)) return;
      filteredSources.push({
        isCited: true,
        url: source.url,
        cleanUrl: cleanUrl.url,
        hostname: cleanUrl.hostname,
        title: source.title,
      });
    });

  const webSearchResult = response.toolResults?.find((result) => result.toolName === 'web_search');
  const output = webSearchResult?.output as { sources?: Array<{ type: string; url: string }> };
  const sources = output?.sources ?? [];

  sources
    .filter((source) => source.type === 'url')
    .forEach((source) => {
      const cleanUrl = getUrlCleanComponents(source.url);
      if (filteredSources.some((s) => s.cleanUrl === cleanUrl.url)) return;
      filteredSources.push({
        isCited: false,
        url: source.url,
        cleanUrl: cleanUrl.url,
        hostname: cleanUrl.hostname,
      });
    });

  return filteredSources;
}
