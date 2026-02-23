import { NextResponse } from 'next/server';
import { backfillLeadLocationsAction } from '@/actions/crm';

export async function POST() {
    try {
        const result = await backfillLeadLocationsAction();
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error?.message || 'Backfill failed' }, { status: 500 });
    }
}
