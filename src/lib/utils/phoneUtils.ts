export const normalizePhone = (input: string | null | undefined): string => {
    if (!input) return '';
    const digits = input.replace(/\D/g, '');
    if (digits.length <= 10) return digits;
    return digits.slice(-10);
};

export const formatPhone = (input: string | null | undefined, style: 'compact' | 'spaced' = 'spaced'): string => {
    const clean = normalizePhone(input);
    if (clean.length !== 10) return input || ''; // Return original if not valid 10 digits

    const p1 = clean.slice(0, 5);
    const p2 = clean.slice(5);

    if (style === 'compact') return `+91${clean}`;
    return `+91 ${p1} ${p2}`;
};

export const isValidPhone = (input: string | null | undefined): boolean => {
    const clean = normalizePhone(input);
    return clean.length === 10;
};

export const toAppStorageFormat = (input: string | null | undefined): string => {
    return normalizePhone(input);
};
