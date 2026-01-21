'use server';

import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

// --- CUSTOMER PROFILES ---

async function getOrCreateCustomerProfile(data: {
    name: string;
    phone: string;
    pincode?: string;
    dob?: string;
    city?: string;
}) {
    // 1. Search for existing profile by WhatsApp/Phone
    // We check both whatsapp and potentially a phone field if it existed (based on migrations it's 'whatsapp')
    const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id')
        .or(`whatsapp.eq.${data.phone}`)
        .maybeSingle();

    if (existingProfile) {
        // Update existing profile with latest metadata if provided
        await adminClient
            .from('profiles')
            .update({
                full_name: data.name,
                whatsapp: data.phone,
                date_of_birth: data.dob,
                aadhaar_pincode: data.pincode,
            })
            .eq('id', existingProfile.id);

        return existingProfile.id;
    }

    // 2. Create Auth User (Passwordless/Phone-based)
    // We create a disabled-password user to act as a placeholder for the contact
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        phone: data.phone,
        phone_confirm: true,
        user_metadata: {
            full_name: data.name,
        }
    });

    if (authError) {
        // If user already exists in auth but not profile (rare), use that ID
        if (authError.message.includes('already exists')) {
            // Fetch more users to increase chances of finding the existing one
            const { data: list } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
            const user = list.users.find(u => u.phone === data.phone || u.phone === `+91${data.phone}`);
            if (user) return user.id;
            console.error('User exists in Auth but not found in listUsers (checked 1000)', data.phone);
        }
        throw authError;
    }

    // 3. Profiles are usually created by triggers on auth.user creation
    // But since triggers might be missing or limited, we upsert into profiles manually for safety
    const { data: newProfile, error: profileError } = await adminClient
        .from('profiles')
        .upsert({
            id: authUser.user.id,
            full_name: data.name,
            whatsapp: data.phone,
            date_of_birth: data.dob,
            aadhaar_pincode: data.pincode,
            role: 'BMB_USER'
        })
        .select('id')
        .single();

    if (profileError) throw profileError;
    return newProfile.id;
}

export async function checkExistingCustomer(phone: string) {
    // Normalize phone for comparison (remove leading 0 or +91 if necessary, but here we assume clean 10 digits as per UI)
    const cleanPhone = phone.trim();

    // Search profiles by whatsapp column OR by user_id link to auth.users (joining on phone)
    // Using explicit query for clarity
    const { data: profile, error } = await adminClient
        .from('profiles')
        .select(`
            full_name, 
            aadhaar_pincode, 
            date_of_birth,
            whatsapp,
            users:user_id ( phone )
        `)
        .or(`whatsapp.eq.${cleanPhone},user_id.in.(select id from auth.users where phone = '${cleanPhone}' or phone = '+91${cleanPhone}')`)
        .maybeSingle();

    if (error) {
        console.error('Error checking existing customer:', error);
        return null;
    }

    if (profile) {
        return {
            name: profile.full_name,
            pincode: profile.aadhaar_pincode,
            dob: profile.date_of_birth
        };
    }

    return null;
}

// --- LEADS ---

export async function getLeads(tenantId?: string, status?: string) {
    console.log('Fetching leads for tenantId:', tenantId);
    const supabase = await createClient();
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false });

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
            city: l.customer_city,
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
        .from('leads')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

    // Fetch quotes
    const { data: quotes } = await supabase
        .from('quotes')
        .select('*')
        .eq('lead_id', leads?.[0]?.id || '') // Simplification for now, better to link quotes to customer_id too later
        .order('created_at', { ascending: false });

    return {
        leads: leads || [],
        quotes: quotes || [],
        bookings: [] // TODO: Link bookings to profile/customer_id
    };
}

export async function getCatalogModels() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('catalog_items')
        .select('name')
        .eq('type', 'FAMILY')
        .eq('status', 'ACTIVE');

    if (error) {
        console.error('Error fetching catalog models:', error);
        return [];
    }

    return data.map(i => i.name);
}

export async function createLeadAction(data: {
    customer_name: string;
    customer_phone: string;
    customer_pincode?: string;
    customer_city?: string;
    customer_dob?: string;
    interest_model?: string;
    owner_tenant_id: string;
    source?: string;
}) {
    // Enforce Uppercase Name
    data.customer_name = data.customer_name.toUpperCase();

    // 1. Get or Create Persistent Customer Profile
    const customerId = await getOrCreateCustomerProfile({
        name: data.customer_name,
        phone: data.customer_phone,
        pincode: data.customer_pincode,
        dob: data.customer_dob,
        city: data.customer_city
    });

    // 2. Automated Segregation Logic (Pincode & Junking)
    let status = 'NEW';
    let isServiceable = false;

    // Define serviceable logic (Mock for now, but strict)
    const serviceablePrefixes = ['11', '12', '56', '40']; // Delhi, Haryana, Bangalore, Mumbai start

    if (data.customer_pincode) {
        const prefix = data.customer_pincode.substring(0, 2);
        isServiceable = serviceablePrefixes.includes(prefix);

        if (!isServiceable) {
            status = 'JUNK';
        }
    }

    // Use adminClient to bypass RLS for Lead Creation (Backend Action)
    const { data: lead, error } = await adminClient
        .from('leads')
        .insert({
            customer_id: customerId, // Linked to profile
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            customer_pincode: data.customer_pincode,
            customer_city: data.customer_city,
            customer_dob: data.customer_dob,
            interest_model: data.interest_model,
            interest_text: data.interest_model, // Populate explicitly
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
        console.error('Error inserting lead:', error);
        throw new Error(`Lead Insert Failed: ${error.message}`);
    }
    revalidatePath('/app/[slug]/leads');
    return lead;
}

// --- QUOTES ---

export async function getQuotes(tenantId?: string) {
    const supabase = await createClient();
    let query = supabase.from('quotes').select(`
        *,
        leads (customer_name)
    `).order('created_at', { ascending: false });

    if (tenantId) {
        query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map((q: any) => ({
        id: q.id,
        displayId: `QT-${q.id.slice(0, 4).toUpperCase()}`,
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
        .from('quotes')
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
            .from('quotes')
            .select('id, version')
            .eq('lead_id', data.lead_id)
            .eq('vehicle_sku_id', data.variant_id)
            .eq('is_latest', true)
            .maybeSingle(); // Use maybeSingle to avoid error if none found

        if (existingLatest) {
            nextVersion = existingLatest.version + 1;
            // Mark previous as not latest
            await supabase
                .from('quotes')
                .update({ is_latest: false })
                .eq('id', existingLatest.id);
        }
    }

    const { data: quote, error } = await supabase
        .from('quotes')
        .insert({
            tenant_id: data.tenant_id,
            lead_id: data.lead_id,
            variant_id: data.variant_id,
            vehicle_sku_id: data.variant_id, // Map variant to SKU ID
            commercials: data.commercials,

            // New Flat Columns
            on_road_price: onRoadPrice,
            ex_showroom_price: exShowroom,
            insurance_amount: data.commercials.insurance || 0,
            rto_amount: data.commercials.rto || 0,
            vehicle_color: data.commercials.color_name || null,

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
        .from('quotes')
        .select('version, tenant_id, lead_id, variant_id')
        .eq('id', parentQuoteId)
        .single();

    if (!parent) throw new Error('Parent quote not found');

    const onRoadPrice = commercials.grand_total || 0;

    const { data: quote, error } = await supabase
        .from('quotes')
        .insert({
            tenant_id: parent.tenant_id,
            lead_id: parent.lead_id,
            variant_id: parent.variant_id,
            vehicle_sku_id: parent.variant_id, // Map variant to SKU ID
            parent_quote_id: parentQuoteId,
            version: parent.version + 1,
            commercials,

            // New Flat Columns
            on_road_price: onRoadPrice,
            ex_showroom_price: commercials.base_price || 0,
            insurance_amount: commercials.insurance || 0,
            rto_amount: commercials.rto || 0,
            vehicle_color: commercials.color_name || null,

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
        .from('quotes')
        .update({ status: 'ACCEPTED', updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
    revalidatePath('/app/[slug]/quotes');
}

// --- BOOKINGS & SALES ORDERS ---

export async function getBookings(tenantId?: string) {
    const supabase = await createClient();
    let query = supabase.from('bookings').select(`
        *,
        quotes (commercials, leads(customer_name))
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
        .from('bookings')
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
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

    if (!quote) throw new Error('Quote not found');

    // 2. Create Booking
    const { data: booking, error } = await supabase
        .from('bookings')
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
    await supabase.from('quotes').update({ status: 'ACCEPTED' }).eq('id', quoteId);

    revalidatePath('/app/[slug]/sales-orders');
    return booking;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateBookingStage(id: string, stage: string, statusUpdates: Record<string, any>) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('bookings')
        .update({
            current_stage: stage,
            ...statusUpdates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) throw error;
    revalidatePath('/app/[slug]/sales-orders');
}
