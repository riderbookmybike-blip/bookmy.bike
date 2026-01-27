'use client';

import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Building2,
    MapPin,
    Phone,
    Mail,
    ShieldCheck,
    Users,
    Package,
    Settings,
    MoreVertical,
    CreditCard,
    Activity,
    Save
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { format } from 'date-fns';
import { ServiceAreaManager } from '@/components/dashboard/dealers/ServiceAreaManager';
import { ServiceAreaManager } from '@/components/dashboard/dealers/ServiceAreaManager';
import { DealerPricelist } from '@/components/dashboard/dealers/DealerPricelist';

export default function DealerProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [dealer, setDealer] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [id, setId] = useState<string>('');

    useEffect(() => {
        const init = async () => {
            const resolvedParams = await params;
            setId(resolvedParams.id);
            fetchDealerDetails(resolvedParams.id);
        };
        init();
    }, [params]);

    const fetchDealerDetails = async (dealerId: string) => {
        setLoading(true);
        const supabase = createClient();

        // Fetch Tenant
        const { data: tenant } = await supabase
            .from('id_tenants')
            .select('*')
            .eq('id', dealerId)
            .single();

        if (tenant) {
            setDealer(tenant);

            // Fetch Team
            const { data: team } = await supabase
                .from('id_team')
                .select('*, user:user_id(full_name, email, primary_phone, avatar_url)')
                .eq('tenant_id', dealerId);

            if (team) setMembers(team);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-400 font-medium">Loading Dealer Profile...</p>
            </div>
        );
    }

    if (!dealer) return <div className="p-10 text-center">Dealer not found</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24">
            {/* Navigation & Header */}
            <div>
                <Link
                    href="/dashboard/dealers"
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 mb-6 transition-colors"
                >
                    <ArrowLeft size={14} /> BACK TO NETWORK
                </Link>

                <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-8 overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16" />

                    <div className="relative flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex gap-6">
                            <div className="w-24 h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 flex items-center justify-center shadow-inner">
                                <Building2 size={40} className="text-slate-300 dark:text-slate-600" />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                                        {dealer.name}
                                    </h1>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${dealer.status === 'ACTIVE'
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                        }`}>
                                        {dealer.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={14} className="text-indigo-500" />
                                        {dealer.location || 'No location set'}
                                    </div>
                                    <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                    <div className="flex items-center gap-1.5">
                                        <Building2 size={14} className="text-slate-400" />
                                        ID: {dealer.slug}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity">
                                EDIT DETAILS
                            </button>
                            <button className="p-2 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                <MoreVertical size={18} className="text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 mt-12 border-b border-slate-100 dark:border-white/5">
                        <TabButton id="overview" label="Overview" icon={Activity} active={activeTab} onClick={setActiveTab} />
                        <TabButton id="team" label="Team & Access" icon={Users} active={activeTab} onClick={setActiveTab} />
                        <TabButton id="inventory" label="Inventory" icon={Package} active={activeTab} onClick={setActiveTab} />
                        <TabButton id="config" label="Configuration" icon={Settings} active={activeTab} onClick={setActiveTab} />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'overview' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <StatCard label="Total Revenue" value="₹12.4 L" trend="+8.2%" icon={CreditCard} color="indigo" />
                                <StatCard label="Active Inventory" value="48 Units" trend="-2.1%" icon={Package} color="cyan" />
                            </div>

                            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recent Activity</h3>
                                <div className="space-y-6">
                                    {[1, 2, 3].map((_, i) => (
                                        <div key={i} className="flex gap-4 items-start pb-6 border-b border-dashed border-slate-100 dark:border-white/5 last:border-0 last:pb-0">
                                            <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">New vehicle allotted: TVS Jupiter 125</p>
                                                <p className="text-xs text-slate-400 mt-1">2 hours ago • by Logistics Team</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}

                    {activeTab === 'team' && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Team Members</h3>
                                <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                                    INVITE MEMBER
                                </button>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-white/5">
                                {members.map((member) => (
                                    <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                                                {member.user?.full_name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{member.user?.full_name || 'Unknown User'}</p>
                                                <p className="text-xs text-slate-500">{member.role} • {member.user?.primary_phone}</p>
                                            </div>
                                        </div>
                                        <div className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 uppercase">
                                            {member.status}
                                        </div>
                                    </div>
                                ))}
                                {members.length === 0 && (
                                    <div className="p-8 text-center text-slate-400 text-sm">No members found</div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'config' && (
                        <div className="space-y-6">
                            <ServiceAreaManager tenantId={id} defaultStateCode="MH" />
                            <DealerPricelist tenantId={id} defaultStateCode="MH" />
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    <div className="bg-slate-900 dark:bg-black text-white rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
                        <ShieldCheck size={32} className="text-indigo-400 mb-4" />
                        <h3 className="text-lg font-bold mb-2">Operational Health</h3>
                        <p className="text-sm text-slate-400 mb-6">
                            This node is operating at <span className="text-white font-bold">98% efficiency</span>. All regulatory compliance checks are passing.
                        </p>
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 w-[98%] h-full" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Quick Details</h3>
                        <div className="space-y-4">
                            <DetailRow label="Onboarded" value={format(new Date(dealer.created_at), 'PPP')} icon={Activity} />
                            <DetailRow label="Region" value="Maharashtra (MH)" icon={MapPin} />
                            <DetailRow label="Pincode" value={dealer.pincode} icon={MapPin} />
                            <DetailRow label="Type" value={dealer.type} icon={Building2} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const TabButton = ({ id, label, icon: Icon, active, onClick }: any) => (
    <button
        onClick={() => onClick(id)}
        className={`flex items-center gap-2 px-6 py-4 border-b-2 text-sm font-bold transition-all ${active === id
            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
    >
        <Icon size={16} />
        {label}
    </button>
);

const StatCard = ({ label, value, trend, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-start mb-4">
            <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center`}>
                <Icon size={18} className={`text-${color}-600 dark:text-${color}-400`} />
            </div>
            <span className={`text-xs font-bold ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                {trend}
            </span>
        </div>
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{value}</p>
        </div>
    </div>
);

const DetailRow = ({ label, value, icon: Icon }: any) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Icon size={12} />
            {label}
        </div>
        <div className="text-sm font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
);
