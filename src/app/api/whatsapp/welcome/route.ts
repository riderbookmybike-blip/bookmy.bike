/**
 * POST /api/whatsapp/welcome
 *
 * Secure server-side route for sending the MSG91 `welcome` WhatsApp template.
 *
 * Auth: requires a valid Supabase session (JWT via cookie).
 *       Returns 401 if user is not authenticated.
 *
 * Body (JSON):
 *   {
 *     phone: string;          // recipient 10-digit phone
 *     advisor_name: string;   // signed-in user full name (body_1)
 *     advisor_mobile: string; // signed-in user phone (body_2)
 *     offer_month: string;    // e.g. "March 2026" (body_3)
 *     referral_link: string;  // PDP share link (body_4)
 *   }
 *
 * Returns: { success: boolean; message?: string; requestId?: string; providerStatus?: string; providerMessage?: string }
 *
 * ENV required (server-side only — never exposed to client):
 *   MSG91_AUTH_KEY
 *   MSG91_WA_INTEGRATED_NUMBER  (default: 917447403491)
 *   MSG91_WA_NAMESPACE           (default: f197f829_dfac_4dd3_8188_81021b01b37b)
 *   MSG91_WA_WELCOME_TEMPLATE    (default: welcome)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWelcomeTemplateWhatsApp } from '@/lib/sms/msg91-whatsapp';

export async function POST(req: NextRequest) {
    // ── Auth guard: require valid Supabase session ──
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // ── Parse body ──
    let body: {
        phone?: string;
        advisor_name?: string;
        advisor_mobile?: string;
        offer_month?: string;
        referral_link?: string;
    };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
    }

    const { phone, advisor_name, advisor_mobile, offer_month, referral_link } = body;

    // ── Validate required fields ──
    if (!phone?.trim()) {
        return NextResponse.json({ success: false, message: 'phone is required' }, { status: 400 });
    }
    if (!advisor_name?.trim()) {
        return NextResponse.json({ success: false, message: 'advisor_name is required' }, { status: 400 });
    }
    if (!advisor_mobile?.trim()) {
        return NextResponse.json({ success: false, message: 'advisor_mobile is required' }, { status: 400 });
    }
    if (!offer_month?.trim()) {
        return NextResponse.json({ success: false, message: 'offer_month is required' }, { status: 400 });
    }
    if (!referral_link?.trim()) {
        return NextResponse.json({ success: false, message: 'referral_link is required' }, { status: 400 });
    }

    // ── Forward to server-side MSG91 utility ──
    const result = await sendWelcomeTemplateWhatsApp({
        phone: phone.trim(),
        advisor_name: advisor_name.trim(),
        advisor_mobile: advisor_mobile.trim(),
        offer_month: offer_month.trim(),
        referral_link: referral_link.trim(),
    });

    if (!result.success) {
        // Distinguish configuration issues (503) from business logic errors (422)
        const isMisconfigured = result.message === 'WhatsApp service not configured';
        const status = isMisconfigured ? 503 : 422;
        return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: 200 });
}
