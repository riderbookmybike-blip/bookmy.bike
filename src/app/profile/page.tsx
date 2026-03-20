import { redirect } from 'next/navigation';

export default async function ProfilePage({ searchParams }: { searchParams?: { tab?: string } }) {
    const tab = String(searchParams?.tab || 'QUOTES').toUpperCase();
    redirect(`/store/ocircle?tab=${encodeURIComponent(tab)}`);
}
