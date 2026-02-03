import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Plus, ShieldCheck, Trash2, Wrench } from 'lucide-react';

interface AttributeInputProps {
    attr: {
        key: string;
        label: string;
        type: 'text' | 'number' | 'select' | 'lookup' | 'service_schedule' | 'warranty';
        options?: string[]; // For 'select'
        suffix?: string;
        lookup_table?: string; // For 'lookup'
        lookup_key?: string; // Column to use as value (key), default 'name' or 'code'
        lookup_label?: string; // Column to use as label, default 'name'
    };
    value: any;
    onChange: (value: any) => void;
    placeholder?: string;
    className?: string; // Base class for input
}

export default function AttributeInput({ attr, value, onChange, placeholder, className }: AttributeInputProps) {
    const [lookupOptions, setLookupOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (attr.type === 'lookup' && attr.lookup_table) {
            const fetchOptions = async () => {
                setLoading(true);
                const supabase = createClient();
                const labelCol = attr.lookup_label || 'name';
                const keyCol = attr.lookup_key || labelCol; // Default to label if key not specified? Or 'id'? Usually we store text value in specs.

                try {
                    const { data, error } = await supabase
                        .from(attr.lookup_table!)
                        .select(`${keyCol}, ${labelCol}`)
                        .limit(100); // Safety limit

                    if (data) {
                        setLookupOptions(data.map((item: any) => ({
                            value: item[keyCol],
                            label: item[labelCol]
                        })));
                    }
                } catch (err) {
                    console.error('Failed to fetch lookup options', err);
                } finally {
                    setLoading(false);
                }
            };
            fetchOptions();
        }
    }, [attr.type, attr.lookup_table, attr.lookup_key, attr.lookup_label]);

    const baseClass = className || "bg-transparent font-bold text-lg outline-none w-full border-b border-transparent focus:border-indigo-500 py-1";

    if (attr.type === 'select') {
        return (
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className={baseClass}
            >
                <option value="">Select...</option>
                {attr.options?.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        );
    }

    if (attr.type === 'lookup') {
        return (
            <div className="relative w-full">
                <select
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={baseClass}
                    disabled={loading}
                >
                    <option value="">{loading ? 'Loading...' : 'Select...'}</option>
                    {lookupOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                {loading && <div className="absolute right-0 top-1/2 -translate-y-1/2"><Loader2 size={14} className="animate-spin text-indigo-500" /></div>}
            </div>
        );
    }

    if (attr.type === 'service_schedule' || attr.type === 'warranty') {
        const items = Array.isArray(value) ? value : [];
        const isWarranty = attr.type === 'warranty';

        const updateItem = (idx: number, updates: any) => {
            const newItems = [...items];
            newItems[idx] = { ...newItems[idx], ...updates };
            onChange(newItems);
        };

        const addItem = () => {
            onChange([...items, {
                label: isWarranty ? `Component ${items.length + 1}` : `Service ${items.length + 1}`,
                km: 0,
                days: 0
            }]);
        };

        const removeItem = (idx: number) => {
            onChange(items.filter((_: any, i: number) => i !== idx));
        };

        return (
            <div className="w-full space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {isWarranty ? <ShieldCheck size={14} className="text-emerald-500" /> : <Wrench size={14} className="text-indigo-500" />}
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {isWarranty ? 'Warranty Scheme' : 'Service Schedule'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={addItem}
                        className={`p-1.5 hover:bg-opacity-10 rounded-lg transition-colors ${isWarranty ? 'hover:bg-emerald-500 text-emerald-500' : 'hover:bg-indigo-500 text-indigo-500'}`}
                        title={isWarranty ? "Add Warranty Item" : "Add Service"}
                    >
                        <Plus size={16} />
                    </button>
                </div>

                <div className="space-y-2">
                    {items.map((it: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5 group">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={it.label || ''}
                                    placeholder={isWarranty ? "Component Name" : "Service Name"}
                                    onChange={(e) => updateItem(idx, { label: e.target.value })}
                                    className={`w-full bg-transparent text-xs font-black uppercase outline-none transition-colors ${isWarranty ? 'focus:text-emerald-500' : 'focus:text-indigo-500'}`}
                                />
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-[8px] font-bold text-slate-400 uppercase">Limit KM</label>
                                    <input
                                        type="number"
                                        value={it.km || 0}
                                        onChange={(e) => updateItem(idx, { km: parseInt(e.target.value) || 0 })}
                                        className="w-16 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded text-[10px] font-bold outline-none focus:ring-1 focus:ring-opacity-50"
                                        style={{ '--tw-ring-color': isWarranty ? '#10b981' : '#6366f1' } as any}
                                    />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-[8px] font-bold text-slate-400 uppercase">Limit Days</label>
                                    <input
                                        type="number"
                                        value={it.days || 0}
                                        onChange={(e) => updateItem(idx, { days: parseInt(e.target.value) || 0 })}
                                        className="w-16 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded text-[10px] font-bold outline-none focus:ring-1 focus:ring-opacity-50"
                                        style={{ '--tw-ring-color': isWarranty ? '#10b981' : '#6366f1' } as any}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeItem(idx)}
                                    className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {items.length === 0 && (
                        <div className="text-center py-4 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-xl">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                {isWarranty ? 'No warranty items' : 'No services defined'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Default to Input (Text/Number)
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        if (attr.type === 'number') {
            // Parse as number, but allow empty string for clearing
            const numValue = rawValue === '' ? '' : Number(rawValue);
            onChange(numValue);
        } else {
            onChange(rawValue);
        }
    };

    // For numbers, handle 0 correctly (don't show empty)
    const displayValue = attr.type === 'number'
        ? (value === '' || value === null || value === undefined ? '' : value)
        : (value || '');

    return (
        <input
            type={attr.type === 'number' ? 'number' : 'text'}
            value={displayValue}
            onChange={handleChange}
            className={baseClass}
            placeholder={placeholder || (attr.type === 'number' ? '0' : '...')}
        />
    );
}
