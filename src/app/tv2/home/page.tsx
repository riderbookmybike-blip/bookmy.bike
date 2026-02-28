import StoreHomeClient from '@/app/store/StoreHomeClient';
import { fetchCatalogV2 } from '@/lib/server/catalogFetcherV2';

export default async function TV2HomePage() {
    const initialItems = await fetchCatalogV2('MH');
    return <StoreHomeClient initialItems={initialItems} initialDevice="desktop" />;
}
