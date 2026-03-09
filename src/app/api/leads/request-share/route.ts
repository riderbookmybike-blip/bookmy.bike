import { NextRequest, NextResponse } from 'next/server';
import { requestLeadShareAccessAction } from '@/actions/crm';

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as {
            leadId?: string;
            note?: string;
            requesterTenantId?: string;
        };

        const leadId = String(body?.leadId || '').trim();
        const note = String(body?.note || '').trim();
        const requesterTenantId = String(body?.requesterTenantId || '').trim() || undefined;

        if (!leadId) {
            return NextResponse.json({ success: false, message: 'Lead ID is required.' }, { status: 400 });
        }

        const result = await requestLeadShareAccessAction({
            leadId,
            note,
            requesterTenantId,
        });

        if (!result?.success) {
            return NextResponse.json(
                { success: false, message: result?.message || 'Failed to request share.' },
                { status: 400 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
