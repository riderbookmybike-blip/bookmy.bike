import { MetadataRoute } from 'next';
import { getSitemapData } from '@/lib/server/sitemapFetcher';

// Revalidate once per day (86400 seconds)
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_ROOT_DOMAIN
        ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
        : 'https://bookmy.bike';

    // Static pages
    const staticPages = ['', '/landing', '/blog', '/store/favorites', '/store/compare'].map(route => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Fetch dynamic data from database
    const { brands, families } = await getSitemapData();

    // 1. Brand pages
    const brandRoutes = (brands || []).map(b => ({
        url: `${baseUrl}/store/${b.name.toLowerCase().replace(/\s+/g, '-')}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
    }));

    // 2. Family & Variant pages
    const productRoutes: any[] = [];
    families?.forEach(family => {
        const brandSlug = (family.brand as any)?.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown';
        const modelSlug = family.slug || family.name.toLowerCase().replace(/\s+/g, '-');

        // Add Family page (Model overview)
        productRoutes.push({
            url: `${baseUrl}/store/${brandSlug}/${modelSlug}`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.6,
        });

        // Add each Variant page
        (family.variants as any)?.forEach((variant: any) => {
            const variantSlug = variant.slug || variant.name.toLowerCase().replace(/\s+/g, '-');
            productRoutes.push({
                url: `${baseUrl}/store/${brandSlug}/${modelSlug}/${variantSlug}`,
                lastModified: new Date(),
                changeFrequency: 'daily' as const,
                priority: 0.6,
            });
        });
    });

    return [...staticPages, ...brandRoutes, ...productRoutes];
}
