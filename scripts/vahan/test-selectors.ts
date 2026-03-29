import { chromium } from 'playwright';

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    console.log('Navigating...');
    await page.goto('https://vahan.parivahan.gov.in/vahan4dashboard/vahan/vahan/view/reportview.xhtml', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
    });
    await page.waitForTimeout(5000); // give PrimeFaces time

    console.log('Extracting all select elements...');
    const selects = await page.$$eval('select', els =>
        els.map(el => ({ id: el.id, name: el.name, class: el.className }))
    );
    console.log(JSON.stringify(selects, null, 2));
    await browser.close();
}
main().catch(console.error);
