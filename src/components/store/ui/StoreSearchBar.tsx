'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

export function StoreSearchBar({
    value,
    placeholder,
    onChange,
    onClear,
    className = '',
    variant = 'default',
    onFocus,
}: {
    value: string;
    placeholder: string;
    onChange: (next: string) => void;
    onClear: () => void;
    className?: string;
    variant?: 'default' | 'smart';
    onFocus?: () => void;
}) {
    const isSmart = variant === 'smart';

    return (
        <div
            className={`flex items-center ${isSmart ? 'gap-2.5 px-3 py-2 rounded-xl bg-white border border-slate-200' : 'gap-2 px-3.5 py-2 rounded-full bg-white/80 border border-black/10'} ${className.includes('h-') ? '' : 'h-10'} ${className.includes('border-') ? '' : isSmart ? 'border-slate-200' : 'border-black/10'} ${className}`}
        >
            <Search size={isSmart ? 15 : 13} className="text-slate-400 shrink-0" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                onFocus={onFocus}
                className={`flex-1 min-w-0 bg-transparent focus:outline-none placeholder:text-slate-400 ${isSmart ? 'text-[13px] font-semibold tracking-normal normal-case' : 'text-[11px] font-black tracking-widest uppercase placeholder:text-slate-300'}`}
            />
            {value && (
                <button
                    onClick={onClear}
                    className="flex items-center text-slate-400 hover:text-slate-900 transition-colors"
                >
                    <X size={isSmart ? 15 : 14} />
                </button>
            )}
        </div>
    );
}
