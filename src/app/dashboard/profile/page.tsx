'use client';

import React from 'react';
import { User, Mail, Phone, Shield, Building, MapPin } from 'lucide-react';
import { useTenant } from '@/lib/tenant/tenantContext';

export default function ProfilePage() {
    const { tenantType } = useTenant();

    // Mock Data - In real app, fetch from Supabase
    const user = {
        name: typeof window !== 'undefined' ? localStorage.getItem('user_name') || 'Ajit Singh' : 'Ajit Singh',
        role: tenantType || 'DEALER',
        email: 'ajit.singh@honda.dealer.com',
        phone: '+91 74474 03491',
        dealership: 'Honda Delhi South',
        location: 'Saket, New Delhi',
        id: 'DLR-DEL-2024-001'
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30">
                    <User size={24} strokeWidth={1.5} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">User Profile</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your account and preferences</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-white/5 text-center space-y-4 shadow-sm">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-blue-500/20">
                            {user.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">{user.name}</h2>
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">{user.role.replace('_', ' ')}</p>
                        </div>
                        <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                                <Shield size={10} /> Verified Agent
                            </span>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-white/5 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Contact Information</h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{user.phone}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-white/5 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Organization Details</h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                    <Building size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dealership Name</p>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{user.dealership}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</p>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{user.location}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
