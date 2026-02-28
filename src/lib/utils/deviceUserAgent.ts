const TV_USER_AGENT_REGEX =
    /\b(?:smarttv|google\s?tv|android\s?tv|appletv|hbbtv|crkey|tizen|web0s|webos|netcast|bravia|viera|roku|aft[a-z0-9]+|samsungbrowser|titanos|firebolt|comcastappplatform|hisense|sharp|sony|philips|panasonic|vizio|toshiba|mitv)\b|\b(?:TV|LargeScreen)\b/i;

const PHONE_USER_AGENT_REGEX = /\b(?:iphone|ipod|blackberry|bb10|windows phone|iemobile|opera mini|mobile safari)\b/i;

const ANDROID_REGEX = /\bandroid\b/i;
const MOBILE_TOKEN_REGEX = /\bmobile\b/i;

export function isTvUserAgent(userAgent: string): boolean {
    if (!userAgent) return false;
    // Standard TV regex check
    if (TV_USER_AGENT_REGEX.test(userAgent)) return true;

    // Special case for Android: TVs and Tablets usually don't have the "Mobile" token.
    // Handheld phones DO have "Mobile".
    const isAndroid = /\bandroid\b/i.test(userAgent);
    const isMobile = /\bmobile\b/i.test(userAgent);

    // If it's Android but NOT Mobile AND has a TV/LargeScreen token, it's a TV.
    // Pure Android-without-Mobile (Tablets) will return false here, allowing them to remain 'tablet' breakpoint.
    if (isAndroid && !isMobile && (TV_USER_AGENT_REGEX.test(userAgent) || userAgent.includes('Large Screen')))
        return true;

    return false;
}

export function isHandheldPhoneUserAgent(userAgent: string): boolean {
    if (!userAgent) return false;

    // TVs are NEVER handheld phones (prevents hydration mismatches/forced mobile on TV)
    if (isTvUserAgent(userAgent)) return false;

    if (PHONE_USER_AGENT_REGEX.test(userAgent)) return true;

    // Android phones include "Mobile"; Android TV/tablets generally do not.
    return ANDROID_REGEX.test(userAgent) && MOBILE_TOKEN_REGEX.test(userAgent);
}
