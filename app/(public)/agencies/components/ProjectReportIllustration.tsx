import { Calendar, Globe01, MessageCircle01 } from '@untitledui/icons';
import { ScaledContent } from './ScaledContent';
import { VisibilityScoreIllustration } from './VisibilityScoreIllustration';
import { BrandVisibilityIllustration } from './BrandVisibilityIllustration';
import { PromptsIllustration } from './PromptsIllustration';
import { SourcesIllustration } from './SourcesIllustration';

type IllustrationVariant = 'default' | 'ecommerce';

const PROJECT_HEADERS: Record<
  IllustrationVariant,
  { initials: string; name: string; domain: string }
> = {
  default: { initials: 'FH', name: 'FancyHotel Monthly Report', domain: 'fancyhotel.com' },
  ecommerce: { initials: 'SA', name: 'StrideAthlete Monthly Report', domain: 'strideathlete.com' },
};

const ProjectHeader = ({ variant = 'default' }: { variant?: IllustrationVariant }) => {
  const header = PROJECT_HEADERS[variant];
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-fg-brand-primary flex size-9 items-center justify-center rounded-lg">
          <span className="text-sm font-bold text-white">{header.initials}</span>
        </div>
        <div className="flex flex-col">
          <h2 className="text-primary text-sm font-semibold">{header.name}</h2>
          <div className="text-tertiary flex items-center gap-1 text-xs">
            <Globe01 className="size-3" />
            <span>{header.domain}</span>
          </div>
        </div>
      </div>
      <div className="border-secondary bg-primary text-secondary flex h-8 items-center gap-2 rounded-lg border px-3 text-xs font-medium shadow-xs">
        <Calendar className="text-quaternary size-3.5" />
        <span>1 Jan – 31 Jan 2026</span>
      </div>
    </div>
  );
};

export const ProjectReportIllustration = ({
  variant = 'default',
}: {
  variant?: IllustrationVariant;
}) => (
  <div className="bg-primary rounded-2xl p-5 shadow-xs">
    <div className="flex flex-col gap-4">
      {/* Project header */}
      <ProjectHeader variant={variant} />

      {/* Visibility score + Brand visibility side by side */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="grow">
          <VisibilityScoreIllustration variant={variant} />
        </div>
        <div className="md:w-1/3 md:min-w-48">
          <BrandVisibilityIllustration variant={variant} />
        </div>
      </div>

      {/* Prompts table */}
      <div className="flex flex-col gap-3">
        <div className="mt-2 flex items-center gap-2">
          <MessageCircle01 className="text-tertiary size-4" />
          <span className="text-primary text-sm font-semibold">Prompts Summary</span>
        </div>
        <PromptsIllustration variant={variant} />
      </div>

      {/* Sources table */}
      <div className="flex flex-col gap-3">
        <div className="mt-2 flex items-center gap-2">
          <Globe01 className="text-tertiary size-4" />
          <span className="text-primary text-sm font-semibold">Top Sources</span>
        </div>
        <SourcesIllustration variant={variant} />
      </div>
    </div>
  </div>
);

export const ProjectReportIllustrationLandingPage = () => (
  <ScaledContent scale={0.6} className="ring-secondary mx-auto max-w-xl rounded-2xl ring-1">
    <ProjectReportIllustration />
  </ScaledContent>
);
