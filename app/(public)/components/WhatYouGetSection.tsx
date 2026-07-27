import type { FC } from 'react';
import { cx } from '@/utils/cx';
import { HomepageCtaBlock } from '../(index)/Buttons';

type WhatYouGetItem = {
  icon: FC<{ className?: string }>;
  title: string;
  description: string;
};

type WhatYouGetSectionProps = {
  eyebrow?: string;
  title: string;
  items: WhatYouGetItem[];
};

export const WhatYouGetSection = ({
  eyebrow = 'What You Get',
  title,
  items,
}: WhatYouGetSectionProps) => {
  return (
    <section className="bg-primary py-16 md:py-24">
      <div className="max-w-container mx-auto w-full px-4 md:px-8">
        <div className="reveal flex w-full max-w-2xl flex-col items-start text-left">
          <span className="text-brand-secondary md:text-md text-sm font-semibold">{eyebrow}</span>
          <h2 className="text-display-sm text-primary md:text-display-md mt-3 font-semibold">
            {title}
          </h2>
        </div>

        <div className="mt-12 grid w-full grid-cols-1 gap-y-10 md:mt-16 md:grid-cols-3 md:gap-x-10 md:gap-y-12">
          {items.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={cx('reveal flex flex-col items-start text-start', i >= 3 && 'reveal-delay-1')}
              >
                <Icon className="text-fg-brand-primary size-6" />
                <h3 className="text-primary mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="text-tertiary mt-2 text-base">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="reveal mt-12 flex justify-start md:mt-16">
          <HomepageCtaBlock />
        </div>
      </div>
    </section>
  );
};
