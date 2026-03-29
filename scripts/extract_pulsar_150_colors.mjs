import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('https://www.bajajauto.com/bikes/pulsar/pulsar-150');

    // Wait for the 360 viewer or color selections to load
    await page.waitForTimeout(5000);

    const colors = await page.evaluate(() => {
        // Find the color variants from the script tags or image tags
        const imgs = Array.from(document.querySelectorAll('img[src*="360degreeimages/bikes/pulsar/pulsar-150"]'));
        const urls = imgs.map(img => img.src);
        
        // Also let's extract all 360 variant image data
        const scripts = Array.from(document.querySelectorAll('script'));
        let config = null;
        for (const script of scripts) {
            if (script.textContent.includes('threeSixtyImages')) {
                const match = script.textContent.match(/threeSixtyImages\s*=\s*({.*?}?);/sim);
                if (match) {
                     try {
                          config = match[1];
                     } catch(e){}
                }
            }
        }
        
        // Let's get color swatches
        const swatches = Array.from(document.querySelectorAll('.color-swatch, .color-circle, [class*="color"]'));
        const swatchColors = swatches.map(s => ({ class: s.className, bg: s.style.backgroundColor, id: s.id, dataset: Object.assign({}, s.dataset) }));
        
        return { urls, swatchColors, config };
    });

    console.log(JSON.stringify(colors, null, 2));

    await browser.close();
})();
