import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

/**
 * VAHAN Dashboard Scraper
 * URL: https://vahan.parivahan.gov.in/vahan4dashboard/vahan/vahan/view/reportview.xhtml
 */

async function main() {
    console.log('🚀 Starting VAHAN Scraper...');
    // The user asked "ye browser bar bar badn kyu ho raha hai"
    // So we will NOT close the browser automatically anymore, we'll leave it open for debugging.
    const isHeadless = process.env.HEADLESS === 'true';
    const browser = await chromium.launch({ headless: isHeadless });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('Navigating to VAHAN Dashboard...');
        await page.goto('https://vahan.parivahan.gov.in/vahan4dashboard/vahan/vahan/view/reportview.xhtml', {
            waitUntil: 'networkidle',
            timeout: 60000,
        });

        async function selectPrimeFaces(selectId: string, value: string) {
            await page.locator(`select#${selectId}`).selectOption(value, { force: true });
            await page.locator(`select#${selectId}`).dispatchEvent('change');
            await page.waitForTimeout(3000);
        }

        console.log('1. Selecting State: Maharashtra (MH)');
        await selectPrimeFaces('j_idt37_input', 'MH');

        console.log('2. Selecting Y-Axis: Maker');
        await selectPrimeFaces('yaxisVar_input', 'Maker');

        console.log('3. Selecting X-Axis: Month Wise');
        await selectPrimeFaces('xaxisVar_input', 'Month Wise');

        console.log('4. Selecting Year: 2026');
        await selectPrimeFaces('selectedYear_input', '2026');

        console.log('5. Opening Left Panel for Global Category Filter...');
        try {
            const leftToggler = page.locator('.ui-layout-toggler-west').first();
            if (await leftToggler.isVisible()) {
                await leftToggler.click();
                await page.waitForTimeout(2000); // Wait for slide animation
            }

            // Find and check all TWO WHEELER related checkboxes via robust text matching
            console.log('Selecting TWO WHEELER checkboxes in side panel...');
            const twoWheelerElements = await page.getByText(/TWO WHEELER/i).all();

            if (twoWheelerElements.length > 0) {
                for (const el of twoWheelerElements) {
                    // Clicking the text itself might toggle the checkbox depending on the PrimeFaces layout,
                    // but to be safe we click the element and optionally its sibling ui-chkbox-box if it exists
                    try {
                        await el.click({ force: true });
                        await page.waitForTimeout(500);
                    } catch (e) {
                        console.log('⚠️ Could not click a Two Wheeler label directly.');
                    }
                }

                console.log('Clicking Top Refresh inside side panel...');
                const panelRefreshBtn = page.locator('.ui-layout-unit-west button:has-text("Refresh")').first();
                if (await panelRefreshBtn.isVisible()) {
                    await panelRefreshBtn.click();
                } else {
                    await page.locator('button:has-text("Refresh")').first().click();
                }
                await page.waitForTimeout(8000);
            } else {
                console.log('⚠️ Could not find TWO WHEELER text anywhere in the left panel!');
            }

            // Close the panel again to get it out of the way
            if (await leftToggler.isVisible()) {
                await leftToggler.click();
                await page.waitForTimeout(1000);
            }
        } catch (e) {
            console.log('⚠️ Failed to interact with left panel filters:', (e as Error).message);
        }

        console.log('6. Extracting All RTOs...');
        // We need to wait for the RTO dropdown to populate with MH RTOs
        await page.waitForTimeout(2000);
        const rtoOptions = await page.locator('select#selectedRto_input option').all();
        const rtos = [];
        for (const opt of rtoOptions) {
            const val = await opt.getAttribute('value');
            // '0' is usually 'All Vahan4 Running office'
            if (val && val !== '0' && val.trim() !== '') {
                rtos.push(val);
            }
        }

        console.log(`Found ${rtos.length} RTOs to scrape.`);

        for (let i = 0; i < rtos.length; i++) {
            const rtoCode = rtos[i];
            if (rtoCode === '-1' || rtoCode === '0') continue; // Skip invalid or default values

            console.log(`\n--- [${i + 1}/${rtos.length}] Processing RTO: ${rtoCode} ---`);

            await selectPrimeFaces('selectedRto_input', rtoCode);

            console.log('Clicking Refresh...');
            await page.locator('button:has-text("Refresh")').first().click();
            await page.waitForTimeout(8000);

            console.log('Triggering Excel Download...');
            try {
                const [download] = await Promise.all([
                    page.waitForEvent('download', { timeout: 15000 }),
                    page
                        .locator('a')
                        .filter({ has: page.locator('img[src*="excel"]') })
                        .first()
                        .click()
                        .catch(() => page.locator('img[src*="excel"]').first().click()),
                ]);
                const cleanCode = rtoCode.replace(/[^A-Z0-9]/gi, '');
                const downloadPath = path.join(process.cwd(), 'scripts', 'vahan', `vahan_Maker_Month_${cleanCode}.xls`);
                await download.saveAs(downloadPath);
                console.log(`✅ Saved: ${downloadPath}`);
            } catch (e) {
                console.log('❌ Failed to download spreadsheet:', (e as Error).message);
            }
        }

        console.log('\n✅ Batch Scraping Completed Successfully!');
    } catch (error) {
        console.error('❌ Error during scraping:', error);
    } finally {
        console.log('Closing browser...');
        await browser.close();
    }
}

main().catch(console.error);
