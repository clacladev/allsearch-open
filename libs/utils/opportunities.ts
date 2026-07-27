import { OpportunityType } from '@/libs/utils/project-analysis/types';

export const OPPORTUNITY_TYPE_NAME: Record<OpportunityType, string> = {
  ProjectSourceNotCitedOpportunity: 'Improve content',
  ProjectSourceNeedsImprovementOpportunity: 'Improve content',
  ProjectSourceNotFoundOpportunity: 'Create content',
  ProjectSourceNotConsistentlyFoundOpportunity: 'Improve content',
  UgcSourceNeedsImprovementOpportunity: 'Engage',
};

export const OPPORTUNITY_TYPE_TITLE: Record<OpportunityType, string> = {
  ProjectSourceNotCitedOpportunity: 'Get your content cited',
  ProjectSourceNeedsImprovementOpportunity: 'Outrank your competitors',
  ProjectSourceNotFoundOpportunity: 'Get discovered by AI',
  ProjectSourceNotConsistentlyFoundOpportunity: 'Get cited more consistently',
  UgcSourceNeedsImprovementOpportunity: 'Leverage brand mentions',
};

export const OPPORTUNITY_TYPE_DESCRIPTION: Record<string, string> = {
  ProjectSourceNeedsImprovementOpportunity:
    'Your content is cited in AI responses, but competitors are ranking higher. Improving this content could help you move up in the results.',
  ProjectSourceNotCitedOpportunity:
    'Your content has been found by AI models but is not being cited in the answers. Optimizing it could earn you a citation.',
  ProjectSourceNotFoundOpportunity:
    'No content from your project was found for this prompt. Creating targeted content could help you appear in the results.',
  ProjectSourceNotConsistentlyFoundOpportunity:
    'Your content appears in AI responses for this prompt, but not consistently. Improving this content could help you appear in more answers.',
  UgcSourceNeedsImprovementOpportunity:
    'A user-generated content source mentions your brand. Engaging with this content could improve your ranking in AI responses.',
};

export const OPPORTUNITY_TYPE_SHORT_DESCRIPTION: Record<string, string> = {
  ProjectSourceNeedsImprovementOpportunity:
    'Your content is cited, but you can rank higher in the answers',
  ProjectSourceNotCitedOpportunity:
    "Your content has been found, but it's not cited in the answers",
  ProjectSourceNotFoundOpportunity: 'No content from your project found for this prompt',
  ProjectSourceNotConsistentlyFoundOpportunity:
    'Your content appears for this prompt, but not consistently',
  UgcSourceNeedsImprovementOpportunity:
    'You should engage in this UGC to rank higher in the answers',
};
