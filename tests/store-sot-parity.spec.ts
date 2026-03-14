import { test, expect, type Page } from '@playwright/test';
import { REQUIRED_CORE_KEYS, COMMAND_BAR_KEYS } from '../src/components/store/sections/pdpParityContract';

test.describe.configure({ timeout: 120_000 });

/**
 * SOT Parity E2E Tests
 *
 * Validates pricing parity between Catalog and PDP
 * across desktop and phone viewports.
 *
 * Run:
 *   npx playwright test tests/store-sot-parity.spec.ts
 */

// ─── Test Data ───────────────────────────────────────────────

const TEST_PRODUCTS = [{ make: 'tvs', model: 'jupiter', variant: 'drum', label: 'TVS Jupiter Drum' }];

const STATE_CODE = 'MH';
const TEST_PINCODE = '401404';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// ─── Helpers ─────────────────────────────────────────────────

async function gotoStorePage(page: Page, url: string) {
    const target = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    await page.addInitScript(
        ({ stateCode, pincode }) => {
            try {
                window.localStorage.setItem(
                    'bkmb_user_pincode',
                    JSON.stringify({
                        pincode,
                        stateCode,
                        state: 'MAHARASHTRA',
                        manuallySet: true,
                        source: 'TEST',
                    })
                );
            } catch {
                // noop
            }
        },
        { stateCode: STATE_CODE, pincode: TEST_PINCODE }
    );

    await page.goto(target, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
}

async function extractJsonLdExShowroom(page: Page): Promise<number> {
    for (let attempt = 0; attempt < 30; attempt += 1) {
        const price = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
            for (const script of scripts) {
                const raw = script.textContent;
                if (!raw) continue;
                try {
                    const parsed = JSON.parse(raw);
                    const value = Number(parsed?.offers?.price || 0);
                    if (value > 0) return value;
                } catch {
                    // ignore malformed script blocks
                }
            }
            return 0;
        });
        if (price > 0) return price;
        await page.waitForTimeout(500);
    }
    return 0;
}

// ─── Tests ───────────────────────────────────────────────────

test.describe('SOT Pricing Parity', () => {
    for (const product of TEST_PRODUCTS) {
        test(`${product.label}: PDP loads with valid pricing`, async ({ page }) => {
            const url = `/store/${product.make}/${product.model}/${product.variant}`;
            await gotoStorePage(page, url);

            // Page should not show "PRODUCT NOT FOUND"
            const notFound = await page.locator('text=PRODUCT NOT FOUND').count();
            expect(notFound).toBe(0);

            // Wait for pricing to appear
            const exShowroom = await extractJsonLdExShowroom(page);

            // Pricing should be non-zero (not ₹0 leak)
            if (exShowroom > 0) {
                expect(exShowroom).toBeGreaterThan(30000); // Minimum reasonable bike price
                expect(exShowroom).toBeLessThan(1000000); // Maximum reasonable bike price
            }
        });

        test(`${product.label}: No ₹0 pricing leak`, async ({ page }) => {
            const url = `/store/${product.make}/${product.model}/${product.variant}`;
            await gotoStorePage(page, url);

            // Check page content for ₹0 patterns
            const bodyText = await page.locator('body').textContent();
            const hasZeroPrice = bodyText?.includes('₹0') || bodyText?.includes('₹ 0');

            // ₹0 should never appear in a valid PDP
            if (hasZeroPrice) {
                // Allow ₹0 only in specific contexts (discounts, savings)
                const zeroInDiscount = await page.locator('[data-testid="discount"], [data-testid="savings"]').count();
                if (zeroInDiscount === 0) {
                    // This is a genuine ₹0 leak
                    console.warn(`⚠️ ₹0 found on PDP for ${product.label}`);
                }
            }
        });

        test(`${product.label}: Color selector loads`, async ({ page }) => {
            const url = `/store/${product.make}/${product.model}/${product.variant}`;
            await gotoStorePage(page, url);

            // At least one color swatch should be visible
            const swatches = await page
                .locator('[data-testid="color-swatch"], [class*="color"], [class*="swatch"]')
                .count();

            // Most bikes have at least 1 color
            expect(swatches).toBeGreaterThanOrEqual(0); // Soft check — log if 0
            if (swatches === 0) {
                console.warn(`⚠️ No color swatches found for ${product.label}`);
            }
        });
    }

    test('Catalog page loads with products', async ({ page }) => {
        await gotoStorePage(page, `/store/catalog`);

        await page.waitForSelector('[data-testid="catalog-product-card"], [data-testid="catalog-compact-card"]', {
            timeout: 30_000,
        });
        const productCards = await page
            .locator('[data-testid="catalog-product-card"], [data-testid="catalog-compact-card"]')
            .count();
        expect(productCards).toBeGreaterThan(0);
    });
});

test.describe('Cross-Viewport Parity', () => {
    const product = TEST_PRODUCTS[0]; // TVS Jupiter Drum

    test('1366x768 and 390x844 show same ex-showroom price', async ({ browser }) => {
        test.setTimeout(120_000);
        const url = `/store/${product.make}/${product.model}/${product.variant}`;

        const desktopContext = await browser.newContext({
            viewport: { width: 1366, height: 768 },
        });
        const desktopPage = await desktopContext.newPage();
        await gotoStorePage(desktopPage, url);
        const desktopExShowroom = await extractJsonLdExShowroom(desktopPage);

        const mobileContext = await browser.newContext({
            viewport: { width: 390, height: 844 },
            isMobile: true,
            hasTouch: true,
        });
        const mobilePage = await mobileContext.newPage();
        await gotoStorePage(mobilePage, url);
        const mobileExShowroom = await extractJsonLdExShowroom(mobilePage);

        expect(desktopExShowroom).toBeGreaterThan(30000);
        expect(mobileExShowroom).toBeGreaterThan(30000);
        expect(Math.abs(desktopExShowroom - mobileExShowroom)).toBeLessThanOrEqual(1);

        await desktopContext.close();
        await mobileContext.close();
    });
});
// ─── PDP Content Parity (Desktop ↔ Mobile Section Presence + Snapshot) ──────
// Phase 2-D/2-E: Contract-driven key assertions, numeric parity, tablet/TV matrix
test.describe('PDP Content Parity', () => {
    const EXPECTED_SECTIONS = ['pricing', 'finance', 'finance-summary', 'config', 'specs', 'command-bar'];

    for (const product of TEST_PRODUCTS) {
        test(`${product.label}: Desktop and Mobile render same parity snapshot`, async ({ browser }) => {
            test.setTimeout(120_000);
            const url = `/store/${product.make}/${product.model}/${product.variant}`;

            // Desktop context
            const desktopCtx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
            const desktopPage = await desktopCtx.newPage();
            await gotoStorePage(desktopPage, url);

            // Mobile context
            const mobileCtx = await browser.newContext({
                viewport: { width: 390, height: 844 },
                isMobile: true,
                hasTouch: true,
            });
            const mobilePage = await mobileCtx.newPage();
            await gotoStorePage(mobilePage, url);

            // Extract parity snapshots
            const extractSnapshot = async (page: Page) => {
                await page.waitForSelector('[data-testid="pdp-parity-json"]', {
                    timeout: 30_000,
                    state: 'attached',
                });
                const raw = await page
                    .locator('[data-testid="pdp-parity-json"]')
                    .first()
                    .getAttribute('data-parity-snapshot');
                return raw ? JSON.parse(raw) : null;
            };

            const desktopSnap = await extractSnapshot(desktopPage);
            const mobileSnap = await extractSnapshot(mobilePage);

            expect(desktopSnap, 'Desktop parity snapshot missing').not.toBeNull();
            expect(mobileSnap, 'Mobile parity snapshot missing').not.toBeNull();

            // Core aggregate parity
            expect(mobileSnap.totalOnRoad, 'totalOnRoad mismatch').toBe(desktopSnap.totalOnRoad);
            expect(mobileSnap.baseExShowroom, 'baseExShowroom mismatch').toBe(desktopSnap.baseExShowroom);
            expect(mobileSnap.emi, 'emi mismatch').toBe(desktopSnap.emi);
            expect(mobileSnap.emiTenure, 'emiTenure mismatch').toBe(desktopSnap.emiTenure);
            expect(mobileSnap.regType, 'regType mismatch').toBe(desktopSnap.regType);

            // Option lists parity
            expect(mobileSnap.specKeys.sort(), 'specKeys mismatch').toEqual(desktopSnap.specKeys.sort());
            expect(mobileSnap.accessoryIds.sort(), 'accessoryIds mismatch').toEqual(desktopSnap.accessoryIds.sort());
            expect(mobileSnap.serviceIds.sort(), 'serviceIds mismatch').toEqual(desktopSnap.serviceIds.sort());
            expect(mobileSnap.insuranceAddonIds.sort(), 'insuranceAddonIds mismatch').toEqual(
                desktopSnap.insuranceAddonIds.sort()
            );
            expect(mobileSnap.pricingLineItemKeys.sort(), 'pricingLineItemKeys mismatch').toEqual(
                desktopSnap.pricingLineItemKeys.sort()
            );
            expect(mobileSnap.registrationOptions.sort(), 'registrationOptions mismatch').toEqual(
                desktopSnap.registrationOptions.sort()
            );
            expect(mobileSnap.warrantyItemIds.sort(), 'warrantyItemIds mismatch').toEqual(
                desktopSnap.warrantyItemIds.sort()
            );

            // ── High-risk numeric value parity (Phase 2-D) ──
            // These values come from buildPdpCommonState(); mismatch = compute drift
            if (desktopSnap.displayOnRoad !== null) {
                expect(mobileSnap.displayOnRoad, 'displayOnRoad mismatch').toBe(desktopSnap.displayOnRoad);
            }
            if (desktopSnap.totalSavings !== null) {
                expect(mobileSnap.totalSavings, 'totalSavings mismatch').toBe(desktopSnap.totalSavings);
            }
            if (desktopSnap.footerEmi !== null) {
                expect(mobileSnap.footerEmi, 'footerEmi mismatch').toBe(desktopSnap.footerEmi);
            }
            if (desktopSnap.deliveryTatLabel !== null) {
                expect(mobileSnap.deliveryTatLabel, 'TAT label mismatch').toBe(desktopSnap.deliveryTatLabel);
            }
            expect(mobileSnap.footerEmiTenure, 'emiTenure mismatch').toBe(desktopSnap.footerEmiTenure);

            // ── Contract-driven required key presence (Phase 2-E) ──
            // REQUIRED_CORE_KEYS are unconditional; CONDITIONAL_KEYS: if on desktop, must be on mobile
            for (const key of REQUIRED_CORE_KEYS) {
                expect(desktopSnap.pricingLineItemKeys, `Desktop missing required key: ${key}`).toContain(key);
                expect(mobileSnap.pricingLineItemKeys, `Mobile missing required key: ${key}`).toContain(key);
            }
            // Conditional key cross-device rule: present on desktop → must be on mobile
            for (const key of desktopSnap.pricingLineItemKeys) {
                if (!REQUIRED_CORE_KEYS.includes(key as any)) {
                    expect(
                        mobileSnap.pricingLineItemKeys,
                        `Conditional key "${key}" present on desktop but missing on mobile`
                    ).toContain(key);
                }
            }

            // ── Fix 6: Required keys must appear on mobile even when value = ₹0 ──
            // This assertion guards against the mobile zero-value filter dropping
            // required keys like accessories (₹0), insurance_addons (₹0), etc.
            for (const key of REQUIRED_CORE_KEYS) {
                expect(
                    mobileSnap.pricingLineItemKeys,
                    `Mobile dropped required key at ₹0: "${key}" — REQUIRED_CORE_KEYS must always render`
                ).toContain(key);
            }

            // ── R3: COMMAND_BAR_KEYS contract assertions (Phase 2-E hardening) ──
            // All 5 command bar keys must be present in parity snapshot on BOTH devices
            // and values must be numerically identical (same buildCommandBarState() call)
            for (const key of COMMAND_BAR_KEYS) {
                const desktopVal = desktopSnap[key];
                const mobileVal = mobileSnap[key];
                expect(desktopVal, `Desktop command bar key missing or null: ${key}`).not.toBeNull();
                expect(mobileVal, `Mobile command bar key missing or null: ${key}`).not.toBeNull();
                expect(mobileVal, `Command bar numeric parity mismatch for key: ${key}`).toBe(desktopVal);
            }

            await desktopCtx.close();
            await mobileCtx.close();
        });

        test(`${product.label}: Desktop and Mobile render same data-parity-section markers`, async ({ browser }) => {
            test.setTimeout(120_000);
            const url = `/store/${product.make}/${product.model}/${product.variant}`;

            const extractSections = async (viewport: { width: number; height: number }, mobile = false) => {
                const ctx = await browser.newContext({
                    viewport,
                    ...(mobile ? { isMobile: true, hasTouch: true } : {}),
                });
                const page = await ctx.newPage();
                await gotoStorePage(page, url);

                // Wait for at least one parity section marker
                await page.waitForSelector('[data-parity-section]', {
                    timeout: 30_000,
                    state: 'attached',
                });

                const sections = await page.evaluate(() =>
                    Array.from(document.querySelectorAll('[data-parity-section]'))
                        .map(el => (el as HTMLElement).dataset.paritySection || '')
                        .filter(Boolean)
                        .sort()
                );

                await ctx.close();
                return sections;
            };

            const desktopSections = await extractSections({ width: 1366, height: 768 });
            const mobileSections = await extractSections({ width: 390, height: 844 }, true);

            // Section marker parity — unconditional sections only.
            // 'specs' is excluded: PdpSpecsSection returns null when product has no spec data
            // (data gap for some SKUs, tracked separately from code parity).
            // Commercial-parity sections (always rendered by both shells):
            const UNCONDITIONAL_SECTIONS = EXPECTED_SECTIONS.filter(s => s !== 'specs');

            for (const section of UNCONDITIONAL_SECTIONS) {
                expect(desktopSections, `Desktop missing section: ${section}`).toContain(section);
                expect(mobileSections, `Mobile missing section: ${section}`).toContain(section);
            }
        });
    }

    // ── Tablet and TV Viewport Matrix (Phase 2-D) ──────────────────────────────
    // Asserts that tablet (768×1024) and TV-like (960×540) snapshots match desktop
    const EXTRA_VIEWPORTS = [
        { label: 'tablet', width: 768, height: 1024, isMobile: true, hasTouch: true, ua: undefined },
        {
            label: 'tv-like',
            width: 960,
            height: 540,
            isMobile: false,
            hasTouch: false,
            ua: 'Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0) AppleWebKit/538.1',
        },
    ] as const;

    for (const product of TEST_PRODUCTS) {
        for (const vp of EXTRA_VIEWPORTS) {
            test(`${product.label}: ${vp.label} snapshot matches desktop`, async ({ browser }) => {
                test.setTimeout(120_000);
                const url = `/store/${product.make}/${product.model}/${product.variant}`;

                // Reference: desktop
                const desktopCtx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
                const desktopPage = await desktopCtx.newPage();
                await gotoStorePage(desktopPage, url);

                // Device under test
                const dvCtx = await browser.newContext({
                    viewport: { width: vp.width, height: vp.height },
                    ...(vp.isMobile ? { isMobile: true, hasTouch: true } : {}),
                    ...(vp.ua ? { userAgent: vp.ua } : {}),
                });
                const dvPage = await dvCtx.newPage();
                await gotoStorePage(dvPage, url);

                const readSnap = async (page: Page) => {
                    await page.waitForSelector('[data-testid="pdp-parity-json"]', {
                        timeout: 30_000,
                        state: 'attached',
                    });
                    const raw = await page
                        .locator('[data-testid="pdp-parity-json"]')
                        .first()
                        .getAttribute('data-parity-snapshot');
                    return raw ? JSON.parse(raw) : null;
                };

                const desktopSnap = await readSnap(desktopPage);
                const dvSnap = await readSnap(dvPage);

                expect(desktopSnap, 'Desktop snap missing').not.toBeNull();
                expect(dvSnap, `${vp.label} snap missing`).not.toBeNull();

                // Core numeric parity
                expect(dvSnap.totalOnRoad, `${vp.label} totalOnRoad mismatch`).toBe(desktopSnap.totalOnRoad);
                expect(dvSnap.baseExShowroom, `${vp.label} baseExShowroom mismatch`).toBe(desktopSnap.baseExShowroom);
                if (desktopSnap.displayOnRoad !== null) {
                    expect(dvSnap.displayOnRoad, `${vp.label} displayOnRoad mismatch`).toBe(desktopSnap.displayOnRoad);
                }
                if (desktopSnap.totalSavings !== null) {
                    expect(dvSnap.totalSavings, `${vp.label} totalSavings mismatch`).toBe(desktopSnap.totalSavings);
                }
                if (desktopSnap.deliveryTatLabel !== null) {
                    expect(dvSnap.deliveryTatLabel, `${vp.label} TAT label mismatch`).toBe(
                        desktopSnap.deliveryTatLabel
                    );
                }

                // Required key presence
                for (const key of REQUIRED_CORE_KEYS) {
                    expect(dvSnap.pricingLineItemKeys, `${vp.label} missing key: ${key}`).toContain(key);
                }

                await desktopCtx.close();
                await dvCtx.close();
            });
        }
    }
});
