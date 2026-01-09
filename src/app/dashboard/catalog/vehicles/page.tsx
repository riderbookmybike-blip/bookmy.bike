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
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/lib/tenant/tenantContext';
import RoleGuard from '@/components/auth/RoleGuard';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import { KPICard } from '@/components/dashboard/KPICard';
import AddVehicleModal from '@/components/catalog/AddVehicleModal';

const VEHICLE_COLUMNS: any[] = [
    { key: 'brand', header: 'Brand' },
    { key: 'model', header: 'Model' },
    { key: 'variant', header: 'Variant' },
    { key: 'type', header: 'Type' },
    { key: 'price', header: 'Base Price', type: 'amount' },
    { key: 'status', header: 'Status', type: 'badge' }
];

export default function VehicleCatalogPage() {
    const { tenantType, tenantId } = useTenant();
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [inventoryIds, setInventoryIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const supabase = createClient();

            // 1. Fetch Global Catalog
            const { data: items, error: itemsError } = await supabase
                .from('items')
                .select('*')
                .order('created_at', { ascending: false });

            if (itemsError) throw itemsError;

            // Map 'make' to 'brand' and use it as 'id' for navigation to the complex management page
            const mappedItems = (items || []).map(item => ({
                ...item,
                id: item.make, // DETAIL PAGE EXPECTS BRAND NAME AS ID
                brand: item.make,
                status: 'Active'
            }));

            setVehicles(mappedItems);

            // 2. Fetch My Inventory (if Dealer)
            if (tenantType === 'DEALER') {
                const { data: inventory, error: invError } = await supabase
                    .from('marketplace_inventory')
                    .select('item_id');

                if (!invError && inventory) {
                    setInventoryIds(new Set(inventory.map(i => i.item_id)));
                }
            }

        } catch (error) {
            console.error('Error fetching catalog:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredVehicles = vehicles.filter(v =>
        v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.variant.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const metrics = (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
                title="Total Brands"
                value={Array.from(new Set(vehicles.map(s => s.brand))).length}
                icon={ShieldCheck}
                sub="Global Manufacturers"
                onClick={() => setSearchQuery('')}
            />
            <KPICard
                title="Registered SKUs"
                value={vehicles.length}
                icon={Box}
                delta="+4"
                isUp={true}
                sub="Active in Inventory"
            />
            <KPICard
                title="Inactive SKUs"
                value={vehicles.filter(s => s.status === 'Inactive').length}
                icon={AlertCircle}
                delta="0%"
                isUp={true}
                sub="Requires Attention"
                onClick={() => setSearchQuery('inactive')}
            />
            <KPICard
                title="Total Variants"
                value={Array.from(new Set(vehicles.map(s => s.variant))).length}
                icon={Layers}
                sub="Model Configurations"
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
                                SYNCED
                            </div>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none">
                            VEHICLES <span className="text-indigo-600">CATALOG</span>
                            <span className="block text-sm font-bold text-slate-400 not-italic tracking-widest uppercase mt-2">Master Inventory & SKU Management</span>
                        </h1>
                    </div>

                    {['SUPER_ADMIN', 'MARKETPLACE_ADMIN'].includes(tenantType || '') && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                        >
                            <Plus size={18} strokeWidth={3} />
                            Add Vehicle
                        </button>
                    )}
                </div>

                {metrics}

                <MasterListDetailLayout mode="list-only">
                    <ListPanel
                        title="Vehicles Catalog"
                        columns={VEHICLE_COLUMNS}
                        data={filteredVehicles}
                        actionLabel="Add Brand"
                        onActionClick={() => setIsAddModalOpen(true)}
                        basePath="/dashboard/catalog/vehicles"
                        tight={true}
                        onQuickAction={(action, item) => console.log(`Quick action ${action} on`, item)}
                    />
                </MasterListDetailLayout>

                <AddVehicleModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={fetchVehicles}
                />
            </div>
        </RoleGuard>
    );
}
