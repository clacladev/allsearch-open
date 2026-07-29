import { Page, expect } from '@playwright/test';
import { MAGIC_AUTH_URL, TEST_EMAIL, TEST_PROJECT_ID } from '../constants';

/**
 * Authenticates the test user through the full sign-in flow (email → OTP → dashboard).
 * Resolves when the page is on the project overview page.
 */
export async function authenticate(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('link', { name: 'Start Free Trial' }).first().click();

  await page.waitForURL('**/signin');
  await expect(page).toHaveURL(/\/signin/);

  await page.getByRole('textbox', { name: /email/i }).fill(TEST_EMAIL);

  // Intercept the Supabase OTP request to prevent sending a real email via Resend.
  // The test obtains the OTP from the admin API instead, so the email is unnecessary.
  await page.route(/\/auth\/v1\/otp/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  );

  await page.getByRole('button', { name: 'Continue with email' }).click();

  await expect(page.getByText('Secure code')).toBeVisible();

  await page.unroute(/\/auth\/v1\/otp/);

  const response = await page.request.get(MAGIC_AUTH_URL);
  expect(response.ok()).toBeTruthy();
  const { otp_code } = await response.json();
  expect(typeof otp_code).toBe('string');
  expect(otp_code).toHaveLength(6);

  const otpInput = page.locator('input[aria-label="Enter your pin"]');
  await otpInput.click();
  await otpInput.pressSequentially(otp_code);

  await page.getByRole('button', { name: 'Verify code' }).click();

  await page.waitForURL(`/project/${TEST_PROJECT_ID}`);
  await expect(page).toHaveURL(`/project/${TEST_PROJECT_ID}`);
}
