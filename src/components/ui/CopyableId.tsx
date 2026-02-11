'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

type CopyableIdProps = {
    id: string;
    className?: string;
    textClassName?: string;
    iconClassName?: string;
    title?: string;
    showHash?: boolean;
};

const formatShortId = (id: string) => {
    const raw = (id || '').replace(/-/g, '').toUpperCase();
    const short = raw.slice(-9);
    if (short.length !== 9) return short;
    return `${short.slice(0, 3)}-${short.slice(3, 6)}-${short.slice(6)}`;
};

export default function CopyableId({
    id,
    className = '',
    textClassName = '',
    iconClassName = '',
    title = 'Click to copy full UUID',
    showHash = true,
}: CopyableIdProps) {
    const [copied, setCopied] = useState(false);
    if (!id) return null;

    const formatted = formatShortId(id);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(id);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className={`group/btn inline-flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 transition-all ${className}`}
            title={title}
        >
            <span
                className={`text-[10px] font-mono font-bold text-slate-500 group-hover/btn:text-indigo-600 transition-colors uppercase tracking-widest ${textClassName}`}
            >
                {showHash ? '#' : ''}
                {formatted}
            </span>
            {copied ? (
                <Check size={12} className={`text-emerald-500 ${iconClassName}`} />
            ) : (
                <Copy size={12} className={`text-slate-300 group-hover/btn:text-indigo-500 ${iconClassName}`} />
            )}
        </button>
    );
}

export { formatShortId };
