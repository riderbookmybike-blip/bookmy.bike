const fs = require('fs');
const path = require('path');
const https = require('https');

const BASES = [
    'https://www.tvsmotor.com/tvs-xl100/-/media/Brand-Pages/XL100/Colours/Comfort/CF-blue/CF-blue/',
    'https://www.tvsmotor.com/tvs-xl100/-/media/Brand-Pages/XL100/Colours/Comfort/Gold/cf-biege-webp/',
    'https://www.tvsmotor.com/tvs-xl100/-/media/Brand-Pages/XL100/Colours/Heavy-Duty-KS/Blue/',
    'https://www.tvsmotor.com/tvs-xl100/-/media/Brand-Pages/XL100/Colours/Heavy-Duty-KS/green/new/',
    'https://www.tvsmotor.com/tvs-xl100/-/media/Brand-Pages/XL100/Colours/Heavy-Duty-KS/black/New/',
];

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const options = {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                Referer: 'https://www.tvsmotor.com/',
            },
        };
        https
            .get(url, options, response => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                    return;
                }
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            })
            .on('error', err => {
                fs.unlink(dest);
                reject(err);
            });
    });
};

const run = async () => {
    const outputDir = path.join(__dirname, 'tmp_xl100_images');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    for (let i = 0; i < BASES.length; i++) {
        const base = BASES[i];
        const folderName = base
            .split('/')
            .slice(-3, -1)
            .join('_')
            .replace(/[^a-zA-Z0-9_]/g, '');
        const variantDir = path.join(outputDir, folderName);
        if (!fs.existsSync(variantDir)) fs.mkdirSync(variantDir);

        for (let j = 1; j <= 8; j++) {
            const url = `${base}${j}.webp`;
            const dest = path.join(variantDir, `${j}.webp`);
            console.log(`Downloading ${url}...`);
            try {
                await download(url, dest);
            } catch (e) {
                console.error(`Error downloading ${url}: ${e.message}`);
            }
        }
    }
};

run();
