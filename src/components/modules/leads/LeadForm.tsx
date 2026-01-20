'use client';

import React, { useState } from 'react';
import SlideOver from '@/components/ui/SlideOver';
import { Button } from '@/components/ui/button';
import { User, Phone, MapPin, Bike, Send, Calendar, Cake } from 'lucide-react';

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

    // Phone Discovery Logic
    React.useEffect(() => {
        const checkPhone = async () => {
            if (phone.length === 10) {
                setIsCheckingPhone(true);
                try {
                    const { checkExistingCustomer } = await import('@/actions/crm');
                    const profile = await checkExistingCustomer(phone);
                    if (profile) {
                        setCustomerName(profile.name || '');
                        setPincode(profile.pincode || '');
                        setDob(profile.dob || '');
                        setIsExistingCustomer(true);
                        // toast.success('Identity discovered in database');
                    } else {
                        setIsExistingCustomer(false);
                    }
                } catch (error) {
                    console.error('Phone check failed:', error);
                } finally {
                    setIsCheckingPhone(false);
                }
            } else {
                setIsExistingCustomer(false);
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
            // Reset form
            setCustomerName('');
            setPhone('');
            setPincode('');
            setModel('');
            setDob('');
            setIsExistingCustomer(false);
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
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="10-DIGIT SECURE NUMBER"
                                className={`w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] text-sm font-black tracking-tight focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 ${isCheckingPhone ? 'opacity-50' : ''}`}
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
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                Legal Name
                            </label>
                            {isExistingCustomer && (
                                <span className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full tracking-widest animate-in fade-in slide-in-from-right-2">Discovered</span>
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
                                className={`w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] text-sm font-black tracking-tight focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 uppercase italic ${isExistingCustomer ? 'bg-emerald-50/30' : ''}`}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Pincode */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
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
                                    className={`w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] text-sm font-black tracking-tight focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 ${isExistingCustomer && pincode ? 'bg-emerald-50/30' : ''}`}
                                />
                            </div>
                        </div>

                        {/* Date of Birth */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                                BIRTH RECORD
                            </label>
                            <div className="relative group">
                                <Cake className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isExistingCustomer && dob ? 'text-emerald-500' : 'text-slate-400 group-focus-within:text-indigo-600'}`} size={18} />
                                <input
                                    type="date"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    className={`w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] text-xs font-black tracking-tight focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all uppercase ${isExistingCustomer && dob ? 'bg-emerald-50/30' : ''}`}
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
                        className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900"
                    >
                        Abort
                    </Button>
                    <Button
                        type="submit"
                        isLoading={isSubmitting}
                        className="flex-[2] h-14 bg-slate-900 hover:bg-black text-white rounded-2xl shadow-2xl shadow-slate-200 font-black text-[11px] uppercase tracking-[0.2em] transition-all"
                    >
                        Create Identity <Send size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </form>
        </SlideOver>
    );
}
