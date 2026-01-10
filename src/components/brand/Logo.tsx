import React, { useMemo } from 'react';
import { ICON_PATHS, TEXT_PATHS, TAGLINE_PATHS, BRAND_BLUE } from './paths';
import { useTheme } from '@/components/providers/ThemeProvider';

interface LogoProps {
    className?: string;
    iconClassName?: string;
    mode?: 'auto' | 'light' | 'dark';
    variant?: 'full' | 'icon' | 'wordmark';
    monochrome?: 'none' | 'white' | 'black';
    size?: 'sm' | 'md' | 'lg' | number;
}

export const Logo: React.FC<LogoProps> = ({
    className = "",
    iconClassName = "",
    mode = 'auto',
    variant = 'full',
    monochrome = 'none',
    size = 'md'
}) => {
    const { theme } = useTheme();

    const heights = useMemo(() => {
        if (typeof size === 'number') return { h: `${size}px`, iconW: `${size * (80 / 109)}px` };
        switch (size) {
            case 'sm': return { h: '28px', iconW: '20.5px' }; // 28 * (80/109)
            case 'lg': return { h: '48px', iconW: '35.2px' }; // 48 * (80/109)
            case 'md':
            default: return { h: '36px', iconW: '26.4px' }; // 36 * (80/109)
        }
    }, [size]);

    // Determine target mode (handle auto)
    const activeMode = useMemo(() => {
        if (mode !== 'auto') return mode;
        return (theme === 'dark' || theme === 'system') ? 'dark' : 'light';
    }, [mode, theme]);

    // Color Logic based on Variants and Monochrome overrides
    const colors = useMemo(() => {
        if (monochrome === 'white') {
            return { icon: "#FFFFFF", bookmy: "#FFFFFF", bike: "#FFFFFF" };
        }
        if (monochrome === 'black') {
            return { icon: "#000000", bookmy: "#000000", bike: "#000000" };
        }

        // Standard Themed Variants
        if (activeMode === 'dark') {
            return {
                icon: BRAND_BLUE,
                bookmy: "#FFFFFF",
                bike: BRAND_BLUE
            };
        }

        // Default Light Mode
        return {
            icon: BRAND_BLUE,
            bookmy: "#000000",
            bike: BRAND_BLUE
        };
    }, [activeMode, monochrome]);

    const renderIcon = () => (
        <svg
            viewBox="0 0 80 109"
            fill="none"
            style={{ height: heights.h, width: heights.iconW }}
            className={`${iconClassName} transition-transform group-hover:scale-105 duration-500 shrink-0`}
        >
            {ICON_PATHS.PRIMARY.map((d, i) => (
                <path key={i} d={d} fill={colors.icon} />
            ))}
        </svg>
    );

    const renderWordmark = () => (
        <svg
            viewBox="0 0 205 32"
            fill="none"
            style={{ height: heights.h }}
            className="w-auto shrink-0"
        >
            {/* bookmy text */}
            {TEXT_PATHS.BOOKMY.map((d, i) => (
                <path key={i} d={d} fill={colors.bookmy} />
            ))}
            {/* .bike text */}
            {TEXT_PATHS.BIKE.map((d, i) => (
                <path key={i} d={d} fill={colors.bike} />
            ))}
        </svg>
    );

    return (
        <div className={`flex items-center gap-3 group transition-all duration-300 ${className}`}>
            {(variant === 'full' || variant === 'icon') && renderIcon()}
            {(variant === 'full' || variant === 'wordmark') && renderWordmark()}
        </div>
    );
};
