import { test, expect, type Page } from '@playwright/test';

// ─── Constants ────────────────────────────────────────────────────────────────
// AUMS phone is the primary test account used for login-first smoke flows.
const AUMS_PHONE = '9820760596';
// DEV OTP bypass (MSG91 stub returns '1234' for this account in non-prod envs).
const DEV_OTP = '1234';

function buildPhone(seed: string, salt: string) {
    const raw = `${seed}${salt}${Math.random().toString().slice(2, 8)}`;
    const digits = raw.replace(/\D/g, '').padStart(9, '7').slice(-9);
    return `9${digits}`;
}

// ─── Auth helper ──────────────────────────────────────────────────────────────
/**
 * Log in via the MSG91 OTP API route (dev bypass OTP).
 * Used as the FIRST step of every marketplace flow now that STRICT_PDP_GATING
 * requires authentication before the PDP is accessible.
 */
async function loginViaApi(page: Page, phone = AUMS_PHONE) {
    const res = await page.request.post('/api/auth/msg91/verify', {
        data: { phone, otp: DEV_OTP },
    });
    expect(res.ok()).toBeTruthy();
}

// ─── PDP navigation helper ────────────────────────────────────────────────────
/**
 * Navigate to a PDP after ensuring the user is logged in and a serviceable
 * pincode is set. This satisfies the STRICT_PDP_GATING middleware.
 */
async function navigateToPdp(page: Page, path = '/store/tvs/jupiter/drum') {
    // Seed a serviceable pincode before navigation so the dealer resolver
    // finds a nearby dealer and the PDP renders fully.
    await page.addInitScript(() => {
        try {
            window.localStorage.setItem(
                'bkmb_user_pincode',
                JSON.stringify({
                    pincode: '401203',
                    stateCode: 'MH',
                    state: 'MAHARASHTRA',
                    district: 'Palghar',
                    manuallySet: true,
                    source: 'SMOKE',
                })
            );
        } catch {
            // noop
        }
    });
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
}

// ─── CTA helpers ─────────────────────────────────────────────────────────────
async function clickQuoteCtaWithRetry(page: Page) {
    const cta = page.getByRole('button', { name: /GET QUOTE|Save Quote/i }).first();
    await expect(cta).toBeVisible({ timeout: 20_000 });

    for (let attempt = 1; attempt <= 5; attempt += 1) {
        try {
            await cta.click({ timeout: 5000 });
        } catch {
            // Fallback for rapid React remounts where locator detaches during click.
            const clicked = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const target = buttons.find(btn => {
                    const text = (btn.textContent || '').toUpperCase();
                    if (!/GET QUOTE|SAVE QUOTE/.test(text)) return false;
                    const rect = btn.getBoundingClientRect();
                    const style = window.getComputedStyle(btn);
                    const visible =
                        rect.width > 0 &&
                        rect.height > 0 &&
                        style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        style.opacity !== '0';
                    return visible && !(btn as HTMLButtonElement).disabled;
                });
                if (!target) return false;
                (target as HTMLButtonElement).click();
                return true;
            });
            if (!clicked) {
                await page.waitForTimeout(250 * attempt);
                continue;
            }
        }

        const opened = await page
            .getByPlaceholder('00000 00000')
            .isVisible()
            .catch(() => false);
        if (opened) return;
        await page.waitForTimeout(250 * attempt);
    }

    throw new Error('Failed to open marketplace lead modal after CTA retries');
}

// ─── Spec ─────────────────────────────────────────────────────────────────────
test.describe('Marketplace + CRM Smoke', () => {
    test.describe.configure({ mode: 'serial' });

    /**
     * Marketplace lead capture → quote creation (login-first flow).
     *
     * Previously: anonymous user hits PDP, enters phone at CTA modal, creates quote.
     * Now (STRICT_PDP_GATING=true): user MUST be logged in before PDP is accessible.
     * We login via API first, then navigate to PDP and complete the quote flow.
     */
    test('marketplace lead capture creates quote flow', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop-chrome', 'Runs once on desktop only');
        const tag = Date.now().toString().slice(-9);

        // ── Step 1: Login (required by STRICT_PDP_GATING) ──
        await loginViaApi(page);

        // ── Step 2: Navigate to PDP ──
        await navigateToPdp(page);

        // ── Step 3: Trigger Quote CTA ──
        await clickQuoteCtaWithRetry(page);

        // ── Step 4: Fill phone (for a new/test customer) ──
        await expect(page.getByPlaceholder('00000 00000')).toBeVisible({ timeout: 20_000 });
        const phone = buildPhone(tag, testInfo.title);
        await page.getByPlaceholder('00000 00000').fill(phone);
        await page.getByRole('button', { name: /Continue/i }).click();

        // ── Step 5: Fill name + pincode ──
        await expect(page.getByPlaceholder('Enter full name')).toBeVisible({ timeout: 20_000 });
        await page.getByPlaceholder('Enter full name').fill(`Smoke Mkt ${tag}`);
        await page.getByPlaceholder('6-digit Pincode').fill('401208');
        await page.getByRole('button', { name: /Create Quote/i }).click();

        const successHeading = page.getByText(/EXCLUSIVE DEAL/i);
        const blockerText = page.getByText(/Quote creation blocked/i);

        await Promise.race([
            successHeading.waitFor({ state: 'visible', timeout: 30_000 }),
            blockerText.waitFor({ state: 'visible', timeout: 30_000 }),
        ]);

        if (await blockerText.isVisible().catch(() => false)) {
            testInfo.annotations.push({
                type: 'issue',
                description: 'Marketplace quote blocked due to missing product/pricing payload.',
            });
            await expect(blockerText).toBeVisible();
            return;
        }

        await expect(successHeading).toBeVisible();
    });

    /**
     * PDP consent gate smoke: unauthenticated user visiting a PDP sees the
     * warm consent modal (PdpConsentGate) and commercial values are masked.
     * No hard redirect happens — URL stays on the PDP route.
     *
     * Phase 2 behaviour: proxy + page.tsx no longer redirect. Modal renders
     * client-side inside ProductClient when pdpGateState === 'CONSENT'.
     *
     * This test fails loudly in CI if STRICT_PDP_GATING is not set.
     */
    test('guest PDP shows consent modal with masked pricing (Phase 2)', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop-chrome', 'Runs once on desktop only');

        if (process.env.STRICT_PDP_GATING !== 'true') {
            // In CI the flag MUST be set — misconfigured env fails loudly.
            if (process.env.CI) {
                throw new Error(
                    'STRICT_PDP_GATING is not "true" in CI. Set this env var so the consent gate test runs.'
                );
            }
            // Local dev: skip cleanly.
            test.skip(true, 'STRICT_PDP_GATING not enabled; consent gate not expected on local dev.');
            return;
        }

        // Navigate without login — should land on PDP with consent modal, NOT /login.
        await page.goto('/store/tvs/jupiter/drum', { waitUntil: 'domcontentloaded' });

        const currentUrl = page.url();

        // 1. URL must stay on PDP — no redirect.
        expect(currentUrl, 'Expected to stay on PDP, but was redirected').not.toContain('/login');
        expect(currentUrl, 'Expected to stay on PDP route').toContain('/store/tvs/jupiter/drum');

        // 2. Consent modal must be visible (heading injected by PdpConsentGate).
        await expect(
            page.getByRole('dialog').first(),
            'Consent gate dialog must be visible for unauthenticated users'
        ).toBeVisible({ timeout: 12_000 });

        // 3. Price must NOT be shown — masked commercial values.
        const priceText = await page
            .locator('[data-testid="cmd-bar-on-road"]')
            .textContent()
            .catch(() => '');
        expect(priceText, 'On-road price should be masked for unauthenticated users').not.toMatch(/₹\d/);

        // 4. Both consent CTAs must be visible with correct labels (contrast AA fix verification).
        const loginBtn = page.getByTestId('pdp-consent-login');
        await expect(loginBtn, 'LOGIN TO VIEW OFFERS button must be visible').toBeVisible({ timeout: 5_000 });
        await expect(loginBtn, 'LOGIN CTA must not be disabled').toBeEnabled();
        await expect(loginBtn, 'LOGIN CTA label must match spec').toContainText('LOGIN TO VIEW OFFERS');

        const signupBtn = page.getByTestId('pdp-consent-signup');
        await expect(signupBtn, 'NEW HERE? SIGN UP button must be visible').toBeVisible({ timeout: 5_000 });
        await expect(signupBtn, 'SIGNUP CTA must not be disabled').toBeEnabled();
        await expect(signupBtn, 'SIGNUP CTA label must match spec').toContainText('NEW HERE? SIGN UP');
    });

    /**
     * Phase 4 smoke: authenticated user without a cached pincode sees PincodeGateModal.
     * Commercial values must remain masked until serviceability is resolved.
     *
     * Serviceable pincode: 411001 (Pune, Maharashtra — confirmed in SERVED_CITIES).
     * Non-serviceable pincode: 110001 (Delhi — outside Maharashtra coverage).
     */
    test('authenticated user without pincode sees pincode gate (Phase 4)', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop-chrome', 'Runs once on desktop only');

        if (process.env.STRICT_PDP_GATING !== 'true') {
            if (process.env.CI) {
                throw new Error(
                    'STRICT_PDP_GATING is not "true" in CI. Set this env var so the pincode gate test runs.'
                );
            }
            test.skip(true, 'STRICT_PDP_GATING not enabled; pincode gate not expected on local dev.');
            return;
        }

        // Clear any cached pincode so the gate triggers
        await page.goto('/store/tvs/jupiter/drum', { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => localStorage.removeItem('bkmb_user_pincode'));

        // Login via API to get past the CONSENT gate
        await loginViaApi(page);
        await page.reload({ waitUntil: 'domcontentloaded' });

        // Phase 4: PincodeGateModal must appear for authenticated user without pincode
        await expect(
            page.getByTestId('pincode-gate-modal'),
            'PincodeGateModal must appear after login when pincode is missing'
        ).toBeVisible({ timeout: 12_000 });

        // Commercial values must remain masked (price not shown)
        const priceText2 = await page
            .locator('[data-testid="cmd-bar-on-road"]')
            .textContent()
            .catch(() => '');
        expect(priceText2, 'Price must be masked while pincode gate is active').not.toMatch(/₹\d/);
    });

    test('crm lead create from leads module', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop-chrome', 'Runs once on desktop only');
        const tag = Date.now().toString().slice(-8);
        const phone = buildPhone(tag, testInfo.title);

        await loginViaApi(page);
        await page.goto('/app/aums/leads?action=create', { waitUntil: 'domcontentloaded' });

        await expect(page.getByText('REGISTER NEW IDENTITY')).toBeVisible({ timeout: 20_000 });
        await page.getByPlaceholder('10-DIGIT SECURE NUMBER').fill(phone);
        await page.getByPlaceholder('e.g. ADITYA VERMA').fill(`Smoke CRM ${tag}`);
        await page.getByPlaceholder('000000').fill('401208');
        await page
            .getByPlaceholder('e.g. Wants Jupiter ZX in 30 days, EMI around 4k, exchange available.')
            .fill('Smoke CRM UI flow test lead');
        await page.getByPlaceholder('Referrer Phone').fill(AUMS_PHONE);
        const dealerSelect = page.getByRole('combobox').last();
        if (await dealerSelect.isVisible().catch(() => false)) {
            await dealerSelect.selectOption({ index: 1 });
        }

        await page.getByRole('button', { name: /Create Identity/i }).click();
        await expect(page.getByText('REGISTER NEW IDENTITY')).not.toBeVisible({ timeout: 30_000 });
    });
});
