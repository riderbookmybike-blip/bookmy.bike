'use server';

import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { checkServiceability } from './serviceArea';
import { serverLog } from '@/lib/debug/logger';
import { createOrLinkMember } from './members';

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
    if (updates.primaryPhone) payload.primary_phone = updates.primaryPhone;
    if (updates.whatsapp) payload.whatsapp = updates.whatsapp;
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
    if (updates.workPhone) payload.work_phone = updates.workPhone;

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

export async function checkExistingCustomer(phone: string) {
    const cleanPhone = phone.trim();

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
    let query = supabase.from('crm_leads').select('*').order('created_at', { ascending: false });

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

export async function getCustomerHistory(customerId: string) {
    const supabase = await createClient();

    // Fetch leads
    const { data: leads } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

    // Fetch quotes
    const { data: quotes } = await supabase
        .from('crm_quotes')
        .select('*')
        .eq('lead_id', leads?.[0]?.id || '') // Simplification for now, better to link quotes to customer_id too later
        .order('created_at', { ascending: false });

    // Fetch bookings
    const { data: bookings } = await supabase
        .from('crm_bookings')
        .select('*')
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
    const { data, error } = await supabase.from('cat_items').select('name').eq('type', 'FAMILY').eq('status', 'ACTIVE');

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
    interest_model?: string;
    model?: string;
    owner_tenant_id?: string;
    source?: string;
}) {
    const interestModel = data.interest_model || data.model || 'GENERAL_ENQUIRY';
    const startTime = Date.now();

    await serverLog({
        component: 'CRM',
        action: 'createLeadAction',
        status: 'START',
        message: `Registering new identity for ${data.customer_phone}`,
        payload: { phone: data.customer_phone, name: data.customer_name },
    });

    console.log('[DEBUG] createLeadAction triggered by client:', data.customer_phone);

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

        // 1. Check/Create Customer Profile
        console.log('[DEBUG] Step 1: getOrCreateCustomerProfile...');
        // 1. Check/Create Customer Profile & Link to Tenant
        console.log('[DEBUG] Step 1: createOrLinkMember...');
        const { member } = await createOrLinkMember({
            tenantId: effectiveOwnerId,
            fullName: data.customer_name,
            phone: data.customer_phone,
            // Pass other details if createOrLinkMember supports them, otherwise they might be lost or need separate update
            // createOrLinkMember only takes basic input.
            // We might need to update extra fields if they are critical.
        });
        const customerId = member.id;

        // update extra fields that createOrLinkMember might not handle (like dob, taluka)
        if (data.customer_dob || data.customer_pincode || data.customer_taluka) {
            await adminClient
                .from('id_members')
                .update({
                    date_of_birth: data.customer_dob || null,
                    aadhaar_pincode: data.customer_pincode || null,
                    taluka: data.customer_taluka || null,
                })
                .eq('id', customerId);
        }

        console.log('[DEBUG] Step 1 Complete. CustomerId:', customerId);

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
                customer_phone: data.customer_phone,
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
        return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// --- QUOTES ---

export async function getQuotes(tenantId?: string) {
    const supabase = await createClient();
    let query = supabase
        .from('crm_quotes')
        .select(
            `
        *,
        leads:crm_leads (customer_name)
    `
        )
        .order('created_at', { ascending: false });

    if (tenantId) {
        query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) {
        console.error('getQuotes Error:', error);
        return [];
    }

    return data.map((q: any) => ({
        id: q.id,
        displayId: q.display_id || `QT-${q.id.slice(0, 4).toUpperCase()}`,
        customerName: q.leads?.customer_name || 'N/A',
        productName: q.commercials?.label || 'Custom Quote',
        productSku: q.variant_id || 'N/A',
        price: q.on_road_price || q.commercials?.grand_total || 0, // Prefer column
        status: q.status,
        date: q.created_at.split('T')[0],
        version: q.version,
        isLatest: q.is_latest,
    }));
}

export async function getQuotesForLead(leadId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_quotes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('getQuotesForLead Error:', error);
        return [];
    }
    return data || [];
}

import { getAuthUser } from '@/lib/auth/resolver';

export async function createQuoteAction(data: {
    tenant_id: string;
    lead_id?: string;
    variant_id: string;
    color_id?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    commercials: Record<string, any>;
    source?: 'STORE_PDP' | 'LEADS';
}): Promise<{ success: boolean; data?: any; message?: string }> {
    const user = await getAuthUser();
    const supabase = await createClient();
    const createdBy = user?.id;
    let memberId: string | null = null;
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
            .eq('id', data.lead_id)
            .maybeSingle();
        if (lead) {
            memberId = lead.customer_id || null;
            leadReferrerId = lead.referred_by_id || null;
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

    let nextVersion = 1;
    const vehicleSkuId = data.color_id || data.variant_id;

    // 1. Versioning Logic: If Lead & SKU match, increment version
    if (data.lead_id && vehicleSkuId) {
        const { data: existingLatest } = await supabase
            .from('crm_quotes')
            .select('id, version, parent_quote_id')
            .eq('lead_id', data.lead_id)
            .eq('vehicle_sku_id', vehicleSkuId)
            .eq('is_latest', true)
            .maybeSingle(); // Use maybeSingle to avoid error if none found

        if (existingLatest) {
            nextVersion = (existingLatest.version ?? 0) + 1;
            // Mark previous as not latest
            await supabase.from('crm_quotes').update({ is_latest: false }).eq('id', existingLatest.id);
            data.commercials = {
                ...data.commercials,
                parent_quote_id: existingLatest.parent_quote_id || existingLatest.id,
            };
        }
    }

    const { data: quote, error } = await supabase
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
            parent_quote_id: (data.commercials as any)?.parent_quote_id || null,

            // New Flat Columns
            on_road_price: onRoadPrice,
            ex_showroom_price: exShowroom,
            insurance_amount: insuranceAmount,
            rto_amount: rtoAmount,
            // vehicle_color removed to fix 42703 error

            status: 'DRAFT',
            version: nextVersion,
            is_latest: true,
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

    const finance = (data.commercials as any)?.finance || null;
    if (finance?.scheme_id || finance?.bank_id) {
        const { data: attempt, error: financeError } = await supabase
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
            await supabase
                .from('crm_quotes')
                .update({
                    finance_mode: 'LOAN',
                    active_finance_id: attempt.id,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', quote.id);
        }
    } else {
        await supabase
            .from('crm_quotes')
            .update({
                finance_mode: 'CASH',
                updated_at: new Date().toISOString(),
            })
            .eq('id', quote.id);
    }

    // 2. Sync Lead Status to 'QUOTE'
    if (data.lead_id) {
        const { error: leadUpdateError } = await supabase
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createQuoteVersion(
    parentQuoteId: string,
    commercials: Record<string, any>
): Promise<{ success: boolean; data?: any; message?: string }> {
    const user = await getAuthUser();
    const supabase = await createClient();
    const createdBy = user?.id;

    // Get parent version
    const { data: parent } = await supabase
        .from('crm_quotes')
        .select('version, tenant_id, lead_id, variant_id, color_id, member_id, lead_referrer_id, quote_owner_id')
        .eq('id', parentQuoteId)
        .single();

    if (!parent) throw new Error('Parent quote not found');

    const onRoadPrice = commercials.grand_total || 0;
    const pricingSnapshot = commercials?.pricing_snapshot || {};
    const rtoAmount = Math.round(
        Number(pricingSnapshot?.rto_total ?? pricingSnapshot?.rto?.total ?? commercials.rto ?? 0)
    );
    const insuranceAmount = Math.round(
        Number(pricingSnapshot?.insurance_total ?? pricingSnapshot?.insurance?.total ?? commercials.insurance ?? 0)
    );

    await supabase.from('crm_quotes').update({ is_latest: false }).eq('id', parentQuoteId);

    const { data: quote, error } = await supabase
        .from('crm_quotes')
        .insert({
            tenant_id: parent.tenant_id,
            lead_id: parent.lead_id,
            member_id: parent.member_id || null,
            lead_referrer_id: parent.lead_referrer_id || null,
            quote_owner_id: parent.quote_owner_id || createdBy || null,
            variant_id: parent.variant_id,
            color_id: parent.color_id,
            vehicle_sku_id: parent.color_id || parent.variant_id, // Prefer SKU (color) when present
            parent_quote_id: parentQuoteId,
            version: (parent.version ?? 0) + 1,
            commercials,

            // New Flat Columns
            on_road_price: onRoadPrice,
            ex_showroom_price: commercials.base_price || 0,
            insurance_amount: insuranceAmount,
            rto_amount: rtoAmount,
            // vehicle_color removed to fix 42703 error

            status: 'DRAFT',
            is_latest: true,
            created_by: createdBy,
        })
        .select()
        .single();

    if (error) {
        console.error('Create Quote Version Error:', error);
        return { success: false, message: error.message };
    }
    revalidatePath('/app/[slug]/quotes');
    return { success: true, data: quote };
}

export async function acceptQuoteAction(id: string): Promise<{ success: boolean; message?: string }> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('crm_quotes')
        .update({ status: 'ACCEPTED', updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Accept Quote Error:', error);
        return { success: false, message: error.message };
    }

    // Log timeline event
    await logQuoteEvent(id, 'Quote Accepted', 'Customer', 'customer', { source: 'CUSTOMER' });

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
        .update({ status: 'LOCKED', updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Lock Quote Error:', error);
        return { success: false, message: error.message };
    }
    revalidatePath('/app/[slug]/quotes');
    revalidatePath('/profile');
    return { success: true };
}

// --- BOOKINGS & SALES ORDERS ---

export async function getBookings(tenantId?: string) {
    const supabase = await createClient();
    let query = supabase
        .from('crm_bookings')
        .select(
            `
        *,
        quotes:crm_quotes (commercials, leads:crm_leads(customer_name))
    `
        )
        .order('created_at', { ascending: false });

    if (tenantId) {
        query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) {
        console.error('getBookings Error:', error);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((b: any) => ({
        id: b.id,
        displayId: `SO-${b.id.slice(0, 4).toUpperCase()}`,
        quoteId: b.quote_id,
        quoteDisplayId: `QT-${b.quote_id?.slice(0, 4).toUpperCase()}`,
        customer: b.quotes?.leads?.customer_name || 'N/A',
        brand: b.vehicle_details?.brand || 'N/A',
        model: b.vehicle_details?.model || 'N/A',
        variant: b.vehicle_details?.variant || 'N/A',
        price: b.vehicle_details?.commercial_snapshot?.grand_total || 0,
        status: b.status,
        date: b.created_at.split('T')[0],
        currentStage: b.current_stage,
    }));
}

export async function getBookingForLead(leadId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.from('crm_bookings').select('*').eq('lead_id', leadId).maybeSingle();

    if (error) {
        console.error('getBookingForLead Error:', error);
        return null;
    }
    return data;
}

export async function createBookingFromQuote(quoteId: string) {
    const supabase = await createClient();

    // 1. Get Quote Details
    const { data: quote } = await supabase.from('crm_quotes').select('*').eq('id', quoteId).single();

    if (!quote) throw new Error('Quote not found');
    if (quote.status !== 'LOCKED') {
        throw new Error('Quote must be LOCKED before converting to Booking');
    }

    // 2. Create Booking with enhanced commercial tracking
    const { data: booking, error } = await supabase
        .from('crm_bookings')
        .insert({
            tenant_id: quote.tenant_id,
            quote_id: quote.id,
            lead_id: quote.lead_id,
            variant_id: quote.variant_id,
            color_id: quote.color_id,
            grand_total: quote.on_road_price || (quote.commercials as any)?.grand_total || 0,
            base_price: quote.ex_showroom_price || (quote.commercials as any)?.ex_showroom || 0,
            vehicle_details: {
                variant_id: quote.variant_id,
                commercial_snapshot: quote.commercials,
            },
            status: 'BOOKED',
            current_stage: 'FINANCE',
        })
        .select()
        .single();

    if (error) {
        console.error('Create Booking Error:', error);
        return { success: false, message: error.message };
    }

    // 3. Update Quote status to BOOKED
    await supabase.from('crm_quotes').update({ status: 'BOOKED' }).eq('id', quoteId);

    revalidatePath('/app/[slug]/sales-orders');
    revalidatePath('/profile');
    return { success: true, data: booking };
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
        rtoType: 'STATE' | 'BH' | 'COMPANY';
        rtoBreakdown: { label: string; amount: number }[];
        rtoTotal: number;
        insuranceOD: number;
        insuranceTP: number;
        insuranceAddons: { id: string; name: string; amount: number; selected: boolean }[];
        insuranceGST: number;
        insuranceTotal: number;
        accessories: { id: string; name: string; price: number; selected: boolean }[];
        accessoriesTotal: number;
        dealerDiscount: number;
        managerDiscount: number;
        managerDiscountNote: string | null;
        onRoadTotal: number;
        finalTotal: number;
    };
    financeMode?: 'CASH' | 'LOAN';
    finance?: {
        id?: string | null;
        status?: 'IN_PROCESS' | 'UNDERWRITING' | 'DOC_PENDING' | 'APPROVED' | 'REJECTED';
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
        chargesBreakup?: any[] | null;
        emi?: number | null;
    } | null;
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
            lead:crm_leads(id, customer_name, customer_phone, utm_data, events_log, customer_id, referral_data, referred_by_name, referred_by_id)
        `
        )
        .eq('id', quoteId)
        .single();

    if (error || !quote) {
        console.error('getQuoteById Error:', error);
        return { success: false, error: error?.message || 'Quote not found' };
    }

    // Cast to any since we just added new columns that aren't in generated types yet
    const q = quote as any;

    const commercials = q.commercials || {};
    const pricingSnapshot = commercials.pricing_snapshot || {};
    const dealerFromPricing = pricingSnapshot?.dealer || commercials?.dealer || null;

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
            event: q.status === 'PENDING_REVIEW' ? 'In Review' : 'Manager Reviewed',
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
    };

    // Fetch Member Profile (single query to avoid slow duplicate fetches)
    let customerProfile: any = null;
    const leadPhoneRaw = q.lead?.customer_phone || '';
    const leadPhone = leadPhoneRaw.replace(/\D/g, '');
    const leadEmail = null;

    const resolvedMemberId = q.member_id || q.lead?.customer_id || null;

    if (resolvedMemberId || leadPhone) {
        const { data: member } = await supabase
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
                    'work_pincode',
                    'work_taluka',
                    'work_district',
                    'work_state',
                    'work_industry',
                    'work_profile',
                    'taluka',
                    'district',
                    'state',
                    'pincode',
                    'date_of_birth',
                    'ownership_type',
                ].join(', ')
            )
            .eq('id', resolvedMemberId || '')
            .maybeSingle();

        let resolvedMember = member;

        if (!resolvedMember && leadPhone) {
            const { data: memberByContact } = await supabase
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
                        'work_pincode',
                        'work_taluka',
                        'work_district',
                        'work_state',
                        'work_industry',
                        'work_profile',
                        'taluka',
                        'district',
                        'state',
                        'pincode',
                        'date_of_birth',
                        'ownership_type',
                    ].join(', ')
                )
                .or(
                    [leadPhone ? `primary_phone.eq.${leadPhone}` : null, leadPhone ? `whatsapp.eq.${leadPhone}` : null]
                        .filter(Boolean)
                        .join(',')
                )
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
                pincode: resolvedMember.pincode,
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
                workPincode: resolvedMember.work_pincode,
                workTaluka: resolvedMember.work_taluka,
                workDistrict: resolvedMember.work_district,
                workState: resolvedMember.work_state,
                workIndustry: resolvedMember.work_industry,
                workProfile: resolvedMember.work_profile,
                ownershipType: resolvedMember.ownership_type,
            };
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
            imageUrl: q.vehicle_image || commercials.image_url || null,
            skuId: q.vehicle_sku_id || q.color_id || q.variant_id || '',
        },
        pricing: {
            exShowroom: parseInt(q.ex_showroom_price) || commercials.ex_showroom || commercials.base_price || 0,
            rtoType: pricingSnapshot.rto_type || commercials.rto_type || 'STATE',
            rtoBreakdown: pricingSnapshot.rto_breakdown || [],
            rtoTotal: pricingSnapshot.rto_total || 0,
            insuranceOD: pricingSnapshot.insurance?.od || 0,
            insuranceTP: pricingSnapshot.insurance?.tp || 0,
            insuranceAddons: (pricingSnapshot.insurance_addon_items || pricingSnapshot.insurance_addons || []).map(
                (a: any) => ({
                    id: a.id || a,
                    name: a.name || a,
                    amount: a.price || a.amount || 0,
                    selected: true,
                })
            ),
            insuranceGST: pricingSnapshot.insurance?.gst || 0,
            insuranceTotal: pricingSnapshot.insurance_total || 0,
            accessories: (pricingSnapshot.accessory_items || pricingSnapshot.accessories || []).map((a: any) => ({
                id: a.id || a,
                name: a.name || 'Accessory',
                price: a.discountPrice || a.price || 0,
                selected: true,
            })),
            accessoriesTotal: pricingSnapshot.accessories_total || 0,
            dealerDiscount:
                parseInt(q.discount_amount) ||
                commercials.dealer_discount ||
                (pricingSnapshot.offers_delta || 0) + (pricingSnapshot.color_delta || 0) ||
                pricingSnapshot?.dealer?.offer ||
                0,
            managerDiscount: parseInt(q.manager_discount) || 0,
            managerDiscountNote: q.manager_discount_note || null,
            onRoadTotal: pricingSnapshot.grand_total || parseInt(q.on_road_price) || commercials.grand_total || 0,
            finalTotal:
                (pricingSnapshot.grand_total || parseInt(q.on_road_price) || commercials.grand_total || 0) +
                (parseInt(q.manager_discount) || 0),
        },
        finance: null,
        timeline,
    };

    if (q.active_finance_id) {
        const { data: attempt } = await supabase
            .from('crm_quote_finance_attempts')
            .select('*')
            .eq('id', q.active_finance_id)
            .maybeSingle();
        if (attempt) {
            result.finance = {
                id: attempt.id,
                status: attempt.status,
                bankId: attempt.bank_id,
                bankName: attempt.bank_name || null,
                schemeId: attempt.scheme_id,
                schemeCode: attempt.scheme_code,
                ltv: attempt.ltv,
                roi: attempt.roi,
                tenureMonths: attempt.tenure_months,
                downPayment: attempt.down_payment,
                loanAmount: attempt.loan_amount,
                loanAddons: attempt.loan_addons,
                processingFee: attempt.processing_fee,
                chargesBreakup: attempt.charges_breakup,
                emi: attempt.emi,
            };
        }
    } else if (commercials.finance) {
        result.finance = {
            bankId: commercials.finance?.bank_id || null,
            bankName: commercials.finance?.bank_name || null,
            schemeId: commercials.finance?.scheme_id || null,
            schemeCode: commercials.finance?.scheme_code || null,
            ltv: commercials.finance?.ltv ?? null,
            roi: commercials.finance?.roi ?? null,
            tenureMonths: commercials.finance?.tenure_months ?? null,
            downPayment: commercials.finance?.down_payment ?? null,
            loanAmount: commercials.finance?.loan_amount ?? null,
            loanAddons: commercials.finance?.loan_addons ?? null,
            processingFee: commercials.finance?.processing_fee ?? null,
            chargesBreakup: commercials.finance?.charges_breakup ?? null,
            emi: commercials.finance?.emi ?? null,
        };
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
        .eq('id', quoteId)
        .single();

    if (fetchError || !quote) {
        return { success: false, error: 'Quote not found' };
    }

    if (quote.status !== 'DRAFT') {
        return { success: true };
    }

    const updatePayload: Record<string, any> = {
        status: 'PENDING_REVIEW',
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
    const { data: quote } = await supabase.from('crm_quotes').select('tenant_id').eq('id', quoteId).single();

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

export async function updateQuoteFinanceStatus(
    attemptId: string,
    status: 'IN_PROCESS' | 'UNDERWRITING' | 'DOC_PENDING' | 'APPROVED' | 'REJECTED'
) {
    const supabase = await createClient();
    const { data: attempt, error: fetchError } = await supabase
        .from('crm_quote_finance_attempts')
        .select('id, quote_id')
        .eq('id', attemptId)
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

    await logQuoteEvent(attempt.quote_id, `Finance Status: ${status}`, 'Team Member', 'team', { source: 'CRM' });

    if (status === 'DOC_PENDING') {
        await createTask({
            tenantId: null,
            linkedType: 'QUOTE',
            linkedId: attempt.quote_id,
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

export async function updateQuotePricing(
    quoteId: string,
    updates: {
        rtoType?: 'STATE' | 'BH' | 'COMPANY';
        insuranceAddons?: string[];
        accessories?: string[];
        managerDiscount?: number;
        managerDiscountNote?: string;
    }
): Promise<{ success: boolean; error?: string }> {
    const user = await getAuthUser();
    const supabase = await createClient();

    // Get current quote
    const { data: quote, error: fetchError } = await supabase
        .from('crm_quotes')
        .select('commercials')
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
        insurance_addons: updates.insuranceAddons || pricingSnapshot.insurance_addons,
        accessories: updates.accessories || pricingSnapshot.accessories,
    };

    const updatedCommercials = {
        ...commercials,
        pricing_snapshot: updatedPricingSnapshot,
    };

    const updatePayload: any = {
        commercials: updatedCommercials,
        updated_at: new Date().toISOString(),
    };

    if (updates.managerDiscount !== undefined) {
        updatePayload.manager_discount = updates.managerDiscount;
        updatePayload.manager_discount_note = updates.managerDiscountNote || null;
        updatePayload.reviewed_by = user?.id || null;
        updatePayload.reviewed_at = new Date().toISOString();
    }

    const { error } = await supabase.from('crm_quotes').update(updatePayload).eq('id', quoteId);

    if (error) {
        console.error('updateQuotePricing Error:', error);
        return { success: false, error: error.message };
    }

    // Log timeline event if manager discount changed
    if (updates.managerDiscount !== undefined) {
        await logQuoteEvent(quoteId, `Manager Discount Adjusted to ₹${updates.managerDiscount}`, 'Manager', 'team', {
            source: 'CRM',
        });
    }

    revalidatePath('/app/[slug]/quotes');
    return { success: true };
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
    const { data: quoteData, error } = await supabase.from('crm_quotes').select('*').eq('id', quoteId).single();

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

export async function logQuoteEvent(
    quoteId: string,
    event: string,
    actor?: string | null,
    actorType: 'customer' | 'team' = 'team',
    details?: { source?: string; reason?: string }
) {
    const supabase = await createClient(); // Use createClient for RLS compliance if possible

    // Fetch current commercials to get timeline
    const { data: quote, error: fetchError } = await supabase
        .from('crm_quotes')
        .select('commercials')
        .eq('id', quoteId)
        .single();

    if (fetchError || !quote) {
        console.error('logQuoteEvent Error: Quote not found', fetchError);
        return { success: false, error: 'Quote not found' };
    }

    const commercials = (quote.commercials as any) || {};
    const timeline = commercials.timeline || [];

    // Add new event
    const newEvent = {
        event,
        timestamp: new Date().toISOString(),
        actor: actor || 'System',
        actorType,
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
