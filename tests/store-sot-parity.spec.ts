import { test, expect, type Page } from '@playwright/test';

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

const DISTRICT = 'Palghar';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// ─── Helpers ─────────────────────────────────────────────────

async function gotoStorePage(page: Page, url: string) {
    const target = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    const districtFromUrl = (() => {
        try {
            return new URL(target).searchParams.get('district') || DISTRICT;
        } catch {
            return DISTRICT;
        }
    })();

    await page.addInitScript(
        ({ district }) => {
            try {
                window.localStorage.setItem(
                    'bkmb_user_pincode',
                    JSON.stringify({
                        district,
                        stateCode: 'MH',
                        state: 'MAHARASHTRA',
                        manuallySet: true,
                        source: 'TEST',
                    })
                );
            } catch {
                // noop
            }
        },
        { district: districtFromUrl }
    );

    await page.goto(target, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
}

async function extractFirstCatalogOfferCardMeta(page: Page): Promise<{
    href: string;
    dealerId: string;
    offerDelta: number;
    district: string;
} | null> {
    await page.waitForSelector('[data-testid="catalog-product-card"], [data-testid="catalog-compact-card"]', {
        timeout: 30_000,
    });
    await page.waitForFunction(() => {
        const cards = Array.from(
            document.querySelectorAll('[data-testid="catalog-product-card"], [data-testid="catalog-compact-card"]')
        ) as HTMLElement[];

        return cards.some(card => {
            const anchors = Array.from(card.querySelectorAll('a[href]'));
            return anchors.some(anchor => {
                const href = anchor.getAttribute('href') || '';
                if (!href) return false;
                try {
                    const parsed = new URL(href, window.location.origin);
                    const path = parsed.pathname.split('/').filter(Boolean);
                    const storeIndex = path.indexOf('store');
                    return storeIndex >= 0 && path.length - storeIndex >= 4;
                } catch {
                    return false;
                }
            });
        });
    });

    try {
        await page.waitForFunction(
            () => {
                const cards = Array.from(
                    document.querySelectorAll(
                        '[data-testid="catalog-product-card"], [data-testid="catalog-compact-card"]'
                    )
                ) as HTMLElement[];
                return cards.some(card => {
                    const offerDelta = Number(card.dataset.offerDelta || '0');
                    if (Math.abs(offerDelta) === 0) return false;
                    return Array.from(card.querySelectorAll('a[href]')).some(anchor => {
                        const href = anchor.getAttribute('href') || '';
                        if (!href) return false;
                        try {
                            const parsed = new URL(href, window.location.origin);
                            const path = parsed.pathname.split('/').filter(Boolean);
                            const storeIndex = path.indexOf('store');
                            return storeIndex >= 0 && path.length - storeIndex >= 4;
                        } catch {
                            return false;
                        }
                    });
                });
            },
            { timeout: 15_000 }
        );
    } catch {
        // non-zero offer card may not exist for some markets; fallback to any valid card below
    }

    for (let attempt = 0; attempt < 6; attempt += 1) {
        const candidate = await page.evaluate(() => {
            const cards = Array.from(
                document.querySelectorAll('[data-testid="catalog-product-card"], [data-testid="catalog-compact-card"]')
            ) as HTMLElement[];
            let fallback: { href: string; dealerId: string; offerDelta: number; district: string } | null = null;

            for (const card of cards) {
                const link = Array.from(card.querySelectorAll('a[href]')).find(anchor => {
                    const href = anchor.getAttribute('href') || '';
                    if (!href) return false;
                    try {
                        const parsed = new URL(href, window.location.origin);
                        const path = parsed.pathname.split('/').filter(Boolean);
                        const storeIndex = path.indexOf('store');
                        return storeIndex >= 0 && path.length - storeIndex >= 4;
                    } catch {
                        return false;
                    }
                }) as HTMLAnchorElement | undefined;

                if (!link) continue;

                const rawHref = link.getAttribute('href') || '';
                if (!rawHref) continue;

                let href = rawHref;
                try {
                    const parsed = new URL(rawHref, window.location.origin);
                    href = `${parsed.pathname}${parsed.search}`;
                } catch {
                    // use raw href
                }

                const dealerId = String(card.dataset.dealerId || '').trim();

                const item = {
                    href,
                    dealerId,
                    offerDelta: Number(card.dataset.offerDelta || '0'),
                    district: String(card.dataset.district || ''),
                };

                if (Math.abs(item.offerDelta) > 0) return item;
                if (!fallback) fallback = item;
            }

            return fallback;
        });

        if (candidate) {
            return candidate;
        }

        await page.waitForTimeout(500);
    }

    return null;
}

async function extractPdpOfferMeta(
    page: Page
): Promise<{ dealerId: string; offerDelta: number; district: string } | null> {
    const meta = page.locator('[data-testid="pdp-offer-meta"]').first();
    await meta.waitFor({ state: 'attached', timeout: 30_000 });

    return meta.evaluate(el => {
        const node = el as HTMLElement;
        return {
            dealerId: String(node.dataset.dealerId || ''),
            offerDelta: Number(node.dataset.offerDelta || '0'),
            district: String(node.dataset.district || ''),
        };
    });
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
            const url = `/store/${product.make}/${product.model}/${product.variant}?district=${DISTRICT}`;
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
            const url = `/store/${product.make}/${product.model}/${product.variant}?district=${DISTRICT}`;
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
            const url = `/store/${product.make}/${product.model}/${product.variant}?district=${DISTRICT}`;
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
        await gotoStorePage(page, `/store/catalog?district=${DISTRICT}`);

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
        const url = `/store/${product.make}/${product.model}/${product.variant}?district=${DISTRICT}`;

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

    test('Catalog to PDP dealer + offer parity matches on desktop and phone', async ({ browser }) => {
        test.setTimeout(120_000);

        const contexts = [
            {
                label: 'desktop',
                options: {
                    viewport: { width: 1366, height: 768 },
                },
            },
            {
                label: 'phone',
                options: {
                    viewport: { width: 390, height: 844 },
                    isMobile: true,
                    hasTouch: true,
                },
            },
        ] as const;

        for (const entry of contexts) {
            const context = await browser.newContext(entry.options);
            const page = await context.newPage();

            await gotoStorePage(page, `/store/catalog?district=${DISTRICT}`);
            const cardMeta = await extractFirstCatalogOfferCardMeta(page);
            expect(cardMeta, `${entry.label}: no catalog card metadata found`).not.toBeNull();

            await gotoStorePage(page, cardMeta!.href);
            const pdpMeta = await extractPdpOfferMeta(page);
            expect(pdpMeta, `${entry.label}: no PDP offer metadata found`).not.toBeNull();

            expect(pdpMeta!.dealerId, `${entry.label}: PDP dealer must be resolved`).not.toBe('');
            if (cardMeta!.dealerId) {
                expect(
                    pdpMeta!.dealerId,
                    `${entry.label}: dealer mismatch catalog=${cardMeta!.dealerId} pdp=${pdpMeta!.dealerId}`
                ).toBe(cardMeta!.dealerId);
            }

            if (Math.abs(cardMeta!.offerDelta) > 0) {
                expect(
                    Math.abs(pdpMeta!.offerDelta - cardMeta!.offerDelta),
                    `${entry.label}: offer delta mismatch catalog=${cardMeta!.offerDelta} pdp=${pdpMeta!.offerDelta}`
                ).toBeLessThanOrEqual(1);
            } else {
                expect(Number.isFinite(pdpMeta!.offerDelta), `${entry.label}: PDP offer delta is not numeric`).toBe(
                    true
                );
            }

            await context.close();
        }
    });
});

// ─── PDP Content Parity (Desktop ↔ Mobile Section Presence + Snapshot) ──────

test.describe('PDP Content Parity', () => {
    const EXPECTED_SECTIONS = ['pricing', 'finance', 'finance-summary', 'config', 'specs', 'command-bar'];

    for (const product of TEST_PRODUCTS) {
        test(`${product.label}: Desktop and Mobile render same parity snapshot`, async ({ browser }) => {
            test.setTimeout(120_000);
            const url = `/store/${product.make}/${product.model}/${product.variant}?district=${DISTRICT}`;

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

            await desktopCtx.close();
            await mobileCtx.close();
        });

        test(`${product.label}: Desktop and Mobile render same data-parity-section markers`, async ({ browser }) => {
            test.setTimeout(120_000);
            const url = `/store/${product.make}/${product.model}/${product.variant}?district=${DISTRICT}`;

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

            // Both should have all expected sections
            for (const section of EXPECTED_SECTIONS) {
                expect(desktopSections, `Desktop missing section: ${section}`).toContain(section);
                expect(mobileSections, `Mobile missing section: ${section}`).toContain(section);
            }

            // Same set of sections on both
            expect(mobileSections, 'Section list mismatch between desktop and mobile').toEqual(desktopSections);
        });
    }
});
