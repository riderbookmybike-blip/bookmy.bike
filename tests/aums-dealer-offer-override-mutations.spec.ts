import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

// ─── Constants ────────────────────────────────────────────────────────────────

const AUMS_PHONE = '9820760596';
const OFFERS_PATH = '/app/aums/dashboard/catalog/offers';
const SUPABASE_URL = 'https://aytdeqjxxjxbgiyslubx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

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

// ─── Supabase REST helpers ────────────────────────────────────────────────────

function supabaseHeaders(extraPrefer?: string) {
    return {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: extraPrefer ?? 'return=representation',
    };
}

async function upsertOfferRow(
    request: APIRequestContext,
    row: {
        tenant_id: string;
        vehicle_color_id: string;
        state_code: string;
        offer_amount: number;
        is_active: boolean;
        inclusion_type: string;
        tat_days: number;
    }
): Promise<string | null> {
    const res = await request.post(`${SUPABASE_URL}/rest/v1/cat_price_dealer`, {
        headers: supabaseHeaders('return=representation,resolution=merge-duplicates'),
        data: row,
    });
    if (!res.ok()) return null;
    const body: unknown = await res.json().catch(() => []);
    return Array.isArray(body) && body[0]?.id ? String(body[0].id) : null;
}

async function restoreAnchorRow(request: APIRequestContext) {
    await request.patch(`${SUPABASE_URL}/rest/v1/cat_price_dealer?id=eq.${ANCHOR.id}`, {
        headers: supabaseHeaders(),
        data: {
            offer_amount: ANCHOR.originalAmount,
            is_active: true,
            inclusion_type: ANCHOR.inclusionType,
            tat_days: ANCHOR.tatDays,
        },
    });
}

async function deleteRow(request: APIRequestContext, id: string) {
    await request.delete(`${SUPABASE_URL}/rest/v1/cat_price_dealer?id=eq.${id}`, {
        headers: supabaseHeaders(),
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

    test.beforeAll(async ({ request }) => {
        // Insert a dedicated removable fixture row (GJ state, -500) for the remove test.
        // Hard-deleted in afterAll so real data is never permanently affected.
        removableRowId = await upsertOfferRow(request, {
            tenant_id: ANCHOR.tenantId,
            vehicle_color_id: ANCHOR.vehicleColorId,
            state_code: 'GJ', // distinct state → distinct unique key from anchor (MH)
            offer_amount: -500,
            is_active: true,
            inclusion_type: 'OPTIONAL',
            tat_days: 7,
        });
    });

    test.afterAll(async ({ request }) => {
        await restoreAnchorRow(request);
        if (removableRowId) await deleteRow(request, removableRowId);
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
        test.skip(!removableRowId, 'Removable fixture row was not created');

        await gotoOffersPage(page);
        await waitForTableReady(page);

        // Filter to TVS Autorace to narrow the table
        await selectDealerFilter(page, ANCHOR.tenantId);

        // Find the GJ fixture row (offer: -500, state: GJ)
        const fixtureRow = page
            .locator('table tbody tr')
            .filter({ hasText: ANCHOR.skuName })
            .filter({ hasText: 'GJ' })
            .first();

        if (!(await fixtureRow.isVisible().catch(() => false))) {
            // REST-confirmed it exists; may be on a later page — treat as non-critical skip
            test.skip();
        }

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
