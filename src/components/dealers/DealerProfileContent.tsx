'use client';

import React, { useState, useEffect } from 'react';
import {
    Building2,
    MapPin,
    Users,
    Package,
    Settings,
    Activity,
    Fingerprint,
    Globe,
    Shield,
    Landmark,
    Zap,
    ChevronRight,
    ShieldCheck
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { format } from 'date-fns';

// Settings Components
import IdentitySettings from '@/components/dealers/settings/IdentitySettings';
import LocationSettings from '@/components/dealers/settings/LocationSettings';
import ComplianceSettings from '@/components/dealers/settings/ComplianceSettings';
import FinanceSettings from '@/components/dealers/settings/FinanceSettings';

interface DealerProfileContentProps {
    dealerId: string;
    superAdminMode?: boolean; // If true, shows Network View / back buttons
    currentTenantSlug?: string; // Needed for back links
    isCompanyProfile?: boolean;
}

export default function DealerProfileContent({ dealerId, superAdminMode = false, currentTenantSlug, isCompanyProfile = false }: DealerProfileContentProps) {
    const [activeTab, setActiveTab] = useState('config');
    const [dealer, setDealer] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Config Sub-tab
    const [configTab, setConfigTab] = useState('identity');

    useEffect(() => {
        if (dealerId) {
            fetchDealerDetails(dealerId);
        }
    }, [dealerId]);

    const fetchDealerDetails = async (id: string) => {
        setLoading(true);
        const supabase = createClient();
        const { data: tenant } = await supabase.from('id_tenants').select('*').eq('id', id).single();
        if (tenant) {
            setDealer(tenant);
            const { data: team } = await supabase
                .from('id_team')
                .select('*, user:user_id(full_name, email, primary_phone, avatar_url)')
                .eq('tenant_id', id);
            if (team) setMembers(team);
        }
        setLoading(false);
    };

    if (loading) return <div className="flex h-[80vh] items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
    if (!dealer) return <div className="p-10 text-center text-slate-400">Dealer not found</div>;

    return (
        <div className="space-y-6 pb-24 animate-in fade-in duration-500">
            {/* 1. Integrated Hero Header */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 p-8 md:p-10">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] -ml-20 -mb-20 pointer-events-none" />

                <div className="relative flex flex-col md:flex-row justify-between gap-8 items-start md:items-center">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center shadow-2xl shadow-black/20">
                            {dealer.logo_url ? (
                                <img src={dealer.logo_url} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                                <Building2 size={36} className="text-slate-600" />
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-white tracking-tight">{dealer.name}</h1>
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    {dealer.status} Node
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
                                <span className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors cursor-pointer">
                                    <MapPin size={14} /> {dealer.location || 'Location Pending'}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-700" />
                                <span className="flex items-center gap-1.5 font-mono opacity-60">
                                    <Fingerprint size={14} /> {dealer.slug}
                                </span>
                            </div>
                        </div>
                    </div>

                    {superAdminMode && currentTenantSlug && (
                        <div className="flex items-center gap-3">
                            <Link href={`/app/${currentTenantSlug}/dashboard/dealers`} className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 transition-colors uppercase tracking-wider">
                                Network View
                            </Link>
                            {/* Live Dashboard Button could go here */}
                        </div>
                    )}
                </div>

                {/* Navigation Pills */}
                <div className="flex items-center gap-2 mt-10 p-1.5 bg-black/20 backdrop-blur-md rounded-2xl w-fit border border-white/5">
                    <NavPill id="overview" label="Performance" icon={Activity} active={activeTab} onClick={setActiveTab} />
                    <NavPill id="team" label="Team Access" icon={Users} active={activeTab} onClick={setActiveTab} />
                    <NavPill id="inventory" label="Inventory" icon={Package} active={activeTab} onClick={setActiveTab} />
                    <NavPill id="config" label="Settings & Config" icon={Settings} active={activeTab} onClick={setActiveTab} />
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Main Content */}
                <div className="lg:col-span-8 space-y-6">
                    {activeTab === 'config' && (
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Settings Navigation Sidebar */}
                            <div className="w-full md:w-64 shrink-0 space-y-2">
                                <h3 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 mt-1">Configuration</h3>
                                <ConfigNavBtn id="identity" label="Identity" sublabel="Logo & Brand" icon={Fingerprint} active={configTab} onClick={setConfigTab} />
                                <ConfigNavBtn id="locations" label="Locations" sublabel="Showrooms/Hubs" icon={Globe} active={configTab} onClick={setConfigTab} />
                                <ConfigNavBtn id="compliance" label="Compliance" sublabel="Docs & Legal" icon={Shield} active={configTab} onClick={setConfigTab} />
                                <ConfigNavBtn id="finance" label="Finance" sublabel="Bank Accounts" icon={Landmark} active={configTab} onClick={setConfigTab} />
                            </div>

                            {/* Settings Viewport */}
                            <div className="flex-1 min-h-[600px] bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 relative">
                                <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                                    {configTab === 'identity' && <Fingerprint size={120} className="text-white" />}
                                    {configTab === 'locations' && <Globe size={120} className="text-white" />}
                                    {configTab === 'compliance' && <Shield size={120} className="text-white" />}
                                    {configTab === 'finance' && <Landmark size={120} className="text-white" />}
                                </div>

                                <div className="relative z-10">
                                    {configTab === 'identity' && <IdentitySettings dealer={dealer} onUpdate={() => fetchDealerDetails(dealer.id)} />}
                                    {configTab === 'locations' && <LocationSettings dealerId={dealer.id} />}
                                    {configTab === 'compliance' && <ComplianceSettings dealerId={dealer.id} />}
                                    {configTab === 'finance' && <FinanceSettings dealerId={dealer.id} />}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'overview' && (
                        <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500 bg-slate-900/50">
                            <Activity size={48} className="mx-auto text-slate-700 mb-4" />
                            <h3 className="text-xl font-bold text-white">Performance Overview</h3>
                            <p className="text-sm mt-2">Charts and metrics coming in next update.</p>
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Team Members</h3>
                                    <p className="text-xs text-slate-500">Manage access and roles.</p>
                                </div>
                                <button className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-lg transition-colors border border-indigo-500/20 uppercase tracking-wider">
                                    + Add Member
                                </button>
                            </div>
                            <div className="divide-y divide-slate-800">
                                {members.map((member) => (
                                    <div key={member.id} className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold text-xs ring-1 ring-white/10">
                                                {member.user?.full_name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{member.user?.full_name || 'Unknown User'}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-xs text-slate-500 font-mono">{member.role}</p>
                                                    {member.reports_to && <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">↳ Reports</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">{member.status}</span>
                                    </div>
                                ))}
                                {members.length === 0 && <div className="p-10 text-center text-slate-600 font-mono text-xs">NO MEMBERS FOUND</div>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Stats */}
                <div className="lg:col-span-4 space-y-6">


                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">System Metadata</h3>
                        <div className="space-y-4">
                            <MetadataRow label="Created" value={format(new Date(dealer.created_at), 'dd MMM yyyy')} />
                            <MetadataRow label="Zone" value="West Zone (MH)" />
                            <MetadataRow label="Type" value={dealer.type.replace('_', ' ')} />
                            <MetadataRow label="System ID" value={dealer.id.slice(0, 8)} isMono />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Minimal Sub-components for Polish
const NavPill = ({ id, label, icon: Icon, active, onClick }: any) => (
    <button
        onClick={() => onClick(id)}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${active === id
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
    >
        <Icon size={14} />
        {label}
    </button>
);

const ConfigNavBtn = ({ id, label, sublabel, icon: Icon, active, onClick }: any) => {
    const isActive = active === id;
    return (
        <button
            onClick={() => onClick(id)}
            className={`w-full group flex items-center justify-between p-3 rounded-xl transition-all border ${isActive
                ? 'bg-indigo-500/10 border-indigo-500/20'
                : 'bg-transparent border-transparent hover:bg-white/5'
                }`}
        >
            <div className={`flex items-center gap-3 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-600 group-hover:bg-slate-700'}`}>
                    <Icon size={16} />
                </div>
                <div className="text-left">
                    <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{label}</p>
                    <p className="text-[10px] font-medium opacity-60">{sublabel}</p>
                </div>
            </div>
            {isActive && <ChevronRight size={14} className="text-indigo-500" />}
        </button>
    );
};

const MetadataRow = ({ label, value, isMono }: any) => (
    <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-500 uppercase">{label}</span>
        <span className={`font-bold text-slate-300 ${isMono ? 'font-mono' : ''}`}>{value}</span>
    </div>
);
