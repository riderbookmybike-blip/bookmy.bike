export interface Brand {
    id: string;
    name: string;
    slug: string;
    logo_svg?: string;
    brand_logos?: {
        original?: string;
        dark?: string;
        light?: string;
        icon?: string;
    };
}

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useSystemBrandsLogic() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchBrands() {
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('cat_brands')
                    .select('id, name, slug, logo_svg, brand_logos')
                    .eq('is_active', true)
                    .eq('brand_category', 'VEHICLE')
                    .order('name');

                if (error) throw error;

                if (data) {
                    setBrands(data);
                }
            } catch (err: unknown) {
                // Ignore AbortError - expected in React StrictMode double-render
                const errObj = err as { name?: string; message?: string };
                if (errObj?.name === 'AbortError' || errObj?.message?.includes('AbortError')) {
                    return;
                }
                const errorMessage = err instanceof Error
                    ? err.message
                    : (err as { message?: string })?.message ?? JSON.stringify(err);
                console.error('Error fetching brands:', errorMessage);
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        }

        fetchBrands();
    }, []);

    return { brands, isLoading, error };
}
