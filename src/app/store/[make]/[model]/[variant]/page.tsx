
import React from 'react';
import { Metadata } from 'next';
import { MOCK_VEHICLES } from '@/types/productMaster';
import { slugify } from '@/utils/slugs';
import { resolveLocation } from '@/utils/locationResolver';
import { computeOnRoadPrice } from '@/utils/priceCalculator';
import ProductClient from './ProductClient';

type Props = {
    params: Promise<{
        make: string;
        model: string;
        variant: string;
    }>;
    searchParams: Promise<{
        color?: string; // Still readable for SEO/Metadata
        pincode?: string;
    }>;
};

// Helper to find product
const findProductBySlug = (make: string, model: string, variant: string) => {
    return MOCK_VEHICLES.find(v =>
        slugify(v.make) === make &&
        slugify(v.model) === model &&
        slugify(v.variant) === variant
    );
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;

    const product = findProductBySlug(resolvedParams.make, resolvedParams.model, resolvedParams.variant);

    if (!product) {
        return { title: 'Machine Not Found' };
    }

    // Context Resolution
    const location = await resolveLocation(resolvedSearchParams.pincode || '');

    // SEO Truth (Canonical) - ALWAYS stripped of query params
    const canonicalUrl = `https://bookmy.bike/store/${resolvedParams.make}/${resolvedParams.model}/${resolvedParams.variant}`;

    // Indexing Rules
    // If pincode present -> noindex (prevent geo-duplication)
    // Else -> index
    const isNoIndex = !!resolvedSearchParams.pincode;

    // Dynamic Title/Description
    const locationSuffix = location ? ` in ${location.city}` : '';
    const title = `${product.make} ${product.model} (${product.variant}) Price${locationSuffix} - BookMyBike`;
    const description = `Get on-road price for ${product.make} ${product.model}${locationSuffix}. Book instantly online.`;

    const imageUrl = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2000&auto=format&fit=crop';

    return {
        title,
        description,
        alternates: {
            canonical: canonicalUrl,
        },
        robots: {
            index: !isNoIndex,
            follow: true,
        },
        openGraph: {
            title,
            description,
            images: [{ url: imageUrl }],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
        },
    };
}

export default async function Page({ params, searchParams }: Props) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;

    const product = findProductBySlug(resolvedParams.make, resolvedParams.model, resolvedParams.variant);

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-black italic">404</h1>
                    <p className="text-slate-400">Machine Not Found</p>
                </div>
            </div>
        );
    }

    // Resolve Price Context
    const location = await resolveLocation(resolvedSearchParams.pincode || '');
    // Assume base price is around 85000 for mock (or derive from product if available)
    const basePrice = 85000;
    const priceBreakdown = computeOnRoadPrice(basePrice, location);

    return (
        <ProductClient
            product={product}
            makeParam={resolvedParams.make}
            modelParam={resolvedParams.model}
            variantParam={resolvedParams.variant}
            // colorParam removed, Client uses useSearchParams
            initialLocation={location}
            initialPrice={priceBreakdown}
        />
    );
}
