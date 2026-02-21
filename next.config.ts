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
};

export default nextConfig;
