'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

export function ThemeToggle({ className, iconSize = 18 }: { className?: string; iconSize?: number }) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className={className} style={{ width: '2.5rem', height: '2.5rem' }} />; // Default placeholder
    }

    return (
        <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`flex items-center justify-center flex-shrink-0 transition-all ${className}`}
            aria-label="Toggle Theme"
        >
            {theme === 'dark' ? (
                <Sun size={iconSize} strokeWidth={2} />
            ) : (
                <Moon size={iconSize} strokeWidth={2} />
            )}
        </button>
    );
}
