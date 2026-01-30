/**
 * Display ID Generator
 * 
 * Generates unique 9-character alphanumeric display IDs
 * Format: TTTTRRRRC (Timestamp + Random + Checksum)
 * 
 * Character Set: 23456789ABCDEFGHJKMNPQRSTUVWXYZ (33 chars)
 * Excludes confusing characters: 0, O, I, 1, L
 */

// Crockford Base32 alphabet (modified - excludes confusing chars)
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const BASE = ALPHABET.length; // 33

/**
 * Encode a number to base-33 string
 */
function encodeBase33(num: number, length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
        result = ALPHABET[num % BASE] + result;
        num = Math.floor(num / BASE);
    }
    return result;
}

/**
 * Decode a base-33 string to number
 */
function decodeBase33(str: string): number {
    let result = 0;
    for (let i = 0; i < str.length; i++) {
        result = result * BASE + ALPHABET.indexOf(str[i]);
    }
    return result;
}

/**
 * Generate timestamp component (4 chars)
 * Uses last 20 bits of Unix timestamp in seconds
 */
function generateTimestampComponent(): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const masked = timestamp & 0xFFFFF; // Last 20 bits (~12 days cycle)
    return encodeBase33(masked, 4);
}

/**
 * Generate random component (4 chars)
 * Cryptographically secure random
 */
function generateRandomComponent(): string {
    // Generate random number from 0 to 33^4 - 1
    const max = Math.pow(BASE, 4);
    const randomNum = Math.floor(Math.random() * max);
    return encodeBase33(randomNum, 4);
}

/**
 * Calculate checksum (Luhn-like algorithm)
 */
function calculateChecksum(str: string): string {
    let sum = 0;
    for (let i = 0; i < str.length; i++) {
        const value = ALPHABET.indexOf(str[i]);
        // Alternate multiplier (2x or 1x)
        const multiplier = (i % 2 === 0) ? 2 : 1;
        let product = value * multiplier;

        // If product > BASE, add digits
        if (product >= BASE) {
            product = Math.floor(product / BASE) + (product % BASE);
        }

        sum += product;
    }

    // Checksum is complement to make sum divisible by BASE
    const checkValue = (BASE - (sum % BASE)) % BASE;
    return ALPHABET[checkValue];
}

/**
 * Generate a new 9-character display ID
 * 
 * @returns {string} 9-character display ID (e.g., "2KX4H9M7A")
 */
export function generateDisplayId(): string {
    const timestamp = generateTimestampComponent(); // 4 chars
    const random = generateRandomComponent();       // 4 chars
    const base = timestamp + random;                // 8 chars
    const checksum = calculateChecksum(base);       // 1 char

    return base + checksum; // 9 chars total
}

/**
 * Validate a display ID
 * 
 * @param {string} id - Display ID to validate
 * @returns {boolean} True if valid
 */
export function validateDisplayId(id: string): boolean {
    // Check length
    if (id.length !== 9) return false;

    // Check characters
    for (const char of id) {
        if (!ALPHABET.includes(char)) return false;
    }

    // Verify checksum
    const base = id.substring(0, 8);
    const providedChecksum = id[8];
    const calculatedChecksum = calculateChecksum(base);

    return providedChecksum === calculatedChecksum;
}

/**
 * Parse display ID to extract timestamp
 * 
 * @param {string} id - Display ID
 * @returns {Date | null} Approximate creation date (within ~12 days)
 */
export function parseDisplayId(id: string): Date | null {
    if (!validateDisplayId(id)) return null;

    const timestampComponent = id.substring(0, 4);
    const maskedTimestamp = decodeBase33(timestampComponent);

    // This is approximate - we don't know which 12-day cycle
    // For display purposes only
    const now = Math.floor(Date.now() / 1000);
    const cycleLength = 0x100000; // 2^20 seconds (~12 days)

    // Find closest matching timestamp
    const currentMasked = now & 0xFFFFF;
    let estimatedTimestamp = now - currentMasked + maskedTimestamp;

    // If future, it's from previous cycle
    if (estimatedTimestamp > now) {
        estimatedTimestamp -= cycleLength;
    }

    return new Date(estimatedTimestamp * 1000);
}

/**
 * Generate display ID with retry logic to ensure uniqueness
 * 
 * @param {Function} checkExists - Function to check if ID exists in DB
 * @param {number} maxAttempts - Maximum retry attempts
 * @returns {Promise<string>} Unique display ID
 */
export async function generateUniqueDisplayId(
    checkExists: (id: string) => Promise<boolean>,
    maxAttempts: number = 5
): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const id = generateDisplayId();

        const exists = await checkExists(id);
        if (!exists) {
            return id;
        }
    }

    throw new Error('Failed to generate unique display ID after ' + maxAttempts + ' attempts');
}

/**
 * Format display ID for display with optional prefix
 * 
 * @param {string} id - Display ID
 * @param {string} prefix - Optional prefix (e.g., "LEAD", "QUOTE")
 * @returns {string} Formatted ID
 */
export function formatDisplayId(id: string, prefix?: string): string {
    if (prefix) {
        return `${prefix} #${id}`;
    }
    return id;
}

/**
 * Format display ID for UI display in XXX-XXX-XXX format
 * 
 * @param {string} id - Display ID (9 characters)
 * @param {string} prefix - Optional prefix
 * @returns {string} Formatted ID (e.g., "2KX-4H9-M7A" or "LEAD #2KX-4H9-M7A")
 */
export function formatDisplayIdForUI(id: string, prefix?: string): string {
    if (!id) return '';

    // If it's not the standard 9 chars, we still try to chunk it every 3
    let formatted = id;
    if (id.length >= 6) {
        // Match groups of 3 and join with dash
        const matches = id.match(/.{1,3}/g);
        formatted = matches ? matches.join('-') : id;
    }

    if (prefix) {
        return `${prefix} #${formatted}`;
    }

    return formatted;
}

/**
 * Remove formatting from display ID (XXX-XXX-XXX -> XXXXXXXXX)
 * 
 * @param {string} formatted - Formatted ID with dashes
 * @returns {string} Plain 9-character ID
 */
export function unformatDisplayId(formatted: string): string {
    return formatted.replace(/-/g, '').toUpperCase();
}

/**
 * Batch generate multiple unique IDs
 * 
 * @param {number} count - Number of IDs to generate
 * @param {Function} checkExists - Function to check existence
 * @returns {Promise<string[]>} Array of unique IDs
 */
export async function generateBatchDisplayIds(
    count: number,
    checkExists: (ids: string[]) => Promise<string[]> // Returns list of existing IDs
): Promise<string[]> {
    const ids = new Set<string>();

    // Generate initial batch with some buffer
    while (ids.size < count * 2) {
        ids.add(generateDisplayId());
    }

    // Check which ones exist
    const idsArray = Array.from(ids);
    const existingIds = await checkExists(idsArray);
    const existingSet = new Set(existingIds);

    // Filter out existing
    const uniqueIds = idsArray.filter(id => !existingSet.has(id));

    // Return requested count
    return uniqueIds.slice(0, count);
}
