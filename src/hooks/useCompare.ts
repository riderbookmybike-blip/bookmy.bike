import { useState, useEffect } from 'react';
import { ProductVariant } from '@/types/productMaster';

const COMPARE_STORAGE_KEY = 'bmb_compare_list';

export function useCompare() {
    const [compareList, setCompareList] = useState<ProductVariant[]>([]);

    // Initialize from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
        if (stored) {
            try {
                setCompareList(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse compare list', e);
            }
        }
    }, []);

    const addToCompare = (vehicle: ProductVariant) => {
        if (compareList.length >= 4) {
            alert('You can only compare up to 4 vehicles at a time.');
            return;
        }
        if (compareList.find(v => v.id === vehicle.id)) {
            return;
        }
        const newList = [...compareList, vehicle];
        setCompareList(newList);
        localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(newList));
    };

    const removeFromCompare = (id: string) => {
        const newList = compareList.filter(v => v.id !== id);
        setCompareList(newList);
        localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(newList));
    };

    const clearCompare = () => {
        setCompareList([]);
        localStorage.removeItem(COMPARE_STORAGE_KEY);
    };

    return {
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare: (id: string) => !!compareList.find(v => v.id === id)
    };
}
