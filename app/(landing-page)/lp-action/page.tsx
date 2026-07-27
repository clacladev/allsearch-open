import { getSEOTags } from '@/libs/seo';
import { Metadata } from 'next';
import { config } from '@/config';
import { HomepageCtaBlock } from '../../(public)/(index)/Buttons';
import Image from 'next/image';
import { Testimonials } from '../../(public)/(index)/Testimonials';
import PublicShell from '@/app/(public)/components/PublicShell';
import { MdBreak, TextHighlight } from '@/app/(public)/components/TextUtils';

export const metadata: Metadata = getSEOTags({
  title: `${config.appName} - Growing AI Traffic is Easy with the Right Action List`,
  description:
    'Custom action lists are generated and automatically updated using your prompts and competitor data for ChatGPT, Perplexity, and Google AI',
  keywords: ['AI SEO action list', 'AI SEO action list for agencies', ...config.keywords],
  ogImageTitle: 'Growing AI Traffic is Easy with the Right Action List.',
});

const Hero = () => {
  return (
    <div className="bg-secondary_alt relative -mt-20 overflow-hidden pt-20">
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
            <h1 className="text-display-md text-primary md:text-display-lg lg:text-display-xl font-semibold">
              Growing <TextHighlight>AI Traffic</TextHighlight> is Easy
              <MdBreak /> with the Right <TextHighlight>Action List</TextHighlight>.
            </h1>
            <p className="text-tertiary mt-4 max-w-3xl text-lg md:mt-6 md:text-xl">
              Custom action lists are generated and automatically updated using your prompts and
              competitor data for ChatGPT, Perplexity, and Google AI.
            </p>
            <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 sm:w-auto sm:flex-row sm:items-start md:mt-12">
              <HomepageCtaBlock />
            </div>
          </div>
        </div>

        <div className="max-w-container mx-auto mt-16 w-full px-4 md:h-100 md:px-8">
          <Image
            src="/index/landing-page/action/hero.webp"
            className="h-72 w-full object-cover object-left md:mx-auto md:size-full md:object-contain md:object-center"
            alt="AI Analytics dashboard interface showing brand visibility charts and improvement opportunities"
            width={1388}
            height={540}
            loading="lazy"
          />
        </div>
      </section>
    </div>
  );
};

export default function LandingPage() {
  return (
    <PublicShell stripLinksFromHeaderAndFooter>
      <div className="bg-primary">
        <Hero />
        <Testimonials />
      </div>
    </PublicShell>
  );
}
