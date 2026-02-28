import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('--- MASTER SPECIFICATIONS: cat_specifications ---');

    const { data: specs, error: sErr } = await admin
        .from('cat_specifications')
        .select('*')
        .order('category', { ascending: true })
        .order('position', { ascending: true });

    if (sErr) {
        console.error('Error fetching specs:', sErr);
        return;
    }

    if (!specs || specs.length === 0) {
        console.log('No specifications found in cat_specifications.');
        return;
    }

    console.log(`Found ${specs.length} canonical specification keys.\n`);

    let currentCategory = '';
    for (const s of specs) {
        if (s.category !== currentCategory) {
            currentCategory = s.category;
            console.log(`\n[CATEGORY: ${currentCategory}]`);
        }
        const name = s.name || 'N/A';
        const key = s.spec_key || 'N/A';
        console.log(`  - ${name.padEnd(25)} | key: ${key.padEnd(20)} | type: ${s.type}`);
    }
}

main().catch(console.error);
