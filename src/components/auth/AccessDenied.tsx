'use client';

import React from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function AccessDenied() {
    const router = useRouter();
    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-md p-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                    <ShieldAlert className="text-red-600 dark:text-red-500" size={40} />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Access Restricted</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                        This portal is invite-only. Your account does not have the required permissions to access this workspace.
                    </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 text-xs text-slate-500">
                    If you believe this is an error, please contact your organization administrator to request access.
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                    <LogOut size={16} /> Sign Out
                </button>
            </div>
        </div>
    );
}
