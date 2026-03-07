import { NextRequest, NextResponse } from 'next/server';
import { fetchCatalogV2 } from '@/lib/server/catalogFetcherV2';
import { resolvePricingContext } from '@/lib/server/pricingContext';
import { getDealerDelta } from '@/lib/server/storeSot';
import { adminClient } from '@/lib/supabase/admin';
import type { ProductVariant } from '@/types/productMaster';

export async function GET(request: NextRequest) {
    try {
        const leadId = request.nextUrl.searchParams.get('leadId') || request.nextUrl.searchParams.get('lead_id');
        const dealerId = request.nextUrl.searchParams.get('dealerId') || request.nextUrl.searchParams.get('dealer_id');
        const district = request.nextUrl.searchParams.get('district');
        const state = request.nextUrl.searchParams.get('state');
        const studio = request.nextUrl.searchParams.get('studio');

        const context = await resolvePricingContext({
            leadId: leadId || null,
            dealerId: dealerId || null,
            district: district || null,
            state: state || null,
            studio: studio || null,
        });

        const stateCode = context.stateCode.trim().toUpperCase();
        const products = await fetchCatalogV2(stateCode);

        let resolvedStudioId: string | null = null;
        if (context.dealerId) {
            const { data: dealerInfo } = await adminClient
                .from('id_tenants')
                .select('studio_id')
                .eq('id', context.dealerId)
                .maybeSingle();
            resolvedStudioId = dealerInfo?.studio_id || null;
        }

        const skuIds = Array.from(
            new Set(
                products
                    .map(item => item.availableColors?.[0]?.id || item.skuIds?.[0])
                    .filter((id): id is string => Boolean(id))
            )
        );

        let offerMap = new Map<string, number>();
        if (context.dealerId && skuIds.length > 0) {
            const { vehicleOffers } = await getDealerDelta({
                dealerId: context.dealerId,
                stateCode,
                skuIds,
            });
            offerMap = new Map(Object.entries(vehicleOffers || {}));
        }

        const hydratedProducts: ProductVariant[] = products.map(item => {
            const primarySkuId = item.availableColors?.[0]?.id || item.skuIds?.[0];
            const offerDelta = primarySkuId ? Number(offerMap.get(primarySkuId) || 0) : 0;
            const onRoad = Number(item.price?.onRoad || 0);
            const offerPrice = onRoad + offerDelta;

            return {
                ...item,
                dealerId: context.dealerId || item.dealerId,
                studioName: context.tenantName || item.studioName,
                studioCode: resolvedStudioId || item.studioCode,
                dealerLocation: context.district || item.dealerLocation,
                price: {
                    ...item.price,
                    offerPrice: offerDelta !== 0 ? offerPrice : item.price?.offerPrice,
                    discount: offerDelta !== 0 ? -offerDelta : item.price?.discount,
                    totalSavings: offerDelta < 0 ? Math.max(0, -offerDelta) : item.price?.totalSavings,
                    pricingSource: [context.district || 'ALL', stateCode].join(', '),
                    isEstimate: false,
                },
            };
        });

        const response = NextResponse.json({
            products: hydratedProducts,
            context: {
                dealerId: context.dealerId,
                dealerName: context.tenantName,
                studioId: resolvedStudioId,
                district: context.district,
                stateCode,
                source: context.source,
            },
        });

        // Cache only generalized catalog queries. Lead/dealer-specific snapshots stay uncached.
        const isGeneralCatalog = !leadId && !dealerId && !studio;
        response.headers.set(
            'Cache-Control',
            isGeneralCatalog
                ? 'public, s-maxage=60, stale-while-revalidate=300'
                : 'private, no-cache, no-store, must-revalidate'
        );

        return response;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch catalog';
        return NextResponse.json({ products: [], error: message }, { status: 500 });
    }
}
