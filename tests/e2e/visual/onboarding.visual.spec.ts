import { test, expect } from '../helpers/test';

const domain = { name: 'Nike', iconUrl: '', url: 'https://nike.com' };
const topics = ['Running Shoes', 'Athletic Apparel'];
const prompts = [
  { topic: 'Running Shoes', prompts: ['Best running shoes for marathon training'] },
  { topic: 'Athletic Apparel', prompts: ['Best athletic clothing brands'] },
];
const competitors = [
  { name: 'Adidas', url: 'https://adidas.com', iconUrl: '' },
  { name: 'Puma', url: 'https://puma.com', iconUrl: '' },
];

test.describe('New-project onboarding — visual baseline', () => {
  test('brand, topics, prompts, and competitors states', async ({ page }, testInfo) => {
    test.setTimeout(45_000);
    await page.route('**/api/new-project/domain-metadata**', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(domain) })
    );
    await page.route('**/api/new-project/topics-ideas**', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(topics) })
    );
    await page.route('**/api/new-project/prompt-ideas**', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(prompts) })
    );
    await page.route('**/api/new-project/competitors**', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(competitors) })
    );

    const expectedThemeClass = testInfo.project.name === 'visual-dark' ? 'dark-mode' : 'light-mode';
    await page.goto('/new-project/brand');
    await page.getByRole('textbox', { name: /brand url/i }).fill('https://nike.com');
    await expect(page.getByRole('textbox', { name: /brand name/i })).toHaveValue('Nike');
    await expect(page.locator('html')).toHaveClass(new RegExp(expectedThemeClass));
    await expect(page).toHaveScreenshot('brand.png');

    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Suggested Topics' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Running Shoes' })).toBeChecked();
    await expect(page).toHaveScreenshot('topics.png');

    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Suggested Prompts' })).toBeVisible();
    await expect(
      page.getByRole('checkbox', { name: 'Best running shoes for marathon training' })
    ).toBeChecked();
    await expect(page).toHaveScreenshot('prompts.png');

    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Competitors Review' })).toBeVisible();
    await expect(page).toHaveScreenshot('competitors.png');
  });
});
