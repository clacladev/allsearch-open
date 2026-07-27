import { type HTMLAttributes, type FC } from 'react';
import {
  ZapFast,
  SearchLg,
  Globe01,
  Monitor01,
  Eye,
  BarChart11,
} from '@untitledui/icons';
import { cx } from '@/utils/cx';
import { PricingSection } from '@/app/(public)/(index)/Pricing';
import { HomepageCtaBlock } from './Buttons';
import { FaqAccordion } from './FaqAccordion';
import { Testimonials } from './Testimonials';
import Image from 'next/image';
import { TextBgHighlight, TextHighlight } from '../components/TextUtils';
import { ProjectReportIllustration } from '@/app/(public)/agencies/components/ProjectReportIllustration';
import { OpportunitiesIllustration } from '@/app/(public)/agencies/components/OpportunitiesIllustration';
import { PromptsIllustration } from '@/app/(public)/agencies/components/PromptsIllustration';
import { SourcesIllustration } from '@/app/(public)/agencies/components/SourcesIllustration';
import { ScaledContent } from '../agencies/components/ScaledContent';
import { HeroVideoInit } from '../components/HeroVideoInit';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { WhatYouGetSection } from '../components/WhatYouGetSection';

const Hero = () => {
  return (
    <div className="bg-secondary_alt relative -mt-20 overflow-hidden pt-20 bg-gradient-to-b from-transparent via-transparent to-[var(--color-brand-solid)]/[0.03]">
      {/* Background pattern */}
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

      {/* Header */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="max-w-container mx-auto w-full px-4 md:px-8">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <div className="bg-brand-secondary/40 ring-brand-solid/20 dark:bg-utility-brand-100 mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 ring-1 ring-inset backdrop-blur-sm">
              <span className="bg-brand-solid size-2 animate-pulse rounded-full" />
              <span className="text-fg-brand-primary text-sm font-medium dark:text-white">
                AI Shopping Visibility Tracker
              </span>
            </div>
            <h1 className="text-display-md text-primary md:text-display-lg lg:text-display-xl font-semibold text-balance">
              Make Your{' '}
              <TextHighlight>
                <TextBgHighlight variant="soft">Ecommerce</TextBgHighlight>
              </TextHighlight>{' '}
              Visible <br className="hidden md:block" /> in <TextHighlight>AI Search</TextHighlight>
            </h1>
            <p className="text-tertiary mt-4 max-w-2xl text-lg text-balance md:mt-6 md:text-xl">
              Optimise your product pages and category pages to improve AI shopping visibility
              across ChatGPT, Perplexity, Google AI, Gemini, and more, before your competitors do.
            </p>
            <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 sm:w-auto sm:flex-row sm:items-start md:mt-12">
              <HomepageCtaBlock />
            </div>
          </div>
        </div>

        <div className="max-w-container relative mx-auto mt-16 w-full px-4 md:h-100 md:px-8">
          {/* Ambient glow behind mockup */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/4 left-1/2 -z-0 h-64 w-3/4 -translate-x-1/2 rounded-full bg-[var(--color-brand-solid)] opacity-[0.08] blur-[100px]"
          />
          <div className="flex flex-col md:items-start">
            <div className="mx-auto flex h-full w-full items-center justify-center md:max-h-105 md:w-full md:max-w-266 md:items-start lg:max-h-140">
              <div id="hero-media" className="relative size-full">
                {/* Mockup frame (shown initially) */}
                <div
                  id="hero-mockup"
                  className="bg-primary ring-utility-neutral-300 size-full rounded-[9.03px] p-[0.9px] shadow-lg ring-[0.56px] ring-inset md:rounded-[28px] md:p-[3.5px] md:ring-[1.75px]"
                >
                  <div className="bg-primary shadow-modern-mockup-inner-md md:shadow-modern-mockup-inner-lg size-full rounded-[7.9px] p-0.5 md:rounded-[24.5px] md:p-1">
                    <div className="bg-utility-neutral-50 ring-utility-neutral-200 relative size-full overflow-hidden rounded-[6.77px] ring-[0.56px] md:rounded-[21px] md:ring-[1.75px]">
                      <Image
                        src="/index/dashboard-desktop-light.webp"
                        className="size-full object-cover dark:hidden"
                        alt="AI Analytics dashboard interface showing brand visibility charts and improvement opportunities"
                        width={3000}
                        height={1828}
                        priority
                      />
                      <Image
                        src="/index/dashboard-desktop-dark.webp"
                        className="size-full object-cover not-dark:hidden"
                        alt="AI Analytics dashboard interface showing brand visibility charts and improvement opportunities"
                        width={2996}
                        height={1824}
                        priority
                      />
                    </div>
                  </div>
                </div>

                {/* Video container (empty, shown after click) */}
                <div
                  id="hero-video"
                  className="bg-primary ring-utility-neutral-300 hidden size-full overflow-hidden rounded-[9.03px] ring-[0.56px] ring-inset md:rounded-[28px] md:ring-[1.75px]"
                />

                {/* Play button overlay */}
                <button
                  id="hero-play-btn"
                  aria-label="Play demo video"
                  className="group absolute inset-0 flex cursor-pointer items-center justify-center border-0 bg-transparent"
                >
                  <div className="flex size-16 items-center justify-center rounded-full bg-white/90 shadow-[0_8px_30px_rgba(65,175,125,0.45)] backdrop-blur-sm transition-all duration-200 group-hover:scale-110 group-hover:bg-white group-hover:shadow-[0_12px_40px_rgba(65,175,125,0.6)] md:size-20">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-brand-600 size-6 translate-x-0.5 md:size-8"
                      aria-hidden="true"
                    >
                      <path d="M8 5.14v14l11-7-11-7z" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <HeroVideoInit />
        </div>
      </section>
    </div>
  );
};

const FeaturesAlternating = () => {
  return (
    <section className="bg-primary flex flex-col gap-12 overflow-hidden py-16 sm:gap-16 md:gap-20 md:py-24 lg:gap-24">
      <div className="max-w-container mx-auto w-full px-4 md:px-8">
        <div className="reveal mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <span className="text-brand-secondary md:text-md text-sm font-semibold">Features</span>
          <h2 className="text-display-sm text-primary md:text-display-md mt-3 font-semibold">
            Built for Ecommerce AI Visibility
          </h2>
          <p className="text-tertiary mt-4 text-lg md:mt-5 md:text-xl">
            Track every product page and competitor across every AI engine. Then act on what you
            find.
          </p>
        </div>
      </div>

      <div className="max-w-container mx-auto flex w-full flex-col gap-24 px-4 sm:gap-24 md:gap-32 md:px-8 lg:gap-40">
        <div className="reveal grid grid-cols-1 gap-10 md:gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="max-w-xl flex-1 self-center">
            <span className="text-brand-secondary md:text-md block text-sm font-semibold">
              Product &amp; Category Visibility
            </span>
            <h2 className="text-display-xs text-primary md:text-display-sm mt-3 font-semibold">
              See Which Products AI Recommends and Which Are Being Left Out
            </h2>
            <p className="text-md text-tertiary mt-2 md:mt-4 md:text-lg">
              Track which of your product and category pages are being recommended by AI answer
              engines and which are invisible. See exactly which competitor products are appearing
              instead, and identify the pages with the highest gap opportunity.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                'Product page tracking',
                'Category visibility',
                'Competitor comparison',
                'All AI engines',
              ].map((tag) => (
                <span
                  key={tag}
                  className="border-secondary bg-secondary text-tertiary rounded-full border px-3 py-1 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="w-full flex-1 self-start">
            <ScaledContent scale={0.6} className="ring-secondary max-h-98 rounded-2xl shadow-lg ring-1">
              <ProjectReportIllustration variant="ecommerce" />
            </ScaledContent>
          </div>
        </div>

        <div className="reveal grid grid-cols-1 gap-10 md:gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="max-w-xl flex-1 self-center lg:order-last">
            <span className="text-brand-secondary md:text-md block text-sm font-semibold">
              Content Strategy
            </span>
            <h2 className="text-display-xs text-primary md:text-display-sm mt-3 font-semibold">
              A Constantly Updated Action List for Product &amp; Category Pages
            </h2>
            <p className="text-md text-tertiary mt-2 md:mt-4 md:text-lg">
              Turn AI visibility data into a prioritised list of exactly what to do: which product
              pages to rewrite, which category pages need new content, and where a single
              optimisation unlocks AI citations across multiple prompts.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                'Product page actions',
                'Category page actions',
                'Priority scoring',
                'AEO recommendations',
              ].map((tag) => (
                <span
                  key={tag}
                  className="border-secondary bg-secondary text-tertiary rounded-full border px-3 py-1 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="w-full flex-1 self-start">
            <OpportunitiesIllustration variant="ecommerce" />
          </div>
        </div>

        <div className="reveal grid grid-cols-1 gap-10 md:gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="max-w-xl flex-1 self-center">
            <span className="text-brand-secondary md:text-md block text-sm font-semibold">
              Query &amp; Prompt Research
            </span>
            <h2 className="text-display-xs text-primary md:text-display-sm mt-3 font-semibold">
              Find the Exact Queries Shoppers Type into AI When Looking for Your Products
            </h2>
            <p className="text-md text-tertiary mt-2 md:mt-4 md:text-lg">
              Discover the real shopping queries your potential customers are asking AI engines,
              from product comparisons and &quot;best of&quot; lists to &quot;where to buy&quot;
              queries, and track your visibility for every one of them.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                'Shopping query discovery',
                'Intent classification',
                'Auto-generated prompts',
                'Bulk import/export',
              ].map((tag) => (
                <span
                  key={tag}
                  className="border-secondary bg-secondary text-tertiary rounded-full border px-3 py-1 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="w-full flex-1 self-start">
            <PromptsIllustration variant="ecommerce" />
          </div>
        </div>

        <div className="reveal grid grid-cols-1 gap-10 md:gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="max-w-xl flex-1 self-center lg:order-last">
            <span className="text-brand-secondary md:text-md block text-sm font-semibold">
              Source &amp; Citation Analysis
            </span>
            <h2 className="text-display-xs text-primary md:text-display-sm mt-3 font-semibold">
              See Which Sources Fuel Competitor AI Citations and Exactly Where to Close the Gap
            </h2>
            <p className="text-md text-tertiary mt-2 md:mt-4 md:text-lg">
              For every shopping query, see exactly which third-party domains, review sites, and UGC
              sources AI engines are using to cite your competitors instead of you. Turn that
              intelligence into a precise outreach and content plan.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                'Source tracking',
                'Citation gap analysis',
                'Competitor source intel',
                'Domain benchmarking',
              ].map((tag) => (
                <span
                  key={tag}
                  className="border-secondary bg-secondary text-tertiary rounded-full border px-3 py-1 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="w-full flex-1 self-start">
            <SourcesIllustration variant="ecommerce" />
          </div>
        </div>
      </div>
    </section>
  );
};

const DATA_SOURCES: { alt: string; src: string }[] = [
  { alt: 'ChatGPT', src: '/index/ai-logos/chatgpt-logotype.webp' },
  { alt: 'Google AI Mode', src: '/index/ai-logos/google-ai-logotype.webp' },
  { alt: 'Perplexity', src: '/index/ai-logos/perplexity-logotype.webp' },
];

const DataSourcesIcons = () => {
  return (
    <section className="bg-secondary py-16 md:py-24">
      <div className="max-w-container mx-auto w-full px-4 md:px-8">
        <div className="flex flex-col items-center gap-12 md:gap-16">
          <div className="reveal mx-auto flex w-full max-w-3xl flex-col items-center text-center">
            <span className="text-brand-secondary md:text-md text-sm font-semibold">
              Data Sources
            </span>
            <h2 className="text-display-sm text-primary md:text-display-md mt-3 font-semibold">
              All-Engine AI Visibility in One Dashboard
            </h2>
            <p className="text-tertiary mt-4 text-lg md:mt-5 md:text-xl">
              Track your ecommerce brand&apos;s performance across ChatGPT, Perplexity, Google AI
              Mode, Gemini, and more. Product citations, category rankings, and source data, all in
              one place, updated daily.
            </p>
          </div>
          <div className="reveal grid grid-cols-3 gap-4 self-center px-3 lg:gap-8 lg:px-14">
            {DATA_SOURCES.map(({ alt, src }) => (
              <span
                key={src + alt}
                className="ring-secondary flex shrink-0 items-center justify-center rounded-lg bg-white shadow-xs ring-1 ring-inset md:rounded-xl"
              >
                <Image alt={alt} src={src} width={200} height={40} className="p-4" />
              </span>
            ))}
          </div>
          <HomepageCtaBlock className="reveal" />
        </div>
      </div>
    </section>
  );
};

const FinalCtaSection = () => {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Brand gradient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--color-brand-solid)]/[0.04] via-transparent to-[var(--color-brand-solid)]/[0.06]"
      />
      <div className="max-w-container reveal relative mx-auto px-4 md:px-8">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-display-sm text-primary md:text-display-lg max-w-3xl font-semibold text-balance">
            Make Your Ecommerce Products AI Shopping Visible
          </h2>
          <p className="text-tertiary mt-4 max-w-2xl text-lg md:mt-5 md:text-xl">
            Stop losing shoppers to competitors in AI search. Track every product page, find the
            gaps, and act on them before your competition does.
          </p>
          <HomepageCtaBlock className="mt-8 md:mt-10" />
        </div>
      </div>
    </section>
  );
};

const WHY_ITEMS: { title: string; description: string }[] = [
  {
    title: 'Actionable Insights to Improve AI Shopping Visibility',
    description:
      'Not just data: a constantly updated action list of which product and category pages to optimise, what content to create, and where competitors are beating you.',
  },
  {
    title: 'Hands-On Support for Your Ecommerce Tracking Setup',
    description:
      'Our team works with you directly to build the right prompt set for your product catalogue, category structure, and competitors from day one.',
  },
  {
    title: 'All AI Visibility Data in One Place',
    description:
      'Visibility scores, product citations, source tracking, competitor benchmarking, and content actions, across every major AI engine in a single dashboard.',
  },
];

const WhyAgenciesChoose = () => {
  return (
    <section className="bg-primary py-16 md:py-24">
      <div className="max-w-container mx-auto px-4 md:px-8">
        <div className="flex flex-col gap-12 md:gap-16">
          <div className="reveal flex w-full flex-col items-start text-left">
            <span className="text-brand-secondary md:text-md text-sm font-semibold">
              Why Choose AllSearch
            </span>
            <h2 className="text-display-sm text-primary md:text-display-md mt-3 max-w-2xl font-semibold">
              Why Ecommerce Brands & Agencies Choose Us
            </h2>
          </div>
          <div className="flex flex-col gap-0 divide-y divide-black/[0.06]">
            {WHY_ITEMS.map((item, i) => (
              <div
                key={item.title}
                className={cx(
                  'reveal grid grid-cols-1 gap-4 py-8 first:pt-0 last:pb-0 md:grid-cols-[1fr_2fr] md:gap-12',
                  i === 1 && 'reveal-delay-1',
                  i === 2 && 'reveal-delay-2'
                )}
              >
                <h3 className="text-primary text-lg font-semibold md:text-xl">{item.title}</h3>
                <p className="text-tertiary text-base md:text-lg">{item.description}</p>
              </div>
            ))}
          </div>
          <HomepageCtaBlock className="reveal items-start" />
        </div>
      </div>
    </section>
  );
};

const HOW_IT_WORKS_ITEMS = [
  {
    step: '01',
    title: 'Add Your Domain & Competitors',
    description:
      'Enter your store domain and add the competitors you want to benchmark. AllSearch surfaces your category structure and top products automatically.',
  },
  {
    step: '02',
    title: 'Generate or Add Your Topics',
    description:
      'Auto-generate a topic list based on your product catalogue and category pages, or add your own. Edit, group, and prioritise topics for your niche.',
  },
  {
    step: '03',
    title: 'Generate Prompts or Bulk Import',
    description:
      'Auto-generate AI shopping queries from your topics, or bulk import your own prompts via CSV. Review, edit, and approve your full prompt set before tracking.',
  },
  {
    step: '04',
    title: 'Track Across AI Engines & Act',
    description:
      'Run your prompts across every major AI engine simultaneously. Get visibility scores, citation data, source intelligence, and a content action list to close the gap.',
  },
];

const WHAT_YOU_GET_ITEMS: {
  icon: FC<{ className?: string }>;
  title: string;
  description: string;
}[] = [
  {
    icon: SearchLg,
    title: 'AI Shopping Query Discovery',
    description:
      'Extract the most important topics from your domain and competitors. Auto-generate a full prompt list of shopping queries, comparisons, and buying-intent questions your customers are actually asking AI engines.',
  },
  {
    icon: Globe01,
    title: 'Prompt Management at Scale',
    description:
      'Bulk import and export your prompts via CSV to test, review, and manage your full prompt set. Built for teams managing large product catalogues across multiple categories and markets.',
  },
  {
    icon: ZapFast,
    title: 'Auto-Generated Prompt Suggestions',
    description:
      'Add your own topics or use AI-suggested ones, then auto-generate a full set of tracking prompts for each. Review, edit, and approve before running, with full control over what you track.',
  },
  {
    icon: Monitor01,
    title: 'Product Page Rankings in AI',
    description:
      'See exactly which of your product pages are mentioned, recommended, or cited in AI responses, and where competitor pages are ranking ahead of yours across all engines.',
  },
  {
    icon: Eye,
    title: "Know What's Fuelling AI Answers",
    description:
      'Track every domain and URL being used as a source or citation in AI shopping responses. See your source-to-citation gap and find the exact third-party sources driving competitor citations.',
  },
  {
    icon: BarChart11,
    title: 'AEO Action List for Ecommerce',
    description:
      'A constantly updated, prioritised action list of which product pages to optimise, which content to create, and exactly how to move your brand from invisible source to cited result.',
  },
];

const SHOPPING_FAQS: { question: string; answer: string }[] = [
  {
    question: 'What is AI shopping visibility?',
    answer:
      'AI shopping visibility measures how often and how prominently your product pages are mentioned, recommended, or cited by AI answer engines such as ChatGPT, Perplexity, and Google AI, when shoppers ask buying-intent questions.',
  },
  {
    question: 'How is this different from traditional ecommerce SEO?',
    answer:
      "Traditional SEO tracks rankings in Google's blue-link results. AI shopping visibility tracks whether your products appear in AI-generated answers, a completely separate channel that Google Search Console and standard SEO tools cannot see.",
  },
  {
    question: 'Can I track category pages as well as product pages?',
    answer:
      'Category page tracking is available on our custom plan. Get in touch with our team to discuss setting up category-level visibility tracking alongside your product pages.',
  },
  {
    question: 'Which AI engines does AllSearch cover for ecommerce?',
    answer:
      'We track ChatGPT, Perplexity, Google AI Mode, Google AI Overviews, and Gemini as standard. Additional engines are available on the custom plan. We continue to add new AI shopping surfaces as they grow.',
  },
  {
    question: 'How do I find the right prompts for my product catalogue?',
    answer:
      'Enter your domain and AllSearch auto-generates a topic list based on your products. From each topic we suggest a set of shopping queries to track. You can also bulk import your own prompts via CSV.',
  },
  {
    question: 'Can I track competitor products too?',
    answer:
      "Yes. For every tracked prompt you see every product and domain being cited, yours and competitors'. Filter by competitor, sort by citation frequency, and identify exactly which pages are winning the AI citations you should be capturing.",
  },
  {
    question: 'How is AllSearch different from other AI visibility tools?',
    answer:
      'Most tools focus on general brand mentions. AllSearch is built specifically around ecommerce, tracking product pages, shopping queries, and the sources fuelling competitor citations, with a direct content action list built for online stores.',
  },
  {
    question: 'How quickly can I get set up?',
    answer:
      'Most ecommerce brands are tracking their first prompts within the same day. Enter your domain, review the auto-generated topic and prompt suggestions, and start running. Our team is on hand to help you build the right setup from the start.',
  },
];

const SectionDivider = (props: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div {...props} className={cx('max-w-container mx-auto px-4 md:px-8', props.className)}>
      <hr className="bg-border-secondary h-px w-full border-none" />
    </div>
  );
};

export default function Homepage() {
  return (
    <div className="bg-primary">
      <Hero />
      <SectionDivider className="max-md:hidden" />
      <Testimonials />
      <SectionDivider />
      <WhyAgenciesChoose />
      <HowItWorksSection title="Four Steps to AI Shopping Visibility" items={HOW_IT_WORKS_ITEMS} />
      <SectionDivider />
      <FeaturesAlternating />
      <DataSourcesIcons />
      <WhatYouGetSection
        title="Everything Your Team Needs for AI Shopping Visibility"
        items={WHAT_YOU_GET_ITEMS}
      />
      <PricingSection />
      <FinalCtaSection />
      <FaqAccordion faqs={SHOPPING_FAQS} showContactBlock={false} />
    </div>
  );
}
