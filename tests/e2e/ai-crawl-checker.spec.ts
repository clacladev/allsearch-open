import { test, expect } from '@playwright/test';

// Public marketing page — does not require an authenticated session.
test.use({ storageState: { cookies: [], origins: [] } });

const successPayload = {
  url: 'https://example.com/',
  errorCategory: null,
  errorMessage: null,
  robotsTxt: {
    robotsUrl: 'https://example.com/robots.txt',
    status: 200,
    noRobotsTxt: false,
    bots: [
      {
        name: 'GPTBot',
        operator: 'OpenAI',
        purpose: 'Training',
        allowed: true,
        matchedAgents: ['*'],
      },
      {
        name: 'ClaudeBot',
        operator: 'Anthropic',
        purpose: 'Training crawler',
        allowed: false,
        matchedAgents: ['ClaudeBot'],
      },
    ],
    error: null,
  },
  pageResponse: {
    finalUrl: 'https://example.com/',
    status: 200,
    ok: true,
    redirectChain: ['https://example.com/'],
    error: null,
  },
  rendering: {
    htmlBytes: 12000,
    visibleTextLength: 1800,
    hasMeaningfulContent: true,
    likelyClientSide: false,
    detectedFrameworks: [],
  },
  structuredData: {
    jsonLd: [{ type: 'Article', valid: true }],
    openGraphCount: 4,
    twitterCardCount: 2,
    hasAnyStructuredData: true,
  },
};

test.describe('AI Crawlability Checker page', () => {
  test('page loads with hero, input, and example link', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto('/ai-crawl-checker');

    await expect(
      page.getByRole('heading', { level: 1, name: /AI Crawlability Checker/i })
    ).toBeVisible();
    await expect(page.getByPlaceholder('https://yourwebsite.com')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Check AI crawlability' })).toBeVisible();
    await expect(page.getByText('No signup required')).toBeVisible();
    await expect(page.getByText(/^Try/i)).toBeVisible();
  });

  test('Check button is disabled when input is empty', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto('/ai-crawl-checker');

    await expect(page.getByRole('button', { name: 'Check AI crawlability' })).toBeDisabled();
  });

  test('renders all four check cards after a successful check', async ({ page }) => {
    test.setTimeout(30_000);

    await page.route('**/api/tools/ai-crawl-checker', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(successPayload),
      });
    });

    await page.goto('/ai-crawl-checker');
    await page.getByPlaceholder('https://yourwebsite.com').fill('example.com');
    await page.getByRole('button', { name: 'Check AI crawlability' }).click();

    await expect(page.getByRole('heading', { name: 'Page response' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'robots.txt bot access' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Rendering' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Structured data' })).toBeVisible();
    await expect(page.getByText('GPTBot', { exact: true })).toBeVisible();
    await expect(page.getByText('ClaudeBot', { exact: true })).toBeVisible();
  });

  test('shows no-robots-txt summary when site has no robots.txt', async ({ page }) => {
    test.setTimeout(30_000);

    await page.route('**/api/tools/ai-crawl-checker', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...successPayload,
          robotsTxt: {
            ...successPayload.robotsTxt,
            status: 404,
            noRobotsTxt: true,
            bots: [
              {
                name: 'GPTBot',
                operator: 'OpenAI',
                purpose: 'Training',
                allowed: true,
                matchedAgents: null,
              },
            ],
          },
        }),
      });
    });

    await page.goto('/ai-crawl-checker');
    await page.getByPlaceholder('https://yourwebsite.com').fill('example.com');
    await page.getByRole('button', { name: 'Check AI crawlability' }).click();

    await expect(page.getByText(/no robots\.txt/i)).toBeVisible();
  });

  test('can recover from an error and submit a different URL', async ({ page }) => {
    test.setTimeout(30_000);

    let callCount = 0;
    await page.route('**/api/tools/ai-crawl-checker', async (route) => {
      callCount += 1;
      if (callCount === 1) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            url: 'not-a-url',
            errorCategory: 'invalid_url',
            errorMessage: 'Enter a valid URL like example.com',
            robotsTxt: null,
            pageResponse: null,
            rendering: null,
            structuredData: null,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(successPayload),
        });
      }
    });

    await page.goto('/ai-crawl-checker');
    const input = page.getByPlaceholder('https://yourwebsite.com');
    const button = page.getByRole('button', { name: 'Check AI crawlability' });

    await input.fill('not a url');
    await button.click();
    await expect(button).toBeEnabled();

    await input.fill('example.com');
    await button.click();
    await expect(page.getByRole('heading', { name: 'robots.txt bot access' })).toBeVisible();
    await expect(page.getByText('GPTBot', { exact: true })).toBeVisible();
    expect(callCount).toBe(2);
  });

  test('AI Crawlability Checker appears in the header on desktop', async ({ page }) => {
    test.setTimeout(30_000);
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.goto('/');

    await expect(
      page.locator('header').getByRole('link', { name: 'AI Crawlability Checker' })
    ).toBeVisible();
  });
});
