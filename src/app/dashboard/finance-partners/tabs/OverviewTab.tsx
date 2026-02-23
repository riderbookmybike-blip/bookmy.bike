'use client';

import React, { useEffect, useState } from 'react';
import {
    Building2,
    Activity,
    Globe,
    Mail,
    Phone,
    ShieldCheck,
    CheckCircle2,
    Clock,
    BarChart4,
    MapPin,
    Zap,
    Camera,
    Smartphone,
    MessagesSquare,
    Headphones,
    ExternalLink,
    Loader2,
} from 'lucide-react';
import { BankPartner } from '@/types/bankPartner';
import { createClient } from '@/lib/supabase/client';
import { updateBankIdentity, getBankActivityLog } from '../actions';
import { getErrorMessage } from '@/lib/utils/errorMessage';

type ActivityItem = {
    id: string;
    title: string;
    detail: string;
    time: string;
    color: string;
    quoteId?: string;
};

export default function OverviewTab({ partner: initialPartner }: { partner: BankPartner }) {
    const [partner, setPartner] = useState(initialPartner);
    const [uploading, setUploading] = useState<'FULL' | 'ICON' | null>(null);
    const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);
    const [activityLoading, setActivityLoading] = useState(true);

    // Fetch real activity log
    useEffect(() => {
        const fetchActivity = async () => {
            setActivityLoading(true);
            const res = await getBankActivityLog(partner.id);
            if (res.success && res.activities) {
                setActivityLog(res.activities as ActivityItem[]);
            }
            setActivityLoading(false);
        };
        fetchActivity();
    }, [partner.id]);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'FULL' | 'ICON') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(type);
        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `bank-${type.toLowerCase()}-${partner.id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload to 'tenants' bucket
            const { error: uploadError } = await supabase.storage
                .from('id_tenants')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const {
                data: { publicUrl },
            } = supabase.storage.from('id_tenants').getPublicUrl(filePath);

            // 3. Update DB via Server Action
            const updates = type === 'FULL' ? { fullLogo: publicUrl } : { iconLogo: publicUrl };
            const res = await updateBankIdentity(partner.id, updates);

            if (res.success) {
                setPartner(prev => ({
                    ...prev,
                    identity: {
                        ...(prev.identity || { fullLogo: '', iconLogo: '' }),
                        ...(type === 'FULL' ? { fullLogo: publicUrl } : { iconLogo: publicUrl }),
                    },
                }));
            } else {
                alert('Database update failed: ' + res.error);
            }
        } catch (error: unknown) {
            console.error('Logo upload error:', error);
            alert('Failed to upload logo: ' + (error instanceof Error ? getErrorMessage(error) : 'Unknown error'));
        } finally {
            setUploading(null);
        }
    };

    return (
        <div className="p-12 pt-4">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                {[
                    {
                        label: 'Active Schemes',
                        value: partner.schemes.length,
                        icon: ShieldCheck,
                        color: 'text-blue-500',
                        bg: 'bg-blue-500/10',
                    },
                    {
                        label: 'Avg. TAT',
                        value: '2.5 Days',
                        icon: Clock,
                        color: 'text-amber-600',
                        bg: 'bg-amber-500/10',
                    },
                    {
                        label: 'Approval Rate',
                        value: '78%',
                        icon: Activity,
                        color: 'text-emerald-600',
                        bg: 'bg-emerald-500/10',
                    },
                    {
                        label: 'Disbursal Vol.',
                        value: '₹4.2 Cr',
                        icon: BarChart4,
                        color: 'text-purple-600',
                        bg: 'bg-purple-500/10',
                    },
                ].map((stat, i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-8 shadow-sm dark:shadow-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all hover:scale-[1.02] duration-300"
                    >
                        <div
                            className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} blur-[50px] -z-0 opacity-20 dark:opacity-40 group-hover:opacity-100 transition-opacity`}
                        />
                        <div className="relative z-10">
                            <stat.icon size={22} className={`${stat.color} mb-5`} />
                            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-2">
                                {stat.label}
                            </div>
                            <div className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                                {stat.value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Main Content Area */}
                <div className="col-span-8 space-y-8">
                    {/* Partner Bio & Identities */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-10 relative overflow-hidden shadow-sm dark:shadow-2xl">
                        <div className="flex items-start justify-between mb-10">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-1 flex items-center gap-3">
                                    <span className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                        <Building2 size={18} />
                                    </span>
                                    Partner Profile
                                </h3>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] ml-11">
                                    Entity Description & Identity
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                            <div className="space-y-6">
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed italic font-medium opacity-80 pl-1">
                                    {partner.overview.description ||
                                        'Leading financial institution providing specialized credit solutions for the automotive sector, with a primary focus on two-wheeler personal loans and dealer inventory financing.'}
                                </p>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-white/5">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                                <Globe size={14} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                                                    Website
                                                </div>
                                                <div className="text-xs text-blue-600 dark:text-blue-400 font-bold truncate max-w-[120px]">
                                                    {partner.overview.website || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                                <MessagesSquare size={14} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                                                    WhatsApp
                                                </div>
                                                <div className="text-xs text-slate-700 dark:text-white font-bold">
                                                    {partner.overview.whatsapp || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                                <Phone size={14} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                                                    Customer Care
                                                </div>
                                                <div className="text-xs text-slate-700 dark:text-white font-bold">
                                                    {partner.overview.customerCare ||
                                                        partner.overview.supportPhone ||
                                                        'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                                <Headphones size={14} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                                                    Helpline
                                                </div>
                                                <div className="text-xs text-slate-700 dark:text-white font-bold">
                                                    {partner.overview.helpline || '1800-XXX-XXXX'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* LOGO MANAGEMENT */}
                            <div className="bg-slate-50 dark:bg-black/40 rounded-3xl border border-slate-200 dark:border-white/5 p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Brand Identity
                                    </h4>
                                    <span className="text-[8px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase">
                                        Updateable
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Full Logo Slot */}
                                    <div className="space-y-3">
                                        <div className="aspect-video bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center relative overflow-hidden group">
                                            {partner.identity?.fullLogo ? (
                                                <img
                                                    src={partner.identity.fullLogo}
                                                    alt="Full Logo"
                                                    className="max-h-[70%] max-w-[80%] object-contain"
                                                />
                                            ) : (
                                                <Building2 className="text-slate-200 dark:text-slate-700" size={32} />
                                            )}

                                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                {uploading === 'FULL' ? (
                                                    <Loader2 className="animate-spin text-white" size={24} />
                                                ) : (
                                                    <div className="p-2 bg-white rounded-full text-black hover:scale-110 transition-transform">
                                                        <Camera size={16} />
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={e => handleLogoUpload(e, 'FULL')}
                                                    disabled={uploading !== null}
                                                />
                                            </label>
                                        </div>
                                        <p className="text-[9px] font-black text-center text-slate-500 uppercase tracking-tighter italic">
                                            Corporate Logo (Wide)
                                        </p>
                                    </div>

                                    {/* App Icon Slot */}
                                    <div className="space-y-3">
                                        <div className="aspect-square bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center relative overflow-hidden group">
                                            {partner.identity?.iconLogo ? (
                                                <img
                                                    src={partner.identity.iconLogo}
                                                    alt="Icon Logo"
                                                    className="w-12 h-12 object-contain"
                                                />
                                            ) : (
                                                <Building2 className="text-slate-200 dark:text-slate-700" size={24} />
                                            )}

                                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                {uploading === 'ICON' ? (
                                                    <Loader2 className="animate-spin text-white" size={24} />
                                                ) : (
                                                    <div className="p-2 bg-white rounded-full text-black hover:scale-110 transition-transform">
                                                        <Camera size={16} />
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={e => handleLogoUpload(e, 'ICON')}
                                                    disabled={uploading !== null}
                                                />
                                            </label>
                                        </div>
                                        <p className="text-[9px] font-black text-center text-slate-500 uppercase tracking-tighter italic">
                                            App Icon (Square)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lending Parameters Matrix */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-10 shadow-sm dark:shadow-2xl">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                                <span className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    <Zap size={18} />
                                </span>
                                Underwriting
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { label: 'Min Credit Score', value: '650+', detail: 'CIBIL / Experian' },
                                    { label: 'Max LTV', value: '95%', detail: 'On Ex-Showroom' },
                                ].map((p, i) => (
                                    <div
                                        key={i}
                                        className="bg-slate-50 dark:bg-black/40 p-5 rounded-[24px] border border-slate-200 dark:border-white/5 shadow-inner hover:bg-slate-100 dark:hover:bg-black/20 transition-colors group"
                                    >
                                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-2 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors">
                                            {p.label}
                                        </div>
                                        <div className="text-xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                                            {p.value}
                                        </div>
                                        <div className="text-[9px] text-slate-500 font-black mt-2 uppercase tracking-[0.1em]">
                                            {p.detail}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-10 shadow-sm dark:shadow-2xl">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                                <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                    <Smartphone size={18} />
                                </span>
                                Platform Links
                            </h3>
                            <div className="space-y-4">
                                <div className="p-5 bg-slate-50 dark:bg-black/40 rounded-[24px] border border-slate-200 dark:border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Android App
                                        </div>
                                        <ExternalLink size={12} className="text-slate-400 group-hover:text-blue-500" />
                                    </div>
                                    <div className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate group-hover:text-blue-400 transition-colors italic">
                                        {partner.overview.appLinks?.android || 'Link not configured'}
                                    </div>
                                </div>
                                <div className="p-5 bg-slate-50 dark:bg-black/40 rounded-[24px] border border-slate-200 dark:border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            iOS App
                                        </div>
                                        <ExternalLink size={12} className="text-slate-400 group-hover:text-blue-500" />
                                    </div>
                                    <div className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate group-hover:text-blue-400 transition-colors italic">
                                        {partner.overview.appLinks?.ios || 'Link not configured'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="col-span-4 space-y-8">
                    {/* Active Reach */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-8 shadow-sm dark:shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">
                                Active Reach
                            </h3>
                            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                                LIVE
                            </span>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500">
                                        <MapPin size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                        Total Branches
                                    </span>
                                </div>
                                <span className="text-sm font-black text-slate-900 dark:text-white tracking-widest">
                                    450+
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500">
                                        <Activity size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                        Dealers Connected
                                    </span>
                                </div>
                                <span className="text-sm font-black text-slate-900 dark:text-white tracking-widest">
                                    12,840
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-8 shadow-sm dark:shadow-2xl">
                        <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-8 border-b border-slate-100 dark:border-white/5 pb-6">
                            Activity Log
                        </h3>
                        <div className="space-y-6">
                            {activityLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 size={20} className="animate-spin text-blue-500" />
                                </div>
                            ) : activityLog.length === 0 ? (
                                <div className="text-center py-8">
                                    <Activity size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        No finance activity yet
                                    </p>
                                </div>
                            ) : (
                                activityLog.map(log => {
                                    const dotColor: Record<string, string> = {
                                        blue: 'bg-blue-500',
                                        amber: 'bg-amber-500',
                                        orange: 'bg-orange-500',
                                        emerald: 'bg-emerald-500',
                                        rose: 'bg-rose-500',
                                    };

                                    // Relative time
                                    const diff = Date.now() - new Date(log.time).getTime();
                                    const mins = Math.floor(diff / 60000);
                                    const hrs = Math.floor(mins / 60);
                                    const days = Math.floor(hrs / 24);
                                    const timeAgo =
                                        mins < 1
                                            ? 'Just now'
                                            : mins < 60
                                              ? `${mins}m ago`
                                              : hrs < 24
                                                ? `${hrs}h ago`
                                                : days < 30
                                                  ? `${days}d ago`
                                                  : new Date(log.time).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                    });

                                    return (
                                        <div key={log.id} className="flex gap-3">
                                            <div
                                                className={`w-1.5 h-1.5 rounded-full ${dotColor[log.color] || 'bg-blue-500'} mt-1.5 shrink-0`}
                                            />
                                            <div>
                                                <div className="text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                                                    {log.title}
                                                </div>
                                                <div className="text-[11px] text-slate-500 mt-0.5">{log.detail}</div>
                                                <div className="text-[9px] text-slate-400 mt-1">{timeAgo}</div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
