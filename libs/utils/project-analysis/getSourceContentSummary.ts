import { ProjectRow } from '@/libs/database/Projects/types';
import { SourceItem } from '@/libs/database/Sources/types';
import { DomainCategory, getDomainCategory } from './domain-categories';
import { Summary } from '@/libs/utils/Summary';
import { PromptResponseWorkRow } from './helpers';
import { getUniqueId } from '@/libs/signature';
import { PageHeading } from '@/libs/utils/urlAnalysis';

export type SourceContent = {
  id: string;
  url: string;
  cleanUrl: string;
  title: string | undefined;
  domainCategory: DomainCategory;
  usedCount: number;
  usedPercentage: number;
  usedInPromptIds: string[];
  citedCount: number;
  citedPercentage: number;
  citedInPromptIds: string[];
  projectIdRank: number;
  brandIdsRanking: string[];
  description: string | undefined;
  headings: PageHeading[] | undefined;
  createdAt: string;
};

type SourceCounters = {
  usedCount: number;
  citedCount: number;
  usedInPromptIds: Set<string>;
  citedInPromptIds: Set<string>;
  projectIdRank: number;
  brandIdsCitedCount: Map<string, number>;
  createdAt: string;
};

type SourceMapValue = SourceItem & SourceCounters;

const getEmptySourceCounters = (): SourceCounters => ({
  usedCount: 0,
  citedCount: 0,
  usedInPromptIds: new Set<string>(),
  citedInPromptIds: new Set<string>(),
  projectIdRank: 0,
  brandIdsCitedCount: new Map<string, number>(),
  createdAt: '',
});

export function getSourceContentSummary(
  project: ProjectRow,
  promptResponses: PromptResponseWorkRow[],
  resultMaxLength?: number,
  shouldAddDetails?: boolean
): Summary<SourceContent> {
  if (!promptResponses.length) return { data: [], totalCount: 0 };

  // Create a map of sources with their basic stats
  const sourcesMap: Map<string, SourceMapValue> = new Map();
  promptResponses.forEach((response) =>
    response.sources.forEach((source) => {
      let sourceData = sourcesMap.get(source.cleanUrl);
      if (!sourceData) {
        sourceData = { ...source, ...getEmptySourceCounters(), createdAt: response.created_at };
        sourcesMap.set(source.cleanUrl, sourceData);
      }
      sourceData.usedCount++;
      sourceData.usedInPromptIds.add(response.prompt_id);
      if (source.isCited) {
        sourceData.citedCount++;
        sourceData.citedInPromptIds.add(response.prompt_id);
      }

      source.brandIdsRanking?.forEach((brandId) => {
        const brandCount = sourceData.brandIdsCitedCount.get(brandId) || 0;
        sourceData.brandIdsCitedCount.set(brandId, brandCount + 1);
      });
    })
  );

  const responsesCount = promptResponses.length;

  const sourcesEntries = sourcesMap
    .entries()
    .toArray()
    .sort(([, a], [, b]) => b.usedCount - a.usedCount);
  const sourcesData: SourceContent[] = sourcesEntries.slice(0, resultMaxLength).map(([, data]) => {
    const brandIdsRanking = data.brandIdsCitedCount
      .entries()
      .toArray()
      .sort(([, a], [, b]) => b - a)
      .map(([brandId]) => brandId);
    const projectIdRank = brandIdsRanking.indexOf(project.id);

    return {
      id: getUniqueId(data.cleanUrl),
      url: data.url,
      cleanUrl: data.cleanUrl,
      title: data.title,
      domainCategory: getDomainCategory(data.hostname, project.hostname),
      usedCount: data.usedCount,
      usedPercentage: Math.round((data.usedCount / responsesCount) * 100),
      usedInPromptIds: Array.from(data.usedInPromptIds),
      citedCount: data.citedCount,
      citedPercentage: Math.round((data.citedCount / responsesCount) * 100),
      citedInPromptIds: Array.from(data.citedInPromptIds),
      projectIdRank,
      brandIdsRanking,
      description: shouldAddDetails ? data.description : undefined,
      headings: shouldAddDetails ? data.headings : undefined,
      createdAt: data.createdAt,
    };
  });

  return {
    data: sourcesData,
    totalCount: sourcesEntries.length,
  };
}
