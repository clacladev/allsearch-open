import { Metadata } from 'next';
import { getSEOTags } from '@/libs/seo';
import { config } from '@/config';
import { HomepageCtaBlock } from '../(index)/Buttons';
import { cx } from '@/utils/cx';

import { HeroIllustration } from './components/HeroIllustration';
import { OpportunitiesIllustration } from '../agencies/components/OpportunitiesIllustration';
import { PromptResponsesIllustration } from './components/PromptResponsesIllustration';
import { SourceHeadingsIllustration } from './components/SourceHeadingsIllustration';
import { MdBreak, TextHighlight } from '../components/TextUtils';

export const metadata: Metadata = getSEOTags({
  title: `${config.appName} - AEO Content Strategy`,
  description:
    'AEO Content Strategy built around your AI content gaps. Discover what to create, what to optimize, and where to engage to improve AI visibility.',
  keywords: [
    'AEO content strategy',
    'AI content gaps',
    'AI visibility strategy',
    ...config.keywords,
  ],
  ogImageTitle: 'AEO Content Strategy built around Your AI Content Gaps.',
});

type FeatureSection = {
  title: string;
  description: string;
  illustration: () => React.ReactNode;
};

const FEATURE_SECTIONS: FeatureSection[] = [
  {
    title: 'AI Search Content Recommendations',
    description:
      'Content to create, content to optimise, and where to engage online to improve your presence in AI search answers.',
    illustration: () => <OpportunitiesIllustration variant="default" />,
  },
  {
    title: 'Prompt-Level AI Responses and Sources',
    description:
      'For each prompt, track the top AI responses and cited content sources, giving you the key data needed to guide your content strategy.',
    illustration: () => <PromptResponsesIllustration />,
  },
  {
    title: "Competitors' Content Page Structure Insights",
    description:
      'Access the full heading hierarchy of competitor pages to plan stronger content structures based on real AI citations from your target prompts.',
    illustration: () => <SourceHeadingsIllustration />,
  },
];

const FINAL_STATEMENT_SECTION: FeatureSection = {
  title: 'More than Content Strategy: Where to Engage',
  description:
    'From Reddit to niche forums and communities, discover where to engage beyond your website with up-to-date opportunities to boost AI search visibility and citations.',
  illustration: () => <OpportunitiesIllustration variant="engagement-only" />,
};

const Hero = () => {
  return (
    <section className="bg-secondary_alt relative -mt-20 overflow-hidden pt-20">
      <img
        aria-hidden="true"
        loading="lazy"
        src="/index/grid-md-desktop.svg"
        className="pointer-events-none absolute top-0 left-1/2 z-0 hidden max-w-none -translate-x-1/2 md:block dark:brightness-[0.15]"
        alt="Grid pattern background"
      />
      <img
        aria-hidden="true"
        loading="lazy"
        src="/index/grid-md-mobile.svg"
        className="pointer-events-none absolute top-0 left-1/2 z-0 max-w-none -translate-x-1/2 md:hidden dark:brightness-[0.15]"
        alt="Grid pattern background"
      />

      <div className="max-w-container relative mx-auto w-full px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto mb-10 flex w-full max-w-5xl flex-col items-center text-center">
          <h1 className="text-display-md text-primary md:text-display-lg lg:text-display-xl font-semibold">
            <TextHighlight>AEO Content Strategy</TextHighlight> built around
            <MdBreak /> Your AI Content Gaps.
          </h1>
          <p className="text-tertiary mt-4 max-w-3xl text-lg md:mt-6 md:text-xl">
            A content strategy that updates with your AI visibility data over time and tells you
            exactly what to create and what to optimize.
          </p>
          <HomepageCtaBlock className="mt-8 md:mt-12" />
        </div>

        <div className="mx-auto max-w-4xl">
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
};

const FeatureRows = () => {
  return (
    <>
      <section className="bg-primary flex flex-col gap-12 overflow-hidden py-16 sm:gap-16 md:gap-20 md:py-24 lg:gap-24">
        <div className="max-w-container mx-auto flex w-full flex-col gap-18 px-4 sm:gap-16 md:gap-20 md:px-8 lg:gap-24">
          {FEATURE_SECTIONS.map((section, index) => {
            const isReversed = index % 2 === 1;

            return (
              <div
                key={section.title}
                className="grid grid-cols-1 items-center gap-10 md:gap-20 lg:grid-cols-2 lg:gap-24"
              >
                <div className={cx('max-w-xl flex-1 self-center', isReversed && 'lg:order-last')}>
                  <h2 className="text-display-xs text-primary md:text-display-sm font-semibold">
                    {section.title}
                  </h2>
                  <p className="text-tertiary text-md mt-2 md:mt-4 md:text-lg">
                    {section.description}
                  </p>
                </div>

                <div className="relative w-full flex-1">{section.illustration()}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-secondary overflow-hidden py-16 md:py-24">
        <div className="max-w-container mx-auto flex w-full flex-col items-center px-4 md:px-8">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
            <h2 className="text-display-sm text-primary md:text-display-md font-semibold">
              {FINAL_STATEMENT_SECTION.title}
            </h2>
            <p className="text-tertiary mt-4 text-lg md:mt-5 md:text-xl">
              {FINAL_STATEMENT_SECTION.description}
            </p>
            <HomepageCtaBlock className="mt-8 md:mt-10" />
          </div>

          <div className="mt-12 w-full max-w-3xl md:mt-16">
            {FINAL_STATEMENT_SECTION.illustration()}
          </div>
        </div>
      </section>
    </>
  );
};

export default function AEOContentStrategyPage() {
  return (
    <div className="bg-primary">
      <Hero />
      <FeatureRows />
    </div>
  );
}
