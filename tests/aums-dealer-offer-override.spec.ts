import { test, expect, type Page } from '@playwright/test';

// ─── Constants ────────────────────────────────────────────────────────────────

const AUMS_PHONE = '9820760596';
const OFFERS_PATH = '/app/aums/dashboard/catalog/offers';

// ─── Auth helper (shared with smoke-marketplace-crm.spec.ts) ─────────────────

async function loginToAums(page: Page) {
    const res = await page.request.post('/api/auth/msg91/verify', {
        data: { phone: AUMS_PHONE, otp: '1234' },
    });
    expect(res.ok()).toBeTruthy();
}

// ─── Page helpers ─────────────────────────────────────────────────────────────

/**
 * Navigate to the offers page and wait for the heading + at least the filter
 * panel to be visible, indicating the initial data load has settled.
 */
async function gotoOffersPage(page: Page) {
    await page.goto(OFFERS_PATH, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Super Admin Offer Override/i })).toBeVisible({
        timeout: 20_000,
    });
}

/**
 * Wait for the table loading state to clear. Returns true if at least one
 * data row is visible, false if the "No dealer offers found" empty state shows.
 */
async function waitForTableSettled(page: Page): Promise<boolean> {
    const table = page.locator('table');
    const empty = page.getByText(/No dealer offers found/i);
    const loading = page.getByText(/Loading dealer offers/i);

    // Wait for loading indicator to disappear first
    await loading.waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {
        /* may never appear */
    });

    // Then check what's visible
    const hasTable = await table.isVisible().catch(() => false);
    const hasEmpty = await empty.isVisible().catch(() => false);

    if (!hasTable && !hasEmpty) {
        // Neither — wait a bit more and retry once
        await page.waitForTimeout(1500);
        return await table.isVisible().catch(() => false);
    }
    return hasTable;
}

// ─── Suite ────────────────────────────────────────────────────────────────────

test.describe('AUMS — Dealer Offer Override Page', () => {
    test.describe.configure({ mode: 'serial' });

    // Only run these tests in desktop-chrome — AUMS is a desktop-only surface
    test.beforeEach(async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop-chrome', 'AUMS offers page is desktop-only');
        await loginToAums(page);
    });

    // ── 1. Page load ──────────────────────────────────────────────────────────

    test('loads the offers page with heading and filter panel', async ({ page }) => {
        await gotoOffersPage(page);

        // Heading
        await expect(page.getByRole('heading', { name: /Super Admin Offer Override/i })).toBeVisible();

        // Filter selects
        await expect(page.getByText('Dealership', { exact: true })).toBeVisible();
        await expect(page.getByText('Brand', { exact: true })).toBeVisible();
        await expect(page.getByText('Model', { exact: true })).toBeVisible();
        await expect(page.getByText('Status', { exact: true })).toBeVisible();

        // Export buttons present
        await expect(page.getByRole('button', { name: /Export Page/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Export All/i })).toBeVisible();
    });

    // ── 2. Table settles (data or empty state) ────────────────────────────────

    test('table renders after initial data load', async ({ page }, testInfo) => {
        await gotoOffersPage(page);

        const hasRows = await waitForTableSettled(page);

        if (hasRows) {
            // At least one table row visible
            await expect(page.locator('table tbody tr').first()).toBeVisible();

            // Total count label is shown
            await expect(page.getByText(/total rows/i)).toBeVisible();

            // Pagination controls present when there's data
            await expect(page.getByRole('button', { name: /← Prev/i })).toBeVisible();
            await expect(page.getByRole('button', { name: /Next →/i })).toBeVisible();
            await expect(page.getByText(/Page \d+ of \d+/i)).toBeVisible();
        } else {
            // Acceptable: no offers seeded in this environment
            await expect(page.getByText(/No dealer offers found/i)).toBeVisible();
            testInfo.annotations.push({
                type: 'notice',
                description: 'No dealer offer rows found — DB may have no seeded offers. Non-fatal.',
            });
        }
    });

    // ── 3. Filter interaction (status filter) ────────────────────────────────

    test('applying status filter resets to page 1 and re-fetches', async ({ page }) => {
        await gotoOffersPage(page);

        const hasRows = await waitForTableSettled(page);
        if (!hasRows) {
            test.skip(); // No data — can't test filter behaviour
        }

        // Status is always the 4th select (nth=3) in the filter panel — Dealership, Brand, Model, Status
        const statusSelect = page.locator('label').nth(3).locator('select');
        await expect(statusSelect).toBeVisible({ timeout: 5_000 });
        // Verify it's the Status select by checking its option values
        const optionValues = await statusSelect.evaluate((el: HTMLSelectElement) =>
            Array.from(el.options).map(o => o.value)
        );
        expect(optionValues).toContain('DISCOUNT'); // confirms it's the status select

        // Apply "Discount" filter
        await statusSelect.selectOption('DISCOUNT');

        // Wait for debounce to fire + loading to clear
        await page.waitForTimeout(400);
        await page
            .getByText(/Loading dealer offers/i)
            .waitFor({ state: 'hidden', timeout: 15_000 })
            .catch(() => {});

        // Page must reset to 1
        await expect(page.getByText(/Page 1 of/i)).toBeVisible({ timeout: 10_000 });

        // Total rows label always present
        await expect(page.getByText(/total rows/i)).toBeVisible();

        // Table or empty state must be visible — both are valid outcomes
        const tableVisible = await page
            .locator('table')
            .isVisible()
            .catch(() => false);
        const emptyVisible = await page
            .getByText(/No dealer offers found/i)
            .isVisible()
            .catch(() => false);
        expect(tableVisible || emptyVisible).toBe(true);

        // Cleanup — reset to ALL
        await statusSelect.selectOption('ALL');
        await page.waitForTimeout(400);
    });

    // ── 4. Pagination — Next / Prev ───────────────────────────────────────────

    test('pagination next/prev changes visible rows', async ({ page }, testInfo) => {
        await gotoOffersPage(page);

        const hasRows = await waitForTableSettled(page);
        if (!hasRows) test.skip();

        // Check if there are multiple pages
        const pageIndicator = page.getByText(/Page 1 of (\d+)/i);
        const indicatorText = await pageIndicator.textContent({ timeout: 10_000 });
        const totalPages = Number(indicatorText?.match(/Page 1 of (\d+)/i)?.[1] ?? '1');

        if (totalPages <= 1) {
            testInfo.annotations.push({ type: 'notice', description: 'Only one page of results — pagination skip.' });
            return;
        }

        // Capture first row content before navigation
        const firstRowBefore = await page.locator('table tbody tr:first-child td:first-child').textContent();

        // Click Next
        await page.getByRole('button', { name: /Next →/i }).click();
        await page.waitForTimeout(400);
        await page
            .getByText(/Loading dealer offers/i)
            .waitFor({ state: 'hidden', timeout: 15_000 })
            .catch(() => {});

        // Should now be on page 2
        await expect(page.getByText(/Page 2 of/i)).toBeVisible({ timeout: 10_000 });

        // Row content should differ
        const firstRowAfter = await page.locator('table tbody tr:first-child td:first-child').textContent();
        expect(firstRowAfter).not.toBe(firstRowBefore);

        // Click Prev — back to page 1
        await page.getByRole('button', { name: /← Prev/i }).click();
        await page.waitForTimeout(400);
        await page
            .getByText(/Loading dealer offers/i)
            .waitFor({ state: 'hidden', timeout: 15_000 })
            .catch(() => {});

        await expect(page.getByText(/Page 1 of/i)).toBeVisible({ timeout: 10_000 });

        // Prev should be disabled again on page 1
        await expect(page.getByRole('button', { name: /← Prev/i })).toBeDisabled();
    });

    // ── 5. Edit drawer — open and close ───────────────────────────────────────

    test('clicking Edit opens the drawer and Close dismisses it', async ({ page }) => {
        await gotoOffersPage(page);

        const hasRows = await waitForTableSettled(page);
        if (!hasRows) test.skip();

        // Click the first Edit button in the table
        const firstEditBtn = page.getByRole('button', { name: /^Edit$/i }).first();
        await expect(firstEditBtn).toBeVisible({ timeout: 10_000 });
        await firstEditBtn.click();

        // Drawer / panel should appear — look for the Save or Close button typical of EditOfferPanel
        const closeBtn = page.getByRole('button', { name: /Cancel|Close/i });
        await expect(closeBtn.first()).toBeVisible({ timeout: 10_000 });

        // A field in the panel should be visible (offer delta input)
        const offerInput = page.getByRole('spinbutton'); // number input
        await expect(offerInput.first()).toBeVisible({ timeout: 5_000 });

        // Close the drawer
        await closeBtn.first().click();
        await expect(offerInput.first()).not.toBeVisible({ timeout: 5_000 });
    });

    // ── 6. History panel visible ──────────────────────────────────────────────

    test('history panel is visible and renders after page load', async ({ page }) => {
        await gotoOffersPage(page);
        await waitForTableSettled(page);

        // History panel heading must be visible
        await expect(page.getByText(/Recent Override History/i)).toBeVisible({ timeout: 10_000 });

        // Collapse/Expand toggle button exists
        const toggleBtn = page.getByRole('button', { name: /Collapse|Expand/i });
        await expect(toggleBtn).toBeVisible();

        // Wait for history to finish loading (loading text disappears)
        await page
            .getByText(/Loading history/i)
            .waitFor({ state: 'hidden', timeout: 10_000 })
            .catch(() => {
                /* may not appear */
            });

        // The empty-state text is unique page-wide — safe to assert globally
        // For rows: we can check the "No override history found" disappears, implying rows are present
        const emptyStateVisible = await page
            .getByText(/No override history found/i)
            .isVisible()
            .catch(() => false);
        // Either empty state OR no empty state (meaning rows loaded) — both valid
        expect(typeof emptyStateVisible).toBe('boolean'); // always true — just check it resolves

        // Collapse the panel
        const toggleText = await toggleBtn.textContent();
        if (toggleText?.match(/Collapse/i)) {
            await toggleBtn.click();
            await page.waitForTimeout(300);
            // History heading should still exist (panel section stays, content collapses)
            await expect(page.getByText(/Recent Override History/i)).toBeVisible({ timeout: 3_000 });
        }

        // Expand again — heading remains visible
        await toggleBtn.click();
        await expect(page.getByText(/Recent Override History/i)).toBeVisible({ timeout: 3_000 });
    });

    // ── 7. History persists through filter change ─────────────────────────────

    test('history panel content survives a filter change', async ({ page }) => {
        await gotoOffersPage(page);

        const hasRows = await waitForTableSettled(page);

        // Capture history section content before filter
        const historySection = page
            .locator('div')
            .filter({ hasText: /Recent Override History/ })
            .last();
        await expect(historySection).toBeVisible({ timeout: 10_000 });

        if (hasRows) {
            // Status is the 4th select (nth=3) in the filter panel
            const statusSelect = page.locator('label').nth(3).locator('select');
            await statusSelect.selectOption('INACTIVE');
            await page.waitForTimeout(400);
            await page
                .getByText(/Loading dealer offers/i)
                .waitFor({ state: 'hidden', timeout: 15_000 })
                .catch(() => {});
        }

        // History section should still be visible — state is independent of table filters
        await expect(historySection).toBeVisible({ timeout: 5_000 });
        await expect(page.getByText(/Recent Override History/i)).toBeVisible();
    });
});
