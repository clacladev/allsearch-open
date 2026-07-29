import { CompetitorRow } from '@/libs/database/Competitors/types';
import { PromptResponseSummaryRow } from '@/libs/database/PromptResponses/types';

export type PromptAnalysis = {
  count: number;
  projectIdRank: number;
  brandIdsRanking: string[];
  projectSentimentAvg: number | undefined;
};

const EMPTY_PROMPT_ANALYSIS: PromptAnalysis = {
  count: 0,
  projectIdRank: -1,
  brandIdsRanking: [],
  projectSentimentAvg: undefined,
};

export function getPromptsAnalysis(
  promptIds: string[],
  promptResponses: PromptResponseSummaryRow[],
  projectId: string,
  competitors: CompetitorRow[]
): Record<string, PromptAnalysis> {
  // Group prompt responses by prompt_id
  const responsesByPromptId = new Map<string, PromptResponseSummaryRow[]>();
  promptIds.forEach((id) => responsesByPromptId.set(id, []));
  promptResponses.forEach((response) =>
    responsesByPromptId.get(response.prompt_id)?.push(response)
  );

  const result: Record<string, PromptAnalysis> = {};
  promptIds.forEach((promptId) => {
    const responses = responsesByPromptId.get(promptId) ?? [];
    if (!responses.length) {
      result[promptId] = EMPTY_PROMPT_ANALYSIS;
      return;
    }

    // Track ranking sums per brand across all responses
    const allBrandIds = [projectId, ...competitors.map((c) => c.id)];
    const penaltyPosition = competitors.length;
    const neverAppearedScore = penaltyPosition * responses.length;
    const brandRankingSums = new Map<string, number>();

    responses.forEach((response) => {
      allBrandIds.forEach((brandId) => {
        const index = response.brand_ids_ranking.indexOf(brandId);
        const position = index !== -1 ? index : penaltyPosition;
        brandRankingSums.set(brandId, (brandRankingSums.get(brandId) || 0) + position);
      });
    });

    // Sort brands by total ranking sum (lower is better)
    const brandIdsRanking = allBrandIds
      .filter((brandId) => brandRankingSums.get(brandId) !== neverAppearedScore)
      .map((brandId) => ({ brandId, sum: brandRankingSums.get(brandId) || 0 }))
      .sort((a, b) => a.sum - b.sum)
      .map((item) => item.brandId);

    // Compute average project sentiment
    const sentimentValues: number[] = [];
    responses.forEach((r) => {
      const score = r.sentiment?.[projectId];
      if (score !== undefined) sentimentValues.push(score);
    });
    const projectSentimentAvg = sentimentValues.length
      ? sentimentValues.reduce((sum, v) => sum + v, 0) / sentimentValues.length
      : undefined;

    result[promptId] = {
      count: responses.length,
      projectIdRank: brandIdsRanking.indexOf(projectId),
      brandIdsRanking: brandIdsRanking,
      projectSentimentAvg,
    };
  });

  return result;
}
