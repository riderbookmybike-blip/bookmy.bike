'use client';

import React, { useState } from 'react';
import DynamicSidebar from '@/components/layout/DynamicSidebar';
import DynamicDashboard from '@/components/dashboard/DynamicDashboard';
import { AUMS_SUPERADMIN_SIDEBAR, AUMS_SUPERADMIN_DASHBOARD } from '@/modules/templates/aums-superadmin';
import { DEALER_ADMIN_SIDEBAR, DEALER_ADMIN_DASHBOARD } from '@/modules/templates/dealer-admin';

export default function DynamicDemoPage() {
    const [role, setRole] = useState<'SUPER_ADMIN' | 'DEALER_ADMIN'>('SUPER_ADMIN');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    const [isPinned, setIsPinned] = useState(true);

    const config = role === 'SUPER_ADMIN'
        ? { sidebar: AUMS_SUPERADMIN_SIDEBAR, dashboard: AUMS_SUPERADMIN_DASHBOARD }
        : { sidebar: DEALER_ADMIN_SIDEBAR, dashboard: DEALER_ADMIN_DASHBOARD };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
            {/* Sidebar Demo */}
            <DynamicSidebar
                config={config.sidebar}
                isExpanded={isSidebarExpanded}
                isPinned={isPinned}
                onHoverChange={(hover) => !isPinned && setIsSidebarExpanded(hover)}
                onPinToggle={() => {
                    setIsPinned(!isPinned);
                    setIsSidebarExpanded(!isPinned);
                }}
            />

            {/* Main Content */}
            <main
                className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out`}
                style={{ marginLeft: isPinned ? 280 : 80 }}
            >
                {/* Demo Controls */}
                <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Preview Mode</span>
                        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-lg">
                            <button
                                onClick={() => setRole('SUPER_ADMIN')}
                                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${role === 'SUPER_ADMIN' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                            >
                                Super Admin
                            </button>
                            <button
                                onClick={() => setRole('DEALER_ADMIN')}
                                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${role === 'DEALER_ADMIN' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                            >
                                Dealer Admin
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <DynamicDashboard config={config.dashboard} />
                </div>
            </main>
        </div>
    );
}
