'use client';

import React, { useState } from 'react';
import { RegistrationRule } from '@/types/registration';
import { Calendar, MapPin, Truck, AlertTriangle, Trash2, Info, CheckCircle2, XCircle, User, Globe, Building2 } from 'lucide-react';
import ActivityTimelinePanel from '@/components/modules/context/ActivityTimelinePanel';

interface RuleOverviewProps {
    rule: RegistrationRule;
    onChange: (rule: RegistrationRule) => void;
    onDelete?: () => void;
    readOnly?: boolean;
    auditLogs?: any[];
}

export default function RuleOverview({ rule, onChange, onDelete, readOnly = false, auditLogs = [] }: RuleOverviewProps) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [isHovered, setIsHovered] = useState(false);

    const update = (field: keyof RegistrationRule, value: any) => {
        onChange({ ...rule, [field]: value });
    };

    const handleDeleteConfirm = () => {
        if (deleteConfirmation === 'DELETE' && onDelete) {
            onDelete();
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full px-4 pb-12">
            {/* Desktop: Side-by-Side Layout for "Above the Fold" */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
                {/* Hero Section - Left Column (8/12) */}
                <div className="xl:col-span-8 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-indigo-950 p-8 shadow-2xl group flex flex-col justify-between min-h-[400px]">
                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full -mr-48 -mt-48 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -ml-32 -mb-32" />

                    {/* Maharashtra Map Asset */}
                    <div className="absolute right-0 top-0 h-full w-2/3 opacity-40 mix-blend-screen pointer-events-none group-hover:opacity-60 transition-opacity duration-1000">
                        <img
                            src="/images/maps/maharashtra_map.png"
                            alt="Maharashtra Map"
                            className="h-full w-full object-contain object-right transform scale-110 group-hover:scale-125 transition-transform duration-1000"
                        />
                    </div>

                    <div className="relative z-10 w-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${rule.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${rule.status === 'ACTIVE' ? 'bg-green-400 animate-ping' : 'bg-gray-400'}`} />
                                {rule.status}
                            </div>
                        </div>

                        <div className="relative group/name mb-8">
                            <input
                                className="text-4xl lg:text-5xl font-black text-white w-full bg-transparent border-none focus:ring-0 p-0 transition-all placeholder-white/20 tracking-tighter"
                                value={rule.ruleName}
                                onChange={e => update('ruleName', e.target.value)}
                                readOnly={readOnly}
                                placeholder="Rule Name..."
                            />
                            <div className="h-0.5 w-24 bg-blue-500 group-hover/name:w-full transition-all duration-500 rounded-full mt-2" />
                        </div>

                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-3 text-white/60">
                                <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform">
                                    <MapPin size={18} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 text-white/90">Jurisdiction</p>
                                    <select
                                        className="bg-transparent text-sm font-bold text-white border-none p-0 focus:ring-0 cursor-pointer hover:text-blue-400 transition-colors"
                                        value={rule.stateCode}
                                        onChange={e => update('stateCode', e.target.value)}
                                        disabled={readOnly}
                                    >
                                        <option value="" className="bg-slate-900">Select State</option>
                                        <option value="MH" className="bg-slate-900">Maharashtra</option>
                                        <option value="KA" className="bg-slate-900">Karnataka</option>
                                        <option value="DL" className="bg-slate-900">Delhi</option>
                                        <option value="GJ" className="bg-slate-900">Gujarat</option>
                                        <option value="TN" className="bg-slate-900">Tamil Nadu</option>
                                        <option value="TS" className="bg-slate-900">Telangana</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-white/60">
                                <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform">
                                    <Truck size={18} className="text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 text-white/90">Vehicle Category</p>
                                    <select
                                        className="bg-transparent text-sm font-bold text-white border-none p-0 focus:ring-0 cursor-pointer hover:text-indigo-400 transition-colors"
                                        value={rule.vehicleType}
                                        onChange={e => update('vehicleType', e.target.value)}
                                        disabled={readOnly}
                                    >
                                        <option value="TWO_WHEELER" className="bg-slate-900">Two Wheeler</option>
                                        <option value="THREE_WHEELER" className="bg-slate-900">Three Wheeler</option>
                                        <option value="FOUR_WHEELER" className="bg-slate-900">Four Wheeler</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 w-full flex justify-end mt-8">
                        <div className="p-4 bg-white/10 rounded-[2rem] backdrop-blur-md border border-white/10 text-right group-hover:translate-x-[-8px] transition-transform min-w-[180px]">
                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Effective Date</p>
                            <input
                                type="date"
                                className="bg-transparent text-lg font-black text-blue-400 border-none p-0 focus:ring-0 text-right cursor-pointer w-full"
                                value={rule.effectiveFrom}
                                onChange={e => update('effectiveFrom', e.target.value)}
                                readOnly={readOnly}
                            />
                        </div>
                    </div>
                </div>

                {/* Dashboard Metrics Grid - Right Column (4/12) */}
                <div className="xl:col-span-4 flex flex-col gap-4 h-full">
                    {/* Metric 1: State Tenure */}
                    <div className="flex-1 group relative bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 dark:border-white/10 shadow-lg hover:shadow-xl transition-all flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Standard Tenure</p>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <User size={18} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <input
                                type="number"
                                className="text-4xl font-black text-slate-900 dark:text-white w-full bg-transparent border-none p-0 focus:ring-0 leading-none tracking-tighter"
                                value={rule.stateTenure || 15}
                                onChange={e => update('stateTenure', parseFloat(e.target.value) || 0)}
                                readOnly={readOnly}
                            />
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Years</span>
                        </div>
                    </div>

                    {/* Metric 2: BH Tenure */}
                    <div className="flex-1 group relative bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 dark:border-white/10 shadow-lg hover:shadow-xl transition-all flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Bharat Cycle</p>
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Globe size={18} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <input
                                type="number"
                                className="text-4xl font-black text-slate-900 dark:text-white w-full bg-transparent border-none p-0 focus:ring-0 leading-none tracking-tighter"
                                value={rule.bhTenure || 2}
                                onChange={e => update('bhTenure', parseFloat(e.target.value) || 0)}
                                readOnly={readOnly}
                            />
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Years</span>
                        </div>
                    </div>

                    {/* Metric 3: Company Multiplier */}
                    <div className="flex-1 group relative bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 dark:border-white/10 shadow-lg hover:shadow-xl transition-all flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Corp Multiplier</p>
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                <Building2 size={18} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <input
                                type="number"
                                step="0.1"
                                className="text-4xl font-black text-slate-900 dark:text-white w-full bg-transparent border-none p-0 focus:ring-0 leading-none tracking-tighter"
                                value={rule.companyMultiplier || 1}
                                onChange={e => update('companyMultiplier', parseFloat(e.target.value) || 1)}
                                readOnly={readOnly}
                            />
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">x</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Tax Info Banner */}
            <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-2xl shadow-indigo-200 overflow-hidden relative">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="flex items-center gap-4 relative">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                        <Info size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest leading-none mb-1">Smart Engine Logic</h4>
                        <p className="text-[11px] text-white/95 font-medium">The values above automatically sync with the Formula Studio to calculate pro-rata taxes and corporate surcharges in real-time.</p>
                    </div>
                </div>
            </div>

            {/* Advanced Management & Danger Zone */}
            <div className="pt-12 border-t border-gray-100 dark:border-slate-800 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5">
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 leading-none">Advanced Management</h4>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">Control rule visibility and lifecycle state here.</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-[1.5rem] border border-slate-200 dark:border-white/10 shadow-sm">
                            <div className={`p-2 rounded-xl ${rule.status === 'ACTIVE' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                                {rule.status === 'ACTIVE' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                            </div>
                            <div className="pr-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none mb-1">Status</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{rule.status}</p>
                            </div>
                            {!readOnly && (
                                <button
                                    onClick={() => update('status', rule.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${rule.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rule.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            )}
                        </div>

                        {!readOnly && onDelete && (
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-6 py-4 rounded-[1.5rem] transition-colors border border-transparent hover:border-red-100"
                            >
                                <Trash2 size={18} /> Delete Rule
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-800">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <div className="p-2 bg-red-100 rounded-full">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-lg font-bold">Delete Verification</h3>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            This action cannot be undone. This will permanently delete the rule
                            <span className="font-bold text-gray-900 dark:text-white"> "{rule.ruleName}"</span>.
                        </p>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                Type <span className="text-red-600 select-none">DELETE</span> to confirm
                            </label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none"
                                value={deleteConfirmation}
                                onChange={e => setDeleteConfirmation(e.target.value)}
                                placeholder="Type DELETE"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeleteConfirmation(''); }}
                                className="px-6 py-3 text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 rounded-2xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={deleteConfirmation !== 'DELETE'}
                                className="px-8 py-3 text-xs font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-red-200 transition-all"
                            >
                                Confirm Permanent Deletion
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Log / Event Log */}
            {auditLogs && auditLogs.length > 0 && (
                <div className="pt-8 border-t border-gray-100 dark:border-slate-800">
                    <ActivityTimelinePanel
                        entity={{ name: rule.ruleName, id: rule.displayId || rule.id }}
                        activities={auditLogs}
                    />
                </div>
            )}
        </div>
    );
}
