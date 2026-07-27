import { Metadata } from 'next';
import { getSEOTags } from '@/libs/seo';
import { config } from '@/config';
import { HomepageCtaBlock } from '../(index)/Buttons';
import { FaqAccordion } from '../(index)/FaqAccordion';
import { AIProductPromptIdeasForm } from './AIProductPromptIdeasForm';

export const metadata: Metadata = getSEOTags({
  title: `AI Product Prompt Ideas Generator | See How Shoppers Ask AI | ${config.appName}`,
  description:
    'Paste any product or category URL and get 10 real prompts shoppers type into ChatGPT, Perplexity and Gemini. Free AI prompt research tool to find where you should appear in AI search. No signup.',
  ogImageTitle: 'AI Product Prompt Ideas',
  keywords: [
    'AI product prompt ideas',
    'product page prompts',
    'ecommerce AI prompts',
    'shopping prompts generator',
    'product research prompts',
    'AI search prompts for products',
    ...config.keywords,
  ],
  canonicalUrlRelative: '/ai-product-prompt-ideas',
});

const PROMPT_IDEAS_FAQS: { question: string; answer: string }[] = [
  {
    question: 'What is AI prompt research?',
    answer:
      "It's the AI-era version of keyword research: finding the full conversational questions people ask ChatGPT, Perplexity and Gemini about your product, rather than the short keywords they'd type into Google.",
  },
  {
    question: 'How is an AEO prompt different from a SEO keyword?',
    answer:
      'A keyword is fragmented ("hiking jacket"). A prompt is a full question ("what\'s the warmest lightweight jacket for hiking under £200?"). AI engines answer prompts, so optimising for them requires different research.',
  },
  {
    question: 'What pages should I use on the prompt idea generator?',
    answer:
      "Product detail pages and category pages work best because that's where shopping intent is strongest. You can paste other URLs too, but PDPs and category pages give the most relevant, intent-rich prompts.",
  },
  {
    question: 'Which AI engines do these prompts apply to?',
    answer:
      'ChatGPT, Perplexity, Google AI Overviews and AI Mode, Gemini, and Claude. Any generative engine shoppers use to research and compare products.',
  },
  {
    question: 'Why are the prompts grouped by topic?',
    answer:
      'The tool groups the prompts into the main topics that matter for your specific product or category page, for example feature and technical prompts, discovery prompts, and value or buying prompts. The exact groups vary by product, so you can see at a glance which type of question your product is missing from.',
  },
  {
    question: 'What do I do with the prompts once I have them?',
    answer:
      "They're the starting point for tracking your AI visibility. Add them to AllSearch to see whether ChatGPT, Perplexity and Gemini actually mention and cite your brand for each prompt, then track it over time against competitors.",
  },
];

const Hero = () => (
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
              Free AI Prompt Ideas Generator
            </span>
          </div>

          <h1 className="text-display-md text-primary md:text-display-lg lg:text-display-xl font-semibold">
            AI Product Prompt Ideas
          </h1>

          <p className="text-tertiary mt-4 max-w-3xl text-lg md:mt-6 md:text-xl">
            Enter a product (PDP) or category page URL and get prompt ideas grouped by topic.
            Discover the prompts relevant to your product and how shoppers ask about it in
            ChatGPT, Perplexity, Gemini and other AI search engines.
          </p>

          <AIProductPromptIdeasForm />
        </div>
      </div>
    </section>
  </div>
);

const FooterCta = () => (
  <section className="bg-primary py-8 md:py-16">
    <div className="max-w-container mx-auto w-full px-4 md:px-8">
      <div className="dark-mode bg-secondary flex flex-col items-center rounded-3xl px-6 py-16 text-center md:rounded-4xl md:px-12 md:py-20">
        <span className="text-brand-secondary md:text-md text-sm font-semibold">
          AI Visibility Tracker
        </span>
        <h2 className="text-display-sm text-fg-white md:text-display-md mt-3 font-semibold">
          Turn your prompt ideas into tracked AI visibility
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-white/80 md:mt-5 md:text-xl">
          The prompts you generate here are your starting point. Add them to AllSearch to track
          whether AI engines actually mention, cite or recommend you across ChatGPT, Perplexity,
          Gemini, Google AI Overviews and watch how your visibility changes for each prompt as
          you optimise.
        </p>
        <div className="mt-8 flex flex-col items-center gap-2 md:mt-10">
          <HomepageCtaBlock />
        </div>
      </div>
    </div>
  </section>
);

export default function AIProductPromptIdeasPage() {
  return (
    <div className="bg-primary">
      <Hero />
      <FaqAccordion faqs={PROMPT_IDEAS_FAQS} showContactBlock={false} />
      <FooterCta />
    </div>
  );
}
