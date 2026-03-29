import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

async function run() {
  const html = await fetch('https://www.bajajauto.com/bikes/pulsar/pulsar-220f').then(r => r.text());
  const $ = cheerio.load(html);
  
  console.log("=== SPECIFICATIONS ===");
  $('.spec-row').each((i, el) => {
    console.log($(el).text().replace(/\s+/g, ' ').trim());
  });
  
  console.log("\n=== COLORS ===");
  $('[data-color]').each((i, el) => {
    const color = $(el).attr('data-color');
    const colorName = $(el).attr('data-color-name'); // Or similar
    console.log(`Color: ${color}, Title: ${colorName}`);
  });
  
  // let's just find anything with 'color-name' or '360'
  const htmlStr = html.toString();
  const colorMatches = [...htmlStr.matchAll(/data-color-name="([^"]+)"/g)];
  if(colorMatches.length > 0) {
     console.log("Found data-color-name:", colorMatches.map(m => m[1]));
  }

  // 360 CDN paths
  const cdnMatches = [...htmlStr.matchAll(/360-degree[^\"]+/g)];
  console.log("\n=== 360 PATHS ===");
  if(cdnMatches.length > 0) {
      console.log([...new Set(cdnMatches.map(m => m[0]))].slice(0, 10));
  }
}
run();
