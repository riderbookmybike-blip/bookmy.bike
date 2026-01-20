
'use client';

import { useState, useEffect } from 'react';
import { Loader2, ArrowRight, Save, Database, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SchemaMapperProps {
    collection: string;
    onSaveMapping: (mapping: Record<string, string>) => void;
}

interface AnalysisData {
    sourceKeys: string[];
    targetColumns: string[];
    targetTable: string;
}

export function SchemaMapper({ collection, onSaveMapping }: SchemaMapperProps) {
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
    const [mapping, setMapping] = useState<Record<string, string>>({}); // source -> target | 'NEW:col_name' | 'IGNORE'

    useEffect(() => {
        fetchAnalysis();
    }, [collection]);

    async function fetchAnalysis() {
        setLoading(true);
        try {
            const res = await fetch(`/api/schema-analysis?collection=${encodeURIComponent(collection)}`);
            const json = await res.json();
            if (json.success) {
                setAnalysis(json);
                // Pre-fill smart defaults
                const initialMapping: Record<string, string> = {};
                json.sourceKeys.forEach((key: string) => {
                    const normalized = key.toLowerCase();
                    // Auto-match logic
                    if (json.targetColumns.includes(key)) initialMapping[key] = key;
                    else if (normalized === 'mobilenumber') initialMapping[key] = 'phone';
                    else if (normalized === 'name') initialMapping[key] = 'full_name';
                    else if (normalized === 'area') initialMapping[key] = 'address'; // simplistic guess
                    else initialMapping[key] = 'IGNORE';
                });
                setMapping(initialMapping);
            } else {
                toast.error(json.error);
            }
        } catch (e) {
            toast.error("Failed to load schema analysis");
        } finally {
            setLoading(false);
        }
    }

    const handleActionChange = (key: string, value: string) => {
        setMapping(prev => ({ ...prev, [key]: value }));
    };

    if (loading) return <div className="p-8 flex items-center justify-center text-slate-500 dark:text-slate-400"><Loader2 className="animate-spin mr-2" /> Analyzing Schema...</div>;
    if (!analysis) return <div className="p-4 text-red-500">Failed to load analysis.</div>;

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg shadow-sm p-4 w-full max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <Database className="text-brand-primary" size={20} />
                        Schema Mapper: {collection} <ArrowRight size={16} /> {analysis.targetTable}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Map Firebase fields to Supabase columns before migration.</p>
                </div>
                <button
                    onClick={() => onSaveMapping(mapping)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors font-medium shadow-sm"
                >
                    <Save size={16} /> Save Mapping Config
                </button>
            </div>

            <div className="border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-500 dark:text-slate-400 p-3 border-b border-slate-200 dark:border-white/10 uppercase tracking-wider">
                    <div className="col-span-4">Source Key (Firebase)</div>
                    <div className="col-span-1 text-center"></div>
                    <div className="col-span-3">Action</div>
                    <div className="col-span-4">Target Column (Supabase)</div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-white/10 max-h-[60vh] overflow-y-auto">
                    {analysis.sourceKeys.map((key) => {
                        const actionValue = mapping[key] || 'IGNORE';
                        const isIgnored = actionValue === 'IGNORE';
                        const isCreateNew = actionValue.startsWith('NEW:');
                        const isMapped = !isIgnored && !isCreateNew;

                        return (
                            <div key={key} className={`grid grid-cols-12 p-3 items-center hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${isIgnored ? 'opacity-50' : ''}`}>
                                {/* Source */}
                                <div className="col-span-4 font-mono text-sm font-medium text-slate-700 dark:text-slate-300 truncate" title={key}>
                                    {key}
                                </div>

                                {/* Arrow */}
                                <div className="col-span-1 flex justify-center text-slate-300 dark:text-slate-600">
                                    <ArrowRight size={14} />
                                </div>

                                {/* Action Dropdown */}
                                <div className="col-span-3 pr-2">
                                    <select
                                        className={`w-full text-sm border rounded px-2 py-1.5 focus:ring-2 focus:ring-brand-primary/20 outline-none
                                            ${isIgnored ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-white/10'}`}
                                        value={isCreateNew ? 'NEW' : isIgnored ? 'IGNORE' : 'MAP'}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'IGNORE') handleActionChange(key, 'IGNORE');
                                            else if (val === 'NEW') handleActionChange(key, `NEW:${key}`); // Default to same name
                                            else if (val === 'MAP') handleActionChange(key, analysis.targetColumns[0] || '');
                                        }}
                                    >
                                        <option value="MAP">Map to Existing</option>
                                        <option value="NEW">Create New Column</option>
                                        <option value="IGNORE">Ignore</option>
                                    </select>
                                </div>

                                {/* Target Config */}
                                <div className="col-span-4">
                                    {isMapped && (
                                        <select
                                            className="w-full text-sm bg-white dark:bg-slate-900 border border-brand-primary/30 text-slate-900 dark:text-white rounded px-2 py-1.5 focus:ring-2 focus:ring-brand-primary/20"
                                            value={actionValue}
                                            onChange={(e) => handleActionChange(key, e.target.value)}
                                        >
                                            {analysis.targetColumns.map(col => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>
                                    )}
                                    {isCreateNew && (
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-brand-primary font-bold">NEW:</span>
                                            <input
                                                type="text"
                                                className="w-full text-sm border-b-2 border-brand-primary bg-transparent py-1 focus:outline-none"
                                                value={actionValue.replace('NEW:', '')}
                                                onChange={(e) => handleActionChange(key, `NEW:${e.target.value}`)}
                                                placeholder="column_name"
                                            />
                                        </div>
                                    )}
                                    {isIgnored && (
                                        <div className="flex items-center text-xs text-slate-400 italic">
                                            Field will be discarded
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-4 p-3 bg-amber-50 text-amber-800 text-xs rounded border border-amber-200 flex gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <p>Note: Creating new columns will require database schema changes. Ensure you have permissions.</p>
            </div>
        </div>
    );
}
