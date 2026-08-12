export const TEST_PROJECT_ID = '55bfbf5a-af2d-4510-b5b6-e0d5dfc6fd10'; // Meridian Run Co.

// Date-range query string covering all data in scripts/fixtures/demo-data.json.
// Kept under MAX_ALLOWED_DAYS_IN_DATE_RANGE (120 days). Append to project URLs
// in tests that need rows/charts/opportunities to render.
export const TEST_DATE_RANGE = '?startDate=2026-07-01&endDate=2026-08-31';

// Page URLs
export const OVERVIEW_URL = `/project/${TEST_PROJECT_ID}`;
export const SOURCES_CONTENTS_URL = `/project/${TEST_PROJECT_ID}/sources/contents`;
export const SOURCES_DOMAINS_URL = `/project/${TEST_PROJECT_ID}/sources/domains`;
export const OPPORTUNITIES_URL = `/project/${TEST_PROJECT_ID}/opportunities`;
export const BRANDS_URL = `/project/${TEST_PROJECT_ID}/brands`;
export const ACCOUNT_SETTINGS_URL = '/settings';
export const SETTINGS_URL = `/project/${TEST_PROJECT_ID}/settings`;
export const SETTINGS_COMPETITORS_URL = `/project/${TEST_PROJECT_ID}/settings/competitors`;
export const SETTINGS_BRAND_URL = `/project/${TEST_PROJECT_ID}/settings/brand`;
export const SETTINGS_ORGANIZATION_URL = `/project/${TEST_PROJECT_ID}/settings/organization`;
