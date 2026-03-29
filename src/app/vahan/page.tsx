'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import VahanTwoWheelerPage from '@/components/modules/reports/VahanTwoWheelerPage';
import { MarketplaceFooter } from '@/components/layout/MarketplaceFooter';
import { MarketplaceHeader } from '@/components/layout/MarketplaceHeader';

const LoginSidebar = dynamic(() => import('@/components/auth/LoginSidebar'), { ssr: false });

export default function PublicVahanDashboardPage() {
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100">
            <MarketplaceHeader onLoginClick={() => setIsLoginOpen(true)} />

            <main className="flex-1" style={{ paddingTop: 'var(--header-h)' }}>
                <VahanTwoWheelerPage showUpload={false} title="Vahan Dashboard" />
            </main>

            <MarketplaceFooter />

            <LoginSidebar isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} variant="RETAIL" />
        </div>
    );
}
