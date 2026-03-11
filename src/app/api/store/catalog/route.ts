import { NextRequest, NextResponse } from 'next/server';
import { fetchCatalogV2 } from '@/lib/server/catalogFetcherV2';
import { normalizeStateCode } from '@/lib/server/pricingContext';
import type { ProductVariant } from '@/types/productMaster';

export async function GET(request: NextRequest) {
    try {
        const state = request.nextUrl.searchParams.get('state');

        // Uniform Offer SOT: Catalog is state-SOT only.
        // No dealer resolution and no location/dealer hydration on catalog path.
        const stateCode = normalizeStateCode(state, null);
        const products = await fetchCatalogV2(stateCode);

        const hydratedProducts: ProductVariant[] = products.map(item => {
            return {
                ...item,
                dealerId: undefined,
                studioName: undefined,
                studioCode: undefined,
                dealerLocation: undefined,
                price: {
                    ...item.price,
                    offerPrice: undefined,
                    discount: undefined,
                    totalSavings: undefined,
                    pricingSource: `STATE:${stateCode}`,
                    isEstimate: true,
                },
            };
        });

        const response = NextResponse.json({
            products: hydratedProducts,
            context: {
                dealerId: null,
                dealerName: null,
                studioId: null,
                district: null,
                stateCode,
                source: 'STATE_SOT',
            },
        });

        // Do not edge-cache this API response aggressively.
        // State catalog caching is handled in tagged server cache (fetchCatalogV2),
        // which can be manually invalidated from AUMS trigger.
        response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');

        return response;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch catalog';
        return NextResponse.json({ products: [], error: message }, { status: 500 });
    }
}
