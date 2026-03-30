import { NextResponse } from 'next/server';
import { DEFAULT_STATE_CODE, getServiceableRegions } from '@/lib/server/winnerResolver';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const stateCode = String(url.searchParams.get('stateCode') || DEFAULT_STATE_CODE)
        .trim()
        .toUpperCase();

    const rows = await getServiceableRegions(stateCode);
    const regions = Array.from(
        new Set(
            (rows || [])
                .map(r => String(r?.region || '').trim())
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b))
        )
    );

    return NextResponse.json({ stateCode, regions }, { headers: { 'Cache-Control': 'no-store' } });
}
