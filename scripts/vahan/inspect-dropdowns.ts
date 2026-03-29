import { chromium } from 'playwright';

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    console.log('Navigating...');
    await page.goto('https://vahan.parivahan.gov.in/vahan4dashboard/vahan/vahan/view/reportview.xhtml', {
        waitUntil: 'domcontentloaded',
        timeout: 90000,
    });
    await page.waitForTimeout(5000);

    // Find all ui-selectonemenu wrappers and get their hidden input id + preceding label
    const map = await page.$$eval('.ui-selectonemenu', selects => {
        return selects.map(s => {
            const selectId = s.querySelector('select')?.id || 'no-select-id';
            // Primefaces standard - label is often in a td previous to the parent td, or explicitly linked
            const labelEl = document.querySelector(`label[for="${selectId.replace('_input', '')}"]`);
            // But if there's no explicit 'for', we look at text content of parent row
            const parentText = s.closest('td')?.previousElementSibling?.textContent?.trim() || 'no-label';
            return { id: selectId, associatedText: labelEl?.textContent?.trim() || parentText };
        });
    });

    console.log(JSON.stringify(map, null, 2));
    await browser.close();
}
main().catch(console.error);
