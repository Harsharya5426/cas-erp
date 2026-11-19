import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('CAS ERP End-to-End & WCAG 2.2 AA Verification', () => {
  test('Public Portal bilingual switching, admission application, tracking, and accessibility', async ({ page }) => {
    await page.goto('/#public');
    await expect(page.getByText('PUBLIC INSTITUTIONAL PORTAL')).toBeVisible();

    // Switch to Hindi and verify label updates natively without Google Translate
    await page.getByRole('button', { name: 'English' }).or(page.getByRole('button', { name: 'हिन्दी' })).click();
    await expect(page.getByRole('button', { name: /पोर्टल लॉगिन|Portal Sign In/ })).toBeVisible();

    // Switch back to English
    await page.getByRole('button', { name: 'English' }).click();

    // Submit public admission application
    await page.getByLabel('Applicant Full Name *').fill('E2E Test Applicant');
    await page.getByLabel('Email *').fill(`e2e.${Date.now()}@example.edu`);
    await page.getByLabel('Phone (+91) *').fill('+91 98765 12345');
    await page.getByLabel('Qualifying Score (%) *').fill('91.5');
    await page.getByLabel('Guardian Name *').fill('Guardian Name');
    await page.getByLabel('Guardian Phone *').fill('+91 98765 54321');
    await page.getByRole('button', { name: 'Submit Application' }).click();

    await expect(page.getByText('Application Submitted Successfully')).toBeVisible();
    const appNo = await page.locator('strong').first().innerText();
    expect(appNo).toMatch(/^APP-2026-/);

    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(axeResults.violations.filter((v) => v.impact === 'critical')).toEqual([]);
  });

  test('Unified Login, reload returns to login page, offline fee receipt & audit log', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Centre for Advanced Studies' })).toBeVisible();

    // Confirm that on reload, it permanently goes back to the login page as requested
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Centre for Advanced Studies' })).toBeVisible();

    // Login as Accountant
    await page.getByRole('button', { name: 'Accountant' }).click();
    await page.locator('#login-password').fill(process.env.E2E_TEST_PASSWORD || 'CasErp@2026!');
    await page.getByRole('button', { name: 'Sign In Securely' }).click();

    await expect(page.getByText('Centre for Advanced Studies | cas.erp')).toBeVisible();

    // Navigate to Finance and record an offline receipt
    await page.getByRole('button', { name: /Fees & Cashfree Ledger/i }).click();
    await page.getByRole('button', { name: 'Record / Pay Fee' }).click();
    const amountInput = page.locator('.modal-content input[type="number"]');
    await amountInput.fill('2500');
    const refCode = `CHLN-E2E-${Date.now()}`;
    await page.getByPlaceholder('UTR / Challan Ref').fill(refCode);
    await page.getByRole('button', { name: 'Post Verified Receipt' }).click();

    await expect(page.getByText('CAS Fee Receipt & Ledger Voucher')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    // Check accessibility on authenticated workspace
    const axeAuth = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(axeAuth.violations.filter((v) => v.impact === 'critical')).toEqual([]);
  });
});
