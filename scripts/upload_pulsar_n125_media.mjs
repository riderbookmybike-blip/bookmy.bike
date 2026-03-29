import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const BRAND = 'bajaj';
const MODEL = 'pulsar-n125';
const VARIANTS = ['led-disc', 'led-disc-bt'];

const COLOURS = {
  'led-disc': ['pearl-metallic-white', 'ebony-black', 'caribbean-blue', 'cocktail-wine-red'],
  'led-disc-bt': ['purple-fury', 'cocktail-wine-red', 'citrus-rush']
};

const DEFAULT_IMG_SRC = '/tmp/bajaj_n125/00.webp';

async function upload(localPath, storagePath) {
  const buffer = fs.readFileSync(localPath);
  const { data, error } = await supabase.storage
    .from('vehicles')
    .upload(storagePath, buffer, {
      contentType: 'image/webp',
      upsert: true
    });
  
  if (error) throw new Error(error.message);
  
  const { data: publicData } = supabase.storage
    .from('vehicles')
    .getPublicUrl(storagePath);
    
  return publicData.publicUrl;
}

async function main() {
  console.log('Synchronizing N125 Media...');

  for (const variant of VARIANTS) {
      for (const color of COLOURS[variant]) {
          const skuSlug = `${MODEL}-${variant}-${color}`;
          const localDir = path.join(process.cwd(), `public/media/${BRAND}/${MODEL}/${variant}/${color}`);
          
          if (!fs.existsSync(localDir)) {
             fs.mkdirSync(localDir, { recursive: true });
          }
          
          const localFile = path.join(localDir, '00.webp');
          if (!fs.existsSync(localFile)) {
             fs.copyFileSync(DEFAULT_IMG_SRC, localFile);
          }

          const storagePath = `${BRAND}/${MODEL}/${variant}/${color}/00.webp`;
          
          try {
             console.log(`Uploading ${skuSlug}...`);
             const imgUrl = await upload(localFile, storagePath);
             
             // Update database
             const { data: sku } = await supabase.from('cat_skus').select('*').eq('slug', skuSlug).single();
             if (sku) {
                 await supabase.from('cat_item_media').upsert({
                     sku_id: sku.id,
                     url: imgUrl,
                     bucket_path: storagePath,
                     type: 'IMAGE',
                     position: 1,
                     is_primary: true
                 }, { onConflict: 'sku_id,position' });
                 console.log(` > Linked in DB: ${sku.name}`);
             }
          } catch(err) {
              console.error(`Failed ${skuSlug}:`, err.message);
          }
      }
  }
}

main().catch(console.error);
