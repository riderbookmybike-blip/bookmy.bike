'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchableInput({
    label,
    placeholder,
    onAdd,
    existingItems,
    error
}: {
    label: string,
    placeholder: string,
    onAdd: (val: string) => void,
    existingItems: string[],
    error?: string | null
}) {
    const [value, setValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const suggestions = existingItems.filter(item =>
        item.toLowerCase().includes(value.toLowerCase()) && item.toLowerCase() !== value.toLowerCase()
    );

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmed = value.trim();
        if (trimmed) {
            onAdd(trimmed);
            setValue('');
            setShowSuggestions(false);
        }
    };

    return (
        <div className="space-y-3 relative">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-4">{label}</label>
            <div className="relative group">
                <input
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder={placeholder}
                    className="w-full px-8 py-5 bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/10 rounded-[2rem] font-black text-2xl uppercase italic outline-none focus:border-indigo-500 focus:ring-4 ring-indigo-500/5 transition-all placeholder:font-normal placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />
                <button
                    onClick={() => handleSubmit()}
                    disabled={!value.trim()}
                    className="absolute right-3 top-3 bottom-3 px-6 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 disabled:opacity-20 transition-all shadow-xl shadow-slate-900/10"
                >
                    Add
                </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-slate-50 dark:border-white/5 flex items-center gap-2 text-slate-400">
                        <Search size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Suggestions</span>
                    </div>
                    {suggestions.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                onAdd(item);
                                setValue('');
                                setShowSuggestions(false);
                            }}
                            className="w-full text-left px-8 py-4 hover:bg-slate-50 dark:hover:bg-white/5 font-bold text-slate-600 dark:text-slate-300 transition-colors"
                        >
                            {item}
                        </button>
                    ))}
                </div>
            )}
            {error && <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-4">{error}</p>}
        </div>
    );
}
