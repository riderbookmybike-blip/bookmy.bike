import type { Metadata } from 'next';

const toTitleCase = (str: string) =>
    str
        .split(/[\s-]+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

export async function generateMetadata({ params }: { params: Promise<{ make: string }> }): Promise<Metadata> {
    const { make } = await params;
    const brand = toTitleCase(make);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookmy.bike';
    const canonical = `/store/${make}`;
    const title = `${brand} Bikes & Scooters | BookMyBike`;
    const description = `Explore the complete ${brand} lineup. Compare variants, prices, and offers on BookMyBike.`;
    const ogImageUrl = `${baseUrl}/api/og?make=${make}`;

    return {
        title,
        description,
        alternates: { canonical },
        openGraph: {
            title,
            description,
            url: `${baseUrl}${canonical}`,
            siteName: 'BookMyBike',
            type: 'website',
            images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${brand} Bikes & Scooters` }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImageUrl],
        },
    };
}

export default function BrandLayout({ children }: { children: React.ReactNode }) {
    return children;
}
