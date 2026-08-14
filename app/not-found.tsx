'use client';

import { ROUTES } from '@/libs/routes';
import { Button } from '@/components/ui/button';
import { House } from 'lucide-react';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <body className="bg-primary antialiased">
      <section className="bg-primary flex min-h-screen flex-col overflow-hidden py-16 md:px-20 md:py-24">
        <div className="relative flex h-full grow justify-center px-4 md:px-8 md:pt-[15vh]">
          <span
            aria-hidden="true"
            className="text-bg-tertiary absolute left-1/2 z-0 hidden -translate-x-1/2 text-[450px] leading-none font-bold md:block"
          >
            404
          </span>

          <div className="relative z-10 flex w-full max-w-3xl flex-col items-center justify-start gap-8 md:gap-12 md:pt-[75px]">
            <div className="z-10 flex w-full flex-col gap-4 text-center md:gap-6">
              <h1 className="text-display-md text-primary md:text-display-lg lg:text-display-xl font-semibold">
                We lost this page
              </h1>
              <p className="text-tertiary text-lg md:text-xl">
                The page you are looking for doesn&apos;t exist or has been moved.
              </p>
            </div>

            <div className="z-10 flex flex-col-reverse gap-3 self-stretch md:flex-row md:self-auto">
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
