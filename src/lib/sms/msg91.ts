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
 *   MSG91_AUTH_KEY         — your MSG91 auth key
 *   MSG91_SMS_TEMPLATE_ID  — MSG91 template/flow ID (default: 699dba0a261146848a022ba2)
 *   STORE_URL              — e.g. https://bookmy.bike/store  (fallback used if absent)
 */

const FLOW_API_URL = 'https://control.msg91.com/api/v5/flow/';
const DEFAULT_SMS_TEMPLATE_ID = '699dba0a261146848a022ba2';

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

    // Resolve store URL
    const url = storeUrl || process.env.STORE_URL || 'https://bookmy.bike/store';

    // MSG91 Flow API payload
    // The template has two ##var## placeholders:
    //   1st = customer name
    //   2nd = store URL
    const payload = {
        flow_id: templateId,
        sender: 'AAPLI',
        mobiles: mobile,
        VAR1: name || 'Customer',
        VAR2: url,
    };

    try {
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
