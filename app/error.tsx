'use client';

import { SupportButton } from '@/app/(public)/components/SupportButton';
import { ROUTES } from '@/libs/routes';
import { Button } from '@/components/base/buttons/button';
import { Home02, RefreshCcw01 } from '@untitledui/icons';
import { TextBackground } from '@/components/application/TextBackground';
import { useEffect } from 'react';
import posthog from 'posthog-js';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    posthog.captureException(error);
  }, [error]);

  return (
    <body className="bg-primary antialiased">
      <section className="bg-primary flex min-h-screen flex-col overflow-hidden py-16 md:px-20 md:py-24">
        <div className="relative flex h-full grow justify-center px-4 md:px-8 md:pt-[15vh]">
          <TextBackground className="absolute left-1/2 z-0 hidden -translate-x-1/2 md:block">
            500
          </TextBackground>

          <div className="relative z-10 flex w-full max-w-3xl flex-col items-center justify-start gap-8 md:gap-12 md:pt-[75px]">
            <div className="z-10 flex w-full flex-col gap-4 text-center md:gap-6">
              <h1 className="text-display-md text-primary md:text-display-lg lg:text-display-xl font-semibold">
                Something went wrong
              </h1>
              {!!error && <p className="text-tertiary text-lg md:text-xl">{error?.message}</p>}
            </div>

            <div className="z-10 flex flex-col-reverse gap-3 self-stretch md:flex-row md:self-auto">
              <Button onClick={reset} iconLeading={RefreshCcw01} color="secondary" size="xl">
                Refresh
              </Button>
              <SupportButton color="secondary" size="xl" />
              <Button href={ROUTES.DASHBOARD} iconLeading={Home02} size="xl">
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>
    </body>
  );
}
