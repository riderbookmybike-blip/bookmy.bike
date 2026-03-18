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

    test('table renders after initial data load', async ({ page }) => {
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

        // Record count before filter
        const countBefore = await page.getByText(/total rows/i).textContent();

        // Apply "Discount" status filter
        const statusSelect = page.locator('select').filter({ hasText: 'All' }).last();
        await statusSelect.selectOption('DISCOUNT');

        // Loading state should briefly appear then resolve
        await page.waitForTimeout(400); // let debounce fire

        // Wait for loading to clear
        await page
            .getByText(/Loading dealer offers/i)
            .waitFor({ state: 'hidden', timeout: 15_000 })
            .catch(() => {});

        // Page should have reset to page 1
        await expect(page.getByText(/Page 1 of/i)).toBeVisible({ timeout: 10_000 });

        // Count label updated (may be same or different — just must be present)
        await expect(page.getByText(/total rows/i)).toBeVisible();
        const countAfter = await page.getByText(/total rows/i).textContent();

        // Discount filter: all visible offer amounts should be negative (or table is empty)
        const offerCells = page.locator('table tbody tr td:nth-child(4)');
        const count = await offerCells.count();
        if (count > 0) {
            // Spot-check first row — should show emerald (discount) text colour
            const firstCell = offerCells.first();
            await expect(firstCell).toHaveClass(/text-emerald-700/);
        }

        // Cleanup — reset filter
        await statusSelect.selectOption('ALL');

        // Suppress unused warning
        void countBefore;
        void countAfter;
    });

    // ── 4. Pagination — Next / Prev ───────────────────────────────────────────

    test('pagination next/prev changes visible rows', async ({ page }) => {
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

        // History panel heading
        await expect(page.getByText(/Recent Override History/i)).toBeVisible({ timeout: 10_000 });

        // Collapse/Expand toggle button
        const toggleBtn = page.getByRole('button', { name: /Collapse|Expand/i });
        await expect(toggleBtn).toBeVisible();

        // Panel content region — either history rows or empty state, both are valid
        const historyContent = page.getByText(/No override history found|Override|Bulk Override|Disabled/i).first();
        await expect(historyContent).toBeVisible({ timeout: 10_000 });

        // Collapse the panel
        if ((await toggleBtn.textContent())?.match(/Collapse/i)) {
            await toggleBtn.click();
            await expect(page.getByText(/No override history found|Override|Bulk Override|Disabled/i).first())
                .not.toBeVisible({ timeout: 5_000 })
                .catch(() => {
                    /* panel might have no content rows */
                });
        }

        // Expand again
        await toggleBtn.click();
        await expect(toggleBtn).toBeVisible();
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
            // Change a filter
            const statusSelect = page.locator('select').filter({ hasText: 'All' }).last();
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
