const TV_USER_AGENT_REGEX =
    /\b(?:smarttv|google\s?tv|android\s?tv|appletv|hbbtv|crkey|tizen|web0s|webos|netcast|bravia|viera|roku|aft[a-z0-9]+|samsungbrowser|titanos|firebolt|comcastappplatform)\b|\bTV\b/i;

const PHONE_USER_AGENT_REGEX = /\b(?:iphone|ipod|blackberry|bb10|windows phone|iemobile|opera mini|mobile safari)\b/i;

const ANDROID_REGEX = /\bandroid\b/i;
const MOBILE_TOKEN_REGEX = /\bmobile\b/i;

export function isTvUserAgent(userAgent: string): boolean {
    if (!userAgent) return false;
    return TV_USER_AGENT_REGEX.test(userAgent);
}

export function isHandheldPhoneUserAgent(userAgent: string): boolean {
    if (!userAgent) return false;
    if (isTvUserAgent(userAgent)) return false;

    if (PHONE_USER_AGENT_REGEX.test(userAgent)) return true;

    // Android phones include "Mobile"; Android TV/tablets generally do not.
    return ANDROID_REGEX.test(userAgent) && MOBILE_TOKEN_REGEX.test(userAgent);
}
