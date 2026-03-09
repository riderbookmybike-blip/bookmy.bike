import { NextRequest, NextResponse } from 'next/server';
import { resolveLeadPincodeLocationAction } from '@/actions/crm';

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as { pincode?: string };
        const pincode = String(body?.pincode || '').trim();

        const result = await resolveLeadPincodeLocationAction(pincode);
        if (!result?.success) {
            return NextResponse.json(
                { success: false, message: result?.message || 'Failed to resolve pincode' },
                { status: 400 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
