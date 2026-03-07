'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

export function StoreSearchBar({
    value,
    placeholder,
    onChange,
    onClear,
    className = '',
}: {
    value: string;
    placeholder: string;
    onChange: (next: string) => void;
    onClear: () => void;
    className?: string;
}) {
    return (
        <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/80 border border-black/10 ${className.includes('h-') ? '' : 'h-10'} ${className.includes('border-') ? '' : 'border-black/10'} ${className}`}
        >
            <Search size={13} className="text-slate-400 shrink-0" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-[11px] font-black tracking-widest uppercase focus:outline-none placeholder:text-slate-300"
            />
            {value && (
                <button onClick={onClear} className="flex items-center text-slate-400 hover:text-slate-900">
                    <X size={14} />
                </button>
            )}
        </div>
    );
}
