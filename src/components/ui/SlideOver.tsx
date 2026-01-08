'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SlideOverProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: 'md' | 'lg' | 'xl' | '2xl';
}

export default function SlideOver({
    isOpen,
    onClose,
    title,
    children,
    width = 'md'
}: SlideOverProps) {
    // Close on ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const widthClasses = {
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl'
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
                    onClick={onClose}
                />

                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                    <div
                        className={`pointer-events-auto w-screen ${widthClasses[width]} transform transition-all duration-300 ease-out animate-slide-in-right`}
                    >
                        <div className="flex h-full flex-col bg-white dark:bg-slate-900 shadow-2xl">
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
                                <button
                                    type="button"
                                    className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    onClick={onClose}
                                >
                                    <span className="sr-only">Close panel</span>
                                    <X size={20} strokeWidth={1.5} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="relative flex-1 px-6 py-6 overflow-y-auto scrollbar-thin bg-slate-50 dark:bg-slate-900">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
