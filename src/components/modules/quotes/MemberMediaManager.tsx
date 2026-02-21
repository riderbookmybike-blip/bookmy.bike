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
    FileText,
    Eye,
    Maximize2,
    ChevronDown,
    Tag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
    getCrmMemberDocuments,
    uploadMemberDocument,
    deleteCrmMemberDocument,
    getMemberDocumentUrl,
    updateMemberDocumentAction,
} from '@/actions/crm';

const DOCUMENT_LABELS = [
    'Pan Card',
    'Aadhar Card',
    'Electricity Bill',
    'Voting Card',
    'Passport',
    'Rent Agreement',
] as const;

type DocumentLabel = (typeof DOCUMENT_LABELS)[number];

interface MemberMediaManagerProps {
    memberId: string;
    quoteId: string;
    onUpdate?: () => void;
    onDocCountChange?: (count: number) => void;
}

interface MemberDocument {
    id: string;
    name: string;
    category: string;
    label?: string | null;
    file_type: string;
    file_path: string;
    file_size?: number | null;
    created_at: string;
    metadata?: Record<string, any>;
}

function formatFileSize(bytes?: number | null): string {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeLabel(fileType: string): string {
    if (fileType?.includes('pdf')) return 'PDF';
    if (fileType?.includes('png')) return 'PNG';
    if (fileType?.includes('jpeg') || fileType?.includes('jpg')) return 'JPEG';
    if (fileType?.includes('webp')) return 'WEBP';
    if (fileType?.includes('svg')) return 'SVG';
    if (fileType?.includes('gif')) return 'GIF';
    return fileType?.split('/').pop()?.toUpperCase() || 'FILE';
}

export default function MemberMediaManager({ memberId, quoteId, onUpdate, onDocCountChange }: MemberMediaManagerProps) {
    const [docs, setDocs] = useState<MemberDocument[]>([]);
    const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState<DocumentLabel | ''>('');
    const [showLabelDropdown, setShowLabelDropdown] = useState(false);

    // Editor State
    const [selectedDoc, setSelectedDoc] = useState<MemberDocument | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isRemovingBg, setIsRemovingBg] = useState(false);

    // Alignment/Transformation State
    const [zoomFactor, setZoomFactor] = useState(1);
    const [isFlipped, setIsFlipped] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);

    // Label editing
    const [editingLabelId, setEditingLabelId] = useState<string | null>(null);

    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const documents = await getCrmMemberDocuments(memberId);
            if (documents && Array.isArray(documents)) {
                setDocs(documents as MemberDocument[]);
                onDocCountChange?.(documents.length);

                // For Supabase-stored files, get signed URLs; local files use path directly
                const urls: Record<string, string> = {};
                for (const doc of documents) {
                    if (doc.file_path?.startsWith('/uploads/')) {
                        // Local file — use path directly
                        urls[doc.id] = doc.file_path;
                    } else if (doc.file_type?.includes('image') || doc.file_type?.includes('pdf')) {
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

        if (!selectedLabel) {
            toast.error('Please select a document label first');
            return;
        }

        setIsUploading(true);
        try {
            // Upload to local server
            const formData = new FormData();
            formData.append('file', file);
            formData.append('memberId', memberId);

            const res = await fetch('/api/crm/upload-document', {
                method: 'POST',
                body: formData,
            });

            const result = await res.json();
            if (!result.success) throw new Error(result.error);

            // Save to database
            await uploadMemberDocument({
                memberId,
                name: file.name,
                filePath: result.filePath,
                fileType: file.type,
                category: selectedLabel,
                label: selectedLabel,
                fileSize: result.fileSize,
            });

            toast.success('Document uploaded');
            setSelectedLabel('');
            fetchDocuments();
            if (onUpdate) onUpdate();
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.message || 'Upload failed');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (docId: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await deleteCrmMemberDocument(docId);
            toast.success('Document deleted');
            fetchDocuments();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const handleLabelChange = async (docId: string, newLabel: string) => {
        try {
            const doc = docs.find(d => d.id === docId);
            const existingMetadata =
                doc?.metadata && typeof doc.metadata === 'object' && !Array.isArray(doc.metadata) ? doc.metadata : {};
            await updateMemberDocumentAction(docId, {
                purpose: newLabel,
                metadata: {
                    ...existingMetadata,
                    label: newLabel,
                    category: newLabel,
                    name: doc?.name || existingMetadata.name || 'document',
                    originalName: doc?.name || existingMetadata.originalName || existingMetadata.name || 'document',
                    file_size: doc?.file_size ?? existingMetadata.file_size ?? existingMetadata.size ?? null,
                },
            });
            toast.success('Label updated');
            setEditingLabelId(null);
            fetchDocuments();
        } catch (err) {
            toast.error('Failed to update label');
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

            // Upload bg-removed version to local server
            const bgFile = new File([resultBlob], `nobg_${selectedDoc.name}`, { type: 'image/png' });
            const formData = new FormData();
            formData.append('file', bgFile);
            formData.append('memberId', memberId);

            const res = await fetch('/api/crm/upload-document', { method: 'POST', body: formData });
            const result = await res.json();
            if (!result.success) throw new Error(result.error);

            await uploadMemberDocument({
                memberId,
                name: `nobg_${selectedDoc.name}`,
                filePath: result.filePath,
                fileType: 'image/png',
                category: selectedDoc.category,
                label: selectedDoc.label || selectedDoc.category,
            });

            toast.success('Background removed and saved');
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

    const getDisplayLabel = (doc: MemberDocument) => {
        return doc.label || doc.category || doc.name;
    };

    const isPdf = (doc: MemberDocument) => doc.file_type?.includes('pdf');
    const isImage = (doc: MemberDocument) => doc.file_type?.includes('image');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                        Identity <span className="text-indigo-500">Vault</span>
                    </h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
                        High-Fidelity Document Management • {docs.length} document{docs.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Upload Section with Label Selection */}
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Label Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowLabelDropdown(!showLabelDropdown)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all',
                                selectedLabel
                                    ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 hover:border-slate-300'
                            )}
                        >
                            <Tag size={14} />
                            {selectedLabel || 'Select Label'}
                            <ChevronDown
                                size={12}
                                className={cn('transition-transform', showLabelDropdown && 'rotate-180')}
                            />
                        </button>
                        {showLabelDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#0f1115] border border-slate-100 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                                {DOCUMENT_LABELS.map(label => (
                                    <button
                                        key={label}
                                        onClick={() => {
                                            setSelectedLabel(label);
                                            setShowLabelDropdown(false);
                                        }}
                                        className={cn(
                                            'w-full text-left px-4 py-2.5 text-xs font-bold transition-colors',
                                            selectedLabel === label
                                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                                        )}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Upload Button */}
                    <label
                        className={cn(
                            'flex items-center gap-2 px-5 py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm',
                            selectedLabel
                                ? 'bg-slate-900 dark:bg-white hover:opacity-90'
                                : 'bg-slate-200 dark:bg-white/10 cursor-not-allowed opacity-60'
                        )}
                    >
                        {isUploading ? (
                            <Loader2 className="animate-spin text-white dark:text-slate-900" size={14} />
                        ) : (
                            <Upload className="text-white dark:text-slate-900" size={14} />
                        )}
                        <span className="text-[10px] font-black uppercase tracking-widest text-white dark:text-slate-900">
                            {isUploading ? 'Uploading...' : 'Upload'}
                        </span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={isUploading || !selectedLabel}
                            accept="image/*,.pdf"
                        />
                    </label>

                    {!selectedLabel && (
                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                            <AlertTriangle size={10} />
                            Select a label first
                        </span>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Loading Documents...
                    </p>
                </div>
            ) : docs.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[3rem] bg-slate-50/50 dark:bg-white/[0.01]">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-300 mb-4">
                        <ImageIcon size={32} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        No documents uploaded yet
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {docs.map(doc => (
                        <motion.div
                            key={doc.id}
                            layoutId={doc.id}
                            className="group relative bg-white dark:bg-[#0f1115] border border-slate-100 dark:border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all shadow-sm hover:shadow-xl hover:shadow-indigo-500/5"
                        >
                            {/* Preview Area */}
                            <div className="aspect-[4/3] w-full bg-slate-50 dark:bg-black/40 flex items-center justify-center relative overflow-hidden">
                                {isImage(doc) ? (
                                    <img
                                        src={signedUrls[doc.id]}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        alt={getDisplayLabel(doc)}
                                    />
                                ) : isPdf(doc) ? (
                                    <iframe
                                        src={`${signedUrls[doc.id]}#toolbar=0&navpanes=0&scrollbar=0`}
                                        className="w-full h-full border-0"
                                        title={getDisplayLabel(doc)}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <FileText size={48} className="text-slate-300 dark:text-slate-700" />
                                        <span className="text-[8px] font-black text-slate-400 uppercase">DOCUMENT</span>
                                    </div>
                                )}

                                {/* Overlay Controls */}
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                    {isImage(doc) ? (
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

                            {/* Info Area with Label */}
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[8px] font-black bg-slate-100 dark:bg-white/5 text-slate-500 px-1.5 py-0.5 rounded uppercase">
                                            {getFileTypeLabel(doc.file_type)}
                                        </span>
                                        <span className="text-[8px] font-bold text-slate-400 tabular-nums">
                                            {formatFileSize(doc.file_size)}
                                        </span>
                                    </div>
                                    <span className="text-[8px] font-bold text-slate-400 tabular-nums">
                                        {new Date(doc.created_at).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                        })}
                                        ,{' '}
                                        {new Date(doc.created_at).toLocaleTimeString('en-IN', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true,
                                        })}
                                    </span>
                                </div>

                                {/* Label Display / Edit */}
                                {editingLabelId === doc.id ? (
                                    <div className="space-y-1.5">
                                        {DOCUMENT_LABELS.map(label => (
                                            <button
                                                key={label}
                                                onClick={() => handleLabelChange(doc.id, label)}
                                                className={cn(
                                                    'w-full text-left px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors',
                                                    (doc.label || doc.category) === label
                                                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                                        : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
                                                )}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setEditingLabelId(null)}
                                            className="w-full text-center px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                                            {getDisplayLabel(doc)}
                                        </span>
                                        <button
                                            onClick={() => setEditingLabelId(doc.id)}
                                            className="text-slate-300 hover:text-indigo-500 transition-colors"
                                            title="Change label"
                                        >
                                            <Tag size={10} />
                                        </button>
                                    </div>
                                )}
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
                                        {getDisplayLabel(selectedDoc)}
                                    </p>
                                </div>

                                <div className="flex-1 p-8 space-y-4 overflow-y-auto">
                                    {/* Zoom */}
                                    <div>
                                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                            Zoom
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setZoomFactor(f => Math.max(0.5, f - 0.1))}
                                                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                                            >
                                                −
                                            </button>
                                            <span className="text-xs font-black text-slate-600 tabular-nums w-12 text-center">
                                                {Math.round(zoomFactor * 100)}%
                                            </span>
                                            <button
                                                onClick={() => setZoomFactor(f => Math.min(3, f + 0.1))}
                                                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    {/* Rotation */}
                                    <div>
                                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                            Rotation
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setRotation(r => r - 90)}
                                                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                                            >
                                                <RotateCcw size={14} />
                                            </button>
                                            <button
                                                onClick={() => setRotation(r => r + 90)}
                                                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                                            >
                                                <RotateCw size={14} />
                                            </button>
                                            <button
                                                onClick={() => setIsFlipped(f => !f)}
                                                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors text-xs font-black"
                                            >
                                                ↔
                                            </button>
                                        </div>
                                    </div>

                                    {/* BG Removal */}
                                    <button
                                        onClick={handleRemoveBg}
                                        disabled={isRemovingBg}
                                        className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isRemovingBg ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Eraser size={14} />
                                        )}
                                        {isRemovingBg ? 'Processing...' : 'Remove Background'}
                                    </button>
                                </div>

                                {/* Close */}
                                <div className="p-6 border-t border-slate-100 dark:border-white/5">
                                    <button
                                        onClick={() => setIsEditorOpen(false)}
                                        className="w-full py-3 bg-slate-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        <X size={14} /> Close Editor
                                    </button>
                                </div>
                            </div>

                            {/* Editor Body: Right (Canvas) */}
                            <div className="flex-1 bg-[#1a1a2e] flex items-center justify-center overflow-hidden">
                                <div
                                    className="relative max-w-full max-h-full"
                                    style={{
                                        transform: `scale(${zoomFactor}) rotate(${rotation}deg) scaleX(${isFlipped ? -1 : 1}) translate(${offsetX}px, ${offsetY}px)`,
                                        transition: 'transform 0.3s ease',
                                    }}
                                >
                                    <img
                                        src={signedUrls[selectedDoc.id]}
                                        alt={getDisplayLabel(selectedDoc)}
                                        className="max-w-full max-h-[80vh] object-contain"
                                        draggable={false}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
