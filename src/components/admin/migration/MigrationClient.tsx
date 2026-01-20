'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database, AlertCircle, Save, Filter, ArrowRight, RefreshCw, Import, CheckCircle2, Loader2, Play } from 'lucide-react';
import { StagingGrid } from './StagingGrid';
import { FirebaseTree } from './FirebaseTree';
import { listFirebaseCollections, importFirebaseCollection, importAllFirebaseData, verifyImportCounts, FirebaseCollectionNode } from '@/actions/admin/firebase-migration';
import { toast } from 'sonner';

interface MigrationClientProps {
    initialCollections: string[]; // These are DISTINCT root_collections from DB
}

export function MigrationClient({ initialCollections }: MigrationClientProps) {
    const [viewMode, setViewMode] = useState<'SOURCE' | 'STAGING'>('SOURCE');
    const [sourceNodes, setSourceNodes] = useState<FirebaseCollectionNode[]>([]);
    const [loadingSource, setLoadingSource] = useState(false);
    const [importingId, setImportingId] = useState<string | null>(null);
    const [isBulkImporting, setIsBulkImporting] = useState(false);

    // Verification state
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationReport, setVerificationReport] = useState<{ name: string; firebase: number; supabase: number; match: boolean }[] | null>(null);

    // Staging State
    const [selectedStagedCollection, setSelectedStagedCollection] = useState<string>(initialCollections[0] || '');
    const [stagedRows, setStagedRows] = useState<any[]>([]);
    const [loadingStaged, setLoadingStaged] = useState(false);
    const supabase = createClient();

    // Load Live Source
    useEffect(() => {
        loadSourceData();
    }, []);

    // Load Staging Data when tab changes
    useEffect(() => {
        if (selectedStagedCollection) {
            fetchStagedData(selectedStagedCollection);
        }
    }, [selectedStagedCollection]);

    const loadSourceData = async () => {
        setLoadingSource(true);
        try {
            const nodes = await listFirebaseCollections();
            setSourceNodes(nodes);
        } catch (e: any) {
            toast.error('Failed to load Firebase source: ' + e.message);
        }
        setLoadingSource(false);
    };

    const fetchStagedData = async (collection: string) => {
        setLoadingStaged(true);
        const { data } = await supabase
            .from('firebase_antigravity')
            .select('*')
            .eq('root_collection', collection)
            .order('document_path')
            .limit(1000); // Guardrail

        if (data) setStagedRows(data);
        setLoadingStaged(false);
    };

    const handleImport = async (collectionId: string) => {
        setImportingId(collectionId);
        try {
            const result = await importFirebaseCollection(collectionId);
            if (result.success) {
                toast.success(`Imported ${result.count} documents from ${collectionId}`);
                // Refresh source checks
                loadSourceData();
                // Switch to staging view to show results
                setSelectedStagedCollection(collectionId);
                setViewMode('STAGING');
            } else {
                toast.error('Import Error: ' + result.error);
            }
        } catch (e: any) {
            toast.error('Import Failed: ' + e.message);
        }
        setImportingId(null);
    };

    const handleBulkImport = async () => {
        if (!confirm('Are you sure you want to import ALL collections? This might take a while.')) return;

        setIsBulkImporting(true);
        try {
            const result = await importAllFirebaseData();
            toast.success(`Bulk Import Complete: ${result.importedCount}/${result.totalCollections} collections.`);
            if (result.errors.length > 0) {
                console.error('Bulk Import Errors:', result.errors);
                toast.warning(`${result.errors.length} collections failed. Check console.`);
            }
            loadSourceData();
        } catch (e: any) {
            toast.error('Bulk Import Failed: ' + e.message);
        }
        setIsBulkImporting(false);
    };

    const handleVerify = async () => {
        setIsVerifying(true);
        setVerificationReport(null);
        try {
            const report = await verifyImportCounts();
            setVerificationReport(report);
            toast.success('Verification report generated.');
        } catch (e: any) {
            toast.error('Verification failed: ' + e.message);
        }
        setIsVerifying(false);
    }

    return (
        <div className="flex h-full gap-6">
            {/* LEFT PANEL: Source / Navigation */}
            <div className="w-96 flex flex-col bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden shrink-0">
                <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Firebase Replica</span>
                    <div className="flex gap-2">
                        <button
                            onClick={handleVerify}
                            disabled={isVerifying}
                            title="Compare Counts"
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors disabled:opacity-50"
                        >
                            <CheckCircle2 size={16} className={isVerifying ? 'animate-pulse text-brand-primary' : ''} />
                        </button>
                        <button
                            onClick={handleBulkImport}
                            disabled={isBulkImporting}
                            className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-brand-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isBulkImporting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
                            {isBulkImporting ? '...' : 'Import All'}
                        </button>
                    </div>
                </div>

                {verificationReport ? (
                    <div className="flex-1 overflow-y-auto p-2">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider">Verification Report</h3>
                            <button onClick={() => setVerificationReport(null)} className="text-[10px] text-slate-400 hover:text-red-500">Close</button>
                        </div>
                        <div className="space-y-1">
                            {verificationReport.map(item => (
                                <div key={item.name} className={`flex items-center justify-between p-2 rounded text-xs border ${item.match ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-red-100 bg-red-50 text-red-700'}`}>
                                    <span className="font-mono font-bold truncate max-w-[8rem]" title={item.name}>{item.name}</span>
                                    <div className="flex gap-3 font-mono text-[10px]">
                                        <div className="flex flex-col items-end">
                                            <span className="opacity-50">Firebase</span>
                                            <span>{item.firebase}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="opacity-50">Supabase</span>
                                            <span>{item.supabase}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-2">
                        <FirebaseTree
                            key="firebase-replica-tree-v2"
                            onImportSuccess={(path) => {
                                const root = path.split('/')[0];
                                setSelectedStagedCollection(root);
                                setViewMode('STAGING');
                            }}
                            onSelect={(collection) => {
                                // Direct navigation to staging
                                setSelectedStagedCollection(collection);
                                setViewMode('STAGING');
                            }}
                        />
                    </div>
                )}
            </div>

            {/* RIGHT PANEL: Staging / Content */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
                {viewMode === 'STAGING' ? (
                    <>
                        {/* Header */}
                        <div className="flex overflow-x-auto border-b border-slate-200 dark:border-white/10">
                            {/* We loop through available db-side collections for tabs, OR just show the selected active one */}
                            {initialCollections.map(col => (
                                <button
                                    key={col}
                                    onClick={() => setSelectedStagedCollection(col)}
                                    className={`px-6 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 
                                        ${selectedStagedCollection === col
                                            ? 'border-brand-primary text-slate-900 dark:text-white bg-slate-50 dark:bg-white/5'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    {col}
                                </button>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="flex-1 overflow-hidden relative">
                            {loadingStaged ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-2 animate-pulse">
                                        <Database className="w-8 h-8 text-slate-300" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Staged Data...</p>
                                    </div>
                                </div>
                            ) : (
                                <StagingGrid
                                    collectionName={selectedStagedCollection}
                                    rows={stagedRows}
                                    onRefresh={() => fetchStagedData(selectedStagedCollection)}
                                />
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4">
                        <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                            <Database size={48} className="opacity-20" />
                        </div>
                        <p className="text-sm font-medium">Select a collection from the left to import or view.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
