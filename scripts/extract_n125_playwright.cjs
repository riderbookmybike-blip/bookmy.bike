const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.bajajauto.com/bikes/pulsar/pulsar-n125', { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  // wait a bit for react/vue to render colors
  await page.waitForTimeout(5000);
  
  // extract colors
  const items = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.exteriorColorPallet li a, .colors-option, .color-list li')).map(el => {
      const colorName = el.getAttribute('data-colorname') || el.innerText;
      const imgPath = el.getAttribute('data-bikeimage');
      const icon = el.querySelector('.icon') || el.querySelector('.bg-color');
      const bg = icon ? window.getComputedStyle(icon).backgroundColor : null;
      return { colorName: colorName.trim(), imgPath, bg };
    }).filter(x => x.colorName);
  });
  
  // extract variants
  const variants = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[data-modelname], .engineVariants a, option')).map(el => {
      const name = el.getAttribute('data-modelname') || el.innerText.trim();
      const code = el.getAttribute('data-modelcode') || el.value;
      return { name, code };
    }).filter(x => x.name && x.code);
  });
  
  // Dedup variants
  const uniqueVariants = [];
  const seenStr = new Set();
  variants.forEach(v => {
      const str = JSON.stringify(v);
      if (!seenStr.has(str)) {
          seenStr.add(str);
          uniqueVariants.push(v);
      }
  });

  const uniqueItems = [];
  const seenImg = new Set();
  items.forEach(c => {
      const str = c.imgPath;
      if (str && !seenImg.has(str)) {
          seenImg.add(str);
          uniqueItems.push(c);
      } else if (!str) {
          uniqueItems.push(c);
      }
  });


  console.log("=== VARIANTS ===");
  uniqueVariants.forEach(v => console.log(JSON.stringify(v)));
  
  console.log("=== COLORS ===");
  uniqueItems.forEach(c => console.log(JSON.stringify(c)));
  
  await browser.close();
})();
