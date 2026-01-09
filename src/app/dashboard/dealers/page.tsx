'use client';

import React, { useState, useEffect } from 'react';
import {
    Building2,
    Search,
    Filter,
    Plus,
    MoreVertical,
    MapPin,
    Phone,
    Mail,
    ChevronRight,
    ArrowUpRight,
    BadgeCheck,
    Users
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Dealer {
    id: string;
    name: string;
    type: string;
    status: string;
    location?: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    created_at: string;
}

export default function DealersPage() {
    const [dealers, setDealers] = useState<Dealer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchDealers = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('tenants')
                .select('*')
                .eq('type', 'DEALER')
                .order('name', { ascending: true });

            if (data) {
                setDealers(data);
            }
            setLoading(false);
        };

        fetchDealers();
    }, []);

    const filteredDealers = dealers.filter(dealer =>
        dealer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dealer.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            {/* Corporate Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-white/5 pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg w-fit">
                        <Building2 size={12} className="text-indigo-600" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Platform Management</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-4">
                        Dealership <span className="text-indigo-600">Network</span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
                        Manage and monitor the BookMyBike dealer ecosystem across all regions.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all shadow-lg shadow-slate-200 dark:shadow-indigo-900/20">
                        <Plus size={14} />
                        Onboard New Dealer
                    </button>
                </div>
            </div>

            {/* Search & Stats Section */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search dealers by name or location..."
                        className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-4 text-sm font-bold text-slate-400">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-900 dark:text-white">{filteredDealers.length}</span>
                        Total Nodes
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                    <div className="flex items-center gap-2 text-emerald-500">
                        <span>{filteredDealers.filter(d => d.status === 'ACTIVE').length || 0}</span>
                        Active
                    </div>
                </div>
            </div>

            {/* Dealers Grid/List */}
            {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-sm text-slate-400 font-medium">Fetching dealership cluster...</p>
                </div>
            ) : filteredDealers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDealers.map((dealer) => (
                        <DealerCard key={dealer.id} dealer={dealer} />
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                    <Building2 className="mx-auto text-slate-300 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No dealerships found</h3>
                    <p className="text-sm text-slate-500">Try adjusting your search or onboard a new dealer.</p>
                </div>
            )}
        </div>
    );
}

const DealerCard = ({ dealer }: { dealer: Dealer }) => {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition-all group flex flex-col justify-between h-full">
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-100 dark:border-white/5 shadow-sm group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:border-indigo-100 dark:group-hover:border-indigo-500/20 transition-colors">
                        <Building2 size={24} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${dealer.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                        {dealer.status || 'ACTIVE'}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {dealer.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
                        <MapPin size={12} className="text-slate-400" />
                        {dealer.location || 'Location not set'}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 dark:border-white/5">
                    <div className="space-y-1">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Inventory</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">124 Units</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Revenue</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">₹14.2 L</div>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                            <Users size={12} className="text-slate-400" />
                        </div>
                    ))}
                    <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        +4
                    </div>
                </div>

                <button className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 hover:text-indigo-600 transition-all">
                    <ArrowUpRight size={18} />
                </button>
            </div>
        </div>
    );
};
