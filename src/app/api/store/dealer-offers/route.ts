import { NextRequest, NextResponse } from 'next/server';
import { getDealerDelta } from '@/lib/server/storeSot';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const dealerId = String(body?.dealerId || '').trim();
        const stateCode = String(body?.stateCode || '')
            .trim()
            .toUpperCase();
        const skuIds = Array.from(
            new Set((body?.skuIds || []).map((id: unknown) => String(id || '').trim()).filter(Boolean))
        ) as string[];

        if (!dealerId || !stateCode || skuIds.length === 0) {
            return NextResponse.json({ offers: [] });
        }

        const { vehicleOffers } = await getDealerDelta({
            dealerId,
            stateCode,
            skuIds,
        });

        const offers = skuIds
            .map(skuId => {
                const offer = vehicleOffers[skuId];
                if (offer === undefined || offer === null) return null;
                return {
                    vehicle_color_id: skuId,
                    best_offer: Number(offer || 0),
                };
            })
            .filter(Boolean);

        return NextResponse.json({ offers });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch dealer offers';
        return NextResponse.json({ offers: [], error: message }, { status: 500 });
    }
}
