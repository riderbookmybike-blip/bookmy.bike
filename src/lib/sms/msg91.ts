/**
 * MSG91 Transactional SMS Utility
 *
 * Sends templated SMS via MSG91 Flow API (transactional).
 * Template: "Dear ##var##, Thank you for visiting our store, please visit us at ##var## to explore our catalog and offers. Team Aapli"
 *
 * Sender ID:       AAPLI
 * DLT Template ID: 1707177194090847238
 *
 * ENV required:
 *   MSG91_AUTH_KEY             — your MSG91 auth key
 *   MSG91_SMS_TEMPLATE_ID      — MSG91 template/flow ID (default: 699dba0a261146848a022ba2)
 *   MSG91_DLT_TEMPLATE_ID      — DLT registered template ID (default: 1707177194090847238)
 *   STORE_URL                  — e.g. https://bookmy.bike/store  (fallback used if absent)
 */

const FLOW_API_URL = 'https://control.msg91.com/api/v5/flow/';
const DEFAULT_SMS_TEMPLATE_ID = '699dba0a261146848a022ba2';
const DEFAULT_DLT_TEMPLATE_ID = '1707177194090847238';
const SMS_DEDUPE_WINDOW_MS = 11_000;
const recentSmsRequests = new Map<string, number>();

/**
 * Sends the store-visit SMS to a customer.
 *
 * @param phone     — 10-digit Indian mobile number (or with country code)
 * @param name      — Customer's display name
 * @param storeUrl  — URL to include in the SMS (store catalog/offers link)
 */
export async function sendStoreVisitSms({
    phone,
    name,
    storeUrl,
}: {
    phone: string;
    name: string;
    storeUrl?: string;
}): Promise<{ success: boolean; message?: string }> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_SMS_TEMPLATE_ID || DEFAULT_SMS_TEMPLATE_ID;
    const dltTemplateId = process.env.MSG91_DLT_TEMPLATE_ID || DEFAULT_DLT_TEMPLATE_ID;

    if (!authKey || !templateId) {
        console.warn('[SMS] MSG91_AUTH_KEY or MSG91_SMS_TEMPLATE_ID not configured. Skipping SMS.');
        return { success: false, message: 'SMS service not configured' };
    }

    // Normalize phone to 91XXXXXXXXXX
    const digits = phone.replace(/\D/g, '');
    const tenDigit = digits.slice(-10);
    if (tenDigit.length < 10) {
        console.warn('[SMS] Invalid phone, skipping:', phone);
        return { success: false, message: 'Invalid phone number' };
    }
    const mobile = `91${tenDigit}`;

    // Use first name only to stay within DLT character limits
    const fullName = (name || '').trim();
    const firstName = fullName.split(/\s+/)[0] || 'Customer';
    const safeName = firstName.length > 30 ? firstName.slice(0, 30) : firstName;
    // DLT Variable 2 is registered as URL type — must include https://
    const url = (storeUrl || '').trim() || (process.env.STORE_URL || '').trim() || 'https://bookmy.bike/store';

    // Prevent duplicate sends within MSG91's duplicate detection window.
    const dedupeKey = `${templateId}:${mobile}:${safeName}:${url}`;
    const now = Date.now();
    for (const [key, ts] of recentSmsRequests) {
        if (now - ts > SMS_DEDUPE_WINDOW_MS * 2) recentSmsRequests.delete(key);
    }
    const lastSentAt = recentSmsRequests.get(dedupeKey);
    if (lastSentAt && now - lastSentAt < SMS_DEDUPE_WINDOW_MS) {
        console.warn(`[SMS] Duplicate SMS suppressed for ${mobile}`);
        return { success: true, message: 'Duplicate SMS suppressed' };
    }
    recentSmsRequests.set(dedupeKey, now);

    // MSG91 Flow API payload
    // The template has ##var1## and ##var2## placeholders:
    //   var1 = customer name
    //   var2 = store/dossier URL
    const payload = {
        flow_id: templateId,
        sender: 'AAPLI',
        template_id: dltTemplateId,
        mobiles: mobile,
        var1: safeName,
        var2: url,
    };

    try {
        console.log('[SMS] Payload →', {
            mobile,
            name: safeName,
            url,
            flow_id: templateId,
            dlt_template_id: dltTemplateId,
        });
        const res = await fetch(FLOW_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                authkey: authKey,
            },
            body: JSON.stringify(payload),
        });

        const text = await res.text();
        let data: any = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            // non-JSON response
        }

        if (res.ok && data?.type === 'success') {
            console.log(`[SMS] Store visit SMS sent to ${mobile}`);
            return { success: true };
        }

        console.error('[SMS] MSG91 Flow API error:', {
            status: res.status,
            response: data || text,
        });
        return { success: false, message: data?.message || 'SMS send failed' };
    } catch (error) {
        console.error('[SMS] Network error sending SMS:', error);
        return { success: false, message: 'SMS network error' };
    }
}
