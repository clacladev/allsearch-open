import { getSEOTags } from '@/libs/seo';
import { Metadata } from 'next';
import { config } from '@/config';
import { DemoVideoModal } from '../components/DemoVideoModal';
import { HomepageCtaBlock, CtaButton } from '../(index)/Buttons';
import { LandingPageFooterCta } from '../(index)/LandingPageFooterCta';
import { TextHighlight } from '../components/TextUtils';
import { FeaturedIcon } from '@/components/foundations/featured-icon/featured-icon';
import { FaqAccordion, type FaqItem } from '../(index)/FaqAccordion';
import { VisibilityScoreIllustration } from '../agencies/components/VisibilityScoreIllustration';
import { BrandVisibilityIllustration } from '../agencies/components/BrandVisibilityIllustration';
import { OpportunitiesIllustration } from '../agencies/components/OpportunitiesIllustration';
import {
  ChartBreakoutSquare,
  SearchLg,
  FileCheck02,
  Monitor01,
  Globe01,
  ZapFast,
  Eye,
  BarChart11,
  MessageChatCircle,
} from '@untitledui/icons';

export const metadata: Metadata = getSEOTags({
  title: `AI Visibility Tracker Tool | ${config.appName}`,
  description:
    'Analyze your brand positioning in Perplexity, ChatGPT & Gemini. Allsearch tracks AI visibility and identifies content opportunities to optimize your presence.',
  ogImageTitle: 'AI Visibility Tracker Tool',
  keywords: [
    'AI visibility tracker',
    'AI visibility tool',
    'AI visibility score',
    'AI search visibility',
    'AI brand visibility',
    'AI citation tracking',
    'AI competitor analysis',
    'AI content gap analysis',
    'AEO tracker',
    ...config.keywords,
  ],
  canonicalUrlRelative: '/ai-visibility-tracker',
});

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

const FAQS: FaqItem[] = [
  {
    question: 'What is AI visibility?',
    answer:
      'AI visibility is a metric that measures how often and how prominently your brand is mentioned or cited by Large Language Models (LLMs) and AI search engines when users ask relevant questions.',
  },
  {
    question: 'What is an AI Search Visibility Checker?',
    answer:
      'It is a specialized tool that crawls AI responses (like ChatGPT Search or Google AI Overviews) to track brand mentions, sentiment, and the specific sources the AI uses to generate its answers.',
  },
  {
    question: 'What is an AI Visibility Score?',
    answer:
      "A proprietary 0-100 score calculated by Allsearch that weighs your brand's reach, authority, and citation frequency across the entire AI ecosystem.",
  },
  {
    question: 'How to run an AI visibility audit?',
    answer:
      'Simply enter your domain and target keywords into Allsearch. Our engine will simulate queries across all major LLMs to generate a comprehensive report on your current standing and content gaps.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Add or Generate Prompts',
    description:
      'Enter the specific questions your customers ask or generate a comprehensive list of topics and prompts automatically based on your business category.',
  },
  {
    step: '02',
    title: 'Run Multi-LLM Tracking',
    description:
      'Execute your prompts across multiple AI engine simultaneously to capture exactly how and where your brand is being mentioned, recommended, or cited.',
  },
  {
    step: '03',
    title: 'Analyze Results & Competitors',
    description:
      "Compare your visibility against competitors. See your 'Share of Model' score and identify which third-party sources the AI is using to build its answers.",
  },
  {
    step: '04',
    title: 'Identify New Content & Optimization Opportunities',
    description:
      'Get a direct roadmap of which existing pages to optimize and new topics to create to close content gaps and force the AI to cite your brand as the authority.',
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
            <div className="bg-brand-secondary dark:bg-utility-brand-100 mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5">
              <span className="bg-brand-solid size-2 rounded-full" />
              <span className="text-fg-brand-primary text-sm font-medium dark:text-white">
                AI Visibility
              </span>
            </div>

            <h1 className="text-display-md text-primary md:text-display-lg lg:text-display-xl font-semibold">
              AI Visibility <TextHighlight>Tracker Tool</TextHighlight>
            </h1>

            <p className="text-tertiary mt-4 max-w-3xl text-lg md:mt-6 md:text-xl">
              Monitor how your brand and competitors appear in ChatGPT, Google AI Overview, Gemini,
              Perplexity and more with our AI visibility tracking tool.
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
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureHighlights = () => {
  return (
    <section className="bg-primary flex flex-col gap-12 overflow-hidden py-16 sm:gap-16 md:gap-20 md:py-24 lg:gap-24">
      <div className="max-w-container mx-auto flex w-full flex-col gap-24 px-4 sm:gap-24 md:gap-32 md:px-8 lg:gap-40">
        <div className="grid grid-cols-1 gap-10 md:gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="max-w-xl flex-1 self-center">
            <FeaturedIcon icon={Eye} size="lg" color="brand" theme="light" />
            <h2 className="text-display-xs text-primary md:text-display-sm mt-5 font-semibold">
              AI visibility score for your brand
            </h2>
            <p className="text-md text-tertiary mt-2 md:mt-4 md:text-lg">
              Get a clear, single score that tells you how visible your brand is across AI search
              engines. Track it over time and see the impact of every content change you make.
            </p>
          </div>
          <div className="w-full flex-1 self-center">
            <VisibilityScoreIllustration />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 md:gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="max-w-xl flex-1 self-center lg:order-last">
            <FeaturedIcon icon={BarChart11} size="lg" color="brand" theme="light" />
            <h2 className="text-display-xs text-primary md:text-display-sm mt-5 font-semibold">
              AI Visibility tool for Competitor Research
            </h2>
            <p className="text-md text-tertiary mt-2 md:mt-4 md:text-lg">
              Benchmark your brand against competitors in AI search. See who gets cited more, for
              which prompts, and why. Use the data to close gaps and win more AI visibility.
            </p>
          </div>
          <div className="w-full flex-1 self-center">
            <BrandVisibilityIllustration />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 md:gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="max-w-xl flex-1 self-center">
            <FeaturedIcon icon={MessageChatCircle} size="lg" color="brand" theme="light" />
            <h2 className="text-display-xs text-primary md:text-display-sm mt-5 font-semibold">
              AI Content Gap analysis
            </h2>
            <p className="text-md text-tertiary mt-2 md:mt-4 md:text-lg">
              Discover which topics and prompts your competitors rank for in AI search, but you
              don&apos;t. Get a prioritised list of content to create and pages to optimise so you
              can close every gap.
            </p>
          </div>
          <div className="w-full flex-1 self-center">
            <OpportunitiesIllustration variant="default" />
          </div>
        </div>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  return (
    <section className="bg-primary py-16 md:py-24">
      <div className="max-w-container mx-auto w-full px-4 md:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <span className="text-brand-secondary md:text-md text-sm font-semibold">
            How It Works
          </span>
          <h2 className="text-display-sm text-primary md:text-display-md mt-3 font-semibold">
            Four Steps to Full AI Visibility
          </h2>
        </div>

        <div className="mx-auto mt-12 grid w-full max-w-5xl grid-cols-1 gap-6 md:mt-16 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item) => (
            <div
              key={item.step}
              className="border-secondary bg-primary/60 flex flex-col items-start rounded-2xl border p-6 text-start shadow-xs"
            >
              <span className="text-brand-secondary text-display-xs font-semibold">
                {item.step}
              </span>
              <h3 className="text-primary mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="text-tertiary mt-2 text-base">{item.description}</p>
            </div>
          ))}
        </div>
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

export default function AiVisibilityTrackerPage() {
  return (
    <div className="bg-primary">
      <Hero />
      <FeatureHighlights />
      <HowItWorks />
      <FeaturesGrid />
      <FaqAccordion faqs={FAQS} showContactBlock={false} />
      <FooterCta />

      <DemoVideoModal />
    </div>
  );
}
