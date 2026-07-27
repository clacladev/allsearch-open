import { getSEOTags } from '@/libs/seo';
import { Metadata } from 'next';
import { config } from '@/config';
import { DemoVideoModal } from '../../(public)/components/DemoVideoModal';
import { HomepageCtaBlock, CtaButton } from '../../(public)/(index)/Buttons';
import { LandingPageFooterCta } from '../../(public)/(index)/LandingPageFooterCta';
import PublicShell from '@/app/(public)/components/PublicShell';
import { MdBreak, TextBgHighlight, TextHighlight } from '@/app/(public)/components/TextUtils';
import { FeaturedIcon } from '@/components/foundations/featured-icon/featured-icon';
import {
  ChartBreakoutSquare,
  SearchLg,
  FileCheck02,
  Monitor01,
  Globe01,
  ZapFast,
} from '@untitledui/icons';
import { CHATBOT_DISPLAY_LABELS, SUPPORTED_CHATBOTS_IDS } from '@/libs/database/shared/ChatbotId';
import {
  ChatGPTIcon,
  GoogleAIIcon,
  PerplexityIcon,
} from '@/app/(private)/project/[projectId]/components/ChatbotLogoImage';

export const metadata: Metadata = getSEOTags({
  title: `${config.appName} - AI Visibility Tracker | Monitor Brand Citations Across AI Engines`,
  description:
    'Track your brand visibility across ChatGPT, Google AI, Perplexity and more. Monitor AI citations, analyze competitors, and get an actionable AEO content strategy.',
  ogImageTitle: "Track Your Brand's AI Visibility Across Every Answer Engine.",
  keywords: [
    'AI visibility tracker',
    'AI visibility tracking',
    'AI brand visibility',
    'LLM visibility',
    'AI citation tracking',
    'AI answer engine optimization',
    'AEO tracker',
    'ChatGPT brand monitoring',
    'AI search visibility',
    'brand mentions AI',
    ...config.keywords,
  ],
  canonicalUrlRelative: '/lp-ai-visibility',
});

const CHATBOT_ICON_COMPONENTS = {
  chatgpt: ChatGPTIcon,
  'google-ai-overview': GoogleAIIcon,
  perplexity: PerplexityIcon,
} as const;

const METRICS = [
  { value: `${SUPPORTED_CHATBOTS_IDS.length}+`, label: 'AI answer engines tracked in real time' },
  { value: '30%', label: 'Average increase in AI brand citations within 60 days' },
  { value: '10\u00d7', label: 'Faster content strategy vs. manual monitoring' },
];

const FEATURES = [
  {
    icon: ChartBreakoutSquare,
    title: 'AI Visibility Rank Tracker',
    description:
      'Monitor exactly where and how often your brand is mentioned across ChatGPT, Google AI, Perplexity, and more.',
  },
  {
    icon: SearchLg,
    title: 'Competitor Visibility Analysis',
    description:
      'See how your AI visibility stacks up against competitors. Spot the gaps in your citations and discover which queries your rivals are winning, and why.',
  },
  {
    icon: FileCheck02,
    title: 'Content Opportunities & Priorities',
    description:
      'See exactly what to create, what existing content to optimise, and where to engage, each scored by priority and difficulty so you always know what to do next.',
  },
  {
    icon: Monitor01,
    title: 'AI Brand Visibility Dashboard',
    description:
      'One clean dashboard for all your clients or brands. Track AI visibility trends and citation frequency, with white-label reporting built in for agencies.',
  },
  {
    icon: Globe01,
    title: 'Source & Citation Tracking',
    description:
      'See which URLs and domains are being cited by AI engines for your tracked prompts. Understand what sources drive visibility for you and your competitors, and act on the gaps.',
  },
  {
    icon: ZapFast,
    title: 'AEO Optimisation Playbook',
    description:
      'Turn visibility data into action. Get a prioritised list of AEO moves: content to write, pages to optimise, communities to engage. All ranked by impact so nothing is guesswork.',
  },
];

const Hero = () => {
  return (
    <div className="bg-secondary_alt relative -mt-20 overflow-hidden pt-20">
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

      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="max-w-container mx-auto w-full px-4 md:px-8">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            {/* Badge */}
            <div className="bg-brand-secondary mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5">
              <span className="bg-brand-solid size-2 rounded-full" />
              <span className="text-fg-brand-primary text-sm font-medium dark:text-white">
                The #1 AI Visibility Tracker for Marketers
              </span>
            </div>

            <h1 className="text-display-md text-primary md:text-display-lg lg:text-display-xl font-semibold">
              Track Your Brand&apos;s <TextHighlight>AI Visibility</TextHighlight>
              <MdBreak /> Across Every <TextHighlight>Answer Engine</TextHighlight>.
            </h1>

            <p className="text-tertiary mt-4 max-w-3xl text-lg md:mt-6 md:text-xl">
              The <TextBgHighlight>AI visibility tracking tool</TextBgHighlight> that shows you
              which content to create, what to optimise, and where to engage so you can grow your{' '}
              <TextBgHighlight>LLM visibility</TextBgHighlight> across every major AI answer engine.
            </p>

            <div className="mt-8 flex w-full flex-col items-center gap-4 sm:w-auto md:mt-12">
              <div className="flex w-full flex-col-reverse items-stretch gap-3 sm:w-auto sm:flex-row sm:items-start">
                <CtaButton />
                <button
                  id="demo-btn"
                  type="button"
                  className="bg-primary text-secondary shadow-xs-skeuomorphic ring-primary hover:bg-primary_hover hover:text-secondary_hover text-md inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-4.5 py-3 font-semibold whitespace-nowrap ring-1 transition duration-100 ease-linear ring-inset"
                >
                  See Live Demo
                </button>
              </div>
              <div className="text-quaternary mx-0.5 text-xs">No Card Required</div>
            </div>

            <div className="mt-10 flex flex-col items-center gap-3 md:mt-14">
              <p className="text-quaternary text-sm">Tracks AI visibility across</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUPPORTED_CHATBOTS_IDS.map((chatbotId) => {
                  const IconComponent = CHATBOT_ICON_COMPONENTS[chatbotId];
                  return (
                    <span
                      key={chatbotId}
                      className="border-secondary bg-primary text-secondary flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium shadow-xs"
                    >
                      <IconComponent className="size-4" />
                      {CHATBOT_DISPLAY_LABELS[chatbotId]}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const MetricsBar = () => {
  return (
    <section className="bg-primary py-16 md:py-24">
      <div className="max-w-container mx-auto px-4 md:px-8">
        <dl className="bg-brand-section grid grid-cols-1 gap-8 rounded-2xl p-10 md:grid-cols-3 md:p-16">
          {METRICS.map((metric) => (
            <div key={metric.label} className="flex flex-col items-center text-center">
              <dd className="text-display-lg text-primary_on-brand md:text-display-xl font-semibold">
                {metric.value}
              </dd>
              <dt className="text-tertiary_on-brand mt-3 text-lg font-semibold">{metric.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};

const FeaturesGrid = () => {
  return (
    <section className="bg-primary py-16 md:py-24">
      <div className="max-w-container mx-auto w-full px-4 md:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <span className="text-brand-secondary md:text-md text-sm font-semibold">
            What You Get
          </span>
          <h2 className="text-display-sm text-primary md:text-display-md mt-3 font-semibold">
            Everything your team needs to win AI visibility.
          </h2>
        </div>

        <div className="mx-auto mt-12 grid w-full max-w-5xl grid-cols-1 gap-6 md:mt-16 md:grid-cols-2 md:gap-8">
          {FEATURES.map((feature) => (
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

        <div className="mt-12 flex justify-center md:mt-16">
          <HomepageCtaBlock />
        </div>
      </div>
    </section>
  );
};

const FooterCta = () => (
  <LandingPageFooterCta
    title="Start Tracking Your AI Visibility Today"
    description="The most powerful AI visibility tracking tool to grow brand citations. Stop flying blind in the AI era."
  />
);

export default function LandingPage() {
  return (
    <PublicShell stripLinksFromHeaderAndFooter>
      <div className="bg-primary">
        <Hero />
        <MetricsBar />
        <FeaturesGrid />
        <FooterCta />
      </div>

      <DemoVideoModal />
    </PublicShell>
  );
}
