import type { Metadata } from 'next';
import { config } from '@/config';
import { ROUTES } from './routes';

export const getSEOTags = ({
  title,
  description,
  keywords,
  openGraph,
  canonicalUrlRelative,
  extraTags,
  ogImageTitle,
}: Metadata & {
  canonicalUrlRelative?: string;
  extraTags?: Record<string, string | number | boolean | string[] | Record<string, unknown>>;
  ogImageTitle?: string;
} = {}) => {
  const ogImageUrl = ogImageTitle
    ? `${ROUTES.API.OPENGRAPH_IMAGE}?title=${encodeURIComponent(ogImageTitle)}`
    : ROUTES.API.OPENGRAPH_IMAGE;

  return {
    // up to 50 characters (what does your app do for the user?) > your main should be here
    title: title || config.appName,
    // up to 160 characters (how does your app help the user?)
    description,
    // some keywords separated by commas. by default it will be your app name
    keywords,
    applicationName: config.appName,
    // set a base URL prefix for other fields that require a fully qualified URL (.e.g og:image: og:image: 'https://yourdomain.com/share.png' => '/share.png')
    metadataBase: new URL(`https://${config.domainName}/`),

    openGraph: {
      ...(openGraph || {}),
      images: openGraph?.images || [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
        },
      ],
      title: openGraph?.title || title || config.appName,
      description: openGraph?.description || description || config.appDescription,
      url: openGraph?.url || `https://${config.domainName}/`,
      siteName: String(openGraph?.title || title || config.appName),
      locale: 'en_US',
      type: 'website',
    },

    twitter: {
      title: openGraph?.title || title || config.appName,
      description: openGraph?.description || description || config.appDescription,
      // If you add an twitter-image.(jpg|jpeg|png|gif) image to the /app folder, you don't need the code below
      // images: [openGraph?.image || defaults.og.image],
      card: 'summary_large_image',
      creator: '@clacladev',
    },

    // If a canonical URL is given, we add it. The metadataBase will turn the relative URL into a fully qualified URL
    ...(canonicalUrlRelative && {
      alternates: { canonical: canonicalUrlRelative },
    }),

    // If you want to add extra tags, you can pass them here
    ...extraTags,
  };
};

// Strctured Data for Rich Results on Google. Learn more: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
// Find your type here (SoftwareApp, Book...): https://developers.google.com/search/docs/appearance/structured-data/search-gallery
// Use this tool to check data is well structure: https://search.google.com/test/rich-results
// You don't have to use this component, but it increase your chances of having a rich snippet on Google.
// I recommend this one below to your /page.js for software apps: It tells Google your AppName is a Software, and it has a rating of 4.8/5 from 12 reviews.
// Fill the fields with your own data
// See https://shipfa.st/docs/features/seo
// export const renderSchemaTags = () => {
//   return (
//     <script
//       type="application/ld+json"
//       dangerouslySetInnerHTML={{
//         __html: JSON.stringify({
//           '@context': 'http://schema.org',
//           '@type': 'SoftwareApplication',
//           name: config.appName,
//           description: config.appDescription,
//           image: `https://${config.domainName}/app/icon.jpg`,
//           url: `https://${config.domainName}/`,
//           author: {
//             '@type': 'Person',
//             name: 'Claudio Carnino',
//           },
//           datePublished: '2025-08-06',
//           applicationCategory: 'BusinessApplication',
//           aggregateRating: {
//             '@type': 'AggregateRating',
//             ratingValue: '4.8',
//             ratingCount: '12',
//           },
//           offers: [
//             {
//               '@type': 'Offer',
//               price: '9.00',
//               priceCurrency: 'USD',
//             },
//           ],
//         }),
//       }}
//     ></script>
//   );
// };
