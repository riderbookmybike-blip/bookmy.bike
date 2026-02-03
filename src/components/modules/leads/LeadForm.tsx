'use client';

import React, { useState } from 'react';
import SlideOver from '@/components/ui/SlideOver';
import { Button } from '@/components/ui/button';
import { User, Phone, MapPin, Bike, Send, Calendar, Cake } from 'lucide-react';
import { normalizeIndianPhone, parseDateToISO } from '@/lib/utils/inputFormatters';

interface LeadFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        customerName: string;
        phone: string;
        pincode: string;
        model?: string;
        dob?: string;
    }) => void;
}

export default function LeadForm({ isOpen, onClose, onSubmit }: LeadFormProps) {
    const [customerName, setCustomerName] = useState('');
    const [phone, setPhone] = useState('');
    const [pincode, setPincode] = useState('');
    const [model, setModel] = useState('');
    const [dob, setDob] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [catalogModels, setCatalogModels] = useState<string[]>([]);
    const [isCheckingPhone, setIsCheckingPhone] = useState(false);
    const [isExistingCustomer, setIsExistingCustomer] = useState(false);

    // Fetch dynamic models on mount
    React.useEffect(() => {
        const fetchModels = async () => {
            const { getCatalogModels } = await import('@/actions/crm');
            const models = await getCatalogModels();
            if (models && models.length > 0) {
                setCatalogModels(models);
            } else {
                setCatalogModels(['Ather 450X', 'TVS iQube', 'Ola S1 Pro', 'Bajaj Chetak']);
            }
        };
        fetchModels();
    }, []);

    const [docCount, setDocCount] = useState(0);

    // Phone Discovery Logic
    React.useEffect(() => {
        const checkPhone = async () => {
            if (phone.length === 10) {
                setIsCheckingPhone(true);
                try {
                    const { checkExistingCustomer, getMemberDocuments } = await import('@/actions/crm');
                    // 1. Check Profile
                    const { data: profile, memberId } = await checkExistingCustomer(phone);
                    if (profile) {
                        setCustomerName(profile.name || '');
                        setPincode(profile.pincode || '');
                        setDob(parseDateToISO(profile.dob || '') || '');
                        setIsExistingCustomer(true);

                        // 2. Check for Reusable Assets
                        if (memberId) {
                            const docs = await getMemberDocuments(memberId);
                            setDocCount(docs.length);
                        }
                    } else {
                        setIsExistingCustomer(false);
                        setDocCount(0);
                    }
                } catch (error) {
                    console.error('Phone check failed:', error);
                } finally {
                    setIsCheckingPhone(false);
                }
            } else {
                setIsExistingCustomer(false);
                setDocCount(0);
            }
        };
        checkPhone();
    }, [phone]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pincode.length !== 6) {
            alert('Please enter a valid 6-digit Pincode');
            return;
        }
        setIsSubmitting(true);
        try {
            await onSubmit({
                customerName,
                phone,
                pincode,
                model: model || undefined,
                dob: dob || undefined
            });
            // ONLY reset form if onSubmit succeeded
            setCustomerName('');
            setPhone('');
            setPincode('');
            setModel('');
            setDob('');
            setIsExistingCustomer(false);
        } catch (error) {
            // Error is already toasted by parent, we just stop here
            // This keeps the states (customerName, phone, etc.) intact
            console.log('[DEBUG] LeadForm submission failed, state preserved.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title="REGISTER NEW IDENTITY"
        >
            <form onSubmit={handleSubmit} className="space-y-8 p-1">
                <div className="space-y-6">
                    {/* Phone Number */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 ml-1">
                            Mobile Connectivity
                        </label>
                        <div className="relative group">
                            <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isCheckingPhone ? 'text-indigo-400 animate-pulse' : 'text-slate-400 group-focus-within:text-indigo-600'}`} size={18} />
                            <input
                                required
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(normalizeIndianPhone(e.target.value))}
                                onPaste={(e) => {
                                    const text = e.clipboardData.getData('text');
                                    const normalized = normalizeIndianPhone(text);
                                    if (normalized) {
                                        e.preventDefault();
                                        setPhone(normalized);
                                    }
                                }}
                                placeholder="10-DIGIT SECURE NUMBER"
                                className={`w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[1.25rem] text-sm font-black tracking-tight text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/5 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 dark:focus:border-indigo-500/60 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-500 ${isCheckingPhone ? 'opacity-50' : ''}`}
                            />
                            {isCheckingPhone && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer Name */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                Legal Name
                            </label>
                            {isExistingCustomer && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-black uppercase bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-0.5 rounded-full tracking-widest animate-in fade-in slide-in-from-right-2">Discovered</span>
                                    {docCount > 0 && (
                                        <span className="text-[8px] font-black uppercase bg-indigo-100/50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 px-2 py-0.5 rounded-full tracking-widest animate-in fade-in slide-in-from-right-4">
                                            {docCount} Assets Vaulted
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="relative group">
                            <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isExistingCustomer ? 'text-emerald-500' : 'text-slate-400 group-focus-within:text-indigo-600'}`} size={18} />
                            <input
                                required
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="e.g. ADITYA VERMA"
                                className={`w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[1.25rem] text-sm font-black tracking-tight text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/5 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 dark:focus:border-indigo-500/60 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-500 uppercase italic ${isExistingCustomer ? 'bg-emerald-50/30 dark:bg-emerald-500/10' : ''}`}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Pincode */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                                PINCODE
                            </label>
                            <div className="relative group">
                                <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isExistingCustomer && pincode ? 'text-emerald-500' : 'text-slate-400 group-focus-within:text-indigo-600'}`} size={18} />
                                <input
                                    required
                                    type="text"
                                    maxLength={6}
                                    pattern="\d{6}"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    className={`w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[1.25rem] text-sm font-black tracking-tight text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/5 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 dark:focus:border-indigo-500/60 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-500 ${isExistingCustomer && pincode ? 'bg-emerald-50/30 dark:bg-emerald-500/10' : ''}`}
                                />
                            </div>
                        </div>

                        {/* Date of Birth */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                                BIRTH RECORD
                            </label>
                            <div className="relative group">
                                <Cake className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isExistingCustomer && dob ? 'text-emerald-500' : 'text-slate-400 group-focus-within:text-indigo-600'}`} size={18} />
                                <input
                                    type="date"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    onPaste={(e) => {
                                        const text = e.clipboardData.getData('text');
                                        const parsed = parseDateToISO(text);
                                        if (parsed) {
                                            e.preventDefault();
                                            setDob(parsed);
                                        }
                                    }}
                                    className={`w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[1.25rem] text-xs font-black tracking-tight text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/5 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 dark:focus:border-indigo-500/60 outline-none transition-all uppercase ${isExistingCustomer && dob ? 'bg-emerald-50/30 dark:bg-emerald-500/10' : ''}`}
                                />
                            </div>
                        </div>
                    </div>

                </div>

                <div className="pt-8 flex gap-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white dark:hover:bg-white/5"
                    >
                        Abort
                    </Button>
                    <Button
                        type="submit"
                        isLoading={isSubmitting}
                        className="flex-[2] h-14 bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-2xl shadow-2xl shadow-slate-200 dark:shadow-none font-black text-[11px] uppercase tracking-[0.2em] transition-all"
                    >
                        Create Identity <Send size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </form>
        </SlideOver>
    );
}
