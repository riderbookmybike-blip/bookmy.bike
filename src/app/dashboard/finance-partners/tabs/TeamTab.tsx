import React, { useState, useEffect, useMemo } from 'react';
import { BankTeamMember, BankDesignation, MemberStatus } from '@/types/bankPartner';
import {
    User,
    Phone,
    Mail,
    Plus,
    Trash2,
    Calendar,
    MapPin,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Search,
    Filter,
    ShieldCheck,
    Briefcase,
    Trophy,
    Loader2,
} from 'lucide-react';
import { normalizeIndianPhone, parseDateToISO } from '@/lib/utils/inputFormatters';
import { createClient } from '@/lib/supabase/client';

const DESIGNATIONS: { value: BankDesignation; label: string; level: number }[] = [
    { value: 'SYSTEM_ADMIN', label: 'System Admin', level: 7 },
    { value: 'NATIONAL_SALES_MANAGER', label: 'National Sales Manager', level: 6 },
    { value: 'ZONAL_MANAGER', label: 'Zonal Manager', level: 5 },
    { value: 'REGIONAL_SALES_MANAGER', label: 'Regional Sales Manager', level: 4 },
    { value: 'AREA_SALES_MANAGER', label: 'Area Sales Manager', level: 3 },
    { value: 'TEAM_LEADER', label: 'Team Leader', level: 2 },
    { value: 'EXECUTIVE', label: 'Executive', level: 1 },
];

const MOCK_LOCATIONS = {
    states: ['Maharashtra', 'Gujarat', 'Karnataka', 'Delhi'],
    areas: {
        Maharashtra: ['Pune', 'Mumbai', 'Nagpur', 'Nashik'],
        Gujarat: ['Ahmedabad', 'Surat', 'Vadodara'],
        Karnataka: ['Bangalore', 'Mysore'],
        Delhi: ['Central Delhi', 'South Delhi'],
    },
    dealers: {
        Pune: ['Pashankar Auto', 'Seva TVS', 'BMB Pune Central'],
        Mumbai: ['BMB Seawoods', 'Linkway Honda'],
        Ahmedabad: ['BMB Ahmedabad West', 'Karnavati Suzuki'],
    },
};

export default function TeamTab({
    team: initialTeam,
    admin,
}: {
    team: BankTeamMember[];
    admin?: { name: string; phone: string; email: string };
}) {
    const [team, setTeam] = useState<BankTeamMember[]>(initialTeam);
    const [selectedMember, setSelectedMember] = useState<BankTeamMember | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Member Lookup State
    const [lookupMobile, setLookupMobile] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [hasFoundExisting, setHasFoundExisting] = useState(false);
    const [newMemberData, setNewMemberData] = useState({ name: '', email: '', phone: '' });

    const [searchQuery, setSearchQuery] = useState('');
    const [dealerSearch, setDealerSearch] = useState('');
    const [dealers, setDealers] = useState<any[]>([]);
    const [dealerLoading, setDealerLoading] = useState(false);

    useEffect(() => {
        const fetchDealers = async () => {
            setDealerLoading(true);
            const supabase = createClient();
            const { data: dealerTenants, error } = await supabase
                .from('id_tenants')
                .select('id, name, status')
                .eq('type', 'DEALER')
                .order('name', { ascending: true });

            if (error) {
                console.error('Dealer fetch failed:', error);
                setDealerLoading(false);
                return;
            }

            const dealerIds = (dealerTenants || []).map(d => d.id);
            let locations: any[] = [];
            if (dealerIds.length > 0) {
                const { data: locs, error: locErr } = await supabase
                    .from('id_locations')
                    .select('tenant_id, district, state')
                    .in('tenant_id', dealerIds);
                if (locErr) {
                    console.error('Dealer locations fetch failed:', locErr);
                } else {
                    locations = locs || [];
                }
            }

            const locMap = new Map<string, any>();
            locations.forEach(l => {
                if (!locMap.has(l.tenant_id)) locMap.set(l.tenant_id, l);
            });

            const mapped = (dealerTenants || []).map(d => ({
                id: d.id,
                name: d.name,
                status: d.status,
                district: locMap.get(d.id)?.district || '',
                state: locMap.get(d.id)?.state || '',
            }));

            setDealers(mapped);
            setDealerLoading(false);
        };

        fetchDealers();
    }, []);

    const filteredDealers = useMemo(() => {
        const q = dealerSearch.trim().toLowerCase();
        if (!q) return dealers;
        return dealers.filter(
            d =>
                d.name.toLowerCase().includes(q) ||
                d.district.toLowerCase().includes(q) ||
                d.state.toLowerCase().includes(q)
        );
    }, [dealerSearch, dealers]);

    // If admin is provide but not in team list, we should consider it as part of the team for display purposes if filtered
    const filteredTeam = team.filter(
        m =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.phone.includes(searchQuery)
    );

    const handleLookup = () => {
        setIsSearching(true);
        setTimeout(() => {
            setIsSearching(false);

            // 1. Check current team
            const existingInTeam = team.find(m => m.phone === lookupMobile);
            if (existingInTeam) {
                setSelectedMember(existingInTeam);
                setHasFoundExisting(true);
                return;
            }

            // 2. Check Admin (since it's passed separately)
            if (admin && admin.phone === lookupMobile) {
                setNewMemberData({ name: admin.name, email: admin.email, phone: admin.phone });
                setHasFoundExisting(true);
                return;
            }

            // 3. Simulated Global Lookup (e.g. User's number)
            if (lookupMobile === '9820760596' || lookupMobile === '9876543210') {
                const foundName = lookupMobile === '9820760596' ? 'Ajit Singh Rajpurohit' : 'Amit Sharma';
                const foundEmail = lookupMobile === '9820760596' ? 'ajit@bookmy.bike' : 'amit@hdfc.com';
                setNewMemberData({ name: foundName, email: foundEmail, phone: lookupMobile });
            } else {
                setNewMemberData({ name: '', email: '', phone: lookupMobile });
            }
            setHasFoundExisting(true);
        }, 800);
    };

    return (
        <div className="space-y-6">
            {/* Header / Controls */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 p-6 rounded-[32px] border border-slate-200 dark:border-white/5">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search team by name or email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:border-blue-500 transition-all outline-none"
                    />
                </div>
                <button
                    onClick={() => {
                        setSelectedMember(null);
                        setIsModalOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-blue-500/20"
                >
                    <Plus size={16} /> Add Member
                </button>
            </div>

            {/* Member List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Auto-display Admin */}
                {admin && (
                    <div className="group bg-blue-600/5 dark:bg-blue-600/10 border-2 border-dashed border-blue-500/30 dark:border-blue-500/20 rounded-[32px] p-6 shadow-sm hover:shadow-2xl hover:border-blue-500 transition-all relative overflow-hidden">
                        <div className="absolute top-6 right-6">
                            <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/40">
                                Partner Admin
                            </span>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center border border-blue-500/50">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                    {admin.name}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                        Chief Administrator
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-6 border-t border-slate-200/50 dark:border-white/5">
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                <Mail size={14} className="text-blue-400" />
                                <span className="font-bold truncate">{admin.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                <Phone size={14} className="text-blue-400" />
                                <span className="font-bold font-mono">{admin.phone}</span>
                            </div>
                            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2">
                                <CheckCircle2 size={14} className="text-blue-500" />
                                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none">
                                    System Root Contact
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {filteredTeam.map(member => (
                    <div
                        key={member.id}
                        className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-6 shadow-sm hover:shadow-2xl hover:border-blue-500/30 transition-all cursor-pointer relative overflow-hidden"
                        onClick={() => {
                            setSelectedMember(member);
                            setIsModalOpen(true);
                        }}
                    >
                        {/* Status Light */}
                        <div
                            className={`absolute top-6 right-6 w-2 h-2 rounded-full ${
                                member.status === 'ACTIVE'
                                    ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                    : member.status === 'ON_NOTICE'
                                      ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                      : 'bg-red-500 opacity-50'
                            }`}
                        />

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors border border-dashed border-slate-300 dark:border-white/10">
                                <User size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                    {member.name}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                        {DESIGNATIONS.find(d => d.value === member.designation)?.label ||
                                            member.designation}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                <Mail size={14} className="text-slate-300" />
                                <span className="font-bold truncate">{member.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                <Phone size={14} className="text-slate-300" />
                                <span className="font-bold font-mono">{member.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                <MapPin size={14} className="text-slate-300" />
                                <span className="font-bold uppercase tracking-tighter italic">
                                    {member.serviceability.states.join(', ')} • {member.serviceability.areas.length}{' '}
                                    Areas
                                </span>
                            </div>
                        </div>

                        {member.status === 'ON_NOTICE' && (
                            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
                                <AlertCircle size={14} className="text-amber-500" />
                                <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
                                    On Notice Period
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Manage Member Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[40px] border border-slate-200 dark:border-white/10 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-10">
                            <div className="flex items-start justify-between mb-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                            <Briefcase size={20} />
                                        </span>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                            {selectedMember ? 'Manage Team Member' : 'Add New Member'}
                                        </h2>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] ml-11">
                                        Personnel Detail & Serviceability Engine
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setHasFoundExisting(false);
                                        setLookupMobile('');
                                        setNewMemberData({ name: '', email: '', phone: '' });
                                    }}
                                    className="bg-slate-100 dark:bg-white/5 p-3 rounded-2xl hover:bg-red-500/10 hover:text-red-500 transition-all"
                                >
                                    <Plus size={24} className="rotate-45" />
                                </button>
                            </div>

                            {!selectedMember && !hasFoundExisting ? (
                                <div className="max-w-md mx-auto py-20 text-center space-y-8">
                                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-500">
                                        <Search size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tighter italic mb-2 text-slate-900 dark:text-white">
                                            Mobile Lookup
                                        </h3>
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">
                                            Enter phone number to check if member already exists
                                        </p>
                                    </div>
                                    <div className="relative">
                                        <Phone
                                            className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"
                                            size={20}
                                        />
                                        <input
                                            type="text"
                                            placeholder="98765 43210"
                                            value={lookupMobile}
                                            onChange={e => setLookupMobile(normalizeIndianPhone(e.target.value))}
                                            onPaste={e => {
                                                const text = e.clipboardData.getData('text');
                                                const normalized = normalizeIndianPhone(text);
                                                if (normalized) {
                                                    e.preventDefault();
                                                    setLookupMobile(normalized);
                                                }
                                            }}
                                            className="w-full bg-slate-50 dark:bg-black/40 border-2 border-slate-200 dark:border-white/5 rounded-[24px] pl-16 pr-6 py-6 text-xl font-black font-mono outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleLookup}
                                        disabled={lookupMobile.length < 10 || isSearching}
                                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black uppercase tracking-widest py-6 rounded-[24px] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                                    >
                                        {isSearching ? (
                                            <Loader2 size={24} className="animate-spin" />
                                        ) : (
                                            <ChevronRight size={24} />
                                        )}
                                        Proceed to Onboard
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-12 gap-10">
                                        {/* Left: Profile Info */}
                                        <div className="col-span-12 md:col-span-7 space-y-8">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="col-span-2">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                                                        Full Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        defaultValue={selectedMember?.name || newMemberData.name}
                                                        className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                                                        Email Address
                                                    </label>
                                                    <input
                                                        type="email"
                                                        defaultValue={selectedMember?.email || newMemberData.email}
                                                        className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                                                        Phone Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        defaultValue={selectedMember?.phone || newMemberData.phone}
                                                        onInput={e => {
                                                            e.currentTarget.value = normalizeIndianPhone(
                                                                e.currentTarget.value
                                                            );
                                                        }}
                                                        onPaste={e => {
                                                            const text = e.clipboardData.getData('text');
                                                            const normalized = normalizeIndianPhone(text);
                                                            if (normalized) {
                                                                e.preventDefault();
                                                                e.currentTarget.value = normalized;
                                                            }
                                                        }}
                                                        className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-sm font-bold font-mono outline-none focus:border-blue-500 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                                                        Designation
                                                    </label>
                                                    <select
                                                        defaultValue={selectedMember?.designation}
                                                        className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-xs font-black uppercase tracking-widest outline-none focus:border-blue-500 transition-all appearance-none"
                                                    >
                                                        {DESIGNATIONS.map(d => (
                                                            <option key={d.value} value={d.value}>
                                                                {d.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                                                        Member Status
                                                    </label>
                                                    <select
                                                        defaultValue={selectedMember?.status}
                                                        className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-xs font-black uppercase tracking-widest outline-none focus:border-blue-500 transition-all appearance-none"
                                                    >
                                                        <option value="ACTIVE">Active</option>
                                                        <option value="ON_NOTICE">On Notice Period</option>
                                                        <option value="RELEASED">Released / Exited</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block flex items-center gap-1.5">
                                                        <Calendar size={12} /> DOB
                                                    </label>
                                                    <input
                                                        type="date"
                                                        defaultValue={selectedMember?.dob}
                                                        onPaste={e => {
                                                            const text = e.clipboardData.getData('text');
                                                            const parsed = parseDateToISO(text);
                                                            if (parsed) {
                                                                e.preventDefault();
                                                                e.currentTarget.value = parsed;
                                                            }
                                                        }}
                                                        className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl p-3 text-[10px] font-bold outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block flex items-center gap-1.5">
                                                        <ShieldCheck size={12} /> DOJ
                                                    </label>
                                                    <input
                                                        type="date"
                                                        defaultValue={selectedMember?.doj}
                                                        onPaste={e => {
                                                            const text = e.clipboardData.getData('text');
                                                            const parsed = parseDateToISO(text);
                                                            if (parsed) {
                                                                e.preventDefault();
                                                                e.currentTarget.value = parsed;
                                                            }
                                                        }}
                                                        className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl p-3 text-[10px] font-bold outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block flex items-center gap-1.5">
                                                        <Trophy size={12} /> Anniv.
                                                    </label>
                                                    <input
                                                        type="date"
                                                        defaultValue={selectedMember?.anniversary}
                                                        onPaste={e => {
                                                            const text = e.clipboardData.getData('text');
                                                            const parsed = parseDateToISO(text);
                                                            if (parsed) {
                                                                e.preventDefault();
                                                                e.currentTarget.value = parsed;
                                                            }
                                                        }}
                                                        className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl p-3 text-[10px] font-bold outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Serviceability Engine */}
                                        <div className="col-span-12 md:col-span-5 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[32px] p-8 space-y-8">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                                    <MapPin size={16} className="text-emerald-500" />
                                                    Serviceability Engine
                                                </h4>
                                                <button className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline">
                                                    Select All States
                                                </button>
                                            </div>

                                            <div className="space-y-6">
                                                {/* State Selection */}
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 italic opacity-60">
                                                        1. Territories (States)
                                                    </label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {MOCK_LOCATIONS.states.map(s => (
                                                            <button
                                                                key={s}
                                                                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-tighter hover:border-blue-500/50 transition-all"
                                                            >
                                                                {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Cascading Area Selection */}
                                                <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 italic">
                                                        2. Serviceable Areas
                                                    </label>
                                                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl min-h-[80px] flex flex-wrap gap-2 items-center">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase italic mx-auto">
                                                            Select states to view areas
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Cascading Dealer Selection */}
                                                <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 italic">
                                                        3. Linked Dealerships (BMB Connect)
                                                    </label>
                                                    <div className="relative">
                                                        <Search
                                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                            size={12}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Search BMB Dealer Network..."
                                                            value={dealerSearch}
                                                            onChange={e => setDealerSearch(e.target.value)}
                                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-3 text-[10px] font-bold outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-2 mt-2 max-h-[120px] overflow-y-auto pr-2">
                                                        {dealerLoading ? (
                                                            <div className="text-[10px] text-slate-400 font-bold uppercase italic px-2 py-3">
                                                                Loading dealers...
                                                            </div>
                                                        ) : filteredDealers.length === 0 ? (
                                                            <div className="text-[10px] text-slate-400 font-bold uppercase italic px-2 py-3">
                                                                No dealers found
                                                            </div>
                                                        ) : (
                                                            filteredDealers.map((d: any) => (
                                                                <div
                                                                    key={d.id}
                                                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                                        <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">
                                                                            {d.name}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[8px] font-black text-slate-400 italic">
                                                                        {d.district || d.state || '—'}
                                                                    </span>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-12 flex gap-4">
                                        <button
                                            onClick={() => {
                                                if (!selectedMember) {
                                                    setTeam(prev => [
                                                        ...prev,
                                                        {
                                                            id: `t${prev.length + 1}`,
                                                            ...newMemberData,
                                                            designation: 'EXECUTIVE',
                                                            status: 'ACTIVE',
                                                            serviceability: { states: [], areas: [], dealerIds: [] },
                                                        },
                                                    ]);
                                                }
                                                setIsModalOpen(false);
                                                setHasFoundExisting(false);
                                                setLookupMobile('');
                                                setNewMemberData({ name: '', email: '', phone: '' });
                                            }}
                                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 text-white font-black uppercase tracking-widest py-4 rounded-[20px] text-xs transition-all ring-offset-2 focus:ring-2 ring-blue-500"
                                        >
                                            {selectedMember ? 'Update Personnel Detail' : 'Confirm & Add Member'}
                                        </button>
                                        {selectedMember && (
                                            <button className="px-8 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-slate-400">
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
