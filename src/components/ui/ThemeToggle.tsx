'use client';

import * as React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import type { ThemePreference } from '@/lib/theme/themePreference';

export function ThemeToggle({ className, iconSize = 18 }: { className?: string; iconSize?: number }) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className={className} style={{ width: '2.5rem', height: '2.5rem' }} />; // Default placeholder
    }

    const nextTheme: ThemePreference = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';

    return (
        <button
            type="button"
            onClick={() => setTheme(nextTheme)}
            className={`flex items-center justify-center flex-shrink-0 transition-all ${className}`}
            aria-label={`Theme is ${theme}. Switch to ${nextTheme}`}
            title={`Switch to ${nextTheme}`}
        >
            {theme === 'dark' ? (
                <Sun size={iconSize} strokeWidth={2} />
            ) : theme === 'system' ? (
                <Monitor size={iconSize} strokeWidth={2} />
            ) : (
                <Moon size={iconSize} strokeWidth={2} />
            )}
        </button>
    );
}
