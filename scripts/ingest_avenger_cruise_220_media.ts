/**
 * Bajaj Avenger Cruise 220 — Media Ingestion Script
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BAJAJ_CDN = 'https://cdn.bajajauto.com/-/media/assets/bajajauto/360degreeimages/bikes/avenger';
const BRAND = 'bajaj';
const MODEL = 'avenger-cruise-220';
const VARIANT = 'standard';
const NUM_FRAMES = 16; // 00–15

const LOCAL_BASE = path.join(process.cwd(), 'public', 'media', BRAND, MODEL, VARIANT);

const COLOURS = [
    {
        slug: 'moon-white',
        skuId: '1499038e-67c7-4a59-9936-9621e45781dd',
        cdn: 'avenger-220-white',
    },
    {
        slug: 'auburn-black',
        skuId: '4a5f9bcc-74df-4e3b-bb0d-ca5f35a41789',
        cdn: 'avenger-220-black',
    },
];

function downloadFile(url: string, dest: string): Promise<void> {
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
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0 Safari/537.36',
                    },
                },
                res => {
                    if (res.statusCode === 301 || res.statusCode === 302) {
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
                        resolve();
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
    const { error } = await supabase.storage
        .from('vehicles')
        .upload(storagePath, buffer, { contentType: 'image/png', upsert: true });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return supabase.storage.from('vehicles').getPublicUrl(storagePath).data.publicUrl;
}

async function main() {
    console.log(`\n🚀 Bajaj Avenger Cruise 220 — Media Ingestion`);
    console.log(`   Colours: ${COLOURS.length}, Frames: ${NUM_FRAMES}\n`);

    for (const colour of COLOURS) {
        console.log(`\n▶ ${colour.slug}`);
        const colourDir = path.join(LOCAL_BASE, colour.slug, '360');

        for (let i = 0; i < NUM_FRAMES; i++) {
            const frame = String(i).padStart(2, '0') + '.png';
            const cdnUrl = `${BAJAJ_CDN}/${colour.cdn}/${frame}`;
            const localPath = path.join(colourDir, frame);
            const storagePath = `catalog/${BRAND}/${MODEL}/${VARIANT}/${colour.slug}/${frame}`;

            process.stdout.write(`  ${frame}...`);
            try {
                await downloadFile(cdnUrl, localPath);
                const size = fs.statSync(localPath).size;
                if (size < 1000) {
                    console.log(` ⚠️  Too small, skip`);
                    fs.unlinkSync(localPath);
                    continue;
                }

                const publicUrl = await uploadToStorage(localPath, storagePath);
                console.log(` ✅ ${size}B`);

                if (i === 0) {
                    await supabase.from('cat_skus').update({ primary_image: publicUrl }).eq('id', colour.skuId);
                    console.log(`  📌 primary_image → ${publicUrl}`);
                }
            } catch (err: any) {
                console.log(` ❌ ${err.message}`);
            }
        }
    }
    console.log('\n✅ Done!\n');
}

main().catch(console.error);
