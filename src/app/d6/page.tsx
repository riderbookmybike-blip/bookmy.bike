import { isMobileDevice } from '@/lib/utils/device';
import StoreLayoutClient from '@/app/store/StoreLayoutClient';
import { StoreHomePage } from '@/components/store/mobile/StoreHomePage';

export default async function D6Page() {
    const isMobile = await isMobileDevice();
    const initialDevice = isMobile ? 'phone' : 'desktop';

    return (
        <StoreLayoutClient initialDevice={initialDevice}>
            <StoreHomePage heroImage="/images/wp4.jpg" initialDevice={initialDevice} />
        </StoreLayoutClient>
    );
}
