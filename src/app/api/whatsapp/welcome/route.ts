/**
 * POST /api/whatsapp/welcome
 *
 * Secure server-side route for sending the MSG91 `welcome_en|hi|mr` WhatsApp template.
 *
 * Auth: requires a valid Supabase session (JWT via cookie).
 *       Returns 401 if user is not authenticated.
 *
 * Body (JSON):
 *   {
 *     phone: string;          // recipient 10-digit phone
 *     advisor_name: string;   // signed-in user full name (body_name)
 *     advisor_mobile: string; // signed-in user phone (body_phone)
 *     referral_code: string;  // referral code only e.g. '8UH-Q2M-9JY' (button_1 url variable)
 *                             // Template URL https://www.bookmy.bike/store?ref={{1}} is set in MSG91
 *     language: 'en_GB'|'hi'|'mr'; // determines template name + language code
 *   }
 *
 * Returns: { success: boolean; message?: string; requestId?: string; providerStatus?: string; providerMessage?: string }
 *
 * ENV required (server-side only — never exposed to client):
 *   MSG91_AUTH_KEY
 *   MSG91_WA_INTEGRATED_NUMBER  (default: 917447403491)
 *   MSG91_WA_NAMESPACE           (default: f197f829_dfac_4dd3_8188_81021b01b37b)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWelcomeTemplateWhatsApp, type WelcomeLanguage } from '@/lib/sms/msg91-whatsapp';

const VALID_LANGUAGES: readonly WelcomeLanguage[] = ['en_GB', 'hi', 'mr'];

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
        referral_code?: string;
        language?: string;
    };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
    }

    const { phone, advisor_name, advisor_mobile, referral_code, language } = body;

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
    if (!referral_code?.trim()) {
        return NextResponse.json({ success: false, message: 'referral_code is required' }, { status: 400 });
    }
    if (!/^[A-Z0-9-]+$/.test(referral_code.trim())) {
        return NextResponse.json(
            { success: false, message: 'referral_code must be uppercase alphanumeric with hyphens (e.g. 8UH-Q2M-9JY)' },
            { status: 400 }
        );
    }
    if (!language || !VALID_LANGUAGES.includes(language as WelcomeLanguage)) {
        return NextResponse.json(
            { success: false, message: `language must be one of: ${VALID_LANGUAGES.join(', ')}` },
            { status: 400 }
        );
    }

    // ── Forward to server-side MSG91 utility ──
    const result = await sendWelcomeTemplateWhatsApp({
        phone: phone.trim(),
        advisor_name: advisor_name.trim(),
        advisor_mobile: advisor_mobile.trim(),
        referral_code: referral_code.trim(),
        language: language as WelcomeLanguage,
    });

    if (!result.success) {
        // Distinguish configuration issues (503) from business logic errors (422)
        const isMisconfigured = result.message === 'WhatsApp service not configured';
        const status = isMisconfigured ? 503 : 422;
        return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: 200 });
}
