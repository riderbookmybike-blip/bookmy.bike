import https from 'https';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const BRAND = 'bajaj';
const MODEL = 'dominar-250';
const VARIANT = 'standard';
const NUM_FRAMES = 16;

const COLOURS = [
    { slug: 'canyon-red', skuId: '547cee13-b217-4447-ac45-2000fdeaff15', cdn: '250-red' },
    { slug: 'sparkling-black', skuId: '287a9ba6-1752-4312-88fa-2c34a1176e72', cdn: '250-black' },
    { slug: 'citrus-rush', skuId: 'cd162d3d-4812-488c-a62d-5e6d5665c47f', cdn: '250-lime-green' },
];

const CDN_BASE = 'https://cdn.bajajauto.com/-/media/assets/bajajauto/bikes/dominar-250/16-axis';
const LOCAL_BASE = path.join(process.cwd(), 'public/media', BRAND, MODEL, VARIANT);

function downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        const file = fs.createWriteStream(dest);
        function get(u: string, depth = 0) {
            if (depth > 3) return reject(new Error('max redirects'));
            https
                .get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
                    if (res.statusCode === 301 || res.statusCode === 302) return get(res.headers.location!, depth + 1);
                    if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
                    res.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                })
                .on('error', reject);
        }
        get(url);
    });
}

async function upload(localPath: string, storagePath: string): Promise<string> {
    const buffer = fs.readFileSync(localPath);
    const { error } = await supabase.storage
        .from('vehicles')
        .upload(storagePath, buffer, { contentType: 'image/png', upsert: true });
    if (error) throw new Error(error.message);
    return supabase.storage.from('vehicles').getPublicUrl(storagePath).data.publicUrl;
}

async function main() {
    console.log('\n🚀 Dominar 250 — Media Ingestion (3 colours × 16 frames)\n');
    for (const colour of COLOURS) {
        console.log(`\n▶ ${colour.slug}`);
        const dir = path.join(LOCAL_BASE, colour.slug, '360');
        for (let i = 0; i < NUM_FRAMES; i++) {
            const frame = String(i).padStart(2, '0') + '.png';
            const cdnUrl = `${CDN_BASE}/${colour.cdn}/${frame}`;
            const localPath = path.join(dir, frame);
            const storagePath = `catalog/${BRAND}/${MODEL}/${VARIANT}/${colour.slug}/${frame}`;
            process.stdout.write(`  ${frame}...`);
            try {
                await downloadFile(cdnUrl, localPath);
                const size = fs.statSync(localPath).size;
                if (size < 1000) {
                    console.log(' ⚠️ too small');
                    fs.unlinkSync(localPath);
                    continue;
                }
                const url = await upload(localPath, storagePath);
                console.log(` ✅ ${size}B`);
                if (i === 0) {
                    await supabase.from('cat_skus').update({ primary_image: url }).eq('id', colour.skuId);
                    console.log(`  📌 primary_image → ${url}`);
                }
            } catch (e: any) {
                console.log(` ❌ ${e.message}`);
            }
        }
    }
    console.log('\n✅ Done!\n');
}
main().catch(console.error);
