import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidPhone, toAppStorageFormat } from '@/lib/utils/phoneUtils';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const cleanPhone = toAppStorageFormat(body?.phone || '');

        if (!isValidPhone(cleanPhone)) {
            return NextResponse.json({ success: false, message: 'Valid phone is required' }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const normalizedReferralInput = String(body?.referralCodeInput || '')
            .trim()
            .toUpperCase();
        const normalizedReferralFromLink = String(body?.referralCodeFromLink || '')
            .trim()
            .toUpperCase();

        const payload = {
            phone: cleanPhone,
            full_name: String(body?.fullName || '').trim() || null,
            pincode: /^\d{6}$/.test(String(body?.pincode || '')) ? String(body?.pincode) : null,
            state: String(body?.state || '').trim() || null,
            district: String(body?.district || '').trim() || null,
            taluka: String(body?.taluka || '').trim() || null,
            area: String(body?.area || '').trim() || null,
            latitude: Number.isFinite(Number(body?.latitude)) ? Number(body.latitude) : null,
            longitude: Number.isFinite(Number(body?.longitude)) ? Number(body.longitude) : null,
            referral_code_input: normalizedReferralInput || null,
            referral_code_from_link: normalizedReferralFromLink || null,
            source:
                String(body?.source || 'DIRECT_LINK')
                    .trim()
                    .toUpperCase() || 'DIRECT_LINK',
            reason: String(body?.reason || 'UNKNOWN').trim() || 'UNKNOWN',
            status: 'PENDING',
            last_seen_at: new Date().toISOString(),
        };

        const { error } = await (supabaseAdmin as any)
            .from('id_pending_memberships')
            .upsert(payload, { onConflict: 'phone' });

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[pending-membership] capture failed:', error);
        return NextResponse.json({ success: false, message: 'Capture failed' }, { status: 500 });
    }
}
