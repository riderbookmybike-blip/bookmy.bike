'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    X,
    Upload,
    Loader2,
    Image as ImageIcon,
    Check,
    Trash2,
    ZoomIn,
    RotateCcw,
    RotateCw,
    Move,
    Eraser,
    AlertTriangle,
    ExternalLink,
    Crop,
    Eye,
    FileText,
    Clock,
    RefreshCw,
    Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
    getCrmMemberDocuments,
    uploadMemberDocument,
    deleteCrmMemberDocument,
    getMemberDocumentUrl,
} from '@/actions/crm';

interface MemberMediaManagerProps {
    memberId: string;
    quoteId: string;
    onUpdate?: () => void;
}

interface MemberDocument {
    id: string;
    name: string;
    category: string;
    file_type: string;
    file_path: string;
    created_at: string;
}

export default function MemberMediaManager({ memberId, quoteId, onUpdate }: MemberMediaManagerProps) {
    const [docs, setDocs] = useState<MemberDocument[]>([]);
    const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // Editor State
    const [selectedDoc, setSelectedDoc] = useState<MemberDocument | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const [isCropping, setIsCropping] = useState(false);

    // Alignment/Transformation State
    const [zoomFactor, setZoomFactor] = useState(1);
    const [isFlipped, setIsFlipped] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);

    const supabase = createClient();

    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const documents = await getCrmMemberDocuments(memberId);
            if (documents && Array.isArray(documents)) {
                setDocs(documents as MemberDocument[]);
                // Fetch signed URLs
                const urls: Record<string, string> = {};
                for (const doc of documents) {
                    if (doc.file_type?.includes('image') || doc.file_type?.includes('pdf')) {
                        const signedUrl = await getMemberDocumentUrl(doc.file_path);
                        if (signedUrl) {
                            urls[doc.id] = signedUrl;
                        }
                    }
                }
                setSignedUrls(urls);
            }
        } catch (error) {
            console.error('Fetch docs failed:', error);
            toast.error('Failed to load documents');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (memberId) fetchDocuments();
    }, [memberId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileName = `${memberId}/${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage.from('member-documents').upload(fileName, file);
            if (error) throw error;

            await uploadMemberDocument({
                memberId,
                name: file.name,
                filePath: data.path,
                fileType: file.type,
                category: 'OTHER', // Default
            });

            toast.success('Asset archived');
            fetchDocuments();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (docId: string) => {
        if (!confirm('Are you sure you want to purge this asset?')) return;
        try {
            await deleteCrmMemberDocument(docId);
            toast.success('Asset purged');
            fetchDocuments();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error('Purge failed');
        }
    };

    const handleRemoveBg = async () => {
        if (!selectedDoc || !signedUrls[selectedDoc.id]) return;
        setIsRemovingBg(true);
        try {
            const { removeBackground } = await import('@imgly/background-removal');
            const imageResponse = await fetch(signedUrls[selectedDoc.id]);
            const imageBlob = await imageResponse.blob();

            const resultBlob = await removeBackground(imageBlob);

            const fileName = `${memberId}/nobg_${Date.now()}.png`;
            const arrayBuffer = await resultBlob.arrayBuffer();

            const { data, error: uploadError } = await supabase.storage
                .from('member-documents')
                .upload(fileName, arrayBuffer, {
                    contentType: 'image/png',
                });

            if (uploadError) throw uploadError;

            await uploadMemberDocument({
                memberId,
                name: `nobg_${selectedDoc.name}`,
                filePath: data.path,
                fileType: 'image/png',
                category: selectedDoc.category,
            });

            toast.success('Background removed and saved as new asset');
            setIsEditorOpen(false);
            fetchDocuments();
        } catch (err) {
            console.error('BG Removal Error:', err);
            toast.error('Background removal failed');
        } finally {
            setIsRemovingBg(false);
        }
    };

    const openEditor = (doc: MemberDocument) => {
        setSelectedDoc(doc);
        setZoomFactor(1);
        setIsFlipped(false);
        setRotation(0);
        setOffsetX(0);
        setOffsetY(0);
        setIsEditorOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                        Identity <span className="text-indigo-500">Vault</span>
                    </h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
                        High-Fidelity Document Management
                    </p>
                </div>

                <label className="flex items-center gap-3 bg-slate-900 dark:bg-white px-6 py-3 rounded-2xl cursor-pointer hover:scale-105 transition-all active:scale-95 shadow-xl group">
                    {isUploading ? (
                        <Loader2 className="animate-spin text-white dark:text-slate-900" size={16} />
                    ) : (
                        <Upload
                            className="text-white dark:text-slate-900 group-hover:-translate-y-0.5 transition-transform"
                            size={16}
                        />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest text-white dark:text-slate-900">
                        {isUploading ? 'Archiving...' : 'Upload Asset'}
                    </span>
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                </label>
            </div>

            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Hydrating Vault...
                    </p>
                </div>
            ) : docs.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[3rem] bg-slate-50/50 dark:bg-white/[0.01]">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-300 mb-4">
                        <ImageIcon size={32} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        No assets archived in vault
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {docs.map(doc => (
                        <motion.div
                            key={doc.id}
                            layoutId={doc.id}
                            className="group relative bg-white dark:bg-[#0f1115] border border-slate-100 dark:border-white/10 rounded-[2.5rem] overflow-hidden hover:border-indigo-500/50 transition-all shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10"
                        >
                            {/* Preview Area */}
                            <div className="aspect-[4/3] w-full bg-slate-50 dark:bg-black/40 flex items-center justify-center relative overflow-hidden">
                                {doc.file_type?.includes('image') ? (
                                    <img
                                        src={signedUrls[doc.id]}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        alt={doc.name}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <FileText size={48} className="text-slate-300 dark:text-slate-700" />
                                        <span className="text-[8px] font-black text-slate-400 uppercase">
                                            PDF DOCUMENT
                                        </span>
                                    </div>
                                )}

                                {/* Overlay Controls */}
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                    {doc.file_type?.includes('image') ? (
                                        <button
                                            onClick={() => openEditor(doc)}
                                            className="w-10 h-10 rounded-xl bg-white text-slate-900 flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                                        >
                                            <Maximize2 size={16} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => window.open(signedUrls[doc.id], '_blank')}
                                            className="w-10 h-10 rounded-xl bg-white text-slate-900 flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Info Area */}
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[8px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded uppercase tracking-widest">
                                        {doc.category}
                                    </span>
                                    <span className="text-[8px] font-bold text-slate-400 tabular-nums">
                                        {new Date(doc.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase truncate tracking-tight">
                                    {doc.name}
                                </h4>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* HIGH-FIDELITY IMAGE EDITOR MODAL */}
            <AnimatePresence>
                {isEditorOpen && selectedDoc && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
                            onClick={() => setIsEditorOpen(false)}
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-6xl bg-white dark:bg-[#0b0d10] rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row h-[90vh]"
                        >
                            {/* Editor Body: Left (Controls) */}
                            <div className="w-full md:w-80 border-r border-slate-100 dark:border-white/5 flex flex-col bg-slate-50/50 dark:bg-white/[0.02]">
                                <div className="p-8 border-b border-slate-100 dark:border-white/5">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                        Asset <span className="text-indigo-500">Studio</span>
                                    </h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        Identity Optimization Suite
                                    </p>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                                    {/* Alignment Tools */}
                                    <div className="space-y-4">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Move size={12} /> Alignment & Scale
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setZoomFactor(prev => Math.min(prev + 0.1, 3))}
                                                className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 hover:border-indigo-500/50 transition-all flex flex-col items-center gap-2 group"
                                            >
                                                <ZoomIn
                                                    size={18}
                                                    className="text-slate-400 group-hover:text-indigo-500"
                                                />
                                                <span className="text-[9px] font-black uppercase">Zoom In</span>
                                            </button>
                                            <button
                                                onClick={() => setZoomFactor(prev => Math.max(prev - 0.1, 0.5))}
                                                className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 hover:border-indigo-500/50 transition-all flex flex-col items-center gap-2 group"
                                            >
                                                <RefreshCw
                                                    size={18}
                                                    className="text-slate-400 group-hover:text-indigo-500"
                                                />
                                                <span className="text-[9px] font-black uppercase">Reset</span>
                                            </button>
                                            <button
                                                onClick={() => setRotation(prev => prev - 90)}
                                                className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 hover:border-indigo-500/50 transition-all flex flex-col items-center gap-2 group"
                                            >
                                                <RotateCcw
                                                    size={18}
                                                    className="text-slate-400 group-hover:text-indigo-500"
                                                />
                                                <span className="text-[9px] font-black uppercase">Rotate L</span>
                                            </button>
                                            <button
                                                onClick={() => setRotation(prev => prev + 90)}
                                                className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 hover:border-indigo-500/50 transition-all flex flex-col items-center gap-2 group"
                                            >
                                                <RotateCw
                                                    size={18}
                                                    className="text-slate-400 group-hover:text-indigo-500"
                                                />
                                                <span className="text-[9px] font-black uppercase">Rotate R</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Advanced Tools */}
                                    <div className="space-y-4">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Eraser size={12} /> Magic Intelligence
                                        </div>
                                        <button
                                            onClick={handleRemoveBg}
                                            disabled={isRemovingBg}
                                            className="w-full flex items-center justify-between p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 group"
                                        >
                                            <div className="flex items-center gap-3">
                                                {isRemovingBg ? (
                                                    <Loader2 className="animate-spin" size={18} />
                                                ) : (
                                                    <Eraser size={18} />
                                                )}
                                                <div className="flex flex-col items-start">
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        Remove Background
                                                    </span>
                                                    <span className="text-[8px] font-bold opacity-60">
                                                        AI-Powered Extraction
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="px-2 py-0.5 bg-white/20 rounded text-[7px] font-bold">
                                                SMART
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-8 border-t border-slate-100 dark:border-white/5 flex gap-3">
                                    <button
                                        onClick={() => setIsEditorOpen(false)}
                                        className="flex-1 px-6 py-4 bg-slate-100 dark:bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>

                            {/* Editor Body: Right (Preview) */}
                            <div className="flex-1 bg-slate-900 flex flex-col relative overflow-hidden">
                                {/* Header */}
                                <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                                            <ImageIcon size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-white uppercase tracking-tight">
                                                {selectedDoc.name}
                                            </h4>
                                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest italic">
                                                {selectedDoc.category}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsEditorOpen(false)}
                                        className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Viewport */}
                                <div className="flex-1 flex items-center justify-center p-20 relative">
                                    {/* Grid Lines Overlay */}
                                    <div
                                        className="absolute inset-0 opacity-10 pointer-events-none"
                                        style={{
                                            backgroundImage:
                                                'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                                            backgroundSize: '40px 40px',
                                        }}
                                    />

                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <motion.div
                                            animate={{
                                                scale: zoomFactor,
                                                rotate: rotation,
                                                scaleX: isFlipped ? -1 : 1,
                                                x: offsetX,
                                                y: offsetY,
                                            }}
                                            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                                            className="relative max-w-full max-h-full shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden"
                                        >
                                            <img
                                                src={signedUrls[selectedDoc.id]}
                                                className="max-w-[80vw] max-h-[60vh] object-contain"
                                                alt="Editor Preview"
                                            />
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Footer Indicators */}
                                <div className="p-8 flex items-center justify-between bg-black/40 backdrop-blur-md">
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">
                                                Scale Factor
                                            </span>
                                            <span className="text-xs font-black text-white italic">
                                                {(zoomFactor * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="w-px h-8 bg-white/10" />
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">
                                                Rotation
                                            </span>
                                            <span className="text-xs font-black text-white italic">{rotation}°</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                            <Check className="text-emerald-500" size={14} />
                                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                                                High-Fidelity Preview
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
