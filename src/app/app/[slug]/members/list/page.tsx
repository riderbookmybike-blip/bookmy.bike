'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getMembersForTenant } from '@/actions/members';
import { createClient } from '@/lib/supabase/client';
import {
    Plus,
    Search,
    Users,
    Mail,
    Phone,
    MapPin,
    ArrowUpDown,
    Filter,
    Check,
    X,
    ChevronDown,
    ArrowUp,
    ArrowDown,
    FileText,
    CheckCircle,
    ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Member {
    id: string;
    display_id: string;
    full_name: string;
    primary_phone: string;
    primary_email: string;
    member_status: string;
    city: string;
    rto: string;
    district: string;
    updated_at: string;
    created_at: string;
    leads_count?: number;
    bookings_count?: number;
    quotes_count?: number;
}

type SortConfig = {
    key: keyof Member | 'activity' | 'status_priority';
    direction: 'asc' | 'desc';
};

export default function MembersListPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = React.use(params);
    const { tenantId } = useTenant();
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = useMemo(() => createClient(), []);

    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get('q') || '');
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    // Force AUMS Tenant ID if slug is 'aums'
    const targetTenantId = (slug && slug.toLowerCase() === 'aums')
        ? 'f3e6e266-3ca5-4c67-91ce-b7cc98e30ee5'
        : tenantId;

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const pageSize = 50;

    const [quickFilters, setQuickFilters] = useState({
        activeOnly: false,
        onlineOnly: false,
        hasLeads: false,
        hasQuotes: false,
        hasBookings: false,
    });

    // ... (rest of state)

    // Initial Fetch (Paginated)
    useEffect(() => {
        if (!targetTenantId) return;
        setLoading(true);

        getMembersForTenant(targetTenantId, search, page, pageSize)
            .then((res) => {
                setMembers((res.data || []) as any[]);
                setTotalPages(res.metadata.totalPages);
                setTotalRecords(res.metadata.total);
            })
            .finally(() => setLoading(false));
    }, [targetTenantId, search, page]);

    const handleExportCSV = () => {
        const headers = ['ID', 'Full Name', 'Phone', 'Email', 'Status', 'District', 'Leads', 'Quotes', 'Bookings', 'Joined On'];
        const rows = members.map(m => [
            m.display_id,
            m.full_name,
            m.primary_phone,
            m.primary_email,
            m.member_status,
            m.district,
            m.leads_count,
            m.quotes_count,
            m.bookings_count,
            m.created_at ? new Date(m.created_at).toLocaleDateString() : ''
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `registry_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };



    // Grid Intelligence State
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' });
    const [filters, setFilters] = useState<{
        status: string[];
        district: string[];
        rto: string[];
    }>({
        status: [],
        district: [],
        rto: []
    });
    const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null);

    // Force AUMS Tenant ID if slug is 'aums'


    // Presence Sync
    useEffect(() => {
        if (!targetTenantId) return;

        const channel = supabase.channel(`members_presence_${targetTenantId}`, {
            config: {
                presence: {
                    key: 'user_id',
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const userIds = new Set<string>();
                Object.values(newState).forEach((presences: any) => {
                    presences.forEach((p: any) => {
                        if (p.user_id) userIds.add(p.user_id);
                    });
                });
                setOnlineUsers(userIds);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
                    }
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [targetTenantId, supabase]);



    // Derived Filters Options
    const filterOptions = useMemo(() => {
        const status = Array.from(new Set(members.map(m => m.member_status || 'ACTIVE'))).filter(Boolean);
        const district = Array.from(new Set(members.map(m => m.district || 'Unassigned'))).filter(Boolean).sort();
        const rto = Array.from(new Set(members.map(m => m.rto || 'NA'))).filter(Boolean).sort();
        return { status, district, rto };
    }, [members]);

    const formatRelativeTime = (date?: Date | null) => {
        if (!date) return '—';
        const diffMs = Date.now() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr}h ago`;
        const diffDay = Math.floor(diffHr / 24);
        if (diffDay < 7) return `${diffDay}d ago`;
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
    };

    // Sorting & Filtering
    const processedMembers = useMemo(() => {
        let processed = [...members];

        // 1. Filtering
        if (filters.status.length > 0) {
            processed = processed.filter(m => filters.status.includes(m.member_status || 'ACTIVE'));
        }
        if (filters.district.length > 0) {
            processed = processed.filter(m => filters.district.includes(m.district || 'Unassigned'));
        }
        if (filters.rto.length > 0) {
            processed = processed.filter(m => filters.rto.includes(m.rto || 'NA'));
        }
        if (quickFilters.activeOnly) {
            processed = processed.filter(m => (m.member_status || 'ACTIVE') === 'ACTIVE');
        }
        if (quickFilters.onlineOnly) {
            processed = processed.filter(m => onlineUsers.has(m.id));
        }
        if (quickFilters.hasLeads) {
            processed = processed.filter(m => (m.leads_count || 0) > 0);
        }
        if (quickFilters.hasQuotes) {
            processed = processed.filter(m => (m.quotes_count || 0) > 0);
        }
        if (quickFilters.hasBookings) {
            processed = processed.filter(m => (m.bookings_count || 0) > 0);
        }

        // 2. Sorting
        return processed.sort((a, b) => {
            let aValue: any = '';
            let bValue: any = '';

            const getStatusPriority = (m: Member) => {
                if (onlineUsers.has(m.id)) return 4;
                if ((m.member_status || 'ACTIVE') === 'ACTIVE') return 3;
                if (m.member_status === 'INACTIVE') return 2;
                if (m.member_status === 'BANNED') return 1;
                return 0;
            };

            switch (sortConfig.key) {
                case 'full_name':
                    aValue = a.full_name || '';
                    bValue = b.full_name || '';
                    break;
                case 'status_priority':
                    aValue = getStatusPriority(a);
                    bValue = getStatusPriority(b);
                    break;
                case 'district':
                    aValue = a.district || '';
                    bValue = b.district || '';
                    break;
                case 'created_at':
                    aValue = new Date(a.created_at).getTime();
                    bValue = new Date(b.created_at).getTime();
                    break;
                case 'updated_at':
                    aValue = new Date(a.updated_at).getTime();
                    bValue = new Date(b.updated_at).getTime();
                    break;
                default:
                    // @ts-ignore
                    aValue = a[sortConfig.key] || '';
                    // @ts-ignore
                    bValue = b[sortConfig.key] || '';
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [members, filters, sortConfig, onlineUsers, quickFilters]);

    const hasActiveFilters = useMemo(() => {
        const hasQuick =
            quickFilters.activeOnly ||
            quickFilters.onlineOnly ||
            quickFilters.hasLeads ||
            quickFilters.hasQuotes ||
            quickFilters.hasBookings;
        const hasDropdown =
            filters.status.length > 0 ||
            filters.district.length > 0 ||
            filters.rto.length > 0;
        return hasQuick || hasDropdown || search.length > 0;
    }, [quickFilters, filters, search]);


    const handleSort = (key: SortConfig['key']) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const toggleFilter = (type: keyof typeof filters, value: string) => {
        setFilters(prev => {
            const current = prev[type];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [type]: updated };
        });
    };

    const clearFilters = (type: keyof typeof filters) => {
        setFilters(prev => ({ ...prev, [type]: [] }));
    };

    const getStatusConfig = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'ACTIVE':
                return { color: 'text-emerald-600', bg: 'bg-emerald-500', pill: 'bg-emerald-500/10' };
            case 'INACTIVE':
                return { color: 'text-amber-600', bg: 'bg-amber-500', pill: 'bg-amber-500/10' };
            case 'BANNED':
                return { color: 'text-rose-600', bg: 'bg-rose-500', pill: 'bg-rose-500/10' };
            default:
                return { color: 'text-emerald-600', bg: 'bg-emerald-500', pill: 'bg-emerald-500/10' };
        }
    };

    const FilterDropdown = ({ title, options, type, align = 'left' }: { title: string, options: string[], type: keyof typeof filters, align?: 'left' | 'right' }) => (
        <div className="relative">
            <button
                onClick={(e) => { e.stopPropagation(); setActiveFilterDropdown(activeFilterDropdown === type ? null : type); }}
                className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors ${filters[type].length > 0 ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' : 'text-slate-400'}`}
            >
                <Filter size={14} strokeWidth={filters[type].length > 0 ? 3 : 2} />
            </button>
            <AnimatePresence>
                {activeFilterDropdown === type && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className={`absolute top-full mt-2 ${align === 'right' ? 'right-0' : 'left-0'} w-56 bg-white dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-3 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filter {title}</span>
                            {filters[type].length > 0 && (
                                <button onClick={() => clearFilters(type)} className="text-[9px] font-bold text-rose-500 hover:underline">Clear</button>
                            )}
                        </div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {options.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => toggleFilter(type, opt)}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left group"
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${filters[type].includes(opt) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-white/20'}`}>
                                        {filters[type].includes(opt) && <Check size={10} className="text-white" strokeWidth={4} />}
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{opt}</span>
                                </button>
                            ))}
                            {options.length === 0 && <div className="p-4 text-center text-[10px] italic text-slate-400">No options available</div>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <div
            className="flex flex-col h-[calc(100vh-64px)] bg-[#f3f4f6] dark:bg-[#0b0d10] overflow-hidden text-slate-900 dark:text-white"
            onClick={() => setActiveFilterDropdown(null)}
        >
            {/* Header Section */}
            <header className="px-8 py-5 bg-white dark:bg-[#0b0d10] border-b border-slate-200 dark:border-white/5 flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push(`/app/${slug}/members`)}
                        className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Registry // List</p>
                        <h1 className="text-2xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white leading-none">
                            All Members
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group min-w-[320px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search registry..."
                            className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-2xl py-2.5 pl-12 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                        />
                        {search.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                title="Clear search"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/10 transition-all"
                    >
                        <FileText size={16} strokeWidth={2} />
                        <span>Export</span>
                    </button>
                    <button
                        onClick={() => router.push(`/app/${slug}/members/new`)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                    >
                        <Plus size={16} strokeWidth={3} />
                        <span>New</span>
                    </button>
                </div>
            </header>

            {/* List View Table */}
            <main className="flex-1 overflow-hidden p-8 pt-4">
                <div className="h-full bg-white dark:bg-[#0f1115] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02] flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setQuickFilters(prev => ({ ...prev, activeOnly: !prev.activeOnly }))}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${quickFilters.activeOnly ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-white dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10'}`}
                        >
                            Active
                        </button>
                        <button
                            type="button"
                            onClick={() => setQuickFilters(prev => ({ ...prev, onlineOnly: !prev.onlineOnly }))}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${quickFilters.onlineOnly ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' : 'bg-white dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10'}`}
                        >
                            Online
                        </button>
                        <button
                            type="button"
                            onClick={() => setQuickFilters(prev => ({ ...prev, hasLeads: !prev.hasLeads }))}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${quickFilters.hasLeads ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' : 'bg-white dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10'}`}
                        >
                            Leads
                        </button>
                        <button
                            type="button"
                            onClick={() => setQuickFilters(prev => ({ ...prev, hasQuotes: !prev.hasQuotes }))}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${quickFilters.hasQuotes ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-white dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10'}`}
                        >
                            Quotes
                        </button>
                        <button
                            type="button"
                            onClick={() => setQuickFilters(prev => ({ ...prev, hasBookings: !prev.hasBookings }))}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${quickFilters.hasBookings ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-white dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10'}`}
                        >
                            Bookings
                        </button>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={() => {
                                    setQuickFilters({ activeOnly: false, onlineOnly: false, hasLeads: false, hasQuotes: false, hasBookings: false });
                                    setFilters({ status: [], district: [], rto: [] });
                                    setSearch('');
                                }}
                                className="ml-auto px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-rose-500 border border-rose-500/20 hover:bg-rose-500/10 transition-all"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <div className="overflow-x-auto custom-scrollbar flex-1 text-slate-900 dark:text-white">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 z-10 bg-white dark:bg-[#0f1115] border-b border-slate-100 dark:border-white/5 shadow-sm">
                                <tr>
                                    <th className="px-6 py-4 text-left w-[28%] sticky left-0 z-20 bg-white dark:bg-[#0f1115]">
                                        <button onClick={() => handleSort('full_name')} className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300 hover:text-indigo-600 transition-colors">
                                            Registry Profile
                                            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowUp size={8} className={sortConfig.key === 'full_name' && sortConfig.direction === 'asc' ? 'text-indigo-600' : 'text-slate-300'} />
                                                <ArrowDown size={8} className={sortConfig.key === 'full_name' && sortConfig.direction === 'desc' ? 'text-indigo-600' : 'text-slate-300'} />
                                            </div>
                                        </button>
                                    </th>
                                    <th className="px-4 py-4 text-left w-[16%] text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Contact</th>
                                    <th className="px-4 py-4 text-left w-[15%]">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleSort('district')} className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300 hover:text-indigo-600 transition-colors">
                                                Location
                                            </button>
                                            <FilterDropdown title="District" options={filterOptions.district} type="district" />
                                        </div>
                                    </th>
                                    <th className="px-4 py-4 text-center w-[10%] text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Leads</th>
                                    <th className="px-4 py-4 text-center w-[10%] text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Quotes</th>
                                    <th className="px-4 py-4 text-center w-[10%] text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Bookings</th>
                                    <th className="px-4 py-4 text-left w-[12%]">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Status</span>
                                            <FilterDropdown title="Status" options={filterOptions.status} type="status" />
                                        </div>
                                    </th>
                                    <th className="px-4 py-4 text-left w-[10%]">
                                        <button onClick={() => handleSort('created_at')} className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300 hover:text-indigo-600 transition-colors">
                                            Joined On
                                            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowUp size={8} className={sortConfig.key === 'created_at' && sortConfig.direction === 'asc' ? 'text-indigo-600' : 'text-slate-300'} />
                                                <ArrowDown size={8} className={sortConfig.key === 'created_at' && sortConfig.direction === 'desc' ? 'text-indigo-600' : 'text-slate-300'} />
                                            </div>
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-right w-[10%]">
                                        <button onClick={() => handleSort('updated_at')} className="group flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300 hover:text-indigo-600 transition-colors w-full">
                                            Activity
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/[0.02]">
                                {loading ? (
                                    Array(15).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={9} className="px-6 py-3"><div className="h-4 bg-slate-100 dark:bg-white/5 rounded w-full" /></td>
                                        </tr>
                                    ))
                                ) : processedMembers.length > 0 ? (
                                    processedMembers.map((member) => {
                                        const updatedAt = member.updated_at ? new Date(member.updated_at) : null;
                                        const createdAt = member.created_at ? new Date(member.created_at) : null;
                                        return (
                                            <tr
                                                key={member.id}
                                                onClick={() => router.push(`/app/${slug}/members/${member.id}`)}
                                                className="group hover:bg-indigo-50/50 dark:hover:bg-white/[0.03] cursor-pointer transition-all border-l-4 border-transparent hover:border-indigo-600 odd:bg-slate-50/40 dark:odd:bg-white/[0.02]"
                                            >
                                                <td className="px-6 py-2.5 sticky left-0 z-10 bg-white dark:bg-[#0f1115] group-hover:bg-indigo-50/50 dark:group-hover:bg-white/[0.03] group-odd:bg-slate-50/40 dark:group-odd:bg-white/[0.02]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black text-xs shadow-md shadow-indigo-600/10 group-hover:scale-105 transition-transform flex-shrink-0">
                                                            {(member.full_name || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">{member.full_name}</p>
                                                                {onlineUsers.has(member.id) && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wider">
                                                                {member.display_id?.replace(/[^A-Z0-9]/gi, '').match(/.{1,3}/g)?.join('-') || member.display_id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300" title="db: primary_phone">
                                                            {member.primary_phone || '—'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide truncate max-w-[160px]" title="db: primary_email">
                                                            {member.primary_email || '—'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{member.district || member.city || '—'}</span>
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{member.rto || 'NA'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => event.stopPropagation()}
                                                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${member.leads_count ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' : 'bg-slate-100 dark:bg-[#0b0d10] text-slate-400 border-slate-200 dark:border-white/10'}`}
                                                    >
                                                        {member.leads_count || 0}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => event.stopPropagation()}
                                                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${member.quotes_count ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-slate-100 dark:bg-[#0b0d10] text-slate-400 border-slate-200 dark:border-white/10'}`}
                                                    >
                                                        {member.quotes_count || 0}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => event.stopPropagation()}
                                                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${member.bookings_count ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-100 dark:bg-[#0b0d10] text-slate-400 border-slate-200 dark:border-white/10'}`}
                                                    >
                                                        {member.bookings_count || 0}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full ${getStatusConfig(member.member_status).pill}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${getStatusConfig(member.member_status).bg}`} />
                                                        <span className={`text-[9px] font-black uppercase tracking-wider ${getStatusConfig(member.member_status).color}`}>
                                                            {member.member_status || 'ACTIVE'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span
                                                        className="text-xs font-bold text-slate-600 dark:text-slate-300"
                                                        title={createdAt ? createdAt.toLocaleString('en-IN') : '—'}
                                                    >
                                                        {createdAt ? createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-2.5 text-right">
                                                    <span
                                                        className="text-[9px] text-slate-400 font-mono"
                                                        title={updatedAt ? updatedAt.toLocaleString('en-IN') : '—'}
                                                    >
                                                        Updated {formatRelativeTime(updatedAt)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-10 py-20 text-center space-y-4">
                                            <Users size={40} strokeWidth={1} className="mx-auto text-slate-300" />
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                                {hasActiveFilters ? 'No entries match current filters' : 'No entries found'}
                                            </p>
                                            {hasActiveFilters && (
                                                <button
                                                    onClick={() => {
                                                        setQuickFilters({ activeOnly: false, onlineOnly: false, hasLeads: false, hasQuotes: false, hasBookings: false });
                                                        setFilters({ status: [], district: [], rto: [] });
                                                        setSearch('');
                                                    }}
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                                >
                                                    <X size={14} strokeWidth={3} />
                                                    Clear Filters
                                                </button>
                                            )}
                                            <button
                                                onClick={() => router.push(`/app/${slug}/members/new`)}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                                            >
                                                <Plus size={14} strokeWidth={3} />
                                                Add Member
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <footer className="p-4 bg-white dark:bg-[#0f1115] border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <div className="flex items-center gap-4">
                            <span>Showing {members.length} of {totalRecords} records</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Previous
                            </button>
                            <span className="px-2">Page {page} of {totalPages}</span>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
}
