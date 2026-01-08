'use client';

import React, { useState } from 'react';
import { InsuranceRule } from '@/types/insurance';
import {
    Calendar,
    Shield,
    Percent,
    Hash,
    CheckCircle2,
    XCircle,
    Trash2,
    AlertTriangle,
    Info,
    MapPin,
    Zap,
    Building,
    ShieldCheck,
    Banknote
} from 'lucide-react';

interface InsuranceOverviewProps {
    rule: InsuranceRule;
    onChange: (rule: InsuranceRule) => void;
    onDelete?: () => void;
    readOnly?: boolean;
}

export default function InsuranceOverview({ rule, onChange, onDelete, readOnly = false }: InsuranceOverviewProps) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    const update = (field: keyof InsuranceRule, value: any) => {
        onChange({ ...rule, [field]: value });
    };

    const handleDeleteConfirm = () => {
        if (deleteConfirmation === 'DELETE' && onDelete) {
            onDelete();
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full px-4 pb-12">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-8 md:p-12 shadow-2xl group min-h-[400px] flex items-center">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full -mr-48 -mt-48 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -ml-32 -mb-32" />

                {/* Maharashtra Map Asset */}
                <div className="absolute right-0 top-0 h-full w-1/2 opacity-20 mix-blend-screen pointer-events-none group-hover:opacity-40 transition-opacity duration-1000">
                    <img
                        src="/Users/rathoreajitmsingh/.gemini/antigravity/brain/05a45dfe-37f9-481e-985d-34dcb883f948/maharashtra_map_premium_1767475857202.png"
                        alt="State Context"
                        className="h-full w-full object-contain object-right transform scale-110 group-hover:scale-125 transition-transform duration-1000"
                    />
                </div>

                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8 w-full">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${rule.status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${rule.status === 'ACTIVE' ? 'bg-blue-400 animate-ping' : 'bg-gray-400'}`} />
                                {rule.status}
                            </div>
                        </div>

                        <div className="relative group/name">
                            <input
                                className="text-4xl md:text-6xl font-black text-white w-full bg-transparent border-none focus:ring-0 p-0 transition-all placeholder-white/20 tracking-tighter"
                                value={rule.ruleName}
                                onChange={e => update('ruleName', e.target.value)}
                                readOnly={readOnly}
                                placeholder="Insurer Rule Name..."
                            />
                            <div className="h-0.5 w-24 bg-blue-500 group-hover/name:w-full transition-all duration-500 rounded-full mt-2" />
                        </div>

                        <div className="flex flex-wrap items-center gap-6 pt-4">
                            <div className="flex items-center gap-3 text-white/60">
                                <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform">
                                    <Building size={18} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 text-white/90">Insurer</p>
                                    <input
                                        className="bg-transparent text-sm font-bold text-white border-none p-0 focus:ring-0 hover:text-blue-400 transition-colors"
                                        value={rule.insurerName}
                                        onChange={e => update('insurerName', e.target.value)}
                                        readOnly={readOnly}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-white/60">
                                <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform">
                                    <MapPin size={18} className="text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 text-white/90">State</p>
                                    <select
                                        className="bg-transparent text-sm font-bold text-white border-none p-0 focus:ring-0 cursor-pointer hover:text-indigo-400 transition-colors"
                                        value={rule.stateCode}
                                        onChange={e => update('stateCode', e.target.value)}
                                        disabled={readOnly}
                                    >
                                        <option value="MH" className="bg-slate-900">Maharashtra</option>
                                        <option value="KA" className="bg-slate-900">Karnataka</option>
                                        <option value="DL" className="bg-slate-900">Delhi</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 min-w-48">
                        <div className="w-full p-4 bg-white/10 rounded-[2rem] backdrop-blur-md border border-white/10 text-right group-hover:translate-x-[-8px] transition-transform">
                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Effective Date</p>
                            <input
                                type="date"
                                className="bg-transparent text-lg font-black text-blue-400 border-none p-0 focus:ring-0 text-right cursor-pointer"
                                value={rule.effectiveFrom}
                                onChange={e => update('effectiveFrom', e.target.value)}
                                readOnly={readOnly}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* IDV % Card */}
                <div className="bg-white/40 dark:bg-white/5 rounded-3xl p-6 border border-white dark:border-white/10 shadow-xl group hover:scale-[1.02] transition-all duration-500">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-600/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                            <ShieldCheck size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest leading-none">IDV Basis</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{rule.idvPercentage}%</span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase italic">of Ex-Showroom</span>
                    </div>
                </div>

                {/* GST % Card */}
                <div className="bg-white/40 dark:bg-white/5 rounded-3xl p-6 border border-white dark:border-white/10 shadow-xl group hover:scale-[1.02] transition-all duration-500">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-600/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                            <Zap size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest leading-none">GST Rate</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{rule.gstPercentage}%</span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase italic">Standard</span>
                    </div>
                </div>

                {/* Components Count Card */}
                <div className="bg-white/40 dark:bg-white/5 rounded-3xl p-6 border border-white dark:border-white/10 shadow-xl group hover:scale-[1.02] transition-all duration-500">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-amber-100 dark:bg-amber-600/30 text-amber-600 dark:text-amber-400 rounded-2xl">
                            <Banknote size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest leading-none">Covers</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{rule.odComponents.length + rule.tpComponents.length + rule.addons.length}</span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase italic">Active</span>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-2xl shadow-blue-200 overflow-hidden relative">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="flex items-center gap-4 relative">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                        <Info size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest leading-none mb-1">Insurance Rule Logic</h4>
                        <p className="text-[11px] text-white/95 font-medium tracking-wide">IDV is automatically derived from Ex-Showroom. OD and Add-ons are calculated on IDV, while TP is usually a slab-based fixed charge.</p>
                    </div>
                </div>
            </div>

            {/* Status Control */}
            <div className="pt-12 border-t border-slate-100 dark:border-white/5">
                <div className="p-8 bg-white/40 dark:bg-white/5 rounded-3xl border border-white dark:border-white/10 shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1 italic">Status Management</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest opacity-80 mt-2">Control the visibility and lifecycle of this rule</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {['DRAFT', 'ACTIVE', 'INACTIVE'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => !readOnly && onChange({ ...rule, status: status as any })}
                                    className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${rule.status === status
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl border border-transparent'
                                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-100 dark:border-white/5'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {!readOnly && onDelete && (
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-6 py-4 rounded-[1.5rem] transition-colors"
                        >
                            <Trash2 size={18} /> Delete Rule
                        </button>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <div className="p-2 bg-red-100 rounded-full">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-lg font-bold">Confirm Deletion</h3>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            Type <span className="font-bold text-gray-900 dark:text-white">DELETE</span> to confirm permanent removal.
                        </p>

                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none mb-6"
                            value={deleteConfirmation}
                            onChange={e => setDeleteConfirmation(e.target.value)}
                            placeholder="Type DELETE"
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeleteConfirmation(''); }}
                                className="px-6 py-3 text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 rounded-2xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={deleteConfirmation !== 'DELETE'}
                                className="px-8 py-3 text-xs font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 rounded-2xl disabled:opacity-50 shadow-xl shadow-red-200"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
