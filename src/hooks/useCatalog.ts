import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProductVariant, MOCK_VEHICLES } from '@/types/productMaster';

interface DBVariant {
    id: string;
    name: string;
    slug: string;
    position: number;
    base_price_ex_showroom: number;
    braking_system: string | null;
    vehicle_models: {
        id: string;
        name: string;
        slug: string;
        category: string;
        fuel_type: string;
        displacement_cc: number | null;
        brands: {
            id: string;
            name: string;
        };
    };
    vehicle_colors: Array<{
        id: string;
        name: string;
        hex_code: string;
        image_url: string | null;
        vehicle_prices: Array<{
            ex_showroom_price: number;
            state_code: string;
        }>;
    }>;
}

export function useCatalog() {
    const [items, setItems] = useState<ProductVariant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const supabase = createClient();

                // Fetch from vehicle hierarchy
                const { data, error } = await supabase
                    .from('vehicle_variants')
                    .select(
                        `
                        id,
                        name,
                        slug,
                        position,
                        base_price_ex_showroom,
                        braking_system,
                        vehicle_models (
                            id,
                            name,
                            slug,
                            category,
                            fuel_type,
                            displacement_cc,
                            brands (
                                id,
                                name
                            )
                        ),
                        vehicle_colors (
                            id,
                            name,
                            hex_code,
                            image_url,
                            vehicle_prices (
                                ex_showroom_price,
                                state_code
                            )
                        )
                    `
                    )
                    .eq('is_active', true)
                    .order('position', { ascending: true });

                if (error) throw error;

                if (data && data.length > 0) {
                    // Map DB structure to ProductVariant format
                    const mappedItems: ProductVariant[] = (data as unknown as DBVariant[]).map(variant => {
                        const model = variant.vehicle_models;
                        const brand = model?.brands;
                        const firstColor = variant.vehicle_colors?.[0];

                        // Pricing Logic: Try to find MH price, fallback to first available
                        const prices = firstColor?.vehicle_prices || [];
                        const mhPrice = prices.find(p => p.state_code === 'MH')?.ex_showroom_price;
                        const finalExPrice = mhPrice || prices[0]?.ex_showroom_price || variant.base_price_ex_showroom || 0;

                        return {
                            id: variant.id,
                            type: 'VEHICLE' as const,
                            make: brand?.name || 'Unknown',
                            model: model?.name || 'Unknown',
                            variant: variant.name,
                            color: firstColor?.name || 'Standard',
                            displayName: `${brand?.name || ''} ${model?.name || ''} ${variant.name}`.trim(),
                            label: `${brand?.name || ''} / ${model?.name || ''} / ${variant.name}`,
                            sku: `${(brand?.name || 'UNK').slice(0, 3)}-${(model?.name || 'UNK').slice(0, 3)}-${variant.slug}`.toUpperCase(),
                            status: 'ACTIVE' as const,
                            bodyType: model?.category === 'SCOOTER' ? 'SCOOTER' : 'MOTORCYCLE',
                            fuelType: model?.fuel_type || 'PETROL',
                            displacement: model?.displacement_cc || undefined,
                            powerUnit: 'CC' as const,
                            segment: 'COMMUTER',
                            specifications: {},
                            features: [],
                            price: {
                                exShowroom: Number(finalExPrice),
                                onRoad: Math.round(Number(finalExPrice) * 1.15) // Mock 15% on-road addition
                            },
                            imageUrl: firstColor?.image_url || undefined
                        };
                    });
                    setItems(mappedItems);
                } else {
                    // Fallback to mock data if DB is empty

                    setItems(MOCK_VEHICLES);
                }
            } catch (err: unknown) {
                console.error('Error fetching catalog:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
                setItems(MOCK_VEHICLES); // Fallback on error
            } finally {
                setIsLoading(false);
            }
        };

        fetchItems();
    }, []);

    return { items, isLoading, error };
}
