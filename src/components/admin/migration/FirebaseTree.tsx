'use client';

import React, { useState } from 'react';
import {
    ChevronRight,
    ChevronDown,
    Folder,
    FileText,
    Loader2,
    CheckSquare,
    Square
} from 'lucide-react';
import { browseFirebasePath, FirebaseNode, importFirebaseCollection } from '@/actions/admin/firebase-migration';
import { toast } from 'sonner';

interface FirebaseTreeProps {
    path?: string;
    level?: number;
    onImportSuccess?: (collection: string) => void;
    onSelect?: (collection: string) => void;
}

export function FirebaseTree({ path = '', level = 0, onImportSuccess, onSelect }: FirebaseTreeProps) {
    const [nodes, setNodes] = useState<FirebaseNode[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [importingPath, setImportingPath] = useState<string | null>(null);
    // Local state to track imports done in this session, since server refresh might not be instant/granular for subcols
    const [recentlyImported, setRecentlyImported] = useState<Set<string>>(new Set());

    const loadChildren = async () => {
        setIsLoading(true);
        try {
            const children = await browseFirebasePath(path);
            setNodes(children);
            setLoaded(true);
            setIsExpanded(true);
        } catch (e: any) {
            toast.error('Failed to load path: ' + path);
        }
        setIsLoading(false);
    };

    const handleImport = async (targetPath: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setImportingPath(targetPath);
        try {
            const res = await importFirebaseCollection(targetPath);
            if (res.success) {
                toast.success(`Imported ${res.count} items.`);
                setRecentlyImported(prev => new Set(prev).add(targetPath));
                if (onImportSuccess) onImportSuccess(targetPath);
            } else {
                toast.error(res.error);
            }
        } catch (err: any) {
            toast.error(err.message);
        }
        setImportingPath(null);
    };

    // Auto-load on mount (since parent handles lazy mounting)
    React.useEffect(() => {
        if (!loaded && !isLoading) {
            loadChildren();
        }
    }, [path]);

    if (level === 0 && isLoading && !loaded) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                <Loader2 className="animate-spin mb-2" />
                <span className="text-xs font-bold uppercase tracking-widest">Loading Source...</span>
            </div>
        );
    }

    return (
        <div className={`flex flex-col ${level > 0 ? 'ml-4 border-l border-slate-200 dark:border-white/5 pl-2' : ''}`}>
            {nodes.map(node => {
                const isCollection = node.type === 'collection';
                const isImported = node.imported || recentlyImported.has(node.path);
                const isImporting = importingPath === node.path;

                return (
                    <div key={node.path} className="group/node">
                        {/* Node Row */}
                        <div className="flex items-center gap-2 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg px-2 transition-colors cursor-pointer select-none">
                            {/* Expand Logic */}
                            {node.hasChildren ? (
                                <TreeNodeExpand
                                    path={node.path}
                                    type={node.type}
                                    level={level}
                                    onImportSuccess={onImportSuccess}
                                    onSelect={onSelect}
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0" onClick={(e) => {
                                        e.stopPropagation(); // Prevent toggling expansion
                                        console.log('[FirebaseTree] Clicked:', node.id, 'Level:', level, 'IsCollection:', isCollection);

                                        // If it's a root collection or we want to allow deep selection?
                                        // For now, MigrationClient expects root_collection matching.
                                        // Let's pass the root ID if we are deep? Actually just pass the node.id if level 0.
                                        if (level === 0 && isCollection && onSelect) {
                                            console.log('[FirebaseTree] Triggering onSelect for:', node.id);
                                            onSelect(node.id);
                                        }
                                    }}>
                                        {/* Checkbox (Only for Collections) */}
                                        {isCollection && (
                                            <button
                                                onClick={(e) => handleImport(node.path, e)}
                                                disabled={isImporting || isImported}
                                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                            >
                                                {isImporting ? (
                                                    <Loader2 size={14} className="animate-spin text-brand-primary" />
                                                ) : isImported ? (
                                                    <CheckSquare size={14} className="text-emerald-500" />
                                                ) : (
                                                    <Square size={14} />
                                                )}
                                            </button>
                                        )}

                                        <NodeIcon type={node.type} />
                                        <span className={`text-xs ${isCollection ? 'font-bold text-slate-700 dark:text-slate-200' : 'font-mono text-slate-500'}`}>
                                            {node.id}
                                        </span>
                                    </div>
                                </TreeNodeExpand>
                            ) : (
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {/* Checkbox (Only for Collections) - usually leaf nodes are docs, but if leaf is collection? */}
                                    {isCollection && (
                                        <button
                                            onClick={(e) => handleImport(node.path, e)}
                                            disabled={isImporting || isImported}
                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                        >
                                            {isImporting ? (
                                                <Loader2 size={14} className="animate-spin text-brand-primary" />
                                            ) : isImported ? (
                                                <CheckSquare size={14} className="text-emerald-500" />
                                            ) : (
                                                <Square size={14} />
                                            )}
                                        </button>
                                    )}
                                    <NodeIcon type={node.type} />
                                    <span className="text-xs font-mono text-slate-500">{node.id}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    );
}

// Wrapper to handle recursion expansion state separately for each child
function TreeNodeExpand({ path, type, level, children, onImportSuccess, onSelect }: {
    path: string,
    type: 'collection' | 'document',
    level: number,
    children: React.ReactNode,
    onImportSuccess?: (path: string) => void,
    onSelect?: (collection: string) => void
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-1" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronDown size={12} className="text-slate-400 shrink-0" /> : <ChevronRight size={12} className="text-slate-400 shrink-0" />}
                {children}
            </div>

            {expanded && (
                <FirebaseTree path={path} level={level + 1} onImportSuccess={onImportSuccess} onSelect={onSelect} />
            )}
        </div>
    )
}

function NodeIcon({ type }: { type: 'collection' | 'document' }) {
    if (type === 'collection') return <Folder size={12} className="text-amber-500 fill-amber-500/20 shrink-0" />;
    return <FileText size={12} className="text-slate-400 shrink-0" />;
}
