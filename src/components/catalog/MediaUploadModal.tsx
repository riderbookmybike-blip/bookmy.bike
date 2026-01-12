'use client';

import React, { useState } from 'react';
import { X, Upload, Link as LinkIcon, Loader2, Image as ImageIcon, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface MediaUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (url: string) => void;
    title?: string;
}

export default function MediaUploadModal({ isOpen, onClose, onSuccess, title = "Upload Media" }: MediaUploadModalProps) {
    const [mode, setMode] = useState<'url' | 'upload'>('url');
    const [url, setUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url) {
            onSuccess(url);
            setUrl('');
            onClose();
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `catalog/${fileName}`;

            const { error: uploadError, data } = await supabase.storage
                .from('vehicles') // Assuming 'vehicles' bucket exists
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('vehicles')
                .getPublicUrl(filePath);

            onSuccess(publicUrl);
            onClose();
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload image. Please ensure "vehicles" storage bucket exists.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <ImageIcon className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{title}</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Asset Initialization Gateway</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 text-slate-400 hover:text-rose-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Toggle */}
                    <div className="flex p-1.5 bg-slate-100 dark:bg-black/20 rounded-[1.5rem] relative">
                        <button
                            onClick={() => setMode('url')}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all z-10 flex items-center justify-center gap-2 ${mode === 'url' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                        >
                            <LinkIcon size={14} /> Direct URL
                        </button>
                        <button
                            onClick={() => setMode('upload')}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all z-10 flex items-center justify-center gap-2 ${mode === 'upload' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                        >
                            <Upload size={14} /> File Upload
                        </button>
                    </div>

                    <div className="min-h-[160px] flex flex-col justify-center">
                        {mode === 'url' ? (
                            <form onSubmit={handleUrlSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Source Address</label>
                                    <input
                                        autoFocus
                                        type="url"
                                        placeholder="https://example.com/image.jpg"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="w-full px-8 py-5 bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-600 rounded-[2rem] text-sm text-slate-900 dark:text-white outline-none transition-all placeholder:opacity-30"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!url}
                                    className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2 italic"
                                >
                                    Inject Asset <Check size={18} />
                                </button>
                            </form>
                        ) : (
                            <div className="relative group/upload h-40">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                />
                                <div className={`w-full h-full border-4 border-dashed rounded-[3rem] flex flex-col items-center justify-center gap-3 transition-all ${error ? 'border-rose-500/20 bg-rose-500/5' : 'border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 group-hover/upload:border-indigo-600 group-hover/upload:bg-indigo-600/5'}`}>
                                    {isUploading ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin text-indigo-600" size={32} />
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest italic animate-pulse">Syncing with Storage...</span>
                                        </div>
                                    ) : error ? (
                                        <div className="flex flex-col items-center gap-2 text-rose-500 text-center px-8">
                                            <ImageIcon size={32} className="opacity-50" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-lg group-hover/upload:scale-110 transition-transform">
                                                <Upload className="text-indigo-600" size={24} />
                                            </div>
                                            <div className="text-center">
                                                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest block italic">Drop identity here</span>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block opacity-60">PNG, JPG, WEBP up to 10MB</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5">
                    <p className="text-[9px] text-slate-400 font-bold text-center uppercase tracking-widest italic">
                        Assets are indexed into the Global Vehicle Repository instantly
                    </p>
                </div>
            </div>
        </div>
    );
}
