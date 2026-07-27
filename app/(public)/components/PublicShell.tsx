import { ReactNode } from 'react';
import { Footer } from '@/app/(public)/components/Footer';
import { Header } from '@/app/(public)/components/Header';
import ClientLayout from './ClientLayout';

export default function PublicShell({
  children,
  stripLinksFromHeaderAndFooter,
  stripCtaFromHeader,
}: {
  children: ReactNode;
  stripLinksFromHeaderAndFooter?: boolean;
  stripCtaFromHeader?: boolean;
}) {
  return (
    <body className="bg-secondary antialiased">
      <ClientLayout>
        <Header
          stripLinksFromHeaderAndFooter={stripLinksFromHeaderAndFooter}
          stripCtaFromHeader={stripCtaFromHeader}
        />
        <main className="min-h-dvh">{children}</main>
        <Footer stripLinksFromHeaderAndFooter={stripLinksFromHeaderAndFooter} />
      </ClientLayout>
    </body>
  );
}
