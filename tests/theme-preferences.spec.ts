import { test, expect, type Page } from '@playwright/test';

const getStoredTheme = (page: Page) => page.evaluate(() => localStorage.getItem('theme'));
const getResolvedRootTheme = (page: Page) =>
    page.evaluate(() => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'));
const AUTH_STATE = process.env.PLAYWRIGHT_AUTH_STATE;

const seedEnterpriseSession = async (page: Page) => {
    await page.addInitScript(() => {
        localStorage.setItem('user_role', 'OWNER');
        localStorage.setItem('active_role', 'OWNER');
        localStorage.setItem('tenant_type', 'AUMS');
        localStorage.setItem('tenant_name', 'AUMS');
        localStorage.setItem('tenant_slug', 'aums');
        localStorage.setItem('user_name', 'Theme Tester');
        localStorage.setItem('tenant_id', '00000000-0000-0000-0000-000000000000');
    });
};

if (AUTH_STATE) {
    test.use({ storageState: AUTH_STATE });
}

test.describe('Theme Preferences', () => {
    test.beforeEach(async ({ page }) => {
        test.skip(!AUTH_STATE, 'Set PLAYWRIGHT_AUTH_STATE to run authenticated theme tests.');
        await seedEnterpriseSession(page);
    });

    test('Profile pages expose 3-mode theme selector', async ({ page }) => {
        await page.goto('/app/aums/dashboard/profile', { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('radiogroup', { name: 'Theme Mode' })).toBeVisible();
        await expect(page.getByRole('radio', { name: 'Light' })).toBeVisible();
        await expect(page.getByRole('radio', { name: 'Dark' })).toBeVisible();
        await expect(page.getByRole('radio', { name: 'System' })).toBeVisible();
    });

    test('Selected theme persists across routes', async ({ page }) => {
        await page.goto('/app/aums/dashboard/profile', { waitUntil: 'domcontentloaded' });
        const darkRadio = page.getByRole('radio', { name: 'Dark' });
        await darkRadio.click();

        await expect(darkRadio).toHaveAttribute('aria-checked', 'true');
        await expect.poll(async () => await getStoredTheme(page)).toBe('dark');
        await expect.poll(async () => await getResolvedRootTheme(page)).toBe('dark');

        await page.goto('/app/aums/dashboard/settings/profile', { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
        await expect.poll(async () => await getStoredTheme(page)).toBe('dark');

        await page.goto('/store/catalog', { waitUntil: 'domcontentloaded' });
        await expect.poll(async () => await getResolvedRootTheme(page)).toBe('dark');
    });

    test('System theme mode can be selected and saved', async ({ page }) => {
        await page.goto('/app/aums/dashboard/settings/profile', { waitUntil: 'domcontentloaded' });
        const systemRadio = page.getByRole('radio', { name: 'System' });
        await systemRadio.click();

        await expect(systemRadio).toHaveAttribute('aria-checked', 'true');
        await expect.poll(async () => await getStoredTheme(page)).toBe('system');
    });
});
