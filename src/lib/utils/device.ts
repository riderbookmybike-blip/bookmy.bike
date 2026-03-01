import 'server-only';
import { headers } from 'next/headers';
import { isHandheldPhoneUserAgent, isTvUserAgent } from '@/lib/utils/deviceUserAgent';

/**
 * Parses the User-Agent header from the incoming request strictly on the server
 * to detect if the user relies on a handheld phone.
 * This eliminates client-side hydration flicker and properly serves SEO-friendly HTML.
 */
export async function isMobileDevice(): Promise<boolean> {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent');
    if (!userAgent) return false;

    return isHandheldPhoneUserAgent(userAgent);
}

/**
 * Returns the resolved device type ('phone' | 'desktop' | 'tv') for SSR.
 * Ensures TVs and large landscape devices are served the dedicated shell or optimized desktop.
 */
export async function getInitialDeviceType(): Promise<'phone' | 'desktop' | 'tv'> {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent');
    if (!userAgent) return 'desktop';
    if (isTvUserAgent(userAgent)) return 'tv';
    return isHandheldPhoneUserAgent(userAgent) ? 'phone' : 'desktop';
}
