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

            <main className="flex-1" style={{ paddingTop: 'var(--header-h, 72px)' }}>
                <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-6 md:py-10">
                    <VahanTwoWheelerPage showUpload={false} title="Vahan Dashboard" dataApiPath="/api/vahan-2w" />
                </div>
            </main>

            <MarketplaceFooter />

            <LoginSidebar isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} variant="RETAIL" />
        </div>
    );
}
