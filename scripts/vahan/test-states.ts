import { chromium } from 'playwright';
async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://vahan.parivahan.gov.in/vahan4dashboard/vahan/vahan/view/reportview.xhtml', {
        waitUntil: 'domcontentloaded',
        timeout: 90000,
    });
    await page.waitForTimeout(5000);
    const options = await page.$$eval('#j_idt38_input option', opts =>
        opts.slice(0, 5).map(o => o.textContent?.trim())
    );
    console.log('j_idt38_input options:', options);
    const options29 = await page.$$eval('#j_idt29_input option', opts =>
        opts.slice(0, 5).map(o => o.textContent?.trim())
    );
    console.log('j_idt29_input options:', options29);
    await browser.close();
}
main().catch(console.error);
