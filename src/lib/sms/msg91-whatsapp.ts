/**
 * MSG91 WhatsApp Template Utility
 *
 * Sends the dossier quote template via MSG91 WhatsApp Business API.
 *
 * Template: bike_quote_summary (16 body variables + 1 document header)
 * Integrated Number: 917447403491
 * Namespace: f197f829_dfac_4dd3_8188_81021b01b37b
 *
 * ENV required:
 *   MSG91_AUTH_KEY                — your MSG91 auth key
 *   MSG91_WA_INTEGRATED_NUMBER   — WhatsApp number (default: 917447403491)
 *   MSG91_WA_TEMPLATE_NAME       — template name (default: bike_quote_summary)
 *   MSG91_WA_NAMESPACE           — template namespace (default: f197f829_dfac_4dd3_8188_81021b01b37b)
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
    const payload = {
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
                        components,
                    },
                ],
            },
        },
    };

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
            body: JSON.stringify(payload),
        });

        const text = await res.text();
        let resData: any = null;
        try {
            resData = text ? JSON.parse(text) : null;
        } catch {
            // non-JSON response
        }

        if (res.ok && (resData?.type === 'success' || resData?.status === 'success' || res.status === 200)) {
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
