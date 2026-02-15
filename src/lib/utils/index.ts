'use client';

/**
 * Simple className joiner (clsx-lite).
 * Filters out falsy values and joins with space.
 */
export function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}
