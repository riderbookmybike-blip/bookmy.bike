import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export default async function robots(): Promise<MetadataRoute.Robots> {
    const headersList = await headers();
    const host = headersList.get('host') || '';

    // Allow indexing for public domain and local development
    const isPublicDomain = host.includes('bookmy.bike') || host.includes('localhost');

    if (isPublicDomain) {
        return {
            rules: {
                userAgent: '*',
                allow: '/',
            },
            sitemap: `https://${host.includes('localhost') ? 'bookmy.bike' : host}/sitemap.xml`,
        };
    }

    return {
        rules: {
            userAgent: '*',
            disallow: '/',
        },
    };
}
