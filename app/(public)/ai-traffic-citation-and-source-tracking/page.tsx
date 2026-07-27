import { getSEOTags } from '@/libs/seo';
import { Metadata } from 'next';
import { config } from '@/config';
import { DemoVideoModal } from '../components/DemoVideoModal';
import { HomepageCtaBlock, CtaButton } from '../(index)/Buttons';
import { LandingPageFooterCta } from '../(index)/LandingPageFooterCta';
import { TextHighlight } from '../components/TextUtils';
import { FeaturedIcon } from '@/components/foundations/featured-icon/featured-icon';
import { FaqAccordion, type FaqItem } from '../(index)/FaqAccordion';
import { SourcesIllustration } from '../agencies/components/SourcesIllustration';
import { SourcesFiltersIllustration } from './components/SourcesFiltersIllustration';
import { BrandMentionsIllustration } from './components/BrandMentionsIllustration';
import {
  ChartBreakoutSquare,
  SearchLg,
  FileCheck02,
  Monitor01,
  Globe01,
  ZapFast,
} from '@untitledui/icons';

export const metadata: Metadata = getSEOTags({
  title: `AI Traffic Citation & Source Tracking Tool | ${config.appName}`,
  description:
    'Track every AI traffic source and citation across ChatGPT, Perplexity, Google AI Overviews, and more. Understand where AI pulls your content from and when it links to you and close the gap.',
  ogImageTitle: 'AI Traffic Citation & Source Tracking Tool',
  keywords: [
    'AI traffic citation',
    'AI source tracking',
    'AI citation tracking',
    'AI traffic source tracker',
    'AI citation tracker',
    'AI source vs citation',
    'AI content sourcing',
    'AI traffic analysis',
    'AEO citation tracking',
    ...config.keywords,
  ],
  canonicalUrlRelative: '/ai-traffic-citation-and-source-tracking',
});

const FEATURES = [
  {
    icon: Globe01,
    title: 'Source Tracking AI Traffic Source Tracker',
    description:
      'See every domain and URL the AI pulls from as a source across your tracked prompts even when no link appears in the response.',
  },
  {
    icon: ChartBreakoutSquare,
    title: 'Citation Tracking AI Traffic Citation Tracker',
    description:
      'Track every URL explicitly cited with a link in AI responses. See citation frequency by prompt, engine, and competitor.',
  },
  {
    icon: SearchLg,
    title: 'Gap Analysis Source-to-Citation Gap',
    description:
      'Identify pages AI already trusts as a source but never links to. The highest-leverage optimization targets you already have.',
  },
  {
    icon: Monitor01,
    title: 'Source & Citation Competitor Analysis',
    description:
      'See which competitor domains and contents are being sourced and cited instead of your brand.',
  },
  {
    icon: FileCheck02,
    title: 'Content Strategy AEO',
    description:
      'Turn source and citation data into a prioritised action list of pages to optimise and content to create.',
  },
  {
    icon: ZapFast,
    title: 'Citations & Sources by AI Engine',
    description:
      'Break down your source and citation data across ChatGPT, Perplexity, Google AI Overviews, Google AI Mode, and Gemini',
  },
];

const FAQS: FaqItem[] = [
  {
    question: 'What is the difference between a source and a citation in AI search visibility?',
    answer:
      'A source is when AI uses your page to generate its response but shows no link to the user. A citation is when AI explicitly includes your URL as a clickable reference. You can be a source without ever being cited, tracking both separately is what reveals the real gap.',
  },
  {
    question: "Why does it matter if AI uses my content as a source but doesn't cite me?",
    answer:
      'Being a source means AI already trusts your content, the hardest part to earn. But without a citation, users never see you and no traffic reaches your site. The source-to-citation gap is your highest-leverage opportunity: you are already influencing the answer, just not getting credit for it.',
  },
  {
    question: 'Which AI engines does citation and source tracking cover?',
    answer:
      'We track sources and citations across ChatGPT, Perplexity, Google AI Overviews, Google AI Mode, and Gemini. More engines are in the custom plan.',
  },
  {
    question: 'How is AI citation tracking different from traditional backlink tracking?',
    answer:
      'Backlink tools track links from other websites to yours. AI citation tracking monitors when AI engines reference your URL inside a generated response, completely invisible to Google Search Console or any backlink tool.',
  },
  {
    question: 'Can I track which competitor pages are being cited instead of mine?',
    answer:
      "Yes. For every tracked prompt you can see every URL being cited yours and competitors'. Filter by domain, sort by citation frequency, and identify exactly which pages are winning citations you should be capturing.",
  },
  {
    question: 'What types of content are most likely to get cited by AI engines?',
    answer:
      'Authoritative, well-structured content that directly answers a specific question. Pages with clear headings, factual accuracy, up-to-date information, and strong E-E-A-T signals consistently earn more citations across all major AI engines. Also check the CAEO content strategy section in Allsearch to more detail on how to improve your AI visibility.',
  },
  {
    question: 'Can I filter sources and citations by brand or competitor?',
    answer:
      'Yes. Filter your tracked sources and citations by brand or competitor name to see exactly where each appears across all AI engines and prompts, making it easy to compare visibility and spot gaps.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Add Your Prompts & Competitors',
    description:
      'Enter your prompts or auto-generate a topic and prompts list based on your business category. Add your competitors to track them side by side.',
  },
  {
    step: '02',
    title: 'Track Sources & Citations Across Every AI Engine',
    description:
      'Run your prompts across every major AI engine simultaneously capturing every domain used as a source and every URL explicitly cited in the response.',
  },
  {
    step: '03',
    title: 'Analyse Your Source & Citation Profile',
    description:
      'Identify your source-to-citation gap at a glance. See which domains AI is pulling from as sources, which are being cited and where your brand and competitors are.',
  },
  {
    step: '04',
    title: 'Close the Gap & Get Cited',
    description:
      'Get a direct roadmap of which existing pages to optimise and which new content to create moving your brand from invisible source to visible, traffic-driving citation.',
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
                AI Citation and Source
              </span>
            </div>

            <h1 className="text-display-md text-primary md:text-display-lg lg:text-display-xl font-semibold">
              AI Traffic Citation &<br />
              <TextHighlight>Source Tracking Tool</TextHighlight>
            </h1>

            <p className="text-tertiary mt-4 max-w-3xl text-lg md:mt-6 md:text-xl">
              Tracking when your brand is sourced and citation across the different LLMs all in one
              place for all your prompts.
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

const SourcesVsCitations = () => {
  return (
    <section className="bg-primary py-16 md:py-24">
      <div className="max-w-container mx-auto w-full px-4 md:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <span className="text-brand-secondary md:text-md text-sm font-semibold">
            Sources vs Citations
          </span>
          <h2 className="text-display-sm text-primary md:text-display-md mt-3 font-semibold">
            Sources and Citation are not the same
          </h2>
          <p className="text-tertiary mt-4 max-w-2xl text-lg">
            Many platforms in AI visibility tracking describe sources and citations as
            interchangeable but they are two fundamentally different signals.
          </p>
        </div>

        <div className="mx-auto mt-12 grid w-full max-w-4xl grid-cols-1 gap-6 md:mt-16 md:grid-cols-2 md:gap-8">
          <div className="border-secondary bg-primary/60 flex flex-col items-start rounded-2xl border p-6 text-start shadow-xs">
            <span className="text-brand-secondary text-sm font-semibold">Source</span>
            <h3 className="text-primary mt-3 text-lg font-semibold">AI Traffic Source</h3>
            <p className="text-tertiary mt-2 text-base">
              An AI traffic source is when the AI answer engine uses your page to source the
              information in their response but does not include the exact link in the output the
              user sees.
            </p>
          </div>
          <div className="border-secondary bg-primary/60 flex flex-col items-start rounded-2xl border p-6 text-start shadow-xs">
            <span className="text-brand-secondary text-sm font-semibold">Citation</span>
            <h3 className="text-primary mt-3 text-lg font-semibold">AI Traffic Citation</h3>
            <p className="text-tertiary mt-2 text-base">
              An AI traffic citation is when the AI engine explicitly includes the link of a
              specific source as a reference in the response to a URL the user can see and click.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureHighlights = () => {
  return (
    <section className="bg-primary flex flex-col gap-12 overflow-hidden py-16 sm:gap-16 md:gap-20 md:py-24 lg:gap-24">
      <div className="max-w-container mx-auto flex w-full flex-col gap-24 px-4 sm:gap-24 md:gap-32 md:px-8 lg:gap-40">
        {/* Feature 1 - Image on right */}
        <div className="grid grid-cols-1 gap-10 md:gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="max-w-xl flex-1 self-center">
            <h2 className="text-display-xs text-primary md:text-display-sm font-semibold">
              AI Traffic Source Tracking by Domain or Content
            </h2>
            <p className="text-md text-tertiary mt-2 md:mt-4 md:text-lg">
              Track the sources used across your prompts by domain or drill into the specific
              content each domain is being pulled from as a source.
            </p>
          </div>
          <div className="w-full flex-1 self-center">
            <SourcesIllustration />
          </div>
        </div>

        {/* Feature 2 - Image on left */}
        <div className="grid grid-cols-1 gap-10 md:gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="max-w-xl flex-1 self-center lg:order-last">
            <h2 className="text-display-xs text-primary md:text-display-sm font-semibold">
              Filter AI Traffic Sources by Citation Rate or Usage
            </h2>
            <p className="text-md text-tertiary mt-2 md:mt-4 md:text-lg">
              Filter your tracked sources by citation range or usage range to spot changes in AI
              rankings over time and benchmark your brand directly against competitors.
            </p>
          </div>
          <div className="w-full flex-1 self-center">
            <SourcesFiltersIllustration />
          </div>
        </div>

        {/* Feature 3 - Image on right */}
        <div className="grid grid-cols-1 gap-10 md:gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="max-w-xl flex-1 self-center">
            <h2 className="text-display-xs text-primary md:text-display-sm font-semibold">
              Filter Brands Mentions Across Sources & Citations
            </h2>
            <p className="text-md text-tertiary mt-2 md:mt-4 md:text-lg">
              Filter by brand or competitor name to see exactly where they appear across both AI
              traffic sources and citations to compare visibility and spot gaps in your coverage.
            </p>
          </div>
          <div className="w-full flex-1 self-center">
            <BrandMentionsIllustration />
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
            Four Steps to AI Traffic citation and sources AI visibility tracking
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
            Everything your team needs to track AI Traffic Sources & Citations
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
    title="Start Tracking AI Sources & Citations Today"
    description="See which AI engines use your content and which ones link to you. Close the gap and earn more traffic from AI search."
  />
);

export default function AiTrafficCitationTrackingPage() {
  return (
    <div className="bg-primary">
      <Hero />
      <SourcesVsCitations />
      <FeatureHighlights />
      <HowItWorks />
      <FeaturesGrid />
      <FaqAccordion faqs={FAQS} showContactBlock={false} />
      <FooterCta />

      <DemoVideoModal />
    </div>
  );
}
