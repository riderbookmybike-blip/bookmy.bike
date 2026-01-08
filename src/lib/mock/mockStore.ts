'use client';

/**
 * Mock Data Store
 * Persists generated mock data to localStorage to ensure Display IDs remain stable across reloads.
 * This is critical for the "Global Display ID" system QA and piloting.
 */

export const mockStore = {
    /**
     * Get data from localStorage or generate it if missing.
     * @param key Unique key for the module (e.g., 'mock_leads', 'mock_invoices')
     * @param generator Function that returns the initial array of data
     * @returns The persisted or newly generated data array
     */
    getOrGenerate: <T>(key: string, generator: () => T[]): T[] => {
        if (typeof window === 'undefined') {
            // Server-side / Build-time: just return generated data
            // This data won't persist but satisfies the build process
            return generator();
        }

        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                // We have data, parse and return
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn(`Failed to read from localStorage for key ${key}`, e);
        }

        // No data or error reading: generate fresh
        const freshData = generator();

        try {
            localStorage.setItem(key, JSON.stringify(freshData));
        } catch (e) {
            console.warn(`Failed to write to localStorage for key ${key}`, e);
        }

        return freshData;
    },

    /**
     * Set data manually for a key.
     * @param key Unique key for the module
     * @param data Data array to persist
     */
    set: <T>(key: string, data: T[]): void => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn(`Failed to write to localStorage for key ${key}`, e);
        }
    },

    /**
     * Clear all mock data (useful for hard reset)
     */
    clearAll: () => {
        if (typeof window !== 'undefined') {
            localStorage.clear();
            window.location.reload();
        }
    }
};
