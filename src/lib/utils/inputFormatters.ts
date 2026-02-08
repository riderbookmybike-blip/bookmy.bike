import { normalizePhone } from './phoneUtils';

export const normalizeIndianPhone = (value: string) => {
    return normalizePhone(value);
};

const isValidDate = (year: number, month: number, day: number) => {
    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    const test = new Date(year, month - 1, day);
    return test.getFullYear() === year && test.getMonth() === month - 1 && test.getDate() === day;
};

export const parseDateToISO = (value: string) => {
    const raw = value.trim();
    if (!raw) return '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const [year, month, day] = raw.split('-').map(Number);
        return isValidDate(year, month, day) ? raw : '';
    }

    const match = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (match) {
        const day = Number(match[1]);
        const month = Number(match[2]);
        const year = Number(match[3]);
        if (!isValidDate(year, month, day)) return '';
        return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    const numeric = raw.replace(/\D/g, '');
    if (numeric.length === 8) {
        const d = Number(numeric.slice(0, 2));
        const m = Number(numeric.slice(2, 4));
        const y = Number(numeric.slice(4, 8));
        if (isValidDate(y, m, d)) {
            return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
    }

    return '';
};
