'use client';

import { ArrowLeft, ArrowRight } from '@untitledui/icons';
import { Carousel } from '@/components/application/carousel/carousel-base';
import { Button } from '@/components/base/buttons/button';
import { ComponentPropsWithRef, FC } from 'react';
import { isReactComponent } from '@/utils/is-react-component';
import { cx } from '@/utils/cx';
import Image from 'next/image';
import { StarIcon } from '@/components/foundations/rating-stars';

const REVIEWS = [
  {
    author: 'Jules Canlas',
    imageUrl: '/index/testimonials/JulesCanlas.webp',
    cite: 'Founder & CEO',
    industry: 'Embarque, SEO Agency',
  },
  {
    author: 'Lee Perry',
    imageUrl: '/index/testimonials/LeePerry.webp',
    cite: 'Founder & CEO',
    industry: 'Rise and Reveal, SEO Agency',
  },
];

export const Testimonials = () => (
  <section className="bg-secondary overflow-hidden py-16 md:py-24" id="testimonials">
    <div className="max-w-container mx-auto px-4 md:px-8">
      <div className="reveal flex flex-col items-center gap-4 md:gap-5">
        <h2 className="text-display-sm text-primary md:text-display-md text-center font-semibold">
          Agency Owners and Experts That Trust Us
        </h2>
        <p className="text-tertiary text-center text-lg md:text-xl">
          Hear from agency owners and SEO experts who use AllSearch to deliver AI SEO for their
          clients.
        </p>
      </div>

      <TestimonialsCarousel className="reveal" />
    </div>
  </section>
);

export const TestimonialsCarousel = ({ className }: { className?: string }) => (
  <Carousel.Root
    className={cx('mt-12 md:mt-16', className)}
    opts={{
      align: 'start',
    }}
  >
    <Carousel.Content overflowHidden={false} className="justify-center gap-6 pr-4 md:gap-8 md:pr-8">
      {REVIEWS.map((review) => (
        <Carousel.Item
          key={review.author}
          className="h-96 max-w-72 shrink-0 cursor-grab md:h-120 md:max-w-90"
        >
          <Image
            src={review.imageUrl}
            className="size-full rounded-lg object-cover"
            alt={review.author}
            width="360"
            height="480"
          />

          <div className="relative">
            <div className="absolute inset-x-0 bottom-0 rounded-xl bg-linear-to-t from-black/40 to-black/0 p-3 pt-16 md:p-4 md:pt-20 lg:pt-24">
              <div className="bg-primary/30 ring-alpha-white/30 flex cursor-auto flex-col gap-6 rounded-xl px-4 py-6 ring-1 backdrop-blur-md ring-inset md:rounded-2xl md:p-5">
                {/* {review.quote && (
                        <q className="text-xl font-semibold text-balance text-white">
                          {review.quote}
                        </q>
                      )} */}

                <div className="flex flex-col items-center gap-1.5 md:gap-2">
                  <div className="flex flex-col items-center gap-4">
                    <div aria-hidden="true" className="flex items-center gap-1">
                      <StarIcon className="text-fg-white" />
                      <StarIcon className="text-fg-white" />
                      <StarIcon className="text-fg-white" />
                      <StarIcon className="text-fg-white" />
                      <StarIcon className="text-fg-white" />
                    </div>

                    <p className="md:text-display-xs text-xl font-semibold text-white">
                      {review.author}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-0.5">
                    <p className="text-md font-semibold text-white">{review.cite}</p>
                    <p className="text-sm font-medium text-white">{review.industry}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Carousel.Item>
      ))}
    </Carousel.Content>

    <div className="mt-8 flex gap-4 md:gap-8 xl:hidden">
      <Carousel.PrevTrigger asChild>
        <RoundButton icon={ArrowLeft} />
      </Carousel.PrevTrigger>
      <Carousel.NextTrigger asChild>
        <RoundButton icon={ArrowRight} />
      </Carousel.NextTrigger>
    </div>
  </Carousel.Root>
);

interface RoundButtonProps extends ComponentPropsWithRef<'button'> {
  icon?: FC<{ className?: string }>;
}

const RoundButton = ({ icon: Icon, ...props }: RoundButtonProps) => {
  return (
    <Button
      {...props}
      color="link-gray"
      className={cx(
        'group bg-primary ring-secondary hover:bg-secondary flex size-12 items-center justify-center rounded-full ring-1 backdrop-blur transition duration-100 ease-linear ring-inset md:size-14',
        props.className
      )}
    >
      {props.children ??
        (isReactComponent(Icon) ? (
          <Icon className="text-fg-quaternary transition-inherit-all group-hover:text-fg-quaternary_hover size-5 md:size-6" />
        ) : null)}
    </Button>
  );
};
