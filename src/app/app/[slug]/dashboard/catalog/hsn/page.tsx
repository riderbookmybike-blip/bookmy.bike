'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Edit3,
    Trash2,
    FileText,
    CheckCircle2,
    Percent,
    Info,
    ShieldAlert,
    Copy,
    Calendar,
    Check,
    X,
} from 'lucide-react';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';

type HSNRow = Database['public']['Tables']['cat_hsn_codes']['Row'];

interface HSNRecord {
    id: string;
    code: string;
    description: string;
    gstRate: number;
    cessRate: number;
    type: string;
    class?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    isActive: boolean;
}

export default function HSNMasterPage() {
    const [hsnList, setHsnList] = useState<HSNRecord[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHsn, setEditingHsn] = useState<HSNRecord | null>(null);

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'VEHICLE' | 'ACCESSORY' | 'PART'>(
        'ALL'
    );

    const loadHSN = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from('cat_hsn_codes')
            .select('*')
            .order('code')
            .order('effective_from', { ascending: false });

        if (data) {
            const mapped = (data as HSNRow[]).map(d => ({
                id: `${d.code}-${d.effective_from}`,
                code: d.code,
                description: d.description,
                gstRate: d.gst_rate,
                cessRate: d.cess_rate || 0,
                type: d.type || 'VEHICLE',
                class: d.class || '',
                effectiveFrom: d.effective_from || '',
                effectiveTo: d.effective_to || '',
                isActive: d.is_active ?? true,
            }));
            setHsnList(mapped);
        }
    };

    useEffect(() => {
        loadHSN();
    }, []);

    // Filter Logic
    const filteredList = React.useMemo(() => {
        let filtered = hsnList;

        if (activeFilter === 'ACTIVE') filtered = filtered.filter(h => h.isActive);
        if (activeFilter === 'INACTIVE') filtered = filtered.filter(h => !h.isActive);
        if (activeFilter === 'VEHICLE') filtered = filtered.filter(h => h.type === 'VEHICLE');
        if (activeFilter === 'ACCESSORY') filtered = filtered.filter(h => h.type === 'ACCESSORY');
        if (activeFilter === 'PART') filtered = filtered.filter(h => h.type === 'PART');

        if (sortConfig) {
            filtered = [...filtered].sort((a: any, b: any) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [hsnList, activeFilter, sortConfig]);

    const displayData = filteredList.map(h => ({
        ...h,
        gstRateDisplay: h.cessRate > 0 ? `${h.gstRate}% + ${h.cessRate}%` : `${h.gstRate}%`,
        effectiveDisplay: h.effectiveFrom
            ? new Date(h.effectiveFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : '-',
        effectiveToDisplay: h.effectiveTo
            ? new Date(h.effectiveTo).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : '-',
        statusDisplay: h.isActive ? 'ACTIVE' : 'INACTIVE',
        typeDisplay: h.type,
    }));

    const metrics = (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-8 mb-4">
            {[
                {
                    id: 'ALL',
                    label: 'Total Codes',
                    value: hsnList.length,
                    icon: FileText,
                    color: 'text-blue-500',
                    active: activeFilter === 'ALL',
                },
                {
                    id: 'ACTIVE',
                    label: 'Active',
                    value: hsnList.filter(h => h.isActive).length,
                    icon: Check,
                    color: 'text-emerald-500',
                    active: activeFilter === 'ACTIVE',
                },
                {
                    id: 'INACTIVE',
                    label: 'Inactive',
                    value: hsnList.filter(h => !h.isActive).length,
                    icon: X,
                    color: 'text-slate-400',
                    active: activeFilter === 'INACTIVE',
                },
                {
                    id: 'VEHICLE',
                    label: 'Vehicles',
                    value: hsnList.filter(h => h.type === 'VEHICLE').length,
                    icon: ShieldAlert,
                    color: 'text-indigo-500',
                    active: activeFilter === 'VEHICLE',
                },
                {
                    id: 'ACCESSORY',
                    label: 'Parts & Acc.',
                    value: hsnList.filter(h => h.type === 'ACCESSORY' || h.type === 'PART').length,
                    icon: Percent,
                    color: 'text-purple-500',
                    active: activeFilter === 'ACCESSORY' || activeFilter === 'PART',
                },
            ].map((stat, i) => (
                <button
                    key={i}
                    onClick={() => setActiveFilter(stat.id as any)}
                    className={`transition-all duration-300 border rounded-[32px] p-4 flex flex-col justify-center relative overflow-hidden group shadow-sm text-left ${
                        stat.active
                            ? 'bg-blue-50/50 dark:bg-white/10 border-blue-500 ring-1 ring-blue-500'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 hover:border-blue-200'
                    }`}
                >
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                        {stat.label}
                    </span>
                    <div className="flex items-center gap-2">
                        <stat.icon size={16} className={stat.color} />
                        <span className="text-xl font-black italic text-slate-800 dark:text-white tracking-tighter">
                            {stat.value}
                        </span>
                    </div>
                </button>
            ))}
        </div>
    );

    const handleSave = async (data: Partial<HSNRecord>) => {
        if (!data.code || !data.description || data.gstRate === undefined) {
            alert('Missing required fields');
            return;
        }

        const supabase = createClient();
        const payload: Database['public']['Tables']['cat_hsn_codes']['Insert'] = {
            code: data.code,
            description: data.description,
            gst_rate: data.gstRate,
            cess_rate: data.cessRate || 0,
            type: data.type || 'VEHICLE',
            class: data.class || null,
            effective_from: data.effectiveFrom || new Date().toISOString().split('T')[0],
            effective_to: data.effectiveTo || null,
            is_active: data.isActive ?? true,
        };

        const { error } = await supabase.from('cat_hsn_codes').upsert(payload as any);

        if (!error) {
            loadHSN();
            setIsModalOpen(false);
            setEditingHsn(null);
        } else {
            console.error(error);
            alert('Failed to save HSN Code');
        }
    };

    const handleClone = (item: HSNRecord) => {
        setEditingHsn({ ...item, code: '', effectiveFrom: '', effectiveTo: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (item: HSNRecord) => {
        setEditingHsn({ ...item });
        setIsModalOpen(true);
    };

    const handleQuickAction = (action: string, item: any) => {
        console.log('Quick Action:', action, item);
        if (action === 'edit') {
            handleEdit(item);
        } else if (action === 'delete') {
            handleClone(item); // Use clone for revision
        }
    };

    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current?.key === key) {
                return current.direction === 'asc' ? { key, direction: 'desc' } : null;
            }
            return { key, direction: 'asc' };
        });
    };

    const columns = [
        {
            key: 'code',
            header: 'HSN Code',
            type: 'rich' as const,
            icon: FileText,
            width: '250px',
            subtitle: (item: any) => item.class || item.description,
        },
        { key: 'gstRateDisplay', header: 'GST + Cess', type: 'badge' as const, width: '120px' },
        { key: 'typeDisplay', header: 'Type', type: 'badge' as const, width: '120px' },
        { key: 'effectiveDisplay', header: 'Effective From', type: 'text' as const, width: '140px' },
        { key: 'effectiveToDisplay', header: 'Effective To', type: 'text' as const, width: '140px' },
        { key: 'statusDisplay', header: 'Status', type: 'badge' as const, width: '100px' },
    ];

    return (
        <MasterListDetailLayout mode="list-only">
            <ListPanel
                title="HSN & GST Directory"
                columns={columns}
                data={displayData}
                actionLabel="Register HSN Code"
                onActionClick={() => {
                    setEditingHsn(null);
                    setIsModalOpen(true);
                }}
                metrics={metrics}
                showIndex
                onQuickAction={handleQuickAction}
            />

            {isModalOpen && <HSNModal hsn={editingHsn} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
        </MasterListDetailLayout>
    );
}

function HSNModal({
    hsn,
    onClose,
    onSave,
}: {
    hsn: HSNRecord | null;
    onClose: () => void;
    onSave: (data: Partial<HSNRecord>) => void;
}) {
    const [formData, setFormData] = useState<Partial<HSNRecord>>(
        hsn || {
            code: '',
            description: '',
            gstRate: 18,
            cessRate: 0,
            type: 'VEHICLE',
            class: '',
            effectiveFrom: '2025-09-22',
            effectiveTo: '',
            isActive: true,
        }
    );

    useEffect(() => {
        if (hsn) {
            setFormData(hsn);
        }
    }, [hsn]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-white/10 shadow-2xl p-8 space-y-5 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-1 leading-none italic">
                            {hsn && hsn.code ? 'Update Entry' : 'New Registration'}
                        </p>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                            {hsn && hsn.code ? 'Edit HSN Details' : 'Register HSN Code'}
                        </h2>
                    </div>
                    {/* Active Toggle */}
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                            formData.isActive
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'bg-slate-200 text-slate-500 border-slate-200'
                        }`}
                    >
                        {formData.isActive ? '● Active' : '○ Inactive'}
                    </button>
                </div>

                <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
                            HSN Code
                        </label>
                        <input
                            type="text"
                            maxLength={8}
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                            placeholder="87112019"
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-sm font-black dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
                            GST Rate
                        </label>
                        <select
                            value={formData.gstRate}
                            onChange={e => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-sm font-black dark:text-white outline-none appearance-none"
                        >
                            <option value={0}>0%</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                            <option value={28}>28%</option>
                            <option value={40}>40%</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
                            Cess Rate
                        </label>
                        <select
                            value={formData.cessRate}
                            onChange={e => setFormData({ ...formData, cessRate: Number(e.target.value) })}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-sm font-black dark:text-white outline-none appearance-none"
                        >
                            <option value={0}>0%</option>
                            <option value={1}>1%</option>
                            <option value={3}>3%</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
                            Type
                        </label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-sm font-black dark:text-white outline-none appearance-none"
                        >
                            <option value="VEHICLE">Vehicle</option>
                            <option value="ACCESSORY">Accessory</option>
                            <option value="PART">Part</option>
                            <option value="SERVICE">Service</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
                            Effective From
                        </label>
                        <input
                            type="date"
                            value={formData.effectiveFrom}
                            onChange={e => setFormData({ ...formData, effectiveFrom: e.target.value })}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-sm font-bold dark:text-white outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
                            Effective To (leave empty for current)
                        </label>
                        <input
                            type="date"
                            value={formData.effectiveTo || ''}
                            onChange={e => setFormData({ ...formData, effectiveTo: e.target.value })}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-sm font-bold dark:text-white outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
                        Class / Short Label
                    </label>
                    <input
                        type="text"
                        value={formData.class}
                        onChange={e => setFormData({ ...formData, class: e.target.value })}
                        placeholder="e.g. ICE Scooter upto 125cc"
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-sm font-bold dark:text-white outline-none"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
                        Description
                    </label>
                    <textarea
                        rows={2}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Full GST tariff description..."
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-xs font-bold dark:text-white outline-none resize-none"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onSave(formData)}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
