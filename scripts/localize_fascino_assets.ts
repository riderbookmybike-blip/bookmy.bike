import https from 'https';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.yamaha-motor-india.com';
const MEDIA_BASE_PATH = path.join(process.cwd(), 'public', 'media', 'yamaha', 'fascino-125-fi-hybrid');

const VARIANTS = [
    {
        name: 'Drum',
        colors: [
            {
                name: 'Metallic Black',
                slug: 'metallic-black',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Drum/Metallic-Black-cd.webp',
            },
            {
                name: 'Vivid Red',
                slug: 'vivid-red',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Drum/VIVID-RED-STD.webp',
            },
            {
                name: 'Metallic White',
                slug: 'metallic-white',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Drum/metallic_white_drum.webp',
            },
            {
                name: 'Cool Blue Metallic',
                slug: 'cool-blue-metallic',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Drum/COOL-blue-Metallic.webp',
            },
            {
                name: 'Dark Matte Blue',
                slug: 'dark-matte-blue',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Drum/Dark-Matte-Blue.webp',
            },
            {
                name: 'Cyan Blue',
                slug: 'cyan-blue',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Drum/Cyan-Blue-STD.webp',
            },
            {
                name: 'Silver',
                slug: 'silver',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Drum/silver.webp',
            },
            {
                name: 'Matte Copper',
                slug: 'matte-copper',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Drum/Matte-Copper.webp',
            },
        ],
    },
    {
        name: 'Disc',
        colors: [
            {
                name: 'Cyan Blue',
                slug: 'cyan-blue',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Disc/Cyan-Blue-STD.webp',
            },
            {
                name: 'Vivid Red',
                slug: 'vivid-red',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Disc/VIVID-RED-STD.webp',
            },
            {
                name: 'Metallic Black',
                slug: 'metallic-black',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Disc/Matte-Black-S.webp',
            },
            {
                name: 'Cool Blue Metallic',
                slug: 'cool-blue-metallic',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Disc/COOL-blue-Metallic.webp',
            },
            {
                name: 'Dark Matte Blue',
                slug: 'dark-matte-blue',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Disc/Dark-Matte-Blue.webp',
            },
            {
                name: 'Metallic White',
                slug: 'metallic-white',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Disc/metallic_white.webp',
            },
            {
                name: 'Silver',
                slug: 'silver',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Disc/Silver.webp',
            },
            {
                name: 'Matte Copper',
                slug: 'matte-copper',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Disc/Matte-Copper.webp',
            },
        ],
    },
    {
        name: 'Disc Tft',
        colors: [
            {
                name: 'Vivid Red Special',
                slug: 'vivid-red-special',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Disc/VIVID-RED-S.webp',
            },
            {
                name: 'Matte Black Special',
                slug: 'matte-black-special',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Disc/Matte-Black-S.webp',
            },
            {
                name: 'Dark Matte Blue Special',
                slug: 'dark-matte-blue-special',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Disc/new-blue-s.webp',
            },
            {
                name: 'Matte Grey Special',
                slug: 'matte-grey-special',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Disc/matt_grey.webp',
            },
            {
                name: 'Metallic Light Green',
                slug: 'metallic-light-green',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Disc/metallic_light_green.webp',
            },
            {
                name: 'Matte Copper',
                slug: 'matte-copper',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Disc/Matte-Copper.webp',
            },
            {
                name: 'Silver',
                slug: 'silver',
                url: '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/color/Disc/Silver.webp',
            },
        ],
    },
];

const COMMON_360_FOLDER = '/theme/v4/images/webp_images/fascino_all/fascino125fi-new/360_new/';
const NUM_360_FRAMES = 40;

function downloadFile(url: string, outputPath: string): Promise<void> {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(outputPath);
        https
            .get(url, response => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                    return;
                }
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            })
            .on('error', err => {
                fs.unlink(outputPath, () => {}); // Delete the file if error
                reject(err);
            });
    });
}

async function main() {
    console.log('Starting asset localization for Yamaha Fascino 125 Fi Hybrid...');

    // Download static images
    for (const v of VARIANTS) {
        const variantSlug = v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        for (const c of v.colors) {
            const outputDir = path.join(MEDIA_BASE_PATH, variantSlug, c.slug);
            const staticPath = path.join(outputDir, 'static.webp');

            console.log(`Downloading static image for ${v.name} - ${c.name}...`);
            try {
                await downloadFile(BASE_URL + c.url, staticPath);
            } catch (err: any) {
                console.error(`Error downloading static image for ${c.name}: ${err.message}`);
            }
        }
    }

    // Download 360 frames
    const shared360Dir = path.join(MEDIA_BASE_PATH, 'shared', '360');
    console.log(`Downloading 360 frames (40 frames)...`);
    for (let i = 1; i <= NUM_360_FRAMES; i++) {
        const frameUrl = `${BASE_URL}${COMMON_360_FOLDER}${i}.webp`;
        const framePath = path.join(shared360Dir, `${i}.webp`);
        process.stdout.write(`\rFrame ${i}/${NUM_360_FRAMES}`);
        try {
            await downloadFile(frameUrl, framePath);
        } catch (err: any) {
            console.error(`\nError downloading frame ${i}: ${err.message}`);
        }
    }
    console.log('\n360 frames downloaded.');

    console.log('Asset localization complete!');
}

main().catch(console.error);
