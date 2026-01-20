'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Command, ArrowRight } from 'lucide-react';
import { getSidebarConfig } from '@/config/sidebarConfig';
import { useTenant } from '@/lib/tenant/tenantContext';
// import { usePermission } from '@/hooks/usePermission'; // Permissions temporarily disabled for sidebar items
// import { useSubscription } from '@/hooks/useSubscription'; // Subscription temporarily disabled for sidebar items

interface CommandPaletteProps {
    role: string;
}

export default function CommandPalette({ role }: CommandPaletteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const { tenantType } = useTenant();

    // const { can } = usePermission();

    // 1. Flatten all navigable items (Pages) based on Tenant
    const allCommands = useMemo(() => {
        if (!tenantType) return [];
        const sidebarSections = getSidebarConfig(tenantType);

        const commands: {
            type: 'page' | 'action';
            name: string;
            path?: string;
            section: string;
            action?: () => void;
        }[] = [];

        sidebarSections.forEach((section) => {
            section.items.forEach(item => {
                // In strict tenant mode, if it's in the config, it's visible.
                // Role checks happen at page level.
                commands.push({
                    type: 'page',
                    name: item.title,
                    path: item.href,
                    section: section.group,
                });
            });
        });

        // Add Actions (Example generic actions)
        // In real app, these would be conditional on role/tenant too
        if (tenantType === 'DEALER') {
            commands.push({ type: 'action', name: 'Create New Lead', section: 'Actions', action: () => router.push('/leads?action=new') });
        }

        return commands;
    }, [tenantType, router]);

    // Filter commands based on query
    const filteredCommands = useMemo(() => {
        if (!query) return allCommands;
        return allCommands.filter(cmd =>
            cmd.name.toLowerCase().includes(query.toLowerCase()) ||
            cmd.section.toLowerCase().includes(query.toLowerCase())
        );
    }, [query, allCommands]);

    // Handle Keyboard Shortcuts (Global)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Toggle Palette: Cmd+K or Ctrl+K
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }

            // Alt + 1-9 Navigation
            if (e.altKey && !isNaN(parseInt(e.key))) {
                if (!tenantType) return;
                const num = parseInt(e.key);
                if (num >= 1 && num <= 9) {
                    const sidebarSections = getSidebarConfig(tenantType);
                    const sectionIndex = num - 1;
                    const section = sidebarSections[sectionIndex];

                    if (section && section.items.length > 0) {
                        const firstItem = section.items[0];
                        e.preventDefault();
                        router.push(firstItem.href);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router, tenantType]);

    // Handle Palette Navigation
    useEffect(() => {
        const handlePaletteNav = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selected = filteredCommands[selectedIndex];
                if (selected) {
                    executeCommand(selected);
                }
            } else if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handlePaletteNav);
        return () => window.removeEventListener('keydown', handlePaletteNav);
    }, [isOpen, selectedIndex, filteredCommands]);

    // Reset selection on query change
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const executeCommand = (cmd: typeof allCommands[0]) => {
        if (cmd.type === 'page' && cmd.path) {
            router.push(cmd.path);
        } else if (cmd.type === 'action' && cmd.action) {
            cmd.action();
        }
        setIsOpen(false);
        setQuery('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm transition-all">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Input */}
                <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-white/10">
                    <Search className="w-5 h-5 text-gray-400 dark:text-slate-500 mr-3" />
                    <input
                        type="text"
                        className="flex-1 text-lg bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500 text-gray-900 dark:text-white"
                        placeholder="Search commands or pages..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    <div className="flex items-center gap-1">
                        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-white/5 rounded border border-gray-200 dark:border-white/10">
                            <span className="text-sm">⎋</span> Esc
                        </kbd>
                    </div>
                </div>

                {/* List */}
                <div className="max-h-[60vh] overflow-y-auto py-2">
                    {filteredCommands.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500 dark:text-slate-400 text-sm">
                            No results found.
                        </div>
                    ) : (
                        <>
                            {filteredCommands.map((cmd, index) => (
                                <button
                                    key={`${cmd.section}-${cmd.name}`}
                                    onClick={() => executeCommand(cmd)}
                                    className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors
                            ${index === selectedIndex ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-900 dark:text-blue-300' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5'}
                        `}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <div className="flex items-center gap-3">
                                        {cmd.type === 'action' ? (
                                            <Command className={`w-4 h-4 ${index === selectedIndex ? 'text-blue-600' : 'text-gray-400'}`} />
                                        ) : (
                                            <ArrowRight className={`w-4 h-4 ${index === selectedIndex ? 'text-blue-600' : 'text-gray-400'}`} />
                                        )}
                                        <span className="font-medium">{cmd.name}</span>
                                    </div>
                                    <span className={`text-xs ${index === selectedIndex ? 'text-blue-500' : 'text-gray-400'}`}>
                                        {cmd.section}
                                    </span>
                                </button>
                            ))}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex gap-2">
                        <span>Navigate: <kbd className="font-sans">↑↓</kbd></span>
                        <span>Select: <kbd className="font-sans">↵</kbd></span>
                    </div>
                    <div>
                        <span className="mr-2">Pages: <kbd className="font-sans">Alt + 1-9</kbd></span>
                    </div>
                </div>
            </div>
        </div>
    );
}
