import { NextRequest, NextResponse } from 'next/server';
import { checkQuickLeadContextAction } from '@/actions/crm';

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as {
            phone?: string;
            ownerTenantId?: string;
            selectedDealerId?: string;
        };

        const result = await checkQuickLeadContextAction({
            phone: String(body?.phone || ''),
            ownerTenantId: body?.ownerTenantId,
            selectedDealerId: body?.selectedDealerId,
        });

        if (!result?.success) {
            return NextResponse.json(
                { success: false, message: result?.message || 'Failed to check phone' },
                { status: 400 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
