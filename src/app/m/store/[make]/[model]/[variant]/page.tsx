import { MobileLayout } from '@/components/mobile/layout/MobileLayout';
import { MobilePDP } from '@/components/mobile/pdp/MobilePDP';

interface PageProps {
    params: Promise<{
        make: string;
        model: string;
        variant: string;
    }>;
}

export default async function MobilePDPPage({ params }: PageProps) {
    const resolvedParams = await params;

    return (
        <MobileLayout>
            <MobilePDP
                make={resolvedParams.make}
                model={resolvedParams.model}
                variant={resolvedParams.variant}
            />
        </MobileLayout>
    );
}
