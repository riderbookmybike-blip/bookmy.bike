import type { Metadata } from 'next';

const toTitleCase = (str: string) =>
    str
        .split(/[\s-]+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

export async function generateMetadata({
    params,
}: {
    params: Promise<{ make: string; model: string }>;
}): Promise<Metadata> {
    const { make, model } = await params;
    const brand = toTitleCase(make);
    const modelName = toTitleCase(model);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookmy.bike';
    const canonical = `/store/${make}/${model}`;
    const title = `${brand} ${modelName} Variants | BookMyBike`;
    const description = `Browse ${brand} ${modelName} variants, colors, and prices. Compare offers and book online.`;

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
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    };
}

export default function ModelLayout({ children }: { children: React.ReactNode }) {
    return children;
}
