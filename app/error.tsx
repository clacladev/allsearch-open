'use client';

import { ROUTES } from '@/libs/routes';
import { Button } from '@/components/ui/button';
import { House, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <body className="bg-primary antialiased">
      <section className="bg-primary flex min-h-screen flex-col overflow-hidden py-16 md:px-20 md:py-24">
        <div className="relative flex h-full grow justify-center px-4 md:px-8 md:pt-[15vh]">
          <span
            aria-hidden="true"
            className="text-bg-tertiary absolute left-1/2 z-0 hidden -translate-x-1/2 text-[450px] leading-none font-bold md:block"
          >
            500
          </span>

          <div className="relative z-10 flex w-full max-w-3xl flex-col items-center justify-start gap-8 md:gap-12 md:pt-[75px]">
            <div className="z-10 flex w-full flex-col gap-4 text-center md:gap-6">
              <h1 className="text-display-md text-primary md:text-display-lg lg:text-display-xl font-semibold">
                Something went wrong
              </h1>
              {!!error && <p className="text-tertiary text-lg md:text-xl">{error?.message}</p>}
            </div>

            <div className="z-10 flex flex-col-reverse gap-3 self-stretch md:flex-row md:self-auto">
              <Button onClick={reset} variant="outline" size="lg">
                <RefreshCw />
                Refresh
              </Button>
              <Button render={<Link href={ROUTES.DASHBOARD} />} size="lg">
                <House />
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>
    </body>
  );
}
