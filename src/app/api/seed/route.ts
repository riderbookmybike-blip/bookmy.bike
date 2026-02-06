import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const adminSecret = process.env.ADMIN_API_SECRET;
    const headerSecret = request.headers.get('x-admin-secret') || '';
    const bearerToken = request.headers.get('authorization')?.replace('Bearer ', '') || '';
    const provided = headerSecret || bearerToken;

    if (process.env.NODE_ENV === 'production') {
        if (!adminSecret || provided !== adminSecret) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }
    } else if (adminSecret && provided !== adminSecret) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const missingVars = [];
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');

    if (missingVars.length > 0) {
        console.error('Missing Env Vars:', missingVars);
        return NextResponse.json(
            {
                success: false,
                error: `Missing Environment Variables: ${missingVars.join(', ')}`,
            },
            { status: 500 }
        );
    }

    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Create Tenants

        const tenantsData = [
            { name: 'BookMyBike HQ', type: 'MARKETPLACE', phone: '9820760596' },
            { name: 'Addbike Automobiles Pvt Ltd', type: 'DEALER', phone: '7447403491', pincode: '401203' },
            { name: 'MyScooty', type: 'DEALER', phone: '9324145456', pincode: '401209' },
            { name: 'Aapli Autofin Pvt Ltd', type: 'DEALER', phone: '9687778673', pincode: '401203' },
            { name: 'L&T Finance', type: 'BANK', phone: '7447403493' },
        ];

        const createdTenants = [];
        let marketplaceTenantId = null;

        for (const t of tenantsData) {
            // Check if exists (by phone)
            const { data: existing } = await supabaseAdmin
                .from('id_tenants')
                .select('id')
                .eq('phone', t.phone)
                .single();

            let tenantId = existing?.id;

            if (!tenantId) {
                const { data, error } = await supabaseAdmin.from('id_tenants').insert(t).select().single();
                if (error) throw error;
                tenantId = data.id;
            }

            createdTenants.push({ ...t, id: tenantId });
            if (t.type === 'MARKETPLACE') marketplaceTenantId = tenantId;
        }

        // 2. Set Global App Settings
        if (marketplaceTenantId) {
            await supabaseAdmin.from('sys_settings').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Clear old
            await supabaseAdmin.from('sys_settings').insert({ default_owner_tenant_id: marketplaceTenantId });
        }

        // 3. Create Users (Map Phone -> Email)
        // Password for all: "bookmybike6424" (Mapped from input 6424)
        const password = 'bookmybike6424';

        const usersData = [
            { phone: '9820760596', role: 'SUPER_ADMIN', tenantName: 'BookMyBike HQ' },
            { phone: '7447403491', role: 'DEALER_ADMIN', tenantName: 'Addbike Automobiles Pvt Ltd' },
            { phone: '9324145456', role: 'DEALER_ADMIN', tenantName: 'MyScooty' },
            { phone: '9687778673', role: 'DEALER_ADMIN', tenantName: 'Aapli Autofin Pvt Ltd' },
            { phone: '7447403493', role: 'BANK_ADMIN', tenantName: 'L&T Finance' },
        ];

        const createdUsers = [];

        for (const u of usersData) {
            const email = `${u.phone}@bookmybike.local`;
            const tenantId = createdTenants.find(t => t.name === u.tenantName)?.id;

            if (!tenantId) continue;

            // Create Auth User
            const { data: createdAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { phone: u.phone },
            });
            let authUser = createdAuthUser;

            // If user already exists, get ID
            if (authError && authError.message.includes('already been registered')) {
                // Fetch user id by email? Admin API doesn't have easy "get by email",
                // but we can try generic list or assume profile exists.
                // For P0, let's assume if it fails, we skip or manually fix.
                // We'll proceed to Upsert Profile.
                const { data: list } = await supabaseAdmin.auth.admin.listUsers();
                const existingUser = list.users.find(x => x.email === email);
                if (existingUser) authUser = { user: existingUser };
            }

            if (authUser?.user) {
                // Upsert Profile
                await supabaseAdmin.from('id_members').upsert({
                    id: authUser.user.id,
                    tenant_id: tenantId,
                    role: u.role,
                    phone: u.phone,
                    full_name: `${u.role} (${u.tenantName})`,
                });
                createdUsers.push({ email, role: u.role, tenant: u.tenantName });
            }
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Seed Completed Successfully',
                createdTenants,
                createdUsers,
                globalSettings: { default_owner: marketplaceTenantId },
            },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'no-store, max-age=0',
                },
            }
        );
    } catch (e: any) {
        console.error('SEEDING FATAL ERROR:', e);
        return NextResponse.json(
            {
                success: false,
                error: e.message,
                stack: e.stack,
            },
            { status: 500 }
        );
    }
}
