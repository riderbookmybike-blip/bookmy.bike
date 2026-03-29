import fs from 'fs';
import path from 'path';
import https from 'https';

const BASE_URL = 'https://cdn.bajajauto.com/-/media/assets/bajajauto/bikes/pulsar-220f-2025/360-degree/web/';

const COLORS = [
    { slug: 'black-cherry-red', cdnPath: 'red' },
    { slug: 'black-ink-blue', cdnPath: 'blue' },
    { slug: 'black-copper-beige', cdnPath: 'bronze' },
    { slug: 'green-light-copper', cdnPath: 'green' },
];

const DIR = 'public/media/bajaj/pulsar-220f/standard';
const TOTAL_FRAMES = 16;

async function downloadImage(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
        https
            .get(url, response => {
                if (response.statusCode !== 200) {
                    // Retry with 2024 path! Some images might still be in 2024 folder! Wait, let's check our previous curl!
                    if (url.includes('2025')) {
                        const fallbackUrl = url.replace('2025', '2024');
                        console.log(`Fallback for ${url} to ${fallbackUrl}`);
                        return https
                            .get(fallbackUrl, res2 => {
                                if (res2.statusCode !== 200) {
                                    reject(new Error(`Failed to download ${fallbackUrl}: ${res2.statusCode}`));
                                    return;
                                }
                                const file = fs.createWriteStream(dest);
                                res2.pipe(file);
                                file.on('finish', () => {
                                    file.close();
                                    resolve();
                                });
                            })
                            .on('error', reject);
                    } else {
                        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                        return;
                    }
                } else {
                    const file = fs.createWriteStream(dest);
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                }
            })
            .on('error', reject);
    });
}

async function run() {
    for (const c of COLORS) {
        const dir = path.join(process.cwd(), DIR, c.slug, '360');
        fs.mkdirSync(dir, { recursive: true });

        console.log(`Downloading frames for ${c.slug}...`);
        for (let i = 0; i < TOTAL_FRAMES; i++) {
            // Pad with leading zero
            const frame = i.toString().padStart(2, '0');
            const fileName = `${frame}.webp`;
            // One color (blue) is in 2024 folder probably. `downloadImage` will fallback just in case!
            const url = `${BASE_URL}${c.cdnPath}/${fileName}`;
            const dest = path.join(dir, fileName);

            if (fs.existsSync(dest)) {
                // console.log(`Exists: ${dest}`);
                continue;
            }

            try {
                await downloadImage(url, dest);
                console.log(`Downloaded ${c.slug}/${fileName}`);
            } catch (e: any) {
                console.error(e.message);
            }
        }
    }
}

run().catch(console.error);
