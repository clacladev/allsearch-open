import { Metadata } from 'next';
import { getSEOTags } from '@/libs/seo';
import { config } from '@/config';
import { HomepageCtaBlock } from '../(index)/Buttons';
import { TextHighlight } from '../components/TextUtils';
import { TestimonialsCarousel } from '../(index)/Testimonials';
import { FeaturedIcon } from '@/components/foundations/featured-icon/featured-icon';
import { RefreshCw03, FileCheck02, Database01 } from '@untitledui/icons';
import {
  ExamplePromptResponsePreviewIllustrationCheperModel,
  ExamplePromptResponsePreviewIllustrationRealModel,
} from './components/PromptResponsePreviewIllustration';
import { OpportunitiesIllustration } from './components/OpportunitiesIllustration';
import { ProjectReportIllustrationLandingPage } from './components/ProjectReportIllustration';
import { ExportActionsIllustration } from './components/ExportActionsIllustration';
import { ScaledContent } from './components/ScaledContent';

export const metadata: Metadata = getSEOTags({
  title: `${config.appName} for Agencies | AI Visibility Tracking & AEO Reporting at Scale`,
  description:
    'Track AI brand visibility for all your clients in one place. Reliable LLM data, white-label reports, and AEO content strategy built for agencies.',
  keywords: [
    'AI SEO agency',
    'agency AI search monitoring',
    'AI visibility for agencies',
    'AEO for marketing agencies',
    'AI search client reporting',
    ...config.keywords,
  ],
  ogImageTitle:
    'The Most Reliable AI Visibility Data for Agencies from Tracking to Content',
});

type FeatureSection = {
  tag?: string;
  title: string;
  description: string;
  illustration: () => React.ReactNode;
};

const FEATURE_SECTIONS: FeatureSection[] = [
  {
    tag: 'AEO Content Strategy',
    title: 'A Content Strategy That Moves With Your Data',
    description:
      'Most content strategies are built once and left to age. Ours updates dynamically with your AI visibility data, adding new content opportunities day after day.',
    illustration: () => <OpportunitiesIllustration variant="default" />,
  },
  {
    tag: 'White Label Reporting',
    title: 'Client-Ready Reports Without the Manual Work',
    description:
      'Stop spending hours manually stitching together data, screenshots and graphs. Generate professional, fully branded AEO performance reports.',
    illustration: () => <ProjectReportIllustrationLandingPage />,
  },
  {
    tag: 'Export & Import Data',
    title: 'Scale Your Agency Operations',
    description:
      'Eliminate manual data entry by importing and exporting metrics directly into your workflow. Manage your portfolio with ease using multiple accounts set up.',
    illustration: () => <ExportActionsIllustration />,
  },
];

const FINAL_STATEMENT_SECTION: FeatureSection = {
  title: 'Ready to Scale Your Agency’s AI Visibility Operations?',
  description:
    'Stop the manual work. From LLM tracking to white-label reports, manage all your client accounts with high-accuracy data in one workspace.',
  illustration: () => <></>,
};

const Hero = () => {
  return (
    <>
      <section className="bg-secondary relative -mt-20 overflow-hidden pt-20">
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
              The <TextHighlight>Most Reliable</TextHighlight> AI Visibility Data for{' '}
              <TextHighlight>Agencies</TextHighlight> from Tracking to Content
            </h1>
            <p className="text-tertiary mt-4 max-w-3xl text-lg md:mt-6 md:text-xl">
              Monitor brand mentions across AI platforms with everything your agency needs to build
              a winning AI SEO content strategy for your clients.
            </p>
            <HomepageCtaBlock className="mt-8 md:mt-12" />
          </div>
        </div>
      </section>

      <section className="bg-secondary overflow-hidden pb-16 md:pb-24" id="testimonials">
        <div className="max-w-container mx-auto px-4 md:px-8">
          <h2 className="text-display-sm text-primary md:text-display-md text-center font-semibold">
            Agency owners and Experts that trust us
          </h2>
          <TestimonialsCarousel />
        </div>
      </section>
    </>
  );
};

const QualityBlock = () => (
  <section className="bg-secondary py-16 md:py-24">
    <div className="max-w-container mx-auto w-full px-4 md:px-8">
      <div className="flex flex-col items-center gap-12 md:gap-16">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
          <span className="text-brand-secondary md:text-md text-sm font-semibold">Quality</span>
          <h2 className="text-display-sm text-primary md:text-display-md mt-3 font-semibold">
            How We Have the Most Reliable AI Visibility Data
          </h2>
          <p className="text-tertiary mt-4 text-lg md:mt-5 md:text-xl">
            Most AI visibility tools use cheap LLM models to cut costs. This means the sources you
            see aren&apos;t what your users actually experience. We automatically sync with the main
            model each LLM uses for the most reliable data.
          </p>
        </div>

        <div className="flex w-full justify-center py-8">
          <div className="grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            <div className="flex justify-center text-left">
              <div className="flex w-full max-w-4xl flex-col gap-3">
                <p className="text-brand-secondary text-center text-sm font-semibold md:text-sm">
                  <span className="font-bold">Other tools:</span> Limited Simulated Responses
                </p>
                <ScaledContent scale={0.6}>
                  <ExamplePromptResponsePreviewIllustrationCheperModel />
                </ScaledContent>
              </div>
            </div>
            <div className="flex justify-center text-left">
              <div className="flex w-full max-w-4xl flex-col gap-3">
                <p className="text-brand-secondary text-center text-sm font-semibold md:text-sm">
                  <span className="font-bold">AllSearch:</span> Full Reality Responses
                </p>
                <ScaledContent scale={0.6}>
                  <ExamplePromptResponsePreviewIllustrationRealModel />
                </ScaledContent>
              </div>
            </div>
          </div>
        </div>

        <HomepageCtaBlock />
      </div>
    </div>
  </section>
);

const WorkflowBlock = () => {
  const features = [
    {
      icon: RefreshCw03,
      title: 'AEO content strategy',
      description: 'Content that updates with your AI data over time',
    },
    {
      icon: FileCheck02,
      title: 'White Label Reporting',
      description: 'Branded white label reports for every client',
    },
    {
      icon: Database01,
      title: 'Export & Import Data',
      description: 'Seamless data in and out & multiple accounts',
    },
  ];

  return (
    <section className="bg-secondary py-16 md:py-24">
      <div className="max-w-container mx-auto w-full px-4 md:px-8">
        <div className="flex flex-col items-center gap-12 md:gap-16">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
            <h2 className="text-display-sm text-primary md:text-display-md mt-3 font-semibold">
              Workflow designed for Agencies
            </h2>
          </div>

          <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-3 md:gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="border-secondary bg-primary/60 flex h-full flex-col items-start rounded-2xl border p-6 text-start shadow-xs"
              >
                <FeaturedIcon icon={feature.icon} size="md" color="brand" theme="dark" />
                <h3 className="text-primary mt-5 text-lg font-semibold">{feature.title}</h3>
                <p className="text-tertiary mt-2 text-base">{feature.description}</p>
              </div>
            ))}
          </div>

          <HomepageCtaBlock />
        </div>
      </div>
    </section>
  );
};

const FeaturesSections = () => {
  return (
    <>
      <section className="bg-primary flex flex-col gap-12 overflow-hidden py-16 sm:gap-16 md:gap-20 md:py-24 lg:gap-24">
        <div className="max-w-container mx-auto flex w-full flex-col gap-18 px-4 sm:gap-16 md:gap-20 md:px-8 lg:gap-24">
          {FEATURE_SECTIONS.map((section) => {
            return (
              <div
                key={section.title}
                className="flex flex-col items-center gap-10 text-center md:gap-12 lg:gap-16"
              >
                <div className="flex w-full flex-col items-center self-center md:max-w-3xl">
                  {section.tag && (
                    <span className="text-brand-secondary md:text-md text-sm font-semibold">
                      {section.tag}
                    </span>
                  )}
                  <h2 className="text-display-sm text-primary md:text-display-md mt-3 font-semibold md:max-w-xl">
                    {section.title}
                  </h2>
                  <p className="text-tertiary mt-4 text-lg md:mt-5 md:text-xl">
                    {section.description}
                  </p>
                </div>

                <div className="relative w-full max-w-4xl">{section.illustration()}</div>
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

export default function AgenciesPage() {
  return (
    <div className="bg-primary">
      <Hero />
      <QualityBlock />
      <WorkflowBlock />
      <FeaturesSections />
    </div>
  );
}
