import { NextRequest, NextResponse } from 'next/server';
import { checkExistingCustomer, getMemberDocuments } from '@/actions/crm';

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as { phone?: string };
        const phone = String(body?.phone || '').trim();

        if (!phone) {
            return NextResponse.json({ success: false, message: 'Phone is required.' }, { status: 400 });
        }

        const result = await checkExistingCustomer(phone);
        const memberId = (result as any)?.memberId || null;
        let docCount = 0;
        if (memberId) {
            const docs = await getMemberDocuments(memberId);
            docCount = Array.isArray(docs) ? docs.length : 0;
        }

        return NextResponse.json({
            success: true,
            data: (result as any)?.data || null,
            memberId,
            hasActiveDelivery: Boolean((result as any)?.hasActiveDelivery),
            docCount,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
