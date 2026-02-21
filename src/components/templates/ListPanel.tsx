'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Trash2, CheckSquare, Square, Package, Copy, Settings2, Edit } from 'lucide-react';
import { useSearch } from '@/lib/context/SearchContext';

interface ColumnDef {
    key: string;
    header: string;
    width?: string;
    type?: 'text' | 'badge' | 'amount' | 'id' | 'rich' | 'image';
    align?: 'left' | 'right' | 'center';
    icon?: any; // For 'rich' type
    subtitle?: (item: any) => string; // For 'rich' type
    render?: (item: any, index: number) => React.ReactNode; // Custom rendering
    className?: string;
}

interface ListPanelProps {
    title: React.ReactNode;
    columns: ColumnDef[];
    data?: any[];
    actionLabel?: string;
    onActionClick?: () => void;
    selectedId?: string | number | null;
    isLoading?: boolean;
    // Route-based navigation
    basePath?: string;
    // Legacy callback (deprecated)
    onItemClick?: (item: any) => void;

    // Selection & Bulk Actions
    checkedIds?: any[];
    onCheckChange?: (ids: any[]) => void;
    onBulkDelete?: (ids: any[]) => void;

    // Studio Additions
    metrics?: React.ReactNode;
    showIndex?: boolean;
    showSelection?: boolean;
    tight?: boolean;
    onQuickAction?: (action: string, item: any) => void;
    onMetricClick?: (metricId: string) => void;

    // Search Support
    searchQuery?: string;
    onSearchChange?: (val: string) => void;
    searchPlaceholder?: string;

    // Header Actions Area
    headerActions?: React.ReactNode;
    actionVariant?: 'default' | 'subtle';
    actionIcon?: any;
}

export default function ListPanel({
    title,
    columns,
    data,
    actionLabel = 'New',
    onActionClick,
    selectedId,
    isLoading = false,
    basePath,
    onItemClick,
    checkedIds = [],
    onCheckChange,
    onBulkDelete,
    metrics,
    showIndex = true,
    showSelection = false,
    tight = false,
    onQuickAction,
    onMetricClick,
    searchQuery,
    onSearchChange,
    searchPlaceholder = 'Search...',
    headerActions,
    actionVariant = 'default',
    actionIcon,
}: ListPanelProps) {
    const router = useRouter();
    const { searchQuery: globalSearchQuery } = useSearch();

    // Local Search or Global Search
    const effectiveSearch = searchQuery !== undefined ? searchQuery : globalSearchQuery;

    const filteredData = React.useMemo(() => {
        if (!data) return null;
        if (!effectiveSearch) return data;
        const q = effectiveSearch.toLowerCase();
        return data.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(q)));
    }, [data, effectiveSearch]);

    const hasData = filteredData && filteredData.length > 0;
    const showPlaceholders = !data && !isLoading;

    const displayRows = hasData
        ? filteredData
        : showPlaceholders
          ? Array.from({ length: 10 }).map((_, i) => ({
                id: i,
                col1: `Item Name ${i + 1}`,
                col2: `Secondary Detail ${i + 1}`,
                status: i % 3 === 0 ? 'Active' : i % 3 === 1 ? 'Pending' : 'Draft',
                amount: (i + 1) * 1000,
            }))
          : [];

    const isIdColumn = (key: string) => /id|sku|vin|ref|code|chassis|invoice|receipt/i.test(key);

    const getBadgeClass = (status: string) => {
        const s = status?.toLowerCase();
        if (['active', 'issued', 'delivered', 'completed', 'paid', 'confirmed'].includes(s)) {
            return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
        }
        if (['pending', 'processing', 'in_progress', 'awaiting', 'new', 'contacted', 'qualified'].includes(s)) {
            return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
        }
        if (['cancelled', 'rejected', 'failed', 'overdue', 'lost', 'void'].includes(s)) {
            return 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30';
        }
        if (['mbo'].includes(s)) {
            return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
        }
        if (['mbd'].includes(s)) {
            return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/30';
        }
        if (['mbf'].includes(s)) {
            return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
        }
        if (['listed'].includes(s)) {
            return 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border-sky-100 dark:border-sky-900/30';
        }
        if (['unlisted'].includes(s)) {
            return 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-500 border-slate-100 dark:border-slate-700';
        }
        return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700';
    };

    const getDotColor = (s: string) => {
        const status = s?.toLowerCase();
        if (['active', 'issued', 'delivered', 'completed'].includes(status)) return 'bg-emerald-500';
        if (['listed'].includes(status)) return 'bg-sky-500';
        if (['mbo'].includes(status)) return 'bg-blue-500';
        if (['mbd'].includes(status)) return 'bg-purple-500';
        if (['mbf'].includes(status)) return 'bg-amber-500';
        return null; // No dot for unlisted/others
    };

    const handleRowClick = (item: any) => {
        // Route-based navigation (preferred)
        if (basePath) {
            router.push(`${basePath}/${item.id}`);
            return;
        }
        // Legacy callback fallback
        if (onItemClick) {
            onItemClick(item);
        }
    };

    // Selection Handlers
    const handleCheckAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!onCheckChange || !displayRows) return;
        if (e.target.checked) {
            const allIds = displayRows.map(r => r.id);
            onCheckChange(allIds);
        } else {
            onCheckChange([]);
        }
    };

    const handleCheckRow = (id: any, checked: boolean) => {
        if (!onCheckChange) return;
        if (checked) {
            onCheckChange([...checkedIds, id]);
        } else {
            onCheckChange(checkedIds.filter(cid => cid !== id));
        }
    };

    const isAllChecked = displayRows && displayRows.length > 0 && displayRows.every(r => checkedIds.includes(r.id));
    const isIndeterminate = displayRows && displayRows.length > 0 && checkedIds.length > 0 && !isAllChecked;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900/40 backdrop-blur-xl relative z-10 transition-colors duration-500">
            {/* Top Bar */}
            <div className="p-8 space-y-6 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none mb-1 uppercase">
                            {checkedIds.length > 0 ? `${checkedIds.length} SELECTED` : title}
                        </h2>
                        <div className="h-1 w-8 bg-indigo-500 rounded-full opacity-40" />
                    </div>

                    <div className="flex items-center gap-2">
                        {headerActions && (
                            <div className="flex items-center gap-1 border-r border-slate-200 dark:border-white/10 pr-2 mr-2">
                                {headerActions}
                            </div>
                        )}

                        {checkedIds.length > 0 && onBulkDelete ? (
                            <button
                                onClick={() => onBulkDelete(checkedIds)}
                                className="px-5 py-2.5 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-500/20 transition-all flex items-center gap-2"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        ) : (
                            onActionClick && (
                                <button
                                    onClick={onActionClick}
                                    className={
                                        actionVariant === 'subtle'
                                            ? 'flex items-center gap-2 px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20'
                                            : 'px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 border border-white/10 shadow-lg shadow-indigo-500/10'
                                    }
                                >
                                    {actionIcon && React.createElement(actionIcon, { size: 14 })}
                                    {actionLabel}
                                </button>
                            )
                        )}

                        <button className="p-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 group/filter">
                            <Filter
                                size={16}
                                strokeWidth={2.5}
                                className="group-hover/filter:scale-110 transition-transform"
                            />
                        </button>
                    </div>
                </div>

                {/* Quick Search */}
                {onSearchChange && (
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search
                                size={16}
                                className={`${searchQuery ? 'text-indigo-500' : 'text-slate-400 animate-pulse'} transition-colors`}
                            />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => onSearchChange(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full pl-11 pr-4 py-3 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-[12px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
                        />
                    </div>
                )}
            </div>

            {/* Table Container with Studio Rounding */}
            <div
                className={`flex-1 mx-6 mb-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-[32px] shadow-sm flex flex-col overflow-hidden relative`}
            >
                <div className="overflow-x-auto flex-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                    <table
                        className={`${tight ? 'w-fit' : 'w-full'} text-left text-sm border-separate border-spacing-0 min-w-full relative`}
                    >
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200/80 dark:border-white/10 sticky top-0 z-20">
                            <tr>
                                {showIndex && (
                                    <th className="p-4 w-12 border-b border-slate-200 dark:border-white/10 pl-6 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
                                        #
                                    </th>
                                )}
                                {showSelection && (
                                    <th className="p-4 w-12 border-b border-slate-200 dark:border-white/10">
                                        <input
                                            type="checkbox"
                                            checked={isAllChecked}
                                            ref={input => {
                                                if (input) input.indeterminate = !!isIndeterminate;
                                            }}
                                            onChange={handleCheckAll}
                                            className="w-4 h-4 rounded-lg border-slate-300 dark:border-white/20 dark:bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                                        />
                                    </th>
                                )}
                                {columns.map(col => (
                                    <th
                                        key={col.key}
                                        className={`p-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200 dark:border-white/10 ${
                                            col.align === 'right' ? 'text-right' : ''
                                        } ${col.className || ''}`}
                                        style={{ width: col.width }}
                                    >
                                        {col.header}
                                    </th>
                                ))}
                                {onQuickAction && (
                                    <th className="p-4 border-b border-slate-200 dark:border-white/10 text-right pr-6 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] w-24">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {isLoading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={`skeleton-${i}`} className="animate-pulse">
                                        <td className="p-4">
                                            <div className="h-4 w-4 bg-slate-100 dark:bg-white/5 rounded-lg" />
                                        </td>
                                        {columns.map((col, idx) => (
                                            <td key={idx} className="p-4">
                                                <div className="h-4 bg-slate-100 dark:bg-white/5 rounded-lg w-3/4" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : displayRows.length > 0 ? (
                                displayRows.map((item, rowIdx) => (
                                    <tr
                                        key={item.id}
                                        onClick={() => handleRowClick(item)}
                                        className={`
                                        group hover:bg-indigo-600/[0.03] dark:hover:bg-indigo-400/[0.03]
                                        transition-all duration-300 cursor-pointer border-b border-slate-100 dark:border-white/5
                                        last:border-none relative hover:z-10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]
                                        dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]
                                        ${selectedId === item.id ? 'bg-indigo-600/5 dark:bg-indigo-500/5' : ''}
                                    `}
                                    >
                                        {showIndex && (
                                            <td className="p-4 pl-6 text-[10px] font-mono font-bold text-slate-500 group-hover:text-indigo-500 transition-colors">
                                                {(rowIdx + 1).toString().padStart(2, '0')}
                                            </td>
                                        )}
                                        {showSelection && (
                                            <td className="p-4 relative">
                                                {/* Selection indicator bar */}
                                                {selectedId === item.id && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 shadow-[2px_0_10px_rgba(79,70,229,0.5)] z-10" />
                                                )}
                                                <div
                                                    className="p-1 -m-1 cursor-pointer"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checkedIds.includes(item.id)}
                                                        onChange={e => handleCheckRow(item.id, e.target.checked)}
                                                        className="w-4 h-4 rounded-lg border-slate-300 dark:border-white/20 dark:bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                </div>
                                            </td>
                                        )}
                                        {columns.map(col => (
                                            <td
                                                key={col.key}
                                                className={`p-4 text-xs font-bold ${
                                                    col.align === 'right' ? 'text-right' : ''
                                                } ${
                                                    isIdColumn(col.key) || col.type === 'id'
                                                        ? 'font-mono text-[10px] text-indigo-600 dark:text-indigo-400 opacity-80'
                                                        : 'text-slate-700 dark:text-slate-300'
                                                } ${col.className || ''}`}
                                            >
                                                {col.render ? (
                                                    col.render(item, rowIdx)
                                                ) : col.type === 'rich' ? (
                                                    <div className="flex items-center gap-3">
                                                        {col.icon && (
                                                            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center p-1.5 shadow-sm border border-slate-100 dark:border-white/10 transition-transform group-hover:scale-110">
                                                                {React.createElement(col.icon, {
                                                                    size: 16,
                                                                    className: 'text-slate-700 dark:text-slate-300',
                                                                })}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-black text-[12px] text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors uppercase tracking-tight italic">
                                                                {item[col.key]}
                                                            </div>
                                                            {col.subtitle && (
                                                                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-60">
                                                                    {col.subtitle(item)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : col.type === 'id' ? (
                                                    <div className="flex items-center gap-2 group/id">
                                                        <span className="font-mono text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover/id:text-indigo-500 transition-colors">
                                                            {item[col.key]}
                                                        </span>
                                                        <button
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                navigator.clipboard.writeText(item[col.key]);
                                                            }}
                                                            className="opacity-0 group-hover/id:opacity-100 p-1 hover:bg-indigo-50 dark:hover:bg-white/10 rounded-md transition-all"
                                                            title="Copy ID"
                                                        >
                                                            <Copy size={10} className="text-indigo-400" />
                                                        </button>
                                                    </div>
                                                ) : col.type === 'badge' || col.key === 'status' ? (
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getBadgeClass(item[col.key] || item.status)} shadow-sm`}
                                                    >
                                                        {getDotColor(item[col.key]) && (
                                                            <span className="flex h-1.5 w-1.5 mr-1.5 relative">
                                                                <span
                                                                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getDotColor(item[col.key])}`}
                                                                ></span>
                                                                <span
                                                                    className={`relative inline-flex rounded-full h-1.5 w-1.5 ${getDotColor(item[col.key])}`}
                                                                ></span>
                                                            </span>
                                                        )}
                                                        {item[col.key] || item.status}
                                                    </span>
                                                ) : col.type === 'image' ? (
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 overflow-hidden flex items-center justify-center p-1 group-hover:scale-110 transition-transform">
                                                        {item[col.key] ? (
                                                            <img
                                                                src={item[col.key]}
                                                                alt=""
                                                                className="w-full h-full object-contain"
                                                            />
                                                        ) : (
                                                            <Package size={16} className="text-slate-300" />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <>
                                                        {item[col.key]}
                                                        {col.subtitle && (
                                                            <div className="mt-0.5">{col.subtitle(item)}</div>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                        ))}
                                        {onQuickAction && (
                                            <td className="p-4 text-right pr-6 whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            onQuickAction('edit', item);
                                                        }}
                                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Settings2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            onQuickAction('delete', item);
                                                        }}
                                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + 1} className="p-16 text-center">
                                        <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                                            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-2xl shadow-indigo-100 dark:shadow-none border border-indigo-100 dark:border-indigo-500/20">
                                                <Search size={32} className="text-indigo-600" strokeWidth={2.5} />
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 italic tracking-tighter uppercase">
                                                No records found
                                            </h3>
                                            <p className="text-xs text-slate-500 font-bold max-w-[200px] leading-relaxed uppercase tracking-wider opacity-60">
                                                System search returned zero matches for your criteria.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
