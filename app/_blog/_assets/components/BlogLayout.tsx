import { PaginationPageDefault } from '@/components/application/pagination/pagination';
import { config } from '@/config';

export default function BlogLayout({
  title,
  description,
  pageNo,
  pagesCount,
  children,
}: {
  title: string;
  description?: string;
  pageNo?: number;
  pagesCount?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-primary">
      <section className="bg-brand-section pt-32 pb-32 md:pt-24 md:pb-40">
        <div className="max-w-container mx-auto px-4 md:px-8">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
            <span className="text-secondary_on-brand md:text-md text-sm font-semibold">
              {config.appName} Blog
            </span>
            <h2 className="text-display-md text-primary_on-brand md:text-display-lg mt-3 font-semibold">
              {title}
            </h2>
            {description && (
              <p className="text-tertiary_on-brand mt-4 text-lg md:mt-6 md:text-xl">
                {description}
              </p>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-container mx-auto -mt-16 flex w-full flex-col gap-12 px-4 pb-16 md:-mt-24 md:px-8 md:pb-24 lg:gap-16">
        <ul className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {children}
        </ul>

        {pageNo !== undefined && pagesCount !== undefined && (
          <PaginationPageDefault rounded page={pageNo} total={pagesCount} />
        )}
      </main>
    </div>
  );
}
