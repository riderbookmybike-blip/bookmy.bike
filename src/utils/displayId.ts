const SAFE_CHARS = 'ABCDEFGHJKMNPRTUVWXY346789';

/**
 * Generates a random 9-character alphanumeric ID for display purposes.
 * Uses a safe character set (excluding confusing characters like I, O, S, Z).
 * Format: 9 characters, uppercase.
 * Example: A3R9XYN4M
 */
export function generateDisplayId(): string {
    let id = '';
    for (let i = 0; i < 9; i++) {
        id += SAFE_CHARS.charAt(
            Math.floor(Math.random() * SAFE_CHARS.length)
        );
    }
    return id;
}
