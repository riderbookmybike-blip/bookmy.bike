import React from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { ColorProvider } from '@/contexts/ColorContext';

interface MobileLayoutProps {
    children: React.ReactNode;
    showHeader?: boolean;
    showBottomNav?: boolean;
    className?: string; // Allow custom classes like 'bg-black' or 'h-screen'
    navOverlay?: boolean;
}

export const MobileLayout = ({
    children,
    showHeader = true,
    showBottomNav = true,
    navOverlay = false,
    className = "min-h-screen bg-black"
}: MobileLayoutProps) => {
    return (
        <ColorProvider>
            <div className={className}>
                {showHeader && <MobileHeader />}

                {/* Content with padding for fixed header/nav */}
                <main className={`${showHeader ? 'pt-16' : ''} ${(showBottomNav && !navOverlay) ? 'pb-16' : ''} min-h-screen`}>
                    {children}
                </main>

                {showBottomNav && <MobileBottomNav />}
            </div>
        </ColorProvider>
    );
};
