'use client';

import React, { useState, useEffect } from 'react';
import {
    Building2,
    Search,
    Plus,
    MapPin,
    ArrowUpRight,
    Users,
    Zap,
    TrendingUp,
    LayoutGrid,
    ListFilter,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import OnboardDealerModal from '@/components/dealers/OnboardDealerModal';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Dealer {
    id: string;
    name: string;
    type: string;
    status: string;
    location?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config?: any;
    created_at: string;
}

export default function DealersPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const [dealers, setDealers] = useState<Dealer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchDealers = async () => {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
            .from('id_tenants')
            .select('*')
            .eq('type', 'DEALER')
            .order('name', { ascending: true });

        if (data) {
            setDealers(data as any);
        }
        if (error) {
            console.error('Error fetching dealers:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDealers();
    }, []);

    const filteredDealers = dealers.filter(
        dealer =>
            dealer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dealer.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeCount = filteredDealers.filter(d => d.status === 'ACTIVE').length;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header Section with Glass Effect */}
            <div className="relative rounded-3xl p-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-3xl" />
                <div className="absolute inset-0 border border-white/10 rounded-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/50 dark:bg-white/10 backdrop-blur-md border border-white/20 rounded-full w-fit shadow-sm">
                            <Building2 size={12} className="text-indigo-600 dark:text-indigo-400" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                                Platform Management
                            </span>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                                Dealership <span className="text-indigo-600 dark:text-indigo-400">Network</span>
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-lg leading-relaxed">
                                Orchestrate the entire BookMyBike dealer ecosystem. Monitor performance, manage
                                inventory, and configure offer strategies per node.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                        >
                            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                            ONBOARD NEW NODE
                        </button>
                    </div>
                </div>
            </div>

            <OnboardDealerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchDealers} />

            {/* Stats & Search Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Search */}
                <div className="lg:col-span-2 relative group z-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl flex items-center p-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-sm group-hover:shadow-md">
                        <div className="pl-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search nodes by name, ID or location..."
                            className="w-full bg-transparent border-none px-4 py-2 text-sm font-medium focus:ring-0 outline-none placeholder:text-slate-400 text-slate-900 dark:text-white"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <div className="pr-1.5">
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-400 transition-colors">
                                <ListFilter size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="lg:col-span-2 flex gap-4">
                    <StatCard
                        label="Total Nodes"
                        value={dealers.length}
                        icon={LayoutGrid}
                        trend="+12%"
                        color="indigo"
                    />
                    <StatCard label="Active Network" value={activeCount} icon={Zap} trend="Stable" color="emerald" />
                </div>
            </div>

            {/* Dealers Grid */}
            {loading ? (
                <div className="py-32 flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full" />
                        <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-sm text-slate-400 font-medium animate-pulse">Syncing network topology...</p>
                </div>
            ) : filteredDealers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDealers.map(dealer => (
                        <Link
                            href={`/app/${slug}/dashboard/dealers/${dealer.id}`}
                            key={dealer.id}
                            className="block h-full"
                        >
                            <DealerCard dealer={dealer} />
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="py-24 text-center bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Search className="text-slate-400" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No dealerships found</h3>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
                        We couldn't find any nodes matching your search. Try a different query.
                    </p>
                </div>
            )}
        </div>
    );
}

const StatCard = ({ label, value, icon: Icon, trend, color }: any) => (
    <div className="flex-1 bg-white dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group">
        <div
            className={`absolute right-0 top-0 w-24 h-24 bg-${color}-500/5 rounded-full blur-2xl -mr-8 -mt-8 transition-opacity`}
        />
        <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white group-hover:scale-105 transition-transform origin-left">
                {value}
            </div>
        </div>
        <div className="text-right">
            <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center mb-1`}>
                <Icon size={18} className={`text-${color}-500`} />
            </div>
            <div className={`text-[10px] font-bold text-${color}-500`}>{trend}</div>
        </div>
    </div>
);

const DealerCard = ({ dealer }: { dealer: Dealer }) => {
    return (
        <div className="group bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-colors duration-500" />

            <div className="relative space-y-6">
                <div className="flex justify-between items-start">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 flex items-center justify-center border border-slate-100 dark:border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <Building2
                            size={28}
                            className="text-slate-400 group-hover:text-indigo-600 transition-colors duration-300"
                        />
                    </div>
                    <div
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${dealer.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10' : 'bg-rose-500/10 text-rose-600 border-rose-500/10'}`}
                    >
                        {dealer.status || 'ACTIVE'}
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {dealer.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-2">
                        <MapPin size={12} className="text-indigo-500" />
                        {dealer.location || 'Location not configured'}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Inventory
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            <span className="text-sm font-bold text-slate-900 dark:text-white">124</span>
                        </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Revenue
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span className="text-sm font-bold text-slate-900 dark:text-white">₹14.2 L</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex items-center justify-between relative pt-6 border-t border-slate-100 dark:border-white/5">
                <div className="flex -space-x-3 hover:space-x-1 transition-all">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden shadow-sm"
                        >
                            <Users size={12} className="text-slate-400" />
                        </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                        +4
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    MANAGE NODE <ArrowUpRight size={14} />
                </div>
            </div>
        </div>
    );
};
