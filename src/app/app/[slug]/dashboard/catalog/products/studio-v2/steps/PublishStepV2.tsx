'use client';

import React, { useState } from 'react';
import { Rocket, Loader2, CheckCircle2, AlertTriangle, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import { activateModel } from '@/actions/catalog/catalogV2Actions';

interface PublishStepProps {
    modelId: string | null;
    onFinish: () => void;
}

export default function PublishStepV2({ modelId, onFinish }: PublishStepProps) {
    const [isPublishing, setIsPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);

    const handlePublish = async () => {
        if (!modelId) {
            toast.error('No model to publish');
            return;
        }
        setIsPublishing(true);
        try {
            const result = await activateModel(modelId);
            if (result) {
                setIsPublished(true);
                toast.success('Model published successfully!');
            } else {
                toast.error('Failed to publish');
            }
        } catch (err) {
            console.error('Publish error:', err);
            toast.error('Failed to publish');
        } finally {
            setIsPublishing(false);
        }
    };

    if (isPublished) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                        <PartyPopper size={48} className="text-emerald-500" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                        <CheckCircle2 size={28} fill="currentColor" className="text-emerald-500" strokeWidth={0} />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white">
                        Published!
                    </h2>
                    <p className="text-sm text-slate-500 font-semibold max-w-md">
                        Your product is now active. Variants and SKUs are ready for pricing and marketplace display.
                    </p>
                </div>
                <button
                    onClick={onFinish}
                    className="mt-4 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-transform"
                >
                    Go to Catalog
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="w-20 h-20 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                <Rocket size={40} className="text-orange-500" />
            </div>
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white">
                    Ready to Publish?
                </h2>
                <p className="text-sm text-slate-500 font-medium max-w-lg">
                    Publishing will activate this model and all its variants and SKUs. Once active, products become
                    available for pricing setup and marketplace listing.
                </p>
            </div>

            {!modelId && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl">
                    <AlertTriangle size={16} />
                    <span className="text-sm font-bold">No model selected</span>
                </div>
            )}

            <div className="flex gap-4">
                <button
                    onClick={onFinish}
                    className="px-6 py-3 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-500 font-bold uppercase text-[10px] tracking-widest hover:text-slate-700 transition-colors"
                >
                    Skip for Now
                </button>
                <button
                    onClick={handlePublish}
                    disabled={isPublishing || !modelId}
                    className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                    {isPublishing ? (
                        <>
                            <Loader2 className="animate-spin" size={16} />
                            Publishing...
                        </>
                    ) : (
                        <>
                            <Rocket size={16} />
                            Publish Now
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
