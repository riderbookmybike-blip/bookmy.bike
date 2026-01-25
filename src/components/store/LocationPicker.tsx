'use client';

import React, { useState } from 'react';
import { X, MapPin, Loader2, ArrowRight } from 'lucide-react';
import { resolveLocation } from '@/utils/locationResolver';

interface LocationPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onLocationSet: (pincode: string, taluka: string, lat?: number, lng?: number) => void;
}

export function LocationPicker({ isOpen, onClose, onLocationSet }: LocationPickerProps) {
    const [pincode, setPincode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleApply = async () => {
        if (pincode.length !== 6) {
            setError('Enter a valid 6-digit pincode');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const resolved = await resolveLocation(pincode);
            if (resolved) {
                const taluka = resolved.taluka || resolved.district || pincode;
                onLocationSet(pincode, taluka, resolved.lat, resolved.lng);
                onClose();
            } else {
                setError('Could not resolve pincode. Try another?');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <div
                className="absolute inset-0 bg-[#0b0d10]/95 backdrop-blur-3xl animate-in fade-in duration-500"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-white dark:bg-[#0f1115] rounded-[3rem] p-10 shadow-2xl border border-slate-200 dark:border-white/10 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="space-y-8">
                    <div className="space-y-3">
                        <div className="w-16 h-16 bg-brand-primary/10 rounded-3xl flex items-center justify-center mb-6">
                            <MapPin className="text-brand-primary" size={32} />
                        </div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white leading-tight">
                            Change Your <br />
                            <span className="text-brand-primary italic">Location</span>
                        </h2>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                            See accurate on-road pricing <br />for your specific taluka.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="relative group">
                            <input
                                autoFocus
                                type="text"
                                maxLength={6}
                                value={pincode}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setPincode(val);
                                    setError('');
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                                placeholder="ENTER 6-DIGIT PINCODE"
                                className="w-full h-20 bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 rounded-[2rem] px-8 text-xl font-black tracking-[0.2em] outline-none focus:border-brand-primary transition-all text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/10"
                            />
                            {loading && (
                                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                    <Loader2 className="animate-spin text-brand-primary" size={24} />
                                </div>
                            )}
                        </div>

                        {error && (
                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 text-center px-4">
                                {error}
                            </p>
                        )}

                        <button
                            onClick={handleApply}
                            disabled={loading || pincode.length !== 6}
                            className={`w-full h-20 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all ${loading || pincode.length !== 6
                                ? 'bg-slate-100 dark:bg-white/5 text-slate-400'
                                : 'bg-brand-primary text-black shadow-[0_20px_40px_rgba(244,176,0,0.2)] hover:shadow-[0_25px_50px_rgba(244,176,0,0.3)] hover:-translate-y-1'
                                }`}
                        >
                            {loading ? 'RESOLVING...' : (
                                <>
                                    Apply Changes
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
