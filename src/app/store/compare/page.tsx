import { redirect } from 'next/navigation';
import { resolveCompareTab } from '@/components/store/cards/vehicleModeConfig';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ComparePage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const rawTabParam = resolvedSearchParams.tab;
    const rawTab = Array.isArray(rawTabParam) ? rawTabParam[0] : rawTabParam || null;
    const nextTab = resolveCompareTab(rawTab, false);

    const nextSearch = new URLSearchParams();
    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
        if (key === 'tab' || value === undefined) return;
        if (Array.isArray(value)) {
            value.forEach(v => nextSearch.append(key, v));
            return;
        }
        nextSearch.set(key, value);
    });

    const query = nextSearch.toString();
    redirect(`/store/compare/${nextTab}${query ? `?${query}` : ''}`);
}
