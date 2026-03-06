'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'soft';
type ButtonSize = 'sm' | 'md';

const variantClass: Record<ButtonVariant, string> = {
    primary:
        'bg-[#F4B000] text-black shadow-lg shadow-[#F4B000]/20 hover:shadow-[#F4B000]/40 hover:bg-[#FFD700] active:scale-[0.98]',
    ghost: 'bg-transparent text-slate-500 hover:text-slate-900',
    soft: 'bg-slate-900 text-white hover:bg-black active:scale-[0.98]',
};

const sizeClass: Record<ButtonSize, string> = {
    sm: 'px-3 py-2 text-[9px] rounded-xl',
    md: 'px-5 py-2.5 text-[10px] rounded-xl',
};

export function StoreButton({
    children,
    className = '',
    size = 'md',
    variant = 'primary',
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
}) {
    return (
        <button
            {...props}
            className={`inline-flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed ${sizeClass[size]} ${variantClass[variant]} ${className}`}
        >
            {children}
        </button>
    );
}
