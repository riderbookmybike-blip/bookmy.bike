import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
    variable: '--font-jetbrains-mono',
    subsets: ['latin'],
});

import { headers } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
    const headersList = await headers();
    const host = headersList.get('host') || '';

    // Allow indexing ONLY for public domain
    const isPublicDomain = host === 'bookmy.bike' || host === 'www.bookmy.bike';

    return {
        title: 'BookMyBike - Buy Two-Wheelers Online',
        description:
            'The smartest way to buy your dream bike. Explore, compare, and book the best scooters and motorcycles with instant finance options.',
        robots: isPublicDomain ? { index: true, follow: true } : { index: false, follow: false },
    };
}

import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { TenantProvider } from '@/lib/tenant/tenantContext';
import MSG91Initializer from '@/components/auth/MSG91Initializer';
import { FaviconProvider } from '@/hooks/useFavicon';

import { Suspense } from 'react';
import AnalyticsProvider from '@/components/analytics/AnalyticsProvider';

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                suppressHydrationWarning
                className={`${inter.variable} ${jetbrainsMono.variable} antialiased font-sans bg-[var(--background)] text-[var(--foreground)]`}
            >
                <ThemeProvider>
                    <TenantProvider>
                        <Suspense fallback={null}>
                            <AnalyticsProvider>
                                <MSG91Initializer />
                                <FaviconProvider />
                                {children}
                            </AnalyticsProvider>
                        </Suspense>
                    </TenantProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
