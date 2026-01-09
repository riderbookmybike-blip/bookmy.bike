'use client';

import React from 'react';
import { Settings, Bell, Lock, Globe, Palette, Shield } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-lg shadow-slate-500/30">
                    <Settings size={24} strokeWidth={1.5} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Configure your workspace preferences</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Navigation (Future Scalability) */}
                <div className="md:col-span-1 space-y-2">
                    <button className="w-full text-left px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-bold border border-blue-100 dark:border-blue-500/20 flex items-center gap-3">
                        <Globe size={18} /> General
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors flex items-center gap-3">
                        <Bell size={18} /> Notifications
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors flex items-center gap-3">
                        <Palette size={18} /> Appearance
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors flex items-center gap-3">
                        <Shield size={18} /> Security
                    </button>
                </div>

                {/* Content Area */}
                <div className="md:col-span-2 space-y-6">
                    {/* General Settings */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-white/5 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">General Preferences</h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5">
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Language</p>
                                    <p className="text-xs text-slate-500 mt-1">Select your preferred interface language</p>
                                </div>
                                <select className="bg-slate-50 dark:bg-white/5 border-none text-sm font-bold rounded-xl px-4 py-2 outline-none">
                                    <option>English (US)</option>
                                    <option>Hindi</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between py-4">
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Timezone</p>
                                    <p className="text-xs text-slate-500 mt-1">Set your local timezone for reports</p>
                                </div>
                                <select className="bg-slate-50 dark:bg-white/5 border-none text-sm font-bold rounded-xl px-4 py-2 outline-none">
                                    <option>IST (GMT+5:30)</option>
                                    <option>UTC</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Security Placeholder */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-white/5 shadow-sm opacity-60 pointer-events-none">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Security (Managed by Role)</h3>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-full">
                                <Lock size={20} className="text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-500">Password and 2FA settings are managed via your Identity Provider.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
