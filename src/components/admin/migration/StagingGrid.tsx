'use client';

import React, { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Edit2, Save, X, Check, ArrowRight, Table as TableIcon } from 'lucide-react';
import { toast } from 'sonner';

import { migrateUsersFromFirebase } from '@/actions/admin/user-migration';

import { SchemaMapper } from './SchemaMapper';

interface StagingGridProps {
    collectionName: string;
    rows: any[];
    onRefresh: () => void;
}

export function StagingGrid({ collectionName, rows, onRefresh }: StagingGridProps) {
    const supabase = createClient();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<string>(''); // JSON string for editing
    const [filterText, setFilterText] = useState('');
    const [isMigratingUsers, setIsMigratingUsers] = useState(false);
    const [showMapper, setShowMapper] = useState(false);

    // Dynamic Columns based on first few rows (simplification)
    // We will show: ID, Status, Data (JSON Preview), Actions

    // Derived: Flattened keys for a better view? 
    // For now, let's keep it simple: Doc ID | Status | JSON Data (Editable)

    const handleEdit = (row: any) => {
        setEditingId(row.id);
        setEditData(JSON.stringify(row.data, null, 2));
    };

    const handleSave = async (id: string) => {
        try {
            const parsed = JSON.parse(editData);

            const { error } = await supabase
                .from('firebase_antigravity')
                .update({ data: parsed, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            toast.success('Row updated successfully');
            setEditingId(null);
            onRefresh();
        } catch (e: any) {
            toast.error('Invalid JSON or Update Failed: ' + e.message);
        }
    };

    const handleUserMigration = async () => {
        if (!confirm('Start BULK processing users? This will run until all RAW users are migrated.')) return;
        setIsMigratingUsers(true);
        let totalMigrated = 0;
        let batchCount = 0;
        const BATCH_SIZE = 5000; // Increased to 5k as requested

        try {
            while (true) {
                // Call recursive action
                const res = await migrateUsersFromFirebase(BATCH_SIZE);

                if (!res.success) {
                    toast.error('Migration Aborted due to error');
                    break;
                }

                if (res.migratedCount === 0) {
                    toast.success('Migration Complete! No more users to migrate.');
                    break;
                }

                totalMigrated += res.migratedCount;
                batchCount++;
                toast.loading(`Migrated ${totalMigrated} users... (Batch ${batchCount})`, { duration: 2000 });

                // Optional: Short pause to let UI breathe
                await new Promise(r => setTimeout(r, 100));
            }
            onRefresh();
        } catch (e: any) {
            toast.error('Migration Loop Error: ' + e.message);
        }
        setIsMigratingUsers(false);
    };

    const handleSaveMapping = async (mapping: Record<string, string>) => {
        try {
            const { error } = await supabase
                .from('migration_field_mappings')
                .upsert({
                    collection_name: collectionName,
                    mapping_config: mapping,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'collection_name' });

            if (error) throw error;

            toast.success("Mapping configuration saved to database!");
            setShowMapper(false);
        } catch (e: any) {
            toast.error("Failed to save mapping: " + e.message);
        }
    };

    const filteredRows = useMemo(() => {
        if (!filterText) return rows;
        const lower = filterText.toLowerCase();
        return rows.filter(r =>
            r.doc_id.toLowerCase().includes(lower) ||
            JSON.stringify(r.data).toLowerCase().includes(lower)
        );
    }, [rows, filterText]);

    return (
        <div className="h-full flex flex-col relative">
            {/* Schema Mapper Modal */}
            {showMapper && (
                <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-auto flex flex-col">
                        <div className="flex justify-end p-2">
                            <button onClick={() => setShowMapper(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full">
                                <X size={20} className="text-slate-400 dark:text-slate-500" />
                            </button>
                        </div>
                        <SchemaMapper collection={collectionName} onSaveMapping={handleSaveMapping} />
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-500">
                        <TableIcon size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">{filteredRows.length} Documents in <span className="text-brand-primary">{collectionName}</span></span>
                    </div>
                    {collectionName === 'aapli-users' && (
                        <>
                            <button
                                onClick={() => setShowMapper(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                            >
                                <Edit2 size={12} /> Configure Mapping
                            </button>
                            <button
                                onClick={handleUserMigration}
                                disabled={isMigratingUsers}
                                className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
                            >
                                {isMigratingUsers ? 'Migrating...' : 'Migrate Users'}
                            </button>
                        </>
                    )}
                </div>
                <div>
                    <input
                        type="text"
                        placeholder="Search JSON..."
                        value={filterText}
                        onChange={e => setFilterText(e.target.value)}
                        className="bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-primary/20 w-64"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-48">Doc ID</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-24">Status</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Data (JSON)</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-24 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {filteredRows.map(row => {
                            const isEditing = editingId === row.id;
                            return (
                                <tr key={row.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 align-top">
                                        <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[12rem] text-ellipsis" title={row.doc_id}>
                                            {row.doc_id}
                                        </div>
                                        <div className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[12rem]">
                                            {row.document_path}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide
                                            ${row.status === 'RAW' ? 'bg-slate-100 text-slate-500' : ''}
                                            ${row.status === 'MAPPED' ? 'bg-emerald-100 text-emerald-600' : ''}
                                            ${row.status === 'ERROR' ? 'bg-red-100 text-red-600' : ''}
                                        `}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400 align-top">
                                        {isEditing ? (
                                            <textarea
                                                value={editData}
                                                onChange={e => setEditData(e.target.value)}
                                                className="w-full h-48 bg-slate-900 text-white rounded-lg p-3 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        ) : (
                                            <div className="max-h-24 overflow-hidden text-ellipsis opacity-80 group-hover:opacity-100 transition-opacity">
                                                {JSON.stringify(row.data)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right align-top">
                                        {isEditing ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                                    <X size={14} />
                                                </button>
                                                <button onClick={() => handleSave(row.id)} className="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                                                    <Save size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleEdit(row)}
                                                className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
