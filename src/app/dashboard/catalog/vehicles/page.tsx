'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Car, Bike, MoreVertical, CheckCircle2, ShieldCheck, ShoppingBag } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/lib/tenant/tenantContext';
import Image from 'next/image';

import AddVehicleModal from '@/components/catalog/AddVehicleModal';

interface Vehicle {
    id: string;
    type: string;
    make: string;
    model: string;
    variant: string;
    color: string;
    price: number;
    image_url: string;
}

export default function VehicleCatalogPage() {
    const { tenantType, tenantId } = useTenant();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [inventoryIds, setInventoryIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [isArtModalOpen, setIsArtModalOpen] = useState(false);

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
            setVehicles(items || []);

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

    const handleAddToInventory = async (vehicle: Vehicle) => {
        if (!tenantId) return;
        setActionLoading(vehicle.id);

        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('marketplace_inventory')
                .insert({
                    tenant_id: tenantId,
                    item_id: vehicle.id,
                    local_price: vehicle.price, // Default to global price
                    stock_status: 'IN_STOCK'
                });

            if (error) throw error;

            // Update local state
            setInventoryIds(prev => new Set(prev).add(vehicle.id));

            // Show success feedback (optional toast could go here)
        } catch (err) {
            console.error('Failed to add to inventory:', err);
            alert('Failed to add item. It might already be in your inventory.');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredVehicles = vehicles.filter(v =>
        v.make.toLowerCase().includes(search.toLowerCase()) ||
        v.model.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Global Vehicle Catalog</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {tenantType === 'DEALER'
                            ? "Browse and add vehicles to your showroom inventory"
                            : "Manage master list of vehicles for the marketplace"}
                    </p>
                </div>

                {/* Only Super Admins can add NEW items to Global Catalog */}
                {['SUPER_ADMIN', 'MARKETPLACE_ADMIN'].includes(tenantType || '') && (
                    <button
                        onClick={() => setIsArtModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 active:scale-95"
                    >
                        <Plus size={20} />
                        Add Vehicle
                    </button>
                )}
            </div>

            {/* Modal */}
            <AddVehicleModal
                isOpen={isArtModalOpen}
                onClose={() => setIsArtModalOpen(false)}
                onSuccess={fetchVehicles}
            />

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search make, model or variant..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-20 text-slate-400">Loading catalog...</div>
            ) : filteredVehicles.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-white/10">
                    <Car className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No vehicles found</p>
                    <p className="text-xs text-slate-400">Add your first vehicle to the catalog</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredVehicles.map((vehicle) => (
                        <div key={vehicle.id} className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden hover:shadow-xl hover:border-blue-500/20 transition-all duration-300">
                            {/* Image Placeholder */}
                            <div className="aspect-[4/3] bg-slate-100 dark:bg-white/5 relative overflow-hidden">
                                {vehicle.image_url ? (
                                    <Image src={vehicle.image_url} alt={vehicle.model} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                                        <Bike size={48} strokeWidth={1} />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3">
                                    <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">
                                        {vehicle.type}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <div className="mb-4">
                                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">{vehicle.make}</p>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{vehicle.model}</h3>
                                    <p className="text-slate-500 text-sm font-medium">{vehicle.variant} • {vehicle.color}</p>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Price</p>
                                        <p className="text-base font-black text-slate-900 dark:text-white">₹{vehicle.price?.toLocaleString()}</p>
                                    </div>
                                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>

                                {/* Dealer Action Area */}
                                {tenantType === 'DEALER' && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                        {inventoryIds.has(vehicle.id) ? (
                                            <div className="w-full py-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest border border-emerald-500/20">
                                                <CheckCircle2 size={14} /> In Inventory
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleAddToInventory(vehicle)}
                                                disabled={actionLoading === vehicle.id}
                                                className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                                            >
                                                {actionLoading === vehicle.id ? (
                                                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <ShoppingBag size={14} /> Add to Stock
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        </div>
            ))}
        </div>
    );
}
