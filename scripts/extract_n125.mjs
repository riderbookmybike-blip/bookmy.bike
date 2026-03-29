import fs from 'fs';
import * as cheerio from 'cheerio';

async function extract() {
    const res = await fetch('https://www.bajajauto.com/bikes/pulsar/pulsar-n125');
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Attempt to find script block containing bike data or 360 data
    const scripts = $('script').toArray();
    for (const script of scripts) {
        const content = $(script).html() || '';
        if (content.includes('variants') && content.includes('color')) {
            // we might have js data here
        }
    }
    
    // Look for color list in HTML
    console.log("Found colors:");
    $('.exteriorColorPallet li a').each((i, el) => {
        const colorName = $(el).attr('data-colorname');
        const colorCode = $(el).find('.icon').css('background-color') || $(el).find('.icon').attr('style'); 
        const imgPath = $(el).attr('data-bikeimage');
        console.log(`- ${colorName}: ${imgPath} | style: ${colorCode}`);
    });
    
    // Look for variant dropdown or tabs
    console.log("\nVariants:");
    $('select option').each((i, el) => {
        console.log(`- ${$(el).text().trim()} | ${$(el).attr('value')}`);
    });
    $('.variant-tab, .variant-list li').each((i, el) => {
        console.log(`- ${$(el).text().trim()}`);
    });
}
extract();
