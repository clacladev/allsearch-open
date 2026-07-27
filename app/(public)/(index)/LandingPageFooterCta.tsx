import { HomepageCtaBlock } from './Buttons';

interface LandingPageFooterCtaProps {
  title: string;
  description: string;
}

export const LandingPageFooterCta = ({ title, description }: LandingPageFooterCtaProps) => {
  return (
    <section className="bg-primary py-8 md:py-16">
      <div className="max-w-container mx-auto w-full px-4 md:px-8">
        <div className="dark-mode bg-secondary flex flex-col items-center rounded-3xl px-6 py-16 text-center md:rounded-4xl md:px-12 md:py-20">
          <h2 className="text-display-sm text-fg-white md:text-display-md font-semibold">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-white/80 md:mt-5 md:text-xl">{description}</p>
          <div className="mt-8 flex flex-col items-center gap-2 md:mt-10">
            <HomepageCtaBlock />
          </div>
        </div>
      </div>
    </section>
  );
};
