const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.bajajauto.com/bikes/pulsar/pulsar-n125', { waitUntil: 'domcontentloaded' });
  
  await page.waitForTimeout(4000);
  
  const jsData = await page.evaluate(() => {
    // Collect all unique image URLs for N125
    return Array.from(document.querySelectorAll('img')).map(img => img.src).filter(src => src && src.includes('n125'));
  });
  
  const colors = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.exteriorColorPallet li')).map(li => {
        const aBtn = li.querySelector('a');
        if (!aBtn) return null;
        return {
           name: aBtn.getAttribute('data-colorname'),
           name2: aBtn.getAttribute('data-modelname'),
           img: aBtn.getAttribute('data-bikeimage'),
           color: aBtn.querySelector('.icon') ? window.getComputedStyle(aBtn.querySelector('.icon')).backgroundColor : null
        };
    }).filter(x => x);
  });
  
  const models = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[data-modelcode]')).map(a => ({
        code: a.getAttribute('data-modelcode'),
        name: a.getAttribute('data-modelname') || a.innerText
    }));
  });

  console.log("Colors:", JSON.stringify(colors));
  console.log("Models:", JSON.stringify(models));
  
  await browser.close();
})();
