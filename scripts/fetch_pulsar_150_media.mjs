import fs from 'fs';
import path from 'path';
import https from 'https';

const BAJAJ_DIR = path.join(process.cwd(), 'public', 'media', 'bajaj', 'pulsar-150');

const MAPPINGS = [
  // Single Disc
  { variant: 'single-disc', color: 'sparkle-black-red', srcUrl: 'https://cdn.bajajauto.com/-/media/assets/bajajauto/bikes/pulsar-150-2025/pulsar-150-sd/360-images/red/00.png' },
  { variant: 'single-disc', color: 'sparkle-black-blue', srcUrl: 'https://cdn.bajajauto.com/-/media/assets/bajajauto/bikes/pulsar-150-2025/pulsar-150-sd/360-images/blue/00.png' },
  { variant: 'single-disc', color: 'sparkle-black-silver', srcUrl: 'https://cdn.bajajauto.com/-/media/assets/bajajauto/bikes/pulsar-150-2025/pulsar-150-sd/360-images/grey/00.png' },
  // Twin Disc 
  { variant: 'twin-disc', color: 'sparkle-black-red', srcUrl: 'https://cdn.bajajauto.com/-/media/assets/bajajauto/360degreeimages/bikes/pulsar/pulsar-150/twin-disc/black-red/00.png' },
  { variant: 'twin-disc', color: 'sparkle-black-blue', srcUrl: 'https://cdn.bajajauto.com/-/media/assets/bajajauto/360degreeimages/bikes/pulsar/pulsar-150/twin-disc/black-blue/00.png' },
];

async function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
        return;
      }
      const stream = fs.createWriteStream(destPath);
      res.pipe(stream);
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    }).on('error', reject);
  });
}

(async () => {
  for (const item of MAPPINGS) {
    const dir = path.join(BAJAJ_DIR, item.variant, item.color);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const rawPath = path.join(dir, '00.png');
    console.log(`Downloading: ${item.srcUrl}...`);
    try {
      await downloadImage(item.srcUrl, rawPath);
      console.log(`Success: saved to ${rawPath}`);
    } catch (e) {
      console.error(e.message);
    }
  }
})();
