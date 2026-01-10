'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

export default function AuthErrorPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
            <div className="mb-8">
                <Logo mode="auto" />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto text-red-500">
                    <AlertTriangle size={32} />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Authentication Failed</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        We couldn't sign you in. This often happens if the login was canceled or the connection timed out.
                    </p>
                </div>

                <div className="pt-4">
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center gap-2 w-full py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold transition-all"
                    >
                        <ArrowLeft size={20} />
                        Back to Login
                    </Link>
                </div>

                <p className="text-xs text-slate-400">
                    Error Code: AUTH_CALLBACK_ERROR
                </p>
            </div>
        </div>
    );
}
