'use client';

import React from 'react';
import { X } from 'lucide-react';

export function FilterChip({ label, value, onRemove }: { label: string; value: string; onRemove: () => void }) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full">
            <span className="text-[9px] font-black uppercase text-slate-400">{label}</span>
            <span className="text-[10px] font-bold text-slate-900">{value}</span>
            <button onClick={onRemove} className="text-slate-400 hover:text-slate-900">
                <X size={10} />
            </button>
        </div>
    );
}
