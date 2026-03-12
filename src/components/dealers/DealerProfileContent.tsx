'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Building2,
    Users,
    BarChart3,
    ShieldCheck,
    MapPin,
    CreditCard,
    Settings2,
    ExternalLink,
    ChevronRight,
    Globe,
    Loader2,
    Fingerprint,
    HardDrive,
    Wallet,
    LayoutGrid,
    Search as SearchIcon,
    Plus,
    Activity,
    Save,
    X,
    Pencil,
} from 'lucide-react';
import IdentitySettings from './settings/IdentitySettings';
import LocationSettings from './settings/LocationSettings';
import ComplianceSettings from './settings/ComplianceSettings';
import FinanceSettings from './settings/FinanceSettings';
import TeamAccess from './TeamAccess';
import { createClient } from '@/lib/supabase/client';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { getAllTenants } from '@/actions/tenants';
import { toast } from 'sonner';

interface DealerProfileContentProps {
    dealerId: string;
    superAdminMode?: boolean;
    currentTenantSlug?: string;
    isCompanyProfile?: boolean;
}

type TabType = 'intelligence' | 'personnel' | 'commerce' | 'identity' | 'location' | 'compliance' | 'finance';

export default function DealerProfileContent({
    dealerId: initialDealerId,
    superAdminMode = false,
    currentTenantSlug,
    isCompanyProfile = false,
}: DealerProfileContentProps) {
    const { device } = useBreakpoint();
    const router = useRouter();
    const params = useParams();
    const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';

    const [dealers, setDealers] = useState<any[]>([]);
    const [selectedDealerId, setSelectedDealerId] = useState<string>(initialDealerId);
    const [dealer, setDealer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(superAdminMode);
    const [activeTab, setActiveTab] = useState<TabType>('identity');
    const [searchQuery, setSearchQuery] = useState('');

    // --- Fetch Dealer List (SuperAdmin only) ---
    const fetchDealerList = useCallback(async () => {
        if (!superAdminMode) return;
        setListLoading(true);
        try {
            const data = await getAllTenants(searchQuery);
            setDealers(data);
        } catch (error) {
            console.error('Failed to fetch dealers:', error);
            toast.error('Failed to load dealer registry');
        } finally {
            setListLoading(false);
        }
    }, [superAdminMode, searchQuery]);

    useEffect(() => {
        if (superAdminMode) fetchDealerList();
    }, [fetchDealerList, superAdminMode]);

    // --- Fetch Specific Dealer Detail ---
    const fetchDealerDetail = useCallback(async (id: string) => {
        setLoading(true);
        const supabase = createClient();
        try {
            const { data } = await supabase.from('id_tenants').select('*').eq('id', id).maybeSingle();

            if (data) setDealer(data);
        } catch (error) {
            console.error('Failed to fetch dealer detail:', error);
            toast.error('Failed to load dealer context');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedDealerId) fetchDealerDetail(selectedDealerId);
    }, [selectedDealerId, fetchDealerDetail]);

    // --- Real-time Updates ---
    useEffect(() => {
        if (!selectedDealerId) return;
        const supabase = createClient();
        const channel = supabase
            .channel(`dealer-${selectedDealerId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'id_tenants', filter: `id=eq.${selectedDealerId}` },
                () => fetchDealerDetail(selectedDealerId)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedDealerId, fetchDealerDetail]);

    // --- Navigation Helpers ---
    const handleOpenDealer = (id: string) => {
        setSelectedDealerId(id);
        if (superAdminMode && slug) {
            router.push(`/app/${slug}/dashboard/dealers/${id}`);
        }
    };

    const filteredDealers = useMemo(() => {
        return dealers.filter(
            d =>
                d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (d.slug || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (d.location || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [dealers, searchQuery]);

    const tabs = useMemo(
        () => [
            { id: 'identity', label: 'Identity Registry', icon: Fingerprint, group: 'ARCHITECTURE' },
            { id: 'location', label: 'Geo-Coordinate Hubs', icon: MapPin, group: 'ARCHITECTURE' },
            { id: 'compliance', label: 'Regulatory Vault', icon: ShieldCheck, group: 'ARCHITECTURE' },
            { id: 'finance', label: 'Financial Nexus', icon: CreditCard, group: 'ARCHITECTURE' },
            { id: 'personnel', label: 'Operational Roster', icon: Users, group: 'ANALYTICS' },
            { id: 'intelligence', label: 'Market Intelligence', icon: BarChart3, group: 'ANALYTICS' },
            { id: 'commerce', label: 'Commerce Cockpit', icon: Building2, group: 'ANALYTICS' },
        ],
        []
    );

    const detailContent = (
        <div className="flex-1 flex flex-col h-full bg-white animate-in fade-in duration-500 overflow-hidden">
            {loading ? (
                <div className="flex h-full flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Initialising Node Context...
                    </p>
                </div>
            ) : !dealer ? (
                <div className="flex h-full flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-4 border border-rose-100">
                        <ShieldCheck size={32} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Node Not Found In Registry
                    </p>
                </div>
            ) : (
                <>
                    {/* Compact Professional Header */}
                    <div className="px-8 pt-8 pb-0 border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm">
                                    {dealer.logo_url ? (
                                        <img
                                            src={dealer.logo_url}
                                            alt=""
                                            className="w-full h-full object-contain p-2"
                                        />
                                    ) : (
                                        <Building2 size={24} className="text-slate-400" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                                            {dealer.name}
                                        </h1>
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                            Operational Node
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        <span className="flex items-center gap-1.5">
                                            <MapPin size={10} /> {dealer.location || 'GLOBAL_NODE'}
                                        </span>
                                        <span className="text-slate-200">|</span>
                                        <span className="flex items-center gap-1.5 font-black text-indigo-600">
                                            {dealer.slug?.toUpperCase() || 'CORE'}.STATION
                                        </span>
                                        <span className="text-slate-200">|</span>
                                        <span className="text-[9px] opacity-70">UID: {dealer.id.slice(0, 12)}...</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="p-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-slate-400 hover:text-slate-600 transition-all shadow-sm">
                                    <ExternalLink size={14} />
                                </button>
                                <button className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 dark:hover:bg-indigo-50 shadow-lg shadow-slate-900/10 transition-all">
                                    Sync Assets
                                </button>
                            </div>
                        </div>

                        {/* Zoho Style Tabs */}
                        <div className="flex items-center gap-1 mt-10 overflow-x-auto no-scrollbar">
                            {tabs.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id as TabType)}
                                    className={`flex items-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-[0.15em] transition-all relative border-t border-x border-transparent rounded-t-xl shrink-0 ${
                                        activeTab === t.id
                                            ? 'bg-[#f8fafc]/50 text-indigo-600 border-slate-100 z-10'
                                            : 'text-slate-400 hover:text-slate-600 bg-transparent'
                                    }`}
                                >
                                    <t.icon
                                        size={13}
                                        className={activeTab === t.id ? 'text-indigo-600' : 'text-slate-300'}
                                    />
                                    {t.label}
                                    {activeTab === t.id && (
                                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scrollable Content Container */}
                    <div className="flex-1 overflow-y-auto no-scrollbar bg-[#f8fafc]/50 p-8">
                        <div className="max-w-5xl space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                            {activeTab === 'identity' && (
                                <IdentitySettings
                                    dealer={dealer}
                                    onUpdate={() => fetchDealerDetail(selectedDealerId)}
                                />
                            )}
                            {activeTab === 'location' && <LocationSettings dealerId={dealer.id} />}
                            {activeTab === 'compliance' && <ComplianceSettings dealerId={dealer.id} />}
                            {activeTab === 'finance' && <FinanceSettings dealerId={dealer.id} />}

                            {activeTab === 'personnel' && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-8">
                                        <div>
                                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">
                                                Personnel Roster
                                            </h2>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                                <ShieldCheck size={12} className="text-emerald-500" /> Nodal permission
                                                and access management protocol.
                                            </p>
                                        </div>
                                    </div>
                                    <TeamAccess dealer={dealer} />
                                </div>
                            )}

                            {(activeTab === 'intelligence' || activeTab === 'commerce') && (
                                <div className="bg-white border border-slate-100 rounded-2xl py-32 flex flex-col items-center justify-center text-center shadow-sm border-dashed">
                                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
                                        <Settings2 size={40} strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">
                                        {activeTab} Vector Calibration
                                    </h3>
                                    <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-widest max-w-xs leading-relaxed opacity-70">
                                        This operational stream is currently in a state of high-fidelity
                                        synchronization.
                                    </p>
                                    <button className="mt-8 px-8 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md">
                                        Initialize Protocol
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Node Footer Meta */}
                        <div className="mt-12 flex items-center justify-between text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] px-2 mb-8">
                            <div className="flex items-center gap-8">
                                <span className="flex items-center gap-2">
                                    <Fingerprint size={10} className="text-slate-200" />
                                    SECURE_NODE_IDENT: {dealer.id.toUpperCase()}
                                </span>
                                <span className="hidden sm:inline">
                                    KERNEL: {new Date().getFullYear()}.
                                    {String(new Date().getMonth() + 1).padStart(2, '0')}.STABLE
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Activity size={10} className="text-emerald-400" />
                                ENCRYPTED_AUMS_SESSION // Node: {slug?.toUpperCase() || 'CORE'}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    // --- Main Layout Controller ---
    if (superAdminMode) {
        return (
            <div className="h-screen bg-white flex overflow-hidden font-sans">
                <MasterListDetailLayout
                    mode="list-detail"
                    listPosition="left"
                    device={device}
                    hasActiveDetail={!!selectedDealerId}
                    onBack={() => setSelectedDealerId('')}
                >
                    {/* List Pane */}
                    <div className="h-full flex flex-col bg-[#fdfdfd] border-r border-slate-200 w-full animate-in slide-in-from-left duration-500">
                        <div className="p-5 border-b border-slate-200 space-y-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">
                                    Dealer <span className="text-indigo-600">Registry</span>
                                </h2>
                                <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-all text-slate-400">
                                    <LayoutGrid size={14} />
                                </button>
                            </div>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-[11px] font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                                    placeholder="Search nodes..."
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 no-scrollbar">
                            {listLoading ? (
                                <div className="space-y-2 p-2">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : filteredDealers.length === 0 ? (
                                <div className="p-8 text-center space-y-3">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto border border-slate-100">
                                        <SearchIcon size={16} className="text-slate-300" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        No nodes matched
                                    </p>
                                </div>
                            ) : (
                                filteredDealers.map(d => {
                                    const isActive = selectedDealerId === d.id;
                                    return (
                                        <button
                                            key={d.id}
                                            onClick={() => handleOpenDealer(d.id)}
                                            className={`w-full text-left rounded-xl p-4 transition-all border ${
                                                isActive
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20 active-node'
                                                    : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span
                                                    className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-100' : 'text-indigo-600'}`}
                                                >
                                                    {d.slug?.toUpperCase() || 'CORE'}
                                                </span>
                                                <div
                                                    className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-emerald-400'} shadow-[0_0_8px_rgba(52,211,153,0.5)]`}
                                                />
                                            </div>
                                            <div
                                                className={`text-[12px] font-black uppercase tracking-tight mb-1 truncate ${isActive ? 'text-white' : 'text-slate-900'}`}
                                            >
                                                {d.name}
                                            </div>
                                            <div
                                                className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}
                                            >
                                                {d.location || 'GLOBAL_ZONE'}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* List Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                AUMS Registry v2.0
                            </p>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                                    Live
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Detail Pane */}
                    {detailContent}
                </MasterListDetailLayout>
            </div>
        );
    }

    // --- Standard Company Profile Layout ---
    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
            <div className="max-w-[1600px] mx-auto min-h-screen lg:px-6 lg:py-8 flex flex-col">
                <div className="bg-white border border-slate-200 lg:rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.02),0_10px_30px_-10px_rgba(0,0,0,0.05)] overflow-hidden flex-1 flex flex-col">
                    {detailContent}
                </div>
            </div>
        </div>
    );
}
