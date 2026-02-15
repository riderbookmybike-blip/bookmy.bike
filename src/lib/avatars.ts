/**
 * Avatar system for BookMyBike marketplace.
 *
 * Provides deterministic colorful default avatars and curated preset options
 * so users without uploaded photos still get a premium visual identity.
 */

// ─── Gradient Palette ───────────────────────────────────────────────────────
// 12 vibrant gradient pairs that work on both light and dark backgrounds
const GRADIENT_PAIRS: [string, string][] = [
    ['#FF6B6B', '#EE5A24'], // Coral → Vermillion
    ['#A29BFE', '#6C5CE7'], // Lavender → Deep Purple
    ['#00B894', '#00CEC9'], // Emerald → Teal
    ['#FDCB6E', '#F39C12'], // Sunflower → Amber
    ['#FD79A8', '#E84393'], // Pink → Fuchsia
    ['#74B9FF', '#0984E3'], // Sky → Cobalt
    ['#55EFC4', '#00B894'], // Mint → Jade
    ['#FF7675', '#D63031'], // Salmon → Crimson
    ['#A3CB38', '#6AB04C'], // Lime → Forest
    ['#E17055', '#D35400'], // Peach → Burnt Orange
    ['#81ECEC', '#00CEC9'], // Ice → Cyan
    ['#DFE6E9', '#636E72'], // Silver → Graphite
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
 * Generates a deterministic, colorful SVG avatar for a user.
 * Same userId → always the same gradient + initial.
 */
export function getDefaultAvatar(userId: string, name?: string): string {
    const hash = simpleHash(userId || 'anonymous');
    const [from, to] = GRADIENT_PAIRS[hash % GRADIENT_PAIRS.length];
    const initial = (name?.[0] || 'U').toUpperCase();
    const angle = hash % 360;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${angle})">
        <stop offset="0%" stop-color="${from}"/>
        <stop offset="100%" stop-color="${to}"/>
      </linearGradient>
    </defs>
    <rect width="80" height="80" rx="40" fill="url(#g)"/>
    <text x="40" y="42" text-anchor="middle" dominant-baseline="central"
      font-family="system-ui,-apple-system,sans-serif"
      font-size="32" font-weight="800" fill="white" opacity="0.95">${initial}</text>
  </svg>`;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ─── Preset Avatars ─────────────────────────────────────────────────────────
/**
 * Curated preset avatar options. Each is a self-contained SVG data URI.
 * Grouped by style: geometric, abstract, bike-themed.
 */
function makePreset(id: string, label: string, from: string, to: string, pattern: string): AvatarPreset {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
    <defs>
      <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${from}"/>
        <stop offset="100%" stop-color="${to}"/>
      </linearGradient>
    </defs>
    <rect width="80" height="80" rx="40" fill="url(#pg)"/>
    ${pattern}
  </svg>`;

    return {
        id,
        label,
        url: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    };
}

export interface AvatarPreset {
    id: string;
    label: string;
    url: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
    // ── Geometric Abstract ──
    makePreset(
        'geo-rings',
        'Rings',
        '#6C5CE7',
        '#A29BFE',
        `<circle cx="40" cy="40" r="24" fill="none" stroke="white" stroke-width="2" opacity="0.4"/>
     <circle cx="40" cy="40" r="16" fill="none" stroke="white" stroke-width="2" opacity="0.3"/>
     <circle cx="40" cy="40" r="8" fill="white" opacity="0.25"/>`
    ),

    makePreset(
        'geo-diamond',
        'Diamond',
        '#00B894',
        '#00CEC9',
        `<rect x="28" y="28" width="24" height="24" rx="4" fill="white" opacity="0.25" transform="rotate(45 40 40)"/>
     <rect x="33" y="33" width="14" height="14" rx="2" fill="white" opacity="0.2" transform="rotate(45 40 40)"/>`
    ),

    makePreset(
        'geo-hex',
        'Hex',
        '#FDCB6E',
        '#F39C12',
        `<polygon points="40,18 58,29 58,51 40,62 22,51 22,29" fill="none" stroke="white" stroke-width="2" opacity="0.35"/>
     <polygon points="40,26 50,32 50,44 40,50 30,44 30,32" fill="white" opacity="0.2"/>`
    ),

    makePreset(
        'geo-star',
        'Star',
        '#FD79A8',
        '#E84393',
        `<polygon points="40,16 45,32 62,32 48,42 53,58 40,48 27,58 32,42 18,32 35,32" fill="white" opacity="0.25"/>`
    ),

    // ── Wave / Flow ──
    makePreset(
        'wave-tide',
        'Tide',
        '#74B9FF',
        '#0984E3',
        `<path d="M0,45 Q20,35 40,45 T80,45" fill="none" stroke="white" stroke-width="2.5" opacity="0.35"/>
     <path d="M0,55 Q20,45 40,55 T80,55" fill="none" stroke="white" stroke-width="2" opacity="0.25"/>`
    ),

    makePreset(
        'wave-sunset',
        'Sunset',
        '#E17055',
        '#D35400',
        `<circle cx="40" cy="32" r="10" fill="white" opacity="0.3"/>
     <path d="M10,50 Q25,40 40,50 T70,50" fill="white" opacity="0.2"/>`
    ),

    // ── Bike Themed ──
    makePreset(
        'bike-wheel',
        'Wheel',
        '#2D3436',
        '#636E72',
        `<circle cx="40" cy="40" r="18" fill="none" stroke="white" stroke-width="2.5" opacity="0.4"/>
     <circle cx="40" cy="40" r="5" fill="white" opacity="0.35"/>
     <line x1="40" y1="22" x2="40" y2="35" stroke="white" stroke-width="1.5" opacity="0.25"/>
     <line x1="40" y1="45" x2="40" y2="58" stroke="white" stroke-width="1.5" opacity="0.25"/>
     <line x1="22" y1="40" x2="35" y2="40" stroke="white" stroke-width="1.5" opacity="0.25"/>
     <line x1="45" y1="40" x2="58" y2="40" stroke="white" stroke-width="1.5" opacity="0.25"/>`
    ),

    makePreset(
        'bike-speed',
        'Speed',
        '#FF6B6B',
        '#EE5A24',
        `<line x1="15" y1="30" x2="55" y2="30" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.3"/>
     <line x1="20" y1="40" x2="65" y2="40" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
     <line x1="10" y1="50" x2="50" y2="50" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.25"/>`
    ),

    // ── Minimal Abstract ──
    makePreset(
        'abs-dots',
        'Dots',
        '#55EFC4',
        '#00B894',
        `<circle cx="28" cy="28" r="5" fill="white" opacity="0.35"/>
     <circle cx="52" cy="28" r="5" fill="white" opacity="0.25"/>
     <circle cx="40" cy="48" r="5" fill="white" opacity="0.3"/>`
    ),

    makePreset(
        'abs-slash',
        'Slash',
        '#A3CB38',
        '#6AB04C',
        `<line x1="25" y1="60" x2="55" y2="20" stroke="white" stroke-width="4" stroke-linecap="round" opacity="0.35"/>
     <line x1="30" y1="60" x2="60" y2="20" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.2"/>`
    ),

    makePreset(
        'abs-grid',
        'Grid',
        '#81ECEC',
        '#00CEC9',
        `<rect x="22" y="22" width="14" height="14" rx="3" fill="white" opacity="0.25"/>
     <rect x="44" y="22" width="14" height="14" rx="3" fill="white" opacity="0.2"/>
     <rect x="22" y="44" width="14" height="14" rx="3" fill="white" opacity="0.2"/>
     <rect x="44" y="44" width="14" height="14" rx="3" fill="white" opacity="0.3"/>`
    ),

    makePreset(
        'abs-crescent',
        'Moon',
        '#DFE6E9',
        '#636E72',
        `<circle cx="35" cy="38" r="16" fill="white" opacity="0.3"/>
     <circle cx="42" cy="34" r="14" fill="url(#pg)"/>`
    ),
];

/**
 * Check if a given URL is one of the built-in preset avatars.
 */
export function isPresetAvatar(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.startsWith('data:image/svg+xml,');
}
