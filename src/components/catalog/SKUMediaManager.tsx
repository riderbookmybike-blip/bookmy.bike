'use client';

import React, { useState, useRef, useEffect } from 'react';
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
    FileText,
    ZoomIn,
    RefreshCw,
    Maximize2,
    RotateCcw,
    Move
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    initialZoomFactor?: number;
    initialIsFlipped?: boolean;
    initialOffsetX?: number;
    initialOffsetY?: number;
    onSave: (
        images: string[],
        videos: string[],
        pdfs: string[],
        primary: string | null,
        applyVideosToAll?: boolean,
        zoomFactor?: number,
        isFlipped?: boolean,
        offsetX?: number,
        offsetY?: number
    ) => void | Promise<void>;
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
    initialZoomFactor = 1.0,
    initialIsFlipped = false,
    initialOffsetX = 0,
    initialOffsetY = 0,
    onSave,
    onClose
}: SKUMediaManagerProps) {
    const [images, setImages] = useState<string[]>(initialImages);
    const [skuVideos, setSkuVideos] = useState<string[]>(initialVideos.filter(v => !inheritedVideos.includes(v)));
    const [selectedInheritedVideos, setSelectedInheritedVideos] = useState<string[]>(inheritedVideos.filter(v => initialVideos.includes(v)));
    const [skuPdfs, setSkuPdfs] = useState<string[]>(initialPdfs.filter(p => !inheritedPdfs.includes(p)));

    const [primaryImage, setPrimaryImage] = useState<string | null>(initialPrimary || (initialImages.length > 0 ? initialImages[0] : null));
    const [applyVideosToAll, setApplyVideosToAll] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [videoInput, setVideoInput] = useState('');
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Alignment State
    const [zoomFactor, setZoomFactor] = useState(initialZoomFactor);
    const [isFlipped, setIsFlipped] = useState(initialIsFlipped);
    const [offsetX, setOffsetX] = useState(initialOffsetX);
    const [offsetY, setOffsetY] = useState(initialOffsetY);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    // Delete/Replace Confirmation State
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        type: 'DELETE' | 'REPLACE';
        file?: File;
        title: string;
        message: React.ReactNode;
    }>({ isOpen: false, type: 'DELETE', title: '', message: '' });

    const initiateDelete = () => {
        if (!primaryImage) return;
        setConfirmation({
            isOpen: true,
            type: 'DELETE',
            title: 'Delete Image',
            message: 'Are you sure you want to delete this image? This action cannot be undone.'
        });
    };

    const initiateReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setConfirmation({
            isOpen: true,
            type: 'REPLACE',
            file,
            title: 'Replace Image',
            message: (
                <span>
                    Are you sure you want to replace the current image with <span className="font-bold text-indigo-600">{file.name}</span>?
                </span>
            )
        });
        // Reset input value
        e.target.value = '';
    };

    const confirmAction = async () => {
        if (confirmation.type === 'DELETE') {
            const newImages = images.filter(img => img !== primaryImage);
            setImages(newImages);
            setPrimaryImage(newImages.length > 0 ? newImages[0] : null);
        } else if (confirmation.type === 'REPLACE' && confirmation.file) {
            setIsUploading(true);
            const supabase = createClient();
            try {
                const file = confirmation.file;
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                const filePath = `catalog/${fileName}`;
                const { error } = await supabase.storage.from('vehicles').upload(filePath, file);
                if (error) throw error;
                const { data: { publicUrl } } = supabase.storage.from('vehicles').getPublicUrl(filePath);

                const newImages = images.map(img => img === primaryImage ? publicUrl : img);
                setImages(newImages);
                setPrimaryImage(publicUrl);
            } catch (err) {
                setUploadError("Replacement failed. Try again.");
            } finally {
                setIsUploading(false);
            }
        }
        setConfirmation({ ...confirmation, isOpen: false });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'pdf') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setIsUploading(true);
        const supabase = createClient();
        const newUrls: string[] = [];
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                const filePath = `catalog/${fileName}`;
                const { error } = await supabase.storage.from('vehicles').upload(filePath, file);
                if (error) throw error;
                const { data: { publicUrl } } = supabase.storage.from('vehicles').getPublicUrl(filePath);
                newUrls.push(publicUrl);
            }
            if (type === 'image') {
                const updatedImages = [...images, ...newUrls];
                setImages(updatedImages);
                if (!primaryImage && updatedImages.length > 0) setPrimaryImage(updatedImages[0]);
            } else {
                setSkuPdfs([...skuPdfs, ...newUrls]);
            }
        } catch (err: any) {
            setUploadError("Upload failed. Try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            const allVideos = [...skuVideos, ...selectedInheritedVideos];
            const allPdfs = [...skuPdfs];
            if (typeof onSave === 'function') {
                await onSave(images, allVideos, allPdfs, primaryImage, applyVideosToAll, zoomFactor, isFlipped, offsetX, offsetY);
            }
            onClose();
        } catch (err) {
            console.error('Save error:', err);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
                onClick={onClose}
            />

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col max-h-[92vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
                            <Maximize2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white leading-none">Catalog Studio</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Refining {skuName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl transition-colors group">
                        <X size={24} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* Sub-Header Tabs (Optional but keeps it clean) */}
                <div className="flex px-8 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900">
                    <button className="px-6 py-4 text-[11px] font-black uppercase tracking-widest border-b-2 border-indigo-600 text-indigo-600">Visual Alignment</button>
                    <button className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Media Assets</button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* LEFT: Alignment Workspace */}
                    <div className="flex-[1.5] bg-slate-50 dark:bg-black/40 p-8 flex flex-col gap-6 border-r border-slate-100 dark:border-white/5 overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                                    <Move size={16} />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Alignment Workspace</h3>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setZoomFactor(1.0); setOffsetX(0); setOffsetY(0); setIsFlipped(false); }}
                                    className="p-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"
                                    title="Reset Alignment"
                                >
                                    <RotateCcw size={16} />
                                </button>
                            </div>
                        </div>

                        {/* LARGE VIEWPORT */}
                        <div className="relative aspect-[16/9] bg-slate-200 dark:bg-slate-800 rounded-[2rem] border-4 border-white dark:border-slate-800 overflow-hidden shadow-inner group">
                            {/* Industrial Grid Background */}
                            <div className="absolute inset-0 opacity-20 pointer-events-none"
                                style={{
                                    backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px), linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px)`,
                                    backgroundSize: '4px 4px, 40px 40px, 40px 40px'
                                }}
                            />

                            {/* Center Crosshair / Smart Alignment Guides */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                {/* Vertical Guide */}
                                <div
                                    className={`absolute w-[1px] h-full transition-colors duration-300 ${Math.abs(offsetX) < 5 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] z-20' : 'bg-rose-500/30'}`}
                                    style={{ opacity: Math.abs(offsetX) < 20 ? 1 : 0.2 }}
                                />
                                {/* Horizontal Guide */}
                                <div
                                    className={`absolute h-[1px] w-full transition-colors duration-300 ${Math.abs(offsetY) < 5 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] z-20' : 'bg-rose-500/30'}`}
                                    style={{ opacity: Math.abs(offsetY) < 20 ? 1 : 0.2 }}
                                />

                                {/* Center Snap Indicator */}
                                {Math.abs(offsetX) < 5 && Math.abs(offsetY) < 5 && (
                                    <motion.div
                                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-500/20 backdrop-blur-sm z-30"
                                    />
                                )}
                            </div>

                            {/* The Draggable Image */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                    drag
                                    dragMomentum={false}
                                    onDrag={(e, info) => {
                                        setOffsetX(prev => prev + info.delta.x);
                                        setOffsetY(prev => prev + info.delta.y);
                                    }}
                                    style={{ x: offsetX, y: offsetY }}
                                    className="cursor-move relative"
                                >
                                    {primaryImage ? (
                                        <motion.img
                                            src={primaryImage}
                                            alt="Alignment Preview"
                                            className="max-w-none transition-transform duration-100"
                                            style={{
                                                height: '400px', // Fixed height reference for alignment
                                                transform: `scale(${zoomFactor}) ${isFlipped ? 'scaleX(-1)' : 'scaleX(1)'}`,
                                                pointerEvents: 'none'
                                            }}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 text-slate-400">
                                            <ImageIcon size={64} strokeWidth={1} />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Drop or Select Image</span>
                                        </div>
                                    )}
                                </motion.div>
                            </div>

                            {/* Scale Indicator Overlay */}
                            <div className="absolute bottom-6 left-6 flex items-center gap-3">
                                <div className="px-4 py-2 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 text-white flex items-center gap-3 shadow-2xl">
                                    <span className="text-[10px] font-black tracking-widest uppercase opacity-60">Scale</span>
                                    <span className="text-xs font-black italic">{(zoomFactor * 100).toFixed(0)}%</span>
                                    <div className="w-[1px] h-3 bg-white/20" />
                                    <span className="text-[10px] font-black tracking-widest uppercase opacity-60">Pos</span>
                                    <span className="text-[10px] font-mono opacity-80">{offsetX.toFixed(0)}, {offsetY.toFixed(0)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Workspace Controls */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4 p-6 bg-white dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precise Zoom</label>
                                    <div className="flex gap-1">
                                        {[0.8, 1.0, 1.2].map(v => (
                                            <button key={v} onClick={() => setZoomFactor(v)} className={`px-2 py-1 rounded-md text-[9px] font-bold ${zoomFactor === v ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-black/20 text-slate-400'}`}>
                                                {v.toFixed(1)}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <input
                                    type="range" min="0.5" max="2.0" step="0.01" value={zoomFactor}
                                    onChange={(e) => setZoomFactor(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full appearance-none accent-indigo-600 cursor-pointer"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setIsFlipped(!isFlipped)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all ${isFlipped ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-600/10 text-indigo-600' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 text-slate-400 hover:border-slate-200'}`}
                                >
                                    <RefreshCw size={20} className={`mb-2 ${isFlipped ? 'animate-spin-slow' : ''}`} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Mirror</span>
                                </button>

                                <label className="flex flex-col items-center justify-center p-4 rounded-3xl border-2 border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all cursor-pointer">
                                    <RefreshCw size={20} className="mb-2" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Replace</span>
                                    <input type="file" hidden accept="image/*" onChange={initiateReplace} disabled={!primaryImage} />
                                </label>

                                <button
                                    onClick={initiateDelete}
                                    disabled={!primaryImage}
                                    className="flex flex-col items-center justify-center p-4 rounded-3xl border-2 border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 text-slate-400 hover:border-red-400 hover:text-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 size={20} className="mb-2" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Delete</span>
                                </button>

                                <label className="flex flex-col items-center justify-center p-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all cursor-pointer">
                                    <Plus size={20} className="mb-2" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Add New</span>
                                    <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Live Preview Simulator */}
                    <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-white dark:bg-slate-900">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                                    <Maximize2 size={14} />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Live Preview</h3>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Real-time card simulation</p>
                        </div>

                        {/* Mobile Card Preview */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Mobile View</span>
                            </div>
                            <div className="scale-[0.7] origin-top-left" style={{ width: '300px', height: '450px' }}>
                                <div className="bg-white dark:bg-[#0f1115] border border-black/[0.04] dark:border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03),0_12px_24px_-4px_rgba(0,0,0,0.08)] min-h-[520px]">
                                    {/* Image Section */}
                                    <div className="h-[344px] bg-slate-50 dark:bg-white/[0.03] flex items-center justify-center relative p-4 border-b border-black/[0.04] dark:border-white/5 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/10 dark:to-black/30 z-0" />
                                        <motion.img
                                            animate={{
                                                scale: zoomFactor,
                                                scaleX: isFlipped ? -zoomFactor : zoomFactor,
                                                x: offsetX,
                                                y: offsetY
                                            }}
                                            transition={{ duration: 0.3 }}
                                            src={primaryImage || '/images/categories/motorcycle_nobg.png'}
                                            alt={skuName}
                                            className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[92%] h-[92%] object-contain z-10"
                                        />
                                        <span className="absolute font-black text-[70px] uppercase tracking-[0.2em] opacity-[0.06] italic text-slate-900 dark:text-white select-none z-0">MOCK</span>
                                    </div>

                                    {/* Content Section */}
                                    <div className="p-6 flex-1 flex flex-col justify-between bg-[#FAFAFA] dark:bg-[#0f1115]">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white leading-none">{skuName}</h3>
                                                <div className="flex -space-x-2">
                                                    <div className="w-5 h-5 rounded-full border border-white dark:border-slate-900 bg-red-500" />
                                                    <div className="w-5 h-5 rounded-full border border-white dark:border-slate-900 bg-black" />
                                                </div>
                                            </div>
                                            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1">STANDARD</p>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5 italic">On-Road</p>
                                                <span className="text-2xl font-black italic text-slate-900 dark:text-white">₹1,50,000</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-0.5 italic">Lowest EMI</p>
                                                <span className="text-2xl font-black text-green-600">₹5,250</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">/mo</span>
                                            </div>
                                        </div>

                                        <button className="w-full h-11 bg-[#F4B000] hover:bg-[#FFD700] text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_4px_14px_rgba(244,176,0,0.3)] mt-2">
                                            Know More
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Card Preview */}
                        <div className="space-y-3 pt-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Desktop View</span>
                            </div>
                            <div className="scale-[0.5] origin-top-left" style={{ width: '900px', height: '350px' }}>
                                <div className="bg-white dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden flex shadow-sm min-h-[22rem]">
                                    {/* Image Section */}
                                    <div className="w-[38%] bg-slate-50 dark:bg-white/[0.03] flex items-center justify-center relative p-8 border-r border-slate-100 dark:border-white/5 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-100/50 dark:to-black/30 z-0" />
                                        <motion.img
                                            animate={{
                                                scale: zoomFactor,
                                                scaleX: isFlipped ? -zoomFactor : zoomFactor,
                                                x: offsetX,
                                                y: offsetY
                                            }}
                                            transition={{ duration: 0.3 }}
                                            src={primaryImage || '/images/categories/motorcycle_nobg.png'}
                                            alt={skuName}
                                            className="w-[85%] h-[85%] object-contain z-10"
                                        />
                                        <span className="absolute font-black text-[120px] uppercase tracking-[0.2em] opacity-[0.06] italic text-slate-900 dark:text-white select-none z-0">MOCK</span>
                                    </div>

                                    {/* Content Section */}
                                    <div className="flex-1 p-10 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-4">
                                                <h3 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white leading-none">{skuName}</h3>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">STANDARD • MOCK COLOR</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-y-4 gap-x-12 py-6 border-y border-slate-100 dark:border-white/10 bg-slate-50/30 dark:bg-white/[0.02] -mx-10 px-10 mt-4">
                                            <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Engine</p><p className="text-sm font-black text-slate-900 dark:text-white">125CC</p></div>
                                            <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Seat Height</p><p className="text-sm font-black text-slate-900 dark:text-white">780mm</p></div>
                                            <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Weight</p><p className="text-sm font-black text-slate-900 dark:text-white italic">115kg</p></div>
                                            <div><p className="text-[8px] font-black text-emerald-500/80 uppercase tracking-widest">Total Savings</p><p className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹15,000</p></div>
                                        </div>

                                        <div className="flex items-center justify-between pt-6">
                                            <div className="flex gap-16">
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">On-Road price</p>
                                                    <span className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">₹1,50,000</span>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">EMI</p>
                                                    <p className="text-3xl font-black text-brand-primary leading-none">₹5,250</p>
                                                    <p className="text-sm font-black text-slate-500 dark:text-slate-300 uppercase mt-2">x36</p>
                                                </div>
                                            </div>
                                            <button className="px-10 py-4 bg-[#F4B000] hover:bg-[#FFD700] text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(244,176,0,0.3)]">Know More</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Config Toggle */}
                        <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                            <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-black/20 rounded-2xl cursor-pointer group">
                                <div className={`w-10 h-6 border-2 rounded-full relative transition-all ${applyVideosToAll ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 dark:border-white/10'}`}>
                                    <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${applyVideosToAll ? 'right-1 bg-white' : 'left-1 bg-slate-300'}`} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Apply to all variants</span>
                                <input type="checkbox" hidden checked={applyVideosToAll} onChange={e => setApplyVideosToAll(e.target.checked)} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between shrink-0">
                    <div className="hidden md:flex items-center gap-2 text-slate-400">
                        <Check size={14} className="text-emerald-500" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">All changes live-previewed</span>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-12 py-4 rounded-2xl bg-indigo-600 hover:bg-slate-900 dark:hover:bg-white dark:hover:text-black text-white text-xs font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/20 transition-all transform hover:-translate-y-1"
                        >
                            Commit Alignment
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
