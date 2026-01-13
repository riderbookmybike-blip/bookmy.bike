import { redirect } from 'next/navigation';

export default function TenantRoot({ params }: { params: { slug: string } }) {
    // Redirect /app/{slug} → /app/{slug}/dashboard
    redirect(`/app/${params.slug}/dashboard`);
}
