import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

/**
 * VAHAN Dashboard Scraper
 * URL: https://vahan.parivahan.gov.in/vahan4dashboard/vahan/vahan/view/reportview.xhtml
 */

async function main() {
    console.log('🚀 Starting VAHAN Scraper (User Sequenced)...');
    const isHeadless = process.env.HEADLESS === 'true';
    const batchSize = Number(process.env.RTO_BATCH_SIZE || 0);
    const forceRescrape = process.env.FORCE_RESCRAPE === 'true';
    const outputSuffix = String(process.env.OUTPUT_SUFFIX || '')
        .trim()
        .replace(/[^A-Za-z0-9_-]/g, '')
        .toLowerCase();
    const fuelFilters = String(process.env.FUEL_FILTERS || '')
        .split(',')
        .map(v => v.trim())
        .filter(Boolean);
    const excludedCodes = new Set(
        String(process.env.EXCLUDED_RTO_CODES || '99')
            .split(',')
            .map(v => v.trim())
            .filter(Boolean)
            .map(v => String(Number(v)))
    );
    const targetCodes = new Set(
        String(process.env.RTO_CODES || '')
            .split(',')
            .map(v => v.trim())
            .filter(Boolean)
            .map(v => String(Number(v)))
    );
    const browser = await chromium.launch({ headless: isHeadless });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    try {
        console.log('Navigating to VAHAN...');
        await page.goto('https://vahan.parivahan.gov.in/vahan4dashboard/vahan/vahan/view/reportview.xhtml', {
            waitUntil: 'domcontentloaded',
            timeout: 120000,
        });
        // PrimeFaces renders dropdowns via server-side AJAX after initial HTML — wait generously
        await page.waitForSelector('select#j_idt38_input', { state: 'attached', timeout: 90000 });
        await page.waitForTimeout(3000); // Extra buffer for PrimeFaces to finish binding

        async function selectPrimeFaces(selectId: string, value: string) {
            await page.locator(`select#${selectId}`).selectOption(value, { force: true });
            await page.locator(`select#${selectId}`).dispatchEvent('change');
            await page.waitForTimeout(2000);
        }

        console.log('1. Setting Baseline State: MH to populate RTOs');
        await selectPrimeFaces('j_idt38_input', 'MH');
        await page.waitForTimeout(4000);

        const rtoOptions = await page.locator('select#selectedRto_input option').all();
        const rtos: { val: string; text: string; code: string }[] = [];

        for (let i = 0; i < rtoOptions.length; i++) {
            const opt = rtoOptions[i];
            const val = await opt.getAttribute('value');
            const text = (await opt.textContent()) || '';
            if (val && val !== '0' && val !== '-1' && val.trim() !== '') {
                const normalizedVal = String(Number(val));
                if (excludedCodes.has(normalizedVal)) continue;
                const standardizedVal = val.padStart(2, '0');
                rtos.push({ val, text, code: 'MH' + standardizedVal });
            }
        }

        console.log(`✅ Loaded ${rtos.length} Maharashtra RTOs: ${rtos.map(r => r.code).join(', ')}`);
        const yearsToScrape = (process.env.SCRAPE_YEAR || '2026')
            .split(',')
            .map(y => y.trim())
            .filter(Boolean);
        const outputDir = path.join(process.cwd(), 'scripts', 'vahan');

        const scopedRtos = targetCodes.size > 0 ? rtos.filter(rto => targetCodes.has(String(Number(rto.val)))) : rtos;

        const pendingRtos = scopedRtos.filter(rto => {
            return yearsToScrape.some(targetYear => {
                const cleanCode = rto.val.replace(/[^A-Z0-9]/gi, '');
                const suffix = outputSuffix ? `_${outputSuffix}` : '';
                const jsonPath = path.join(outputDir, `vahan_Maker_Month_${cleanCode}_${targetYear}${suffix}.json`);
                return forceRescrape || !fs.existsSync(jsonPath);
            });
        });

        if (pendingRtos.length === 0) {
            console.log('✅ No pending RTOs. All selected years already scraped.');
            return;
        }

        const rtosToProcess = batchSize > 0 ? pendingRtos.slice(0, batchSize) : pendingRtos;
        console.log(
            `📦 Pending RTOs: ${pendingRtos.length} | This run: ${rtosToProcess.length}${batchSize > 0 ? ` (batch size ${batchSize})` : ''}`
        );

        // --- 🤖 USER'S STRICT SEQUENCE LOOP ---
        for (let i = 0; i < rtosToProcess.length; i++) {
            const current = rtosToProcess[i];
            const rtoCode = current.val;
            console.log(`\n======================================================`);
            console.log(
                `--- [${i + 1}/${rtosToProcess.length}] Starting Exact Sequence for: ${current.text} (${rtoCode}) ---`
            );
            console.log(`======================================================`);

            // 2. RTO
            console.log('  -> 1. Selecting RTO');
            await selectPrimeFaces('selectedRto_input', rtoCode);

            for (const targetYear of yearsToScrape) {
                const cleanCode = rtoCode.replace(/[^A-Z0-9]/gi, '');
                const suffix = outputSuffix ? `_${outputSuffix}` : '';
                const jsonPath = path.join(outputDir, `vahan_Maker_Month_${cleanCode}_${targetYear}${suffix}.json`);
                if (!forceRescrape && fs.existsSync(jsonPath)) {
                    console.log(
                        `  ⏭️  Skipping ${current.code} ${targetYear} (already fetched): ${path.basename(jsonPath)}`
                    );
                    continue;
                }

                console.log(`\n  🟢 --- SCRAPING YEAR: ${targetYear} ---`);

                // 3. Maker
                console.log('  -> 2. Selecting Y-Axis: Maker');
                await selectPrimeFaces('yaxisVar_input', 'Maker');

                // 4. Month Wise
                console.log('  -> 3. Selecting X-Axis: Month Wise');
                await selectPrimeFaces('xaxisVar_input', 'Month Wise');

                // 5. Calendar Year
                console.log('  -> 4. Selecting Year Type: Calendar Year');
                await selectPrimeFaces('selectedYearType_input', 'Calendar Year');

                // 6. Year
                console.log(`  -> 5. Selecting Year: ${targetYear}`);
                await selectPrimeFaces('selectedYear_input', targetYear);

                // --- USER'S REVISED STEP 6: INITIAL REFRESH ---
                console.log('  -> 6. Triggering Initial Main Table Refresh (User Step 6)');
                await page.locator('button:has-text("Refresh")').first().click();
                await page.waitForTimeout(8000);

                // --- USER'S REVISED STEP 7: SIDEPANEL TWO-WHEELER FILTER ---
                console.log('  -> 7. Applying strict TWO WHEELER filter from Sidebar (User Step 7)');
                const leftToggler = page.locator('.ui-layout-toggler-west').first();
                if (await leftToggler.isVisible()) {
                    await leftToggler.click();
                    await page.waitForTimeout(3000); // Thodi speed kam ki
                }

                // IMPORTANT: Wait for the labels to physically render in the DOM!
                try {
                    await page.waitForSelector('label:has-text("TWO")', { state: 'visible', timeout: 10000 });
                } catch (e) {
                    console.log('     ⚠️ Warning: TWO WHEELER labels did not appear within 10s.');
                }

                // Using Playwright native locators chained to XPath for the preceding sibling
                // This guarantees finding the exact Primefaces Box associated with the label!
                const targetLabels = page.locator('label').filter({ hasText: /TWO WHEELER/i });
                const labelCount = await targetLabels.count();
                console.log(`     ☑ Found ${labelCount} matching 'TWO WHEELER' labels in DOM.`);

                for (let j = 0; j < labelCount; j++) {
                    const lbl = targetLabels.nth(j);
                    const labelText = (await lbl.textContent()) || '';
                    if (!labelText.toUpperCase().includes('NON BHARAT')) {
                        // Traverse to the Primefaces Checkbox container, then down to the inner box
                        const box = lbl
                            .locator(
                                'xpath=preceding-sibling::div[contains(@class, "ui-chkbox")]//div[contains(@class, "ui-chkbox-box")]'
                            )
                            .first();
                        const className = (await box.getAttribute('class')) || '';
                        if (!className.includes('ui-state-active')) {
                            console.log(`     ☑ Toggling Checkbox: ${labelText.trim()}`);
                            await box.click({ force: true });
                            await page.waitForTimeout(2500); // Thodi speed kam ki
                        }
                    }
                }

                await page.waitForTimeout(3000);

                if (fuelFilters.length > 0) {
                    console.log(`  -> 7b. Applying Fuel Filters: ${fuelFilters.join(', ')}`);
                    const allFuelLabels = await page.locator('label').allTextContents();
                    for (const wantedFuel of fuelFilters) {
                        let matched = false;
                        for (const rawLabel of allFuelLabels) {
                            const label = String(rawLabel || '').trim();
                            if (!label) continue;
                            if (label.toUpperCase() !== wantedFuel.toUpperCase()) continue;
                            matched = true;
                            const fuelLabel = page.locator('label', { hasText: label }).first();
                            const fuelBox = fuelLabel
                                .locator(
                                    'xpath=preceding-sibling::div[contains(@class, "ui-chkbox")]//div[contains(@class, "ui-chkbox-box")]'
                                )
                                .first();
                            const className = (await fuelBox.getAttribute('class')) || '';
                            if (!className.includes('ui-state-active')) {
                                await fuelBox.click({ force: true });
                                await page.waitForTimeout(1200);
                            }
                        }
                        if (!matched) {
                            console.log(`     ⚠️ Fuel filter not found in panel: "${wantedFuel}"`);
                        }
                    }
                    await page.waitForTimeout(1500);
                }

                // Sidebar Refresh (STRICT BOUNDARY - NO FALLBACK)
                console.log('  -> 8. Committing Sidebar Filter State (Side Panel Bottom Refresh Only)');
                try {
                    // Utilizing the user's HTML dump to target the exact footer wrapper class
                    const panelRefreshBtn = page
                        .locator('.ui-layout-unit-footer')
                        .getByRole('button', { name: /Refresh/i })
                        .first();
                    await panelRefreshBtn.click({ force: true }); // Force click to bypass any Primefaces occlusion
                    console.log('     ☑ Successfully clicked Side Panel Bottom Refresh.');
                } catch (e: any) {
                    console.log(`     ⚠️ Failed to click Side Panel Refresh: ${e.message}`);
                }

                await page.waitForTimeout(6000);

                // Close sidebar
                if (await leftToggler.isVisible()) {
                    await leftToggler.click();
                    await page.waitForTimeout(800);
                }

                // 7. Direct DOM Extraction (Bypassing Excel Download limits)
                console.log('  -> 9. Extracting Data Directly from Grid... (Bypassing Download)');
                try {
                    const extractedData = await page.$$eval('table[role="grid"] tbody tr', rows => {
                        return rows.map(row => {
                            const cells = Array.from(row.querySelectorAll('td'));
                            return cells.map(td => td.textContent?.replace(/,/g, '').trim() || '');
                        });
                    });

                    fs.writeFileSync(jsonPath, JSON.stringify(extractedData, null, 2));
                    console.log(`  ✅ Successfully Extracted ${extractedData.length} records to ${jsonPath}`);

                    // Print first 8 rows for immediate confirmation
                    console.log(`\n  --- ⚡ HIGHLIGHT DATA FOR MH48 (${targetYear}) ---`);
                    extractedData.slice(0, 8).forEach(row => {
                        console.log(
                            `  Maker: ${row[1]} | Jan: ${row[2]} | Feb: ${row[3]} | Mar: ${row[4]} | Total: ${row[row.length - 1]}`
                        );
                    });
                    console.log('  ------------------------------------------\n');
                } catch (e: any) {
                    console.log(`  ❌ Data Extraction failed for ${targetYear}:`, e.message);
                }
            } // end year loop
        }
        console.log('\n✅ Historical Scraping Completed Successfully!');
    } catch (e: any) {
        console.error('❌ Error during scraping:', e);
        try {
            if (page) {
                const debugPath = path.join(process.cwd(), 'scripts', 'vahan', 'debug_crash.png');
                await page.screenshot({ path: debugPath, fullPage: true });
                console.log(`📸 Saved debug screenshot to ${debugPath}`);
            }
        } catch (scErr) {
            console.error('Failed to take debug screenshot', scErr);
        }
    } finally {
        await browser.close();
    }
}
main().catch(console.error);
