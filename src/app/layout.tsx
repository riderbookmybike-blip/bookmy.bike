import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Bruno_Ace_SC } from 'next/font/google';
import './globals.css';

const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
    display: 'swap',
    preload: true,
});

const jetbrainsMono = JetBrains_Mono({
    variable: '--font-jetbrains-mono',
    subsets: ['latin'],
    display: 'swap',
});

const brunoAce = Bruno_Ace_SC({
    weight: '400',
    variable: '--font-bruno-ace',
    subsets: ['latin'],
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'BookMyBike - Buy Two-Wheelers Online',
    description:
        'The smartest way to buy your dream bike. Explore, compare, and book the best scooters and motorcycles with instant finance options.',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    viewportFit: 'cover',
};

import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { I18nProvider } from '@/components/providers/I18nProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { TenantProvider } from '@/lib/tenant/tenantContext';
import MSG91Initializer from '@/components/auth/MSG91Initializer';

import { Suspense } from 'react';
import AnalyticsProvider from '@/components/analytics/AnalyticsProvider';
import AnalyticsScripts from '@/components/analytics/AnalyticsScripts';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const themeBootstrapScript = `
(() => {
  try {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    root.dataset.theme = 'light';
    root.style.colorScheme = 'light';
    localStorage.setItem('theme', 'light');
  } catch (_) {}
})();
`;

// ── WhatsApp contact config ───────────────────────────────────────────────────
// TODO: replace WA_NUMBER with your actual WhatsApp business number (digits only, with country code)
const WA_NUMBER = '917447403491';
const WA_MESSAGE = encodeURIComponent('Hi! I need help with BookMyBike 🏍️');
const WA_HREF = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <script id="theme-bootstrap" dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
            </head>
            <body
                suppressHydrationWarning
                className={`${inter.variable} ${jetbrainsMono.variable} ${brunoAce.variable} antialiased font-sans bg-[var(--background)] text-[var(--foreground)]`}
            >
                <AnalyticsScripts />
                <ThemeProvider>
                    <I18nProvider>
                        <AuthProvider>
                            <TenantProvider>
                                <Suspense fallback={null}>
                                    <AnalyticsProvider>
                                        <MSG91Initializer />
                                        {children}
                                        <Toaster position="top-center" richColors />
                                    </AnalyticsProvider>
                                </Suspense>
                            </TenantProvider>
                        </AuthProvider>
                    </I18nProvider>
                </ThemeProvider>
                <Analytics />
                <SpeedInsights />

                {/* ── WhatsApp Contact Float ── */}
                <a
                    href={WA_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chat with us on WhatsApp"
                    className="wa-float"
                    style={{
                        position: 'fixed',
                        bottom: '84px',
                        right: '16px',
                        zIndex: 9998,
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        background: '#25D366',
                        boxShadow: '0 4px 20px rgba(37,211,102,0.55)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none',
                        flexShrink: 0,
                    }}
                >
                    <svg viewBox="0 0 32 32" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                        <path
                            fill="white"
                            d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.13 6.744 3.047 9.373L1.05 31.121l5.91-1.895A15.902 15.902 0 0 0 16.004 32C24.828 32 32 24.822 32 16S24.828 0 16.004 0zm9.284 22.59c-.384 1.082-1.91 1.98-3.123 2.242-.832.177-1.918.318-5.572-1.197-4.676-1.94-7.69-6.688-7.925-6.997-.226-.309-1.9-2.53-1.9-4.826 0-2.296 1.17-3.413 1.626-3.878.384-.392.876-.567 1.347-.567.163 0 .309.008.44.015.456.019.685.046.985.766.384.9 1.317 3.196 1.43 3.43.114.233.229.549.069.858-.152.317-.285.457-.518.725-.233.268-.454.473-.687.762-.213.254-.454.525-.185.981.27.448 1.196 1.968 2.563 3.188 1.762 1.57 3.196 2.067 3.703 2.283.38.163.83.12 1.107-.172.35-.376.783-.998 1.222-1.612.313-.44.706-.494 1.119-.34.42.147 2.705 1.275 3.168 1.508.463.233.77.345.883.54.112.194.112 1.124-.272 2.29z"
                        />
                    </svg>
                </a>
            </body>
        </html>
    );
}
