import { NextRequest, NextResponse } from 'next/server';
import { resolveLeadReferrerAction } from '@/actions/crm';

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as {
            referralCode?: string;
            referralPhone?: string;
        };

        const result = await resolveLeadReferrerAction({
            referralCode: body?.referralCode,
            referralPhone: body?.referralPhone,
        });

        if (!result?.success) {
            return NextResponse.json(
                { success: false, message: result?.message || 'Failed to resolve referrer' },
                { status: 400 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
