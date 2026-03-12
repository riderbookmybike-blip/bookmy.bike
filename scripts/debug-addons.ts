import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const { data: rules } = await admin.from('cat_ins_rules').select('rule_name, addons');
    console.log(JSON.stringify(rules, null, 2));
}
main();
