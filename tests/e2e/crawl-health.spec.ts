import { test, expect } from './helpers/test';
import { TEST_PROJECT_ID } from './constants';

test('shows crawl health at its project-scoped home', async ({ page }) => {
  await page.route('**/api/tools/ai-crawl-checker', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        url: 'https://meridianrun.example',
        errorCategory: null,
        errorMessage: null,
        robotsTxt: {
          robotsUrl: 'https://meridianrun.example/robots.txt',
          status: 200,
          noRobotsTxt: false,
          error: null,
          bots: [
            {
              name: 'Googlebot',
              operator: 'Google',
              purpose: 'Search indexing',
              allowed: true,
              matchedAgents: ['Googlebot'],
            },
          ],
        },
        pageResponse: {
          finalUrl: 'https://meridianrun.example',
          status: 200,
          ok: true,
          redirectChain: ['https://meridianrun.example'],
          error: null,
        },
        rendering: {
          htmlBytes: 1_024,
          visibleTextLength: 512,
          hasMeaningfulContent: true,
          likelyClientSide: false,
          detectedFrameworks: ['Next.js'],
        },
        structuredData: {
          jsonLd: [{ type: 'Organization', valid: true }],
          openGraphCount: 1,
          twitterCardCount: 0,
          hasAnyStructuredData: true,
        },
      }),
    })
  );

  await page.goto(`/project/${TEST_PROJECT_ID}/crawl-health`);

  await expect(page.getByRole('heading', { name: 'Crawl health' })).toBeVisible();
  await expect(page.getByText('Page response')).toBeVisible();
  await expect(page.getByText('robots.txt bot access')).toBeVisible();
  await expect(page.getByText('Googlebot')).toBeVisible();
  await expect(page.getByText('Allowed')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Structured data' })).toBeVisible();
});
