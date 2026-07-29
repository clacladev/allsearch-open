import { test, expect } from '@playwright/test';

test.describe('AI Visibility Tracker page', () => {
  test('page loads and renders key sections', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto('/ai-visibility-tracker');

    await expect(page.getByRole('heading', { level: 1, name: /AI Visibility/i })).toBeVisible();
    await expect(page.getByText('What you get')).toBeVisible();
    await expect(page.getByText('FAQs')).toBeVisible();
    await expect(page.getByText('How it works')).toBeVisible();
  });

  test('FAQ accordion expands on click', async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto('/ai-visibility-tracker');

    const faqButton = page.getByRole('button', { name: /What is AI visibility\?/i });
    await expect(faqButton).toBeVisible();
    await faqButton.click();

    await expect(
      page.getByText(/measures how often and how prominently your brand is mentioned/i)
    ).toBeVisible();
  });
});
