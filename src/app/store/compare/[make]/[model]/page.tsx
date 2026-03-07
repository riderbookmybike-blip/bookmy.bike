import { redirect } from 'next/navigation';

interface CompareModelPageProps {
    params: Promise<{ make: string; model: string }>;
}

export default async function CompareModelPage({ params }: CompareModelPageProps) {
    const resolved = await params;
    const search = new URLSearchParams({
        tab: 'variants',
        make: resolved.make,
        model: resolved.model,
    });
    redirect(`/store/compare?${search.toString()}`);
}
