'use client';

import { useState } from 'react';
import { submitLead } from '@/actions/lead';
import { X, CheckCircle, Loader2, Briefcase } from 'lucide-react';
import { useTenant } from '@/lib/tenant/tenantContext';
import { createClient } from '@/lib/supabase/client';

interface LeadCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    productName: string;
    model: string;
    variant?: string;
    color?: string;
    priceSnapshot?: any;
}

export function LeadCaptureModal({ isOpen, onClose, productName, model, variant, color, priceSnapshot }: LeadCaptureModalProps) {
    const { tenantId, userRole, memberships } = useTenant();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Detect if current user is a staff member of any dealership
    const isStaff = userRole && userRole !== 'MEMBER';
    const primaryMembership = memberships?.find(m => m.tenant_id === tenantId);

    if (!isOpen) return null;

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        setError(null);

        try {
            // Append context data hiddenly if not present in form
            formData.append('model', model);
            if (variant) formData.append('variant', variant);
            if (color) formData.append('color', color);
            if (priceSnapshot) formData.append('priceSnapshot', JSON.stringify(priceSnapshot));

            // Referral Data
            if (isStaff) {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    formData.append('referrer_user_id', user.id);
                    if (tenantId) formData.append('referrer_tenant_id', tenantId);
                }
            }

            const result = await submitLead(formData);

            if (result.success) {
                setSuccess(true);
            } else {
                setError(result.message || 'Something went wrong');
            }
        } catch (e) {
            setError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative overflow-hidden">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <X className="w-5 h-5 text-slate-500" />
                </button>

                {success ? (
                    <div className="text-center py-10 space-y-6 animate-in zoom-in-50 duration-500">
                        <div className="relative w-24 h-24 mx-auto">
                            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                            <div className="relative w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/50">
                                <CheckCircle className="w-12 h-12" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white leading-none">Exclusive Deal Locked!</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500">Priority Callback Initiated</p>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                            Our dealer partner has received your configuration for the <strong>{productName}</strong>. You'll receive a VIP call within 30 minutes.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase italic tracking-widest rounded-2xl hover:scale-[1.02] transition-all shadow-xl"
                        >
                            Back to Gallery
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {isStaff && (
                            <div className="bg-blue-600/10 border border-blue-600/20 rounded-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0 animate-pulse">
                                    <Briefcase size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Staff Referral Mode</p>
                                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Booking for a customer from <span className="text-blue-600">{primaryMembership?.tenants?.name || 'your dealership'}</span>.</p>
                                </div>
                            </div>
                        )}

                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-black uppercase italic text-slate-900 dark:text-white">
                                {isStaff ? 'Book for Customer' : 'Get Best Offer'}
                            </h3>
                            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                {productName}
                            </p>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl text-center">
                                {error}
                            </div>
                        )}

                        <form action={handleSubmit} className="space-y-4">
                            {/* Honeypot */}
                            <input type="text" name="hp_check" className="hidden" tabIndex={-1} autoComplete="off" />

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                    {isStaff ? 'Customer Name' : 'Your Name'}
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    placeholder={isStaff ? "Customer's full name" : "Enter your full name"}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900 dark:text-white transition-all"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                    {isStaff ? 'Customer Mobile' : 'Mobile Number'}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-slate-400 font-bold">+91</span>
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        pattern="[6-9][0-9]{9}"
                                        maxLength={10}
                                        placeholder="Mobile Number"
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900 dark:text-white transition-all font-mono"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    placeholder="Customer's City"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-900 dark:text-white transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic tracking-wider rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Submitting Lead...
                                    </>
                                ) : (
                                    isStaff ? 'Submit Referral' : 'Get Best Offer'
                                )}
                            </button>

                            <p className="text-[9px] text-center text-slate-400 dark:text-slate-500 leading-relaxed">
                                By clicking above, you agree to receive a callback/WhatsApp from our authorized dealer partners.
                            </p>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
