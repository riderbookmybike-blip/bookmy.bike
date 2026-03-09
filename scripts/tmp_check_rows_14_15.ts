import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs
    .readFileSync('.env.local', 'utf8')
    .split('\n')
    .reduce((acc: Record<string, string>, line) => {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m) acc[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
        return acc;
    }, {});

const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing env');
const s = createClient(url, key, { auth: { persistSession: false } });

const targets = [
    { idx: 14, user_id: '9ad0b302-0584-4fd0-91cb-0de37cfc7f89', tenant_id: '74f65c42-09aa-40b3-be96-f0c8bbc74f33' },
    { idx: 15, user_id: 'c8964091-39e9-46f5-8288-b69287cf0c43', tenant_id: 'c18b4df2-75c2-421a-88c3-1317137a993d' },
];

async function run() {
    for (const t of targets) {
        const { data: teamRows, error: te } = await s
            .from('id_team')
            .select('id,user_id,tenant_id,role,status,created_at')
            .eq('user_id', t.user_id)
            .eq('tenant_id', t.tenant_id);
        if (te) throw te;

        const { data: member, error: me } = await s
            .from('id_members')
            .select('id,full_name,primary_phone,phone,role')
            .eq('id', t.user_id)
            .maybeSingle();
        if (me) throw me;

        const { data: tenant, error: xe } = await s
            .from('id_tenants')
            .select('id,name,type,status')
            .eq('id', t.tenant_id)
            .maybeSingle();
        if (xe) throw xe;

        const { data: dfa, error: de } = await s
            .from('dealer_finance_user_access')
            .select('id,user_id,finance_tenant_id,dealer_tenant_id,crm_access,is_default,created_at,updated_at')
            .eq('user_id', t.user_id)
            .eq('dealer_tenant_id', t.tenant_id);
        if (de) throw de;

        console.log(JSON.stringify({ row: t.idx, teamRows, member, tenant, dealer_finance_user_access: dfa }, null, 2));
    }
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
