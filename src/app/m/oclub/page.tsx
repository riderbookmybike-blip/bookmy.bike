'use client';

import { MobileLayout } from '@/components/mobile/layout/MobileLayout';
import { OClubDashboard } from '@/components/mobile/oclub/OClubDashboard';

export default function OClubPage() {
    return (
        <MobileLayout>
            <OClubDashboard />
        </MobileLayout>
    );
}
