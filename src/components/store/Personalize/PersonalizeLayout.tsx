import React from 'react';

interface PersonalizeLayoutProps {
    header: React.ReactNode;
    visuals: React.ReactNode;
    tabs: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export default function PersonalizeLayout({ header, visuals, tabs, children, className = '' }: PersonalizeLayoutProps) {
    return (
        <section
            className={`w-full bg-white text-slate-900 transition-colors duration-500 ${className}`}
        >
            <div className="page-container py-4 md:py-8 space-y-8">
                {/* 1. Header Section */}
                {header && (
                    <div
                        className="sticky z-40 bg-white/80 backdrop-blur-xl px-6 -mx-6 py-4 border-b border-slate-200 transition-all duration-300"
                        style={{ top: 'var(--header-h)' }}
                    >
                        {header}
                    </div>
                )}

                {/* 2. Visuals Section (Image | Video) */}
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">{visuals}</div>

                {/* 3. Configuration Section (Tabs + Content) */}
                <div className="bg-white border border-slate-200 rounded-[3rem] p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-100 shadow-xl shadow-slate-200/50">
                    {/* Tab Navigation */}
                    <div className="flex justify-center md:justify-start overflow-x-auto pb-2">{tabs}</div>

                    {/* Active Tab Content */}
                    <div className="min-h-[400px]">{children}</div>
                </div>
            </div>
        </section>
    );
}
