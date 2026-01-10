import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import tenantsConfig from '../../../../../seed/tenants.json';

// Use SERVICE_ROLE_KEY to bypass RLS for seeding
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: NextRequest) {
    // 1. Security Check
    const secret = request.headers.get('x-seed-secret');
    if (secret !== process.env.SEED_SECRET && process.env.NODE_ENV !== 'development') {
        // In Prod, MUST have secret. In Dev, lenient but recommended.
        // Actually user requirement: "Works ONLY in development/staging OR requires a hard secret in prod."
        // If no secret and not dev, 401.
        if (!process.env.SEED_SECRET) {
            return NextResponse.json({ error: 'SEED_SECRET env var not set in production.' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Unauthorized Seed Attempt' }, { status: 401 });
    }

    // 2. Resolve Admin User
    // Hardcoded email for now as per instructions
    const ownerEmail = 'kajit.rathore@gmail.com';

    // List users to find ID (Admin API)
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (userError) return NextResponse.json({ error: 'Failed to list users', details: userError }, { status: 500 });

    const adminUser = users.find(u => u.email === ownerEmail);
    if (!adminUser) {
        return NextResponse.json({ error: `User ${ownerEmail} not found in Auth. Please sign up first.` }, { status: 404 });
    }

    const results = [];

    // 3. Loop & Seed
    let tenantsUpserted = 0;
    let membershipsUpserted = 0;

    console.log(`[SEED] Starting seed for ${tenantsConfig.length} tenants...`);

    for (const tConfig of tenantsConfig) {
        // A. Upsert Tenant
        const { data: tenant, error: tenantError } = await supabaseAdmin
            .from('tenants')
            .upsert({
                slug: tConfig.slug,
                name: tConfig.name,
                type: tConfig.type,
                pincode: tConfig.pincode,
                config: tConfig.config,
                status: 'ACTIVE'
            }, { onConflict: 'slug' })
            .select()
            .single();

        if (tenantError) {
            console.error(`[SEED] Failed tenant ${tConfig.slug}:`, tenantError);
            results.push({ slug: tConfig.slug, status: 'error', error: tenantError.message });
            continue;
        }
        tenantsUpserted++;

        // B. Ensure Profile Exists (Match Auth ID)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: adminUser.id,
                email: adminUser.email,
                full_name: 'Kajit Rathore (Owner)',
            }, { onConflict: 'id' });

        if (profileError) {
            console.error(`[SEED] Failed profile ${tConfig.slug}:`, profileError);
            results.push({ slug: tConfig.slug, status: 'profile_error', error: profileError.message });
            continue;
        }

        // C. Upsert Owner Membership
        const { error: memberError } = await supabaseAdmin
            .from('memberships')
            .upsert({
                user_id: adminUser.id,
                tenant_id: tenant.id,
                role: tConfig.type === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'DEALER_OWNER',
                status: 'ACTIVE',
                is_default: true
            }, { onConflict: 'user_id, tenant_id' });

        if (memberError) {
            console.error(`[SEED] Failed membership ${tConfig.slug}:`, memberError);
            results.push({ slug: tConfig.slug, status: 'membership_error', error: memberError.message });
        } else {
            console.log(`[SEED] Success ${tConfig.slug}`);
            membershipsUpserted++;
            results.push({ slug: tConfig.slug, status: 'success', tenantId: tenant.id });
        }
    }

    console.log(`[SEED] Completed. Tenants: ${tenantsUpserted}, Memberships: ${membershipsUpserted}`);

    return NextResponse.json({
        ok: true,
        tenantsUpserted,
        ownerEmail,
        membershipsUpserted,
        details: results
    });
}
