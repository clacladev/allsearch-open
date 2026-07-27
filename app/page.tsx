import { getSEOTags } from '@/libs/seo';
import LayoutPublic from './(public)/layout';
import Homepage from './(public)/(index)/Homepage';
import { Metadata } from 'next';
import { config } from '@/config';

export const metadata: Metadata = getSEOTags({
  title: `${config.appName} - ${config.appDescription}`,
  description: config.longAppDescription,
  keywords: ['AI SEO for agencies', 'AI SEO agency', 'AI SEO agencies', ...config.keywords],
  ogImageTitle: 'Make Your Ecommerce Visible in AI Search',
});

export default function Home() {
  return (
    <LayoutPublic>
      <Homepage />
    </LayoutPublic>
  );
}
