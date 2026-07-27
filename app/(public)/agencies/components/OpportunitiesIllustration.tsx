import { OpportunityType } from '@/libs/utils/project-analysis/types';
import {
  ActionBadge,
  DifficultyBadge,
  PriorityScoreBadge,
} from '@/app/(private)/project/[projectId]/opportunities/components/Badges';
import { OPPORTUNITY_TYPE_SHORT_DESCRIPTION } from '@/libs/utils/opportunities';

type OpportunityIllustrationRow = {
  type: OpportunityType;
  prompt: string;
  priority: number;
};

const OPPORTUNITIES: OpportunityIllustrationRow[] = [
  {
    type: 'ProjectSourceNotFoundOpportunity',
    prompt: 'Prompt: Best luxury branded residences for sale in Miami',
    priority: 200,
  },
  {
    type: 'ProjectSourceNeedsImprovementOpportunity',
    prompt: 'Content: fancyhotel.com/us/a/best-luxury-residences-in-miami',
    priority: 150,
  },
  {
    type: 'ProjectSourceNotCitedOpportunity',
    prompt: 'Content: fivestar.com/where-should-i-go-on-holiday-in-2026',
    priority: 100,
  },
  {
    type: 'UgcSourceNeedsImprovementOpportunity',
    prompt: 'Source: reddit.com/r/Hotels/comments/1lqk1mg',
    priority: 50,
  },
];

const ECOMMERCE_OPPORTUNITIES: OpportunityIllustrationRow[] = [
  {
    type: 'ProjectSourceNotFoundOpportunity',
    prompt: 'Prompt: Best running shoes for flat feet 2026',
    priority: 200,
  },
  {
    type: 'ProjectSourceNeedsImprovementOpportunity',
    prompt: 'Content: strideathlete.com/guides/trail-running-shoes-beginners',
    priority: 150,
  },
  {
    type: 'ProjectSourceNotCitedOpportunity',
    prompt: 'Content: runnersworld.com/gear/best-gps-watches-runners',
    priority: 100,
  },
  {
    type: 'UgcSourceNeedsImprovementOpportunity',
    prompt: 'Source: reddit.com/r/running/comments/9za1bc2',
    priority: 50,
  },
];

const ENGAGEMENT_ONLY_OPPORTUNITIES: OpportunityIllustrationRow[] = [
  {
    type: 'UgcSourceNeedsImprovementOpportunity',
    prompt: 'Source: reddit.com/r/travel/comments/2ab3cd4',
    priority: 150,
  },
  {
    type: 'UgcSourceNeedsImprovementOpportunity',
    prompt: 'Source: tripadvisor.com/ShowTopic-g60763-i5-k15234567',
    priority: 100,
  },
  {
    type: 'UgcSourceNeedsImprovementOpportunity',
    prompt: 'Source: reddit.com/r/solotravel/comments/3ef5gh6',
    priority: 80,
  },
  {
    type: 'UgcSourceNeedsImprovementOpportunity',
    prompt: 'Source: lonelyplanet.com/thorntree/forums/europe/italy/rome-tips',
    priority: 60,
  },
];

export const OpportunitiesIllustration = ({
  variant,
}: {
  variant: 'default' | 'engagement-only' | 'ecommerce';
}) => (
  <div className="bg-primary ring-secondary overflow-hidden rounded-2xl shadow-xs ring-1">
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-secondary/30 border-secondary border-b">
          <tr>
            <th className="text-tertiary px-4 py-2 text-xs font-medium">Type</th>
            <th className="text-tertiary px-2 py-2 text-xs font-medium">Description</th>
            <th className="text-tertiary px-2 py-2 text-xs font-medium">Priority</th>
            <th className="text-tertiary px-4 py-2 text-xs font-medium">Difficulty</th>
          </tr>
        </thead>
        <tbody>
          {(variant === 'engagement-only'
            ? ENGAGEMENT_ONLY_OPPORTUNITIES
            : variant === 'ecommerce'
              ? ECOMMERCE_OPPORTUNITIES
              : OPPORTUNITIES
          ).map((row) => (
            <tr key={row.prompt} className="border-secondary border-b last:border-b-0">
              <td className="px-4 py-2.5">
                <ActionBadge opportunityType={row.type} />
              </td>
              <td className="px-2 py-2.5">
                <div className="max-w-2xl">
                  <p className="text-primary truncate text-xs font-medium">
                    {OPPORTUNITY_TYPE_SHORT_DESCRIPTION[row.type]}
                  </p>
                  <p className="text-tertiary truncate text-xs">{row.prompt}</p>
                </div>
              </td>
              <td className="px-2 py-2.5 whitespace-nowrap">
                <PriorityScoreBadge priorityScore={row.priority} />
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap">
                <DifficultyBadge opportunityType={row.type} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
