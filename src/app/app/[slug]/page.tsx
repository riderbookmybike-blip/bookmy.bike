import { redirect } from 'next/navigation';

export default async function TenantRoot({ params }: { params: Promise<{ slug: string }> }) {
    // Redirect /app/{slug} → /app/{slug}/dashboard
    const { slug } = await params;
    redirect(`/app/${slug}/dashboard`);
}
