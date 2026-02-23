import { NextResponse } from 'next/server';
import { backfillLeadLocationsAction } from '@/actions/crm';
import { getErrorMessage } from '@/lib/utils/errorMessage';

export async function POST() {
    try {
        const result = await backfillLeadLocationsAction();
        return NextResponse.json(result);
    } catch (error: unknown) {
        return NextResponse.json(
            { success: false, message: getErrorMessage(error) || 'Backfill failed' },
            { status: 500 }
        );
    }
}
