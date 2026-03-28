import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

/**
 * VAHAN Dashboard Scraper
 * URL: https://vahan.parivahan.gov.in/vahan4dashboard/vahan/vahan/view/reportview.xhtml
 */

async function main() {
    console.log('🚀 Starting VAHAN Scraper (User Sequenced)...');
    const isHeadless = process.env.HEADLESS === 'true';
    const browser = await chromium.launch({ headless: isHeadless });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    try {
        console.log('Navigating to VAHAN...');
        await page.goto('https://vahan.parivahan.gov.in/vahan4dashboard/vahan/vahan/view/reportview.xhtml', {
            waitUntil: 'networkidle',
            timeout: 60000,
        });

        async function selectPrimeFaces(selectId: string, value: string) {
            await page.locator(`select#${selectId}`).selectOption(value, { force: true });
            await page.locator(`select#${selectId}`).dispatchEvent('change');
            await page.waitForTimeout(2000);
        }

        console.log('1. Setting Baseline State: MH to populate RTOs');
        await selectPrimeFaces('j_idt37_input', 'MH');
        await page.waitForTimeout(4000);

        const rtoOptions = await page.locator('select#selectedRto_input option').all();
        const rtos: { val: string; text: string }[] = [];
        let startIndex = 0;

        for (let i = 0; i < rtoOptions.length; i++) {
            const opt = rtoOptions[i];
            const val = await opt.getAttribute('value');
            const text = (await opt.textContent()) || '';
            if (val && val !== '0' && val !== '-1' && val.trim() !== '') {
                rtos.push({ val, text });
                if (text.includes('MH48')) {
                    startIndex = rtos.length - 1;
                }
            }
        }

        console.log(`✅ Loaded ${rtos.length} RTOs. Forcing loop start at MH48 (Index: ${startIndex}/${rtos.length})`);

        // --- 🤖 USER'S STRICT SEQUENCE LOOP ---
        for (let i = startIndex; i < startIndex + 1; i++) {
            // TEST RUN: ONLY 1 RTO
            const rtoCode = rtos[i].val;
            console.log(`\n======================================================`);
            console.log(`--- [${i + 1}/${rtos.length}] Starting Exact Sequence for: ${rtos[i].text} (${rtoCode}) ---`);
            console.log(`======================================================`);

            // 1. STATE (Just to be absolutely safe, resync State if needed, usually persistent)
            // await selectPrimeFaces('j_idt37_input', 'MH');

            // 2. RTO
            console.log('  -> 1. Selecting RTO');
            await selectPrimeFaces('selectedRto_input', rtoCode);

            // 3. Maker
            console.log('  -> 2. Selecting Y-Axis: Maker');
            await selectPrimeFaces('yaxisVar_input', 'Maker');

            // 4. Month Wise
            console.log('  -> 3. Selecting X-Axis: Month Wise');
            await selectPrimeFaces('xaxisVar_input', 'Month Wise');

            // 5. Calendar Year
            console.log('  -> 4. Selecting Year Type: Calendar Year');
            await selectPrimeFaces('selectedYearType_input', 'Calendar Year');

            // 6. Year 2026
            console.log('  -> 5. Selecting Year: 2026');
            await selectPrimeFaces('selectedYear_input', '2026');

            // --- USER'S REVISED STEP 6: INITIAL REFRESH ---
            console.log('  -> 6. Triggering Initial Main Table Refresh (User Step 6)');
            await page.locator('button:has-text("Refresh")').first().click();
            await page.waitForTimeout(8000);

            // --- USER'S REVISED STEP 7: SIDEPANEL TWO-WHEELER FILTER ---
            console.log('  -> 7. Applying strict TWO WHEELER filter from Sidebar (User Step 7)');
            const leftToggler = page.locator('.ui-layout-toggler-west').first();
            if (await leftToggler.isVisible()) {
                await leftToggler.click();
                await page.waitForTimeout(1000);
            }

            // Using robust Playwright native locators for Primefaces Checkboxes
            const chkBoxes = page.locator('.ui-layout-unit-west .ui-chkbox').filter({ hasText: /TWO WHEELER/i });
            const count = await chkBoxes.count();
            for (let j = 0; j < count; j++) {
                const chk = chkBoxes.nth(j);
                const text = (await chk.textContent()) || '';
                if (!text.toUpperCase().includes('NON BHARAT')) {
                    const box = chk.locator('.ui-chkbox-box');
                    const className = (await box.getAttribute('class')) || '';
                    if (!className.includes('ui-state-active')) {
                        console.log(`     ☑ Checking: ${text.trim()}`);
                        await box.click({ force: true });
                        await page.waitForTimeout(1500); // PrimeFaces AJAX tick
                    }
                }
            }
            await page.waitForTimeout(1000);

            // Sidebar Refresh
            console.log('  -> 8. Committing Sidebar Filter State');
            const panelRefreshBtn = page.locator('.ui-layout-unit-west button:has-text("Refresh")').first();
            if (await panelRefreshBtn.isVisible()) {
                await panelRefreshBtn.click();
            } else {
                await page.locator('button:has-text("Refresh")').first().click();
            }
            await page.waitForTimeout(5000);

            // Close sidebar
            if (await leftToggler.isVisible()) {
                await leftToggler.click();
                await page.waitForTimeout(800);
            }

            // 7. Download
            console.log('  -> 9. Downloading Spreadhseet... (User Step 8)');
            try {
                // Diagnostic screenshot
                await page.screenshot({ path: `scripts/vahan/debug_${rtoCode}.png`, fullPage: true });
                console.log(`  -> Captured diagnostic screenshot: debug_${rtoCode}.png`);

                const [download] = await Promise.all([
                    page.waitForEvent('download', { timeout: 45000 }), // Increased safety margin
                    page.evaluate(() => {
                        const icon = document.querySelector('img[src*="excel"]');
                        if (icon) {
                            const parentLink = icon.closest('a') || icon.parentElement;
                            if (parentLink) (parentLink as HTMLElement).click();
                            else (icon as HTMLElement).click();
                        }
                    }),
                ]);
                const cleanCode = rtoCode.replace(/[^A-Z0-9]/gi, '');
                const downloadPath = path.join(process.cwd(), 'scripts', 'vahan', `vahan_Maker_Month_${cleanCode}.xls`);
                await download.saveAs(downloadPath);
                console.log(`  ✅ Successfully saved: ${downloadPath}`);
            } catch (e) {
                console.log('  ❌ Dropdown missing or Download failed:', (e as Error).message);
            }
        }
        console.log('\n✅ Batch Scraping Completed Successfully!');
    } catch (e) {
        console.error('❌ Error during scraping:', e);
    } finally {
        await browser.close();
    }
}
main().catch(console.error);
