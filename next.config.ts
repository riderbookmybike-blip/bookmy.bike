import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'aytdeqjxxjxbgiyslubx.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'www.heromotocorp.com',
            },
            {
                protocol: 'https',
                hostname: 'vespaindia.com',
            },
            {
                protocol: 'https',
                hostname: '**.tvsmotorcycle.com',
            },
            {
                protocol: 'https',
                hostname: '**.hondamotorcycle.co.in',
            },
            {
                protocol: 'https',
                hostname: '**.yamahamotorinddia.com',
            },
            {
                protocol: 'https',
                hostname: '**.bajajfinserv.in',
            },
            {
                protocol: 'https',
                hostname: 'cdni.iconscout.com',
            },
            {
                protocol: 'https',
                hostname: 'upload.wikimedia.org',
            },
            {
                protocol: 'https',
                hostname: '**.parivahan.gov.in',
            },
            {
                protocol: 'https',
                hostname: '**.shriramfinance.in',
            },
            {
                protocol: 'https',
                hostname: 'cdn.bajajauto.com',
            },
        ],
    },
    async headers() {
        if (isDev) {
            return [
                {
                    source: '/:path*',
                    headers: [
                        { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
                        { key: 'Pragma', value: 'no-cache' },
                        { key: 'Expires', value: '0' },
                    ],
                },
            ];
        }

        return [
            // Always fetch fresh HTML so users get the latest asset manifest after deploy.
            {
                source: '/:path*',
                has: [
                    {
                        type: 'header',
                        key: 'accept',
                        value: '.*text/html.*',
                    },
                ],
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' },
                    { key: 'Pragma', value: 'no-cache' },
                    { key: 'Expires', value: '0' },
                ],
            },
            // Keep Next.js build assets aggressively cached (fingerprinted filenames).
            {
                source: '/_next/static/:path*',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
            },
            // Optimized image responses can be safely cached for shorter window.
            {
                source: '/_next/image/:path*',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }],
            },
            // Public media assets should be long-cached.
            {
                source: '/images/:path*',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
            },
            {
                source: '/media/:path*',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
            },
        ];
    },
};

export default nextConfig;
