'use server';

import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { checkServiceability } from './serviceArea';
import { serverLog } from '@/lib/debug/logger';

// --- CUSTOMER PROFILES ---

async function getOrCreateCustomerProfile(data: {
    name: string;
    phone: string;
    pincode?: string;
    dob?: string;
    taluka?: string;
}) {
    console.log('[DEBUG] getOrCreateCustomerProfile starting for:', data.phone);
    // Normalize optional fields
    const dob = data.dob || null;
    const pincode = data.pincode || null;

    // 1. Search for existing profile by WhatsApp/Phone
    console.log('[DEBUG] Searching id_members for existing profile...');
    const { data: existingProfile, error: searchError } = await adminClient
        .from('id_members')
        .select('id')
        .or(`whatsapp.eq.${data.phone},primary_phone.eq.${data.phone}`)
        .maybeSingle();

    if (searchError) {
        console.error('[DEBUG] Search error in id_members:', searchError);
    }

    if (existingProfile) {
        console.log('[DEBUG] Existing profile found:', existingProfile.id);
        // Update existing profile with latest metadata if provided
        const { error: updateError } = await adminClient
            .from('id_members')
            .update({
                full_name: toTitleCase(data.name),
                whatsapp: data.phone,
                date_of_birth: dob,
                aadhaar_pincode: pincode,
                taluka: data.taluka || null
            })
            .eq('id', existingProfile.id);

        if (updateError) {
            console.error('[DEBUG] Profile update failed:', updateError);
            throw updateError;
        }

        console.log('[DEBUG] Profile updated successfully');
        return existingProfile.id;
    }

    console.log('[DEBUG] No existing profile. Creating Auth User...');
    // 2. Create Auth User (Passwordless/Phone-based)
    // We create a disabled-password user to act as a placeholder for the contact
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        phone: data.phone,
        phone_confirm: true,
        user_metadata: {
            full_name: toTitleCase(data.name),
        }
    });

    if (authError) {
        console.error('[DEBUG] Auth User Creation failed:', authError.message);
        // If user already exists in auth but not profile (rare), use that ID
        if (authError.message.includes('already exists')) {
            console.log('[DEBUG] User already exists in Auth. Fetching ID...');
            // Fetch more users to increase chances of finding the existing one
            const { data: list } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
            const user = list.users.find(u => u.phone === data.phone || u.phone === `+91${data.phone}`);
            if (user) {
                console.log('[DEBUG] Found existing Auth user ID:', user.id);
                return user.id;
            }
            console.error('User exists in Auth but not found in listUsers (checked 1000)', data.phone);
        }
        throw authError;
    }

    console.log('[DEBUG] Auth User created:', authUser.user.id);

    // 3. Profiles are now id_members
    console.log('[DEBUG] Upserting id_members profile for new user...');
    const { data: newProfile, error: profileError } = await adminClient
        .from('id_members')
        .upsert({
            id: authUser.user.id,
            full_name: toTitleCase(data.name),
            whatsapp: data.phone,
            primary_phone: data.phone,
            date_of_birth: dob,
            aadhaar_pincode: pincode,
            taluka: data.taluka || null,
            role: 'customer' // Corrected from 'dealer_staff' to 'customer'
        })
        .select('id')
        .single();

    if (profileError) {
        console.error('[DEBUG] id_members upsert failed:', profileError);
        throw profileError;
    }

    console.log('[DEBUG] id_members profile created successfully');
    return newProfile.id;
}

export async function checkExistingCustomer(phone: string) {
    const cleanPhone = phone.trim();

    // Search id_members by whatsapp OR primary_phone
    const { data: profile, error } = await adminClient
        .from('id_members')
        .select(`
            id,
            full_name, 
            aadhaar_pincode, 
            date_of_birth,
            whatsapp,
            primary_phone
        `)
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
                dob: profile.date_of_birth
            },
            memberId: profile.id
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
        throw error;
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
            events_log: l.events_log || []
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
        bookings: bookings || []
    };
}

export async function getCatalogModels() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('cat_items')
        .select('name')
        .eq('type', 'FAMILY')
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
    return str.toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

export async function createLeadAction(data: {
    customer_name: string;
    customer_phone: string;
    customer_pincode?: string;
    customer_dob?: string;
    customer_taluka?: string;
    interest_model?: string; // Optional because frontend might pass 'model'
    model?: string;          // Added to handle frontend 'model' field
    owner_tenant_id: string; // The dealership creating the lead
    source?: string;
}) {
    // Map 'model' to 'interest_model' if needed
    const interestModel = data.interest_model || data.model || 'GENERAL_ENQUIRY';
    const startTime = Date.now();

    await serverLog({
        component: 'CRM',
        action: 'createLeadAction',
        status: 'START',
        message: `Registering new identity for ${data.customer_phone}`,
        payload: { phone: data.customer_phone, name: data.customer_name }
    });

    console.log('[DEBUG] createLeadAction triggered by client:', data.customer_phone);
    try {
        // Use the pre-imported adminClient from '@/lib/supabase/admin'

        // 1. Check/Create Customer Profile
        console.log('[DEBUG] Step 1: getOrCreateCustomerProfile...');
        const customerId = await getOrCreateCustomerProfile({
            name: data.customer_name,
            phone: data.customer_phone,
            pincode: data.customer_pincode,
            dob: data.customer_dob,
            taluka: data.customer_taluka
        });

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
                customer_id: customerId, // Linked to profile
                customer_name: data.customer_name,
                customer_phone: data.customer_phone,
                customer_pincode: data.customer_pincode || null,
                customer_taluka: data.customer_taluka || null,
                customer_dob: data.customer_dob || null,
                interest_model: interestModel,
                interest_text: interestModel, // Populate explicitly
                owner_tenant_id: data.owner_tenant_id,
                status: status,
                is_serviceable: isServiceable,
                source: data.source || 'WALKIN',
                utm_data: {
                    utm_source: data.source || 'MANUAL',
                    auto_segregated: status === 'JUNK',
                    segregation_reason: status === 'JUNK' ? 'Unserviceable Pincode' : null
                },
                intent_score: status === 'JUNK' ? 'COLD' : 'WARM' // Updated to match check constraint
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
                duration_ms: Date.now() - startTime
            });
            throw error;
        }

        console.log('[DEBUG] Lead created successfully:', lead.id);
        await serverLog({
            component: 'CRM',
            action: 'createLeadAction',
            status: 'SUCCESS',
            message: `Identity Registered Successfully: ${lead.customer_name}`,
            payload: { leadId: lead.id },
            duration_ms: Date.now() - startTime
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
            duration_ms: Date.now() - startTime
        });
        // Throw the error so the frontend catch block can handle it and show the toast.error
        throw error;
    }
}

// --- QUOTES ---

export async function getQuotes(tenantId?: string) {
    const supabase = await createClient();
    let query = supabase.from('crm_quotes').select(`
        *,
        leads:crm_leads (customer_name)
    `).order('created_at', { ascending: false });

    if (tenantId) {
        query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) throw error;

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
        isLatest: q.is_latest
    }));
}

export async function getQuotesForLead(leadId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_quotes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function createQuoteAction(data: {
    tenant_id: string;
    lead_id?: string;
    variant_id: string;
    color_id?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    commercials: Record<string, any>;
}) {
    const supabase = await createClient();

    // Extract flat fields for analytics
    const onRoadPrice = data.commercials.grand_total || 0;
    const exShowroom = data.commercials.base_price || 0;

    let nextVersion = 1;

    // 1. Versioning Logic: If Lead & SKU match, increment version
    if (data.lead_id && data.variant_id) {
        const { data: existingLatest } = await supabase
            .from('crm_quotes')
            .select('id, version')
            .eq('lead_id', data.lead_id)
            .eq('vehicle_sku_id', data.variant_id)
            .eq('is_latest', true)
            .maybeSingle(); // Use maybeSingle to avoid error if none found

        if (existingLatest) {
            nextVersion = existingLatest.version + 1;
            // Mark previous as not latest
            await supabase
                .from('crm_quotes')
                .update({ is_latest: false })
                .eq('id', existingLatest.id);
        }
    }

    const { data: quote, error } = await supabase
        .from('crm_quotes')
        .insert({
            tenant_id: data.tenant_id,
            lead_id: data.lead_id,
            variant_id: data.variant_id,
            color_id: data.color_id,
            vehicle_sku_id: data.variant_id, // Map variant to SKU ID
            commercials: data.commercials,

            // New Flat Columns
            on_road_price: onRoadPrice,
            ex_showroom_price: exShowroom,
            insurance_amount: data.commercials.insurance || 0,
            rto_amount: data.commercials.rto || 0,
            // vehicle_color removed to fix 42703 error

            status: 'DRAFT',
            version: nextVersion,
            is_latest: true
        })
        .select()
        .single();

    if (error) throw error;
    revalidatePath('/app/[slug]/quotes');
    return quote;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createQuoteVersion(parentQuoteId: string, commercials: Record<string, any>) {
    const supabase = await createClient();

    // Get parent version
    const { data: parent } = await supabase
        .from('crm_quotes')
        .select('version, tenant_id, lead_id, variant_id, color_id')
        .eq('id', parentQuoteId)
        .single();

    if (!parent) throw new Error('Parent quote not found');

    const onRoadPrice = commercials.grand_total || 0;

    const { data: quote, error } = await supabase
        .from('crm_quotes')
        .insert({
            tenant_id: parent.tenant_id,
            lead_id: parent.lead_id,
            variant_id: parent.variant_id,
            color_id: parent.color_id,
            vehicle_sku_id: parent.variant_id, // Map variant to SKU ID
            parent_quote_id: parentQuoteId,
            version: parent.version + 1,
            commercials,

            // New Flat Columns
            on_road_price: onRoadPrice,
            ex_showroom_price: commercials.base_price || 0,
            insurance_amount: commercials.insurance || 0,
            rto_amount: commercials.rto || 0,
            // vehicle_color removed to fix 42703 error

            status: 'DRAFT',
            is_latest: true
        })
        .select()
        .single();

    if (error) throw error;
    revalidatePath('/app/[slug]/quotes');
    return quote;
}

export async function confirmQuote(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('crm_quotes')
        .update({ status: 'ACCEPTED', updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
    revalidatePath('/app/[slug]/quotes');
}

// --- BOOKINGS & SALES ORDERS ---

export async function getBookings(tenantId?: string) {
    const supabase = await createClient();
    let query = supabase.from('crm_bookings').select(`
        *,
        quotes:crm_quotes (commercials, leads:crm_leads(customer_name))
    `).order('created_at', { ascending: false });

    if (tenantId) {
        query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((b: { id: string; quote_id: string; quotes: any; vehicle_details: any; status: string; created_at: string; current_stage: string }) => ({
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
        currentStage: b.current_stage
    }));
}

export async function getBookingForLead(leadId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('crm_bookings')
        .select('*')
        .eq('lead_id', leadId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function createBookingFromQuote(quoteId: string) {
    const supabase = await createClient();

    // 1. Get Quote Details
    const { data: quote } = await supabase
        .from('crm_quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

    if (!quote) throw new Error('Quote not found');

    // 2. Create Booking
    const { data: booking, error } = await supabase
        .from('crm_bookings')
        .insert({
            tenant_id: quote.tenant_id,
            quote_id: quote.id,
            vehicle_details: {
                variant_id: quote.variant_id,
                commercial_snapshot: quote.commercials
            },
            status: 'BOOKED',
            current_stage: 'FINANCE'
        })
        .select()
        .single();

    if (error) throw error;

    // 3. Update Quote status
    await supabase.from('crm_quotes').update({ status: 'ACCEPTED' }).eq('id', quoteId);

    revalidatePath('/app/[slug]/sales-orders');
    return booking;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateBookingStage(id: string, stage: string, statusUpdates: Record<string, any>) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('crm_bookings')
        .update({
            current_stage: stage,
            ...statusUpdates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) throw error;
    revalidatePath('/app/[slug]/sales-orders');
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
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Error inserting member document:', error);
        throw error;
    }

    return asset;
}

export async function deleteMemberDocumentAction(documentId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('id_member_assets')
        .delete()
        .eq('id', documentId);

    if (error) {
        console.error('Error deleting member document:', error);
        throw error;
    }
}

export async function updateMemberDocumentAction(id: string, updates: {
    path?: string;
    purpose?: string;
    file_type?: string;
    metadata?: any;
}) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('id_member_assets')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
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
    const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(path, 60); // 60 seconds expiry

    if (error) {
        console.error('Error creating signed URL:', error);
        throw error;
    }

    return data.signedUrl;
}
