import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Brand {
    id: string;
    name: string;
    slug: string;
}

export function useBrands() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchBrands() {
            try {
                const supabase = createClient();
                const { data, error } = await supabase.from('brands').select('id, name, slug').order('name');

                if (error) throw error;

                if (data) {
                    setBrands(data);
                }
            } catch (err) {
                console.error('Error fetching brands:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        }

        fetchBrands();
    }, []);

    return { brands, isLoading, error };
}
