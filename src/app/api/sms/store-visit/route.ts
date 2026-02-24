import { NextRequest, NextResponse } from 'next/server';
import { sendStoreVisitSms } from '@/lib/sms/msg91';

/**
 * POST /api/sms/store-visit
 *
 * Sends the store-visit SMS to a customer via MSG91.
 * Used on quote share and other customer engagement events.
 *
 * Body: { phone: string, name: string, storeUrl?: string }
 */
export async function POST(req: NextRequest) {
    try {
        const { phone, name, storeUrl } = await req.json();

        if (!phone || !name) {
            return NextResponse.json({ success: false, message: 'phone and name required' }, { status: 400 });
        }

        const result = await sendStoreVisitSms({ phone, name, storeUrl });
        return NextResponse.json(result, { status: result.success ? 200 : 500 });
    } catch (error) {
        console.error('[API] store-visit SMS error:', error);
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
    }
}
