'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Upload, CheckCircle, AlertCircle, Clock, X, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import MediaUploadModal from '@/components/catalog/MediaUploadModal';
// We'll reuse MediaUploadModal but adapted for documents if possible, or build a simple file input here.
// Since MediaUploadModal uses 'vehicles' bucket, we'll build a custom simple uploader here for 'documents'.

interface ComplianceSettingsProps {
    dealerId: string;
}

export default function ComplianceSettings({ dealerId }: ComplianceSettingsProps) {
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Upload State
    const [selectedType, setSelectedType] = useState('GST');
    const [fileResult, setFileResult] = useState<string | null>(null);

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
            const filePath = `${fileName}`;

            // Upload to 'documents' bucket (Private)
            const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);

            if (uploadError) throw uploadError;

            // Insert Metadata
            const { error: dbError } = await supabase.from('id_documents').insert({
                tenant_id: dealerId,
                title: `${selectedType} Certificate`,
                type: selectedType,
                file_path: filePath,
                file_url: filePath, // Stores path actually, URL generated on fly for private
                status: 'PENDING',
            });

            if (dbError) throw dbError;

            fetchDocs();
            alert('Document uploaded for verification');
        } catch (error) {
            console.error(error);
            alert('Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'VERIFIED':
                return 'text-emerald-500 bg-emerald-50 border-emerald-100';
            case 'REJECTED':
                return 'text-rose-500 bg-rose-50 border-rose-100';
            default:
                return 'text-amber-500 bg-amber-50 border-amber-100';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Upload Section */}
                <div className="w-full md:w-1/3 space-y-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Upload Document</h3>
                        <p className="text-sm text-slate-500 mb-6">Submit legal documents for verification.</p>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Document Type</label>
                                <select
                                    value={selectedType}
                                    onChange={e => setSelectedType(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                >
                                    <option value="GST">GST Certificate</option>
                                    <option value="PAN">PAN Card</option>
                                    <option value="TRADE_LICENSE">Trade License</option>
                                    <option value="AGREEMENT">Dealership Agreement</option>
                                    <option value="OTHER">Other Compliance Doc</option>
                                </select>
                            </div>

                            <label
                                className={`block w-full border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${uploading ? 'bg-indigo-50 border-indigo-200' : 'border-slate-200 hover:border-indigo-500 hover:bg-slate-50'}`}
                            >
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    accept=".pdf,.jpg,.png,.jpeg"
                                />
                                {uploading ? (
                                    <div className="animate-pulse text-indigo-600 font-bold text-sm">Uploading...</div>
                                ) : (
                                    <>
                                        <Upload className="mx-auto text-slate-400 mb-2" />
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                            Click to Upload
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">PDF or Images up to 5MB</p>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>
                </div>

                {/* List Section */}
                <div className="flex-1 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Compliance Vault</h3>

                    {loading ? (
                        <div className="text-center py-10 text-slate-400">Loading documents...</div>
                    ) : docs.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl text-slate-400 text-sm">
                            No documents uploaded yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {docs.map(doc => (
                                <div
                                    key={doc.id}
                                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${getStatusColor(doc.status).replace('border', '')}`}
                                        >
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                {doc.title}
                                            </h4>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                Uploaded {new Date(doc.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`px-3 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(doc.status)}`}
                                        >
                                            {doc.status}
                                        </div>
                                        {/* View mechanism to be implemented with Signed URLs later */}
                                        <button disabled className="p-2 text-slate-300 cursor-not-allowed">
                                            <Eye size={18} />
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
