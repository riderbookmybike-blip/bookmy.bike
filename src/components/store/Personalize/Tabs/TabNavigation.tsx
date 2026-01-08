import React from 'react';

interface TabItem {
    id: string;
    label: string;
    count?: number; // E.g. (2) items selected
}

interface TabNavigationProps {
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (id: string) => void;
    className?: string;
}

export default function TabNavigation({ tabs, activeTab, onTabChange, className = '' }: TabNavigationProps) {
    return (
        <div className={`flex items-center w-full gap-2 overflow-x-auto no-scrollbar ${className}`}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            flex-1 w-full text-center px-4 py-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300
                            border flex items-center justify-center gap-2
                            ${isActive
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25 scale-100 z-10'
                                : 'bg-transparent border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300 hover:bg-slate-900'
                            }
                        `}
                    >
                        <span>{tab.label}</span>
                        {tab.count !== undefined && tab.count !== null && (
                            <span className={`inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[9px] font-bold ${isActive ? 'bg-white text-blue-600' : 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-600'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
