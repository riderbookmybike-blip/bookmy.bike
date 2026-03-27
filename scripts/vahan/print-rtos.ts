import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'XXX';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'XXX';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    const { data, error } = await supabase
        .from('vahan_two_wheeler_monthly_uploads')
        .select('rto_code, rto_name')
        .neq('rto_code', 'ALL')
        .not('rto_code', 'is', null);

    if (error) {
        console.error(error);
        return;
    }

    const map: Record<string, string> = {};
    for (const r of data || []) {
        map[r.rto_name] = r.rto_code;
    }
    console.log(JSON.stringify(map, null, 2));
}

run();
