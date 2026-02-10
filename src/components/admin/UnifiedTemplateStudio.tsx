'use client';

import React, { useState } from 'react';
import { TemplateGallery } from '@/components/admin/TemplateGallery';
import { LayoutDashboard, Settings } from 'lucide-react';

interface UnifiedTemplateStudioProps {
    dashboardTemplates: any[];
    dashboardAssignments: any[];
}

export function UnifiedTemplateStudio({ dashboardTemplates, dashboardAssignments }: UnifiedTemplateStudioProps) {
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SIDEBAR'>('DASHBOARD');

    return (
        <div className="space-y-8">
            {/* Main Tab Navigation */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-white/5 pb-1">
                <button
                    onClick={() => setActiveTab('DASHBOARD')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-xl text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                        activeTab === 'DASHBOARD'
                            ? 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10'
                            : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    <LayoutDashboard size={16} />
                    <span>Dashboard Layouts</span>
                </button>
                <button
                    onClick={() => setActiveTab('SIDEBAR')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-xl text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                        activeTab === 'SIDEBAR'
                            ? 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10'
                            : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    <Settings size={16} />
                    <span>Sidebars</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'DASHBOARD' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <TemplateGallery
                            initialTemplates={dashboardTemplates}
                            initialAssignments={dashboardAssignments}
                        />
                    </div>
                )}

                {activeTab === 'SIDEBAR' && (
                    <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
                            <Settings size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Sidebar Configuration</h3>
                        <p className="text-slate-500 mt-2">Manage sidebar menu items for each role dynamically.</p>
                        <span className="inline-block mt-4 px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                            Coming Soon
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
