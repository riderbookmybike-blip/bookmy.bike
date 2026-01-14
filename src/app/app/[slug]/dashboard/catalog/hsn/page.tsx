'use client';

import React, { useState, useEffect } from 'react';
import { HSNConfig } from '@/types/productMaster';
import { mockStore } from '@/lib/mock/mockStore';
import { Plus, Edit3, Trash2, FileText, CheckCircle2, Percent, Info, ShieldAlert } from 'lucide-react';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import { KpiCard } from '@/components/dashboard/DashboardWidgets';

const DEFAULT_HSN: HSNConfig[] = [
    { id: 'hsn-1', code: '871120', description: 'Motorcycles with reciprocating internal combustion piston engine of a cylinder capacity exceeding 50cc but not exceeding 250cc', gstRate: 28, type: 'VEHICLE' },
    { id: 'hsn-2', code: '871130', description: 'Motorcycles exceeding 250cc but not exceeding 500cc', gstRate: 28, type: 'VEHICLE' },
    { id: 'hsn-3', code: '650610', description: 'Safety Headgear (Helmets)', gstRate: 18, type: 'ACCESSORY' },
    { id: 'hsn-4', code: '871410', description: 'Parts and accessories of motorcycles (including mopeds)', gstRate: 18, type: 'PART' },
    { id: 'hsn-5', code: '998729', description: 'Maintenance and repair services of motorcycles', gstRate: 18, type: 'SERVICE' }
];

const HSN_COLUMNS = [
    {
        key: 'code',
        header: 'HSN Classification',
        type: 'rich' as const,
        icon: FileText,
        subtitle: (item: any) => item.description
    },
    { key: 'gstRateDisplay', header: 'GST Rate', type: 'badge' as const, width: '100px' },
    { key: 'type', header: 'Type', type: 'badge' as const, width: '120px' },
];

export default function HSNMasterPage() {
    const [hsnList, setHsnList] = useState<HSNConfig[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHsn, setEditingHsn] = useState<HSNConfig | null>(null);

    useEffect(() => {
        const persisted = mockStore.getOrGenerate('catalog_hsn_master', () => DEFAULT_HSN);
        setHsnList(persisted);
    }, []);

    const displayData = hsnList.map(h => ({
        ...h,
        gstRateDisplay: `${h.gstRate}%`
    }));

    const metrics = (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-8 mb-4">
            {[
                { label: 'Total Codes', value: hsnList.length, icon: FileText, color: 'text-blue-500' },
                { label: 'High Tax (28%)', value: hsnList.filter(h => h.gstRate === 28).length, icon: ShieldAlert, color: 'text-emerald-500' },
                { label: 'Tax Variants', value: 2, icon: Percent, color: 'text-purple-500' },
                { label: 'Compliance', value: "100%", icon: Info, color: 'text-amber-500' },
            ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-4 flex flex-col justify-center relative overflow-hidden group shadow-sm">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.label}</span>
                    <div className="flex items-center gap-2">
                        <stat.icon size={16} className={stat.color} />
                        <span className="text-xl font-black italic text-slate-800 dark:text-white tracking-tighter">{stat.value}</span>
                    </div>
                </div>
            ))}
        </div>
    );

    const handleSave = (data: Partial<HSNConfig>) => {
        let newList;
        if (editingHsn) {
            newList = hsnList.map(h => h.id === editingHsn.id ? { ...h, ...data } : h);
        } else {
            const newHsn: HSNConfig = {
                id: `hsn-${Date.now()}`,
                code: data.code || '',
                description: data.description || '',
                gstRate: data.gstRate || 0,
                type: data.type || 'VEHICLE'
            };
            newList = [...hsnList, newHsn];
        }
        setHsnList(newList);
        mockStore.set('catalog_hsn_master', newList);
        setIsModalOpen(false);
        setEditingHsn(null);
    };

    return (
        <MasterListDetailLayout mode="list-only">
            <ListPanel
                title="HSN & GST Directory"
                columns={HSN_COLUMNS}
                data={displayData}
                actionLabel="Register HSN Code"
                onActionClick={() => { setEditingHsn(null); setIsModalOpen(true); }}
                metrics={metrics}
            />

            {isModalOpen && (
                <HSNModal
                    hsn={editingHsn}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </MasterListDetailLayout>
    );
}

function HSNModal({ hsn, onClose, onSave }: { hsn: HSNConfig | null, onClose: () => void, onSave: (data: Partial<HSNConfig>) => void }) {
    const [formData, setFormData] = useState<Partial<HSNConfig>>(hsn || {
        code: '',
        description: '',
        gstRate: 28,
        type: 'VEHICLE'
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-white/10 shadow-2xl p-12 space-y-8 animate-in zoom-in-95 duration-300">
                <div>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-2 leading-none italic">
                        {hsn ? 'Update Entry' : 'New Registration'}
                    </p>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                        {hsn ? 'Edit HSN Details' : 'Register HSN Code'}
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">HSN Code (6-Digit)</label>
                        <input
                            type="text"
                            maxLength={6}
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            placeholder="e.g. 871120"
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-black dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">GST Rate (%)</label>
                        <input
                            type="number"
                            value={formData.gstRate}
                            onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-black dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Classification Description</label>
                    <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="PROVIDE DETAILED CLASSIFICATION AS PER GST TARIFF..."
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-black uppercase tracking-tight dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none resize-none"
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Applicable Entity Type</label>
                    <div className="grid grid-cols-4 gap-3">
                        {['VEHICLE', 'ACCESSORY', 'PART', 'SERVICE'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setFormData({ ...formData, type: t as any })}
                                className={`py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${formData.type === t
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20'
                                    : 'bg-slate-50 dark:bg-white/5 text-slate-400 border-slate-100 dark:border-white/5 hover:border-blue-500/50'
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-8 py-4 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                        Discard
                    </button>
                    <button
                        onClick={() => onSave(formData)}
                        className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all"
                    >
                        Finalize & Save
                    </button>
                </div>
            </div>
        </div>
    );
}
