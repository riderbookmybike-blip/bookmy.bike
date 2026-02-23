'use client';

import * as React from 'react';
import { Sun } from 'lucide-react';

export function ThemeToggle({ className, iconSize = 18 }: { className?: string; iconSize?: number }) {
    return (
        <button
            type="button"
            disabled
            className={`flex items-center justify-center flex-shrink-0 transition-all ${className}`}
            aria-label="Light mode enabled"
            title="Light mode enabled"
        >
            <Sun size={iconSize} strokeWidth={2} />
        </button>
    );
}
