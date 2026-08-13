import { expect, test } from '../helpers/test';
import { BRANDS_URL, OPPORTUNITIES_URL, SOURCES_CONTENTS_URL, SOURCES_DOMAINS_URL, TEST_DATE_RANGE } from '../constants';

const surfaces = [
  ['brands', BRANDS_URL],
  ['opportunities', OPPORTUNITIES_URL],
  ['source-contents', SOURCES_CONTENTS_URL],
  ['source-domains', SOURCES_DOMAINS_URL],
] as const;

test.describe('Data exploration — visual baseline', () => {
  for (const [name, url] of surfaces) {
    test(`${name} surface`, async ({ page }, testInfo) => {
      test.setTimeout(30_000);
      await page.goto(`${url}${TEST_DATE_RANGE}`);
      await expect(page.getByLabel('Date range picker')).toBeVisible();
      const expectedThemeClass = testInfo.project.name === 'visual-dark' ? 'dark-mode' : 'light-mode';
      await expect(page.locator('html')).toHaveClass(new RegExp(expectedThemeClass));
      await expect(page).toHaveScreenshot(`${name}.png`);
    });
  }
});
