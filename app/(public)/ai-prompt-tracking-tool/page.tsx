import { getSEOTags } from '@/libs/seo';
import { Metadata } from 'next';
import { config } from '@/config';
import { DemoVideoModal } from '../components/DemoVideoModal';
import { HomepageCtaBlock, CtaButton } from '../(index)/Buttons';
import { LandingPageFooterCta } from '../(index)/LandingPageFooterCta';
import { TextHighlight } from '../components/TextUtils';
import { FeaturedIcon } from '@/components/foundations/featured-icon/featured-icon';
import { FaqAccordion, type FaqItem } from '../(index)/FaqAccordion';
import { PromptResearchIllustration } from './components/PromptResearchIllustration';
import { BulkImportIllustration } from './components/BulkImportIllustration';
import { TopicToPromptIllustration } from './components/TopicToPromptIllustration';
import {
  SearchLg,
  FileCheck02,
  Monitor01,
  Globe01,
  ZapFast,
  ChartBreakoutSquare,
} from '@untitledui/icons';

export const metadata: Metadata = getSEOTags({
  title: `AI Prompt Tracking Tool | ${config.appName}`,
  description:
    'Generate, import, and track AI prompts across ChatGPT, Perplexity, and Google AI Overviews. See your brand visibility instantly.',
  ogImageTitle: 'The AI Prompt Tracking Tool Built for AI Visibility',
  keywords: [
    'AI prompt tracking',
    'AI prompt tracking tool',
    'AI prompt research',
    'AI prompt generator',
    'AI prompt import',
    'AI prompt management',
    'AI visibility prompts',
    'LLM prompt tracking',
    'AI search prompts',
    ...config.keywords,
  ],
  canonicalUrlRelative: '/ai-prompt-tracking-tool',
});

const FEATURES = [
  {
    icon: SearchLg,
    title: 'AI Prompt Research Tool',
    description:
      'Discover which prompts and questions your target audience is asking AI engines about your category. Research driven by your domain and competitors\u2019 signals.',
  },
  {
    icon: FileCheck02,
    title: 'Topic Suggestion Engine',
    description:
      'Automatically surface the topics your brand and competitors own in AI search. Edit, expand, or add custom topics and convert them to trackable prompts instantly.',
  },
  {
    icon: Globe01,
    title: 'Prompt Import & Export',
    description:
      'Import your entire existing prompt list in bulk. Export tracked data at any point to share results with your team, clients, or for further analysis.',
  },
  {
    icon: Monitor01,
    title: 'Prompts Across Every AI Engine',
    description:
      'Run every prompt simultaneously across ChatGPT, Perplexity, Google AI Overviews, Google AI Mode, and Gemini to capture exactly where and how your brand appears.',
  },
  {
    icon: ZapFast,
    title: 'Competitor Prompt Benchmarking',
    description:
      'See which prompts your competitors are winning in AI search and which topics they dominate. Identify the exact prompts to target to close the visibility gap.',
  },
  {
    icon: ChartBreakoutSquare,
    title: 'Prompt-Level Visibility Data',
    description:
      'Track brand mention rate, citation frequency, and source usage for every individual prompt. Filter by engine, topic, or competitor to find your highest-priority opportunities.',
  },
];

const FAQS: FaqItem[] = [
  {
    question: 'What is an AI prompt tracking tool?',
    answer:
      'An AI prompt tracking tool monitors how your brand, competitors, and key topics appear when specific prompts are run through AI engines like ChatGPT, Perplexity, and Google AI. It lets you manage your full prompt library, track visibility changes over time, and identify which prompts are driving the most AI citations for you versus competitors.',
  },
  {
    question: 'How does AllSearch auto-generate prompts from my domain?',
    answer:
      'AllSearch analyses your domain and your competitors\u2019 domains to extract the most relevant topics in your category. From these topics, it auto-generates a curated list of prompts \u2014 the actual questions users ask AI engines \u2014 ready for your review. You can edit, add, or remove any prompt before tracking begins.',
  },
  {
    question: 'Can I import my own prompts instead of using auto-generated ones?',
    answer:
      'Yes. You can bulk import an existing prompt list via bulk import. You can also mix your own prompts with auto-generated suggestions, giving you full flexibility over what gets tracked.',
  },
  {
    question: 'Which AI engines does prompt tracking cover?',
    answer:
      'AllSearch tracks prompts across ChatGPT, Perplexity, Google AI Overviews, Google AI Mode, and Gemini. Additional engines are available on the custom plan.',
  },
  {
    question: 'How is prompt tracking different from keyword tracking in traditional SEO?',
    answer:
      'Traditional keyword tracking monitors where a page ranks in a search engine results page. AI prompt tracking monitors whether and how your brand is mentioned or cited inside a fully generated AI response. The prompts are conversational questions, not short keywords, and the output is a brand mention or citation, not a page rank position.',
  },
  {
    question: 'Can I track competitor prompts to benchmark my visibility?',
    answer:
      'Yes. Add your competitors when setting up your account and AllSearch will run the same prompts across all of them simultaneously. You can see their mention rates, citation frequency, and topic coverage alongside your own data to identify exactly where you need to close the gap.',
  },
  {
    question: 'How many prompts can I track?',
    answer:
      'Prompt limits depend on your plan. All plans include bulk import and export, so you can manage large prompt sets efficiently. Visit the pricing page or contact our team for details on volume plans for agencies and enterprises.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Add Your Domain & Competitors',
    description:
      'Enter your brand domain and the competitors you want to benchmark against. AllSearch extracts your category, key topics, and the prompts most relevant to your space.',
  },
  {
    step: '02',
    title: 'Auto-generate Topics or Add Your Own',
    description:
      'Review the auto-suggested topic list built from your domain and competitor signals. Edit topics, remove irrelevant ones, or add custom topics specific to your goals.',
  },
  {
    step: '03',
    title: 'Generate Prompts or Import Your Own',
    description:
      'From each topic, AllSearch auto-generates a curated prompt list ready to review and activate. Prefer your own? Bulk import your existing prompts directly.',
  },
  {
    step: '04',
    title: 'Track Across Every LLM & Optimise',
    description:
      'Run your prompts across all major AI engines simultaneously. Capture brand mentions, sources, and citations then use the data to optimise your AI visibility.',
  },
];

import { SUPPORTED_CHATBOTS_IDS, CHATBOT_DISPLAY_LABELS } from '@/libs/database/shared/ChatbotId';

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
                AI Prompt Tracking
              </span>
            </div>

            <h1 className="text-display-md text-primary md:text-display-lg lg:text-display-xl font-semibold">
              The <TextHighlight>AI Prompt Tracking</TextHighlight> Tool
              <br />
              Built for AI Visibility
            </h1>

            <p className="text-tertiary mt-4 max-w-3xl text-lg md:mt-6 md:text-xl">
              Research, generate, and manage every prompt across ChatGPT, Perplexity, Google AI
              Overviews, and more all from your domain and your competitors.
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
        {/* Feature 1 - Prompt & Topic Research — Image on right */}
        <div className="grid grid-cols-1 gap-10 md:gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="max-w-xl flex-1 self-center">
            <span className="text-brand-secondary md:text-md text-sm font-semibold">
              Prompt & Topic Research
            </span>
            <h2 className="text-display-xs text-primary md:text-display-sm mt-3 font-semibold">
              Discover the prompts your customers actually use
            </h2>
            <p className="text-md text-tertiary mt-2 md:mt-4 md:text-lg">
              Enter your brand domain and your competitors and AllSearch extracts the most important
              topics driving AI visibility in your category. Get a ready-to-track list of suggested
              prompts, or drill deeper into any topic to auto-generate more.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {SUPPORTED_CHATBOTS_IDS.map((id) => (
                <span
                  key={id}
                  className="border-secondary bg-secondary text-tertiary rounded-full border px-3 py-1 text-xs font-medium"
                >
                  {CHATBOT_DISPLAY_LABELS[id]}
                </span>
              ))}
            </div>
          </div>
          <div className="w-full flex-1 self-center">
            <PromptResearchIllustration />
          </div>
        </div>

        {/* Feature 2 - Bulk Import & Export — Image on left */}
        <div className="grid grid-cols-1 gap-10 md:gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="max-w-xl flex-1 self-center lg:order-last">
            <span className="text-brand-secondary md:text-md text-sm font-semibold">
              Bulk Import & Export
            </span>
            <h2 className="text-display-xs text-primary md:text-display-sm mt-3 font-semibold">
              Import and export prompts at scale with zero friction
            </h2>
            <p className="text-md text-tertiary mt-2 md:mt-4 md:text-lg">
              Bulk import your entire prompt list in seconds paste them directly into the system.
              Export your prompt AI visibility results at any time to share with your team or
              clients easily.
            </p>
          </div>
          <div className="w-full flex-1 self-center">
            <BulkImportIllustration />
          </div>
        </div>

        {/* Feature 3 - Topic to Prompt Suggestions — Image on right */}
        <div className="grid grid-cols-1 gap-10 md:gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="max-w-xl flex-1 self-center">
            <span className="text-brand-secondary md:text-md text-sm font-semibold">
              Topic to Prompt Suggestions
            </span>
            <h2 className="text-display-xs text-primary md:text-display-sm mt-3 font-semibold">
              From topics to a full prompt list, automatically
            </h2>
            <p className="text-md text-tertiary mt-2 md:mt-4 md:text-lg">
              AllSearch suggests the most relevant topics for your brand and competitors. Edit them,
              add your own, and let the engine auto-generate a curated set of prompts for each topic
              ready for your review and activation.
            </p>
          </div>
          <div className="w-full flex-1 self-center">
            <TopicToPromptIllustration />
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
            Four steps to full AI prompt tracking
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
          <h2 className="text-display-sm text-primary md:text-display-md font-semibold">
            Everything your team needs to do AI topic and prompt tracking research
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
    title="Start Tracking Your AI Prompts Today"
    description="Research your most important prompts, import your existing list, and track visibility across every major AI engine."
  />
);

export default function AiPromptTrackingPage() {
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
