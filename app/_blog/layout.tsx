import Header from './_assets/components/Header';
import { Footer } from '../(public)/components/Footer';

export default async function LayoutBlog({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto min-h-dvh py-8">{children}</main>
      <Footer />
    </>
  );
}
