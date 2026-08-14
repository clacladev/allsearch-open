import { ReactNode } from 'react';
import { NewProjectContextProvider } from './new-project/components/NewProjectContext';
import ClientLayout from '@/components/ClientLayout';
import { cn } from '@/libs/utils/cn';
import Image from 'next/image';

// This app has no user identity, so nothing here reads a session cookie or other
// dynamic API — the signal that used to force per-request rendering implicitly.
// Pages in this group read the per-install SQLite database, so without this
// export Next.js would statically prerender them at build time (against whatever
// database exists then, or fail the build if it doesn't exist yet) and freeze that
// snapshot into the served HTML forever.
export const dynamic = 'force-dynamic';

export function NewProjectLayoutColumn({
  size = 'md',
  children,
}: {
  size?: 'md' | 'lg';
  children: ReactNode;
}) {
  return (
    <div
      className={cn('flex w-full flex-col gap-8', size === 'md' ? 'md:max-w-md' : 'md:max-w-2xl')}
    >
      {children}
    </div>
  );
}

export default function NewProjectLayout({ children }: { children: ReactNode }) {
  return (
    <body className="bg-secondary antialiased">
      <ClientLayout>
        <NewProjectContextProvider>
          <main className="min-h-dvh">
            <section className="bg-primary grid min-h-screen grid-cols-1 xl:grid-cols-3">
              {/* Main column with content */}
              <div className="bg-primary flex flex-col xl:col-span-2">
                <div className="flex flex-1 justify-center px-4 py-12 md:px-8 md:py-32">
                  {children}
                </div>
              </div>

              {/* Decoration column */}
              <div className="bg-tertiary relative hidden items-center overflow-hidden pl-24 xl:flex">
                <div className="bg-primary ring-utility-neutral-300 rounded-[9.03px] p-[0.9px] shadow-lg ring-[0.56px] ring-inset md:rounded-[26.95px] md:p-[3.5px] md:ring-[1.68px]">
                  <div className="bg-primary shadow-modern-mockup-inner-md md:shadow-modern-mockup-inner-lg rounded-[7.9px] p-0.5 md:rounded-[23.58px] md:p-1">
                    <div className="bg-utility-neutral-50 ring-utility-neutral-200 relative overflow-hidden rounded-[6.77px] ring-[0.56px] md:rounded-[20.21px] md:ring-[1.68px]">
                      <Image
                        src="/index/dashboard-desktop-light.webp"
                        className="max-h-168.5 max-w-none object-contain object-top-left dark:hidden"
                        alt="AI Analytics dashboard interface showing brand visibility charts and improvement opportunities"
                        width={3000}
                        height={1828}
                      />
                      <Image
                        src="/index/dashboard-desktop-dark.webp"
                        className="max-h-168.5 max-w-none object-contain object-top-left not-dark:hidden"
                        alt="AI Analytics dashboard interface showing brand visibility charts and improvement opportunities"
                        width={2996}
                        height={1824}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </NewProjectContextProvider>
      </ClientLayout>
    </body>
  );
}
