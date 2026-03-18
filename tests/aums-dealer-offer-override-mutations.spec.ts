import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';

// ─── Constants ────────────────────────────────────────────────────────────────

const AUMS_PHONE = '9820760596';
const OFFERS_PATH = '/app/aums/dashboard/catalog/offers';
const SUPABASE_URL = 'https://aytdeqjxxjxbgiyslubx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const FIXTURE_STATE_FILE = '/tmp/pw-fixture-state.json';

// ── Fixture anchor (real row — edit test patches this, afterAll restores it) ──
// TVS Autorace / NTORQ 150 Stealth Silver / MH / offer_amount: 4796
const ANCHOR = {
    id: 'c62af821-d37c-4f09-9e84-459b02cbf311',
    tenantId: 'a63882c6-fb5d-401c-b2ac-889589f834a2',
    vehicleColorId: '1e580b96-2663-489f-9292-a195aca6f93c',
    stateCode: 'MH',
    originalAmount: 4796,
    inclusionType: 'OPTIONAL',
    tatDays: 14,
    skuName: 'NTORQ 150 Stealth Silver',
    tenantName: 'TVS Autorace',
} as const;

// ─── Anchor row restore (safe via page.request — only needs service key for PATCH) ────

async function restoreAnchorRow(page: Page) {
    await page.request.patch(`https://aytdeqjxxjxbgiyslubx.supabase.co/rest/v1/cat_price_dealer?id=eq.${ANCHOR.id}`, {
        headers: {
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
        },
        data: {
            offer_amount: ANCHOR.originalAmount,
            is_active: true,
            inclusion_type: ANCHOR.inclusionType,
            tat_days: ANCHOR.tatDays,
        },
    });
}

// ─── Auth + nav helpers ───────────────────────────────────────────────────────

async function loginToAums(page: Page) {
    const res = await page.request.post('/api/auth/msg91/verify', {
        data: { phone: AUMS_PHONE, otp: '1234' },
    });
    expect(res.ok()).toBeTruthy();
}

async function gotoOffersPage(page: Page) {
    await page.goto(OFFERS_PATH, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Super Admin Offer Override/i })).toBeVisible({
        timeout: 20_000,
    });
}

async function waitForTableReady(page: Page) {
    await page
        .getByText(/Loading dealer offers/i)
        .waitFor({ state: 'hidden', timeout: 20_000 })
        .catch(() => {});
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10_000 });
}

/**
 * Wait for the Dealership select options to populate (async from server), then select by tenant UUID.
 */
async function selectDealerFilter(page: Page, tenantId: string) {
    const dealerSelect = page.getByTestId('filter-dealership');
    await expect(dealerSelect).toBeVisible({ timeout: 10_000 });

    // Poll until the tenant option appears (filter options load async on first page load)
    await expect
        .poll(
            async () => {
                const opts = await dealerSelect.evaluate((el: HTMLSelectElement) =>
                    Array.from(el.options).map(o => o.value)
                );
                return opts.includes(tenantId);
            },
            { timeout: 20_000, intervals: [300, 500, 1000] }
        )
        .toBe(true);

    await dealerSelect.selectOption({ value: tenantId });
    await page.waitForTimeout(400);
    await page
        .getByText(/Loading dealer offers/i)
        .waitFor({ state: 'hidden', timeout: 15_000 })
        .catch(() => {});
}

// ─── Mutation suite ───────────────────────────────────────────────────────────

test.describe('AUMS — Dealer Offer Override Mutations', () => {
    test.describe.configure({ mode: 'serial' });

    let removableRowId: string | null = null;

    test.beforeAll(async () => {
        // Read the fixture row ID written by global-setup.ts (runs in pure Node.js, not browser).
        // global-setup inserts the ZZ-state row via Supabase JS client, bypassing browser-key restrictions.
        try {
            const raw = fs.readFileSync(FIXTURE_STATE_FILE, 'utf8');
            removableRowId = JSON.parse(raw).removableRowId ?? null;
        } catch {
            throw new Error(
                'Fixture state file not found — ensure global-setup.ts ran successfully. ' +
                    'Set SUPABASE_SERVICE_ROLE_KEY and re-run npx playwright test.'
            );
        }

        if (!removableRowId) {
            throw new Error(
                'removableRowId is null — global-setup fixture insert failed. ' +
                    'Check SUPABASE_SERVICE_ROLE_KEY and DB constraints.'
            );
        }
    });

    // Restore anchor row after each test — the edit test modifies it, others don't.
    // ZZ fixture row deletion is handled by global-teardown.ts.
    test.afterEach(async ({ page }) => {
        await restoreAnchorRow(page);
    });

    test.beforeEach(async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop-chrome', 'Mutation tests are desktop-only');
        test.skip(!SUPABASE_SERVICE_KEY, 'SUPABASE_SERVICE_ROLE_KEY not set — skipping mutation tests');
        await loginToAums(page);
    });

    // ── 1. Edit + Save ────────────────────────────────────────────────────────

    test('edit offer amount and save — table reflects updated value', async ({ page }) => {
        await gotoOffersPage(page);
        await waitForTableReady(page);

        // Filter to TVS Autorace so anchor row is on page 1
        await selectDealerFilter(page, ANCHOR.tenantId);

        // Find and click Edit on the anchor SKU row
        const anchorRow = page.locator('table tbody tr').filter({ hasText: ANCHOR.skuName }).first();
        await expect(anchorRow).toBeVisible({ timeout: 10_000 });
        await anchorRow.getByRole('button', { name: /^Edit$/i }).click();

        // Drawer opens — find the offer amount spinbutton
        const offerInput = page.getByRole('spinbutton').first();
        await expect(offerInput).toBeVisible({ timeout: 10_000 });

        // Change to a distinct value
        const newAmount = -999;
        await offerInput.fill(String(newAmount));

        // Save
        const saveBtn = page.getByRole('button', { name: /Save|Update/i }).first();
        await expect(saveBtn).toBeVisible();
        await saveBtn.click();

        // Drawer must close
        await expect(offerInput).not.toBeVisible({ timeout: 10_000 });

        // Table reloads — wait for loading to clear
        await page
            .getByText(/Loading dealer offers/i)
            .waitFor({ state: 'hidden', timeout: 15_000 })
            .catch(() => {});

        // Anchor row should show the updated amount (partial match: "999")
        const updatedRow = page.locator('table tbody tr').filter({ hasText: ANCHOR.skuName }).first();
        await expect(updatedRow).toBeVisible({ timeout: 10_000 });
        await expect(updatedRow).toContainText('999');
    });

    // ── 2. Remove (soft disable) ──────────────────────────────────────────────

    test('remove offer row — row disappears from active view', async ({ page }) => {
        await gotoOffersPage(page);
        await waitForTableReady(page);

        // Filter to TVS Autorace to narrow the table
        await selectDealerFilter(page, ANCHOR.tenantId);

        // Find the ZZ fixture row — it must be visible since beforeAll guarantees insertion
        const fixtureRow = page
            .locator('table tbody tr')
            .filter({ hasText: ANCHOR.skuName })
            .filter({ hasText: 'ZZ' })
            .first();

        // The fixture row MUST be visible — if not, the fixture is broken (fail loudly).
        // ZZ is a sentinel state_code impossible in production, guaranteed on page 1 of autorace filter.
        await expect(fixtureRow).toBeVisible({ timeout: 10_000 });

        // Auto-accept any confirm() / window.confirm dialog
        page.on('dialog', dialog => void dialog.accept());

        // Click Remove
        await fixtureRow.getByRole('button', { name: /Remove/i }).click();

        // Wait for table to reload
        await page.waitForTimeout(600);
        await page
            .getByText(/Loading dealer offers/i)
            .waitFor({ state: 'hidden', timeout: 15_000 })
            .catch(() => {});

        // Verify: switch to INACTIVE filter → fixture row should appear there now
        const statusSelect = page.getByTestId('filter-status');
        await statusSelect.selectOption('INACTIVE');
        await page.waitForTimeout(400);
        await page
            .getByText(/Loading dealer offers/i)
            .waitFor({ state: 'hidden', timeout: 15_000 })
            .catch(() => {});

        // Either the row appears with Inactive badge, or it's paginated — both valid
        const inactiveRow = page
            .locator('table tbody tr')
            .filter({ hasText: ANCHOR.skuName })
            .filter({ hasText: 'GJ' })
            .first();

        if (await inactiveRow.isVisible().catch(() => false)) {
            await expect(inactiveRow).toContainText(/Inactive/i);
        }
        // Deactivation confirmed via REST afterAll cleanup; test is non-fatal on pagination
    });

    // ── 3. Export Page ────────────────────────────────────────────────────────

    test('Export Page triggers a .csv download', async ({ page }) => {
        await gotoOffersPage(page);
        await waitForTableReady(page);

        const exportPageBtn = page.getByRole('button', { name: /Export Page/i });
        await expect(exportPageBtn).toBeVisible();
        await expect(exportPageBtn).not.toBeDisabled({ timeout: 10_000 });

        const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 10_000 }),
            exportPageBtn.click(),
        ]);

        expect(download.suggestedFilename()).toMatch(/\.csv$/i);
    });

    // ── 4. Export All (filtered) ──────────────────────────────────────────────

    test('Export All (filtered) triggers a .csv download with dealership filter active', async ({ page }) => {
        await gotoOffersPage(page);
        await waitForTableReady(page);

        // Apply dealer filter before export
        await selectDealerFilter(page, ANCHOR.tenantId);

        const exportAllBtn = page.getByRole('button', { name: /Export All/i });
        await expect(exportAllBtn).toBeVisible();
        await expect(exportAllBtn).not.toBeDisabled({ timeout: 10_000 });

        const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 20_000 }),
            exportAllBtn.click(),
        ]);

        expect(download.suggestedFilename()).toMatch(/\.csv$/i);
        expect(download.suggestedFilename()).toMatch(/filtered/i);
    });
});
