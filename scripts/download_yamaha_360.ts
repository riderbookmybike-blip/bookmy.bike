import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import { ReadableStream } from 'stream/web';

const BASE_URL =
    'https://www.yamaha-motor-india.com/theme/v4/images/webp_images/rayzr_all/ray-zr-streetrally125fihybrid';

const ASSETS = [
    {
        color: 'mattegrey',
        type: '360',
        count: 40,
        baseUrl: `${BASE_URL}/360_new`,
        localPath: 'public/media/yamaha/rayzr-street-rally-125-fi-hybrid/standard/mattegrey/360',
    },
    {
        color: 'mattegrey',
        type: 'static',
        url: `${BASE_URL}/color/matt_grey_metallic.webp`,
        localPath: 'public/media/yamaha/rayzr-street-rally-125-fi-hybrid/standard/mattegrey/static.webp',
    },
    {
        color: 'gray', // Ice Fluo Vermillion
        type: 'static',
        url: `${BASE_URL}/color/Light-Grey-Vermillion.webp`,
        localPath: 'public/media/yamaha/rayzr-street-rally-125-fi-hybrid/standard/gray/static.webp',
    },
    {
        color: 'green1', // Cyber Green
        type: 'static',
        url: `${BASE_URL}/color/Matte-Green.webp`,
        localPath: 'public/media/yamaha/rayzr-street-rally-125-fi-hybrid/standard/green1/static.webp',
    },
    {
        color: 'black', // Matte Black
        type: 'static',
        url: `${BASE_URL}/color/Matte-Black.webp`,
        localPath: 'public/media/yamaha/rayzr-street-rally-125-fi-hybrid/standard/black/static.webp',
    },
];

const downloadFile = async (url: string, dest: string) => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    console.log(`Downloading ${url} to ${dest}...`);
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
        if (!res.body) throw new Error(`No body for ${url}`);

        const fileStream = fs.createWriteStream(dest);
        await finished(Readable.fromWeb(res.body as ReadableStream).pipe(fileStream));
        console.log(`Saved ${dest}`);
    } catch (error) {
        console.error(`Error downloading ${url}:`, error);
    }
};

const main = async () => {
    for (const asset of ASSETS) {
        if (asset.type === '360' && asset.count && asset.baseUrl) {
            for (let i = 1; i <= asset.count; i++) {
                const url = `${asset.baseUrl}/${i}.webp`;
                const dest = path.join(process.cwd(), asset.localPath, `${i}.webp`);
                await downloadFile(url, dest);
            }
        } else if (asset.type === 'static' && asset.url && asset.localPath) {
            const dest = path.join(process.cwd(), asset.localPath); // asset.localPath is the full file path for static
            await downloadFile(asset.url, dest);
        }
    }
};

main();
