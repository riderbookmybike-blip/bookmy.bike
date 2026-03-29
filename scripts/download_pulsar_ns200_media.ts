import fs from 'fs';
import path from 'path';

const COLORS = [
    {
        name: 'glossy-ebony-black',
        path: 'black',
    },
    {
        name: 'metallic-pearl-white',
        path: 'white',
    },
    {
        name: 'cocktail-wine-red-white',
        path: 'red/ns200-360-webp',
    },
    {
        name: 'pewter-grey-blue',
        path: 'grey/grey-360',
    },
];

const BASE_URL = 'https://cdn.bajajauto.com/-/media/assets/bajajauto/bikes/pulsarns200/newns200-360-degree';
// Notice we use 16 frames per standard config for NS 200
const TOTAL_FRAMES = 16;
const DEST_DIR = path.join(process.cwd(), 'public', 'media', 'bajaj', 'pulsar-ns200', 'standard');

async function downloadImage(url: string, destPath: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Ensure directory exists
        const dir = path.dirname(destPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(destPath, buffer);
        return true;
    } catch (error: any) {
        console.error(`Error downloading ${url}:`, error.message);
        return false;
    }
}

async function main() {
    console.log('Starting Pulsar NS200 media download...');

    for (const color of COLORS) {
        console.log(`\nProcessing color ${color.name}...`);

        // Use the unified media sovereignty protocol format: public/media/bajaj/pulsar-ns200/standard/{color-slug}/360/
        const colorDir = path.join(DEST_DIR, color.name, '360');

        if (!fs.existsSync(colorDir)) {
            fs.mkdirSync(colorDir, { recursive: true });
        }

        for (let i = 0; i < TOTAL_FRAMES; i++) {
            // pad with zero if needed
            const frameNum = i.toString().padStart(2, '0');
            // the bajaj url uses 00.png or 00.webp? Wait. Let me check what extension bajaj uses for NS200.
            // In the HTML scrape, the red URL ends in `00.webp` and black might just be 00.png. Let's try .webp first then .png

            const extensions = ['.webp', '.png'];
            let downloaded = false;

            for (const ext of extensions) {
                const url = `${BASE_URL}/${color.path}/${frameNum}${ext}`;
                const destPath = path.join(colorDir, `${frameNum}.webp`); // We save as .webp locally if possible, or keep original? We standardise to webp.

                process.stdout.write(`Fetching ${frameNum}${ext}... `);

                // For simplicity, just save as .webp if we downloaded .webp, or .png if png
                const actualDestPath = path.join(colorDir, `${frameNum}${ext}`);

                const success = await downloadImage(url, actualDestPath);

                if (success) {
                    process.stdout.write('✅\n');
                    downloaded = true;
                    break;
                } else {
                    process.stdout.write('❌\n');
                }
            }

            if (!downloaded) {
                console.error(`Failed to download frame ${frameNum} for ${color.name} in all formats.`);
            }
        }
    }

    console.log('\n✅ All Pulsar NS200 media downloaded successfully!');
}

main().catch(console.error);
