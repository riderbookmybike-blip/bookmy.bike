'use server';

import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { checkServiceability } from './serviceArea';
import { serverLog } from '@/lib/debug/logger';
import { createOrLinkMember } from './members';
import { toAppStorageFormat } from '@/lib/utils/phoneUtils';

// --- CUSTOMER PROFILES ---

// function getOrCreateCustomerProfile removed - using createOrLinkMember from members.ts instead

export async function updateMemberProfile(
    memberId: string,
    updates: {
        fullName?: string;
        primaryPhone?: string;
        whatsapp?: string;
        primaryEmail?: string;
        email?: string;
        dob?: string;
        pincode?: string;
        taluka?: string;
        district?: string;
        state?: string;
        currentAddress1?: string;
        currentAddress2?: string;
        currentAddress3?: string;
        aadhaarAddress1?: string;
        aadhaarAddress2?: string;
        aadhaarAddress3?: string;
        workAddress1?: string;
        workAddress2?: string;
        workAddress3?: string;
        workCompany?: string;
        workDesignation?: string;
        workEmail?: string;
        workPhone?: string;
        phonesJson?: any[];
        emailsJson?: any[];
        addressesJson?: any[];
    }
) {
    const supabase = await createClient();
    const payload: any = {
        updated_at: new Date().toISOString(),
    };

    if (updates.fullName) payload.full_name = updates.fullName;
    if (updates.primaryPhone) payload.primary_phone = toAppStorageFormat(updates.primaryPhone);
    if (updates.whatsapp) payload.whatsapp = toAppStorageFormat(updates.whatsapp);
    if (updates.primaryEmail) payload.primary_email = updates.primaryEmail;
    if (updates.email) payload.email = updates.email;
    if (updates.dob) payload.date_of_birth = updates.dob;
    if (updates.pincode) payload.pincode = updates.pincode;
    if (updates.taluka) payload.taluka = updates.taluka;
    if (updates.district) payload.district = updates.district;
    if (updates.state) payload.state = updates.state;

    if (updates.currentAddress1) payload.current_address1 = updates.currentAddress1;
    if (updates.currentAddress2) payload.current_address2 = updates.currentAddress2;
    if (updates.currentAddress3) payload.current_address3 = updates.currentAddress3;

    if (updates.aadhaarAddress1) payload.aadhaar_address1 = updates.aadhaarAddress1;
    if (updates.aadhaarAddress2) payload.aadhaar_address2 = updates.aadhaarAddress2;
    if (updates.aadhaarAddress3) payload.aadhaar_address3 = updates.aadhaarAddress3;

    if (updates.workAddress1) payload.work_address1 = updates.workAddress1;
    if (updates.workAddress2) payload.work_address2 = updates.workAddress2;
    if (updates.workAddress3) payload.work_address3 = updates.workAddress3;

    if (updates.workCompany) payload.work_company = updates.workCompany;
    if (updates.workDesignation) payload.work_designation = updates.workDesignation;
    if (updates.workEmail) payload.work_email = updates.workEmail;
    if (updates.workEmail) payload.work_email = updates.workEmail;
    if (updates.workPhone) payload.work_phone = toAppStorageFormat(updates.workPhone);

    if (updates.phonesJson) payload.phones_json = updates.phonesJson;
    if (updates.emailsJson) payload.emails_json = updates.emailsJson;
    if (updates.addressesJson) payload.addresses_json = updates.addressesJson;

    const { error } = await supabase.from('id_members').update(payload).eq('id', memberId);

    if (error) {
        console.error('updateMemberProfile Error:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function updateMemberAvatar(memberId: string, avatarUrl: string) {
    'use server';
    try {
        // Update id_members table
        const { error: memberError } = await adminClient
            .from('id_members')
            .update({ avatar_url: avatarUrl })
            .eq('id', memberId);

        if (memberError) {
            console.error('updateMemberAvatar: id_members error:', memberError);
        }

        // Also sync to Supabase Auth metadata
        try {
            await adminClient.auth.admin.updateUserById(memberId, {
                user_metadata: { avatar_url: avatarUrl },
            });
        } catch (authErr) {
            // Member may not be auth user (CRM-only member) - that's OK
            console.warn('updateMemberAvatar: auth sync skipped:', authErr);
        }

        return { success: true };
    } catch (error) {
        console.error('updateMemberAvatar Error:', error);
        return { success: false, error: String(error) };
    }
}

export async function checkExistingCustomer(phone: string) {
    const cleanPhone = toAppStorageFormat(phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
        return { data: null, memberId: null };
    }

    // Search id_members by whatsapp OR primary_phone
    const { data: profile, error } = await adminClient
        .from('id_members')
        .select(
            `
            id,
            full_name, 
            aadhaar_pincode, 
            date_of_birth,
            whatsapp,
            primary_phone
        `
        )
        .or(`whatsapp.eq.${cleanPhone},primary_phone.eq.${cleanPhone}`)
        .maybeSingle();

    if (error) {
        console.error('Error checking existing customer:', error);
        return { data: null, memberId: null };
    }

    if (profile) {
        return {
            data: {
                name: profile.full_name,
                pincode: profile.aadhaar_pincode,
                dob: profile.date_of_birth,
            },
            memberId: profile.id,
        };
    }

    return { data: null, memberId: null };
}

// --- LEADS ---

export async function getLeads(tenantId?: string, status?: string) {
    console.log('Fetching leads for tenantId:', tenantId);
    const supabase = await createClient();
    let query = supabase
        .from('crm_leads')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (status && status !== 'ALL') {
        query = query.eq('status', status);
    } else if (!status || status === 'ACTIVE') {
        // Default: Don't show JUNK leads in the main list
        query = query.neq('status', 'JUNK');
    }

    if (tenantId && tenantId !== 'undefined') {
        query = query.eq('owner_tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) {
        console.error('Database error in getLeads:', error);
        return [];
    }

    if (!data) {
        console.log('No leads found (null data)');
        return [];
    }

    console.log(`Mapping ${data.length} leads for UI`);

    // Map to UI interface
    return data.map((l: any) => {
        const last9 = l.id.replace(/-/g, '').slice(-9).toUpperCase();
        const displayId = `${last9.slice(0, 3)}-${last9.slice(3, 6)}-${last9.slice(6, 9)}`;

        return {
            id: l.id,
            displayId,
            customerId: l.customer_id,
            customerName: l.customer_name,
            phone: l.customer_phone,
            pincode: l.customer_pincode,
            taluka: l.customer_taluka,
            dob: l.customer_dob,
            status: l.status,
            source: l.utm_data?.utm_source || 'WEBSITE',
            interestModel: l.interest_model,
            created_at: l.created_at,
            intentScore: l.intent_score || 'COLD',
            referralSource: l.referral_data?.referred_by_name || l.referral_data?.source,
            events_log: l.events_log || [],
        };
    });
}

export async function getLeadById(leadId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.from('crm_leads').select('*').eq('id', leadId).single();
    if (error) {
        console.error('getLeadById Error:', error);
        return null;
    }
    if (!data) return null;

    const last9 = data.id.replace(/-/g, '').slice(-9).toUpperCase();
    const displayId = `${last9.slice(0, 3)}-${last9.slice(3, 6)}-${last9.slice(6, 9)}`;

    const utmData = (data.utm_data as any) || {};
    const referralData = (data.referral_data as any) || {};

    return {
        id: data.id,
        displayId,
        customerId: data.customer_id,
        customerName: data.customer_name,
        phone: data.customer_phone,
        pincode: data.customer_pincode,
        taluka: data.customer_taluka,
        dob: data.customer_dob,
        status: data.status,
        source: utmData.utm_source || 'WEBSITE',
        interestModel: data.interest_model,
        created_at: data.created_at,
        intentScore: data.intent_score || 'COLD',
        referralSource: referralData.referred_by_name || referralData.source,
        events_log: data.events_log || [],
        raw: data,
    };
}

export async function getCustomerHistory(customerId: string) {
    const supabase = await createClient();

    // Fetch leads
    const { data: leads } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('is_deleted', false)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

    // Fetch quotes
    const { data: quotes } = await supabase
        .from('crm_quotes')
        .select('*')
        .eq('is_deleted', false)
        .eq('lead_id', leads?.[0]?.id || '') // Simplification for now, better to link quotes to customer_id too later
        .order('created_at', { ascending: false });

    // Fetch bookings
    const { data: bookings } = await supabase
        .from('crm_bookings')
        .select('*')
        .eq('is_deleted', false)
        .in('lead_id', leads?.map(l => l.id) || [])
        .order('created_at', { ascending: false });

    return {
        leads: leads || [],
        quotes: quotes || [],
        bookings: bookings || [],
    };
}

export async function getCatalogModels() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('cat_items')
        .select('name')
        .eq('type', 'PRODUCT')
        .eq('status', 'ACTIVE');

    if (error) {
        console.error('Error fetching catalog models:', error);
        return [];
    }

    return data.map(i => i.name);
}

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

export async function createLeadAction(data: {
    customer_name: string;
    customer_phone: string;
    customer_pincode?: string;
    customer_dob?: string;
    customer_taluka?: string;
    customer_id?: string; // If provided, use directly (for logged-in users)
    interest_model?: string;
    model?: string;
    owner_tenant_id?: string;
    source?: string;
}) {
    const interestModel = data.interest_model || data.model || 'GENERAL_ENQUIRY';
    const startTime = Date.now();
    const authUser = await getAuthUser();

    await serverLog({
        component: 'CRM',
        action: 'createLeadAction',
        status: 'START',
        message: `Registering new identity for ${data.customer_phone}`,
        payload: { phone: data.customer_phone, name: data.customer_name },
    });

    // Strict sanitation
    const strictPhone = toAppStorageFormat(data.customer_phone);
    if (!strictPhone || strictPhone.length !== 10) {
        return { success: false, message: 'Invalid customer phone number' };
    }

    console.log('[DEBUG] createLeadAction triggered by client:', data.customer_phone, 'Sanitized:', strictPhone);

    try {
        // Handle owner_tenant_id fallback
        let effectiveOwnerId = data.owner_tenant_id;
        if (!effectiveOwnerId) {
            const { data: settings } = await (adminClient
                .from('sys_settings' as any)
                .select('default_owner_tenant_id')
                .single() as any);
            effectiveOwnerId = settings?.default_owner_tenant_id;
        }

        if (!effectiveOwnerId) {
            console.error('[DEBUG] No owner tenant identified');
            return { success: false, message: 'No owner tenant identified for lead creation' };
        }

        let customerId: string;

        // If customer_id is provided (logged-in user), use it directly
        if (data.customer_id) {
            console.log('[DEBUG] Using provided customer_id:', data.customer_id);
            customerId = data.customer_id;
            if (effectiveOwnerId) {
                const { error: tenantLinkError } = await adminClient.from('id_member_tenants').upsert(
                    {
                        member_id: customerId,
                        tenant_id: effectiveOwnerId,
                        status: 'ACTIVE',
                    },
                    { onConflict: 'member_id,tenant_id' }
                );
                if (tenantLinkError) {
                    console.error('[DEBUG] id_member_tenants upsert failed:', tenantLinkError);
                }
            }
        } else {
            // Create/Link member for anonymous or new users
            console.log('[DEBUG] Step 1: createOrLinkMember...');
            const { member } = await createOrLinkMember({
                tenantId: effectiveOwnerId,
                fullName: data.customer_name,
                phone: strictPhone,
                // Pass other details if createOrLinkMember supports them, otherwise they might be lost or need separate update
                // createOrLinkMember only takes basic input.
                // We might need to update extra fields if they are critical.
            });

            if (!member?.id) {
                console.error('[DEBUG] createOrLinkMember returned null or invalid member');
                return { success: false, message: 'Failed to create or link customer profile' };
            }
            customerId = member.id;
        }

        console.log('[DEBUG] Step 1 Complete. CustomerId:', customerId);

        // Update member with any collected profile fields (only non-null values, to avoid wiping existing data)
        const memberUpdate: Record<string, any> = {};
        if (data.customer_dob) memberUpdate.date_of_birth = data.customer_dob;
        if (data.customer_pincode) {
            memberUpdate.pincode = data.customer_pincode;
            memberUpdate.aadhaar_pincode = data.customer_pincode;
        }
        if (data.customer_taluka) memberUpdate.taluka = data.customer_taluka;
        if (data.customer_name) memberUpdate.full_name = data.customer_name;

        if (Object.keys(memberUpdate).length > 0) {
            await adminClient.from('id_members').update(memberUpdate).eq('id', customerId);
        }

        console.log('[DEBUG] Step 1 Complete. CustomerId:', customerId);

        // 1.5. Prevent duplicate active leads for same customer (by id OR phone)
        const { data: existingLead, error: existingLeadError } = await adminClient
            .from('crm_leads')
            .select('id, status, events_log, customer_id, customer_phone')
            .eq('is_deleted', false)
            .eq('owner_tenant_id', effectiveOwnerId)
            .or(`customer_id.eq.${customerId},customer_phone.eq.${strictPhone}`)
            .not('status', 'in', '("CLOSED")')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingLeadError) {
            console.error('[DEBUG] Existing lead check failed:', existingLeadError);
        }

        if (existingLead) {
            const nowIso = new Date().toISOString();
            const duplicateEvent = {
                type: 'DUPLICATE_LEAD_ATTEMPT',
                at: nowIso,
                attempted_by: authUser?.id || null,
                attempted_phone: strictPhone,
                attempted_name: data.customer_name || null,
                source: data.source || 'UNKNOWN',
                note: 'Active lead exists; reusing lead for quote creation.',
            };

            const existingEvents = (existingLead.events_log as any[]) || [];
            await adminClient
                .from('crm_leads')
                .update({ events_log: [...existingEvents, duplicateEvent], updated_at: nowIso })
                .eq('id', existingLead.id);

            try {
                await adminClient.from('crm_audit_log').insert({
                    entity_type: 'LEAD',
                    entity_id: existingLead.id,
                    action: 'DUPLICATE_ATTEMPT',
                    new_data: {
                        attempted_by: authUser?.id || null,
                        attempted_phone: strictPhone,
                        attempted_name: data.customer_name || null,
                        source: data.source || 'UNKNOWN',
                        owner_tenant_id: effectiveOwnerId,
                    },
                    performed_by: authUser?.id || null,
                    performed_at: nowIso,
                    source: 'APP',
                });
            } catch (auditError) {
                console.error('[DEBUG] crm_audit_log insert failed:', auditError);
            }

            await serverLog({
                component: 'CRM',
                action: 'createLeadAction',
                status: 'INFO',
                message: `Duplicate lead attempt detected; using existing lead ${existingLead.id}`,
                payload: { existingLeadId: existingLead.id, customerId },
                duration_ms: Date.now() - startTime,
            });

            return { success: true, leadId: existingLead.id, duplicate: true };
        }

        // 2. Automated Segregation Logic (Pincode & Junking)
        let status = 'NEW';
        let isServiceable = false;

        if (data.customer_pincode) {
            const result = await checkServiceability(data.customer_pincode);
            isServiceable = result.isServiceable;

            if (!isServiceable) {
                status = 'JUNK';
            }
        }

        const { data: lead, error } = await adminClient
            .from('crm_leads')
            .insert({
                customer_id: customerId,
                customer_name: data.customer_name,
                customer_phone: strictPhone,
                customer_pincode: data.customer_pincode || null,
                customer_taluka: data.customer_taluka || null,
                customer_dob: data.customer_dob || null,
                interest_model: interestModel,
                interest_text: interestModel,
                interest_variant: data.model === 'GENERAL_ENQUIRY' ? null : null,
                owner_tenant_id: effectiveOwnerId,
                status: status,
                is_serviceable: isServiceable,
                source: data.source || 'WALKIN',
                utm_data: {
                    utm_source: data.source || 'MANUAL',
                    auto_segregated: status === 'JUNK',
                    segregation_reason: status === 'JUNK' ? 'Unserviceable Pincode' : null,
                },
                intent_score: status === 'JUNK' ? 'COLD' : 'WARM',
            })
            .select()
            .single();

        if (error) {
            console.error('[DEBUG] crm_leads insertion failed:', error);
            await serverLog({
                component: 'CRM',
                action: 'createLeadAction',
                status: 'ERROR',
                message: `Lead insertion failed: ${error.message}`,
                error: error,
                duration_ms: Date.now() - startTime,
            });
            return { success: false, message: error.message };
        }

        console.log('[DEBUG] Lead created successfully:', lead.id);
        await serverLog({
            component: 'CRM',
            action: 'createLeadAction',
            status: 'SUCCESS',
            message: `Identity Registered Successfully: ${lead.customer_name}`,
            payload: { leadId: lead.id },
            duration_ms: Date.now() - startTime,
        });
        revalidatePath('/app/[slug]/leads', 'page');
        return { success: true, leadId: lead.id };
    } catch (error) {
        console.error('[DEBUG] Lead creation process CRASHED:', error);
        await serverLog({
            component: 'CRM',
            action: 'createLeadAction',
            status: 'ERROR',
            message: error instanceof Error ? error.message : 'Process Crashed',
            error: error,
            duration_ms: Date.now() - startTime,
        });
        return {
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : (error as any)?.message || (typeof error === 'string' ? error : 'Unknown error'),
        };
    }
}

// --- QUOTES ---

export async function getQuotes(tenantId?: string) {
    const supabase = await createClient();
    let query = supabase
        .from('crm_quotes')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (tenantId) {
        query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) {
        console.error('getQuotes Error:', error);
        return [];
    }

    // Resolve customer names via adminClient (bypasses crm_leads RLS)
    const leadIds = [...new Set(data.map((q: any) => q.lead_id).filter(Boolean))];
    let leadNameMap: Record<string, string> = {};
    if (leadIds.length > 0) {
        const { data: leads } = await adminClient.from('crm_leads').select('id, customer_name').in('id', leadIds);
        if (leads) {
            leadNameMap = Object.fromEntries(leads.map((l: any) => [l.id, l.customer_name]));
        }
    }

    return data.map((q: any) => ({
        id: q.id,
        displayId: q.display_id || `QT-${q.id.slice(0, 4).toUpperCase()}`,
        customerName: leadNameMap[q.lead_id] || 'N/A',
        productName: q.commercials?.label || q.snap_variant || 'Custom Quote',
        productSku: q.variant_id || 'N/A',
        price: q.on_road_price || q.commercials?.grand_total || 0,
        status: q.status,
        date: q.created_at.split('T')[0],
        vehicleBrand: q.commercials?.brand || q.snap_brand || '',
        vehicleModel: q.commercials?.model || q.snap_model || '',
        vehicleVariant: q.commercials?.variant || q.snap_variant || '',
        vehicleColor: q.commercials?.color_name || q.commercials?.color || q.snap_color || '',
    }));
}

export async function getQuotesForLead(leadId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_quotes')
        .select('*')
        .eq('lead_id', leadId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('getQuotesForLead Error:', error);
        return [];
    }
    return data || [];
}

export async function getQuotesForMember(memberId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_quotes')
        .select('*')
        .eq('member_id', memberId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('getQuotesForMember Error:', error);
        return [];
    }
    return data || [];
}

export async function getBookingsForMember(memberId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_bookings')
        .select('*')
        .eq('user_id', memberId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('getBookingsForMember Error:', error);
        return [];
    }
    return data || [];
}

import { getAuthUser } from '@/lib/auth/resolver';

export async function createQuoteAction(data: {
    tenant_id: string;
    lead_id?: string;
    member_id?: string; // Direct member ID (for logged-in users)
    variant_id: string;
    color_id?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    commercials: Record<string, any>;
    source?: 'STORE_PDP' | 'LEADS';
}): Promise<{ success: boolean; data?: any; message?: string }> {
    const user = await getAuthUser();
    if (!user) {
        return {
            success: false,
            message: 'Authentication required to generate a quote.',
        };
    }
    const supabase = await createClient();
    const createdBy = user?.id;
    // Prefer explicit member_id or lead-linked customer_id (avoid using staff auth IDs)
    let memberId: string | null = data.member_id || null;
    let leadReferrerId: string | null = null;

    const comms: any = data.commercials || {};
    const snap = comms.pricing_snapshot || {};

    if (!comms.dealer && data.tenant_id) {
        const { data: tenant } = await supabase
            .from('id_tenants')
            .select('id, name, studio_id')
            .eq('id', data.tenant_id)
            .maybeSingle();
        if (tenant) {
            comms.dealer = {
                dealer_id: tenant.id,
                dealer_name: tenant.name,
                studio_id: tenant.studio_id,
            };
        }
    }

    const dealer = snap.dealer || comms.dealer || null;
    const missing: string[] = [];
    if (!comms.label && (!comms.brand || !comms.model || !comms.variant)) missing.push('vehicle_label');
    if (!snap || Object.keys(snap).length === 0) missing.push('pricing_snapshot');
    if (!(snap.ex_showroom || comms.ex_showroom || comms.base_price)) missing.push('ex_showroom');
    if (snap.rto_total === undefined || snap.rto_total === null) missing.push('rto_total');
    if (snap.insurance_total === undefined || snap.insurance_total === null) missing.push('insurance_total');
    if (!dealer?.dealer_id && !dealer?.studio_id && !dealer?.id) missing.push('dealer');
    if (!comms.color_name && !comms.color && !data.color_id) missing.push('color');

    if (missing.length > 0) {
        return {
            success: false,
            message: `Quote creation blocked: missing ${missing.join(', ')}.`,
        };
    }

    data.commercials = comms;

    if (data.lead_id) {
        const { data: lead } = await supabase
            .from('crm_leads')
            .select('customer_id, referred_by_id')
            .eq('is_deleted', false)
            .eq('id', data.lead_id)
            .maybeSingle();
        if (lead) {
            // Only use lead's customer_id if we don't already have a member_id
            if (!memberId && lead.customer_id) {
                memberId = lead.customer_id;
            }
            leadReferrerId = lead.referred_by_id || null;
        }
    }

    if (!memberId && user?.id) {
        const { data: member } = await supabase.from('id_members').select('id, role').eq('id', user.id).maybeSingle();
        if (member && (!member.role || member.role === 'BMB_USER' || member.role === 'MEMBER')) {
            memberId = member.id;
        }
    }

    // Extract flat fields for analytics - handling Multiple naming conventions
    // Note: comms is already defined above
    const onRoadPrice = Math.round(comms.grand_total || comms.onRoad || 0);
    const exShowroom = Math.round(comms.base_price || comms.exShowroom || comms.ex_showroom || 0);
    const pricingSnapshot = comms?.pricing_snapshot || {};
    const rtoAmount = Math.round(Number(pricingSnapshot?.rto_total ?? pricingSnapshot?.rto?.total ?? comms.rto ?? 0));
    const insuranceAmount = Math.round(
        Number(pricingSnapshot?.insurance_total ?? pricingSnapshot?.insurance?.total ?? comms.insurance ?? 0)
    );
    const accessoriesAmount = Math.round(Number(pricingSnapshot?.accessories_total ?? comms.accessories_total ?? 0));

    const vehicleSkuId = data.color_id || data.variant_id;

    const { data: quote, error } = await adminClient
        .from('crm_quotes')
        .insert({
            tenant_id: data.tenant_id,
            lead_id: data.lead_id,
            member_id: memberId,
            lead_referrer_id: leadReferrerId,
            quote_owner_id: createdBy || null,
            variant_id: data.variant_id,
            color_id: data.color_id,
            vehicle_sku_id: vehicleSkuId, // Use SKU (color) when available
            commercials: data.commercials,

            // Flat Columns (analytics + redundancy)
            on_road_price: onRoadPrice,
            ex_showroom_price: exShowroom,
            insurance_amount: insuranceAmount,
            rto_amount: rtoAmount,
            accessories_amount: accessoriesAmount,

            // Snapshot Redundancy — survives even if commercials JSONB corrupts
            snap_brand: comms.brand || '',
            snap_model: comms.model || '',
            snap_variant: comms.variant || '',
            snap_color: comms.color_name || comms.color || '',
            snap_dealer_name: dealer?.dealer_name || '',

            status: 'DRAFT',
            created_by: createdBy,
        })
        .select()
        .single();

    if (error) {
        console.error('Create Quote Logic Failure:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            context: { tenant_id: data.tenant_id, lead_id: data.lead_id, sku: data.variant_id },
        });
        return { success: false, message: error.message };
    }

    // Supersede older quotes for same Lead + SKU (one SKU = one active quote per lead)
    if (data.lead_id && vehicleSkuId) {
        await adminClient
            .from('crm_quotes')
            .update({ status: 'SUPERSEDED', updated_at: new Date().toISOString() })
            .eq('lead_id', data.lead_id)
            .eq('vehicle_sku_id', vehicleSkuId)
            .neq('id', quote.id)
            .not('status', 'in', '("CONVERTED","BOOKING","BOOKED")');
    }

    const finance = (data.commercials as any)?.finance || null;
    if (finance?.scheme_id || finance?.bank_id) {
        const { data: attempt, error: financeError } = await adminClient
            .from('crm_quote_finance_attempts')
            .insert({
                quote_id: quote.id,
                tenant_id: data.tenant_id,
                bank_id: finance.bank_id || null,
                bank_name: finance.bank_name || null,
                scheme_id: finance.scheme_id || null,
                scheme_code: finance.scheme_code || null,
                ltv: finance.ltv || null,
                roi: finance.roi || null,
                tenure_months: finance.tenure_months || null,
                down_payment: finance.down_payment || null,
                loan_amount: finance.loan_amount || null,
                loan_addons: finance.loan_addons || null,
                processing_fee: finance.processing_fee || null,
                charges_breakup: finance.charges_breakup || [],
                emi: finance.emi || null,
                status: finance.status || 'IN_PROCESS',
                created_by: createdBy || null,
            })
            .select('id')
            .single();

        if (financeError) {
            console.error('Finance attempt create failed:', financeError);
        } else if (attempt?.id) {
            await adminClient
                .from('crm_quotes')
                .update({
                    finance_mode: 'LOAN',
                    active_finance_id: attempt.id,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', quote.id);
        }
    } else {
        await adminClient
            .from('crm_quotes')
            .update({
                finance_mode: 'CASH',
                updated_at: new Date().toISOString(),
            })
            .eq('id', quote.id);
    }

    // 2. Sync Lead Status to 'QUOTE'
    if (data.lead_id) {
        const { error: leadUpdateError } = await adminClient
            .from('crm_leads')
            .update({
                status: 'QUOTE',
                updated_at: new Date().toISOString(),
            })
            .eq('id', data.lead_id);

        if (leadUpdateError) {
            console.error('Critical: Lead status sync failed after quote creation:', leadUpdateError);
        } else {
            revalidatePath(`/app/[slug]/leads`);
        }
    }

    revalidatePath('/app/[slug]/quotes');
    revalidatePath('/profile'); // Transaction Registry
    return { success: true, data: quote };
}

export async function acceptQuoteAction(id: string): Promise<{ success: boolean; message?: string }> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('crm_quotes')
        .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Accept Quote Error:', error);
        return { success: false, message: error.message };
    }

    // Log timeline event
    await logQuoteEvent(id, 'Quote Approved', 'Team Member', 'team', { source: 'CRM' });

    revalidatePath('/app/[slug]/quotes');
    revalidatePath('/profile');
    return { success: true };
}

export async function confirmQuoteAction(id: string): Promise<{ success: boolean; message?: string }> {
    const supabase = await createClient();
    // In later phases, this will perform a SKU lockdown check
    const { error } = await supabase
        .from('crm_quotes')
        .update({ status: 'CONFIRMED', updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Confirm Quote Error:', error);
        return { success: false, message: error.message };
    }

    // Log timeline event
    await logQuoteEvent(id, 'Quote Confirmed', 'Team Member', 'team', { source: 'CRM' });

    revalidatePath('/app/[slug]/quotes');
    revalidatePath('/profile');
    return { success: true };
}

export async function lockQuoteAction(id: string): Promise<{ success: boolean; message?: string }> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('crm_quotes')
        .update({ status: 'DENIED', updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Lock Quote Error:', error);
        return { success: false, message: error.message };
    }
    await logQuoteEvent(id, 'Quote Denied', 'Team Member', 'team', { source: 'CRM' });
    revalidatePath('/app/[slug]/quotes');
    revalidatePath('/profile');
    return { success: true };
}

export async function cancelQuoteAction(id: string): Promise<{ success: boolean; message?: string }> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('crm_quotes')
        .update({ status: 'CANCELED', updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Cancel Quote Error:', error);
        return { success: false, message: error.message };
    }
    await logQuoteEvent(id, 'Quote Canceled', 'Customer', 'customer', { source: 'CUSTOMER' });
    revalidatePath('/app/[slug]/quotes');
    revalidatePath('/profile');
    return { success: true };
}

// --- BOOKINGS & SALES ORDERS ---

export async function getBookings(tenantId?: string) {
    const supabase = await createClient();
    let query = supabase
        .from('crm_bookings')
        .select('*, member:id_members!user_id(full_name)')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (tenantId) {
        query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) {
        console.error('[getBookings] Error:', error);
        // Fallback: try without join if the FK fails
        const fallback = await supabase
            .from('crm_bookings')
            .select('*')
            .eq('is_deleted', false)
            .eq(tenantId ? 'tenant_id' : 'is_deleted', tenantId || false)
            .order('created_at', { ascending: false });

        if (fallback.error || !fallback.data) return [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return fallback.data.map((b: any) => {
            const v = b.vehicle_details || {};
            const c = b.customer_details || {};
            return {
                id: b.id,
                displayId: b.display_id || `SO-${b.id.slice(0, 4).toUpperCase()}`,
                quoteId: b.quote_id,
                quoteDisplayId: b.quote_id ? `QT-${b.quote_id.slice(0, 4).toUpperCase()}` : '',
                customer: c.full_name || c.name || c.customer_name || 'N/A',
                brand: v.brand || 'N/A',
                model: v.model || 'N/A',
                variant: v.variant || 'N/A',
                price: b.grand_total || 0,
                status: b.status || 'BOOKED',
                date: b.created_at ? b.created_at.split('T')[0] : '',
                currentStage: b.current_stage,
            };
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((b: any) => {
        const v = b.vehicle_details || {};
        const c = b.customer_details || {};
        const memberName = b.member?.full_name;

        return {
            id: b.id,
            displayId: b.display_id || `SO-${b.id.slice(0, 4).toUpperCase()}`,
            quoteId: b.quote_id,
            quoteDisplayId: b.quote_id ? `QT-${b.quote_id.slice(0, 4).toUpperCase()}` : '',
            customer: memberName || c.full_name || c.name || c.customer_name || 'N/A',
            brand: v.brand || 'N/A',
            model: v.model || 'N/A',
            variant: v.variant || 'N/A',
            price: b.grand_total || 0,
            status: b.status || 'BOOKED',
            date: b.created_at ? b.created_at.split('T')[0] : '',
            currentStage: b.current_stage,
        };
    });
}

export async function getBookingForLead(leadId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_bookings')
        .select('*')
        .eq('lead_id', leadId)
        .eq('is_deleted', false)
        .maybeSingle();

    if (error) {
        console.error('getBookingForLead Error:', error);
        return null;
    }
    return data;
}

export async function getBookingById(bookingId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_bookings')
        .select('*')
        .eq('id', bookingId)
        .eq('is_deleted', false)
        .single();

    if (error) {
        console.error('getBookingById Error:', error);
        return { success: false, error: error.message };
    }

    return { success: true, booking: data };
}

export async function createBookingFromQuote(quoteId: string) {
    try {
        const { data: bookingId, error: rpcError } = await (adminClient as any).rpc('create_booking_from_quote', {
            quote_id: quoteId,
        });

        if (rpcError) {
            console.error('[createBookingFromQuote] RPC Error:', rpcError);
            return { success: false, message: rpcError.message };
        }

        if (!bookingId) {
            return { success: false, message: 'Booking creation failed: No ID returned' };
        }

        const bookingIdValue = bookingId as string;
        const { data: booking, error: bookingError } = await adminClient
            .from('crm_bookings')
            .select('*')
            .eq('id', bookingIdValue)
            .eq('is_deleted', false)
            .single();

        if (bookingError) {
            console.error('[createBookingFromQuote] Fetch Booking Error:', bookingError);
            return { success: false, message: bookingError.message };
        }

        revalidatePath('/app/[slug]/sales-orders');
        revalidatePath('/profile');

        return { success: true, data: booking };
    } catch (err: any) {
        console.error('[createBookingFromQuote] CRITICAL CRASH:', err);
        return { success: false, message: `Server Error: ${err.message || String(err)}` };
    }
}

export async function confirmSalesOrder(bookingId: string): Promise<{ success: boolean; message?: string }> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('crm_bookings')
        .update({ status: 'CONFIRMED', updated_at: new Date().toISOString() })
        .eq('id', bookingId);

    if (error) {
        console.error('Confirm Sales Order Error:', error);
        return { success: false, message: error.message };
    }

    revalidatePath('/app/[slug]/sales-orders');
    revalidatePath('/profile');
    return { success: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateBookingStage(id: string, stage: string, statusUpdates: Record<string, any>) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('crm_bookings')
        .update({
            current_stage: stage,
            ...statusUpdates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) {
        console.error('Update Booking Stage Error:', error);
        return { success: false, message: error.message };
    }
    revalidatePath('/app/[slug]/sales-orders');
    return { success: true };
}

// --- MEMBER DOCUMENTS ---

export async function getMemberDocuments(memberId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('id_member_assets')
        .select('*')
        .eq('entity_id', memberId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching member documents:', error);
        return [];
    }

    return data || [];
}

export async function uploadMemberDocumentAction(data: {
    memberId: string;
    tenantId: string;
    path: string;
    fileType: string;
    purpose: string;
    metadata?: any;
}) {
    const supabase = await createClient();
    const { data: asset, error } = await supabase
        .from('id_member_assets')
        .insert({
            entity_id: data.memberId,
            tenant_id: data.tenantId,
            path: data.path,
            file_type: data.fileType,
            purpose: data.purpose,
            metadata: data.metadata || {},
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        console.error('Error inserting member document:', error);
        throw error;
    }

    return asset;
}

export async function uploadMemberDocument(data: {
    memberId: string;
    name: string;
    filePath: string;
    fileType: string;
    category: string;
    label?: string;
    fileSize?: number;
}) {
    const supabase = await createClient();
    const { data: doc, error } = await supabase
        .from('crm_member_documents')
        .insert({
            member_id: data.memberId,
            name: data.name,
            file_path: data.filePath,
            file_type: data.fileType,
            category: data.category,
            label: data.label || data.category,
            file_size: data.fileSize || null,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        console.error('uploadMemberDocument Error:', error);
        throw error;
    }

    return doc;
}

export async function getCrmMemberDocuments(memberId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_member_documents')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('getCrmMemberDocuments Error:', error);
        return [];
    }

    return data || [];
}

export async function deleteCrmMemberDocument(documentId: string) {
    const supabase = await createClient();

    // Get the file path first
    const { data: doc, error: fetchError } = await supabase
        .from('crm_member_documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

    if (fetchError) {
        console.error('Error fetching document for deletion:', fetchError);
        throw fetchError;
    }

    // Delete from storage
    if (doc?.file_path) {
        const { error: storageError } = await supabase.storage.from('member-documents').remove([doc.file_path]);

        if (storageError) {
            console.error('Error removing file from storage:', storageError);
            // We continue to delete from DB even if storage delete fails (maybe it was already gone)
        }
    }

    const { error } = await supabase.from('crm_member_documents').delete().eq('id', documentId);

    if (error) {
        console.error('deleteCrmMemberDocument Error:', error);
        throw error;
    }
}

export async function deleteMemberDocumentAction(documentId: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('id_member_assets').delete().eq('id', documentId);

    if (error) {
        console.error('Error deleting member document:', error);
        throw error;
    }
}

export async function updateMemberDocumentAction(
    id: string,
    updates: {
        path?: string;
        purpose?: string;
        file_type?: string;
        metadata?: any;
    }
) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('id_member_assets')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating member document:', error);
        throw error;
    }
    return data;
}

export async function getSignedUrlAction(path: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.storage.from('id_documents').createSignedUrl(path, 60); // 60 seconds expiry

    if (error) {
        console.error('Error creating signed URL:', error);
        throw error;
    }

    return data.signedUrl;
}

export async function getMemberDocumentUrl(path: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.storage.from('member-documents').createSignedUrl(path, 3600); // 1 hour expiry

    if (error) {
        console.error('Error creating signed URL:', error);
        return null;
    }

    return data.signedUrl;
}

export async function getQuotePdpUrl(quoteId: string) {
    const supabase = await createClient();

    // 1. Fetch Quote to get variant_id
    const { data: quote, error: quoteError } = await supabase
        .from('crm_quotes')
        .select('variant_id, lead_id')
        .eq('is_deleted', false)
        .eq('id', quoteId)
        .single();

    if (quoteError || !quote || !quote.variant_id) {
        console.error('getQuotePdpUrl Error: Quote not found', quoteError);
        return { success: false, error: 'Quote or Variant not found' };
    }

    // 2. Fetch Variant Item (cat_items) to get slug and parent_id (Model)
    const { data: variant, error: variantError } = await supabase
        .from('cat_items')
        .select('slug, parent_id')
        .eq('id', quote.variant_id)
        .single();

    if (variantError || !variant || !variant.parent_id) {
        console.error('getQuotePdpUrl Error: Variant not found', variantError);
        return { success: false, error: 'Variant not found in catalog' };
    }

    // 3. Fetch Model Item (cat_items) to get slug and brand_id
    const { data: model, error: modelError } = await supabase
        .from('cat_items')
        .select('slug, brand_id')
        .eq('id', variant.parent_id)
        .single();

    if (modelError || !model || !model.brand_id) {
        console.error('getQuotePdpUrl Error: Model not found', modelError);
        return { success: false, error: 'Model not found in catalog' };
    }

    // 4. Fetch Brand (cat_brands) to get slug
    const { data: brand, error: brandError } = await supabase
        .from('cat_brands')
        .select('slug')
        .eq('id', model.brand_id)
        .single();

    if (brandError || !brand) {
        console.error('getQuotePdpUrl Error: Brand not found', brandError);
        return { success: false, error: 'Brand not found in catalog' };
    }

    // 5. Construct URL (canonical short slug)
    const brandSlug = brand.slug;
    const modelSlug = model.slug;
    const rawVariantSlug = variant.slug;
    let cleanVariantSlug = rawVariantSlug;

    if (rawVariantSlug?.startsWith(`${brandSlug}-${modelSlug}-`)) {
        cleanVariantSlug = rawVariantSlug.replace(`${brandSlug}-${modelSlug}-`, '');
    } else if (rawVariantSlug?.startsWith(`${modelSlug}-`)) {
        cleanVariantSlug = rawVariantSlug.replace(`${modelSlug}-`, '');
    } else if (rawVariantSlug?.startsWith(`${brandSlug}-`)) {
        cleanVariantSlug = rawVariantSlug.replace(`${brandSlug}-`, '');
    }

    if (!cleanVariantSlug) cleanVariantSlug = rawVariantSlug;

    const url = `/store/${brandSlug}/${modelSlug}/${cleanVariantSlug}?quoteId=${quoteId}&leadId=${quote.lead_id}`;
    return { success: true, url };
}

// --- QUOTE EDITOR DASHBOARD ACTIONS ---

export interface QuoteEditorData {
    id: string;
    displayId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    validUntil: string | null;
    leadId?: string | null;
    reviewedBy: string | null;
    reviewedAt: string | null;
    expectedDelivery: string | null;
    studioId: string | null;
    studioName: string | null;
    tenantId: string | null;
    district: string | null;
    customer: {
        name: string;
        phone: string;
        email: string | null;
        leadSource: string | null;
    };
    customerProfile?: {
        memberId?: string | null;
        fullName?: string | null;
        primaryPhone?: string | null;
        whatsapp?: string | null;
        primaryEmail?: string | null;
        email?: string | null;
        currentAddress?: string | null;
        currentAddress1?: string | null;
        currentAddress2?: string | null;
        currentAddress3?: string | null;
        aadhaarAddress?: string | null;
        workAddress?: string | null;
        workCompany?: string | null;
        workDesignation?: string | null;
        workIndustry?: string | null;
        workProfile?: string | null;
        workPincode?: string | null;
        workTaluka?: string | null;
        workDistrict?: string | null;
        workState?: string | null;
        aadhaarAddress1?: string | null;
        aadhaarAddress2?: string | null;
        aadhaarAddress3?: string | null;
        workAddress1?: string | null;
        workAddress2?: string | null;
        workAddress3?: string | null;
        taluka?: string | null;
        district?: string | null;
        state?: string | null;
        pincode?: string | null;
        dob?: string | null;
        ownershipType?: string | null;
        avatarUrl?: string | null;
    } | null;
    referral?: {
        referredByName?: string | null;
        referredById?: string | null;
        referralData?: any;
    } | null;
    vehicle: {
        brand: string;
        model: string;
        variant: string;
        color: string;
        colorHex: string;
        imageUrl: string | null;
        skuId: string;
    };
    pricing: {
        exShowroom: number;
        exShowroomGstRate?: number;
        rtoType: 'STATE' | 'BH' | 'COMPANY';
        rtoBreakdown: { label: string; amount: number }[];
        rtoTotal: number;
        insuranceOD: number;
        insuranceTP: number;
        insuranceAddons: {
            id: string;
            name: string;
            amount: number;
            basePrice?: number;
            discountPrice?: number | null;
            selected: boolean;
            breakdown?: any;
        }[];
        insuranceGST: number;
        insuranceTotal: number;
        insuranceProvider?: string | null;
        accessories: {
            id: string;
            name: string;
            price: number;
            basePrice?: number;
            discountPrice?: number | null;
            qty?: number;
            selected: boolean;
        }[];
        accessoriesTotal: number;
        services: {
            id: string;
            name: string;
            price: number;
            basePrice?: number;
            discountPrice?: number | null;
            qty?: number;
            selected: boolean;
        }[];
        servicesTotal: number;
        insuranceGstRate: number;
        dealerDiscount: number;
        colorDelta?: number;
        offersDelta?: number;
        managerDiscount: number;
        managerDiscountNote: string | null;
        onRoadTotal: number;
        finalTotal: number;
        rtoOptions?: any[];
        insuranceRequiredItems?: any[];
        offersItems?: any[];
        warrantyItems?: any[];
        referralApplied?: boolean;
        referralBonus?: number;
    };
    financeMode?: 'CASH' | 'LOAN';
    delivery?: {
        serviceable?: boolean | null;
        pincode?: string | null;
        taluka?: string | null;
        district?: string | null;
        stateCode?: string | null;
        delivery_tat_days?: number | null;
        checked_at?: string | null;
    } | null;
    finance?: {
        id?: string | null;
        status?: 'IN_PROCESS' | 'UNDERWRITING' | 'DOC_PENDING' | 'APPROVED' | 'REJECTED';
        bankId?: string | null;
        bankName?: string | null;
        schemeId?: string | null;
        schemeCode?: string | null;
        selection_logic?: string | null;
        scheme_interest_rate?: number | null;
        scheme_interest_type?: string | null;
        ltv?: number | null;
        roi?: number | null;
        tenureMonths?: number | null;
        downPayment?: number | null;
        loanAmount?: number | null;
        loanAddons?: number | null;
        processingFee?: number | null;
        chargesBreakup?: any[] | null;
        emi?: number | null;
        approvedDownPayment?: number | null;
        approvedAmount?: number | null;
        approvedAddOns?: number | null;
        approvedProcessingFee?: number | null;
        approvedChargesBreakup?: any[] | null;
        approvedAddonsBreakup?: any[] | null;
        approvedEmi?: number | null;
        approvedScheme?: string | null;
        approvedTenure?: number | null;
        approvedIrr?: number | null;
        approvedMarginMoney?: number | null;
        approvedGrossLoan?: number | null;
    } | null;
    financeAttempts?: {
        id: string;
        status: 'IN_PROCESS' | 'UNDERWRITING' | 'DOC_PENDING' | 'APPROVED' | 'REJECTED';
        bankId?: string | null;
        bankName?: string | null;
        schemeId?: string | null;
        schemeCode?: string | null;
        roi?: number | null;
        tenureMonths?: number | null;
        downPayment?: number | null;
        loanAmount?: number | null;
        loanAddons?: number | null;
        processingFee?: number | null;
        chargesBreakup?: any[] | null;
        emi?: number | null;
        createdAt?: string | null;
    }[];
    timeline: { event: string; timestamp: string; actor: string | null; actorType: 'customer' | 'team' }[];
}

export async function getQuoteById(
    quoteId: string
): Promise<{ success: boolean; data?: QuoteEditorData; error?: string }> {
    const supabase = await createClient();

    // Fetch quote with related data
    const { data: quote, error } = await supabase
        .from('crm_quotes')
        .select(
            `
            *,
            lead:crm_leads!quotes_lead_id_fkey(id, customer_name, customer_phone, utm_data, events_log, customer_id, referral_data, referred_by_name, referred_by_id)
        `
        )
        .eq('id', quoteId)
        .eq('is_deleted', false)
        .single();

    if (error || !quote) {
        console.error('getQuoteById Error:', error);
        return { success: false, error: error?.message || 'Quote not found' };
    }

    // Cast to any since we just added new columns that aren't in generated types yet
    const q = quote as any;

    const commercials: any = q.commercials || {};
    const pricingSnapshot: any = commercials.pricing_snapshot || {};
    const dealerFromPricing = pricingSnapshot?.dealer || commercials?.dealer || null;

    // Fetch high-fidelity pricing from cat_price_state
    const pricingClient = await createClient();
    let highFidelityPricing = null;
    const colorId = q.color_id || q.vehicle_sku_id || pricingSnapshot?.color_id;
    const stateCode = commercials.location?.state_code || pricingSnapshot?.location?.state_code;
    const district = commercials.location?.district || pricingSnapshot?.location?.district;

    if (colorId && stateCode) {
        const { data: priceData } = await pricingClient
            .from('cat_price_state')
            .select('gst_rate, rto, hsn_code')
            .eq('vehicle_color_id', colorId)
            .eq('state_code', stateCode)
            .or(`district.eq.${district},district.eq.ALL`)
            .order('district', { ascending: false })
            .limit(1)
            .maybeSingle();
        highFidelityPricing = priceData;
    }

    const missing: string[] = [];
    if (!commercials.label && (!commercials.brand || !commercials.model || !commercials.variant)) {
        missing.push('vehicle_label');
    }
    if (!commercials.color_name && !commercials.color && !q.color_id && !q.vehicle_sku_id) {
        missing.push('color');
    }
    if (!pricingSnapshot || Object.keys(pricingSnapshot).length === 0) {
        missing.push('pricing_snapshot');
    }
    if (!(pricingSnapshot?.ex_showroom || commercials.ex_showroom || commercials.base_price)) {
        missing.push('ex_showroom');
    }
    if (pricingSnapshot?.rto_total === undefined || pricingSnapshot?.rto_total === null) {
        missing.push('rto_total');
    }
    if (pricingSnapshot?.insurance_total === undefined || pricingSnapshot?.insurance_total === null) {
        missing.push('insurance_total');
    }
    if (!dealerFromPricing?.dealer_id && !dealerFromPricing?.studio_id && !dealerFromPricing?.id && !q.studio_id) {
        missing.push('dealer');
    }

    if (missing.length > 0) {
        return {
            success: false,
            error: `Quote data incomplete: ${missing.join(', ')}. Please re-create this quote.`,
        };
    }

    // Build timeline from lead events + quote events
    const timeline: {
        event: string;
        timestamp: string;
        actor: string | null;
        actorType: 'customer' | 'team';
        source?: string | null;
        reason?: string | null;
    }[] = [];

    timeline.push({
        event: 'Quote Created',
        timestamp: q.created_at || new Date().toISOString(),
        actor: null,
        actorType: 'team',
        source: 'SYSTEM',
    });

    if (q.reviewed_at) {
        timeline.push({
            event: q.status === 'IN_REVIEW' ? 'In Review' : 'Manager Reviewed',
            timestamp: q.reviewed_at,
            actor: q.reviewed_by,
            actorType: 'team',
            source: 'CRM',
        });
    }

    // Add stored timeline events from commercials
    if (commercials.timeline && Array.isArray(commercials.timeline)) {
        commercials.timeline.forEach((ev: any) => {
            timeline.push({
                event: ev.event,
                timestamp: ev.timestamp,
                actor: ev.actor,
                actorType: ev.actorType || 'team',
                source: ev.source || null,
                reason: ev.reason || null,
            });
        });
    }

    // Sort timeline by timestamp
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const baseData = {
        id: q.id,
        displayId: q.display_id || `QT-${q.id.slice(0, 8).toUpperCase()}`,
        status: q.status || 'DRAFT',
        createdAt: q.created_at || new Date().toISOString(),
        updatedAt: q.updated_at || new Date().toISOString(),
        validUntil: q.valid_until,
        leadId: q.lead_id || null,
        reviewedBy: q.reviewed_by,
        reviewedAt: q.reviewed_at,
        expectedDelivery: q.expected_delivery,
        studioId: q.studio_id || dealerFromPricing?.studio_id || dealerFromPricing?.dealer_id || null,
        studioName: dealerFromPricing?.dealer_name || dealerFromPricing?.name || null,
        district: pricingSnapshot?.location?.district || null,
        financeMode: q.finance_mode || (commercials.finance?.mode as any) || 'CASH',
        tenantId: q.tenant_id || null,
        delivery: commercials.delivery || null,
    };

    // Fetch Member Profile (single query to avoid slow duplicate fetches)
    let customerProfile: any = null;
    const leadPhoneRaw = q.lead?.customer_phone || '';
    const leadPhoneDigits = toAppStorageFormat(leadPhoneRaw);
    const leadPhone = leadPhoneDigits; // Keep for conditional checks

    // Construct robust search variations
    const phoneSearchVariations = new Set<string>();
    if (leadPhoneRaw) phoneSearchVariations.add(leadPhoneRaw.trim());
    if (leadPhoneDigits) phoneSearchVariations.add(leadPhoneDigits);
    if (leadPhoneDigits.length > 10) phoneSearchVariations.add(leadPhoneDigits.slice(-10));
    // Add common formatted versions if we have a clean 10-digit number
    if (leadPhoneDigits.length === 10) {
        phoneSearchVariations.add(`+91${leadPhoneDigits}`);
        phoneSearchVariations.add(`+91 ${leadPhoneDigits}`);
    }
    const leadEmail = null;

    const resolvedMemberId = q.member_id || q.lead?.customer_id || null;

    if (resolvedMemberId || leadPhone) {
        const { data: member } = await adminClient
            .from('id_members')
            .select(
                [
                    'id',
                    'full_name',
                    'primary_phone',
                    'whatsapp',
                    'primary_email',
                    'email',
                    'current_address1',
                    'current_address2',
                    'current_address3',
                    'aadhaar_address1',
                    'aadhaar_address2',
                    'aadhaar_address3',
                    'work_address1',
                    'work_address2',
                    'work_address3',
                    'work_company',
                    'work_designation',
                    'work_email',
                    'work_phone',
                    'taluka',
                    'district',
                    'state',
                    'pincode',
                    'date_of_birth',
                    'avatar_url',
                ].join(', ')
            )
            .eq('id', resolvedMemberId || '')
            .maybeSingle();

        let resolvedMember: any = member;

        if (!resolvedMember && phoneSearchVariations.size > 0) {
            const { data: memberByContact } = await adminClient
                .from('id_members')
                .select(
                    [
                        'id',
                        'full_name',
                        'primary_phone',
                        'whatsapp',
                        'primary_email',
                        'email',
                        'current_address1',
                        'current_address2',
                        'current_address3',
                        'aadhaar_address1',
                        'aadhaar_address2',
                        'aadhaar_address3',
                        'work_address1',
                        'work_address2',
                        'work_address3',
                        'work_company',
                        'work_designation',
                        'work_email',
                        'work_phone',
                        'taluka',
                        'district',
                        'state',
                        'pincode',
                        'aadhaar_pincode',
                        'date_of_birth',
                        'avatar_url',
                    ].join(', ')
                )
                .or(
                    Array.from(phoneSearchVariations)
                        .flatMap(p => [`primary_phone.eq.${p}`, `whatsapp.eq.${p}`])
                        // Escaping commas if necessary, though typical phone chars are safe
                        .join(',')
                )
                .limit(1)
                .maybeSingle();
            resolvedMember = memberByContact || null;

            if (resolvedMember && q.lead?.id && !q.lead?.customer_id) {
                await supabase.from('crm_leads').update({ customer_id: resolvedMember.id }).eq('id', q.lead.id);
            }

            if (resolvedMember && q.id && !q.member_id) {
                await supabase.from('crm_quotes').update({ member_id: resolvedMember.id }).eq('id', q.id);
            }
        }

        if (resolvedMember) {
            const currentAddress = [
                resolvedMember.current_address1,
                resolvedMember.current_address2,
                resolvedMember.current_address3,
            ]
                .filter(Boolean)
                .join(', ');
            const aadhaarAddress = [
                resolvedMember.aadhaar_address1,
                resolvedMember.aadhaar_address2,
                resolvedMember.aadhaar_address3,
            ]
                .filter(Boolean)
                .join(', ');
            const workAddress = [
                resolvedMember.work_address1,
                resolvedMember.work_address2,
                resolvedMember.work_address3,
            ]
                .filter(Boolean)
                .join(', ');

            customerProfile = {
                memberId: resolvedMember.id,
                fullName: resolvedMember.full_name,
                primaryPhone: resolvedMember.primary_phone,
                whatsapp: resolvedMember.whatsapp,
                primaryEmail: resolvedMember.primary_email,
                email: resolvedMember.email,
                dob: resolvedMember.date_of_birth,
                pincode: resolvedMember.pincode || resolvedMember.aadhaar_pincode,
                taluka: resolvedMember.taluka,
                district: resolvedMember.district,
                state: resolvedMember.state,
                currentAddress: currentAddress || null,
                aadhaarAddress: aadhaarAddress || null,
                workAddress: workAddress || null,
                currentAddress1: resolvedMember.current_address1,
                currentAddress2: resolvedMember.current_address2,
                currentAddress3: resolvedMember.current_address3,
                aadhaarAddress1: resolvedMember.aadhaar_address1,
                aadhaarAddress2: resolvedMember.aadhaar_address2,
                aadhaarAddress3: resolvedMember.aadhaar_address3,
                workAddress1: resolvedMember.work_address1,
                workAddress2: resolvedMember.work_address2,
                workAddress3: resolvedMember.work_address3,
                workCompany: resolvedMember.work_company,
                workDesignation: resolvedMember.work_designation,
                workEmail: resolvedMember.work_email,
                workPhone: resolvedMember.work_phone,
                avatarUrl: resolvedMember.avatar_url || null,
            };
        }
    }

    // Resolve vehicle image: fallback to cat_items if not stored on quote
    let vehicleImageUrl = q.vehicle_image || commercials.image_url || null;
    if (!vehicleImageUrl) {
        const skuId = q.vehicle_sku_id || q.color_id || q.variant_id;
        if (skuId) {
            const { data: catItem } = await adminClient.from('cat_items').select('image_url').eq('id', skuId).single();
            vehicleImageUrl = catItem?.image_url || null;
        }
    }

    const result: QuoteEditorData = {
        ...baseData,
        customer: {
            name: q.lead?.customer_name || 'N/A',
            phone: q.lead?.customer_phone || 'N/A',
            email: null,
            leadSource: q.lead?.utm_data?.utm_source || 'WEBSITE',
        },
        customerProfile,
        referral: q.lead
            ? {
                  referredByName: q.lead?.referred_by_name || null,
                  referredById: q.lead?.referred_by_id || null,
                  referralData: q.lead?.referral_data || null,
              }
            : null,
        vehicle: {
            brand: commercials.brand || 'N/A',
            model: commercials.model || 'N/A',
            variant: commercials.variant || 'N/A',
            color: commercials.color_name || commercials.color || 'N/A',
            colorHex: commercials.color_hex || '#000000',
            imageUrl: vehicleImageUrl,
            skuId: q.vehicle_sku_id || q.color_id || q.variant_id || '',
        },
        pricing: {
            exShowroom: parseInt(q.ex_showroom_price) || commercials.ex_showroom || commercials.base_price || 0,
            exShowroomGstRate: highFidelityPricing?.gst_rate
                ? Math.round(
                      Number(highFidelityPricing.gst_rate) * (Number(highFidelityPricing.gst_rate) < 1 ? 100 : 1)
                  )
                : 28,
            rtoType: pricingSnapshot.rto_type || commercials.rto_type || 'STATE',
            rtoBreakdown: (() => {
                const type = pricingSnapshot.rto_type || commercials.rto_type || 'STATE';
                const highFidelityRto = (highFidelityPricing as any)?.rto?.[type];

                if (highFidelityRto && typeof highFidelityRto === 'object') {
                    return Object.entries(highFidelityRto)
                        .filter(([key]) => key !== 'total' && key !== 'id')
                        .map(([key, val]) => ({
                            label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                            amount: Number(val) || 0,
                        }));
                }
                return pricingSnapshot.rto_breakdown || [];
            })(),
            rtoTotal: pricingSnapshot.rto_total || 0,
            insuranceTP: (() => {
                // Priority 1: Flat key from new marketplace snapshots
                const flatTp = pricingSnapshot.insurance_tp ?? commercials.insurance_tp;
                if (flatTp !== undefined && flatTp !== null && Number(flatTp) > 0) return Number(flatTp);
                // Priority 2: SOT object format {base, gst, total}
                const objTp = pricingSnapshot.insurance?.tp;
                if (objTp && typeof objTp === 'object' && 'total' in objTp) return Number(objTp.total || 0);
                if (typeof objTp === 'number' && objTp > 0) return objTp;
                // Priority 3: commercials insurance object
                const commObjTp = commercials.insurance?.tp;
                if (commObjTp && typeof commObjTp === 'object' && 'total' in commObjTp)
                    return Number(commObjTp.total || 0);
                if (typeof commObjTp === 'number' && commObjTp > 0) return commObjTp;
                return 0;
            })(),
            insuranceOD: (() => {
                // Priority 1: Flat key from new marketplace snapshots
                const flatOd = pricingSnapshot.insurance_od ?? commercials.insurance_od;
                if (flatOd !== undefined && flatOd !== null && Number(flatOd) > 0) return Number(flatOd);
                // Priority 2: SOT object format {base, gst, total}
                const objOd = pricingSnapshot.insurance?.od;
                if (objOd && typeof objOd === 'object' && 'total' in objOd) return Number(objOd.total || 0);
                if (typeof objOd === 'number' && objOd > 0) return objOd;
                // Priority 3: commercials insurance object
                const commObjOd = commercials.insurance?.od;
                if (commObjOd && typeof commObjOd === 'object' && 'total' in commObjOd)
                    return Number(commObjOd.total || 0);
                if (typeof commObjOd === 'number' && commObjOd > 0) return commObjOd;
                // Priority 4: Back-calculate from total (legacy quotes)
                const insTotal = Number(pricingSnapshot.insurance_total || pricingSnapshot.insurance_base || 0);
                if (insTotal > 0) {
                    // Get TP we already resolved (re-resolve without this closure)
                    const resolvedTp = Number(
                        pricingSnapshot.insurance_tp ??
                            commercials.insurance_tp ??
                            (pricingSnapshot.insurance?.tp && typeof pricingSnapshot.insurance.tp === 'object'
                                ? pricingSnapshot.insurance.tp.total
                                : pricingSnapshot.insurance?.tp) ??
                            0
                    );
                    // OD = base premium - TP (insurance_base is pre-GST total of OD+TP+GST)
                    const baseBeforeGst = Math.round(insTotal / 1.18);
                    return Math.max(0, baseBeforeGst - resolvedTp);
                }
                return 0;
            })(),
            insuranceAddons: (pricingSnapshot.insurance_addon_items || pricingSnapshot.insurance_addons || []).map(
                (a: any) => {
                    const breakdown = a.breakdown || a.breakup || null;
                    const baseFromBreakdown = Array.isArray(breakdown)
                        ? breakdown.reduce((sum: number, b: any) => sum + Number(b.amount || 0), 0)
                        : null;
                    const basePrice = a.basePrice ?? baseFromBreakdown ?? a.price ?? a.amount ?? 0;
                    const discountPrice = a.discountPrice ?? null;
                    const finalAmount = discountPrice ?? a.price ?? a.amount ?? 0;
                    return {
                        id: a.id || a,
                        name: a.name || a,
                        amount: finalAmount,
                        basePrice,
                        discountPrice,
                        selected: a.selected !== undefined ? a.selected : true,
                        breakdown,
                    };
                }
            ),
            insuranceGST: (() => {
                // Priority 1: Flat key from new marketplace snapshots
                const flatGst = pricingSnapshot.insurance_gst;
                if (flatGst !== undefined && flatGst !== null && Number(flatGst) > 0) return Number(flatGst);
                // Priority 2: SOT object — sum OD GST + TP GST
                const odObj = pricingSnapshot.insurance?.od;
                const tpObj = pricingSnapshot.insurance?.tp;
                if (odObj && typeof odObj === 'object' && 'gst' in odObj) {
                    return Number(odObj.gst || 0) + Number(tpObj?.gst || 0);
                }
                // Priority 3: Single gst field on insurance
                const gstField = pricingSnapshot.insurance?.gst;
                if (typeof gstField === 'number' && gstField > 0) return gstField;
                // Priority 4: Back-calculate from total
                const insTotal = Number(pricingSnapshot.insurance_total || 0);
                if (insTotal > 0) return insTotal - Math.round(insTotal / 1.18);
                return 0;
            })(),
            insuranceTotal: pricingSnapshot.insurance_total || 0,
            insuranceProvider: (await (async () => {
                const existing =
                    pricingSnapshot.insurance_provider ||
                    pricingSnapshot.insurance?.insurer ||
                    commercials.insurance_provider;
                if (existing) return existing;

                // Fallback to cat_ins_rules lookup
                const { data: rule } = await adminClient
                    .from('cat_ins_rules')
                    .select('insurer_name')
                    .eq('state_code', commercials.location?.state_code || 'ALL')
                    .limit(1)
                    .maybeSingle();
                return rule?.insurer_name || null;
            })()) as string | null,
            accessories: (pricingSnapshot.accessory_items || pricingSnapshot.accessories || []).map((a: any) => ({
                id: a.id || a,
                name: a.name || 'Accessory',
                price: a.discountPrice || a.price || 0,
                basePrice: a.price || 0,
                discountPrice: a.discountPrice || null,
                qty: Number(a.qty || 1),
                selected: true,
            })),
            accessoriesTotal: pricingSnapshot.accessories_total || 0,
            services: (pricingSnapshot.service_items || pricingSnapshot.services || []).map((s: any) => ({
                id: s.id || s,
                name: s.name || 'Service',
                price: s.discountPrice || s.price || 0,
                basePrice: s.price || 0,
                discountPrice: s.discountPrice || null,
                qty: Number(s.qty || 1),
                selected: true,
            })),
            servicesTotal: pricingSnapshot.services_total || 0,
            insuranceGstRate: Number(pricingSnapshot.insurance_gst_rate || 18),
            colorDelta: Number(pricingSnapshot.color_delta || 0),
            offersDelta: Number(pricingSnapshot.offers_delta || 0),
            dealerDiscount: (() => {
                const explicit = parseInt(q.discount_amount) || commercials.dealer_discount || 0;
                const hasColorDelta = Number(pricingSnapshot.color_delta || 0) !== 0;
                if (explicit) return explicit;
                if (hasColorDelta) return 0;
                return pricingSnapshot?.dealer?.offer || 0;
            })(),
            managerDiscount: parseInt(q.manager_discount) || 0,
            managerDiscountNote: q.manager_discount_note || null,
            onRoadTotal: pricingSnapshot.grand_total || parseInt(q.on_road_price) || commercials.grand_total || 0,
            finalTotal:
                (pricingSnapshot.grand_total || parseInt(q.on_road_price) || commercials.grand_total || 0) +
                (parseInt(q.manager_discount) || 0),
            rtoOptions: pricingSnapshot.rto_options || [],
            insuranceRequiredItems: pricingSnapshot.insurance_required_items || [],
            offersItems: pricingSnapshot.offers_items || [],
            warrantyItems: pricingSnapshot.warranty_items || [],
            referralApplied: pricingSnapshot.referral_applied || false,
            referralBonus: pricingSnapshot.referral_bonus || 0,
        },
        finance: null,
        timeline,
    };

    const resolveBankName = async (bankId?: string | null, currentName?: string | null) => {
        const normalized = (currentName || '').trim();
        if (!bankId) return normalized || null;
        if (normalized && normalized.toLowerCase() !== 'new financier') return normalized;
        const { data: bank } = await adminClient.from('id_tenants').select('name').eq('id', bankId).maybeSingle();
        return bank?.name || normalized || null;
    };

    const normalizeCharges = (charges: any[] = []) => {
        return (charges || []).map(c => ({
            label: c.label || c.name || 'Charge',
            amount: Number(c.amount ?? c.value ?? 0),
            impact: c.impact || undefined,
            type: c.type || undefined,
            calculationBasis: c.calculationBasis || undefined,
            taxStatus: c.taxStatus || undefined,
            taxRate: c.taxRate || undefined,
        }));
    };

    const splitCharges = (charges: any[] = []) => {
        const normalized = normalizeCharges(charges);
        const upfront = normalized.filter(c => !c.impact || c.impact === 'UPFRONT');
        const funded = normalized.filter(c => c.impact === 'FUNDED');
        const upfrontTotal = upfront.reduce((sum, c) => sum + (c.amount || 0), 0);
        const fundedTotal = funded.reduce((sum, c) => sum + (c.amount || 0), 0);
        return { upfront, funded, upfrontTotal, fundedTotal };
    };

    if (q.active_finance_id) {
        const { data: attempt } = await supabase
            .from('crm_quote_finance_attempts')
            .select('*')
            .eq('id', q.active_finance_id)
            .eq('is_deleted', false)
            .maybeSingle();
        if (attempt) {
            const { upfront, funded, upfrontTotal, fundedTotal } = splitCharges(
                (attempt.charges_breakup as any[]) || []
            );
            const resolvedBankName = await resolveBankName(attempt.bank_id, attempt.bank_name);
            result.finance = {
                id: attempt.id,
                status: attempt.status as any,
                bankId: attempt.bank_id,
                bankName: resolvedBankName,
                schemeId: attempt.scheme_id,
                schemeCode: attempt.scheme_code,
                selection_logic: (commercials.finance as any)?.selection_logic || null,
                scheme_interest_rate: (commercials.finance as any)?.scheme_interest_rate || null,
                scheme_interest_type: (commercials.finance as any)?.scheme_interest_type || null,
                ltv: attempt.ltv,
                roi: attempt.roi,
                tenureMonths: attempt.tenure_months,
                downPayment: attempt.down_payment,
                loanAmount: attempt.loan_amount,
                loanAddons: attempt.loan_addons ?? fundedTotal,
                processingFee: upfrontTotal || attempt.processing_fee,
                approvedProcessingFee: upfrontTotal || attempt.processing_fee,
                chargesBreakup: upfront,
                approvedChargesBreakup: upfront,
                emi: attempt.emi,
                approvedEmi: attempt.emi,
                approvedAmount: attempt.loan_amount,
                approvedDownPayment: attempt.down_payment,
                approvedAddOns: attempt.loan_addons ?? fundedTotal,
                approvedScheme: attempt.scheme_code,
                approvedTenure: attempt.tenure_months,
                approvedIrr: attempt.roi,
                approvedMarginMoney: 0,
                approvedAddonsBreakup: funded,
                approvedGrossLoan: (attempt.loan_amount || 0) + (attempt.loan_addons ?? fundedTotal ?? 0),
            };
        }
    } else if (commercials.finance || pricingSnapshot.finance_bank_name || pricingSnapshot.finance_bank_id) {
        const financeCharges =
            (commercials.finance?.charges_breakup as any[]) || (pricingSnapshot.finance_charges_breakup as any[]) || [];
        const { upfront, funded, upfrontTotal, fundedTotal } = splitCharges(financeCharges);
        const resolvedBankName = await resolveBankName(
            commercials.finance?.bank_id || pricingSnapshot.finance_bank_id || null,
            commercials.finance?.bank_name || pricingSnapshot.finance_bank_name || null
        );
        result.finance = {
            bankId: commercials.finance?.bank_id || pricingSnapshot.finance_bank_id || null,
            bankName: resolvedBankName,
            schemeId: commercials.finance?.scheme_id || pricingSnapshot.finance_scheme_id || null,
            schemeCode:
                commercials.finance?.scheme_code ||
                commercials.finance?.scheme_name ||
                pricingSnapshot.finance_scheme_name ||
                pricingSnapshot.finance_scheme_code ||
                pricingSnapshot.finance_scheme_id ||
                null,
            selection_logic: commercials.finance?.selection_logic || null,
            scheme_interest_rate: commercials.finance?.scheme_interest_rate || null,
            scheme_interest_type:
                commercials.finance?.scheme_interest_type || pricingSnapshot.finance_interest_type || null,
            ltv: commercials.finance?.ltv ?? pricingSnapshot.finance_ltv ?? null,
            roi: commercials.finance?.roi ?? pricingSnapshot.finance_roi ?? null,
            tenureMonths:
                commercials.finance?.tenure_months ??
                pricingSnapshot.finance_tenure ??
                pricingSnapshot.emi_tenure ??
                null,
            downPayment: commercials.finance?.down_payment ?? pricingSnapshot.down_payment ?? null,
            approvedDownPayment: commercials.finance?.down_payment ?? pricingSnapshot.down_payment ?? 0,
            loanAmount: commercials.finance?.loan_amount ?? pricingSnapshot.finance_loan_amount ?? null,
            approvedAmount: commercials.finance?.loan_amount ?? pricingSnapshot.finance_loan_amount ?? 0,
            loanAddons:
                commercials.finance?.loan_addons ??
                pricingSnapshot.finance_funded_addons ??
                pricingSnapshot.finance_loan_addons ??
                null,
            approvedAddOns:
                commercials.finance?.loan_addons ??
                pricingSnapshot.finance_funded_addons ??
                pricingSnapshot.finance_loan_addons ??
                fundedTotal ??
                0,
            processingFee:
                commercials.finance?.processing_fee ??
                pricingSnapshot.finance_upfront_charges ??
                pricingSnapshot.finance_processing_fees ??
                null,
            approvedProcessingFee:
                commercials.finance?.processing_fee ??
                pricingSnapshot.finance_upfront_charges ??
                pricingSnapshot.finance_processing_fees ??
                upfrontTotal ??
                0,
            chargesBreakup: upfront,
            approvedChargesBreakup: upfront,
            emi: commercials.finance?.emi ?? pricingSnapshot.finance_emi ?? null,
            approvedEmi: commercials.finance?.emi ?? pricingSnapshot.finance_emi ?? 0,
            approvedScheme:
                commercials.finance?.scheme_code ||
                commercials.finance?.scheme_name ||
                pricingSnapshot.finance_scheme_name ||
                pricingSnapshot.finance_scheme_code ||
                pricingSnapshot.finance_scheme_id ||
                '',
            approvedTenure:
                commercials.finance?.tenure_months ?? pricingSnapshot.finance_tenure ?? pricingSnapshot.emi_tenure ?? 0,
            approvedIrr: commercials.finance?.roi ?? pricingSnapshot.finance_roi ?? 0,
            approvedMarginMoney: commercials.finance?.margin_money ?? 0,
            approvedAddonsBreakup: funded,
            approvedGrossLoan:
                (commercials.finance?.loan_amount ?? pricingSnapshot.finance_loan_amount ?? 0) +
                (commercials.finance?.loan_addons ??
                    pricingSnapshot.finance_funded_addons ??
                    pricingSnapshot.finance_loan_addons ??
                    fundedTotal ??
                    0),
        };
    }

    const { data: financeAttemptsRaw } = await supabase
        .from('crm_quote_finance_attempts')
        .select(
            'id, status, bank_id, bank_name, scheme_id, scheme_code, roi, tenure_months, down_payment, loan_amount, loan_addons, processing_fee, charges_breakup, emi, created_at'
        )
        .eq('quote_id', quoteId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (financeAttemptsRaw && financeAttemptsRaw.length > 0) {
        const resolvedAttempts = await Promise.all(
            financeAttemptsRaw.map(async attempt => ({
                id: attempt.id,
                status: attempt.status as any,
                bankId: attempt.bank_id || null,
                bankName: await resolveBankName(attempt.bank_id, attempt.bank_name),
                schemeId: attempt.scheme_id || null,
                schemeCode: attempt.scheme_code || null,
                roi: attempt.roi ?? null,
                tenureMonths: attempt.tenure_months ?? null,
                downPayment: attempt.down_payment ?? null,
                loanAmount: attempt.loan_amount ?? null,
                loanAddons: attempt.loan_addons ?? null,
                processingFee: attempt.processing_fee ?? null,
                chargesBreakup: (attempt.charges_breakup as any[]) || [],
                emi: attempt.emi ?? null,
                createdAt: attempt.created_at || null,
            }))
        );
        result.financeAttempts = resolvedAttempts;
    } else {
        result.financeAttempts = [];
    }

    return { success: true, data: result };
}

export async function updateQuoteManagerDiscount(
    quoteId: string,
    managerDiscount: number,
    note?: string
): Promise<{ success: boolean; error?: string }> {
    const user = await getAuthUser();
    const supabase = await createClient();

    // Get current quote
    const { data: quote, error: fetchError } = await supabase
        .from('crm_quotes')
        .select('on_road_price, commercials')
        .eq('is_deleted', false)
        .eq('id', quoteId)
        .single();

    if (fetchError || !quote) {
        return { success: false, error: 'Quote not found' };
    }

    // Update with manager discount
    const { error } = await supabase
        .from('crm_quotes')
        .update({
            manager_discount: managerDiscount,
            manager_discount_note: note || null,
            reviewed_by: user?.id || null,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', quoteId);

    if (error) {
        console.error('updateQuoteManagerDiscount Error:', error);
        return { success: false, error: error.message };
    }

    // Log timeline event
    await logQuoteEvent(quoteId, `Manager Discount Updated: ₹${managerDiscount}`, 'Manager', 'team', { source: 'CRM' });

    revalidatePath('/app/[slug]/quotes');
    return { success: true };
}

export async function markQuoteInReview(quoteId: string): Promise<{ success: boolean; error?: string }> {
    const user = await getAuthUser();
    const supabase = await createClient();

    const { data: quote, error: fetchError } = await supabase
        .from('crm_quotes')
        .select('status, quote_owner_id')
        .eq('is_deleted', false)
        .eq('id', quoteId)
        .single();

    if (fetchError || !quote) {
        return { success: false, error: 'Quote not found' };
    }

    if (quote.status !== 'DRAFT') {
        return { success: true };
    }

    const updatePayload: Record<string, any> = {
        status: 'IN_REVIEW',
        reviewed_by: user?.id || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    if (!quote.quote_owner_id && user?.id) {
        updatePayload.quote_owner_id = user.id;
    }

    const { error } = await supabase.from('crm_quotes').update(updatePayload).eq('id', quoteId);

    if (error) {
        console.error('markQuoteInReview Error:', error);
        return { success: false, error: error.message };
    }

    await logQuoteEvent(quoteId, 'Quote Opened - In Review', 'Team Member', 'team', { source: 'CRM' });

    revalidatePath('/app/[slug]/quotes');
    return { success: true };
}

export async function setQuoteFinanceMode(
    quoteId: string,
    mode: 'CASH' | 'LOAN'
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('crm_quotes')
        .update({ finance_mode: mode, updated_at: new Date().toISOString() })
        .eq('id', quoteId);
    if (error) {
        console.error('setQuoteFinanceMode Error:', error);
        return { success: false, error: error.message };
    }
    await logQuoteEvent(quoteId, `Finance Mode Set: ${mode}`, 'Team Member', 'team', { source: 'CRM' });
    revalidatePath('/app/[slug]/quotes');
    return { success: true };
}

export async function getQuoteFinanceAttempts(quoteId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_quote_finance_attempts')
        .select('*')
        .eq('quote_id', quoteId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
    if (error) {
        console.error('getQuoteFinanceAttempts Error:', error);
        return [];
    }
    return data || [];
}

export async function createQuoteFinanceAttempt(
    quoteId: string,
    payload: {
        bankId?: string | null;
        bankName?: string | null;
        schemeId?: string | null;
        schemeCode?: string | null;
        ltv?: number | null;
        roi?: number | null;
        tenureMonths?: number | null;
        downPayment?: number | null;
        loanAmount?: number | null;
        loanAddons?: number | null;
        processingFee?: number | null;
        chargesBreakup?: any[];
        emi?: number | null;
    }
) {
    const user = await getAuthUser();
    const supabase = await createClient();
    const { data: quote } = await supabase
        .from('crm_quotes')
        .select('tenant_id')
        .eq('is_deleted', false)
        .eq('id', quoteId)
        .single();

    const { data, error } = await supabase
        .from('crm_quote_finance_attempts')
        .insert({
            quote_id: quoteId,
            tenant_id: quote?.tenant_id || null,
            bank_id: payload.bankId || null,
            bank_name: payload.bankName || null,
            scheme_id: payload.schemeId || null,
            scheme_code: payload.schemeCode || null,
            ltv: payload.ltv || null,
            roi: payload.roi || null,
            tenure_months: payload.tenureMonths || null,
            down_payment: payload.downPayment || null,
            loan_amount: payload.loanAmount || null,
            loan_addons: payload.loanAddons || null,
            processing_fee: payload.processingFee || null,
            charges_breakup: payload.chargesBreakup || [],
            emi: payload.emi || null,
            status: 'IN_PROCESS',
            created_by: user?.id || null,
        })
        .select('id')
        .single();

    if (error) {
        console.error('createQuoteFinanceAttempt Error:', error);
        return { success: false, error: error.message };
    }

    await supabase
        .from('crm_quotes')
        .update({ active_finance_id: data.id, finance_mode: 'LOAN', updated_at: new Date().toISOString() })
        .eq('id', quoteId);

    await logQuoteEvent(quoteId, 'New Finance Attempt Created', 'Team Member', 'team', { source: 'CRM' });
    revalidatePath('/app/[slug]/quotes');
    return { success: true, id: data.id };
}

export async function updateQuoteFinanceAttempt(
    attemptId: string,
    payload: {
        bankId?: string | null;
        bankName?: string | null;
        schemeId?: string | null;
        schemeCode?: string | null;
        roi?: number | null;
        tenureMonths?: number | null;
        downPayment?: number | null;
        loanAmount?: number | null;
        loanAddons?: number | null;
        processingFee?: number | null;
        chargesBreakup?: any[];
        emi?: number | null;
    }
) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('crm_quote_finance_attempts')
        .update({
            bank_id: payload.bankId ?? null,
            bank_name: payload.bankName ?? null,
            scheme_id: payload.schemeId ?? null,
            scheme_code: payload.schemeCode ?? null,
            roi: payload.roi ?? null,
            tenure_months: payload.tenureMonths ?? null,
            down_payment: payload.downPayment ?? null,
            loan_amount: payload.loanAmount ?? null,
            loan_addons: payload.loanAddons ?? null,
            processing_fee: payload.processingFee ?? null,
            charges_breakup: payload.chargesBreakup || [],
            emi: payload.emi ?? null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', attemptId)
        .eq('is_deleted', false);

    if (error) {
        console.error('updateQuoteFinanceAttempt Error:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function setQuoteActiveFinanceAttempt(quoteId: string, attemptId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('crm_quotes')
        .update({ active_finance_id: attemptId, finance_mode: 'LOAN', updated_at: new Date().toISOString() })
        .eq('id', quoteId)
        .eq('is_deleted', false);

    if (error) {
        console.error('setQuoteActiveFinanceAttempt Error:', error);
        return { success: false, error: error.message };
    }

    await logQuoteEvent(quoteId, 'Primary Finance Attempt Updated', 'Team Member', 'team', { source: 'CRM' });
    return { success: true };
}

export async function updateQuoteFinanceStatus(
    attemptId: string,
    status: 'IN_PROCESS' | 'UNDERWRITING' | 'DOC_PENDING' | 'APPROVED' | 'REJECTED'
) {
    const supabase = await createClient();
    const { data: attempt, error: fetchError } = await supabase
        .from('crm_quote_finance_attempts')
        .select('id, quote_id')
        .eq('id', attemptId)
        .eq('is_deleted', false)
        .single();
    if (fetchError || !attempt) {
        return { success: false, error: 'Attempt not found' };
    }

    const { error } = await supabase
        .from('crm_quote_finance_attempts')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', attemptId);
    if (error) {
        console.error('updateQuoteFinanceStatus Error:', error);
        return { success: false, error: error.message };
    }

    await logQuoteEvent(attempt.quote_id as string, `Finance Status: ${status}`, 'Team Member', 'team', {
        source: 'CRM',
    });

    if (status === 'DOC_PENDING') {
        await createTask({
            tenantId: null,
            linkedType: 'QUOTE',
            linkedId: attempt.quote_id as string,
            title: 'Collect Finance Documents',
            description: 'Document collection required for finance processing.',
        });
    }

    revalidatePath('/app/[slug]/quotes');
    return { success: true };
}

export async function createTask(input: {
    tenantId: string | null;
    linkedType: 'LEAD' | 'QUOTE' | 'BOOKING';
    linkedId: string;
    title: string;
    description?: string | null;
    assigneeIds?: string[];
    primaryAssigneeId?: string | null;
}) {
    const user = await getAuthUser();
    const supabase = await createClient();
    const primaryAssigneeId = input.primaryAssigneeId || user?.id || null;
    const assigneeIds =
        input.assigneeIds && input.assigneeIds.length > 0
            ? input.assigneeIds
            : primaryAssigneeId
              ? [primaryAssigneeId]
              : [];

    const { error } = await supabase.from('crm_tasks').insert({
        tenant_id: input.tenantId || null,
        linked_type: input.linkedType,
        linked_id: input.linkedId,
        title: input.title,
        description: input.description || null,
        status: 'OPEN',
        primary_assignee_id: primaryAssigneeId,
        assignee_ids: assigneeIds,
        created_by: user?.id || null,
    });

    if (error) {
        console.error('createTask Error:', error);
        return { success: false, error: error.message };
    }
    return { success: true };
}

export async function getTasksForEntity(linkedType: 'LEAD' | 'QUOTE' | 'BOOKING', linkedId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_tasks')
        .select('*')
        .eq('linked_type', linkedType)
        .eq('linked_id', linkedId)
        .order('created_at', { ascending: false });
    if (error) {
        console.error('getTasksForEntity Error:', error);
        return [];
    }
    return data || [];
}

export async function updateTaskStatus(taskId: string, status: 'OPEN' | 'IN_PROGRESS' | 'DONE') {
    const supabase = await createClient();
    const { error } = await supabase
        .from('crm_tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', taskId);
    if (error) {
        console.error('updateTaskStatus Error:', error);
        return { success: false, error: error.message };
    }
    return { success: true };
}

// Auto-segregate stale leads: >15 days since last activity, unless future tasks exist
export async function autoJunkInactiveLeads(days = 15) {
    const supabase = await adminClient;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { data: leads, error: leadsError } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('is_deleted', false)
        .neq('status', 'JUNK');

    if (leadsError) {
        console.error('autoJunkInactiveLeads lead fetch error:', leadsError);
        return { success: false, error: leadsError.message };
    }

    const { data: tasks, error: tasksError } = await supabase
        .from('crm_tasks')
        .select('*')
        .eq('linked_type', 'LEAD')
        .in(
            'linked_id',
            (leads || []).map((l: any) => l.id)
        );

    if (tasksError) {
        console.error('autoJunkInactiveLeads task fetch error:', tasksError);
        return { success: false, error: tasksError.message };
    }

    const tasksByLead = new Map<string, any[]>();
    (tasks || []).forEach((t: any) => {
        const arr = tasksByLead.get(t.linked_id) || [];
        arr.push(t);
        tasksByLead.set(t.linked_id, arr);
    });

    const hasFutureTask = (task: any) => {
        const candidates = [task.due_at, task.due_date, task.scheduled_at, task.scheduled_for, task.reminder_at].filter(
            Boolean
        );
        if (candidates.length === 0) return false;
        return candidates.some((d: any) => new Date(d).getTime() > Date.now());
    };

    const staleLeadIds: string[] = [];
    (leads || []).forEach((lead: any) => {
        const lastActivity = lead.updated_at || lead.last_activity_at || lead.last_activity || lead.created_at;
        if (!lastActivity) return;
        if (new Date(lastActivity) >= cutoff) return;

        const leadTasks = tasksByLead.get(lead.id) || [];
        if (leadTasks.some(t => t.status !== 'DONE' && hasFutureTask(t))) return;

        staleLeadIds.push(lead.id);
    });

    if (staleLeadIds.length > 0) {
        const { error: updateError } = await supabase
            .from('crm_leads')
            .update({
                status: 'JUNK',
                updated_at: new Date().toISOString(),
                auto_segregated: true,
                segregation_reason: `No activity for ${days} days`,
            })
            .in('id', staleLeadIds);

        if (updateError) {
            console.error('autoJunkInactiveLeads update error:', updateError);
            return { success: false, error: updateError.message };
        }
    }

    return { success: true, junked: staleLeadIds.length };
}

export async function getTeamMembersForTenant(tenantId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('id_team')
        .select('id, user_id, role, display_id')
        .eq('tenant_id', tenantId)
        .eq('status', 'ACTIVE');

    if (error) {
        console.error('getTeamMembersForTenant Error:', error);
        return [];
    }

    const userIds = (data || []).map(m => m.user_id).filter(Boolean) as string[];
    let memberNameMap = new Map<string, string>();
    if (userIds.length > 0) {
        const { data: members } = await supabase.from('id_members').select('id, full_name').in('id', userIds);
        (members || []).forEach(m => {
            if (m.id && m.full_name) memberNameMap.set(m.id, m.full_name);
        });
    }

    // Deduplicate by user_id
    const seen = new Set<string>();
    return (data || [])
        .filter(m => {
            if (!m.user_id || seen.has(m.user_id)) return false;
            seen.add(m.user_id);
            return true;
        })
        .map(m => ({
            id: m.user_id,
            teamId: m.id,
            role: m.role,
            displayId: m.display_id,
            name: memberNameMap.get((m.user_id || '') as string) || m.display_id || m.role || 'Team Member',
        }));
}

export async function updateQuotePricing(
    quoteId: string,
    updates: {
        rtoType?: 'STATE' | 'BH' | 'COMPANY';
        rtoTotal?: number;
        rtoBreakdown?: { label: string; amount: number }[];
        rtoOptions?: any[];
        insuranceAddons?: any[]; // Allow full objects
        insuranceTotal?: number;
        insuranceOD?: number;
        insuranceTP?: number;
        insuranceGST?: number;
        accessories?: any[]; // Allow full objects
        accessoriesTotal?: number;
        services?: any[]; // Allow full objects
        servicesTotal?: number;
        grandTotal?: number; // On-road total
        managerDiscount?: number;
        managerDiscountNote?: string;
    }
): Promise<{ success: boolean; error?: string; newQuoteId?: string }> {
    const user = await getAuthUser();
    const supabase = await createClient();

    // Get current quote
    const { data: quote, error: fetchError } = await supabase
        .from('crm_quotes')
        .select(
            'id, status, commercials, lead_id, tenant_id, member_id, lead_referrer_id, quote_owner_id, variant_id, color_id, vehicle_sku_id, finance_mode, active_finance_id, discount_amount, manager_discount, manager_discount_note, created_by'
        )
        .eq('is_deleted', false)
        .eq('id', quoteId)
        .single();

    if (fetchError || !quote) {
        return { success: false, error: 'Quote not found' };
    }

    const commercials = (quote.commercials as any) || {};
    const pricingSnapshot = commercials.pricing_snapshot || {};

    // Update pricing snapshot with new selections
    const updatedPricingSnapshot = {
        ...pricingSnapshot,
        rto_type: updates.rtoType || pricingSnapshot.rto_type,
        rto_total: updates.rtoTotal !== undefined ? updates.rtoTotal : pricingSnapshot.rto_total,
        rto_breakdown: updates.rtoBreakdown !== undefined ? updates.rtoBreakdown : pricingSnapshot.rto_breakdown,
        rto_options: updates.rtoOptions !== undefined ? updates.rtoOptions : pricingSnapshot.rto_options,
        insurance_addons: updates.insuranceAddons || pricingSnapshot.insurance_addons,
        insurance_addon_items: updates.insuranceAddons || pricingSnapshot.insurance_addon_items, // Dual save for compatibility
        insurance_total:
            updates.insuranceTotal !== undefined ? updates.insuranceTotal : pricingSnapshot.insurance_total,
        insurance_od: updates.insuranceOD !== undefined ? updates.insuranceOD : pricingSnapshot.insurance_od,
        insurance_tp: updates.insuranceTP !== undefined ? updates.insuranceTP : pricingSnapshot.insurance_tp,
        insurance_gst: updates.insuranceGST !== undefined ? updates.insuranceGST : pricingSnapshot.insurance_gst,
        accessories: updates.accessories || pricingSnapshot.accessories,
        accessory_items: updates.accessories || pricingSnapshot.accessory_items,
        accessories_total:
            updates.accessoriesTotal !== undefined ? updates.accessoriesTotal : pricingSnapshot.accessories_total,
        services: updates.services || pricingSnapshot.services,
        service_items: updates.services || pricingSnapshot.service_items,
        services_total: updates.servicesTotal !== undefined ? updates.servicesTotal : pricingSnapshot.services_total,
        grand_total: updates.grandTotal !== undefined ? updates.grandTotal : pricingSnapshot.grand_total,
    };

    const updatedCommercials = {
        ...commercials,
        grand_total: updates.grandTotal !== undefined ? updates.grandTotal : commercials.grand_total, // Update root commercial total too
        pricing_snapshot: updatedPricingSnapshot,
    };

    const normalizeItems = (items: any[] | null | undefined) => {
        if (!Array.isArray(items)) return [];
        return items
            .map(item => {
                if (item === null || item === undefined) return '';
                if (typeof item === 'string' || typeof item === 'number') return String(item);
                const id = item.id || item.sku_id || item.code || item.name || '';
                const amount = item.amount ?? item.price ?? item.discountPrice ?? '';
                return `${id}:${amount}`;
            })
            .filter(Boolean)
            .sort();
    };
    const normalizeRtoBreakdown = (items: any[] | null | undefined) => {
        if (!Array.isArray(items)) return [];
        return items
            .map(item => {
                if (!item) return '';
                const label = item.label || item.name || '';
                const amount = item.amount ?? item.price ?? 0;
                return `${label}:${Number(amount)}`;
            })
            .filter(Boolean)
            .sort();
    };
    const isEqualArray = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);
    const toNumber = (value: any) => Number(value ?? 0);

    const originalInsuranceItems = normalizeItems(
        pricingSnapshot.insurance_addon_items || pricingSnapshot.insurance_addons || []
    );
    const updatedInsuranceItems = normalizeItems(
        updatedPricingSnapshot.insurance_addon_items || updatedPricingSnapshot.insurance_addons || []
    );
    const originalAccessories = normalizeItems(pricingSnapshot.accessory_items || pricingSnapshot.accessories || []);
    const updatedAccessories = normalizeItems(
        updatedPricingSnapshot.accessory_items || updatedPricingSnapshot.accessories || []
    );
    const originalServices = normalizeItems(pricingSnapshot.service_items || pricingSnapshot.services || []);
    const updatedServices = normalizeItems(
        updatedPricingSnapshot.service_items || updatedPricingSnapshot.services || []
    );
    const originalRtoBreakdown = normalizeRtoBreakdown(pricingSnapshot.rto_breakdown || []);
    const updatedRtoBreakdown = normalizeRtoBreakdown(updatedPricingSnapshot.rto_breakdown || []);

    const rtoChanged = (pricingSnapshot.rto_type || '') !== (updatedPricingSnapshot.rto_type || '');
    const rtoTotalChanged = toNumber(pricingSnapshot.rto_total) !== toNumber(updatedPricingSnapshot.rto_total);
    const rtoBreakdownChanged = !isEqualArray(originalRtoBreakdown, updatedRtoBreakdown);
    const insuranceItemsChanged = !isEqualArray(originalInsuranceItems, updatedInsuranceItems);
    const accessoriesChanged = !isEqualArray(originalAccessories, updatedAccessories);
    const servicesChanged = !isEqualArray(originalServices, updatedServices);
    const insuranceTotalChanged =
        toNumber(pricingSnapshot.insurance_total) !== toNumber(updatedPricingSnapshot.insurance_total);
    const accessoriesTotalChanged =
        toNumber(pricingSnapshot.accessories_total) !== toNumber(updatedPricingSnapshot.accessories_total);
    const servicesTotalChanged =
        toNumber(pricingSnapshot.services_total) !== toNumber(updatedPricingSnapshot.services_total);
    const grandTotalChanged = toNumber(pricingSnapshot.grand_total) !== toNumber(updatedPricingSnapshot.grand_total);

    const nonManagerChanged =
        rtoChanged ||
        rtoTotalChanged ||
        rtoBreakdownChanged ||
        insuranceItemsChanged ||
        accessoriesChanged ||
        servicesChanged ||
        insuranceTotalChanged ||
        accessoriesTotalChanged ||
        servicesTotalChanged ||
        grandTotalChanged;
    const managerChanged = updates.managerDiscount !== undefined || updates.managerDiscountNote !== undefined;

    if (!nonManagerChanged) {
        if (!managerChanged) {
            return { success: true };
        }
        const updatePayload: any = {
            updated_at: new Date().toISOString(),
        };
        updatePayload.manager_discount = updates.managerDiscount ?? quote.manager_discount ?? 0;
        updatePayload.manager_discount_note =
            updates.managerDiscountNote !== undefined
                ? updates.managerDiscountNote
                : quote.manager_discount_note || null;
        updatePayload.reviewed_by = user?.id || null;
        updatePayload.reviewed_at = new Date().toISOString();
        // Sync on_road_price so sidebar cards stay in sync
        if (updates.grandTotal !== undefined) {
            updatePayload.on_road_price = Math.round(updates.grandTotal);
        }

        const { error } = await supabase.from('crm_quotes').update(updatePayload).eq('id', quoteId);
        if (error) {
            console.error('updateQuotePricing Error:', error);
            return { success: false, error: error.message };
        }

        await logQuoteEvent(
            quoteId,
            `Manager Discount Adjusted to ₹${updatePayload.manager_discount}`,
            'Manager',
            'team',
            {
                source: 'CRM',
            }
        );

        revalidatePath('/app/[slug]/quotes');
        return { success: true };
    }

    const onRoadPrice = Math.round(toNumber(updatedPricingSnapshot.grand_total ?? updatedCommercials.grand_total));
    const exShowroom = Math.round(
        toNumber(updatedPricingSnapshot.ex_showroom ?? updatedCommercials.ex_showroom ?? updatedCommercials.base_price)
    );
    const rtoAmount = Math.round(
        toNumber(updatedPricingSnapshot.rto_total ?? updatedPricingSnapshot.rto?.total ?? updatedCommercials.rto)
    );
    const insuranceAmount = Math.round(
        toNumber(
            updatedPricingSnapshot.insurance_total ??
                updatedPricingSnapshot.insurance?.total ??
                updatedCommercials.insurance
        )
    );
    const accessoriesAmount = Math.round(toNumber(updatedPricingSnapshot.accessories_total));

    const vehicleSkuId = quote.vehicle_sku_id || quote.color_id || quote.variant_id || null;

    const { data: newQuote, error: insertError } = await supabase
        .from('crm_quotes')
        .insert({
            tenant_id: quote.tenant_id,
            lead_id: quote.lead_id,
            member_id: quote.member_id,
            lead_referrer_id: quote.lead_referrer_id,
            quote_owner_id: quote.quote_owner_id || user?.id || null,
            variant_id: quote.variant_id,
            color_id: quote.color_id,
            vehicle_sku_id: vehicleSkuId,
            commercials: updatedCommercials,
            on_road_price: onRoadPrice,
            ex_showroom_price: exShowroom,
            insurance_amount: insuranceAmount,
            rto_amount: rtoAmount,
            accessories_amount: accessoriesAmount,
            discount_amount: quote.discount_amount ?? null,
            manager_discount: updates.managerDiscount ?? quote.manager_discount ?? null,
            manager_discount_note:
                updates.managerDiscountNote !== undefined
                    ? updates.managerDiscountNote
                    : quote.manager_discount_note || null,
            finance_mode: quote.finance_mode || null,
            active_finance_id: null,
            status: 'DRAFT',
            created_by: user?.id || quote.created_by || null,
        })
        .select()
        .single();

    if (insertError || !newQuote) {
        console.error('updateQuotePricing Insert Error:', insertError);
        return { success: false, error: insertError?.message || 'Failed to create new quote' };
    }

    // Supersede at VARIANT level — all open quotes for same variant get superseded
    // regardless of colour. Only quotes converted to booking are exempt.
    const skuId = newQuote.vehicle_sku_id || quote.vehicle_sku_id || quote.color_id || quote.variant_id;
    if (skuId) {
        const supersedeUpdate: any = {
            status: 'SUPERSEDED',
            updated_at: new Date().toISOString(),
        };

        let supersedeQuery = supabase.from('crm_quotes').update(supersedeUpdate).neq('id', newQuote.id);
        supersedeQuery = supersedeQuery.eq('vehicle_sku_id', skuId);
        supersedeQuery = supersedeQuery.not('status', 'in', '("CONVERTED","BOOKING")');
        if (quote.lead_id) {
            supersedeQuery = supersedeQuery.eq('lead_id', quote.lead_id);
        } else if (quote.member_id) {
            supersedeQuery = supersedeQuery.eq('member_id', quote.member_id);
        } else {
            supersedeQuery = supersedeQuery.eq('id', quoteId);
        }
        await supersedeQuery;
    }

    await logQuoteEvent(newQuote.id, 'Quote Revised (New Quote)', 'Team Member', 'team', {
        source: 'CRM',
        voided_quote_id: quoteId,
    });

    revalidatePath('/app/[slug]/quotes');
    return { success: true, newQuoteId: newQuote.id };
}

export async function sendQuoteToCustomer(quoteId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('crm_quotes')
        .update({
            status: 'SENT',
            updated_at: new Date().toISOString(),
        })
        .eq('id', quoteId);

    if (error) {
        console.error('sendQuoteToCustomer Error:', error);
        return { success: false, error: error.message };
    }

    // Log timeline event
    await logQuoteEvent(quoteId, 'Quote Sent to Customer', 'Team Member', 'team', { source: 'CRM' });

    revalidatePath('/app/[slug]/quotes');
    return { success: true };
}

export async function getQuoteMarketplaceUrl(
    quoteId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
    const supabase = await createClient();

    // Fetch quote with vehicle details
    const { data: quoteData, error } = await supabase
        .from('crm_quotes')
        .select('*')
        .eq('is_deleted', false)
        .eq('id', quoteId)
        .single();

    if (error || !quoteData) {
        return { success: false, error: 'Quote not found' };
    }

    // Cast to any since studio_id is a new column
    const quote = quoteData as any;

    // Get variant details for URL
    const skuId = quote.color_id || quote.variant_id;
    if (!skuId) {
        return { success: false, error: 'No SKU ID found' };
    }

    const { data: sku, error: skuError } = await supabase
        .from('cat_items')
        .select('slug, parent_id')
        .eq('id', skuId)
        .single();

    if (skuError || !sku || !sku.parent_id) {
        return { success: false, error: 'SKU not found' };
    }

    // Get variant
    const { data: variant, error: variantError } = await supabase
        .from('cat_items')
        .select('slug, parent_id')
        .eq('id', sku.parent_id)
        .single();

    if (variantError || !variant || !variant.parent_id) {
        return { success: false, error: 'Variant not found' };
    }

    // Get model
    const { data: model, error: modelError } = await supabase
        .from('cat_items')
        .select('slug, brand_id')
        .eq('id', variant.parent_id)
        .single();

    if (modelError || !model || !model.brand_id) {
        return { success: false, error: 'Model not found' };
    }

    // Get brand
    const { data: brand, error: brandError } = await supabase
        .from('cat_brands')
        .select('slug')
        .eq('id', model.brand_id)
        .single();

    if (brandError || !brand) {
        return { success: false, error: 'Brand not found' };
    }

    const commercials = quote.commercials || {};
    const colorSlug = commercials.color_name?.toLowerCase().replace(/\s+/g, '-') || '';

    // Build URL with studioId (required)
    const params = new URLSearchParams({
        quoteId,
        color: colorSlug,
        studioId: quote.studio_id || '',
    });

    const url = `/store/${brand.slug}/${model.slug}/${variant.slug}?${params.toString()}`;
    return { success: true, url };
}

export async function getQuoteByDisplayId(
    displayId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
    // We use adminClient to allow public dossier access via valid displayId without login barriers
    const supabase = adminClient;

    const { data: quote, error } = await supabase
        .from('crm_quotes')
        .select(
            `
            *,
            customer:id_members!crm_quotes_member_id_fkey (*),
            lead:crm_leads!quotes_lead_id_fkey (*)
        `
        )
        .eq('display_id', displayId)
        .eq('is_deleted', false)
        .maybeSingle();

    if (error) {
        console.error('getQuoteByDisplayId Error:', error);
        return { success: false, error: JSON.stringify(error) };
    }

    if (!quote) {
        return { success: false, error: 'Quote not found' };
    }

    // Map to a unified format for the dossier
    const commercials: any = (quote.commercials as any) || {};
    const pricingSnapshot: any = commercials.pricing_snapshot || {};

    // Fetch high-fidelity pricing (for RTO breakdown parity with CRM)
    let highFidelityPricing = null;
    const colorId = quote.color_id || quote.variant_id || pricingSnapshot?.color_id;
    const stateCode =
        pricingSnapshot?.location?.state_code ||
        pricingSnapshot?.location?.stateCode ||
        commercials?.location?.state_code ||
        commercials?.location?.stateCode;
    const district = pricingSnapshot?.location?.district || commercials?.location?.district || null;

    if (colorId && stateCode) {
        const { data: priceData } = await supabase
            .from('cat_price_state')
            .select('gst_rate, rto, hsn_code, insurance')
            .eq('vehicle_color_id', colorId)
            .eq('state_code', stateCode)
            .or(`district.eq.${district},district.eq.ALL`)
            .order('district', { ascending: false })
            .limit(1)
            .maybeSingle();
        highFidelityPricing = priceData;
    }

    // Resolve finance if active
    let activeFinance = null;
    if (quote.active_finance_id) {
        const { data: finance } = await supabase
            .from('crm_quote_finance_attempts')
            .select('*')
            .eq('id', quote.active_finance_id)
            .eq('is_deleted', false)
            .maybeSingle();
        activeFinance = finance;
    }

    // Resolve SKU image and specs if not in commercials
    let resolvedImageUrl = commercials.image || commercials.imageUrl || commercials.pricing_snapshot?.imageUrl || null;
    let vehicleSpecs = commercials.specs || commercials.pricing_snapshot?.specs || {};

    const resolveHex = (val: any) => {
        if (!val) return null;
        // If it's a simple string
        if (typeof val === 'string') return val.startsWith('#') ? val : `#${val}`;
        // If it's a Sitecore/AUMS object { value: "#..." }
        if (val?.value && typeof val.value === 'string') return val.value.startsWith('#') ? val.value : `#${val.value}`;
        return null;
    };

    let itemHex =
        resolveHex(commercials.color_hex) ||
        resolveHex(commercials.colorHex) ||
        resolveHex(commercials.hex_code) ||
        resolveHex(commercials.hex_primary) ||
        resolveHex(pricingSnapshot?.color_hex) ||
        resolveHex(pricingSnapshot?.colorHex) ||
        resolveHex(pricingSnapshot?.hex_code) ||
        resolveHex(pricingSnapshot?.hex_primary) ||
        resolveHex(vehicleSpecs?.color_hex) ||
        resolveHex(vehicleSpecs?.colorHex) ||
        resolveHex(vehicleSpecs?.hex_primary) ||
        resolveHex(vehicleSpecs?.hex_code) ||
        resolveHex(vehicleSpecs?.ColorHexCode) ||
        resolveHex(vehicleSpecs?.fields?.ColorHexCode) ||
        null;

    const normalizeSuitabilityTag = (value: string) =>
        value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();

    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const COLOR_WORDS = new Set([
        'black',
        'white',
        'silver',
        'grey',
        'gray',
        'red',
        'blue',
        'green',
        'yellow',
        'orange',
        'gold',
        'brown',
        'maroon',
        'navy',
        'beige',
        'cream',
        'copper',
        'bronze',
        'teal',
        'purple',
        'pink',
    ]);

    const COLOR_MODIFIERS = new Set([
        'matte',
        'gloss',
        'glossy',
        'metallic',
        'pearl',
        'satin',
        'chrome',
        'carbon',
        'gunmetal',
        'midnight',
    ]);

    const extractColorFromName = (name: string) => {
        const trimmed = (name || '').trim();
        if (!trimmed) return { baseName: name, color: '' };

        const parts = trimmed.split(/\s+/);
        if (parts.length === 0) return { baseName: name, color: '' };

        const last = parts[parts.length - 1];
        const lastNorm = normalizeSuitabilityTag(last);
        const second = parts.length > 1 ? parts[parts.length - 2] : '';
        const secondNorm = normalizeSuitabilityTag(second);

        if (COLOR_WORDS.has(lastNorm)) {
            if (second && COLOR_MODIFIERS.has(secondNorm)) {
                return {
                    baseName: parts.slice(0, -2).join(' ').trim(),
                    color: `${second} ${last}`,
                };
            }
            return {
                baseName: parts.slice(0, -1).join(' ').trim(),
                color: last,
            };
        }

        return { baseName: name, color: '' };
    };

    const stripColorFromName = (name: string, color: string) => {
        if (!name || !color) return name;
        const colorNorm = normalizeSuitabilityTag(color);
        if (!colorNorm) return name;

        const suffixPattern = new RegExp(`\\s*${escapeRegExp(color)}\\s*$`, 'i');
        if (suffixPattern.test(name)) {
            return name.replace(suffixPattern, '').trim();
        }

        return name;
    };

    const matchesAccessoryCompatibility = (
        suitableFor: string | null | undefined,
        brand: string,
        model: string,
        variant: string
    ) => {
        const suitabilityRaw = Array.isArray(suitableFor) ? suitableFor.join(',') : suitableFor;
        if (!suitabilityRaw || suitabilityRaw.trim() === '') return false;

        const tags = suitabilityRaw
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);
        if (tags.length === 0) return false;

        const brandNorm = normalizeSuitabilityTag(brand || '');
        const modelNorm = normalizeSuitabilityTag(model || '');
        const variantNorm = normalizeSuitabilityTag(variant || '');

        const buildKey = (...parts: string[]) => parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

        const variantHasModel = Boolean(modelNorm && variantNorm.includes(modelNorm));
        const variantHasBrand = Boolean(brandNorm && variantNorm.includes(brandNorm));

        const brandModel = buildKey(brandNorm, modelNorm);
        const brandVariant = buildKey(variantHasBrand ? '' : brandNorm, variantNorm);
        const modelVariant = buildKey(variantHasModel ? '' : modelNorm, variantNorm);
        const brandModelVariant = buildKey(
            variantHasBrand ? '' : brandNorm,
            variantHasModel ? '' : modelNorm,
            variantNorm
        );

        const matchKeys = new Set(
            [brandNorm, modelNorm, variantNorm, brandModel, brandVariant, modelVariant, brandModelVariant].filter(
                Boolean
            )
        );

        return tags.some(tag => {
            const normalized = normalizeSuitabilityTag(tag);
            if (!normalized) return false;

            if (normalized.includes('universal') || normalized === 'all') {
                return true;
            }

            if (normalized.includes('all models')) {
                return Boolean(brandNorm && normalized.includes(brandNorm));
            }

            if (normalized.includes('all variants')) {
                return Boolean(
                    brandNorm && modelNorm && normalized.includes(brandNorm) && normalized.includes(modelNorm)
                );
            }

            if (brandNorm && normalized.startsWith(brandNorm) && normalized.includes('all models')) return true;
            if (matchKeys.has(normalized)) return true;

            return false;
        });
    };

    const resolveProductIdentity = async (skuId?: string | null) => {
        const resolved = { brand: '', model: '', variant: '' };
        if (!skuId) return resolved;

        const { data: sku } = await supabase
            .from('cat_items')
            .select('id, name, parent_id, type')
            .eq('id', skuId)
            .maybeSingle();

        if (!sku) return resolved;

        let variantItem: any = null;
        if (sku.type === 'VARIANT') {
            variantItem = sku;
        } else if (sku.parent_id) {
            const { data: variant } = await supabase
                .from('cat_items')
                .select('id, name, parent_id')
                .eq('id', sku.parent_id)
                .maybeSingle();
            variantItem = variant || null;
        }

        if (variantItem?.name) resolved.variant = variantItem.name;

        if (variantItem?.parent_id) {
            const { data: model } = await supabase
                .from('cat_items')
                .select('id, name, brand_id')
                .eq('id', variantItem.parent_id)
                .maybeSingle();
            if (model?.name) resolved.model = model.name;
            if (model?.brand_id) {
                const { data: brand } = await supabase
                    .from('cat_brands')
                    .select('name')
                    .eq('id', model.brand_id)
                    .maybeSingle();
                if (brand?.name) resolved.brand = brand.name;
            }
        }

        return resolved;
    };

    const parseRtoData = (val: any): { total: number; breakdown: any[] } | null => {
        if (val === null || val === undefined) return null;
        if (typeof val === 'number') return { total: val, breakdown: [] };
        if (typeof val === 'object' && 'total' in val) {
            const b = [
                { label: 'Road Tax', amount: val.roadTax },
                { label: 'Reg. Charges', amount: val.registrationCharges },
                { label: 'Smart Card', amount: val.smartCardCharges },
                { label: 'Hypothecation', amount: val.hypothecationCharges },
                { label: 'Postal Charges', amount: val.postalCharges },
                { label: 'Cess', amount: val.cessAmount },
            ].filter(x => x.amount > 0);
            return { total: val.total, breakdown: b };
        }
        return null;
    };

    const itemId = (quote.color_id || quote.variant_id) as string | null;
    if ((!resolvedImageUrl || Object.keys(vehicleSpecs).length === 0 || !itemHex) && itemId) {
        const { data: item } = await supabase
            .from('cat_items')
            .select('image_url, specs, type, parent_id')
            .eq('id', itemId)
            .maybeSingle();

        if (item) {
            if (!resolvedImageUrl && item.image_url) {
                resolvedImageUrl = item.image_url;
            }
            if (item.specs) {
                // Merge DB specs as source of truth (SKU/Variant/Model)
                let modelSpecs: any = {};
                let variantSpecs: any = {};
                let skuSpecs: any = item.specs || {};

                if (item.type === 'SKU' && item.parent_id) {
                    const { data: variantItem } = await supabase
                        .from('cat_items')
                        .select('specs, parent_id')
                        .eq('id', item.parent_id)
                        .maybeSingle();
                    if (variantItem?.specs) variantSpecs = variantItem.specs;

                    if (variantItem?.parent_id) {
                        const { data: modelItem } = await supabase
                            .from('cat_items')
                            .select('specs')
                            .eq('id', variantItem.parent_id)
                            .maybeSingle();
                        if (modelItem?.specs) modelSpecs = modelItem.specs;
                    }
                } else if (item.type === 'VARIANT' && item.parent_id) {
                    const { data: modelItem } = await supabase
                        .from('cat_items')
                        .select('specs')
                        .eq('id', item.parent_id)
                        .maybeSingle();
                    if (modelItem?.specs) modelSpecs = modelItem.specs;
                }

                vehicleSpecs = { ...vehicleSpecs, ...modelSpecs, ...variantSpecs, ...skuSpecs };

                if (!itemHex) {
                    const s = vehicleSpecs as any;
                    // Check all variants of hex fields in TVS/AUMS data
                    itemHex =
                        resolveHex(s?.color_hex) ||
                        resolveHex(s?.colorHex) ||
                        resolveHex(s?.hex_primary) ||
                        resolveHex(s?.hex_code) ||
                        resolveHex(s?.hexCode) ||
                        resolveHex(s?.ColorHexCode) ||
                        resolveHex(s?.fields?.ColorHexCode);
                }
            }
        }
    }

    const hexCode = itemHex || null;

    const selectedSkuId = quote.color_id || quote.variant_id || null;
    const identity = await resolveProductIdentity(selectedSkuId);
    const productMake = commercials.brand || identity.brand || '';
    const productModel = commercials.model || identity.model || '';
    const productVariant = commercials.variant || identity.variant || '';

    const dealerId =
        pricingSnapshot?.dealer?.id || pricingSnapshot?.dealer_id || commercials?.dealer_id || quote.studio_id || null;

    // PDP Options: Accessories + Services
    const { data: accessoriesData } = await supabase
        .from('cat_items')
        .select('*, brand:cat_brands(name), category')
        .eq('category', 'ACCESSORY')
        .eq('type', 'SKU')
        .eq('status', 'ACTIVE');

    const { data: servicesData } = await supabase.from('cat_services').select('*').eq('status', 'ACTIVE');

    const accessoryIds = (accessoriesData || []).map((a: any) => a.id);
    const accessoryRules: Map<string, { offer: number; inclusion: string; isActive: boolean }> = new Map();
    const bundleIdsForDealer: Set<string> = new Set();

    if (accessoryIds.length > 0 && dealerId && stateCode) {
        const { data: rules } = await supabase
            .from('cat_price_dealer')
            .select('vehicle_color_id, offer_amount, inclusion_type, is_active')
            .in('vehicle_color_id', accessoryIds)
            .eq('tenant_id', dealerId)
            .eq('state_code', stateCode);

        rules?.forEach((r: any) => {
            accessoryRules.set(r.vehicle_color_id, {
                offer: Number(r.offer_amount),
                inclusion: r.inclusion_type,
                isActive: r.is_active,
            });
        });

        const { data: bundleRules } = await supabase
            .from('cat_price_dealer')
            .select('vehicle_color_id')
            .eq('tenant_id', dealerId)
            .eq('state_code', stateCode)
            .eq('inclusion_type', 'BUNDLE');

        bundleRules?.forEach((r: any) => {
            if (r.vehicle_color_id) bundleIdsForDealer.add(r.vehicle_color_id);
        });
    }

    const pdpAccessories = (accessoriesData || [])
        .filter((a: any) =>
            matchesAccessoryCompatibility(a.specs?.suitable_for, productMake, productModel, productVariant)
        )
        .map((a: any) => {
            const rule = accessoryRules.get(a.id);
            const offer = rule ? rule.offer : 0;
            const basePrice = Number(a.price_base);
            const discountPrice = Math.max(0, basePrice + offer);
            const inclusionType =
                rule?.inclusion ||
                (bundleIdsForDealer.has(a.id) ? 'BUNDLE' : undefined) ||
                a.inclusion_type ||
                'OPTIONAL';
            const isMandatory = inclusionType === 'MANDATORY';

            let colorLabel = a.specs?.color || a.specs?.colour || a.specs?.finish || a.specs?.shade || '';
            let nameBase = a.name;

            if (!colorLabel) {
                const inferred = extractColorFromName(a.name);
                colorLabel = inferred.color;
                nameBase = inferred.baseName || a.name;
            } else {
                nameBase = stripColorFromName(a.name, colorLabel);
            }

            const accessoryName = nameBase || a.name;
            const displayName = [a.brand?.name, a.name].filter(Boolean).join(' ');
            const descriptionLabel = [accessoryName, colorLabel].filter(Boolean).join(' ');

            return {
                id: a.id,
                name: a.name,
                displayName,
                description: descriptionLabel,
                suitableFor: a.specs?.suitable_for || '',
                price: basePrice,
                discountPrice,
                maxQty: 1,
                isMandatory,
                inclusionType,
                category: a.category || 'OTHERS',
                brand: a.brand?.name || null,
                subCategory: null,
            };
        });

    const pdpServices = (servicesData || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: Number(s.price),
        discountPrice: Number(s.discount_price),
        maxQty: s.max_qty,
        isMandatory: s.is_mandatory,
        durationMonths: s.duration_months,
    }));

    // PDP Options: Registration + Insurance
    const rtoJson: any = (highFidelityPricing as any)?.rto;
    const rtoByType = {
        STATE: parseRtoData(rtoJson?.STATE),
        BH: parseRtoData(rtoJson?.BH),
        COMPANY: parseRtoData(rtoJson?.COMPANY),
    };

    let pdpRtoOptions: any[] = [];
    if (rtoJson) {
        pdpRtoOptions = [
            {
                id: 'STATE',
                name: 'State Registration',
                price: rtoByType.STATE?.total ?? 0,
                description: 'Standard RTO charges for your state.',
                breakdown: rtoByType.STATE?.breakdown || [],
            },
            {
                id: 'BH',
                name: 'Bharat Series (BH)',
                price: rtoByType.BH?.total ?? 0,
                description: 'For frequent interstate travel.',
                breakdown: rtoByType.BH?.breakdown || [],
            },
            {
                id: 'COMPANY',
                name: 'Company Registration',
                price: rtoByType.COMPANY?.total ?? 0,
                description: 'Corporate entity registration.',
                breakdown: rtoByType.COMPANY?.breakdown || [],
            },
        ];
    } else if (Array.isArray(pricingSnapshot?.rto_options)) {
        pdpRtoOptions = pricingSnapshot.rto_options;
    }

    const insuranceJson: any = (highFidelityPricing as any)?.insurance;
    const insuranceGstRate = Number(
        insuranceJson?.gst_rate ?? pricingSnapshot?.insurance_gst_rate ?? pricingSnapshot?.insurance_gst ?? 18
    );
    const odData = insuranceJson?.od;
    const tpData = insuranceJson?.tp;
    const odWithGst = typeof odData === 'object' ? Number(odData?.total || 0) : Number(odData || 0);
    const tpWithGst = typeof tpData === 'object' ? Number(tpData?.total || 0) : Number(tpData || 0);

    let pdpInsuranceRequiredItems: any[] = [];
    if (insuranceJson || pricingSnapshot?.insurance_required_items) {
        pdpInsuranceRequiredItems = pricingSnapshot?.insurance_required_items || [
            {
                id: 'insurance-tp',
                name: 'Liability Only (5 Years Cover)',
                price: tpWithGst,
                description: 'Mandatory',
                isMandatory: true,
                breakdown: [
                    { label: 'Base Premium', amount: Math.max(0, tpWithGst) },
                    { label: `GST (${insuranceGstRate}%)`, amount: 0 },
                ],
            },
            {
                id: 'insurance-od',
                name: 'Comprehensive (1 Year Cover)',
                price: odWithGst,
                description: 'Mandatory',
                isMandatory: true,
                breakdown: [
                    { label: 'Base Premium', amount: Math.max(0, odWithGst) },
                    { label: `GST (${insuranceGstRate}%)`, amount: 0 },
                ],
            },
        ];
    }

    const normalizeAddonKey = (val: any) =>
        String(val || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();

    const jsonAddons = (insuranceJson?.addons || []) as {
        id: string;
        label: string;
        price: number;
        gst: number;
        total: number;
        default: boolean;
    }[];

    let ruleAddons: any[] = [];
    if (stateCode) {
        const { data: insuranceRuleData } = await supabase
            .from('cat_ins_rules')
            .select('*')
            .eq('status', 'ACTIVE')
            .eq('vehicle_type', 'TWO_WHEELER')
            .or(`state_code.eq.${stateCode},state_code.eq.ALL`)
            .order('state_code', { ascending: false })
            .limit(1);

        const insuranceRule: any = insuranceRuleData?.[0];
        const baseExShowroom = quote.ex_showroom_price || commercials.base_price || 0;
        ruleAddons =
            insuranceRule?.addons?.map((a: any) => {
                const inclusionType = a.inclusion_type || a.inclusionType || 'OPTIONAL';
                const baseAmount =
                    a.type === 'FIXED'
                        ? a.amount || 0
                        : Math.round(
                              ((a.percentage || 0) * (a.basis === 'EX_SHOWROOM' ? baseExShowroom : 100000)) / 100
                          );
                const priceWithGst = Math.round(baseAmount + (baseAmount * insuranceGstRate) / 100);
                const gstAmount = Math.max(0, priceWithGst - baseAmount);

                return {
                    id: a.id,
                    name: a.label,
                    price: priceWithGst,
                    description: a.type === 'PERCENTAGE' ? `${a.percentage}% of ${a.basis}` : 'Fixed Coverage',
                    discountPrice: null,
                    isMandatory: inclusionType === 'MANDATORY',
                    inclusionType,
                    breakdown: [
                        { label: 'Base Premium', amount: baseAmount },
                        { label: `GST (${insuranceGstRate}%)`, amount: gstAmount },
                    ],
                };
            }) || [];
    }

    const ruleAddonIndex = new Map<string, any>();
    ruleAddons.forEach(a => {
        ruleAddonIndex.set(normalizeAddonKey(a.id), a);
        ruleAddonIndex.set(normalizeAddonKey(a.name), a);
    });

    const mappedJsonAddons = jsonAddons.map(addon => {
        const addonTotal = Number(addon.total ?? (addon.price || 0) + (addon.gst || 0));
        const ruleMatch =
            ruleAddonIndex.get(normalizeAddonKey(addon.id)) || ruleAddonIndex.get(normalizeAddonKey(addon.label));
        const resolvedPrice = addonTotal > 0 ? addonTotal : Number(ruleMatch?.price || addonTotal || 0);
        const resolvedBreakdown =
            addonTotal > 0
                ? [
                      { label: 'Base Premium', amount: addon.price },
                      { label: `GST (${insuranceGstRate}%)`, amount: addon.gst },
                  ]
                : ruleMatch?.breakdown || [
                      { label: 'Base Premium', amount: addon.price },
                      { label: `GST (${insuranceGstRate}%)`, amount: addon.gst },
                  ];
        const resolvedInclusionType = addon.default ? 'BUNDLE' : ruleMatch?.inclusionType || 'OPTIONAL';

        return {
            id: addon.id,
            name: addon.label,
            price: resolvedPrice,
            description: 'Coverage',
            discountPrice: null,
            isMandatory: addon.default === true || ruleMatch?.isMandatory,
            inclusionType: resolvedInclusionType,
            breakdown: resolvedBreakdown,
        };
    });

    const jsonAddonIds = new Set(mappedJsonAddons.map(a => a.id));
    const missingRuleAddons = ruleAddons.filter(a => !jsonAddonIds.has(a.id));
    const pdpInsuranceAddons = [...mappedJsonAddons, ...missingRuleAddons];

    return {
        success: true,
        data: {
            ...quote,
            customer: {
                name: quote.customer?.full_name || quote.lead?.customer_name || 'Valued Customer',
                phone: quote.customer?.primary_phone || quote.lead?.customer_phone || '',
                email: quote.customer?.primary_email || (quote.lead as any)?.customer_email || null,
            },
            vehicle: {
                brand: commercials.brand || '',
                model: commercials.model || '',
                variant: commercials.variant || '',
                color: commercials.color_name || commercials.color || '',
                hexCode,
                imageUrl: resolvedImageUrl,
                skuId: quote.color_id || quote.variant_id,
                specs: vehicleSpecs,
                keySpecs: [
                    {
                        label: 'Displacement',
                        value:
                            vehicleSpecs.engine_cc || vehicleSpecs.displacement
                                ? `${vehicleSpecs.engine_cc || vehicleSpecs.displacement} cc`
                                : '',
                    },
                    { label: 'Kerb Weight', value: vehicleSpecs.kerb_weight ? `${vehicleSpecs.kerb_weight} kg` : '' },
                    { label: 'Saddle Height', value: vehicleSpecs.seat_height ? `${vehicleSpecs.seat_height} mm` : '' },
                    { label: 'Transmission', value: vehicleSpecs.gearbox || '' },
                    { label: 'Front Brake', value: vehicleSpecs.front_brake_type || vehicleSpecs.front_brake || '' },
                    { label: 'Rear Brake', value: vehicleSpecs.rear_brake_type || vehicleSpecs.rear_brake || '' },
                    { label: 'Tyre Type', value: vehicleSpecs.tyre_type || '' },
                ].filter(s => s.value),
                // Priority fields for quick access in PDF/Dossier
                engine_cc: vehicleSpecs.engine_cc || vehicleSpecs.displacement || '',
                kerb_weight: vehicleSpecs.kerb_weight || '',
                seat_height: vehicleSpecs.seat_height || '',
                gearbox: vehicleSpecs.gearbox || '',
                mileage: vehicleSpecs.mileage || vehicleSpecs.mileage_arai || '',
                top_speed: vehicleSpecs.top_speed || '',
                fuel_capacity: vehicleSpecs.fuel_capacity || '',
                front_brake: vehicleSpecs.front_brake_type || vehicleSpecs.front_brake || '',
                rear_brake: vehicleSpecs.rear_brake_type || vehicleSpecs.rear_brake || '',
                tyre_type: vehicleSpecs.tyre_type || '',
            },
            alternativeBikes: await getAlternativeRecommendations(quote.variant_id || quote.color_id || ''),
            pdpOptions: {
                accessories: pdpAccessories,
                services: pdpServices,
                insuranceAddons: pdpInsuranceAddons,
                insuranceRequiredItems: pdpInsuranceRequiredItems,
                rtoOptions: pdpRtoOptions,
                warrantyItems: vehicleSpecs?.warranty || pricingSnapshot?.warranty_items || [],
            },
            pricing: {
                exShowroom: quote.ex_showroom_price || commercials.base_price || 0,
                exShowroomGstRate: highFidelityPricing?.gst_rate
                    ? Math.round(
                          Number(highFidelityPricing.gst_rate) * (Number(highFidelityPricing.gst_rate) < 1 ? 100 : 1)
                      )
                    : pricingSnapshot?.gst_rate
                      ? Math.round(Number(pricingSnapshot.gst_rate) * (Number(pricingSnapshot.gst_rate) < 1 ? 100 : 1))
                      : 28,
                exShowroomBasePrice: pricingSnapshot?.ex_showroom_base_price,
                exShowroomGstAmount: pricingSnapshot?.ex_showroom_gst_amount,
                rtoTotal: quote.rto_amount || pricingSnapshot?.rto_total || 0,
                rtoBreakdown: (() => {
                    const type = pricingSnapshot?.rto_type || commercials?.rto_type || 'STATE';
                    const highFidelityRto = (highFidelityPricing as any)?.rto?.[type];
                    if (highFidelityRto && typeof highFidelityRto === 'object') {
                        return Object.entries(highFidelityRto)
                            .filter(([key]) => key !== 'total' && key !== 'id')
                            .map(([key, val]) => ({
                                label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                                amount: Number(val) || 0,
                            }));
                    }
                    return pricingSnapshot?.rto_breakdown || [];
                })(),
                rtoType: pricingSnapshot?.rto_type || null,
                rtoOptions: pricingSnapshot?.rto_options || [],
                insuranceBase: pricingSnapshot?.insurance_base || 0,
                insuranceTP: pricingSnapshot?.insurance_tp || 0,
                insuranceOD: pricingSnapshot?.insurance_od || 0,
                insuranceGst: pricingSnapshot?.insurance_gst || 0,
                insuranceTotal: quote.insurance_amount || pricingSnapshot?.insurance_total || 0,
                insuranceAddons: pricingSnapshot?.insurance_addon_items || pricingSnapshot?.insurance_addons || [],
                insuranceRequired: pricingSnapshot?.insurance_required_items || [],
                accessoriesTotal: quote.accessories_amount || pricingSnapshot?.accessories_total || 0,
                accessories: pricingSnapshot?.accessory_items || pricingSnapshot?.accessories || [],
                servicesTotal: pricingSnapshot?.services_total || 0,
                services: pricingSnapshot?.service_items || pricingSnapshot?.services || [],
                dealerDiscount: pricingSnapshot?.dealer_discount || 0,
                colorDelta: pricingSnapshot?.color_delta || 0,
                offersDelta: pricingSnapshot?.offers_delta || 0,
                totalSavings: pricingSnapshot?.total_savings || 0,
                totalSurge: pricingSnapshot?.total_surge || 0,
                managerDiscount: quote.manager_discount || 0,
                referralApplied: pricingSnapshot?.referral_applied || false,
                referralBonus: pricingSnapshot?.referral_bonus || 0,
                onRoadTotal: pricingSnapshot?.grand_total || quote.on_road_price || commercials.grand_total || 0,
                finalTotal: quote.on_road_price || commercials.grand_total || 0,
                warrantyItems: pricingSnapshot?.warranty_items || [],
                allAccessories: pricingSnapshot?.accessories || [],
                allServices: pricingSnapshot?.services || [],
                allInsuranceAddons: pricingSnapshot?.insurance_addons || [],
                allOffers: pricingSnapshot?.offers || [],
                dealer: pricingSnapshot?.dealer || null,
            },
            finance: activeFinance
                ? {
                      mode: quote.finance_mode,
                      bankName: activeFinance.bank_name || commercials.finance?.bank_name || null,
                      status: activeFinance.status || commercials.finance?.status || null,
                      schemeCode: activeFinance.scheme_code || commercials.finance?.scheme_code || null,
                      schemeName: commercials.finance?.scheme_name || null,
                      selectionLogic: commercials.finance?.selection_logic || null,
                      source: commercials.finance?.source || null,
                      bank: activeFinance.bank_name || commercials.finance?.bank_name || null,
                      scheme:
                          activeFinance.scheme_code ||
                          commercials.finance?.scheme_name ||
                          commercials.finance?.scheme_code ||
                          null,
                      ltv: activeFinance.ltv ?? commercials.finance?.ltv ?? null,
                      roi: activeFinance.roi ?? commercials.finance?.roi ?? null,
                      tenure: activeFinance.tenure_months ?? commercials.finance?.tenure_months ?? null,
                      tenureMonths: activeFinance.tenure_months ?? commercials.finance?.tenure_months ?? null,
                      emi: activeFinance.emi ?? commercials.finance?.emi ?? null,
                      downPayment: activeFinance.down_payment ?? commercials.finance?.down_payment ?? null,
                      loanAmount: activeFinance.loan_amount ?? commercials.finance?.loan_amount ?? null,
                      loanAddons: activeFinance.loan_addons ?? commercials.finance?.loan_addons ?? null,
                      processingFee: activeFinance.processing_fee ?? commercials.finance?.processing_fee ?? null,
                      upfrontCharges:
                          commercials.finance?.processing_fee ??
                          commercials.pricing_snapshot?.finance_upfront_charges ??
                          0,
                      fundedAddons:
                          commercials.finance?.loan_addons ?? commercials.pricing_snapshot?.finance_funded_addons ?? 0,
                      chargesBreakup:
                          commercials.finance?.charges_breakup ||
                          commercials.pricing_snapshot?.finance_charges_breakup ||
                          [],
                  }
                : null,
        },
    };
}

export async function logQuoteEvent(
    quoteId: string,
    event: string,
    actor?: string | null,
    actorType: 'customer' | 'team' = 'team',
    details?: { source?: string; reason?: string; [key: string]: any }
) {
    const supabase = await createClient();

    // Fetch quote first to get tenant_id and commercials
    const { data: quote, error: fetchError } = await supabase
        .from('crm_quotes')
        .select('tenant_id, commercials')
        .eq('is_deleted', false)
        .eq('id', quoteId)
        .single();

    if (fetchError || !quote) {
        console.error('logQuoteEvent Error: Quote not found', fetchError);
        return { success: false, error: 'Quote not found' };
    }

    const tenantId = quote.tenant_id;
    const commercials = (quote.commercials as any) || {};
    const timeline = commercials.timeline || [];

    // Auto-resolve actor metadata
    let resolvedActor = actor;
    let actorOrg: string | null = null;
    let actorDesignation: string | null = null;

    if (actorType === 'team') {
        try {
            const user = await getAuthUser();
            if (user) {
                // If it's a generic actor name, resolve to real name
                if (!resolvedActor || resolvedActor === 'Team Member' || resolvedActor === 'System') {
                    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || null;
                    resolvedActor = fullName || user.email?.split('@')[0] || 'System';
                }

                if (tenantId) {
                    // Fetch organization name and user role in parallel if possible, or sequentially
                    const [tenantRes, teamRes] = await Promise.all([
                        adminClient.from('id_tenants').select('name').eq('id', tenantId).single(),
                        adminClient
                            .from('id_team')
                            .select('role')
                            .eq('tenant_id', tenantId)
                            .eq('user_id', user.id)
                            .single(),
                    ]);

                    if (tenantRes.data) actorOrg = tenantRes.data.name;
                    if (teamRes.data) actorDesignation = teamRes.data.role;
                }
            }
        } catch (e) {
            console.error('Error resolving actor metadata:', e);
        }
    }

    // Add new event
    const newEvent = {
        event,
        timestamp: new Date().toISOString(),
        actor: resolvedActor || 'System',
        actorType,
        actorOrg,
        actorDesignation,
        source: details?.source || null,
        reason: details?.reason || null,
    };

    const updatedCommercials = {
        ...commercials,
        timeline: [...timeline, newEvent],
    };

    const { error: updateError } = await supabase
        .from('crm_quotes')
        .update({ commercials: updatedCommercials })
        .eq('id', quoteId);

    if (updateError) {
        console.error('logQuoteEvent Error: Update failed', updateError);
        return { success: false, error: updateError.message };
    }

    return { success: true };
}

export async function getBookingsForLead(leadId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_bookings')
        .select('*')
        .eq('is_deleted', false)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
    if (error) {
        console.error('getBookingsForLead Error:', error);
        return [];
    }
    return data || [];
}

export async function getReceiptsForEntity(leadId?: string | null, memberId?: string | null) {
    const supabase = await createClient();
    let query = supabase
        .from('crm_receipts' as any)
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (leadId && memberId) {
        query = query.or(`lead_id.eq.${leadId},member_id.eq.${memberId}`);
    } else if (leadId) {
        query = query.eq('lead_id', leadId);
    } else if (memberId) {
        query = query.eq('member_id', memberId);
    } else {
        return [];
    }

    const { data, error } = await query;
    if (error) {
        console.error('getReceiptsForEntity Error:', error);
        return [];
    }
    return data || [];
}

// Alias: QuoteEditorWrapper uses getPaymentsForEntity
export const getPaymentsForEntity = getReceiptsForEntity;

export async function getReceiptsForTenant(tenantId?: string) {
    const supabase = await createClient();
    let query = supabase
        .from('crm_receipts' as any)
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (tenantId) {
        query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) {
        console.error('getReceiptsForTenant Error:', error);
        return [];
    }
    return data || [];
}

export async function getReceiptById(receiptId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_receipts' as any)
        .select('*')
        .eq('id', receiptId)
        .eq('is_deleted', false)
        .single();

    if (error) {
        console.error('getReceiptById Error:', error);
        return { success: false, error: error.message };
    }

    return { success: true, receipt: data };
}

export async function updateReceipt(receiptId: string, updates: Record<string, any>) {
    const { data: existing, error: fetchError } = await adminClient
        .from('crm_receipts' as any)
        .select('is_reconciled')
        .eq('id', receiptId)
        .maybeSingle();

    if (fetchError) {
        return { success: false, error: fetchError.message };
    }

    if ((existing as any)?.is_reconciled) {
        return { success: false, error: 'Receipt already reconciled' };
    }

    const { error } = await adminClient
        .from('crm_receipts' as any)
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', receiptId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function reconcileReceipt(receiptId: string) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;

    const { error } = await adminClient
        .from('crm_receipts' as any)
        .update({
            is_reconciled: true,
            reconciled_at: new Date().toISOString(),
            reconciled_by: userId,
            updated_at: new Date().toISOString(),
        })
        .eq('id', receiptId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function getBankSchemes(bankId: string) {
    try {
        const { data, error } = await adminClient
            .from('id_tenants')
            .select('config')
            .eq('id', bankId)
            .eq('type', 'BANK')
            .single();

        if (error || !data?.config) {
            console.error('[getBankSchemes] Error:', error?.message || 'No config found');
            return [];
        }

        const schemes = (data.config as any)?.schemes || [];
        return schemes.filter((s: any) => s.isActive !== false);
    } catch (error: any) {
        console.error('[getBankSchemes] Fatal:', error.message);
        return [];
    }
}

/**
 * Fetches dealership info for the PDF quote.
 */
export async function getDealershipInfo(tenantId: string) {
    const { data, error } = await adminClient
        .from('id_tenants')
        .select('name, location, phone, email, studio_id, display_id')
        .eq('id', tenantId)
        .maybeSingle();

    if (error || !data) {
        console.error('Error fetching dealership info:', error);
        return null;
    }

    return {
        name: data.name,
        address: data.location,
        phone: data.phone,
        email: data.email,
        studioId: data.studio_id || data.display_id || 'BMB-STD-01',
    };
}

/**
 * Lists all dealership-type tenants for assignment.
 */
export async function getDealerships() {
    const { data, error } = await adminClient
        .from('id_tenants')
        .select('id, name, location, studio_id, display_id')
        .eq('type', 'DEALER')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching dealerships:', error);
        return [];
    }

    return (data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        location: d.location,
        studioId: d.studio_id || d.display_id || null,
    }));
}

/**
 * Reassigns a quote to a different dealership.
 * Updates tenant_id, studio_id, and commercials.dealer.
 */
export async function reassignQuoteDealership(
    quoteId: string,
    dealerTenantId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. Fetch dealer info
        const { data: dealer, error: dealerError } = await adminClient
            .from('id_tenants')
            .select('id, name, location, studio_id, display_id')
            .eq('id', dealerTenantId)
            .single();

        if (dealerError || !dealer) {
            return { success: false, error: 'Dealership not found' };
        }

        // 2. Fetch current quote commercials
        const { data: quote, error: quoteError } = await adminClient
            .from('crm_quotes')
            .select('commercials')
            .eq('is_deleted', false)
            .eq('id', quoteId)
            .single();

        if (quoteError || !quote) {
            return { success: false, error: 'Quote not found' };
        }

        const commercials = (quote as any).commercials || {};
        const studioId = dealer.studio_id || dealer.display_id || null;

        // 3. Update commercials.dealer + commercials.pricing_snapshot.dealer
        const updatedCommercials = {
            ...commercials,
            dealer: {
                ...(commercials.dealer || {}),
                dealer_id: dealer.id,
                dealer_name: dealer.name,
                name: dealer.name,
                studio_id: studioId,
                location: dealer.location,
            },
            pricing_snapshot: {
                ...(commercials.pricing_snapshot || {}),
                dealer: {
                    ...(commercials.pricing_snapshot?.dealer || {}),
                    dealer_id: dealer.id,
                    dealer_name: dealer.name,
                    name: dealer.name,
                    id: dealer.id,
                    studio_id: studioId,
                },
            },
        };

        // 4. Atomic update: tenant_id and commercials
        const { error: updateError } = await adminClient
            .from('crm_quotes')
            .update({
                tenant_id: dealer.id,
                commercials: updatedCommercials,
            })
            .eq('id', quoteId);

        if (updateError) {
            console.error('reassignQuoteDealership Error:', updateError);
            return { success: false, error: updateError.message };
        }

        // 5. Log the event
        await logQuoteEvent(quoteId, `Dealership changed to ${dealer.name}`, null, 'team');

        return { success: true };
    } catch (error: any) {
        console.error('reassignQuoteDealership Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetches 3 alternative products for recommendations.
 * Checks cat_recommendations table first, fallbacks to similarity logic.
 */
export async function getAlternativeRecommendations(variantId: string) {
    // 1. Check persistent recommendations
    const { data: persistent, error: persistentError } = await (adminClient as any)
        .from('cat_recommendations')
        .select(
            `
            recommended_variant_id,
            position,
            item:recommended_variant_id(
                id,
                name,
                image_url,
                price_base,
                brand:cat_brands!cat_items_brand_id_fkey(name)
            )
        `
        )
        .eq('source_variant_id', variantId)
        .order('position', { ascending: true })
        .limit(3);

    if (!persistentError && persistent && persistent.length > 0) {
        return (persistent as any[]).map(p => {
            const item = (p as any).item as any;
            return {
                id: item.id,
                name: item.name,
                brand: item.brand?.name || '',
                price: Number(item.price_base),
                image: item.image_url,
            };
        });
    }

    // 2. Fallback: Get current variant's parent (FAMILY) and price
    const { data: current, error: currentError } = await adminClient
        .from('cat_items')
        .select('parent_id, price_base, brand_id')
        .eq('id', variantId)
        .single();

    if (currentError || !current || !current.parent_id) {
        console.error('Error fetching current variant for alternatives:', currentError);
        return [];
    }

    // 3. Fallback: Fetch up to 3 sibling variants from the same FAMILY within ±20% price
    const basePrice = Number(current.price_base) || 0;
    const minPrice = basePrice * 0.8;
    const maxPrice = basePrice * 1.2;

    const { data: alternatives, error: altError } = await adminClient
        .from('cat_items')
        .select('id, name, image_url, price_base, brand_id')
        .eq('type', 'VARIANT')
        .eq('parent_id', current.parent_id)
        .neq('id', variantId)
        .gte('price_base', minPrice)
        .lte('price_base', maxPrice)
        .limit(3);

    if (altError) {
        console.error('Error fetching alternatives:', altError);
        return [];
    }

    return (alternatives || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        brand: a.brand_id || '',
        price: Number(a.price_base),
        image: a.image_url,
    }));
}
