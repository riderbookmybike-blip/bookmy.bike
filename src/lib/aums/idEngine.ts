export type IDType = 'QUOTE' | 'ORDER' | 'BOOKING' | 'INVOICE' | 'RECEIPT' | 'A_JOURNAL';

/**
 * Generates a human-readable, immutable display ID strictly following the format:
 * 9-character strictly random uppercase alphanumeric (e.g. A9F3QX7M2)
 * 
 * @param type IDType (Unused for generation, kept for signature compatibility if needed, or removed)
 * @returns Formatted ID string (e.g. A9F3QX7M2)
 */
export const generateDisplayId = (type: IDType, sequenceNumber?: number, locationCode?: string): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 9; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Validates if an ID matches the strict format format (9 chars alphanumeric)
 */
export const isValidDisplayId = (id: string, type: IDType): boolean => {
    // Strict 9-char alphanumeric check
    const regex = /^[A-Z0-9]{9}$/;
    return regex.test(id);
};
