/**
 * Bajaj Platina 110 — Media Ingestion Script
 * Downloads 360° frames from Bajaj CDN → Supabase vehicles bucket
 * Updates cat_skus.primary_image with sovereign Supabase storage URL
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ─── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BAJAJ_CDN = 'https://cdn.bajajauto.com';
const BRAND = 'bajaj';
const MODEL = 'platina-110';
const VARIANT = 'electric-start-drum';
const NUM_360_FRAMES = 16; // frames 00–15

const LOCAL_BASE = path.join(process.cwd(), 'public', 'media', BRAND, MODEL, VARIANT);

// ─── SKU Map: colour-slug → { skuId, cdnFolder } ──────────────────────────────
const COLOURS = [
    {
        slug: 'black-white',
        skuId: '109e981a-063d-46d7-8330-541febea9cea',
        cdn: '/assets/bajajauto/360degreeimages/bikes/platina-2026/platina-110/110-black-and-white',
    },
    {
        slug: 'black-red',
        skuId: '485d5757-1a6d-4220-9b33-407192907817',
        cdn: '/assets/bajajauto/360degreeimages/bikes/platina-2026/platina-110/110-black-and-red',
    },
    {
        slug: 'blue',
        skuId: 'bb2f3661-49b2-4e8d-b65c-97a1b0b715f5',
        cdn: '/assets/bajajauto/360degreeimages/bikes/platina-2026/platina-110/110-blue',
    },
    {
        slug: 'red',
        skuId: '74d85dff-2a01-4684-8ec7-35deef4731da',
        cdn: '/assets/bajajauto/360degreeimages/bikes/platina-2026/platina-110/110-red',
    },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function downloadFile(url: string, dest: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const dir = path.dirname(dest);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const proto = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(dest);

        proto
            .get(
                url,
                {
                    headers: {
                        'User-Agent':
                            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
                    },
                },
                res => {
                    if (res.statusCode === 301 || res.statusCode === 302) {
                        // Follow redirect
                        downloadFile(res.headers.location!, dest).then(resolve).catch(reject);
                        return;
                    }
                    if (res.statusCode !== 200) {
                        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                        return;
                    }
                    res.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        const buf = fs.readFileSync(dest);
                        resolve(buf);
                    });
                }
            )
            .on('error', err => {
                fs.unlink(dest, () => {});
                reject(err);
            });
    });
}

async function uploadToStorage(localPath: string, storagePath: string): Promise<string> {
    const buffer = fs.readFileSync(localPath);
    const { error } = await supabase.storage.from('vehicles').upload(storagePath, buffer, {
        contentType: 'image/png',
        upsert: true,
    });

    if (error) throw new Error(`Upload failed for ${storagePath}: ${error.message}`);

    const { data } = supabase.storage.from('vehicles').getPublicUrl(storagePath);
    return data.publicUrl;
}

async function updateSkuPrimaryImage(skuId: string, publicUrl: string) {
    const { error } = await supabase.from('cat_skus').update({ primary_image: publicUrl }).eq('id', skuId);

    if (error) throw new Error(`DB update failed for SKU ${skuId}: ${error.message}`);
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log(`\n🚀 Bajaj Platina 110 — Media Ingestion`);
    console.log(`   Model  : ${MODEL}`);
    console.log(`   Variant: ${VARIANT}`);
    console.log(`   Colours: ${COLOURS.length}`);
    console.log(`   Frames : ${NUM_360_FRAMES} per colour\n`);

    for (const colour of COLOURS) {
        console.log(`\n▶ Processing colour: ${colour.slug}`);
        const colourDir = path.join(LOCAL_BASE, colour.slug, '360');

        for (let i = 0; i < NUM_360_FRAMES; i++) {
            const frameName = String(i).padStart(2, '0') + '.png';
            const cdnUrl = `${BAJAJ_CDN}/-/media${colour.cdn}/${frameName}`;
            const localPath = path.join(colourDir, frameName);
            const storagePath = `catalog/${BRAND}/${MODEL}/${VARIANT}/${colour.slug}/${frameName}`;

            process.stdout.write(`  Frame ${frameName}...`);

            try {
                await downloadFile(cdnUrl, localPath);
                const stat = fs.statSync(localPath);
                if (stat.size < 1000) {
                    console.log(` ⚠️  Too small (${stat.size}B), skipping`);
                    fs.unlinkSync(localPath);
                    continue;
                }

                const publicUrl = await uploadToStorage(localPath, storagePath);
                console.log(` ✅ ${stat.size}B → ${storagePath}`);

                // Update primary_image only for frame 00
                if (i === 0) {
                    await updateSkuPrimaryImage(colour.skuId, publicUrl);
                    console.log(`  📌 primary_image updated → ${publicUrl}`);
                }
            } catch (err: any) {
                console.log(` ❌ Error: ${err.message}`);
            }
        }
    }

    console.log(`\n✅ Ingestion complete!\n`);
}

main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
