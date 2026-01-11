'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, MapPin, User, ArrowRight } from 'lucide-react';
import { useTenant } from '@/lib/tenant/tenantContext';

export default function UserDashboard() {
    const router = useRouter();
    const { userName } = useTenant();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/50">
            <div className="w-full max-w-2xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Welcome Header */}
                <div className="space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 mb-4">
                        <User size={32} />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                        Welcome, {userName}!
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                        You have successfully logged in securely. Your personal garage and bookings will appear here.
                    </p>
                </div>

                {/* Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    <button
                        onClick={() => router.push('/store')}
                        className="group p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                                <ShoppingBag size={24} />
                            </div>
                            <ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Browse Motorcycles</h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Explore our premium collection and verified dealers.</p>
                    </button>

                    <div className="p-6 rounded-3xl bg-slate-100 dark:bg-white/5 border border-transparent opacity-60">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-2xl bg-slate-200 dark:bg-white/10 text-slate-500">
                                <MapPin size={24} />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400 mb-1">My Garage</h3>
                        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Purchase history and documents coming soon.</p>
                    </div>
                </div>

                <div className="pt-8">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        BookMyBike Secure Account
                    </p>
                </div>
            </div>
        </div>
    );
}
