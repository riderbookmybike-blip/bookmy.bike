'use client';

import React, { useState } from 'react';
import { BankScheme } from '@/types/bankPartner';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import SchemeEditor from '../SchemeEditor';

import Modal from '@/components/ui/Modal';

export default function SchemesTab({ schemes: initialSchemes }: { schemes: BankScheme[] }) {
    const [schemes, setSchemes] = useState<BankScheme[]>(initialSchemes);
    const [isEditing, setIsEditing] = useState(false);
    const [editingSchemeId, setEditingSchemeId] = useState<string | null>(null);

    const handleSave = (updatedScheme: BankScheme) => {
        if (editingSchemeId) {
            setSchemes(schemes.map(s => s.id === editingSchemeId ? updatedScheme : s));
        } else {
            setSchemes([...schemes, updatedScheme]);
        }
        setIsEditing(false);
        setEditingSchemeId(null);
    };

    const handleDelete = (id: string) => {
        setSchemes(schemes.filter(s => s.id !== id));
    };

    // Note: We removed the conditional return here. The editor now lives in the Modal below.

    // Note: We removed the conditional return here. The editor now lives in the Modal below.

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Schemes</h2>
                <button
                    onClick={() => { setEditingSchemeId(null); setIsEditing(true); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Plus size={16} /> Create Scheme
                </button>
            </div>

            <Modal
                isOpen={isEditing}
                onClose={() => { setIsEditing(false); setEditingSchemeId(null); }}
                title={editingSchemeId ? "Edit Scheme" : "Create New Scheme"}
                size="full"
            >
                <SchemeEditor
                    initialScheme={schemes.find(s => s.id === editingSchemeId)}
                    onSave={handleSave}
                    onCancel={() => { setIsEditing(false); setEditingSchemeId(null); }}
                />
            </Modal>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-white/5">
                            <th className="p-4 w-10 border-b border-slate-200 dark:border-white/5 pl-6">
                                <div className="w-4 h-4 rounded border border-slate-300 dark:border-white/20"></div>
                            </th>
                            <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest p-4 border-b border-slate-200 dark:border-white/5">Scheme Details</th>
                            <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest p-4 border-b border-slate-200 dark:border-white/5">Tenure</th>
                            <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest p-4 border-b border-slate-200 dark:border-white/5">ROI & Type</th>
                            <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest p-4 border-b border-slate-200 dark:border-white/5">LTV</th>
                            <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest p-4 border-b border-slate-200 dark:border-white/5">Charges</th>
                            <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest p-4 border-b border-slate-200 dark:border-white/5 text-right pr-6">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schemes.map((scheme) => (
                            <tr
                                key={scheme.id}
                                onClick={() => { setEditingSchemeId(scheme.id); setIsEditing(true); }}
                                className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-blue-600/5 transition-colors cursor-pointer group"
                            >
                                <td className="p-4 pl-6">
                                    <div className="w-4 h-4 rounded border border-slate-300 dark:border-white/20 group-hover:border-blue-500 transition-colors"></div>
                                </td>
                                <td className="p-4">
                                    <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{scheme.name}</div>
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{scheme.id}</div>
                                </td>
                                <td className="p-4">
                                    <span className="font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-black/30 px-2 py-1 rounded border border-slate-200 dark:border-white/5">
                                        {scheme.minTenure} - {scheme.maxTenure} m
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">{scheme.interestRate}%</span>
                                        <span className="text-[9px] text-slate-500 uppercase tracking-wider">{scheme.interestType}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{scheme.maxLTV}%</span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{scheme.charges.length} Rules</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right pr-6">
                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider ${scheme.isActive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-transparent'
                                        }`}>
                                        {scheme.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {schemes.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-2xl mt-6">
                    <p className="text-slate-500 font-bold mb-4">No active schemes found.</p>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-blue-400 hover:text-blue-300 text-sm font-bold underline"
                    >
                        Create your first scheme
                    </button>
                </div>
            )}
        </div>
    );
}
