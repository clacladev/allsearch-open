export const ROUTES = {
  // Public
  HOME: '/',
  AEO_CONTENT_STRATEGY: '/aeo-content-strategy',
  AGENCIES: '/agencies',
  AI_PROMPT_TRACKING: '/ai-prompt-tracking-tool',
  AI_TRAFFIC_CITATION_TRACKING: '/ai-traffic-citation-and-source-tracking',
  AI_VISIBILITY_TRACKER: '/ai-visibility-tracker',
  AI_CRAWL_CHECKER: '/ai-crawl-checker',
  AI_PRODUCT_PROMPT_IDEAS: '/ai-product-prompt-ideas',
  SIGNIN: '/signin',
  BLOG: '/blog',
  TOS: '/tos',
  PRIVACY_POLICY: '/privacy-policy',

  // Private
  DASHBOARD: '/dashboard',
  ACCOUNT_SETTINGS: '/account-settings',
  ADMIN_PANEL: '/admin-panel',
  SUBSCRIPTION: '/subscription',

  // Organization
  ORGANIZATION: '/organization',

  // New Project
  NEW_PROJECT: {
    INDEX: '/new-project',
    BRAND: '/new-project/brand',
    TOPICS: '/new-project/topics',
    PROMPTS: '/new-project/prompts',
    COMPETITORS: '/new-project/competitors',
    SAVE: '/new-project/save',
    REPORT: '/new-project/report/:projectId',
  },

  // Project
  PROJECT: {
    OVERVIEW: '/project/:projectId',
    SOURCES_CONTENTS: '/project/:projectId/sources/contents',
    SOURCES_DOMAINS: '/project/:projectId/sources/domains',
    SOURCE_DETAILS: '/project/:projectId/sources/:sourceId',
    OPPORTUNITIES: '/project/:projectId/opportunities',
    OPPORTUNITY_DETAILS: '/project/:projectId/opportunities/:opportunityId',
    PROMPTS: '/project/:projectId/prompts',
    PROMPT_DETAILS: '/project/:projectId/prompts/:promptId',
    PROMPT_NEW_ARTICLE: '/project/:projectId/prompts/:promptId/new-article',
    BRANDS: '/project/:projectId/brands',
    SETTINGS: '/project/:projectId/settings',
    SETTINGS_TAB: '/project/:projectId/settings/:tabId',
  },

  // APIs
  API: {
    // Main
    AUTH_CALLBACK: '/api/auth/callback',
    SEARCH_CREATE: '/api/search/create',
    OPENGRAPH_IMAGE: '/api/opengraph-image',
    LEMONSQUEEZY_CREATE_PORTAL: '/api/lemonsqueezy/create-portal',
    LEMONSQUEEZY_CREATE_CHECKOUT: '/api/lemonsqueezy/create-checkout',

    // Tools
    AI_CRAWL_CHECKER: '/api/tools/ai-crawl-checker',
    AI_PRODUCT_PROMPT_IDEAS: '/api/tools/ai-product-prompt-ideas',

    // Organization
    ORGANIZATION: '/api/organization',
    ORGANIZATION_WITH_ID: '/api/organization/:organizationId',

    // New Project
    NEW_PROJECT: {
      DOMAIN_METADATA: '/api/new-project/domain-metadata',
      TOPICS_IDEAS: '/api/new-project/topics-ideas',
      PROMPT_IDEAS: '/api/new-project/prompt-ideas',
      COMPETITORS: '/api/new-project/competitors',
      SAVE: '/api/new-project/save',
      REPORT: '/api/new-project/report',
    },

    // Admin
    ADMIN: {
      PROJECT_PAUSE: '/api/admin/project/:projectId/pause',
      PROJECT_ARCHIVE: '/api/admin/project/:projectId/archive',
      PROJECT_CLONE: '/api/admin/project/:projectId/clone',
      PROJECT_DELETE: '/api/admin/project/:projectId/delete',
      PROJECT_FILL_PROMPT_RESPONSES: '/api/admin/project/:projectId/fill-prompt-responses',
    },

    // Project
    PROJECT: {
      PROJECT: '/api/project/:projectId',
      PROJECT_ARCHIVE: '/api/project/:projectId/archive',
      PROMPTS: '/api/project/:projectId/prompts',
      PROMPTS_ARCHIVE: '/api/project/:projectId/prompts/archive',
      TOPICS: '/api/project/:projectId/topics',
      COMPETITORS: '/api/project/:projectId/competitors',
      SOURCES: '/api/project/:projectId/sources',
      PROCESS_PROMPTS: '/api/process-prompts/:projectId',
      UPDATE_SOURCES_ANALYSIS:
        '/api/project/:projectId/update-last-day-of-prompt-responses-analysis',
      FETCH_NEW_PROMPT_RESPONSES: '/api/project/:projectId/fetch-new-prompt-responses',
      PROMPT_ARTICLES: '/api/project/:projectId/prompts/:promptId/prompt-articles',
      PROMPT_ARTICLE:
        '/api/project/:projectId/prompts/:promptId/prompt-articles/:promptArticleId',
      PROMPT_ARTICLE_BODY:
        '/api/project/:projectId/prompts/:promptId/prompt-articles/:promptArticleId/article',
      PROMPT_ARTICLE_BODY_DOWNLOAD_HTML:
        '/api/project/:projectId/prompts/:promptId/prompt-articles/:promptArticleId/article/download.html',
      PROMPT_ARTICLE_BODY_DOWNLOAD_DOCX:
        '/api/project/:projectId/prompts/:promptId/prompt-articles/:promptArticleId/article/download.docx',
      PROMPT_ARTICLE_BODY_DOWNLOAD_PDF:
        '/api/project/:projectId/prompts/:promptId/prompt-articles/:promptArticleId/article/download.pdf',
    },
  },
} as const;

export const RouteHelper = {
  NewProject: {
    getReport: (projectId: string) => ROUTES.NEW_PROJECT.REPORT.replace(':projectId', projectId),
  },

  Project: {
    getOverview: (projectId: string, startDate?: string, endDate?: string) =>
      ROUTES.PROJECT.OVERVIEW.replace(':projectId', projectId) +
      getUrlParamsString({ startDate, endDate }),
    getSourcesContents: (
      projectId: string,
      startDate?: string,
      endDate?: string,
      pageNo?: number,
      sortBy?: string,
      sortDir?: string,
      filters?: Record<string, string | undefined>
    ) =>
      ROUTES.PROJECT.SOURCES_CONTENTS.replace(':projectId', projectId) +
      getUrlParamsString({ startDate, endDate, pageNo: pageNo?.toString(), sortBy, sortDir, ...filters }),
    getSourcesDomains: (
      projectId: string,
      startDate?: string,
      endDate?: string,
      pageNo?: number,
      sortBy?: string,
      sortDir?: string,
      filters?: Record<string, string | undefined>
    ) =>
      ROUTES.PROJECT.SOURCES_DOMAINS.replace(':projectId', projectId) +
      getUrlParamsString({ startDate, endDate, pageNo: pageNo?.toString(), sortBy, sortDir, ...filters }),
    getSourceDetails: (
      projectId: string,
      sourceId: string,
      startDate?: string,
      endDate?: string,
      title?: string
    ) =>
      ROUTES.PROJECT.SOURCE_DETAILS.replace(':projectId', projectId).replace(
        ':sourceId',
        sourceId
      ) + getUrlParamsString({ startDate, endDate, title }),
    getOpportunities: (
      projectId: string,
      startDate?: string,
      endDate?: string,
      pageNo?: number,
      sortBy?: string,
      sortDir?: string,
      filters?: Record<string, string | undefined>
    ) =>
      ROUTES.PROJECT.OPPORTUNITIES.replace(':projectId', projectId) +
      getUrlParamsString({ startDate, endDate, pageNo: pageNo?.toString(), sortBy, sortDir, ...filters }),
    getOpportunityDetails: (
      projectId: string,
      opportunityId: string,
      startDate?: string,
      endDate?: string,
      title?: string
    ) =>
      ROUTES.PROJECT.OPPORTUNITY_DETAILS.replace(':projectId', projectId).replace(
        ':opportunityId',
        opportunityId
      ) + getUrlParamsString({ startDate, endDate, title }),
    getPromptNewArticle: (
      projectId: string,
      promptId: string,
      opportunityId?: string,
      promptArticleId?: string,
      startDate?: string,
      endDate?: string
    ) =>
      ROUTES.PROJECT.PROMPT_NEW_ARTICLE.replace(':projectId', projectId).replace(
        ':promptId',
        promptId
      ) + getUrlParamsString({ opportunityId, promptArticleId, startDate, endDate }),
    getPrompts: (
      projectId: string,
      startDate?: string,
      endDate?: string,
      showArchived?: string,
      sortBy?: string,
      sortDir?: string,
      filters?: Record<string, string | undefined>
    ) =>
      ROUTES.PROJECT.PROMPTS.replace(':projectId', projectId) +
      getUrlParamsString({ startDate, endDate, showArchived, sortBy, sortDir, ...filters }),
    getPromptDetails: (
      projectId: string,
      promptId: string,
      startDate?: string,
      endDate?: string,
      pageNo?: number
    ) =>
      ROUTES.PROJECT.PROMPT_DETAILS.replace(':projectId', projectId).replace(
        ':promptId',
        promptId
      ) + getUrlParamsString({ startDate, endDate, pageNo: pageNo?.toString() }),
    getBrands: (
      projectId: string,
      startDate?: string,
      endDate?: string,
      brandIds?: string[],
      pageNo?: number,
      sortBy?: string,
      sortDir?: string,
      filters?: Record<string, string | undefined>
    ) =>
      ROUTES.PROJECT.BRANDS.replace(':projectId', projectId) +
      getUrlParamsString({
        startDate,
        endDate,
        brandIds: brandIds?.length ? brandIds.join(',') : undefined,
        pageNo: pageNo?.toString(),
        sortBy,
        sortDir,
        ...filters,
      }),
    getSettings: (projectId: string) => ROUTES.PROJECT.SETTINGS.replace(':projectId', projectId),

    Settings: {
      getCompetitors: (projectId: string) =>
        ROUTES.PROJECT.SETTINGS_TAB.replace(':projectId', projectId).replace(
          ':tabId',
          'competitors'
        ),
      getBrand: (projectId: string) =>
        ROUTES.PROJECT.SETTINGS_TAB.replace(':projectId', projectId).replace(':tabId', 'brand'),
      getOrganization: (projectId: string) =>
        ROUTES.PROJECT.SETTINGS_TAB.replace(':projectId', projectId).replace(
          ':tabId',
          'organization'
        ),
      getOthers: (projectId: string) =>
        ROUTES.PROJECT.SETTINGS_TAB.replace(':projectId', projectId).replace(':tabId', 'others'),
      getAdminTools: (projectId: string) =>
        ROUTES.PROJECT.SETTINGS_TAB.replace(':projectId', projectId).replace(
          ':tabId',
          'admin-tools'
        ),
    },
  },

  Api: {
    getOrganization: (organizationId: string) =>
      ROUTES.API.ORGANIZATION_WITH_ID.replace(':organizationId', organizationId),

    Admin: {
      getProjectPause: (projectId: string) =>
        ROUTES.API.ADMIN.PROJECT_PAUSE.replace(':projectId', projectId),
      getProjectArchive: (projectId: string) =>
        ROUTES.API.ADMIN.PROJECT_ARCHIVE.replace(':projectId', projectId),
      getProjectClone: (projectId: string) =>
        ROUTES.API.ADMIN.PROJECT_CLONE.replace(':projectId', projectId),
      getProjectDelete: (projectId: string) =>
        ROUTES.API.ADMIN.PROJECT_DELETE.replace(':projectId', projectId),
      getProjectFillPromptResponses: (projectId: string) =>
        ROUTES.API.ADMIN.PROJECT_FILL_PROMPT_RESPONSES.replace(':projectId', projectId),
    },

    NewProject: {
      getDomainMetadata: (url: string) =>
        ROUTES.API.NEW_PROJECT.DOMAIN_METADATA + getUrlParamsString({ url }),
      getTopicsIdeas: (url: string, name: string) =>
        ROUTES.API.NEW_PROJECT.TOPICS_IDEAS + getUrlParamsString({ url, name }),
      getPromptIdeas: (url: string, name: string, categories: string[], targetLocation?: string) =>
        ROUTES.API.NEW_PROJECT.PROMPT_IDEAS +
        getUrlParamsString({
          url,
          name,
          categories: JSON.stringify(categories),
          targetLocation,
        }),
      getCompetitors: (url: string, name: string, categories: string[], targetLocation?: string) =>
        ROUTES.API.NEW_PROJECT.COMPETITORS +
        getUrlParamsString({
          url,
          name,
          categories: JSON.stringify(categories),
          targetLocation,
        }),
      getReport: (projectId: string) =>
        ROUTES.API.NEW_PROJECT.REPORT + getUrlParamsString({ projectId }),
    },

    Project: {
      getProject: (projectId: string) =>
        ROUTES.API.PROJECT.PROJECT.replace(':projectId', projectId),
      getProjectArchive: (projectId: string) =>
        ROUTES.API.PROJECT.PROJECT_ARCHIVE.replace(':projectId', projectId),
      getPrompts: (
        projectId: string,
        startDate?: string,
        endDate?: string,
        showArchived?: string
      ) =>
        ROUTES.API.PROJECT.PROMPTS.replace(':projectId', projectId) +
        getUrlParamsString({ startDate, endDate, showArchived }),
      getPromptsArchive: (projectId: string) =>
        ROUTES.API.PROJECT.PROMPTS_ARCHIVE.replace(':projectId', projectId),
      getTopics: (projectId: string) =>
        ROUTES.API.PROJECT.TOPICS.replace(':projectId', projectId),
      getCompetitors: (projectId: string) =>
        ROUTES.API.PROJECT.COMPETITORS.replace(':projectId', projectId),
      getSources: (
        projectId: string,
        type: string,
        startDate: string,
        endDate: string,
        page: number
      ) =>
        ROUTES.API.PROJECT.SOURCES.replace(':projectId', projectId) +
        getUrlParamsString({ type, startDate, endDate, page: page.toString() }),
      getProcessPrompts: (projectId: string, shouldForce?: boolean) =>
        ROUTES.API.PROJECT.PROCESS_PROMPTS.replace(':projectId', projectId) +
        getUrlParamsString({ shouldForce: shouldForce ? 'true' : undefined }),
      getUpdateSourcesAnalysis: (projectId: string) =>
        ROUTES.API.PROJECT.UPDATE_SOURCES_ANALYSIS.replace(':projectId', projectId),
      getFetchNewPromptResponses: (projectId: string) =>
        ROUTES.API.PROJECT.FETCH_NEW_PROMPT_RESPONSES.replace(':projectId', projectId),
      getPromptArticles: (projectId: string, promptId: string) =>
        ROUTES.API.PROJECT.PROMPT_ARTICLES.replace(':projectId', projectId).replace(
          ':promptId',
          promptId
        ),
      getPromptArticle: (projectId: string, promptId: string, promptArticleId: string) =>
        ROUTES.API.PROJECT.PROMPT_ARTICLE.replace(':projectId', projectId)
          .replace(':promptId', promptId)
          .replace(':promptArticleId', promptArticleId),
      getPromptArticleBody: (projectId: string, promptId: string, promptArticleId: string) =>
        ROUTES.API.PROJECT.PROMPT_ARTICLE_BODY.replace(':projectId', projectId)
          .replace(':promptId', promptId)
          .replace(':promptArticleId', promptArticleId),
      getPromptArticleBodyDownloadHtml: (
        projectId: string,
        promptId: string,
        promptArticleId: string
      ) =>
        ROUTES.API.PROJECT.PROMPT_ARTICLE_BODY_DOWNLOAD_HTML.replace(':projectId', projectId)
          .replace(':promptId', promptId)
          .replace(':promptArticleId', promptArticleId),
      getPromptArticleBodyDownloadDocx: (
        projectId: string,
        promptId: string,
        promptArticleId: string
      ) =>
        ROUTES.API.PROJECT.PROMPT_ARTICLE_BODY_DOWNLOAD_DOCX.replace(':projectId', projectId)
          .replace(':promptId', promptId)
          .replace(':promptArticleId', promptArticleId),
      getPromptArticleBodyDownloadPdf: (
        projectId: string,
        promptId: string,
        promptArticleId: string
      ) =>
        ROUTES.API.PROJECT.PROMPT_ARTICLE_BODY_DOWNLOAD_PDF.replace(':projectId', projectId)
          .replace(':promptId', promptId)
          .replace(':promptArticleId', promptArticleId),
    },
  },
};

// --- Helpers ---

function getUrlParamsString(params: Record<string, string | undefined>) {
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== undefined)
  ) as Record<string, string>;
  if (!Object.keys(filteredParams).length) return '';
  return '?' + new URLSearchParams(filteredParams).toString();
}
