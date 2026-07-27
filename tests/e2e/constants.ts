export const TEST_EMAIL = 'test@allsearch.io';
export const TEST_PROJECT_ID = 'f98b24d2-2c46-43ec-975a-048d0c5eb103'; // Sportiva

export const MAGIC_AUTH_URL = '/api/admin/magic-auth';

// Date-range query string covering all seeded test data (currently 2026-03-02).
// Kept under MAX_ALLOWED_DAYS_IN_DATE_RANGE (120 days). Append to project URLs
// in tests that need rows/charts/opportunities to render.
export const TEST_DATE_RANGE = '?startDate=2026-03-01&endDate=2026-04-30';

// Page URLs
export const OVERVIEW_URL = `/project/${TEST_PROJECT_ID}`;
export const SOURCES_CONTENTS_URL = `/project/${TEST_PROJECT_ID}/sources/contents`;
export const SOURCES_DOMAINS_URL = `/project/${TEST_PROJECT_ID}/sources/domains`;
export const OPPORTUNITIES_URL = `/project/${TEST_PROJECT_ID}/opportunities`;
export const BRANDS_URL = `/project/${TEST_PROJECT_ID}/brands`;
export const SETTINGS_URL = `/project/${TEST_PROJECT_ID}/settings`;
export const SETTINGS_COMPETITORS_URL = `/project/${TEST_PROJECT_ID}/settings/competitors`;
export const SETTINGS_BRAND_URL = `/project/${TEST_PROJECT_ID}/settings/brand`;
export const SETTINGS_ORGANIZATION_URL = `/project/${TEST_PROJECT_ID}/settings/organization`;
export const ACCOUNT_SETTINGS_URL = '/account-settings';
