'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import ActivityTimeline from './ActivityTimeline';

const TABS = ['Overview', 'Details', 'Settings', 'Activity'];

export interface SnapshotItem {
    label: string;
    value: React.ReactNode;
    icon?: React.ElementType;
}

interface DetailPanelProps {
    title: string;
    status?: string;
    onClose?: () => void;
    renderContent?: (activeTab: string) => React.ReactNode;
    rightPanelContent?: (activeTab: string) => React.ReactNode;
    onTabChange?: (tab: string) => void;
    actionButton?: React.ReactNode;
    tabs?: string[];
    snapshotItems?: SnapshotItem[];
    isLoading?: boolean;
    hideHeader?: boolean;
    showTabs?: boolean;
    onEdit?: () => void;
    onAction?: () => void;
    activeTab?: string; // Controlled active tab
}

export default function DetailPanel({
    title,
    status = 'Active',
    onClose,
    renderContent,
    rightPanelContent,
    onTabChange,
    actionButton,
    tabs = TABS as unknown as string[],
    snapshotItems,
    isLoading = false,
    hideHeader = false,
    showTabs = true,
    onEdit,
    onAction,
    activeTab,
}: DetailPanelProps) {
    const effectiveTabs = tabs.includes('Activity') ? tabs : [...tabs, 'Activity'];
    const [internalActiveTab, setInternalActiveTab] = useState<string>(activeTab || effectiveTabs[0]);

    // Use controlled tab if provided, otherwise internal state
    const currentTab = activeTab !== undefined ? activeTab : internalActiveTab;

    const handleTabClick = (tab: string) => {
        setInternalActiveTab(tab);
        if (onTabChange) onTabChange(tab);
    };

    // Helper to get status badge styling
    const getStatusBadgeClass = (s: string) => {
        const statusStr = s?.toLowerCase();
        if (['active', 'issued', 'delivered', 'completed', 'paid', 'confirmed'].includes(statusStr)) {
            return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
        }
        if (['pending', 'processing', 'in_progress', 'awaiting'].includes(statusStr)) {
            return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
        }
        if (['cancelled', 'rejected', 'failed', 'overdue'].includes(statusStr)) {
            return 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800';
        }
        return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            {!hideHeader && (
                <div className="px-6 lg:px-8 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-12">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                                    {title}
                                </h1>
                                {!snapshotItems && (
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${getStatusBadgeClass(status)}`}
                                    >
                                        {status}
                                    </span>
                                )}
                            </div>
                        </div>

                        {snapshotItems && snapshotItems.length > 0 && (
                            <div className="hidden xl:flex items-center gap-8 bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/5 shadow-inner">
                                {snapshotItems.map((item, i) => (
                                    <React.Fragment key={i}>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                {item.label}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                {item.icon && <item.icon size={10} className="text-slate-400" />}
                                                <div className="text-[10px] font-bold dark:text-white uppercase tracking-tight">
                                                    {item.value}
                                                </div>
                                            </div>
                                        </div>
                                        {i < snapshotItems.length - 1 && (
                                            <div className="w-px h-6 bg-slate-200 dark:bg-white/10" />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (onEdit) onEdit();
                            }}
                            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => {
                                if (onAction) onAction();
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:shadow-xl hover:shadow-indigo-500/30"
                        >
                            Actions
                        </button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 ml-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <X size={20} strokeWidth={1.5} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Tabs Navigation */}
            {showTabs && effectiveTabs.length > 0 && (
                <div className="px-6 lg:px-8 py-3 border-b border-slate-100 dark:border-white/5 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md shrink-0 flex items-center justify-between">
                    <div className="flex bg-slate-100/50 dark:bg-white/5 p-1 rounded-2xl border border-slate-200/50 dark:border-white/5">
                        <nav className="flex space-x-1 overflow-x-auto scrollbar-none">
                            {effectiveTabs.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => handleTabClick(tab)}
                                    className={`
                                        min-w-[100px] py-2 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300
                                        ${
                                            currentTab === tab
                                                ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm scale-[1.02] border border-slate-200/50 dark:border-white/10'
                                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/5'
                                        }
                                    `}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center">{actionButton}</div>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-auto scrollbar-thin px-6 lg:px-8 py-6">
                {rightPanelContent ? (
                    <div className="flex gap-10 w-full h-full">
                        <div className="flex-[8] min-w-0 overflow-auto">
                            {isLoading ? (
                                <div className="space-y-6 animate-pulse">
                                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4"></div>
                                    <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                                </div>
                            ) : currentTab === 'Activity' ? (
                                <ActivityTimeline />
                            ) : (
                                renderContent && renderContent(currentTab)
                            )}
                        </div>
                        <div className="flex-[2] min-w-0 overflow-auto">{rightPanelContent(currentTab)}</div>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col">
                        {isLoading ? (
                            <div className="space-y-6 animate-pulse">
                                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4"></div>
                                <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                            </div>
                        ) : currentTab === 'Activity' ? (
                            <ActivityTimeline />
                        ) : (
                            renderContent && renderContent(currentTab)
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
