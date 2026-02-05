import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Bruno_Ace_SC } from 'next/font/google';
import './globals.css';

const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
    variable: '--font-jetbrains-mono',
    subsets: ['latin'],
});

const brunoAce = Bruno_Ace_SC({
    weight: '400',
    variable: '--font-bruno-ace',
    subsets: ['latin'],
    display: 'swap',
});

import { headers } from 'next/headers';

export const metadata: Metadata = {
    title: 'BookMyBike - Buy Two-Wheelers Online',
    description:
        'The smartest way to buy your dream bike. Explore, compare, and book the best scooters and motorcycles with instant finance options.',
    // Robots configuration will be handled by robots.ts for host-based indexing
};

import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { I18nProvider } from '@/components/providers/I18nProvider';
import { TenantProvider } from '@/lib/tenant/tenantContext';
import MSG91Initializer from '@/components/auth/MSG91Initializer';
// import { FaviconProvider } from '@/hooks/useFavicon';

import { Suspense } from 'react';
import AnalyticsProvider from '@/components/analytics/AnalyticsProvider';
import AnalyticsScripts from '@/components/analytics/AnalyticsScripts';
import { Toaster } from 'sonner';

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                suppressHydrationWarning
                className={`${inter.variable} ${jetbrainsMono.variable} ${brunoAce.variable} antialiased font-sans bg-[var(--background)] text-[var(--foreground)]`}
            >
                <AnalyticsScripts />
                <ThemeProvider>
                    <I18nProvider>
                        <TenantProvider>
                            <Suspense fallback={null}>
                                <AnalyticsProvider>
                                    <MSG91Initializer />
                                    {/* <FaviconProvider /> */}
                                    {children}
                                    <Toaster position="top-center" richColors />
                                </AnalyticsProvider>
                            </Suspense>
                        </TenantProvider>
                    </I18nProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
