import { getSEOTags } from '@/libs/seo';
import { Metadata } from 'next';
import { config } from '@/config';
import { HeroIllustration } from '../../(public)/aeo-content-strategy/components/HeroIllustration';
import { HomepageCtaBlock } from '../../(public)/(index)/Buttons';
import { Testimonials } from '../../(public)/(index)/Testimonials';
import PublicShell from '@/app/(public)/components/PublicShell';
import { MdBreak, TextBgHighlight, TextHighlight } from '@/app/(public)/components/TextUtils';

export const metadata: Metadata = getSEOTags({
  title: `${config.appName} - Make Your Agency's AI SEO Service Actually Scalable.`,
  description:
    'Run AI SEO for 20+ clients in one place with prompt data and clear AEO action plans, saving 30+ hours per account monthly.',
  keywords: ['AI SEO for agencies', 'AI SEO agency', 'AI SEO agencies', ...config.keywords],
  ogImageTitle: "Make Your Agency's AI SEO Service Actually Scalable.",
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
              Make Your <TextHighlight>Agency's AI SEO</TextHighlight>
              <MdBreak /> Service Actually <TextHighlight>Scalable</TextHighlight>.
            </h1>

            <p className="text-tertiary mt-4 max-w-2xl text-lg md:mt-6 md:text-xl">
              Run AI SEO for <TextBgHighlight>20+ clients in one place</TextBgHighlight> with prompt
              data and clear AEO action plans,{' '}
              <TextBgHighlight>saving 30+ hours per account</TextBgHighlight> monthly.
            </p>
            <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 sm:w-auto sm:flex-row sm:items-start md:mt-12">
              <HomepageCtaBlock />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl">
          <HeroIllustration />
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
