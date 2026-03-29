import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const BRAND = 'bajaj';
const MODEL = 'pulsar-n250';
const VARIANT = 'standard';

const COLOURS = [
    { slug: 'brooklyn-black', skuSlug: 'pulsar-n250-standard-brooklyn-black' },
    { slug: 'pearl-metallic-white', skuSlug: 'pulsar-n250-standard-pearl-metallic-white' },
    { slug: 'glossy-racing-red', skuSlug: 'pulsar-n250-standard-glossy-racing-red' },
];

const LOCAL_BASE = path.join(process.cwd(), 'public/media', BRAND, MODEL, VARIANT);

async function upload(localPath: string, storagePath: string): Promise<string> {
    const buffer = fs.readFileSync(localPath);
    const { data, error } = await supabase.storage.from('vehicles').upload(storagePath, buffer, {
        contentType: 'image/webp',
        upsert: true,
    });

    if (error) throw new Error(error.message);

    const { data: publicData } = supabase.storage.from('vehicles').getPublicUrl(storagePath);

    return publicData.publicUrl;
}

async function main() {
    console.log('\n🚀 Pulsar N250 — Uploading primary images to Supabase Storage\n');

    for (const colour of COLOURS) {
        console.log(`\n▶ ${colour.slug}`);

        // We only need to upload 00.webp for the primary_image
        const localPath = path.join(LOCAL_BASE, colour.slug, '360', '00.webp');
        const storagePath = `catalog/${BRAND}/${MODEL}/${VARIANT}/${colour.slug}/00.webp`;

        process.stdout.write(`  Uploading 00.webp...`);

        try {
            if (!fs.existsSync(localPath)) {
                console.log(` ❌ File not found: ${localPath}`);
                continue;
            }

            const size = fs.statSync(localPath).size;
            const url = await upload(localPath, storagePath);
            console.log(` ✅ ${Math.round(size / 1024)}KB`);

            const { error } = await supabase.from('cat_skus').update({ primary_image: url }).eq('slug', colour.skuSlug);

            if (error) {
                console.log(`  ❌ DB update failed: ${error.message}`);
            } else {
                console.log(`  📌 primary_image updated → ${url}`);
            }
        } catch (e: any) {
            console.log(` ❌ ${e.message}`);
        }
    }

    console.log('\n✅ Upload complete!\n');
}

main().catch(console.error);
