'use client';

import React, { useState } from 'react';
import { UserPlus, LogOut, ArrowRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function RegistrationConsent() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    const handleCreateAccount = async () => {
        setLoading(true);
        // We will call an API route or Server Action to create the profile
        // For now, we can try to insert directly if RLS allows, or call an API.
        // Given RLS usually allows "insert own profile", let's try calling an API for better control/validation.

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
            });

            if (res.ok) {
                // Refresh to trigger redirect logic in page.tsx or middleware
                window.location.reload();
            } else {
                throw new Error('Registration failed');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to create account. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-md p-8 text-center space-y-8 animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto">
                    <UserPlus className="text-indigo-600 dark:text-indigo-500" size={40} />
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Welcome!</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-xs mx-auto">
                        It looks like you are new here. Would you like to create a new Marketplace account?
                    </p>
                </div>

                <div className="space-y-3 pt-4">
                    <button
                        onClick={handleCreateAccount}
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/30"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <>Create Account <ArrowRight size={16} /></>}
                    </button>

                    <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="w-full py-4 bg-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                    >
                        Cancel & Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
