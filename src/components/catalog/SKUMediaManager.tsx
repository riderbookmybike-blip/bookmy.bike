'use client';

import React, { useState } from 'react';
import {
    X,
    Upload,
    Link as LinkIcon,
    Loader2,
    Image as ImageIcon,
    Check,
    Trash2,
    Star,
    Video,
    Plus,
    Copy,
    FileText
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SKUMediaManagerProps {
    skuName: string;
    initialImages?: string[];
    initialVideos?: string[];
    initialPdfs?: string[];
    inheritedImages?: string[];
    inheritedVideos?: string[];
    inheritedPdfs?: string[];
    inheritedFrom?: string;
    initialPrimary?: string | null;
    onSave: (images: string[], videos: string[], pdfs: string[], primary: string | null, applyVideosToAll?: boolean) => void;
    onClose: () => void;
}

export default function SKUMediaManager({
    skuName,
    initialImages = [],
    initialVideos = [],
    initialPdfs = [],
    inheritedImages = [],
    inheritedVideos = [],
    inheritedPdfs = [],
    inheritedFrom = 'Family',
    initialPrimary = null,
    onSave,
    onClose
}: SKUMediaManagerProps) {
    const [images, setImages] = useState<string[]>(initialImages);

    // Separate initialVideos into "already added SKU-specific" and "selected inherited"
    // We assume any initialVideo that is ALSO in inheritedVideos is an "inherited" one.
    const [skuVideos, setSkuVideos] = useState<string[]>(
        initialVideos.filter(v => !inheritedVideos.includes(v))
    );
    const [selectedInheritedVideos, setSelectedInheritedVideos] = useState<string[]>(
        inheritedVideos.filter(v => initialVideos.includes(v))
    );

    // PDF State
    const [skuPdfs, setSkuPdfs] = useState<string[]>(
        initialPdfs.filter(p => !inheritedPdfs.includes(p))
    );
    // Not currently using inherited PDFs logic fully but setting up structure if needed
    // Assuming for now PDFs are just specific

    const [primaryImage, setPrimaryImage] = useState<string | null>(initialPrimary || (initialImages.length > 0 ? initialImages[0] : null));
    const [applyVideosToAll, setApplyVideosToAll] = useState(false);

    const [isUploading, setIsUploading] = useState(false);
    const [videoInput, setVideoInput] = useState('');
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'pdf') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        setUploadError(null);

        const supabase = createClient();
        const newUrls: string[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                const filePath = `catalog/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('vehicles')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('vehicles')
                    .getPublicUrl(filePath);

                newUrls.push(publicUrl);
            }

            if (type === 'image') {
                const updatedImages = [...images, ...newUrls];
                setImages(updatedImages);
                if (!primaryImage && updatedImages.length > 0) {
                    setPrimaryImage(updatedImages[0]);
                }
            } else {
                setSkuPdfs([...skuPdfs, ...newUrls]);
            }

        } catch (err: any) {
            console.error('Upload error:', err);
            setUploadError("Failed to upload. Try smaller files.");
        } finally {
            setIsUploading(false);
        }
    };

    const extractVideoId = (input: string) => {
        // 1. Handle iframe tags (extract src)
        if (input.includes('<iframe')) {
            const srcMatch = input.match(/src=["']([^"']+)["']/);
            if (srcMatch) input = srcMatch[1];
        }

        // 2. YouTube Normalization
        const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const ytMatch = input.match(ytRegExp);
        if (ytMatch && ytMatch[2].length === 11) {
            return `https://www.youtube.com/embed/${ytMatch[2]}`;
        }

        // 3. Vimeo Normalization
        const vimeoRegExp = /(?:vimeo\.com\/)(\d+)/;
        const vimeoMatch = input.match(vimeoRegExp);
        if (vimeoMatch && vimeoMatch[1]) {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }

        return input; // Input was not a detected video format, use as-is
    };

    const addVideo = () => {
        if (!videoInput.trim()) return;
        const processedUrl = extractVideoId(videoInput.trim());
        if (!skuVideos.includes(processedUrl) && !inheritedVideos.includes(processedUrl)) {
            setSkuVideos([...skuVideos, processedUrl]);
            setVideoInput('');
        } else if (inheritedVideos.includes(processedUrl) && !selectedInheritedVideos.includes(processedUrl)) {
            // If it's an inherited video but not selected, select it instead of adding it twice
            setSelectedInheritedVideos([...selectedInheritedVideos, processedUrl]);
            setVideoInput('');
        }
    };

    const removeImage = (url: string) => {
        const newImages = images.filter(img => img !== url);
        setImages(newImages);
        if (primaryImage === url) {
            setPrimaryImage(newImages.length > 0 ? newImages[0] : null);
        }
    };

    const handleSave = () => {
        let finalSkuVideos = [...skuVideos];
        if (videoInput.trim()) {
            const processedUrl = extractVideoId(videoInput.trim());
            if (!finalSkuVideos.includes(processedUrl) && !inheritedVideos.includes(processedUrl)) {
                finalSkuVideos.push(processedUrl);
            }
        }

        const allVideos = [...finalSkuVideos, ...selectedInheritedVideos];

        // Pass PDFs as well
        const allPdfs = [...skuPdfs]; // Can combine with inherited later

        onSave(images, allVideos, allPdfs, primaryImage, applyVideosToAll);
        onClose();
    };

    const toggleInheritedVideo = (url: string) => {
        if (selectedInheritedVideos.includes(url)) {
            setSelectedInheritedVideos(selectedInheritedVideos.filter(v => v !== url));
        } else {
            setSelectedInheritedVideos([...selectedInheritedVideos, url]);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">

                    {/* 1. SHARED ASSETS SECTION */}
                    {(inheritedImages.length > 0 || inheritedVideos.length > 0 || inheritedPdfs.length > 0) && (
                        <div className="space-y-6 pb-8 border-b border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                                    <LinkIcon size={16} />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Shared Assets</h3>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded">
                                    <span className="text-[8px] font-medium uppercase tracking-widest opacity-60">Source:</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                        {inheritedFrom}
                                    </span>
                                </div>
                            </div>

                            {/* Shared Images */}
                            {inheritedImages.length > 0 && (
                                <div className="space-y-3 pl-2 border-l-2 border-emerald-100 dark:border-emerald-500/20">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-4">Shared Images ({inheritedImages.length})</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pl-4">
                                        {inheritedImages.map((img, idx) => {
                                            // Check if this image is currently "active" in the specific list (meaning it's KEPT as shared)
                                            // Wait, usually inherited images are ALWAYS shown unless explicitly "unlinked" (which might mean removed from valid list?)
                                            // The user said "option to delink linked by default".
                                            // In current logic, images list is "Specific + Selected Inherited" or just "Specific"?
                                            // Actually `images` state currently holds ALL images that will be valid for this SKU.
                                            // So if an inherited image is in `images` array, it's "Linked". If not, it's "Unlinked".

                                            // HOWEVER, logic: "initialImages" passed to this component usually contains specific + SOME inherited?
                                            // If `initialImages` matches `inheritedImages`, they are linked.

                                            const isLinked = images.includes(img);

                                            return (
                                                <div key={`inh-img-${idx}`} className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all ${isLinked ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-100 opacity-50 grayscale'}`}>
                                                    <img src={img} className="w-full h-full object-cover" />
                                                    <div className="absolute top-2 left-2 flex gap-1">
                                                        <span className={`px-2 py-0.5 text-[7px] font-black uppercase tracking-widest rounded shadow-sm opacity-90 transition-colors ${isLinked ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                            {isLinked ? 'Linked' : 'Unlinked'}
                                                        </span>
                                                    </div>

                                                    {/* Overlay */}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            onClick={() => {
                                                                if (isLinked) setImages(images.filter(i => i !== img));
                                                                else setImages([...images, img]);
                                                            }}
                                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg transform scale-90 hover:scale-100 transition-all ${isLinked ? 'bg-white text-rose-500 hover:bg-rose-50' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                                                        >
                                                            {isLinked ? 'Unlink' : 'Link'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Shared Videos */}
                            {inheritedVideos.length > 0 && (
                                <div className="space-y-3 pl-2 border-l-2 border-emerald-100 dark:border-emerald-500/20">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-4">Shared Videos ({inheritedVideos.length})</h4>
                                    <div className="space-y-2 pl-4">
                                        {inheritedVideos.map((vid, idx) => {
                                            const isLinked = selectedInheritedVideos.includes(vid);
                                            return (
                                                <div key={`inh-vid-${idx}`} className={`flex items-center justify-between p-3 border rounded-xl transition-all ${isLinked ? 'bg-emerald-50/30 border-emerald-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isLinked ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                                            <Video size={14} />
                                                        </div>
                                                        <span className="text-[10px] font-bold truncate text-slate-600 w-full">{vid}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleInheritedVideo(vid)}
                                                        className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-colors ${isLinked ? 'bg-white text-rose-500 border border-rose-100 hover:bg-rose-50' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                                                    >
                                                        {isLinked ? 'Unlink' : 'Link'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Shared PDFs */}
                            {inheritedPdfs.length > 0 && (
                                <div className="space-y-3 pl-2 border-l-2 border-emerald-100 dark:border-emerald-500/20">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-4">Shared Documents ({inheritedPdfs.length})</h4>
                                    <div className="space-y-2 pl-4">
                                        {inheritedPdfs.map((pdf, idx) => {
                                            // Assuming pdfs follow same logic as selectedInheritedVideos, logic needs to be added state-wise?
                                            // Currently skuPdfs is separate.
                                            // Let's assume we treat skuPdfs as "active" list just like images.
                                            const isLinked = skuPdfs.includes(pdf);

                                            return (
                                                <div key={`inh-pdf-${idx}`} className={`flex items-center justify-between p-3 border rounded-xl transition-all ${isLinked ? 'bg-emerald-50/30 border-emerald-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isLinked ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                                            <FileText size={14} />
                                                        </div>
                                                        <span className="text-[10px] font-bold truncate text-slate-600 w-full">{pdf.split('/').pop()?.split('_').pop()}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (isLinked) setSkuPdfs(skuPdfs.filter(p => p !== pdf));
                                                            else setSkuPdfs([...skuPdfs, pdf]);
                                                        }}
                                                        className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-colors ${isLinked ? 'bg-white text-rose-500 border border-rose-100 hover:bg-rose-50' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                                                    >
                                                        {isLinked ? 'Unlink' : 'Link'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                    {/* 2. SPECIFIC ASSETS SECTION */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                                <Star size={16} />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Specific Assets</h3>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold uppercase tracking-widest">
                                Unique to {skuName}
                            </span>
                        </div>

                        {/* Image Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Specific Gallery</h3>
                                <label className="cursor-pointer px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                                    <Upload size={14} /> Upload New
                                    <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} disabled={isUploading} />
                                </label>
                            </div>

                            {/* Progress Bar */}
                            {isUploading && (
                                <div className="w-full h-1 rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full bg-indigo-600 animate-progress w-1/3"></div>
                                </div>
                            )}
                            {uploadError && <p className="text-xs text-rose-500 font-bold">{uploadError}</p>}

                            {/* Filter out inherited images from the main images list to only show SPECIFIC ones here */}
                            {(() => {
                                const specificImages = images.filter(img => !inheritedImages.includes(img));

                                if (specificImages.length === 0) {
                                    return (
                                        <div className="h-24 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                                            <ImageIcon size={24} className="mb-2 opacity-50" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">No specific images</span>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        {specificImages.map((img, idx) => (
                                            <div key={`spec-img-${idx}`} className="space-y-2">
                                                <div className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all ${primaryImage === img ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-100 dark:border-white/5'}`}>
                                                    <img src={img} className="w-full h-full object-cover" />
                                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-600 text-white text-[7px] font-black uppercase tracking-widest rounded shadow-sm opacity-80">
                                                        Specific
                                                    </div>
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                        <div className="flex gap-2">
                                                            <button onClick={() => setPrimaryImage(img)} className={`p-2 rounded-full ${primaryImage === img ? 'bg-amber-400 text-black' : 'bg-white/20 text-white hover:bg-amber-400 hover:text-black'}`} title="Set as Primary">
                                                                <Star size={16} fill={primaryImage === img ? "currentColor" : "none"} />
                                                            </button>
                                                            <button onClick={() => navigator.clipboard.writeText(img)} className="p-2 rounded-full bg-white/20 text-white hover:bg-indigo-500 transition-all">
                                                                <Copy size={16} />
                                                            </button>
                                                        </div>
                                                        <button onClick={() => removeImage(img)} className="p-2 rounded-full bg-white/20 text-white hover:bg-rose-500 hover:text-white">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                    {primaryImage === img && <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-amber-400 text-black text-[8px] font-black uppercase tracking-widest rounded shadow-sm">Primary</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Specific Videos */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Specific Video Links</h3>
                            <div className="flex gap-2">
                                <input
                                    value={videoInput}
                                    onChange={(e) => setVideoInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addVideo()}
                                    placeholder="Paste YouTube Link, Short URL, or Embed Code"
                                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-black/20 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                <button onClick={addVideo} disabled={!videoInput} className="px-4 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition-colors">
                                    <Plus size={18} />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {skuVideos.length === 0 ? (
                                    <div className="h-16 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-center text-slate-400">
                                        <span className="text-[10px] font-bold uppercase tracking-widest">No specific videos</span>
                                    </div>
                                ) : (
                                    skuVideos.map((vid, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl group hover:border-slate-200 transition-all">
                                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                                    <Video size={14} />
                                                </div>
                                                <span className="text-[10px] font-bold truncate text-slate-600 dark:text-slate-300">{vid}</span>
                                            </div>
                                            <button onClick={() => setSkuVideos(skuVideos.filter(v => v !== vid))} className="text-slate-300 hover:text-rose-500 p-1">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Specific PDFs */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Specific Documents</h3>
                                <label className="cursor-pointer px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                                    <Upload size={14} /> Upload PDF
                                    <input type="file" multiple accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'pdf')} disabled={isUploading} />
                                </label>
                            </div>
                            <div className="space-y-2">
                                {/* Filter out inherited PDFs from skuPdfs display if they were mixed in (though separate state handles it usually, but let's be safe) */}
                                {(() => {
                                    const specificPdfs = skuPdfs.filter(p => !inheritedPdfs.includes(p));
                                    if (specificPdfs.length === 0) {
                                        return (
                                            <div className="h-16 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-center text-slate-400">
                                                <span className="text-[10px] font-bold uppercase tracking-widest">No specific documents</span>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="grid gap-2">
                                            {specificPdfs.map((pdf, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl group hover:border-slate-200 transition-all">
                                                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                        <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                                            <FileText size={14} />
                                                        </div>
                                                        <span className="text-[10px] font-bold truncate text-slate-600 dark:text-slate-300">
                                                            {pdf.split('/').pop()?.split('_').pop() || 'Document.pdf'}
                                                        </span>
                                                    </div>
                                                    <button onClick={() => setSkuPdfs(skuPdfs.filter(p => p !== pdf))} className="text-slate-300 hover:text-rose-500 p-1">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                    >
                        Save Media Config <Check size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
