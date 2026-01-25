/**
 * Display ID UI Component
 * Shows display IDs in XXX-XXX-XXX format with copy functionality
 */

import React, { useState } from 'react';
import { formatDisplayIdForUI } from '@/lib/displayId';

interface DisplayIdProps {
    id: string;
    prefix?: string;
    showCopy?: boolean;
    className?: string;
}

export function DisplayId({ id, prefix, showCopy = true, className = '' }: DisplayIdProps) {
    const [copied, setCopied] = useState(false);

    const formatted = formatDisplayIdForUI(id, prefix);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            <code className="font-mono text-sm font-semibold">
                {formatted}
            </code>

            {showCopy && (
                <button
                    onClick={handleCopy}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Copy ID"
                >
                    {copied ? (
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    )}
                </button>
            )}
        </div>
    );
}

/**
 * Usage Examples:
 * 
 * <DisplayId id="2KX4H9M7A" />
 * // Output: 2KX-4H9-M7A [copy icon]
 * 
 * <DisplayId id="2KX4H9M7A" prefix="LEAD" />
 * // Output: LEAD #2KX-4H9-M7A [copy icon]
 * 
 * <DisplayId id="2KX4H9M7A" showCopy={false} />
 * // Output: 2KX-4H9-M7A (no copy button)
 */
