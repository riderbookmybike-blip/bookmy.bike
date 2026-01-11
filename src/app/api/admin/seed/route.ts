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

export async function GET(request: NextRequest) {
    return handleSeed(request);
}

export async function POST(request: NextRequest) {
    return handleSeed(request);
}

async function handleSeed(request: NextRequest) {
    // 1. Security Check - Temporarily relaxed for root setup
    console.log('[SEED] Request received');

    // 2. Resolve Admin User
    // Use the Phone Number provided by the user
    const ownerPhoneInput = '9820760596';
    const formattedPhone = `91${ownerPhoneInput}`;
    const ownerEmail = `${ownerPhoneInput}@bookmy.bike`;

    // List users to find ID (Admin API)
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (userError) return NextResponse.json({ error: 'Failed to list users', details: userError }, { status: 500 });

    const adminUser = users.find(u => u.phone === formattedPhone || u.email === ownerEmail);
    if (!adminUser) {
        return NextResponse.json({ error: `User with phone ${ownerPhoneInput} not found in Auth. Please sign up first.` }, { status: 404 });
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
                full_name: 'Ajit M Singh Rathore (Owner)',
                phone: ownerPhoneInput,
                role: tConfig.type === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'DEALER_OWNER', // Default base role
            }, { onConflict: 'id' });

        if (profileError) {
            console.error(`[SEED] Failed profile ${tConfig.slug}:`, profileError);
            results.push({ slug: tConfig.slug, status: 'profile_error', error: profileError.message });
            continue;
        }

        // C. Upsert Owner Membership
        // For 'aums', role is SUPER_ADMIN. For others, it is TENANT_OWNER/DEALER_OWNER.
        const membershipRole = tConfig.type === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'OWNER';

        const { error: memberError } = await supabaseAdmin
            .from('memberships')
            .upsert({
                user_id: adminUser.id,
                tenant_id: tenant.id,
                role: membershipRole,
                status: 'ACTIVE',
                is_default: tConfig.slug === 'aums' // Make aums the default for this user
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
        ownerPhone: ownerPhoneInput,
        membershipsUpserted,
        details: results
    });
}
