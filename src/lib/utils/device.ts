import { headers } from 'next/headers';

/**
 * Parses the User-Agent header from the incoming request strictly on the server
 * to detect if the user relies on a mobile device (phone or tablet).
 * This eliminates client-side hydration flicker and properly serves SEO-friendly HTML.
 */
export async function isMobileDevice(): Promise<boolean> {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent');
    if (!userAgent) return false;

    return Boolean(
        userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop|Windows Phone|webOS/i)
    );
}
