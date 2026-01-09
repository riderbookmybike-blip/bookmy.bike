import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export default async function robots(): Promise<MetadataRoute.Robots> {
    const headersList = await headers();
    const host = headersList.get('host') || '';

    // Public domain allows indexing
    const isPublicDomain = host === 'bookmy.bike' || host === 'www.bookmy.bike';

    if (isPublicDomain) {
        return {
            rules: {
                userAgent: '*',
                allow: '/',
                disallow: '/dashboard/', // Even on public site, don't index dashboard if it exists there
            },
            sitemap: `https://${host}/sitemap.xml`,
        };
    }

    // ALL Subdomains (Internal & Partners) -> Block Everything
    return {
        rules: {
            userAgent: '*',
            disallow: '/',
        },
    };
}
