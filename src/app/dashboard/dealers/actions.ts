'use server';

import { adminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function onboardDealer(formData: {
    dealerName: string;
    studioId?: string;
    pincode: string;
    adminName: string;
    adminPhone: string;
}) {
    console.log('[OnboardDealer] Starting onboarding for:', formData.dealerName);

    try {
        // 1. Generate unique slug
        let slug = formData.dealerName
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        const { data: existingTenant } = await adminClient
            .from('id_tenants')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();

        if (existingTenant) {
            slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        }

        console.log('[OnboardDealer] Created slug:', slug);

        // 2. Create Tenant
        const { data: tenant, error: tenantError } = await adminClient
            .from('id_tenants')
            .insert({
                name: formData.dealerName,
                slug,
                pincode: formData.pincode,
                type: 'DEALER',
                status: 'ACTIVE',
                display_id: formData.studioId?.trim() || null,
                config: {},
                location: `Pincode: ${formData.pincode}`
            })
            .select()
            .single();

        if (tenantError) {
            console.error('[OnboardDealer] Tenant Error:', tenantError);
            throw tenantError;
        }

        console.log('[OnboardDealer] Tenant created:', tenant.id);

        // 3. Normalize Phone (STRICT matching)
        const rawPhone = formData.adminPhone.replace(/\D/g, '');
        let formattedPhone = rawPhone;
        if (rawPhone.length === 10) {
            formattedPhone = `91${rawPhone}`;
        }

        // 4. FIND Resolve Existing Member
        // We MUST find the exact ID that is linked to the user's Auth account
        const { data: existingMember } = await adminClient
            .from('id_members')
            .select('id')
            .or(`primary_phone.eq.${rawPhone},primary_phone.eq.${formattedPhone},primary_phone.eq.+${formattedPhone}`)
            .order('created_at', { ascending: true }) // Take the oldest one (likely the Auth-linked one)
            .limit(1)
            .maybeSingle();

        let memberId = existingMember?.id;

        if (!memberId) {
            console.log('[OnboardDealer] No existing member found, creating new...');
            const { data: newMember, error: createError } = await adminClient
                .from('id_members')
                .insert({
                    full_name: formData.adminName,
                    primary_phone: formattedPhone,
                    member_status: 'ACTIVE',
                })
                .select()
                .single();

            if (createError) throw createError;
            memberId = newMember.id;
        }

        console.log('[OnboardDealer] Member ID resolved:', memberId);

        // 5. Link Member to Tenant in id_team
        const { error: teamError } = await adminClient
            .from('id_team')
            .insert({
                tenant_id: tenant.id,
                user_id: memberId,
                role: 'OWNER',
                status: 'ACTIVE'
            });

        if (teamError) {
            console.error('[OnboardDealer] Team Error:', teamError);
            if (!teamError.message.includes('unique constraint')) {
                throw teamError;
            }
        }

        console.log('[OnboardDealer] Membership created. Revalidating...');

        revalidatePath('/app/[slug]/dashboard/dealers', 'layout');
        revalidatePath('/dashboard/dealers', 'page');

        return { success: true, tenant };
    } catch (error: any) {
        console.error('[OnboardDealer] Fatal Error:', error);
        return { success: false, error: error.message || 'Check server logs' };
    }
}
