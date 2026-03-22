import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const PHONE_VIEWPORTS = [320, 375, 390, 430] as const;

async function resolveDossierDisplayId(): Promise<string | null> {
    const explicit = String(process.env.PLAYWRIGHT_DOSSIER_ID || '').trim();
    if (explicit) return explicit;

    const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
    const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    if (!supabaseUrl || !serviceRoleKey) return null;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase
        .from('crm_quotes')
        .select('display_id')
        .eq('is_deleted', false)
        .not('display_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error || !data?.display_id) return null;
    return String(data.display_id).trim() || null;
}

test.describe('Dossier Mobile Overflow Guard', () => {
    test('has no horizontal overflow at key phone widths', async ({ browser, baseURL }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop-chrome', 'Runs once on desktop project with custom viewports');

        const displayId = await resolveDossierDisplayId();
        if (!displayId) {
            const message = 'Missing dossier display ID. Set PLAYWRIGHT_DOSSIER_ID or SUPABASE_SERVICE_ROLE_KEY.';
            if (process.env.CI) {
                throw new Error(message);
            }
            test.skip(true, message);
        }
        if (!baseURL) throw new Error('Playwright baseURL is not configured.');

        const dossierUrl = new URL(`/dossier/${encodeURIComponent(displayId)}`, baseURL).toString();

        for (const width of PHONE_VIEWPORTS) {
            const context = await browser.newContext({
                viewport: { width, height: 900 },
                isMobile: true,
                hasTouch: true,
                deviceScaleFactor: 2,
            });
            const page = await context.newPage();

            await page.goto(dossierUrl, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1200);

            const dims = await page.evaluate(() => ({
                innerWidth: window.innerWidth,
                docScrollWidth: document.documentElement.scrollWidth,
                bodyScrollWidth: document.body.scrollWidth,
            }));

            expect(
                dims.docScrollWidth,
                `documentElement overflow at ${width}px (doc=${dims.docScrollWidth}, vw=${dims.innerWidth})`
            ).toBe(dims.innerWidth);
            expect(
                dims.bodyScrollWidth,
                `body overflow at ${width}px (body=${dims.bodyScrollWidth}, vw=${dims.innerWidth})`
            ).toBe(dims.innerWidth);

            await context.close();
        }
    });
});
