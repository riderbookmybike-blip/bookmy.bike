import React, { useMemo } from 'react';
import { ICON_PATHS, TAGLINE_PATHS, BRAND_BLUE } from './paths';
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
        let h: number;
        if (typeof size === 'number') {
            h = size;
        } else {
            switch (size) {
                case 'sm': h = 28; break;
                case 'lg': h = 48; break;
                case 'md':
                default: h = 36; break;
            }
        }

        return {
            iconH: `${h * 1.1}px`, // Enlarge icon slightly (Mamuli sa bada)
            iconW: `${(h * 1.1) * (80 / 109)}px`,
            textH: `${h * 0.9}px` // Text at 90% of base h for better presence than 86%
        };
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
            style={{ height: heights.iconH, width: heights.iconW }}
            className={`${iconClassName} transition-transform group-hover:scale-105 duration-500 shrink-0`}
        >
            {ICON_PATHS.PRIMARY.map((d, i) => (
                <path key={i} d={d} fill={colors.icon} />
            ))}
        </svg>
    );

    const renderWordmark = () => (
        <div
            style={{ height: heights.textH, fontSize: heights.textH, lineHeight: 1 }}
            className="flex items-center font-sans font-bold tracking-[-0.03em] shrink-0 transition-all duration-300"
        >
            <span style={{ color: colors.bookmy }}>bookmy</span>
            <span style={{ color: colors.bike }}>.bike</span>
        </div>
    );

    return (
        <div className={`flex items-center gap-2 group transition-all duration-300 ${className}`}>
            {(variant === 'full' || variant === 'icon') && renderIcon()}
            {(variant === 'full' || variant === 'wordmark') && renderWordmark()}
        </div>
    );
};


