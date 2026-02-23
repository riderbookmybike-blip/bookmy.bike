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
        <div className={`flex items-center w-full gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${className}`}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            flex-1 w-full text-center px-3 md:px-4 py-3 min-h-[48px] rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300
                            border flex items-center justify-center gap-2
                            ${isActive
                                ? 'bg-brand-primary border-brand-primary text-black shadow-lg shadow-brand-primary/25 scale-105 z-10'
                                : 'bg-transparent border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                            }
                        `}
                    >
                        <span>{tab.label}</span>
                        {tab.count !== undefined && tab.count !== null && (
                            <span className={`inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[8px] font-bold ${isActive ? 'bg-black text-brand-primary' : 'bg-slate-200 text-slate-500'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
