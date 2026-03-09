import { NextRequest, NextResponse } from 'next/server';
import { shareLeadAccessAction } from '@/actions/crm';

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as {
            leadId?: string;
            targetTenantIds?: string[];
            note?: string;
        };

        const leadId = String(body?.leadId || '').trim();
        const targetTenantIds = Array.isArray(body?.targetTenantIds)
            ? body!.targetTenantIds.map(id => String(id || '').trim()).filter(Boolean)
            : [];
        const note = String(body?.note || '').trim();

        if (!leadId) {
            return NextResponse.json({ success: false, message: 'Lead ID is required.' }, { status: 400 });
        }
        if (targetTenantIds.length === 0) {
            return NextResponse.json({ success: false, message: 'Select at least one tenant.' }, { status: 400 });
        }

        const result = await shareLeadAccessAction({
            leadId,
            targetTenantIds,
            note,
        });

        if (!result?.success) {
            return NextResponse.json(
                { success: false, message: result?.message || 'Failed to share lead.' },
                { status: 400 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
