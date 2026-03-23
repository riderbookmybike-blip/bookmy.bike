/**
 * MSG91 WhatsApp Template Utility
 *
 * Templates supported:
 *   1. bike_quote_summary — 16 body vars + document header (dossier quote)
 *   2. welcome            — 4 body vars + image header (onboarding welcome)
 *   3. Campaign templates — fixed-text or single-var bulk broadcast (sendCampaignBatchWhatsApp)
 *
 * Integrated Number: 917447403491
 * Namespace: f197f829_dfac_4dd3_8188_81021b01b37b
 *
 * ENV required:
 *   MSG91_AUTH_KEY                — your MSG91 auth key
 *   MSG91_WA_INTEGRATED_NUMBER   — WhatsApp number (default: 917447403491)
 *   MSG91_WA_TEMPLATE_NAME       — template name (default: bike_quote_summary)
 *   MSG91_WA_NAMESPACE           — template namespace (default: f197f829_dfac_4dd3_8188_81021b01b37b)
 *
 * welcome template ENV (optional overrides — defaults match above):
 *   MSG91_WA_WELCOME_TEMPLATE    — welcome template name (default: welcome)
 *
 * campaign template ENV:
 *   MSG91_WA_TEST_PHONE          — test recipient phone (10-digit or 91XXXXXXXXXX) for test batches
 */

const WA_API_URL = 'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/';
const DEFAULT_INTEGRATED_NUMBER = '917447403491';
const DEFAULT_TEMPLATE_NAME = 'bike_quote_summary';
const DEFAULT_NAMESPACE = 'f197f829_dfac_4dd3_8188_81021b01b37b';
const WA_DEDUPE_WINDOW_MS = 30_000;
const recentWaRequests = new Map<string, number>();

export interface QuoteWhatsAppData {
    phone: string;
    brand: string;
    model: string;
    variant: string;
    color: string;
    quoteId: string;
    exShowroom: string;
    rto: string;
    insurance: string;
    accessories: string;
    services: string;
    warranty: string;
    oCircleDiscount: string;
    onRoadPrice: string;
    youSave: string;
    oCircleCoins: string;
    dossierUrl: string;
    /** Optional: URL of the PDF/document to attach as header */
    documentUrl?: string;
    /** Optional: filename for the document header */
    documentFilename?: string;
}

export async function sendQuoteDossierWhatsApp(
    data: QuoteWhatsAppData
): Promise<{ success: boolean; message?: string }> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const integratedNumber = process.env.MSG91_WA_INTEGRATED_NUMBER || DEFAULT_INTEGRATED_NUMBER;
    const templateName = process.env.MSG91_WA_TEMPLATE_NAME || DEFAULT_TEMPLATE_NAME;
    const namespace = process.env.MSG91_WA_NAMESPACE || DEFAULT_NAMESPACE;

    if (!authKey) {
        console.warn('[WhatsApp] MSG91_AUTH_KEY not configured. Skipping WhatsApp.');
        return { success: false, message: 'WhatsApp service not configured' };
    }

    // Normalize phone to 91XXXXXXXXXX
    const digits = data.phone.replace(/\D/g, '');
    const tenDigit = digits.slice(-10);
    if (tenDigit.length < 10) {
        console.warn('[WhatsApp] Invalid phone, skipping:', data.phone);
        return { success: false, message: 'Invalid phone number' };
    }
    const mobile = `91${tenDigit}`;

    // Deduplicate
    const dedupeKey = `wa:${templateName}:${mobile}:${data.quoteId}`;
    const now = Date.now();
    for (const [key, ts] of recentWaRequests) {
        if (now - ts > WA_DEDUPE_WINDOW_MS * 2) recentWaRequests.delete(key);
    }
    const lastSentAt = recentWaRequests.get(dedupeKey);
    if (lastSentAt && now - lastSentAt < WA_DEDUPE_WINDOW_MS) {
        console.warn(`[WhatsApp] Duplicate suppressed for ${mobile}`);
        return { success: true, message: 'Duplicate WhatsApp suppressed' };
    }
    recentWaRequests.set(dedupeKey, now);

    // Build components
    const components: Record<string, { type: string; value: string; filename?: string }> = {
        body_1: { type: 'text', value: data.brand },
        body_2: { type: 'text', value: data.model },
        body_3: { type: 'text', value: data.variant },
        body_4: { type: 'text', value: data.color },
        body_5: { type: 'text', value: data.quoteId },
        body_6: { type: 'text', value: data.exShowroom },
        body_7: { type: 'text', value: data.rto },
        body_8: { type: 'text', value: data.insurance },
        body_9: { type: 'text', value: data.accessories },
        body_10: { type: 'text', value: data.services },
        body_11: { type: 'text', value: data.warranty },
        body_12: { type: 'text', value: data.oCircleDiscount },
        body_13: { type: 'text', value: data.onRoadPrice },
        body_14: { type: 'text', value: data.youSave },
        body_15: { type: 'text', value: data.oCircleCoins },
        body_16: { type: 'text', value: data.dossierUrl },
    };

    // Add document header if provided
    if (data.documentUrl) {
        components.header_1 = {
            type: 'document',
            value: data.documentUrl,
            filename: data.documentFilename || `BookMyBike_Quote_${data.quoteId}.pdf`,
        };
    }

    // MSG91 WhatsApp Template API payload (from curl)
    const buildPayload = (
        componentPayload: Record<string, { type: string; value: string; parameter_name?: string }>
    ) => ({
        integrated_number: integratedNumber,
        content_type: 'template',
        payload: {
            messaging_product: 'whatsapp',
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: 'en',
                    policy: 'deterministic',
                },
                namespace,
                to_and_components: [
                    {
                        to: [mobile],
                        components: componentPayload,
                    },
                ],
            },
        },
    });

    try {
        console.log('[WhatsApp] Sending dossier template →', {
            mobile,
            quoteId: data.quoteId,
            template: templateName,
            hasDocument: !!data.documentUrl,
        });

        const res = await fetch(WA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                authkey: authKey,
            },
            body: JSON.stringify(buildPayload(components)),
        });

        const text = await res.text();
        let resData: any = null;
        try {
            resData = text ? JSON.parse(text) : null;
        } catch {
            // non-JSON response
        }

        if (res.ok && (resData?.type === 'success' || resData?.status === 'success')) {
            console.log(`[WhatsApp] Dossier template sent to ${mobile}`);
            return { success: true };
        }

        console.error('[WhatsApp] MSG91 API error:', {
            status: res.status,
            response: resData || text,
        });
        return { success: false, message: resData?.message || 'WhatsApp send failed' };
    } catch (error) {
        console.error('[WhatsApp] Network error:', error);
        return { success: false, message: 'WhatsApp network error' };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Welcome Template Sender
// Templates: `welcome_en` | `welcome_hi` | `welcome_mr`
//
// Components (same structure across all languages):
//   body_name   — advisor name
//   body_phone  — advisor mobile (10-digit, normalized)
//   button_1    — referral link (url button variable)
//
// Language drives both template name suffix and language.code in the payload.
// ─────────────────────────────────────────────────────────────────────────────

const WA_WELCOME_DEDUPE_WINDOW_MS = 60_000;
const recentWelcomeRequests = new Map<string, number>();

export type WelcomeLanguage = 'en_GB' | 'hi' | 'mr';
const WELCOME_LANGUAGES: readonly WelcomeLanguage[] = ['en_GB', 'hi', 'mr'];
const WELCOME_TEMPLATE_SUFFIX_BY_LANGUAGE: Record<WelcomeLanguage, 'en' | 'hi' | 'mr'> = {
    en_GB: 'en',
    hi: 'hi',
    mr: 'mr',
};

export interface WelcomeWhatsAppData {
    /** Recipient 10-digit phone (will be normalized to 91XXXXXXXXXX) */
    phone: string;
    /** Signed-in advisor full name */
    advisor_name: string;
    /** Signed-in advisor phone (10-digit) */
    advisor_mobile: string;
    /**
     * Referral code only (e.g. '8UH-Q2M-9JY') — goes into button_1 (url button variable).
     * The base URL https://www.bookmy.bike/store?ref={{1}} is already set in the MSG91 template.
     * App only needs to send the variable value, NOT the full URL.
     */
    referral_code: string;
    /** Language selection: en_GB | hi | mr — determines template name + language code */
    language: WelcomeLanguage;
}

export interface WelcomeSendResult {
    success: boolean;
    message?: string;
    requestId?: string;
    providerStatus?: string;
    providerMessage?: string;
}

export async function sendWelcomeTemplateWhatsApp(data: WelcomeWhatsAppData): Promise<WelcomeSendResult> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const integratedNumber = process.env.MSG91_WA_INTEGRATED_NUMBER || DEFAULT_INTEGRATED_NUMBER;
    const namespace = process.env.MSG91_WA_NAMESPACE || DEFAULT_NAMESPACE;

    if (!authKey) {
        console.warn('[WhatsApp:welcome] MSG91_AUTH_KEY not configured. Skipping.');
        return { success: false, message: 'WhatsApp service not configured' };
    }

    // Validate language
    if (!WELCOME_LANGUAGES.includes(data.language)) {
        return { success: false, message: `Invalid language "${data.language}" — must be en_GB, hi, or mr` };
    }

    // Guard: required business variables
    if (!data.advisor_name?.trim()) {
        return { success: false, message: 'Advisor name missing — cannot send welcome' };
    }
    if (!data.advisor_mobile?.trim()) {
        return { success: false, message: 'Advisor mobile missing — cannot send welcome' };
    }
    if (!data.referral_code?.trim()) {
        return { success: false, message: 'Referral code missing — cannot send welcome' };
    }

    // Derive template name and language code from language selection
    const templateName = `welcome_${WELCOME_TEMPLATE_SUFFIX_BY_LANGUAGE[data.language]}`;
    const languageCode = data.language;

    // Normalize recipient phone → 91XXXXXXXXXX
    const digits = data.phone.replace(/\D/g, '');
    const tenDigit = digits.slice(-10);
    if (tenDigit.length < 10) {
        console.warn('[WhatsApp:welcome] Invalid phone:', data.phone);
        return { success: false, message: 'Invalid phone — must be 10 digits' };
    }
    const mobile = `91${tenDigit}`;

    // Normalize advisor mobile: keep last 10 digits
    const advisorDigits = data.advisor_mobile.replace(/\D/g, '');
    const advisorMobileClean = advisorDigits.slice(-10);

    // 60-second deduplicate guard per recipient
    const dedupeKey = `wa:welcome:${mobile}`;
    const now = Date.now();
    for (const [key, ts] of recentWelcomeRequests) {
        if (now - ts > WA_WELCOME_DEDUPE_WINDOW_MS * 2) recentWelcomeRequests.delete(key);
    }
    const lastSentAt = recentWelcomeRequests.get(dedupeKey);
    if (lastSentAt && now - lastSentAt < WA_WELCOME_DEDUPE_WINDOW_MS) {
        console.warn(`[WhatsApp:welcome] Duplicate suppressed for ${mobile}`);
        return { success: true, message: 'Duplicate WhatsApp suppressed', providerStatus: 'suppressed' };
    }

    // Components per confirmed MSG91 curl structure
    // button_1: URL button variable — template URL is https://www.bookmy.bike/store?ref={{1}}
    // Only the referral code is sent as the variable, NOT the full URL.
    const components: Record<string, { type: string; value: string; parameter_name?: string; subtype?: string }> = {
        body_name: {
            type: 'text',
            value: data.advisor_name.trim(),
            parameter_name: 'name',
        },
        body_phone: {
            type: 'text',
            value: advisorMobileClean,
            parameter_name: 'phone',
        },
        button_1: {
            subtype: 'url',
            type: 'text',
            value: data.referral_code.trim(),
        },
    };

    const payload = {
        integrated_number: integratedNumber,
        content_type: 'template',
        payload: {
            messaging_product: 'whatsapp',
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: languageCode,
                    policy: 'deterministic',
                },
                namespace,
                to_and_components: [
                    {
                        to: [mobile],
                        components,
                    },
                ],
            },
        },
    };

    try {
        console.log('[WhatsApp:welcome] Sending →', {
            mobile,
            template: templateName,
            language: languageCode,
            advisor: data.advisor_name,
        });

        const res = await fetch(WA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                authkey: authKey,
            },
            body: JSON.stringify(payload),
        });

        const text = await res.text();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let resData: any = null;
        try {
            resData = text ? JSON.parse(text) : null;
        } catch {
            // non-JSON response — handled below
        }

        if (res.ok && (resData?.type === 'success' || resData?.status === 'success')) {
            recentWelcomeRequests.set(dedupeKey, now);
            const requestId = typeof resData?.request_id === 'string' ? resData.request_id : undefined;
            console.log(`[WhatsApp:welcome] Sent to ${mobile}`, { requestId, template: templateName });
            return {
                success: true,
                requestId,
                providerStatus: String(resData?.status || resData?.type || 'success'),
                providerMessage: typeof resData?.data === 'string' ? resData.data : undefined,
            };
        }

        console.error('[WhatsApp:welcome] MSG91 API error:', { status: res.status, response: resData || text });
        return {
            success: false,
            message: resData?.message || resData?.errors || 'WhatsApp send failed',
            requestId: typeof resData?.request_id === 'string' ? resData.request_id : undefined,
            providerStatus: String(resData?.status || resData?.type || 'error'),
            providerMessage:
                typeof resData?.errors === 'string'
                    ? resData.errors
                    : typeof resData?.data === 'string'
                      ? resData.data
                      : undefined,
        };
    } catch (error) {
        console.error('[WhatsApp:welcome] Network error:', error);
        return { success: false, message: 'WhatsApp network error' };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Campaign Batch Sender
//
// Used by AUMS campaign execution page for controlled bulk rollout.
// Sends a fixed-body campaign template to all provided phone numbers.
// No existing flows are affected — this is a new additive export.
//
// Template must be pre-approved in MSG91 with no body variables
// (or pass an empty components map for fixed-text templates).
// ─────────────────────────────────────────────────────────────────────────────

export interface CampaignBatchResult {
    sent: number;
    failed: number;
    skipped: number;
    errors: Array<{ phone: string; message: string }>;
}

export async function sendCampaignBatchWhatsApp(
    phones: string[],
    templateName: string,
    /** Optional body variable overrides — leave empty for fixed-text templates */
    components: Record<string, { type: string; value: string; filename?: string }> = {}
): Promise<CampaignBatchResult> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const integratedNumber = process.env.MSG91_WA_INTEGRATED_NUMBER || DEFAULT_INTEGRATED_NUMBER;
    const namespace = process.env.MSG91_WA_NAMESPACE || DEFAULT_NAMESPACE;

    const result: CampaignBatchResult = { sent: 0, failed: 0, skipped: 0, errors: [] };

    if (!authKey) {
        console.warn('[WhatsApp:campaign] MSG91_AUTH_KEY not configured — batch skipped');
        result.skipped = phones.length;
        return result;
    }

    if (phones.length === 0) {
        return result;
    }

    // Normalize phones → 91XXXXXXXXXX; skip invalids
    const normalizedPhones: string[] = [];
    for (const phone of phones) {
        const digits = phone.replace(/\D/g, '');
        const tenDigit = digits.slice(-10);
        if (tenDigit.length < 10) {
            result.skipped++;
            result.errors.push({ phone, message: 'Invalid phone — skipped' });
            continue;
        }
        normalizedPhones.push(`91${tenDigit}`);
    }

    if (normalizedPhones.length === 0) {
        return result;
    }

    // Auto-attach image header for configured campaign templates (e.g. year ending sale).
    // This is required when MSG91 template header type is IMAGE.
    const imageHeaderTemplates = new Set(['year_ending_sale_activa_2026']);
    const headerImageUrl = process.env.MSG91_WA_CAMPAIGN_HEADER_IMAGE_URL?.trim();
    if (imageHeaderTemplates.has(templateName) && headerImageUrl) {
        components = {
            ...components,
            header_1: {
                type: 'image',
                value: headerImageUrl,
            },
        };
    }

    const payload = {
        integrated_number: integratedNumber,
        content_type: 'template',
        payload: {
            messaging_product: 'whatsapp',
            type: 'template',
            template: {
                name: templateName,
                language: { code: 'en', policy: 'deterministic' },
                namespace,
                to_and_components: [
                    {
                        to: normalizedPhones,
                        components,
                    },
                ],
            },
        },
    };

    try {
        console.log('[WhatsApp:campaign] Sending batch →', {
            template: templateName,
            count: normalizedPhones.length,
        });

        const res = await fetch(WA_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', authkey: authKey },
            body: JSON.stringify(payload),
        });

        const text = await res.text();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let resData: any = null;
        try {
            resData = text ? JSON.parse(text) : null;
        } catch {
            /* non-JSON */
        }

        if (res.ok && (resData?.type === 'success' || resData?.status === 'success')) {
            result.sent = normalizedPhones.length;
            console.log(`[WhatsApp:campaign] Batch sent: ${result.sent}`);
        } else {
            result.failed = normalizedPhones.length;
            const errMsg = resData?.message || resData?.errors || 'MSG91 batch error';
            console.error('[WhatsApp:campaign] Batch failed:', { status: res.status, response: resData || text });
            result.errors.push({ phone: 'batch', message: String(errMsg) });
        }
    } catch (error) {
        result.failed = normalizedPhones.length;
        const errMsg = error instanceof Error ? error.message : 'Network error';
        console.error('[WhatsApp:campaign] Network error:', error);
        result.errors.push({ phone: 'batch', message: errMsg });
    }

    return result;
}
