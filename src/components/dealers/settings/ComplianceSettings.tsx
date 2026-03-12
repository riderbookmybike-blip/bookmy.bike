'use client';

import React, { useState, useEffect } from 'react';
import {
    FileText,
    Upload,
    CheckCircle,
    AlertCircle,
    Clock,
    X,
    Eye,
    ShieldCheck,
    HardDrive,
    FileBadge,
    Activity,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ComplianceSettingsProps {
    dealerId: string;
}

export default function ComplianceSettings({ dealerId }: ComplianceSettingsProps) {
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedType, setSelectedType] = useState('GST');

    const fetchDocs = async () => {
        setLoading(true);
        const supabase = createClient();
        const { data } = await supabase
            .from('id_documents')
            .select('*')
            .eq('tenant_id', dealerId)
            .order('created_at', { ascending: false });

        if (data) setDocs(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchDocs();
    }, [dealerId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${selectedType}-${dealerId}-${Math.random()}.${fileExt}`;
            const { error: upErr } = await supabase.storage.from('documents').upload(fileName, file);
            if (upErr) throw upErr;

            const { error: insErr } = await supabase.from('id_documents').insert({
                tenant_id: dealerId,
                title: `${selectedType} Certificate`,
                type: selectedType,
                file_path: fileName,
                file_url: fileName,
                status: 'PENDING',
            });
            if (insErr) throw insErr;

            toast.success(`${selectedType} context ingested successfully`);
            fetchDocs();
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Vault synchronization failed');
        } finally {
            setUploading(false);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'VERIFIED':
                return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'REJECTED':
                return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
            default:
                return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Security Status */}
            <div className="flex items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">
                            Regulatory Vault Protocol
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">
                            Automated compliance tracking & AES-256 encrypted storage.
                        </p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                    <Activity size={14} className="text-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em]">
                        Security Matrix Active
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Ingestion Console */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm sticky top-8">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            Data Ingestion Console
                        </h4>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-2.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                Classification Tier
                            </label>
                            <select
                                value={selectedType}
                                onChange={e => setSelectedType(e.target.value)}
                                className="w-full px-4 py-3 bg-[#fcfdfe] border border-slate-200 rounded-xl text-[11px] font-black text-slate-900 uppercase tracking-widest outline-none focus:border-indigo-600/50 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm"
                            >
                                <option value="GST">GST_CERTIFICATE</option>
                                <option value="PAN">PAN_IDENTITY</option>
                                <option value="TRADE_LICENSE">TRADE_OPERATIONS_LICENSE</option>
                                <option value="AGREEMENT">DEALERSHIP_PROTOCOL_AGREEMENT</option>
                                <option value="OTHER">UNCLASSIFIED_DOCUMENT</option>
                            </select>
                        </div>

                        <label
                            className={`block w-full border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${uploading ? 'bg-indigo-50 border-indigo-200 animate-pulse' : 'border-slate-100 hover:border-indigo-500 hover:bg-slate-50'}`}
                        >
                            <input
                                type="file"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={uploading}
                                accept=".pdf,.jpg,.png,.jpeg"
                            />
                            {uploading ? (
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                                    SYCHRONIZING...
                                </p>
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <Upload size={20} className="text-slate-400" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">
                                        Upload Evidence
                                    </p>
                                    <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-widest opacity-60">
                                        PDF, JPG, PNG (Max 5MB)
                                    </p>
                                </>
                            )}
                        </label>
                    </div>
                </div>

                {/* Registry Ledger */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Vault Ledger Records
                        </h4>
                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            {docs.length} OBJECTS
                        </span>
                    </div>

                    {loading ? (
                        <div className="py-24 bg-white border border-slate-200 rounded-2xl flex justify-center items-center shadow-sm">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    ) : docs.length === 0 ? (
                        <div className="py-24 bg-white border border-dashed border-slate-200 rounded-2xl flex flex-col items-center text-center shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-4 border border-slate-100">
                                <FileText size={32} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                No active records in registry
                            </p>
                            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest mt-2">
                                Initialize ingestion to populate vault.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {docs.map(doc => (
                                <div
                                    key={doc.id}
                                    className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-indigo-400/50 hover:shadow-lg hover:shadow-slate-200/20 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-5">
                                        <div
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center border font-bold shadow-inner ${getStatusStyles(doc.status)}`}
                                        >
                                            <FileText size={22} />
                                        </div>
                                        <div>
                                            <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-tight">
                                                {doc.title}
                                            </h4>
                                            <div className="flex items-center gap-3 mt-1.5 text-[9px] text-slate-400 font-black uppercase tracking-[0.15em]">
                                                <span className="flex items-center gap-1">
                                                    <HardDrive size={10} /> {doc.id.slice(0, 8).toUpperCase()}
                                                </span>
                                                <span className="text-slate-200">|</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={10} /> {new Date(doc.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span
                                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyles(doc.status)}`}
                                        >
                                            {doc.status}
                                        </span>
                                        <button className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-slate-300 hover:text-indigo-600 transition-all">
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const Loader2 = ({ className, size }: { className?: string; size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);
