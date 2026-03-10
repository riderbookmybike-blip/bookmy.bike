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
import { getErrorMessage } from '@/lib/utils/errorMessage';

export function useSystemBrandsLogic() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        const isTransientFetchIssue = (input: unknown) => {
            const msg = String((input as { name?: string; message?: string })?.message || input || '')
                .toLowerCase()
                .trim();
            return (
                msg.includes('fetch failed') ||
                msg.includes('failed to fetch') ||
                msg.includes('signal is aborted') ||
                msg.includes('aborterror')
            );
        };

        async function fetchBrands() {
            try {
                const supabase = createClient();
                let data: any[] | null = null;
                let fetchError: unknown = null;

                for (let attempt = 1; attempt <= 2; attempt += 1) {
                    const { data: rows, error } = await supabase
                        .from('cat_brands')
                        .select('id, name, slug, logo_svg, brand_logos')
                        .eq('is_active', true)
                        .eq('brand_category', 'VEHICLE')
                        .order('name');
                    if (!error) {
                        data = rows || [];
                        fetchError = null;
                        break;
                    }
                    fetchError = error;
                    if (attempt < 2) await sleep(200);
                }

                if (fetchError) throw fetchError;

                if (!cancelled && data) {
                    setBrands(
                        data.map(b => ({
                            ...b,
                            logo_svg: b.logo_svg || undefined,
                            brand_logos: (b.brand_logos as any) || undefined,
                        }))
                    );
                }
            } catch (err: unknown) {
                // Ignore AbortError - expected in React StrictMode double-render
                const errObj = err as { name?: string; message?: string };
                if (errObj?.name === 'AbortError' || errObj?.message?.includes('AbortError')) {
                    return;
                }
                if (isTransientFetchIssue(err)) {
                    if (!cancelled) {
                        setBrands([]);
                        setError(null);
                    }
                    console.warn('Brand fetch transiently unavailable. Using empty list for now.');
                    return;
                }
                const errorMessage =
                    err instanceof Error
                        ? getErrorMessage(err)
                        : ((err as { message?: string })?.message ?? JSON.stringify(err));
                console.error('Error fetching brands:', errorMessage);
                if (!cancelled) {
                    setError(errorMessage);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        fetchBrands();

        return () => {
            cancelled = true;
        };
    }, []);

    return { brands, isLoading, error };
}
