import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TVS = 'aff9a671-6e98-4d7e-8af1-b7823238a00e';
const { data: items } = await c.from('cat_items')
  .select('id, name, type, parent_id, specs, image_url, position')
  .eq('brand_id', TVS).order('position');

const j125 = items.find(i => i.name === 'Jupiter 125' && i.type === 'PRODUCT');
if (!j125) { console.log('Jupiter 125 not found'); process.exit(1); }

const allChildren = items.filter(i => i.parent_id === j125.id);
console.log('=== Jupiter 125 Children ===');
for (const ch of allChildren) {
  console.log(`\n  ${ch.type} — ${ch.name}  specs: ${Object.keys(ch.specs || {}).length} keys  img: ${ch.image_url ? 'YES' : 'no'}`);
  if (ch.specs && Object.keys(ch.specs).length > 0) console.log('    specs:', JSON.stringify(ch.specs).slice(0, 200));
  const grandkids = items.filter(i => i.parent_id === ch.id);
  grandkids.forEach(gk => console.log(`    ${gk.type}: ${gk.name.padEnd(30)} img: ${gk.image_url ? gk.image_url.slice(0, 80) : 'NONE'}`));
}
