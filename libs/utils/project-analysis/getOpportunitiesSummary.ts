import { ProjectRow } from '@/libs/database/Projects/types';
import { SourceItem } from '@/libs/database/Sources/types';
import { Summary } from '@/libs/utils/Summary';
import { areDomainsRelated } from '@/libs/utils/domainUtils';
import { isDomainCategory } from './domain-categories';
import {
  Opportunity,
  ProjectSourceNeedsImprovementOpportunity,
  ProjectSourceNotCitedOpportunity,
  ProjectSourceNotConsistentlyFoundOpportunity,
  ProjectSourceNotFoundOpportunity,
  SourceItemCounter,
  UgcSourceNeedsImprovementOpportunity,
} from './types';
import { getNewOpportunityId, PromptResponseWorkRow, resetOpportunityId } from './helpers';

export const MAX_INSPIRATION_SOURCES_PER_OPPORTUNITY = 10;

const PRIORITY_SCORE_PER_PROJECT_SOURCE_NOT_CITED_OPPORTUNITY = 100;
const PRIORITY_SCORE_PER_PROJECT_SOURCE_NEEDS_IMPROVEMENT_OPPORTUNITY = 70;
const PRIORITY_SCORE_PER_PROJECT_SOURCE_NOT_FOUND_OPPORTUNITY = 150;
const PRIORITY_SCORE_PER_PROJECT_SOURCE_NOT_CONSISTENTLY_FOUND_OPPORTUNITY = 100;
const PRIORITY_SCORE_PER_UGC_SOURCE_NEEDS_IMPROVEMENT_OPPORTUNITY = 50;

type PromptId = string;
type ProjectSourceCleanUrl = string;
type InspirationSourceCleanUrl = string;

type InspirationSourcesItem = {
  sourcesMap: Map<InspirationSourceCleanUrl, SourceItemCounter>;
  promptResponseIds: string[];
};
type ProjectSourcesMap = Map<ProjectSourceCleanUrl, InspirationSourcesItem>;
type PromptsMap = Map<PromptId, ProjectSourcesMap>;

type ProjectSources = {
  map: Map<ProjectSourceCleanUrl, SourceItem>;
  array: SourceItem[];
  cleanUrlsSet: Set<ProjectSourceCleanUrl>;
};

export async function getOpportunitiesSummary(
  project: ProjectRow,
  promptResponses: PromptResponseWorkRow[],
  resultMaxLength?: number
): Promise<Summary<Opportunity>> {
  if (!promptResponses.length) return { data: [], totalCount: 0 };

  // Create a map of the freshest and most complete sources
  const sourcesMap: Map<string, SourceItem> = new Map();
  promptResponses.toReversed().forEach((response) =>
    response.sources.forEach((source) => {
      const refSource = sourcesMap.get(source.cleanUrl);
      // If there is no reference source, set it as the reference source
      if (!refSource) {
        sourcesMap.set(source.cleanUrl, source);
        return;
      }
      // If the reference source is complete, skip it
      if (refSource.title && refSource.description && refSource.headings?.length) {
        return;
      }
      // If the current source is more complete, set it as the reference source
      if (source.title && source.description && source.headings?.length) {
        sourcesMap.set(source.cleanUrl, source);
      }
    })
  );

  // Create different collections of the project sources, for different use cases
  const projectSourcesArray = sourcesMap
    .values()
    .toArray()
    .filter((source) => areDomainsRelated(project.hostname, source.hostname));
  const projectSources: ProjectSources = {
    map: new Map(projectSourcesArray.map((s) => [s.cleanUrl, s])),
    array: projectSourcesArray,
    cleanUrlsSet: new Set(projectSourcesArray.map((s) => s.cleanUrl)),
  };

  resetOpportunityId();

  const [
    articleFromProjectDomainOpportunities,
    needsImprovementProjectSourceOpportunities,
    noProjectSourcesFoundOpportunities,
    notConsistentlyFoundOpportunities,
    needsImprovementUgcSourceOpportunity,
  ] = await Promise.all([
    getProjectSourceNotCitedOpportunities(promptResponses, projectSources),
    getProjectSourceNeedsImprovementOpportunities(promptResponses, projectSources, project),
    getProjectSourceNotFoundOpportunities(promptResponses, projectSources),
    getProjectSourceNotConsistentlyFoundOpportunities(promptResponses, projectSources),
    getUgcSourceNeedsImprovementOpportunities(promptResponses, project),
  ]);

  // Aggregate the opportunities
  const allOpportunities = [
    ...articleFromProjectDomainOpportunities,
    ...needsImprovementProjectSourceOpportunities,
    ...noProjectSourcesFoundOpportunities,
    ...notConsistentlyFoundOpportunities,
    ...needsImprovementUgcSourceOpportunity,
  ].sort((a, b) => b.priorityScore - a.priorityScore); // Sort by priority score
  const opportunitiesData = allOpportunities.slice(0, resultMaxLength);

  return {
    data: opportunitiesData,
    totalCount: allOpportunities.length,
  };
}

async function getProjectSourceNotCitedOpportunities(
  promptResponses: PromptResponseWorkRow[],
  projectSources: ProjectSources
): Promise<ProjectSourceNotCitedOpportunity[]> {
  if (!promptResponses.length || !projectSources.array.length) return [];

  // Get prompt responses with not-cited project sources
  const filteredPromptResponses = promptResponses.filter((response) =>
    response.sources.some(
      (source) => !source.isCited && projectSources.map.has(source.cleanUrl)
    )
  );

  // Get the unique prompt ids from the filtered prompt responses
  const promptIds = new Set(filteredPromptResponses.map((response) => response.prompt_id));

  const promptsMap: PromptsMap = new Map();
  promptIds.forEach((promptId) => {
    promptResponses.forEach((response) => {
      if (response.prompt_id !== promptId) return;

      // Get or creted the prompt id map
      let projectSourcesMap = promptsMap.get(promptId);
      if (!projectSourcesMap) {
        projectSourcesMap = new Map();
        promptsMap.set(promptId, projectSourcesMap);
      }

      // Get the index of the first not-cited project source
      const indexFirstNotCitedProjectSource = response.sources.findIndex(
        (s) => !s.isCited && projectSources.cleanUrlsSet.has(s.cleanUrl)
      );
      if (indexFirstNotCitedProjectSource === -1) return;

      // Get the non-project cited sources, before the first not-cited project source
      const sourcesBeforeProjectSource = response.sources
        .slice(0, indexFirstNotCitedProjectSource)
        .filter((s) => s.isCited);
      if (!sourcesBeforeProjectSource.length) return;

      // Get the not-cited project source
      if (indexFirstNotCitedProjectSource >= response.sources.length) return;
      const notCitedProjectSource = response.sources[indexFirstNotCitedProjectSource];

      // Create the inspiration sources map
      let inspirationSourcesItem = projectSourcesMap.get(notCitedProjectSource.cleanUrl);
      if (!inspirationSourcesItem) {
        inspirationSourcesItem = { sourcesMap: new Map(), promptResponseIds: [] };
        projectSourcesMap.set(notCitedProjectSource.cleanUrl, inspirationSourcesItem);
      }

      // Update the inspiration sources map
      sourcesBeforeProjectSource.forEach((source) => {
        let counter = inspirationSourcesItem.sourcesMap.get(source.cleanUrl);
        if (!counter) {
          counter = { ...source, citationCount: 0 };
          inspirationSourcesItem.sourcesMap.set(source.cleanUrl, counter);
        }
        counter.citationCount += 1;
      });
      // Update the prompt response ids
      inspirationSourcesItem.promptResponseIds.push(response.id);
    });
  });

  // Create a ui-friendly list of opportunities, based on the project not-cited clean urls
  // Note: this flips a promptId based map, to a projectSourceCleanUrl based map
  const opportunitiesMap: Map<ProjectSourceCleanUrl, ProjectSourceNotCitedOpportunity> = new Map();
  promptsMap.forEach((projectSourcesMap, promptId) => {
    projectSourcesMap.forEach((inspirationSourcesMap, projectSourceCleanUrl) => {
      let opportunity = opportunitiesMap.get(projectSourceCleanUrl);
      if (!opportunity) {
        const projectSource = projectSources.map.get(projectSourceCleanUrl);
        if (!projectSource) return;
        opportunity = {
          id: getNewOpportunityId(),
          type: 'ProjectSourceNotCitedOpportunity',
          projectSource,
          promptsBasedInspiration: {},
          priorityScore: 0,
        };
        opportunitiesMap.set(projectSourceCleanUrl, opportunity);
      }
      // Set and sort inspiration sources by citation count
      opportunity.promptsBasedInspiration[promptId] = {
        sources: inspirationSourcesMap.sourcesMap
          .values()
          .toArray()
          .sort((a, b) => b.citationCount - a.citationCount)
          .slice(0, MAX_INSPIRATION_SOURCES_PER_OPPORTUNITY),
        promptResponseIds: inspirationSourcesMap.promptResponseIds,
      };
    });
  });

  return opportunitiesMap
    .values()
    .toArray()
    .map((opportunity) => {
      opportunity.priorityScore =
        Object.keys(opportunity.promptsBasedInspiration).length *
        PRIORITY_SCORE_PER_PROJECT_SOURCE_NOT_CITED_OPPORTUNITY;
      return opportunity;
    });
}

async function getProjectSourceNeedsImprovementOpportunities(
  promptResponses: PromptResponseWorkRow[],
  projectSources: ProjectSources,
  project: ProjectRow
): Promise<ProjectSourceNeedsImprovementOpportunity[]> {
  if (!promptResponses.length || !projectSources.array.length) return [];

  // Get prompt responses with cited project sources that are not the first citation
  const filteredPromptResponses = promptResponses.filter((response) =>
    response.sources.some(
      (source, index) => source.isCited && projectSources.map.has(source.cleanUrl) && index > 0
    )
  );

  // Get the unique prompt ids from the filtered prompt responses
  const promptIds = new Set(filteredPromptResponses.map((response) => response.prompt_id));

  const promptsMap: PromptsMap = new Map();
  promptIds.forEach((promptId) => {
    promptResponses.forEach((response) => {
      if (
        response.prompt_id !== promptId ||
        response.brand_ids_ranking.length <= 1 ||
        response.brand_ids_ranking[0] === project.id
      ) {
        return;
      }

      // Get or creted the prompt id map
      let projectSourcesMap = promptsMap.get(promptId);
      if (!projectSourcesMap) {
        projectSourcesMap = new Map();
        promptsMap.set(promptId, projectSourcesMap);
      }

      // Get the index of the first cited project source
      const indexFirstCitedProjectSource = response.sources.findIndex(
        (s) => s.isCited && projectSources.cleanUrlsSet.has(s.cleanUrl)
      );
      // If there is no cited project source or the first cited project source is the first source, there is no opportunity
      if (indexFirstCitedProjectSource === -1 || indexFirstCitedProjectSource === 0) return;

      // Get the non-project cited sources, before the first cited project source
      const sourcesBeforeProjectSource = response.sources
        .slice(0, indexFirstCitedProjectSource)
        .filter((s) => s.isCited);
      if (!sourcesBeforeProjectSource.length) return;

      // Get the cited project source
      if (indexFirstCitedProjectSource >= response.sources.length) return;
      const citedProjectSource = response.sources[indexFirstCitedProjectSource];

      // Create the inspiration sources map
      let inspirationSourcesItem = projectSourcesMap.get(citedProjectSource.cleanUrl);
      if (!inspirationSourcesItem) {
        inspirationSourcesItem = { sourcesMap: new Map(), promptResponseIds: [] };
        projectSourcesMap.set(citedProjectSource.cleanUrl, inspirationSourcesItem);
      }

      // Update the inspiration sources map
      sourcesBeforeProjectSource.forEach((source) => {
        let counter = inspirationSourcesItem.sourcesMap.get(source.cleanUrl);
        if (!counter) {
          counter = { ...source, citationCount: 0 };
          inspirationSourcesItem.sourcesMap.set(source.cleanUrl, counter);
        }
        counter.citationCount += 1;
      });
      // Update the prompt response ids
      inspirationSourcesItem.promptResponseIds.push(response.id);
    });
  });

  // Create a ui-friendly list of opportunities, based on the project cited clean urls
  // Note: this flips a promptId based map, to a projectSourceCleanUrl based map
  const opportunitiesMap: Map<ProjectSourceCleanUrl, ProjectSourceNeedsImprovementOpportunity> =
    new Map();
  promptsMap.forEach((projectSourcesMap, promptId) => {
    projectSourcesMap.forEach((inspirationSourcesMap, projectSourceCleanUrl) => {
      let opportunity = opportunitiesMap.get(projectSourceCleanUrl);
      if (!opportunity) {
        const projectSource = projectSources.map.get(projectSourceCleanUrl);
        if (!projectSource) return;
        opportunity = {
          id: getNewOpportunityId(),
          type: 'ProjectSourceNeedsImprovementOpportunity',
          projectSource,
          promptsBasedInspiration: {},
          priorityScore: 0,
        };
        opportunitiesMap.set(projectSourceCleanUrl, opportunity);
      }
      // Set and sort inspiration sources by citation count
      opportunity.promptsBasedInspiration[promptId] = {
        sources: inspirationSourcesMap.sourcesMap
          .values()
          .toArray()
          .sort((a, b) => b.citationCount - a.citationCount)
          .slice(0, MAX_INSPIRATION_SOURCES_PER_OPPORTUNITY),
        promptResponseIds: inspirationSourcesMap.promptResponseIds,
      };
    });
  });

  return opportunitiesMap
    .values()
    .toArray()
    .map((opportunity) => {
      opportunity.priorityScore =
        Object.keys(opportunity.promptsBasedInspiration).length *
        PRIORITY_SCORE_PER_PROJECT_SOURCE_NEEDS_IMPROVEMENT_OPPORTUNITY;
      return opportunity;
    });
}

async function getProjectSourceNotFoundOpportunities(
  promptResponses: PromptResponseWorkRow[],
  projectSources: ProjectSources
): Promise<ProjectSourceNotFoundOpportunity[]> {
  if (!promptResponses.length) return [];

  // Pre-compute prompts that have at least one response with project sources.
  // If any response for a prompt cites brand content, no "create content" opportunity should be generated.
  const promptsWithProjectSources = new Set(
    promptResponses
      .filter((response) => response.sources.some((source) => projectSources.map.has(source.cleanUrl)))
      .map((response) => response.prompt_id)
  );

  const promptsMap: Map<PromptId, InspirationSourcesItem> = new Map();
  promptResponses.forEach((response) => {
    // Skip if this prompt has any response with project sources
    if (promptsWithProjectSources.has(response.prompt_id)) return;

    let promptSourcesMap = promptsMap.get(response.prompt_id);
    if (!promptSourcesMap) {
      promptSourcesMap = { sourcesMap: new Map(), promptResponseIds: [] };
      promptsMap.set(response.prompt_id, promptSourcesMap);
    }

    // Update the inspiration sources map
    response.sources.forEach((source) => {
      let inspirationSourcesItem = promptSourcesMap.sourcesMap.get(source.cleanUrl);
      if (!inspirationSourcesItem) {
        inspirationSourcesItem = { ...source, citationCount: 0 };
        promptSourcesMap.sourcesMap.set(source.cleanUrl, inspirationSourcesItem);
      }
      inspirationSourcesItem.citationCount += 1;
    });

    // Update the prompt response ids
    promptSourcesMap.promptResponseIds.push(response.id);
  });

  const opportunities: ProjectSourceNotFoundOpportunity[] = promptsMap
    .entries()
    .toArray()
    .map(([promptId, inspirationSourcesItem]) => ({
      id: getNewOpportunityId(),
      type: 'ProjectSourceNotFoundOpportunity',
      promptId,
      inspirationSources: inspirationSourcesItem.sourcesMap
        .values()
        .toArray()
        .sort((a, b) => b.citationCount - a.citationCount)
        .slice(0, MAX_INSPIRATION_SOURCES_PER_OPPORTUNITY),
      promptResponseIds: inspirationSourcesItem.promptResponseIds,
      priorityScore: PRIORITY_SCORE_PER_PROJECT_SOURCE_NOT_FOUND_OPPORTUNITY,
    }));

  return opportunities;
}

const PROJECT_SOURCE_NOT_CONSISTENTLY_FOUND_THRESHOLD = 0.5;

async function getProjectSourceNotConsistentlyFoundOpportunities(
  promptResponses: PromptResponseWorkRow[],
  projectSources: ProjectSources
): Promise<ProjectSourceNotConsistentlyFoundOpportunity[]> {
  if (!promptResponses.length) return [];

  // Group responses by prompt, separating those with and without project sources
  const responsesByPrompt = new Map<
    PromptId,
    { withSource: PromptResponseWorkRow[]; withoutSource: PromptResponseWorkRow[] }
  >();
  promptResponses.forEach((response) => {
    let group = responsesByPrompt.get(response.prompt_id);
    if (!group) {
      group = { withSource: [], withoutSource: [] };
      responsesByPrompt.set(response.prompt_id, group);
    }
    const hasProjectSource = response.sources.some((source) =>
      projectSources.map.has(source.cleanUrl)
    );
    if (hasProjectSource) {
      group.withSource.push(response);
    } else {
      group.withoutSource.push(response);
    }
  });

  const opportunities: ProjectSourceNotConsistentlyFoundOpportunity[] = [];

  responsesByPrompt.forEach((group, promptId) => {
    const total = group.withSource.length + group.withoutSource.length;
    const coverage = group.withSource.length / total;

    // Only qualify if there is some coverage (>0%) but less than 50%:
    // - 0% coverage is handled by ProjectSourceNotFoundOpportunity
    // - ≥50% coverage is considered consistent enough
    if (coverage === 0 || coverage >= PROJECT_SOURCE_NOT_CONSISTENTLY_FOUND_THRESHOLD) return;

    // Build inspiration sources from the responses that lack project sources
    const inspirationSourcesMap = new Map<string, SourceItemCounter>();
    group.withoutSource.forEach((response) => {
      response.sources.forEach((source) => {
        let item = inspirationSourcesMap.get(source.cleanUrl);
        if (!item) {
          item = { ...source, citationCount: 0 };
          inspirationSourcesMap.set(source.cleanUrl, item);
        }
        item.citationCount += 1;
      });
    });

    opportunities.push({
      id: getNewOpportunityId(),
      type: 'ProjectSourceNotConsistentlyFoundOpportunity',
      promptId,
      inspirationSources: inspirationSourcesMap
        .values()
        .toArray()
        .sort((a, b) => b.citationCount - a.citationCount)
        .slice(0, MAX_INSPIRATION_SOURCES_PER_OPPORTUNITY),
      promptResponseIds: group.withoutSource.map((r) => r.id),
      priorityScore: PRIORITY_SCORE_PER_PROJECT_SOURCE_NOT_CONSISTENTLY_FOUND_OPPORTUNITY,
    });
  });

  return opportunities;
}

async function getUgcSourceNeedsImprovementOpportunities(
  promptResponses: PromptResponseWorkRow[],
  project: ProjectRow
): Promise<UgcSourceNeedsImprovementOpportunity[]> {
  if (!promptResponses.length) return [];

  const promptsMap: Map<PromptId, InspirationSourcesItem> = new Map();
  promptResponses.forEach((response) => {
    // Skip if the project brand already ranks first
    if (response.brand_ids_ranking[0] === project.id) return;

    response.sources.forEach((source) => {
      // Skip if the source is not cited or if it's not UGC
      if (!source.isCited || !isDomainCategory(source.hostname, 'UGC')) return;

      let promptSourcesMap = promptsMap.get(response.prompt_id);
      if (!promptSourcesMap) {
        promptSourcesMap = { sourcesMap: new Map(), promptResponseIds: [] };
        promptsMap.set(response.prompt_id, promptSourcesMap);
      }

      let inspirationSourcesItem = promptSourcesMap.sourcesMap.get(source.cleanUrl);
      if (!inspirationSourcesItem) {
        inspirationSourcesItem = { ...source, citationCount: 0 };
        promptSourcesMap.sourcesMap.set(source.cleanUrl, inspirationSourcesItem);
      }

      // Update the citation count and prompt response ids
      inspirationSourcesItem.citationCount += 1;
      promptSourcesMap.promptResponseIds.push(response.id);
    });
  });

  const opportunities = Array.from(promptsMap)
    .flatMap(([promptId, inspirationSourcesItem]) =>
      Array.from(inspirationSourcesItem.sourcesMap).map(
        ([_, source]) =>
          ({
            id: getNewOpportunityId(),
            type: 'UgcSourceNeedsImprovementOpportunity',
            promptId,
            source,
            promptResponseIds: inspirationSourcesItem.promptResponseIds,
            priorityScore: PRIORITY_SCORE_PER_UGC_SOURCE_NEEDS_IMPROVEMENT_OPPORTUNITY,
          }) as UgcSourceNeedsImprovementOpportunity
      )
    )
    .sort((a, b) => b.source.citationCount - a.source.citationCount);

  return opportunities;
}
