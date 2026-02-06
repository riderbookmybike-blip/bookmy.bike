export const formatDisplayId = (id?: string | null) => {
    if (!id) return '';
    const clean = id.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const padded = clean.padEnd(9, '0').slice(0, 9);
    return `${padded.slice(0, 3)}-${padded.slice(3, 6)}-${padded.slice(6, 9)}`;
};

export const generateDisplayId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 9; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return formatDisplayId(result);
};
