'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Car, Bike, MoreVertical } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
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
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isArtModalOpen, setIsArtModalOpen] = useState(false);

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVehicles(data || []);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        } finally {
            setLoading(false);
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
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Manage master list of vehicles for the marketplace</p>
                </div>
                <button
                    onClick={() => setIsArtModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 active:scale-95"
                >
                    <Plus size={20} />
                    Add Vehicle
                </button>
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
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
