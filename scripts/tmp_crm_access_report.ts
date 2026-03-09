import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const s = createClient(url, key, { auth: { persistSession: false } });

async function run() {
    const { data: teamRows, error: e1 } = await s
        .from('id_team')
        .select('id,user_id,tenant_id,role,status,created_at')
        .eq('status', 'ACTIVE');
    if (e1) throw e1;

    const userIds = Array.from(new Set((teamRows || []).map((r: any) => r.user_id).filter(Boolean)));
    const tenantIds = Array.from(new Set((teamRows || []).map((r: any) => r.tenant_id).filter(Boolean)));

    const { data: members, error: e2 } = await s
        .from('id_members')
        .select('id,full_name,primary_phone,phone,role')
        .in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']);
    if (e2) throw e2;

    const { data: tenants, error: e3 } = await s
        .from('id_tenants')
        .select('id,name,type,status')
        .in('id', tenantIds.length ? tenantIds : ['00000000-0000-0000-0000-000000000000']);
    if (e3) throw e3;

    const memberMap = new Map((members || []).map((m: any) => [m.id, m]));
    const tenantMap = new Map((tenants || []).map((t: any) => [t.id, t]));

    const base = (teamRows || []).map((r: any) => {
        const m: any = memberMap.get(r.user_id) || {};
        const t: any = tenantMap.get(r.tenant_id) || {};
        return {
            access_type: 'TEAM_ACTIVE',
            user_id: r.user_id,
            full_name: m.full_name || null,
            phone: m.primary_phone || m.phone || null,
            tenant_id: r.tenant_id,
            tenant_name: t.name || null,
            tenant_type: t.type || null,
            team_role: r.role || null,
            member_role: m.role || null,
            crm_access: true,
            status: r.status || null,
        };
    });

    const { data: dfaRows, error: e4 } = await s
        .from('dealer_finance_user_access')
        .select('user_id,finance_tenant_id,dealer_tenant_id,crm_access,is_default,updated_at')
        .eq('crm_access', true);
    if (e4) throw e4;

    const dfaUserIds = Array.from(new Set((dfaRows || []).map((r: any) => r.user_id).filter(Boolean)));
    const dfaTenantIds = Array.from(
        new Set((dfaRows || []).flatMap((r: any) => [r.finance_tenant_id, r.dealer_tenant_id]).filter(Boolean))
    );

    const { data: dfaMembers, error: e5 } = await s
        .from('id_members')
        .select('id,full_name,primary_phone,phone,role')
        .in('id', dfaUserIds.length ? dfaUserIds : ['00000000-0000-0000-0000-000000000000']);
    if (e5) throw e5;

    const { data: dfaTenants, error: e6 } = await s
        .from('id_tenants')
        .select('id,name,type,status')
        .in('id', dfaTenantIds.length ? dfaTenantIds : ['00000000-0000-0000-0000-000000000000']);
    if (e6) throw e6;

    const dfaMemberMap = new Map((dfaMembers || []).map((m: any) => [m.id, m]));
    const dfaTenantMap = new Map((dfaTenants || []).map((t: any) => [t.id, t]));

    const financeAccess = (dfaRows || []).map((r: any) => {
        const m: any = dfaMemberMap.get(r.user_id) || {};
        const ft: any = dfaTenantMap.get(r.finance_tenant_id) || {};
        const dt: any = dfaTenantMap.get(r.dealer_tenant_id) || {};
        return {
            access_type: 'FINANCE_TO_DEALER_CRM_ACCESS',
            user_id: r.user_id,
            full_name: m.full_name || null,
            phone: m.primary_phone || m.phone || null,
            finance_tenant_id: r.finance_tenant_id,
            finance_tenant_name: ft.name || null,
            dealer_tenant_id: r.dealer_tenant_id,
            dealer_tenant_name: dt.name || null,
            team_role: null,
            member_role: m.role || null,
            crm_access: r.crm_access === true,
            is_default: r.is_default ?? null,
            updated_at: r.updated_at || null,
        };
    });

    console.log(
        JSON.stringify(
            {
                generated_at: new Date().toISOString(),
                team_active_count: base.length,
                finance_dealer_crm_access_count: financeAccess.length,
                team_active: base,
                finance_dealer_crm_access: financeAccess,
            },
            null,
            2
        )
    );
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
