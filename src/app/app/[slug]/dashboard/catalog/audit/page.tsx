'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Clock,
    Plus,
    Pencil,
    Trash2,
    Filter,
    ChevronDown,
    ChevronRight,
    Search,
    RefreshCw,
    Database,
    FileText,
    ChevronLeft,
} from 'lucide-react';
import { fetchAuditLogs, AuditLogEntry, AuditLogFilters } from './actions';

// ------- Human-readable field labels -------
const FIELD_LABELS: Record<string, string> = {
    ex_showroom_price: 'Ex-Showroom',
    price_base: 'Base Price',
    publish_stage: 'Publish Stage',
    is_active: 'Active',
    status: 'Status',
    rto_total: 'RTO Total',
    insurance_total: 'Insurance Total',
    on_road_price: 'On-Road Price',
    state_code: 'State',
    district: 'District',
    name: 'Name',
    type: 'Type',
    category: 'Category',
    engine_cc: 'Engine CC',
    fuel_capacity: 'Fuel Capacity',
    mileage: 'Mileage',
    hex_primary: 'Primary Color',
    image_url: 'Image URL',
    updated_at: 'Updated At',
    created_at: 'Created At',
    published_at: 'Published At',
    published_by: 'Published By',
};

const ACTION_CONFIG: Record<
    string,
    { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }
> = {
    INSERT: {
        label: 'Created',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        icon: Plus,
    },
    UPDATE: {
        label: 'Updated',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-200 dark:border-amber-800',
        icon: Pencil,
    },
    DELETE: {
        label: 'Deleted',
        color: 'text-rose-600',
        bgColor: 'bg-rose-50 dark:bg-rose-900/20',
        borderColor: 'border-rose-200 dark:border-rose-800',
        icon: Trash2,
    },
};

const TABLE_LABELS: Record<string, string> = {
    cat_items: 'Catalog Item',
    cat_price_state: 'Price State',
};

function formatValue(val: any): string {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'object') return JSON.stringify(val).substring(0, 80) + '…';
    return String(val);
}

function formatTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatFullTime(iso: string): string {
    return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

// ------- Change Diff Component -------
function ChangeDiff({ entry }: { entry: AuditLogEntry }) {
    if (entry.action === 'INSERT') {
        const fields = entry.new_data
            ? Object.entries(entry.new_data)
                  .filter(([k]) => !['id', 'created_at', 'updated_at'].includes(k))
                  .slice(0, 12)
            : [];
        return (
            <div className="mt-3 space-y-1">
                <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2">New Record</div>
                {fields.map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 text-[10px]">
                        <span className="text-slate-400 font-semibold w-32 truncate">{FIELD_LABELS[k] || k}</span>
                        <span className="text-emerald-600 font-bold">{formatValue(v)}</span>
                    </div>
                ))}
            </div>
        );
    }

    if (entry.action === 'DELETE') {
        const fields = entry.old_data
            ? Object.entries(entry.old_data)
                  .filter(([k]) => !['id', 'created_at', 'updated_at'].includes(k))
                  .slice(0, 12)
            : [];
        return (
            <div className="mt-3 space-y-1">
                <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2">Deleted Record</div>
                {fields.map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 text-[10px]">
                        <span className="text-slate-400 font-semibold w-32 truncate">{FIELD_LABELS[k] || k}</span>
                        <span className="text-rose-600 font-bold line-through">{formatValue(v)}</span>
                    </div>
                ))}
            </div>
        );
    }

    // UPDATE — show changed fields with old → new
    const changedFields = entry.changed_fields || [];
    const importantChanges = changedFields.filter(f => f !== 'updated_at');
    if (importantChanges.length === 0 && changedFields.includes('updated_at')) {
        return <div className="mt-2 text-[10px] text-slate-400 italic">Only timestamp updated</div>;
    }

    return (
        <div className="mt-3 space-y-1.5">
            <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">Changes</div>
            {changedFields.map(field => {
                const oldVal = entry.old_data?.[field];
                const newVal = entry.new_data?.[field];
                return (
                    <div key={field} className="flex items-start gap-2 text-[10px]">
                        <span className="text-slate-400 font-semibold w-32 truncate flex-shrink-0">
                            {FIELD_LABELS[field] || field}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded font-mono text-[9px]">
                                {formatValue(oldVal)}
                            </span>
                            <ChevronRight size={10} className="text-slate-300" />
                            <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded font-mono text-[9px]">
                                {formatValue(newVal)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ------- Main Page -------
export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filters, setFilters] = useState<AuditLogFilters>({
        tableName: 'ALL',
        action: 'ALL',
        search: '',
        page: 1,
        limit: 50,
    });

    const loadLogs = useCallback(async () => {
        setLoading(true);
        const result = await fetchAuditLogs(filters);
        setLogs(result.logs);
        setTotal(result.total);
        setLoading(false);
    }, [filters]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const totalPages = Math.ceil(total / (filters.limit || 50));

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-slate-950 animate-in fade-in duration-500">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <Clock size={20} className="text-emerald-600" />
                            Catalog Audit Trail
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Every change to catalog items and pricing — tracked automatically
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {total.toLocaleString()} events
                        </span>
                        <button
                            onClick={loadLogs}
                            disabled={loading}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 transition-all"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="px-6 pb-3 flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative w-[200px]">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 z-10" />
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={filters.search || ''}
                        onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                        className="w-full pl-7 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                    />
                </div>

                {/* Table Filter */}
                <div className="relative">
                    <select
                        value={filters.tableName || 'ALL'}
                        onChange={e => setFilters(f => ({ ...f, tableName: e.target.value, page: 1 }))}
                        className="appearance-none pl-3 pr-7 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide focus:border-emerald-500 outline-none transition-all cursor-pointer"
                    >
                        <option value="ALL">All Tables</option>
                        <option value="cat_items">Catalog Items</option>
                        <option value="cat_price_state">Price State</option>
                    </select>
                    <ChevronDown
                        size={10}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                </div>

                {/* Action Filter */}
                <div className="relative">
                    <select
                        value={filters.action || 'ALL'}
                        onChange={e => setFilters(f => ({ ...f, action: e.target.value, page: 1 }))}
                        className="appearance-none pl-3 pr-7 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide focus:border-emerald-500 outline-none transition-all cursor-pointer"
                    >
                        <option value="ALL">All Actions</option>
                        <option value="INSERT">Created</option>
                        <option value="UPDATE">Updated</option>
                        <option value="DELETE">Deleted</option>
                    </select>
                    <ChevronDown
                        size={10}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                </div>

                {/* Active Filter Chips */}
                {filters.tableName && filters.tableName !== 'ALL' && (
                    <button
                        onClick={() => setFilters(f => ({ ...f, tableName: 'ALL', page: 1 }))}
                        className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg text-[9px] font-black uppercase tracking-wider text-emerald-600 hover:bg-emerald-100 transition-all"
                    >
                        {TABLE_LABELS[filters.tableName]} ✕
                    </button>
                )}
                {filters.action && filters.action !== 'ALL' && (
                    <button
                        onClick={() => setFilters(f => ({ ...f, action: 'ALL', page: 1 }))}
                        className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg text-[9px] font-black uppercase tracking-wider text-amber-600 hover:bg-amber-100 transition-all"
                    >
                        {ACTION_CONFIG[filters.action]?.label} ✕
                    </button>
                )}
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-auto px-6 pb-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <RefreshCw size={20} className="animate-spin text-emerald-600" />
                            <span className="ml-2 text-sm text-slate-500 font-semibold">Loading audit trail...</span>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Database size={32} className="mb-2 opacity-30" />
                            <span className="text-sm font-semibold">No audit events found</span>
                            <span className="text-xs mt-1">Changes to catalog items and prices will appear here</span>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {logs.map(log => {
                                const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE;
                                const Icon = config.icon;
                                const isExpanded = expandedId === log.id;

                                return (
                                    <div
                                        key={log.id}
                                        className={`group transition-all ${isExpanded ? 'bg-slate-50/50 dark:bg-slate-800/30' : 'hover:bg-slate-50/30 dark:hover:bg-slate-800/10'}`}
                                    >
                                        {/* Row */}
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                            className="w-full px-4 py-3 flex items-center gap-3 text-left"
                                        >
                                            {/* Action Icon */}
                                            <div
                                                className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${config.bgColor} border ${config.borderColor}`}
                                            >
                                                <Icon size={12} className={config.color} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}
                                                    >
                                                        {config.label}
                                                    </span>
                                                    <span className="text-[9px] font-semibold text-slate-400 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                                                        {TABLE_LABELS[log.table_name] || log.table_name}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                                                    {log.record_name || log.record_id}
                                                </div>
                                                {log.action === 'UPDATE' && log.changed_fields && (
                                                    <div className="text-[9px] text-slate-400 mt-0.5">
                                                        Changed:{' '}
                                                        {log.changed_fields.map(f => FIELD_LABELS[f] || f).join(', ')}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Meta */}
                                            <div className="flex-shrink-0 text-right">
                                                <div
                                                    className="text-[10px] font-bold text-slate-500 dark:text-slate-400"
                                                    title={formatFullTime(log.created_at)}
                                                >
                                                    {formatTime(log.created_at)}
                                                </div>
                                                <div
                                                    className={`text-[9px] font-semibold mt-0.5 ${log.actor_label === 'SYSTEM/SQL' ? 'text-purple-500' : 'text-blue-500'}`}
                                                >
                                                    {log.actor_label === 'USER' ? '👤 User' : '⚙️ System'}
                                                </div>
                                            </div>

                                            {/* Expand Arrow */}
                                            <ChevronDown
                                                size={14}
                                                className={`flex-shrink-0 text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                            />
                                        </button>

                                        {/* Expanded Detail */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 pl-14 animate-in slide-in-from-top-2 duration-200">
                                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-3">
                                                    <div className="flex items-center gap-4 text-[9px] text-slate-400 mb-2">
                                                        <span>
                                                            <strong>ID:</strong> {log.record_id.substring(0, 8)}…
                                                        </span>
                                                        <span>
                                                            <strong>Table:</strong> {log.table_name}
                                                        </span>
                                                        <span>
                                                            <strong>Time:</strong> {formatFullTime(log.created_at)}
                                                        </span>
                                                        {log.actor_id && (
                                                            <span>
                                                                <strong>Actor:</strong> {log.actor_id.substring(0, 8)}…
                                                            </span>
                                                        )}
                                                    </div>
                                                    <ChangeDiff entry={log} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                            <span className="text-[10px] font-semibold text-slate-400">
                                Page {filters.page} of {totalPages} ({total} events)
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setFilters(f => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))}
                                    disabled={(filters.page || 1) <= 1}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={12} />
                                </button>
                                <button
                                    onClick={() =>
                                        setFilters(f => ({ ...f, page: Math.min(totalPages, (f.page || 1) + 1) }))
                                    }
                                    disabled={(filters.page || 1) >= totalPages}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={12} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
