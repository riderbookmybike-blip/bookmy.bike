import SystemCatalogRouter from '@/app/store/catalog/SystemCatalogRouter';
import { fetchCatalogV2 } from '@/lib/server/catalogFetcherV2';

export default async function TV2CatalogPage() {
    const initialItems = await fetchCatalogV2('MH');
    return <SystemCatalogRouter initialItems={initialItems} mode="smart" initialDevice="desktop" />;
}
