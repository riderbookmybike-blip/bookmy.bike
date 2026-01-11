'use client';

import { useState } from 'react';
import { X, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { updateUserEmail } from '@/actions/user';

interface EmailUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function EmailUpdateModal({ isOpen, onClose, onSuccess }: EmailUpdateModalProps) {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email.includes('@') || email.length < 5) {
            setError('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await updateUserEmail(email);
            if (result.success) {
                onSuccess();
            } else {
                setError(result.message || 'Failed to update email');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl border border-slate-200 dark:border-white/10 p-6 relative overflow-hidden">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                    <X className="w-5 h-5 text-slate-400" />
                </button>

                <div className="text-center space-y-6 pt-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600 dark:text-blue-400 animate-bounce">
                        <Mail className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">
                            Where should we send your receipt?
                        </h3>
                        <p className="text-xs font-medium text-slate-500 max-w-[250px] mx-auto">
                            We need your <strong className="text-slate-900 dark:text-white">Real Email</strong> to send the booking confirmation and invoice.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-all"
                                autoFocus
                            />
                            {error && <p className="text-[10px] font-bold text-red-500 ml-1">{error}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Confirm & Continue'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
