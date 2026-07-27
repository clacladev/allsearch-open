import { describe, expect, it } from 'bun:test';
import { getSEOTags } from '@/libs/seo';
import { config } from '@/config';
import { ROUTES } from '@/libs/routes';

const OG_IMAGE_URL = ROUTES.API.OPENGRAPH_IMAGE;
const EXPECTED_WIDTH = 1200;
const EXPECTED_HEIGHT = 630;

describe('OpenGraph image meta tags', () => {
  describe('default OG image (no overrides)', () => {
    const tags = getSEOTags();

    it('sets og:image to the API endpoint', () => {
      const images = tags.openGraph?.images as Array<{ url: string }>;
      expect(images).toBeDefined();
      expect(images.length).toBeGreaterThan(0);
      expect(images[0].url).toBe(OG_IMAGE_URL);
    });

    it('sets correct image dimensions', () => {
      const images = tags.openGraph?.images as Array<{
        url: string;
        width: number;
        height: number;
      }>;
      expect(images[0].width).toBe(EXPECTED_WIDTH);
      expect(images[0].height).toBe(EXPECTED_HEIGHT);
    });

    it('sets og:type to website', () => {
      expect(tags.openGraph?.type).toBe('website');
    });

    it('sets og:locale to en_US', () => {
      expect(tags.openGraph?.locale).toBe('en_US');
    });

    it('sets og:title to app name when no title provided', () => {
      expect(tags.openGraph?.title).toBe(config.appName);
    });

    it('sets og:description to appDescription when none provided', () => {
      expect(tags.openGraph?.description).toBe(config.appDescription);
    });

    it('sets og:url to production domain', () => {
      expect(tags.openGraph?.url).toBe(`https://${config.domainName}/`);
    });

    it('sets twitter:card to summary_large_image', () => {
      expect(tags.twitter?.card).toBe('summary_large_image');
    });

    it('sets twitter:creator', () => {
      expect(tags.twitter?.creator).toBe('@clacladev');
    });
  });

  describe('ogImageTitle parameter', () => {
    it('appends title as query param when ogImageTitle is provided', () => {
      const tags = getSEOTags({
        title: 'Test Page',
        ogImageTitle: 'My Custom Title',
      });
      const images = tags.openGraph?.images as Array<{ url: string }>;
      expect(images[0].url).toBe(`${OG_IMAGE_URL}?title=${encodeURIComponent('My Custom Title')}`);
    });

    it('uses bare URL when ogImageTitle is not provided', () => {
      const tags = getSEOTags({ title: 'Test Page' });
      const images = tags.openGraph?.images as Array<{ url: string }>;
      expect(images[0].url).toBe(OG_IMAGE_URL);
    });

    it('encodes special characters in ogImageTitle', () => {
      const tags = getSEOTags({
        title: 'Test',
        ogImageTitle: "Agency's AI & SEO",
      });
      const images = tags.openGraph?.images as Array<{ url: string }>;
      expect(images[0].url).toBe(
        `${OG_IMAGE_URL}?title=${encodeURIComponent("Agency's AI & SEO")}`
      );
    });

    it('does not override custom openGraph.images', () => {
      const customImage = { url: '/custom-og.png', width: 1200, height: 660 };
      const tags = getSEOTags({
        title: 'Custom Page',
        ogImageTitle: 'Should Be Ignored',
        openGraph: { images: [customImage] },
      });
      const images = tags.openGraph?.images as Array<{ url: string }>;
      expect(images[0].url).toBe('/custom-og.png');
    });
  });

  describe('homepage metadata', () => {
    const tags = getSEOTags({
      title: `${config.appName} - ${config.appDescription}`,
      description: config.longAppDescription,
      keywords: ['AI SEO for agencies', 'AI SEO agency', 'AI SEO agencies', ...config.keywords],
      ogImageTitle: 'Make Your Ecommerce Visible in AI Search',
    });

    it('uses page title for og:title', () => {
      expect(tags.openGraph?.title).toBe(`${config.appName} - ${config.appDescription}`);
    });

    it('uses longAppDescription for og:description', () => {
      expect(tags.openGraph?.description).toBe(config.longAppDescription);
    });

    it('uses parameterized OG image URL with hero H1', () => {
      const images = tags.openGraph?.images as Array<{ url: string }>;
      expect(images[0].url).toBe(
        `${OG_IMAGE_URL}?title=${encodeURIComponent('Make Your Ecommerce Visible in AI Search')}`
      );
    });
  });

  describe('AEO content strategy page metadata', () => {
    const tags = getSEOTags({
      title: `${config.appName} - AEO Content Strategy`,
      description:
        'AEO Content Strategy built around your AI content gaps. Discover what to create, what to optimize, and where to engage to improve AI visibility.',
      keywords: ['AEO content strategy', 'AI content gaps', 'AI visibility strategy', ...config.keywords],
      ogImageTitle: 'AEO Content Strategy built around Your AI Content Gaps.',
    });

    it('uses correct og:title', () => {
      expect(tags.openGraph?.title).toBe(`${config.appName} - AEO Content Strategy`);
    });

    it('uses parameterized OG image URL with hero H1', () => {
      const images = tags.openGraph?.images as Array<{ url: string }>;
      expect(images[0].url).toBe(
        `${OG_IMAGE_URL}?title=${encodeURIComponent('AEO Content Strategy built around Your AI Content Gaps.')}`
      );
    });
  });

  describe('agencies page metadata', () => {
    const tags = getSEOTags({
      title: `${config.appName} for Agencies | AI Visibility Tracking & AEO Reporting at Scale`,
      description:
        'Track AI brand visibility for all your clients in one place. Reliable LLM data, white-label reports, and AEO content strategy built for agencies.',
      keywords: ['AI SEO agency', 'agency AI search monitoring', ...config.keywords],
      ogImageTitle: 'The Most Reliable AI Visibility Data for Agencies from Tracking to Content',
    });

    it('uses correct og:title', () => {
      expect(tags.openGraph?.title).toBe(
        `${config.appName} for Agencies | AI Visibility Tracking & AEO Reporting at Scale`
      );
    });

    it('uses parameterized OG image URL with hero H1', () => {
      const images = tags.openGraph?.images as Array<{ url: string }>;
      expect(images[0].url).toBe(
        `${OG_IMAGE_URL}?title=${encodeURIComponent('The Most Reliable AI Visibility Data for Agencies from Tracking to Content')}`
      );
    });
  });

  describe('AI prompt tracking tool page metadata', () => {
    const tags = getSEOTags({
      title: `AI Prompt Tracking Tool | ${config.appName}`,
      description:
        'Generate, import, and track AI prompts across ChatGPT, Perplexity, and Google AI Overviews. See your brand visibility instantly.',
      canonicalUrlRelative: '/ai-prompt-tracking-tool',
      ogImageTitle: 'The AI Prompt Tracking Tool Built for AI Visibility',
    });

    it('uses correct og:title', () => {
      expect(tags.openGraph?.title).toBe(`AI Prompt Tracking Tool | ${config.appName}`);
    });

    it('uses parameterized OG image URL with hero H1', () => {
      const images = tags.openGraph?.images as Array<{ url: string }>;
      expect(images[0].url).toBe(
        `${OG_IMAGE_URL}?title=${encodeURIComponent('The AI Prompt Tracking Tool Built for AI Visibility')}`
      );
    });

    it('sets canonical URL', () => {
      expect(tags.alternates?.canonical).toBe('/ai-prompt-tracking-tool');
    });
  });

  describe('AI traffic citation page metadata', () => {
    const tags = getSEOTags({
      title: `AI Traffic Citation & Source Tracking Tool | ${config.appName}`,
      description:
        'Track every AI traffic source and citation across ChatGPT, Perplexity, Google AI Overviews, and more. Understand where AI pulls your content from and when it links to you and close the gap.',
      canonicalUrlRelative: '/ai-traffic-citation-and-source-tracking',
      ogImageTitle: 'AI Traffic Citation & Source Tracking Tool',
    });

    it('uses correct og:title', () => {
      expect(tags.openGraph?.title).toBe(
        `AI Traffic Citation & Source Tracking Tool | ${config.appName}`
      );
    });

    it('uses parameterized OG image URL with hero H1', () => {
      const images = tags.openGraph?.images as Array<{ url: string }>;
      expect(images[0].url).toBe(
        `${OG_IMAGE_URL}?title=${encodeURIComponent('AI Traffic Citation & Source Tracking Tool')}`
      );
    });
  });

  describe('AI visibility tracker page metadata', () => {
    const tags = getSEOTags({
      title: `AI Visibility Tracker Tool | ${config.appName}`,
      description:
        'Analyze your brand positioning in Perplexity, ChatGPT & Gemini. Allsearch tracks AI visibility and identifies content opportunities to optimize your presence.',
      canonicalUrlRelative: '/ai-visibility-tracker',
      ogImageTitle: 'AI Visibility Tracker Tool',
    });

    it('uses correct og:title', () => {
      expect(tags.openGraph?.title).toBe(`AI Visibility Tracker Tool | ${config.appName}`);
    });

    it('uses parameterized OG image URL with hero H1', () => {
      const images = tags.openGraph?.images as Array<{ url: string }>;
      expect(images[0].url).toBe(
        `${OG_IMAGE_URL}?title=${encodeURIComponent('AI Visibility Tracker Tool')}`
      );
    });
  });

  describe('landing page: lp-seo-agencies metadata', () => {
    const tags = getSEOTags({
      title: `${config.appName} - Make Your Agency's AI SEO Service Actually Scalable.`,
      description:
        'Run AI SEO for 20+ clients in one place with prompt data and clear AEO action plans, saving 30+ hours per account monthly.',
      ogImageTitle: "Make Your Agency's AI SEO Service Actually Scalable.",
    });

    it('uses correct og:title', () => {
      expect(tags.openGraph?.title).toBe(
        `${config.appName} - Make Your Agency's AI SEO Service Actually Scalable.`
      );
    });

    it('uses parameterized OG image URL with hero H1', () => {
      const images = tags.openGraph?.images as Array<{ url: string }>;
      expect(images[0].url).toBe(
        `${OG_IMAGE_URL}?title=${encodeURIComponent("Make Your Agency's AI SEO Service Actually Scalable.")}`
      );
    });
  });

  describe('landing page: lp-ai-visibility metadata', () => {
    const tags = getSEOTags({
      title: `${config.appName} - AI Visibility Tracker | Monitor Brand Citations Across AI Engines`,
      description:
        'Track your brand visibility across ChatGPT, Google AI, Perplexity and more. Monitor AI citations, analyze competitors, and get an actionable AEO content strategy.',
      canonicalUrlRelative: '/lp-ai-visibility',
      ogImageTitle: "Track Your Brand's AI Visibility Across Every Answer Engine.",
    });

    it('uses correct og:title', () => {
      expect(tags.openGraph?.title).toBe(
        `${config.appName} - AI Visibility Tracker | Monitor Brand Citations Across AI Engines`
      );
    });

    it('uses parameterized OG image URL with hero H1', () => {
      const images = tags.openGraph?.images as Array<{ url: string }>;
      expect(images[0].url).toBe(
        `${OG_IMAGE_URL}?title=${encodeURIComponent("Track Your Brand's AI Visibility Across Every Answer Engine.")}`
      );
    });

    it('sets canonical URL', () => {
      expect(tags.alternates?.canonical).toBe('/lp-ai-visibility');
    });
  });

  describe('landing page: lp-action metadata', () => {
    const tags = getSEOTags({
      title: `${config.appName} - Growing AI Traffic is Easy with the Right Action List`,
      description:
        'Custom action lists are generated and automatically updated using your prompts and competitor data for ChatGPT, Perplexity, and Google AI',
      ogImageTitle: 'Growing AI Traffic is Easy with the Right Action List.',
    });

    it('uses correct og:title', () => {
      expect(tags.openGraph?.title).toBe(
        `${config.appName} - Growing AI Traffic is Easy with the Right Action List`
      );
    });

    it('uses parameterized OG image URL with hero H1', () => {
      const images = tags.openGraph?.images as Array<{ url: string }>;
      expect(images[0].url).toBe(
        `${OG_IMAGE_URL}?title=${encodeURIComponent('Growing AI Traffic is Easy with the Right Action List.')}`
      );
    });
  });

  describe('blog page metadata', () => {
    const tags = getSEOTags({
      title: `${config.appName} Blog`,
      description: config.shortAppDescription,
      ogImageTitle: 'Stories and interviews',
    });

    it('uses correct og:title', () => {
      expect(tags.openGraph?.title).toBe(`${config.appName} Blog`);
    });

    it('uses parameterized OG image URL with hero H1', () => {
      const images = tags.openGraph?.images as Array<{ url: string }>;
      expect(images[0].url).toBe(
        `${OG_IMAGE_URL}?title=${encodeURIComponent('Stories and interviews')}`
      );
    });
  });

  describe('custom openGraph image override', () => {
    const customImage = { url: '/custom-og.png', width: 1200, height: 660 };
    const tags = getSEOTags({
      title: 'Custom Page',
      openGraph: { images: [customImage] },
    });

    it('uses the custom image instead of the default', () => {
      const images = tags.openGraph?.images as Array<{ url: string }>;
      expect(images[0].url).toBe('/custom-og.png');
    });

    it('preserves custom dimensions', () => {
      const images = tags.openGraph?.images as Array<{
        url: string;
        width: number;
        height: number;
      }>;
      expect(images[0].width).toBe(1200);
      expect(images[0].height).toBe(660);
    });
  });

  describe('metadataBase', () => {
    const tags = getSEOTags();

    it('sets metadataBase to the production domain', () => {
      expect(tags.metadataBase?.toString()).toBe(`https://${config.domainName}/`);
    });
  });

  describe('all pages share consistent OG structure', () => {
    const pageConfigs = [
      {
        name: 'homepage',
        args: {
          title: `${config.appName} - ${config.appDescription}`,
          ogImageTitle: 'Make Your Ecommerce Visible in AI Search',
        },
      },
      {
        name: 'AEO content strategy',
        args: {
          title: `${config.appName} - AEO Content Strategy`,
          ogImageTitle: 'AEO Content Strategy built around Your AI Content Gaps.',
        },
      },
      {
        name: 'agencies',
        args: {
          title: `${config.appName} for Agencies`,
          ogImageTitle:
            'The Most Reliable AI Visibility Data for Agencies from Tracking to Content',
        },
      },
      {
        name: 'AI prompt tracking',
        args: {
          title: `AI Prompt Tracking Tool | ${config.appName}`,
          ogImageTitle: 'The AI Prompt Tracking Tool Built for AI Visibility',
        },
      },
      {
        name: 'AI traffic citation',
        args: {
          title: `AI Traffic Citation & Source Tracking Tool | ${config.appName}`,
          ogImageTitle: 'AI Traffic Citation & Source Tracking Tool',
        },
      },
      {
        name: 'AI visibility tracker',
        args: {
          title: `AI Visibility Tracker Tool | ${config.appName}`,
          ogImageTitle: 'AI Visibility Tracker Tool',
        },
      },
      {
        name: 'lp-seo-agencies',
        args: {
          title: `${config.appName} - SEO Agencies LP`,
          ogImageTitle: "Make Your Agency's AI SEO Service Actually Scalable.",
        },
      },
      {
        name: 'lp-ai-visibility',
        args: {
          title: `${config.appName} - AI Visibility LP`,
          ogImageTitle: "Track Your Brand's AI Visibility Across Every Answer Engine.",
        },
      },
      {
        name: 'lp-action',
        args: {
          title: `${config.appName} - Action LP`,
          ogImageTitle: 'Growing AI Traffic is Easy with the Right Action List.',
        },
      },
      {
        name: 'blog',
        args: {
          title: `${config.appName} Blog`,
          ogImageTitle: 'Stories and interviews',
        },
      },
    ];

    for (const page of pageConfigs) {
      it(`${page.name}: has og:image with page-specific title param`, () => {
        const tags = getSEOTags(page.args);
        const images = tags.openGraph?.images as Array<{ url: string }>;
        expect(images[0].url).toBe(
          `${OG_IMAGE_URL}?title=${encodeURIComponent(page.args.ogImageTitle)}`
        );
      });

      it(`${page.name}: has correct image dimensions`, () => {
        const tags = getSEOTags(page.args);
        const images = tags.openGraph?.images as Array<{
          url: string;
          width: number;
          height: number;
        }>;
        expect(images[0].width).toBe(EXPECTED_WIDTH);
        expect(images[0].height).toBe(EXPECTED_HEIGHT);
      });

      it(`${page.name}: has og:type as website`, () => {
        const tags = getSEOTags(page.args);
        expect(tags.openGraph?.type).toBe('website');
      });

      it(`${page.name}: has twitter:card as summary_large_image`, () => {
        const tags = getSEOTags(page.args);
        expect(tags.twitter?.card).toBe('summary_large_image');
      });
    }

    it('each page has a unique OG image URL', () => {
      const urls = pageConfigs.map((page) => {
        const tags = getSEOTags(page.args);
        const images = tags.openGraph?.images as Array<{ url: string }>;
        return images[0].url;
      });
      const uniqueUrls = new Set(urls);
      expect(uniqueUrls.size).toBe(pageConfigs.length);
    });
  });
});
