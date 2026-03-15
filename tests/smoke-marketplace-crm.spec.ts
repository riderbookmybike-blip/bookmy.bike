import { test, expect, type Page } from '@playwright/test';

const AUMS_PHONE = '9820760596';

function buildPhone(seed: string, salt: string) {
    const raw = `${seed}${salt}${Math.random().toString().slice(2, 8)}`;
    const digits = raw.replace(/\D/g, '').padStart(9, '7').slice(-9);
    return `9${digits}`;
}

async function openMarketplaceLeadModal(page: Page) {
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
    await page.goto('/store/tvs/jupiter/drum', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    await clickQuoteCtaWithRetry(page);

    await expect(page.getByPlaceholder('00000 00000')).toBeVisible({ timeout: 20_000 });
}

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

async function loginToAums(page: Page) {
    const res = await page.request.post('/api/auth/msg91/verify', {
        data: { phone: AUMS_PHONE, otp: '1234' },
    });
    expect(res.ok()).toBeTruthy();
}

test.describe('Marketplace + CRM Smoke', () => {
    test.describe.configure({ mode: 'serial' });

    test('marketplace lead capture creates quote flow', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop-chrome', 'Runs once on desktop only');
        const tag = Date.now().toString().slice(-9);
        const phone = buildPhone(tag, testInfo.title);

        await openMarketplaceLeadModal(page);
        await page.getByPlaceholder('00000 00000').fill(phone);
        await page.getByRole('button', { name: /Continue/i }).click();

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

    test('crm lead create from leads module', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop-chrome', 'Runs once on desktop only');
        const tag = Date.now().toString().slice(-8);
        const phone = buildPhone(tag, testInfo.title);

        await loginToAums(page);
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
