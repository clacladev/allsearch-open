import { isDevEnv, isPreviewEnv, isProdEnv } from './libs/env';
import { ROUTES } from './libs/routes';

export const config = {
  appName: 'AllSearch',
  appDescription: "Make Your Agency's AI SEO Service Scale Across Every Client Account",
  shortAppDescription:
    'AI Visibility data and AEO content strategy across your entire client portfolio, built around your content and reporting workflow',
  longAppDescription:
    "Make Your Agency's AI SEO Service Scale Across Every Client Account. AI Visibility data and AEO content strategy across your entire client portfolio, built around your content and reporting workflow",
  domainName: isDevEnv ? 'localhost:3000' : isPreviewEnv ? 'mirage.allsearch.io' : 'allsearch.io',
  appNameWithDomain: 'AllSearch.io',
  keywords: [
    'allsearch',
    'all search',
    'generative engine optimization',
    'GEO analytics',
    'AI search traffic',
    'AI search visibility',
    'ChatGPT SEO',
    'Perplexity optimization',
    'Google AI Mode',
    'generative search optimization',
    'AI engine ranking',
    'AI citation tracking',
    'ChatGPT ranking',
    'Gemini optimization',
    'AI search analytics',
    'generative AI optimization',
    'AI visibility dashboard',
    'prompt intelligence',
    'competitor AI tracking',
    'AI search performance',
    'LLM optimization',
    'AI engine visibility',
    'generative search traffic',
    'AI search marketing',
    'content optimization AI engines',
    'AI search competitor analysis',
    'brand visibility AI',
    'AI search monitoring',
    'GEO opportunities',
    'AI engine analytics',
  ],
  companyName: 'Tugulab Ltd',
  email: {
    // REQUIRED — Email 'From' field to be used when sending magic login links
    fromNoReply: `AllSearch <noreply@allsearch.io>`,
    // REQUIRED — Email 'From' field to be used when sending other emails, like abandoned carts, updates etc..
    fromAdmin: `Claudio at AllSearch <hello@allsearch.io>`,
    // Email shown to customer if need support. Leave empty if not needed => if empty, set up Crisp above, otherwise you won't be able to offer customer support."
    supportEmail: 'hello@allsearch.io',
    // When someone replies to supportEmail sent by the app, forward it to the email below (otherwise it's lost). If you set supportEmail to empty, this will be ignored.
    forwardRepliesTo: 'hello@allsearch.io',
  },
  colors: {
    // REQUIRED — This color will be reflected on the whole app outside of the document (loading bar, Chrome tabs, etc..)
    main: 'var(--color-brand-500)', // #55c891
  },
  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /dashboard)
    loginUrl: ROUTES.SIGNIN,
    // REQUIRED — the path you want to redirect users after successfull login (i.e. /dashboard, /private)
    callbackUrl: ROUTES.DASHBOARD,
  },
  lemonsqueezy: {
    // TODO: update product ids
    productId: isProdEnv ? 'TBD' : 'TBD',
    plansIds: {
      starter: isProdEnv ? 'TBD' : 'TBD',
      pro: isProdEnv ? 'TBD' : 'TBD',
      // ultra: isProd ? 'TBD' : 'TBD',
    },
  },
};
