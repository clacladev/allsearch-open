import { ProjectRow } from '@/libs/database/Projects/types';
import { DomainCategory, getDomainCategory } from './domain-categories';
import { PromptResponseWorkRow } from './helpers';
import { Summary } from '@/libs/utils/Summary';

export type SourceDomain = {
  hostname: string;
  domainCategory: DomainCategory;
  usedCount: number;
  usedPercentage: number;
  citedCount: number;
  citedPercentage: number;
};

type DomainCounters = {
  usedCount: number;
  citedCount: number;
};

type DomainMapValue = DomainCounters;

const getEmptyDomainCounters = (): DomainCounters => ({
  usedCount: 0,
  citedCount: 0,
});

export async function getSourceDomainsSummary(
  project: ProjectRow,
  promptResponses: PromptResponseWorkRow[],
  resultMaxLength?: number
): Promise<Summary<SourceDomain>> {
  if (!promptResponses.length) return { data: [], totalCount: 0 };

  // Create a map of domains with their stats
  const domainsMap: Map<string, DomainMapValue> = new Map();
  promptResponses.forEach((response) => {
    const trackedDomainsForResponse = new Set<string>();
    return response.sources.forEach((source) => {
      // Don't want to count the same domain multiple times in the same response
      if (trackedDomainsForResponse.has(source.hostname)) return;
      trackedDomainsForResponse.add(source.hostname);

      let domainData = domainsMap.get(source.hostname);
      if (!domainData) {
        domainData = { ...getEmptyDomainCounters() };
        domainsMap.set(source.hostname, domainData);
      }

      domainData.usedCount++;
      if (source.isCited) domainData.citedCount++;
    });
  });

  const responsesCount = promptResponses.length;

  const domainsEntries = domainsMap
    .entries()
    .toArray()
    .sort(([, a], [, b]) => b.usedCount - a.usedCount);
  const domainsData = domainsEntries.slice(0, resultMaxLength).map(([hostname, data]) => ({
    hostname,
    domainCategory: getDomainCategory(hostname, project.hostname),
    usedCount: data.usedCount,
    usedPercentage: Math.round((data.usedCount / responsesCount) * 100),
    citedCount: data.citedCount,
    citedPercentage: Math.round((data.citedCount / data.usedCount) * 100),
  }));

  return {
    data: domainsData,
    totalCount: domainsEntries.length,
  };
}
