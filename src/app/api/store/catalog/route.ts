import { NextRequest, NextResponse } from 'next/server';
import { fetchCatalogV2 } from '@/lib/server/catalogFetcherV2';
import { normalizeStateCode } from '@/lib/server/pricingContext';
import type { ProductVariant } from '@/types/productMaster';

export async function GET(request: NextRequest) {
    try {
        const url = request.nextUrl;
        const state = url.searchParams.get('state');
        const district = url.searchParams.get('district');
        const leadId = url.searchParams.get('leadId');

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

        // Cache strategy:
        // - Generic requests (no district, no leadId) → public edge cache.
        //   Vercel CDN serves subsequent hits without touching the Supabase layer,
        //   eliminating TTFB variance on the 3-second background refresh.
        //   fetchCatalogV2 already holds the canonical data in tagged server cache;
        //   the edge s-maxage is a short-lived CDN layer on top.
        // - User-specific requests (district or leadId present) → private, no-store.
        //   Personalised pricing must never be served from a shared cache key.
        const isGeneric = !district && !leadId;
        if (isGeneric) {
            response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
        } else {
            response.headers.set('Cache-Control', 'private, no-store');
        }

        return response;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch catalog';
        return NextResponse.json({ products: [], error: message }, { status: 500 });
    }
}
