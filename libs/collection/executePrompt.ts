import { getPromptResponseWithChatGPT } from '@/libs/ai/projectPrompt/getPromptResponseWithChatGPT';
import { getPromptResponseWithGoogleAIMode } from '@/libs/ai/projectPrompt/getPromptResponseWithGoogleAIMode';
import { getPromptResponseWithPerplexity } from '@/libs/ai/projectPrompt/getPromptResponseWithPerplexity';
import { analyzeResponseSentiment } from '@/libs/ai/sentimentAnalysis';
import { getEffectiveEnabledChatbotIds } from '@/libs/database/Settings/queries';
import { CHATBOT_PROVIDER, ChatbotId } from '@/libs/database/shared/ChatbotId';
import { ProcessPromptResponse } from './types';
import { getSourcesFromResponse } from '@/libs/ai/responseSources';
import { insertPromptResponseRows } from '@/libs/database/PromptResponses/queries';
import { insertSourceRows } from '@/libs/database/Sources/queries';
import { getProjectRowWithId } from '@/libs/database/Projects/queries';
import { getActiveCompetitorRowsWithProjectId } from '@/libs/database/Competitors/queries';
import { ProjectRow } from '@/libs/database/Projects/types';
import { CompetitorRow } from '@/libs/database/Competitors/types';
import { BrandsSentiment } from '@/libs/database/PromptResponses/types';
import { SourceItem } from '@/libs/database/Sources/types';
import { getBrandIdsRankingsInText } from '@/libs/utils/brandIdsRanking';
import { analysePromptResponseSources } from './analyseSources';
import { callAiWithRetry } from './callAi';

export type PromptChatbotOutcome = {
  chatbotId: ChatbotId;
  isCompleted: boolean;
  attempts: number;
  error?: string;
};

export type ExecutePromptInput = {
  promptId: string;
  promptName: string;
  projectId: string;
  /** Explicit list, in the order the Chatbots should be attempted. Omitted only by the legacy
   *  DevKit wrappers, which fall back to `getEffectiveEnabledChatbotIds()`. Retrying a Run passes
   *  only the Chatbots whose items failed, so already-good Prompt Responses are not duplicated. */
  chatbotIds?: ChatbotId[];
  /** `prompt_responses.workflow_id` is still NOT NULL until issue 11 drops it. The Collection Run
   *  passes its own run id here as well as in `runId`; the DevKit wrappers pass their legacy
   *  `fetchDailyPromptsWorkflow-<projectId>-<date>` string and leave `runId` undefined. */
  workflowId: string;
  runId?: string;
};

/** Executes one Prompt against the given Chatbots and persists the resulting Prompt Responses and
 *  Sources in a single batched insert. Returns one outcome per requested Chatbot. Never throws for
 *  a per-Chatbot failure; throws only if persistence itself fails. */
export async function executePrompt(input: ExecutePromptInput): Promise<PromptChatbotOutcome[]> {
  const { promptId, promptName, projectId, workflowId, runId } = input;
  const { project, competitors } = await getProjectInfo(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  const chatbotIds = input.chatbotIds ?? (await getEffectiveEnabledChatbotIds());

  // Get responses from every requested chatbot (issue 09: a disabled chatbot must not be called)
  const chatbotCallers: Record<ChatbotId, () => Promise<ProcessPromptResponse>> = {
    [ChatbotId.ChatGPT]: () => processPromptForChatGPT(promptName, project.target_location),
    [ChatbotId.GoogleAIOverview]: () => processPromptForGoogleAIMode(promptName),
    [ChatbotId.Perplexity]: () => processPromptForPerplexity(promptName),
  };

  const callResults = await Promise.all(
    chatbotIds.map((chatbotId) =>
      callAiWithRetry(CHATBOT_PROVIDER[chatbotId], chatbotCallers[chatbotId])
    )
  );

  // `outcomes` stays in chatbotIds order. `responses` is the completed subset, in the same
  // relative order, so it can be handed to the analysis functions and to storePromptResponses
  // exactly as `processPromptForAllChatbots` did — do not turn this into a per-chatbot record.
  const outcomes: PromptChatbotOutcome[] = callResults.map((result, index) => ({
    chatbotId: chatbotIds[index],
    isCompleted: result.isCompleted,
    attempts: result.attempts,
    error: result.isCompleted ? undefined : result.error.message,
  }));
  const responses = callResults.flatMap((result) => (result.isCompleted ? [result.value] : []));

  // Every requested Chatbot failed — nothing to analyse or persist. Skipping this avoids
  // `insertPromptResponseRows`/`insertSourceRows` being called with an empty array, and the three
  // analyses running for nothing.
  if (!responses.length) return outcomes;

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
    workflowId,
    runId
  );

  return outcomes;
}

async function getProjectInfo(projectId: string) {
  return {
    project: await getProjectRowWithId(projectId),
    competitors: await getActiveCompetitorRowsWithProjectId(projectId),
  };
}

async function processPromptForChatGPT(
  promptName: string,
  targetLocation: string | null
): Promise<ProcessPromptResponse> {
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
  return responses.map((response) =>
    getBrandIdsRankingsInText(response.text, project, competitors)
  );
}

async function analysePromptResponsesSentiment(
  responses: ProcessPromptResponse[],
  project: ProjectRow,
  competitors: CompetitorRow[]
): Promise<(BrandsSentiment | undefined)[]> {
  const brands = [
    { id: project.id, name: project.name },
    ...competitors
      .filter((c): c is CompetitorRow & { name: string } => !!c.name)
      .map((c) => ({ id: c.id, name: c.name })),
  ];

  const results = await Promise.all(
    responses.map((response) =>
      callAiWithRetry('google', () => analyzeResponseSentiment(response.text, brands))
    )
  );

  return results.map((result) => {
    if (!result.isCompleted) {
      console.error('Error analyzing sentiment:', result.error);
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
  workflowId: string,
  runId?: string
) {
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
      run_id: runId ?? null,
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
