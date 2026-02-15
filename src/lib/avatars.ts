/**
 * Avatar system for BookMyBike marketplace.
 *
 * Uses bike-themed images as default avatars and preset options.
 * Users without uploaded photos get a deterministic bike avatar.
 */

// ─── Default Avatar Images ─────────────────────────────────────────────────
// Bike-themed images served from /media/avatars/
const DEFAULT_AVATARS = [
    '/media/avatars/rider-sunset.png',
    '/media/avatars/sportbike-blue.png',
    '/media/avatars/helmet-gold.png',
    '/media/avatars/cruiser-purple.png',
    '/media/avatars/speedometer-red.png',
    '/media/avatars/helmet-neon.png',
];

// ─── Hash helper ────────────────────────────────────────────────────────────
function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0; // i32
    }
    return Math.abs(hash);
}

// ─── Default Avatar Generator ───────────────────────────────────────────────
/**
 * Returns a deterministic bike-themed avatar image for a user.
 * Same userId → always the same image (no randomness per session).
 */
export function getDefaultAvatar(userId: string, _name?: string): string {
    const hash = simpleHash(userId || 'anonymous');
    return DEFAULT_AVATARS[hash % DEFAULT_AVATARS.length];
}

// ─── Preset Avatars ─────────────────────────────────────────────────────────
export interface AvatarPreset {
    id: string;
    label: string;
    url: string;
}

/**
 * Curated preset avatar options — bike-themed images.
 * These are what users see in the "Change Avatar" picker.
 */
export const AVATAR_PRESETS: AvatarPreset[] = [
    { id: 'rider-sunset', label: 'Rider', url: '/media/avatars/rider-sunset.png' },
    { id: 'sportbike-blue', label: 'Sportbike', url: '/media/avatars/sportbike-blue.png' },
    { id: 'helmet-gold', label: 'Helmet', url: '/media/avatars/helmet-gold.png' },
    { id: 'cruiser-purple', label: 'Cruiser', url: '/media/avatars/cruiser-purple.png' },
    { id: 'speedometer-red', label: 'Speedo', url: '/media/avatars/speedometer-red.png' },
    { id: 'helmet-neon', label: 'Neon', url: '/media/avatars/helmet-neon.png' },
];

/**
 * Check if a given URL is one of the built-in preset avatars.
 */
export function isPresetAvatar(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.startsWith('/media/avatars/') || url.startsWith('data:image/svg+xml,');
}
