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

        // Cache-Control strategy for the Route Handler HTTP response:
        //
        // IMPORTANT: This Cache-Control header lives in Vercel's Edge CDN layer.
        // It is NOT tied to Next.js revalidateTag() — those only invalidate the
        // Next.js Data Cache (unstable_cache) layer inside fetchCatalogV2.
        //
        // Two-layer invalidation model:
        //   Layer 1 — Next.js Data Cache (fetchCatalogV2 / withCache):
        //     revalidate: false + tags:[catalog, catalog_global, catalog:state:MH]
        //     Invalidated by: revalidateTag(stateTag('MH')) etc. → immediate
        //   Layer 2 — Vercel Edge CDN (this header):
        //     Small s-maxage so the CDN entry expires naturally within 60s
        //     after a Layer 1 invalidation. Not tag-invalidated.
        //
        // Generic requests (no district, no leadId): short public CDN cache.
        // User-specific requests: never shared, always private/no-store.
        const isGeneric = !district && !leadId;
        if (isGeneric) {
            response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=60');
        } else {
            response.headers.set('Cache-Control', 'private, no-store');
        }

        return response;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch catalog';
        return NextResponse.json({ products: [], error: message }, { status: 500 });
    }
}
