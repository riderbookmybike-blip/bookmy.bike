'use server';

import { z } from 'zod'; // Ensure zod is installed, if not we'll use regex
import { adminClient } from '@/lib/supabase/admin';
import { createOrLinkMember } from '@/actions/members';
import { toAppStorageFormat } from '@/lib/utils/phoneUtils';
import { headers } from 'next/headers';
import { validateFinanceLeadDealer } from '@/lib/crm/contextHardening';
import { createClient } from '@/lib/supabase/server';

// --- Validation Key ---
const leadSchema = z.object({
    name: z.string().min(2, 'Name is too short'),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
    pincode: z.string().regex(/^\d{6}$/, 'Invalid Pincode'), // Mandatory
    taluka: z.string().optional(),
    dob: z.string().optional(), // Added DOB
    model: z.string().optional(), // Optional
    variant: z.string().optional(),
    color: z.string().optional(),
    honeypot: z.string().max(0, 'Spam detected'), // Must be empty
    priceSnapshot: z.any().optional(),
    utm: z.any().optional(),
});

// --- P0 Rate Limiter (In-Memory) ---
// Note: for serverless, this is ephemeral, but efficient for minimizing bursts.
// For production scale, move to Redis/Upstash.
const rateLimit = new Map<string, number>();

export async function submitLead(formData: FormData) {
    // 1. Anti-Spam: Honeypot
    const honeypot = formData.get('hp_check') as string;
    if (honeypot && honeypot.length > 0) {
        return { success: false, message: 'Invalid request' };
    }

    // 2. Anti-Spam: Rate Limit (IP Based)
    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const lastRequest = rateLimit.get(ip) || 0;

    // Allow 1 request per 30 seconds per IP
    if (now - lastRequest < 30000) {
        return { success: false, message: 'Please wait before retrying.' };
    }
    rateLimit.set(ip, now);

    // Helper to format text as Title Case
    function toTitleCase(str: string): string {
        if (!str) return '';
        return str
            .toLowerCase()
            .split(' ')
            .map(word => {
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
    }

    // ... existing code ...

    // 3. Extract & Validate Data
    const rawData = {
        name: toTitleCase(formData.get('name') as string),
        phone: formData.get('phone') as string,
        pincode: formData.get('pincode') as string,
        taluka: toTitleCase(formData.get('taluka') as string),
        dob: formData.get('dob') as string,
        model: formData.get('model') as string,
        variant: formData.get('variant') as string,
        color: formData.get('color') as string,
        selectedDealerId: formData.get('selectedDealerId') as string | null, // Optional
        honeypot: '',
        priceSnapshot: formData.get('priceSnapshot') ? JSON.parse(formData.get('priceSnapshot') as string) : null,
        utm: formData.get('utm') ? JSON.parse(formData.get('utm') as string) : null,
    };

    const validation = leadSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { data } = validation;
    const referrerUserId = formData.get('referrer_user_id') as string | null;
    const referrerTenantId = formData.get('referrer_tenant_id') as string | null;

    try {
        // 4. Determine Tenant (MARKETPLACE OWNER from DB)
        // using Service Role Client (adminClient) because Public (Anon) user cannot read app_settings/tenants securely via RLS
        const { data: settings } = await adminClient
            .from('sys_settings')
            .select('default_owner_tenant_id, unified_context_strict_mode')
            .single();

        const ownerTenantId = settings?.default_owner_tenant_id;
        const isStrict = settings?.unified_context_strict_mode !== false;

        if (!ownerTenantId) {
            console.error('CRITICAL: Default Owner Tenant ID missing in app_settings');
            return { success: false, message: 'System error. Please contact support.' };
        }

        // Hardening: Enforce dealer selection for finance simulation
        const hardeningValidation = validateFinanceLeadDealer(
            rawData.utm?.utm_source ?? undefined,
            rawData.selectedDealerId ?? undefined,
            {
                unified_context_strict_mode: isStrict,
            }
        );
        if (!hardeningValidation.success) {
            return hardeningValidation;
        }

        const cleanPhone = toAppStorageFormat(data.phone);
        const { member } = await createOrLinkMember({
            tenantId: ownerTenantId,
            fullName: data.name,
            phone: cleanPhone,
        });

        if (!member?.id) {
            console.error('Member link failed during submitLead');
            return { success: false, message: 'System error. Please contact support.' };
        }

        // 5. Insert Lead (Owned by Marketplace)
        const { data: lead, error: insertError } = await adminClient
            .from('crm_leads')
            .insert({
                owner_tenant_id: ownerTenantId,
                selected_dealer_tenant_id: rawData.selectedDealerId || null,
                customer_id: member.id,
                customer_name: data.name,
                customer_phone: cleanPhone,
                customer_taluka: data.taluka,
                customer_pincode: data.pincode,
                customer_dob: data.dob,
                interest_model: data.model,
                interest_variant: data.variant,
                interest_color: data.color,
                price_snapshot: data.priceSnapshot,
                utm_data: {
                    utm_source: data.utm?.utm_source,
                    utm_medium: data.utm?.utm_medium,
                    utm_campaign: data.utm?.utm_campaign,
                },
                status: 'NEW',
                referral_data: referrerUserId
                    ? {
                          referred_by_user_id: referrerUserId,
                          source_tenant_id: referrerTenantId,
                      }
                    : null,
                meta_data: referrerTenantId ? { source_tenant_id: referrerTenantId } : null,
            })
            .select('id')
            .single();

        if (insertError) {
            console.error('Lead Insert Error:', insertError);
            return { success: false, message: 'System busy (db). Please try WhatsApp.' };
        }

        try {
            const supabase = await createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            await adminClient.from('crm_lead_events').insert({
                lead_id: lead.id,
                actor_user_id: user?.id || null,
                actor_tenant_id: ownerTenantId,
                event_type: 'LEAD_CAPTURED',
                notes: 'Marketplace lead captured via public form.',
                changed_value: 'NEW',
            });
        } catch (leadEventError) {
            console.error('Lead event insert failed:', leadEventError);
        }

        if (referrerUserId && lead?.id) {
            try {
                await adminClient.rpc(
                    'oclub_credit_referral' as any,
                    {
                        p_referrer_id: referrerUserId,
                        p_lead_id: lead.id,
                        p_referred_member_id: member.id,
                    } as any
                );
            } catch (err) {
                console.error("O' Circle referral credit failed:", err);
            }
        }

        // 6. AUTO-SHARE Logic
        // A. If Dealer explicitly Selected by customer
        if (rawData.selectedDealerId && lead) {
            await adminClient.from('crm_dealer_shares').insert({
                lead_id: lead.id,
                dealer_tenant_id: rawData.selectedDealerId,
                is_primary: true,
            });
        }

        // B. If referred by a Staff Member (Share with their dealership)
        if (referrerTenantId && lead && referrerTenantId !== rawData.selectedDealerId) {
            await adminClient.from('crm_dealer_shares').insert({
                lead_id: lead.id,
                dealer_tenant_id: referrerTenantId,
                is_primary: false, // Secondary share (referrer)
            });
        }

        return { success: true, message: 'Callback requested successfully!' };
    } catch (err) {
        console.error('Unexpected lead sub error:', err);
        return { success: false, message: 'Unexpected system error.' };
    }
}
