import { NextRequest, NextResponse } from 'next/server';
import { resolvePricingContext } from '@/lib/server/pricingContext';
import { applyApiGuard } from '@/lib/server/apiGuard';

export async function POST(request: NextRequest) {
    const blocked = applyApiGuard(request, { maxRequests: 30 });
    if (blocked) return blocked;

    try {
        const params = await request.json();
        const context = await resolvePricingContext({
            leadId: params?.leadId || null,
            dealerId: params?.dealerId || null,
            state: params?.state || null,
            studio: params?.studio || null,
        });
        return NextResponse.json(context);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to resolve pricing context';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
