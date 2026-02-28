import type { NextConfig } from 'next';

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
        ],
    },
    async headers() {
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
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
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
                headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
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
