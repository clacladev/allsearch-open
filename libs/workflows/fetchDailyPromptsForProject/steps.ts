import { getPromptResponseWithChatGPT } from '@/libs/ai/projectPrompt/getPromptResponseWithChatGPT';
import { analyzeResponseSentiment } from '@/libs/ai/sentimentAnalysis';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';
import { ProcessPromptResponse } from '../shared/types';
import { getSourcesFromResponse } from '../shared/responseSources';
import {
  getPromptResponseRowsWithProjectIdInDateRange,
  insertPromptResponseRows,
} from '@/libs/database/PromptResponses/queries';
import { insertSourceRows } from '@/libs/database/Sources/queries';
import { getProjectRowWithId, updateProjectRow } from '@/libs/database/Projects/queries';
import { getActiveCompetitorRowsWithProjectId } from '@/libs/database/Competitors/queries';
import { ProjectRow } from '@/libs/database/Projects/types';
import { CompetitorRow } from '@/libs/database/Competitors/types';
import { getPromptRowsWithProjectId } from '@/libs/database/Prompts/queries';
import { getISODateString, ISODateString } from '@/libs/database/shared/ISODateString';
import { BrandsSentiment } from '@/libs/database/PromptResponses/types';
import { SourceItem } from '@/libs/database/Sources/types';
import { getBrandIdsRankingsInText } from '@/libs/utils/brandIdsRanking';
import { analysePromptResponseSources } from '@/libs/utils/sourcesAnalysis';
import { getPromptResponseWithGoogleAIMode } from '@/libs/ai/projectPrompt/getPromptResponseWithGoogleAIMode';
import { getPromptResponseWithPerplexity } from '@/libs/ai/projectPrompt/getPromptResponseWithPerplexity';

export async function getPromptRowsToProcess(
  projectId: string,
  targetDate: ISODateString,
  maxPrompts?: number,
  shouldForce?: boolean
) {
  'use step';
  const prompts = await getPromptRowsWithProjectId(projectId, false);

  let filteredPrompts = prompts;
  if (!shouldForce) {
    const targetDateISO = getISODateString(targetDate);
    const responses = await getPromptResponseRowsWithProjectIdInDateRange(
      projectId,
      targetDateISO,
      targetDateISO
    );
    filteredPrompts = prompts.filter(
      (prompt) => !responses.some((response) => response.prompt_id === prompt.id)
    );
  }

  if (maxPrompts) {
    filteredPrompts = filteredPrompts.slice(0, maxPrompts);
  }

  return filteredPrompts.map((prompt) => ({
    name: prompt.name,
    id: prompt.id,
  }));
}

export async function fetchDailyPrompt(
  promptName: string,
  promptId: string,
  projectId: string,
  workflowId: string
) {
  'use step';
  const { project, competitors } = await getProjectInfo(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);
  await processPromptForAllChatbots(promptName, promptId, project, competitors, workflowId);
}

async function getProjectInfo(projectId: string) {
  'use step';
  return {
    project: await getProjectRowWithId(projectId),
    competitors: await getActiveCompetitorRowsWithProjectId(projectId),
  };
}

async function processPromptForAllChatbots(
  promptName: string,
  promptId: string,
  project: ProjectRow,
  competitors: CompetitorRow[],
  workflowId: string
) {
  'use step';
  // Get responses from all chatbots
  const responses = (
    await Promise.allSettled([
      processPromptForChatGPT(promptName, project.target_location),
      processPromptForGoogleAIMode(promptName),
      processPromptForPerplexity(promptName),
    ])
  )
    .filter((response) => response.status === 'fulfilled')
    .map((response) => response.value);

  const [brandIdsRankingResult, sourcesResult, sentimentsResult] = await Promise.allSettled([
    analysePromptResponsesForBrandRankings(responses, project, competitors),
    analysePromptResponsesSources(responses, project, competitors),
    analysePromptResponsesSentiment(responses, project, competitors),
  ]);

  const brandIdsRanking =
    brandIdsRankingResult.status === 'fulfilled' ? brandIdsRankingResult.value : [];
  const sources = sourcesResult.status === 'fulfilled' ? sourcesResult.value : [];
  const sentiments = sentimentsResult.status === 'fulfilled' ? sentimentsResult.value : [];

  await storePromptResponses(
    promptId,
    project.id,
    responses,
    sources,
    brandIdsRanking,
    sentiments,
    workflowId
  );
}

async function processPromptForChatGPT(
  promptName: string,
  targetLocation: string | null
): Promise<ProcessPromptResponse> {
  'use step';
  try {
    const response = await getPromptResponseWithChatGPT(promptName, targetLocation);
    return {
      chatbotId: ChatbotId.ChatGPT,
      modelId: response.response.modelId,
      text: response.text,
      sources: getSourcesFromResponse(response),
      brandIdsRanking: [],
    };
  } catch (error) {
    console.error('Error processing prompt for ChatGPT:', error);
    throw error;
  }
}

async function processPromptForGoogleAIMode(promptName: string): Promise<ProcessPromptResponse> {
  'use step';
  try {
    const response = await getPromptResponseWithGoogleAIMode(promptName);
    return {
      chatbotId: ChatbotId.GoogleAIOverview,
      modelId: response.response.modelId,
      text: response.text,
      sources: getSourcesFromResponse(response),
      brandIdsRanking: [],
    };
  } catch (error) {
    console.error('Error processing prompt for Google AI Mode:', error);
    throw error;
  }
}

async function processPromptForPerplexity(promptName: string): Promise<ProcessPromptResponse> {
  'use step';
  try {
    const response = await getPromptResponseWithPerplexity(promptName);
    return {
      chatbotId: ChatbotId.Perplexity,
      modelId: response.response.modelId,
      text: response.text,
      sources: getSourcesFromResponse(response),
      brandIdsRanking: [],
    };
  } catch (error) {
    console.error('Error processing prompt for Perplexity:', error);
    throw error;
  }
}

async function analysePromptResponsesForBrandRankings(
  responses: ProcessPromptResponse[],
  project: ProjectRow,
  competitors: CompetitorRow[]
): Promise<string[][]> {
  'use step';
  return responses.map((response) =>
    getBrandIdsRankingsInText(response.text, project, competitors)
  );
}

async function analysePromptResponsesSentiment(
  responses: ProcessPromptResponse[],
  project: ProjectRow,
  competitors: CompetitorRow[]
): Promise<(BrandsSentiment | undefined)[]> {
  'use step';
  const brands = [
    { id: project.id, name: project.name },
    ...competitors
      .filter((c): c is CompetitorRow & { name: string } => !!c.name)
      .map((c) => ({ id: c.id, name: c.name })),
  ];

  const results = await Promise.allSettled(
    responses.map((response) => analyzeResponseSentiment(response.text, brands))
  );

  return results.map((result) => {
    if (result.status === 'rejected') {
      console.error('Error analyzing sentiment:', result.reason);
      return undefined;
    }
    return result.value;
  });
}

async function analysePromptResponsesSources(
  responses: ProcessPromptResponse[],
  project: ProjectRow,
  competitors: CompetitorRow[]
): Promise<SourceItem[]> {
  'use step';
  // Get unique sources
  const uniqueSources: SourceItem[] = [];
  responses.forEach((response) =>
    response.sources.forEach((source) => {
      if (uniqueSources.some((s) => s.cleanUrl === source.cleanUrl)) return;
      uniqueSources.push(source);
    })
  );

  return analysePromptResponseSources(uniqueSources, project, competitors);
}

async function storePromptResponses(
  promptId: string,
  projectId: string,
  responses: ProcessPromptResponse[],
  sources: SourceItem[],
  brandIdsRanking: string[][],
  sentiments: (BrandsSentiment | undefined)[],
  workflowId: string
) {
  'use step';

  const enrichedResponses = responses.map((response, index) => {
    const enrichedSources = response.sources.map((originalSource) => {
      const enrichedSource = sources.find(
        (s) => s.cleanUrl === originalSource.cleanUrl || s.rawUrl === originalSource.url
      );
      return enrichedSource
        ? { ...enrichedSource, isCited: originalSource.isCited }
        : originalSource;
    });

    return {
      text: response.text,
      brand_ids_ranking: brandIdsRanking[index],
      sentiment: sentiments[index] ?? null,
      chatbot_id: response.chatbotId,
      model_id: response.modelId,
      prompt_id: promptId,
      project_id: projectId,
      workflow_id: workflowId,
      run_id: null,
      enrichedSources,
    };
  });

  const insertedRows = await insertPromptResponseRows(
    enrichedResponses.map(({ enrichedSources: _, ...row }) => row)
  );

  // Insert into the normalized sources table
  const sourceRowInputs = insertedRows.flatMap((row, index) =>
    enrichedResponses[index].enrichedSources.map((source, position) => ({
      project_id: row.project_id,
      prompt_id: row.prompt_id,
      prompt_response_id: row.id,
      is_cited: source.isCited,
      position,
      clean_url: source.cleanUrl,
      url: source.url,
      hostname: source.hostname,
      raw_url: source.rawUrl ?? null,
      title: source.title ?? null,
      description: source.description ?? null,
      headings: source.headings ?? null,
      brand_ids_ranking: source.brandIdsRanking ?? [],
    }))
  );
  if (sourceRowInputs.length) {
    await insertSourceRows(sourceRowInputs);
  }
}

export async function isProjectPaused(projectId: string): Promise<boolean> {
  'use step';
  const project = await getProjectRowWithId(projectId);
  return project?.is_paused ?? true;
}

export async function updateProjectWithPromptsUpdatedAt(projectId: string, datetimeISO: string) {
  'use step';
  await updateProjectRow(projectId, { prompts_updated_at: datetimeISO });
}
