import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProductVariant, MOCK_VEHICLES } from '@/types/productMaster';

export function useCatalog() {
    const [items, setItems] = useState<ProductVariant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('items')
                    .select('*')
                    .eq('is_active', true);

                if (error) throw error;

                if (data && data.length > 0) {
                    const mappedItems: ProductVariant[] = data.map(item => ({
                        id: item.id,
                        type: item.type as any,
                        make: item.make,
                        model: item.model,
                        variant: item.variant,
                        color: item.color,
                        displayName: `${item.make} ${item.model} ${item.variant}`,
                        label: `${item.make} / ${item.model} / ${item.variant} / ${item.color}`,
                        sku: `${item.make.slice(0, 3)}-${item.model.slice(0, 3)}-${item.variant.slice(0, 3)}`.toUpperCase(),
                        specifications: item.specs,
                        status: 'ACTIVE' as const,
                        // Using new optimized columns
                        bodyType: item.category as any,
                        fuelType: item.fuel_type,
                        displacement: item.engine_power,
                        powerUnit: item.power_unit,
                        segment: item.segment
                    }));
                    setItems(mappedItems);
                } else {
                    // Fallback to mock data if DB is empty
                    setItems(MOCK_VEHICLES);
                }
            } catch (err: any) {
                console.error('Error fetching catalog:', err);
                setError(err.message);
                setItems(MOCK_VEHICLES); // Fallback on error
            } finally {
                setIsLoading(false);
            }
        };

        fetchItems();
    }, []);

    return { items, isLoading, error };
}
