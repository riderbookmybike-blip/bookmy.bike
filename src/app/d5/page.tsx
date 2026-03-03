import { isMobileDevice } from '@/lib/utils/device';
import StoreLayoutClient from '@/app/store/StoreLayoutClient';
import { StoreHomePage } from '@/components/store/mobile/StoreHomePage';

export default async function D5Page() {
    const isMobile = await isMobileDevice();
    const initialDevice = isMobile ? 'phone' : 'desktop';

    return (
        <StoreLayoutClient initialDevice={initialDevice}>
            <StoreHomePage heroImage="/images/wp3.jpg" initialDevice={initialDevice} />
        </StoreLayoutClient>
    );
}
