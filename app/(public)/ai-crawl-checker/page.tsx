import { Metadata } from 'next';
import { getSEOTags } from '@/libs/seo';
import { config } from '@/config';
import { HomepageCtaBlock } from '../(index)/Buttons';
import { FaqAccordion } from '../(index)/FaqAccordion';
import { AICrawlCheckerForm } from './AICrawlCheckerForm';

export const metadata: Metadata = getSEOTags({
  title: `AI Crawlability Checker | Free Tool to Test AI Bot Access | ${config.appName}`,
  description:
    'Check if AI crawlers like GPTBot, ClaudeBot, and PerplexityBot can access and read your pages. Test robots.txt, rendering, and structured data in seconds.',
  ogImageTitle: 'AI Crawlability Checker',
  keywords: [
    'AI crawlability checker',
    'AI bot access',
    'robots.txt AI bots',
    'GPTBot allowed',
    'ClaudeBot allowed',
    'AI crawler audit',
    'JavaScript rendering SEO',
    'structured data check',
    ...config.keywords,
  ],
  canonicalUrlRelative: '/ai-crawl-checker',
});

const CRAWL_CHECKER_FAQS: { question: string; answer: string }[] = [
  {
    question: 'What is AI crawlability?',
    answer:
      "AI crawlability is whether AI bots like GPTBot, ClaudeBot, and PerplexityBot can access, read, and extract content from your pages. If they can't crawl your site, your content won't appear in AI-generated answers.",
  },
  {
    question: 'Does blocking AI crawlers hurt my Google rankings?',
    answer:
      'No. Google treats Googlebot and Google-Extended as separate crawlers. Blocking AI bots does not affect your search rankings. But it removes you from AI-generated answers, which is a growing source of brand visibility and traffic.',
  },
  {
    question: 'Why is my site blocked for AI crawlers?',
    answer:
      "Common causes include robots.txt rules that block AI user agents, web application firewalls (WAFs) that flag AI bots as scrapers, hosting providers that block unrecognized user agents by default, and JavaScript-heavy pages that render empty HTML for bots that don't execute scripts.",
  },
  {
    question: 'Which AI crawlers should I allow?',
    answer:
      'At minimum, allow GPTBot (OpenAI/ChatGPT), ClaudeBot (Anthropic), PerplexityBot, and Google-Extended (Gemini). These cover the largest AI answer engines. Review your robots.txt and server-level firewall settings for each.',
  },
  {
    question: 'Can my page be crawlable but still not cited by AI?',
    answer:
      'Yes. Crawlability is a prerequisite, not a guarantee. Once your page is accessible, factors like content structure, topical authority, freshness, and structured data influence whether AI models actually reference it in answers.',
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
              Free AI Crawlability Tool
            </span>
          </div>

          <h1 className="text-display-md text-primary md:text-display-lg lg:text-display-xl font-semibold">
            AI Crawlability Checker
          </h1>

          <p className="text-tertiary mt-4 max-w-3xl text-lg md:mt-6 md:text-xl">
            Test if GPTBot, ClaudeBot, PerplexityBot, and other AI bots can find, read, and use
            your pages. Check robots.txt rules, JavaScript rendering, structured data, and
            response codes in seconds.
          </p>

          <AICrawlCheckerForm />
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
          Crawlability is step one. Track what happens next.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-white/80 md:mt-5 md:text-xl">
          Now find out if AI models actually mention, cite, or recommend your brand. AllSearch
          tracks your AI Visibility Score, prompt rankings, citations, and sources across
          ChatGPT, Perplexity, Gemini, Google AI Overviews, and Claude.
        </p>
        <div className="mt-8 flex flex-col items-center gap-2 md:mt-10">
          <HomepageCtaBlock />
        </div>
      </div>
    </div>
  </section>
);

export default function AICrawlCheckerPage() {
  return (
    <div className="bg-primary">
      <Hero />
      <FaqAccordion faqs={CRAWL_CHECKER_FAQS} showContactBlock={false} />
      <FooterCta />
    </div>
  );
}
