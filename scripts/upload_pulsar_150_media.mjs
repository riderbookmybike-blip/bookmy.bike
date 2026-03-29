import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BAJAJ_DIR = path.join(process.cwd(), 'public', 'media', 'bajaj', 'pulsar-150');

const MAPPINGS = [
  { variant: 'single-disc', color: 'sparkle-black-red' },
  { variant: 'single-disc', color: 'sparkle-black-blue' },
  { variant: 'single-disc', color: 'sparkle-black-silver' },
  { variant: 'twin-disc', color: 'sparkle-black-red' },
  { variant: 'twin-disc', color: 'sparkle-black-blue' },
  { variant: 'twin-disc', color: 'sparkle-black-silver' }
];

async function uploadMedia() {
  console.log('Starting Pulsar 150 media upload (to catalog/bajaj/pulsar-150)...');

  for (const item of MAPPINGS) {
    const rawPath = path.join(BAJAJ_DIR, item.variant, item.color, '00.png');
    if (!fs.existsSync(rawPath)) {
      console.warn(`File missing for ${item.color}: ${rawPath}`);
      continue;
    }

    try {
      // Crop transparent margins and convert to WebP
      console.log(`Processing: ${item.color}...`);
      const buffer = await sharp(rawPath)
        .trim({ threshold: 10 }) // Bajaj images often have lots of whitespace
        .webp({ quality: 85, effort: 6 })
        .toBuffer();

      // Ensure storage path is /catalog/bajaj/pulsar-150/<variant>/<color>/00.webp
      const storagePath = `bajaj/pulsar-150/${item.variant}/${item.color}/00.webp`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage.from('vehicles').upload(storagePath, buffer, {
        contentType: 'image/webp',
        upsert: true
      });

      if (error) {
        console.error(`Storage Upload Error for ${storagePath}:`, error.message);
        continue;
      }

      console.log(`Uploaded to storage: ${storagePath}`);

      // We seeded the sku slugs as: pulsar-150-[variant]-[color]
      const skuSlug = `pulsar-150-${item.variant}-${item.color}`;
      
      const { data: publicData } = supabase.storage.from('vehicles').getPublicUrl(storagePath);

      // Update the DB Sku with primary_image
      const { error: dbError } = await supabase
        .from('cat_skus')
        .update({ primary_image: publicData.publicUrl })
        .eq('slug', skuSlug);

      if (dbError) {
        console.error(`Failed to update SKU ${skuSlug} in DB:`, dbError.message);
      } else {
        console.log(`Updated DB for SKU: ${skuSlug}`);
      }

    } catch (e) {
      console.error(`Failed to process ${item.variant} ${item.color}:`, e.message);
    }
  }

  console.log('Pulsar 150 Media Upload Complete!');
}

uploadMedia().catch(console.error);
