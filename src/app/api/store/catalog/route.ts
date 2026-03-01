import { NextRequest, NextResponse } from 'next/server';
import { fetchCatalogV2 } from '@/lib/server/catalogFetcherV2';

export async function GET(request: NextRequest) {
    try {
        const stateCode = (request.nextUrl.searchParams.get('state') || 'MH').trim().toUpperCase();
        const products = await fetchCatalogV2(stateCode);
        return NextResponse.json({ products });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch catalog';
        return NextResponse.json({ products: [], error: message }, { status: 500 });
    }
}
