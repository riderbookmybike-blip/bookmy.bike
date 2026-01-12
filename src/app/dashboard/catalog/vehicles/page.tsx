'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    ShieldCheck,
    AlertCircle,
    Layers,
    Plus,
    Search,
    Filter,
    Car,
    Bike,
    CheckCircle2,
    ShoppingBag
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/lib/tenant/tenantContext';
import RoleGuard from '@/components/auth/RoleGuard';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import { KPICard } from '@/components/dashboard/KPICard';
import AddVehicleModal from '@/components/catalog/AddVehicleModal';
import AddBrandModal from '@/components/catalog/AddBrandModal';
// Removed MOCK_VEHICLES import


const VEHICLE_COLUMNS: any[] = [
    {
        key: 'brand',
        header: 'Brand',
        type: 'badge' // Clean badge look for brand names
    },
    {
        key: 'model',
        header: 'Model',
        type: 'rich',
        subtitle: (item: any) => 'Vehicle Family'
    },
    {
        key: 'variant',
        header: 'Variant',
        type: 'rich',
        subtitle: (item: any) => `${item.colorCount || 0} Colors / SKUs`
    },
    { key: 'type', header: 'Type' },
    { key: 'price', header: 'Base Price', type: 'amount' },
    { key: 'status', header: 'Status', type: 'badge' }
];

export default function VehicleCatalogPage() {
    const router = useRouter();
    const { tenantType, tenantId, userRole } = useTenant();
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [inventoryIds, setInventoryIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        brands: 0,
        models: 0,
        variants: 0,
        skus: 0
    });

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            // Fetch Brands
            const { data: brands, error: brandsError } = await supabase
                .from('brands')
                .select('*')
                .order('name');

            if (brandsError) throw brandsError;

            // Fetch Models
            const { data: models, error: modelsError } = await supabase
                .from('vehicle_models')
                .select('*');

            if (modelsError) throw modelsError;

            // Fetch Variants
            const { data: variants, error: variantsError } = await supabase
                .from('vehicle_variants')
                .select('*');

            if (variantsError) throw variantsError;

            // Fetch Colors
            const { data: colors, error: colorsError } = await supabase
                .from('vehicle_colors')
                .select('*');

            if (colorsError) throw colorsError;

            // Compute Stats
            const totalModels = models?.length || 0;
            const totalVariants = variants?.length || 0;
            const totalSkus = colors?.length || 0;

            setStats({
                brands: brands?.length || 0,
                models: totalModels,
                variants: totalVariants,
                skus: totalSkus
            });

            // GROUP BY BRAND - Refactored View
            const mappedList: any[] = [];

            (brands || []).forEach(brand => {
                const brandModels = (models || []).filter(m => m.brand_id === brand.id);
                const brandVariants = (variants || []).filter(v => brandModels.some(m => m.id === v.model_id));

                let brandSkuCount = 0;
                brandVariants.forEach(v => {
                    const vColors = (colors || []).filter(c => c.variant_id === v.id);
                    brandSkuCount += vColors.length;
                });

                // Only show brands that have models or if we want to show empty brands too
                mappedList.push({
                    id: brand.id,
                    brandId: brand.id,
                    brand: brand.name,
                    brandLogo: brand.logo_svg,
                    brandLogos: brand.brand_logos || {}, // Capture new field
                    modelCount: brandModels.length,
                    variantCount: brandVariants.length,
                    skuCount: brandSkuCount,
                    status: brand.is_active ? 'Active' : 'Draft',
                    source: 'live'
                });
            });

            setVehicles(mappedList);
            setInventoryIds(new Set());

            setVehicles(mappedList);
        } catch (error) {
            console.error('[Catalog] Error fetching hierarchical data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredVehicles = vehicles.filter(v =>
        (v.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.model || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.variant || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const metrics = (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
                title="Brands"
                value={stats.brands}
                icon={ShieldCheck}
                sub="Manufacturers"
                onClick={() => setSearchQuery('')}
            />
            <KPICard
                title="Model Families"
                value={stats.models}
                icon={Box}
                sub="Vehicle Groups"
            />
            <KPICard
                title="Total Variants"
                value={stats.variants}
                icon={Layers}
                sub="Equipment Specs"
            />
            <KPICard
                title="Total SKUs"
                value={stats.skus}
                icon={CheckCircle2}
                sub="Color-Variant Pairs"
                delta={stats.skus.toString()}
                isUp={true}
            />
        </div>
    );

    return (
        <RoleGuard resource="catalog-vehicles" action="view">
            <div className="space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="px-2 py-0.5 rounded-md bg-indigo-600/10 border border-indigo-600/20 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                CATALOG V2.0
                            </div>
                            <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                {vehicles.filter(v => v.source === 'live').length > 0 ? 'SYNCED' : 'HYBRID'}
                            </div>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none">
                            VEHICLES <span className="text-indigo-600">CATALOG</span>
                            <span className="block text-sm font-bold text-slate-400 not-italic tracking-widest uppercase mt-2">Master Inventory & SKU Management</span>
                        </h1>
                    </div>

                    {['OWNER', 'DEALERSHIP_ADMIN'].includes(userRole || '') && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="group flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-indigo-600/20 active:scale-95 border border-white/20 italic"
                        >
                            <Plus className="text-white group-hover:rotate-90 transition-transform" size={20} strokeWidth={3} />
                            Launch Vehicle Studio
                        </button>
                    )}
                </div>

                {metrics}

                <MasterListDetailLayout mode="list-only">
                    <ListPanel
                        title="Vehicles Catalog"
                        columns={[
                            {
                                header: 'Manufacturer',
                                key: 'brand',
                                render: (row: any) => (
                                    <div className="flex items-center gap-4 py-2">
                                        {row.brandLogo || row.brandLogos?.original ? (
                                            <div
                                                className="w-12 h-12 bg-white dark:bg-white/10 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center p-2 overflow-hidden shadow-sm group-hover:scale-110 transition-transform duration-500 relative"
                                            >
                                                {/* Light Mode / Default */}
                                                <div
                                                    className="w-full h-full flex items-center justify-center text-slate-900 dark:text-white [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain dark:hidden"
                                                    dangerouslySetInnerHTML={{ __html: row.brandLogos?.light || row.brandLogos?.original || row.brandLogo }}
                                                />
                                                {/* Dark Mode */}
                                                <div
                                                    className="w-full h-full hidden dark:flex items-center justify-center text-slate-900 dark:text-white [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                                                    dangerouslySetInnerHTML={{ __html: row.brandLogos?.dark || row.brandLogos?.original || row.brandLogo }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold shadow-inner">
                                                {row.brand[0]}
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="font-black uppercase tracking-wider text-sm">{row.brand}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">OEM Partner</span>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                header: 'Models',
                                key: 'modelCount',
                                render: (row: any) => (
                                    <div className="flex flex-col">
                                        <span className="font-black text-slate-900 dark:text-white text-lg">{row.modelCount}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Families</span>
                                    </div>
                                )
                            },
                            {
                                header: 'Total Variants',
                                key: 'variantCount',
                                render: (row: any) => (
                                    <div className="flex flex-col">
                                        <span className="font-black text-slate-900 dark:text-white text-lg">{row.variantCount}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Configurations</span>
                                    </div>
                                )
                            },
                            {
                                header: 'Total SKUs',
                                key: 'skuCount',
                                render: (row: any) => (
                                    <div className="flex flex-col">
                                        <span className="font-black text-indigo-500 text-lg">{row.skuCount}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Stock Units</span>
                                    </div>
                                )
                            },
                            { header: 'Status', key: 'status' },
                        ]}
                        data={filteredVehicles}
                        actionLabel="Add Brand"
                        onActionClick={() => setIsBrandModalOpen(true)}
                        basePath="/dashboard/catalog/vehicles"
                        tight={true}
                        onQuickAction={(action, item) => {
                            if (action === 'edit') {
                                router.push(`/dashboard/catalog/vehicles/studio?modelId=${item.modelId}&brandId=${item.brandId}`);
                            }
                        }}
                    />
                </MasterListDetailLayout>

                <AddVehicleModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={fetchVehicles}
                />

                <AddBrandModal
                    isOpen={isBrandModalOpen}
                    onClose={() => setIsBrandModalOpen(false)}
                    onSuccess={(brandName) => {
                        fetchVehicles();
                        // Optional: Navigate to brand detail page right away
                    }}
                />
            </div>
        </RoleGuard>
    );
}
