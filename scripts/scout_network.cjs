const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const urls = new Set();
  page.on('response', response => {
      const url = response.url();
      if (url.includes('.webp') || url.includes('.png') || url.includes('.jpg')) {
          urls.add(url);
      }
  });

  await page.goto('https://www.bajajauto.com/bikes/pulsar/pulsar-n125', { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(10000);
  
  console.log(Array.from(urls).filter(u => u.includes('n125') && u.includes('cdn')).join('\n'));
  await browser.close();
})();
