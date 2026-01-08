'use server';

import { z } from 'zod'; // Ensure zod is installed, if not we'll use regex
import { adminClient } from '@/lib/supabase/admin';
import { headers } from 'next/headers';

// --- Validation Key ---
const leadSchema = z.object({
    name: z.string().min(2, "Name is too short"),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
    city: z.string().optional(),
    model: z.string(),
    variant: z.string().optional(),
    color: z.string().optional(),
    honeypot: z.string().max(0, "Spam detected"), // Must be empty
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

    // 3. Extract & Validate Data
    const rawData = {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        city: formData.get('city') as string,
        model: formData.get('model') as string,
        variant: formData.get('variant') as string,
        color: formData.get('color') as string,
        honeypot: '',
        priceSnapshot: formData.get('priceSnapshot') ? JSON.parse(formData.get('priceSnapshot') as string) : null,
        utm: formData.get('utm') ? JSON.parse(formData.get('utm') as string) : null
    };

    const validation = leadSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { data } = validation;

    // 4. Determine Tenant (P0: Unassigned / NULL)
    // We leave tenant_id as NULL. Admin dashboard will query `where tenant_id is null` to see new leads.
    const tenantId = null;

    // 5. Insert to Supabase (Bypassing RLS via Admin Client)
    const { error } = await adminClient
        .from('leads')
        .insert({
            tenant_id: tenantId,
            customer_name: data.name,
            customer_phone: data.phone,
            customer_city: data.city,
            interest_model: data.model,
            interest_variant: data.variant,
            interest_color: data.color,
            price_snapshot: data.priceSnapshot,
            utm_data: data.utm,
            status: 'NEW'
        });

    if (error) {
        console.error('Lead Insert Error:', error);
        return { success: false, message: 'System busy. Please try WhatsApp.' };
    }

    return { success: true, message: 'Callback requested successfully!' };
}
