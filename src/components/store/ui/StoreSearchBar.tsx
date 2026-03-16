'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

const PLACEHOLDER_ITEMS = [
    'Activa 6G',
    'Splendor Plus',
    'Passion+',
    'Jupiter 125',
    'HF Deluxe',
    'Access 125',
    'Pulsar NS200',
    'TVS NTORQ',
    'Shine 100',
    'Platina 110',
    'XPulse 200',
    'Apache RTR',
];

function TypewriterPlaceholder() {
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [displayed, setDisplayed] = useState('');
    const [phase, setPhase] = useState<'typing' | 'hold' | 'erasing'>('typing');
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const current = PLACEHOLDER_ITEMS[phraseIndex % PLACEHOLDER_ITEMS.length];

        if (phase === 'typing') {
            if (displayed.length < current.length) {
                timeoutRef.current = setTimeout(() => {
                    setDisplayed(current.slice(0, displayed.length + 1));
                }, 55);
            } else {
                timeoutRef.current = setTimeout(() => setPhase('hold'), 1400);
            }
        } else if (phase === 'hold') {
            timeoutRef.current = setTimeout(() => setPhase('erasing'), 600);
        } else if (phase === 'erasing') {
            if (displayed.length > 0) {
                timeoutRef.current = setTimeout(() => {
                    setDisplayed(prev => prev.slice(0, -1));
                }, 28);
            } else {
                timeoutRef.current = setTimeout(() => {
                    setPhraseIndex(i => i + 1);
                    setPhase('typing');
                }, 300);
            }
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [displayed, phase, phraseIndex]);

    return (
        <span className="pointer-events-none select-none text-slate-400 text-[11px] font-black tracking-widest uppercase flex items-center">
            {displayed}
            <span className="inline-block w-[1.5px] h-[0.9em] bg-slate-400/70 ml-[2px] align-middle animate-pulse" />
        </span>
    );
}

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
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div
            className={`flex items-center gap-2.5 px-3.5 rounded-full h-10 ${className}`}
            onClick={() => inputRef.current?.focus()}
        >
            <Search size={14} className="text-slate-400 shrink-0" />

            <div className="flex-1 min-w-0 relative flex items-center h-full">
                {/* Animated placeholder — shown only when input is empty */}
                {!value && (
                    <div className="absolute inset-0 flex items-center pointer-events-none">
                        {isSmart ? (
                            <TypewriterPlaceholder />
                        ) : (
                            <span className="text-slate-300 text-[11px] font-black tracking-widest uppercase">
                                {placeholder}
                            </span>
                        )}
                    </div>
                )}

                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onFocus={onFocus}
                    className={`flex-1 min-w-0 bg-transparent focus:outline-none caret-slate-600 ${
                        isSmart
                            ? 'text-[12px] font-bold tracking-normal normal-case text-slate-900'
                            : 'text-[11px] font-black tracking-widest uppercase text-slate-900'
                    }`}
                />
            </div>

            {value && (
                <button
                    onClick={onClear}
                    className="flex items-center text-slate-400 hover:text-slate-900 transition-colors shrink-0"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}
