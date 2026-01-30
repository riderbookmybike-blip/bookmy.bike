import { MobileContextFeed } from '@/components/mobile/feed/MobileContextFeed';
import { MobileBottomNav } from '@/components/mobile/layout/MobileBottomNav';
import { Suspense } from 'react';

function HomeContent() {
    return (
        <div className="bg-black min-h-screen">
            {/* Feed IS the page content */}
            <MobileContextFeed />

            {/* Dedicated Radical Nav */}
            <MobileBottomNav />
        </div>
    );
}

export default function MobileHomePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <HomeContent />
        </Suspense>
    );
}
