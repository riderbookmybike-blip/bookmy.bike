import StorePage from './store/page';
import StoreLayoutClient from './store/StoreLayoutClient';
import { isMobileDevice } from '@/lib/utils/device';

export default async function RootPage() {
    const isMobile = await isMobileDevice();
    const initialDevice = isMobile ? 'phone' : 'desktop';

    return (
        <StoreLayoutClient initialDevice={initialDevice}>
            <StorePage />
        </StoreLayoutClient>
    );
}
