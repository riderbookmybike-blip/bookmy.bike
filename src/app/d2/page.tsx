import { isMobileDevice } from '@/lib/utils/device';
import StoreLayoutClient from '@/app/store/StoreLayoutClient';
import { M2Home } from '@/components/store/mobile/M2Home';

export default async function D2Page() {
    const isMobile = await isMobileDevice();
    const initialDevice = isMobile ? 'phone' : 'desktop';

    return (
        <StoreLayoutClient initialDevice={initialDevice}>
            <M2Home heroImage="/images/m2_hero_rider_v6_hd.jpg" initialDevice={initialDevice} />
        </StoreLayoutClient>
    );
}
