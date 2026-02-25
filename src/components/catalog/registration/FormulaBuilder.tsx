'use client';

import React, { useState } from 'react';
import { FormulaComponent, ComponentType, SlabRange } from '@/types/registration';
import {
    Pencil,
    Trash2,
    Check,
    ChevronDown,
    ChevronRight,
    Plus,
    GripVertical,
    Percent,
    Banknote,
    GitBranch,
    Table,
    Layers,
    Zap,
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FormulaBuilderProps {
    components: FormulaComponent[];
    onChange: (components: FormulaComponent[]) => void;
    readOnly?: boolean;
    availableTargets?: { id: string; label: string }[];
    inheritedContext?: {
        fuelType?: string;
        regType?: string;
    };
}

// Helper for Drag and Drop
const SortableComponent = ({
    component,
    onChange,
    onDelete,
    readOnly,
    availableTargets,
    inheritedContext,
}: {
    component: FormulaComponent;
    onChange: (c: FormulaComponent) => void;
    onDelete: () => void;
    readOnly: boolean;
    availableTargets: { id: string; label: string }[];
    inheritedContext?: { fuelType?: string; regType?: string };
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: component.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`touch-none ${isDragging ? 'scale-[1.02] shadow-2xl rotate-1' : 'transition-all duration-300'}`}
        >
            <FormulaBlock
                component={component}
                onChange={onChange}
                onDelete={onDelete}
                readOnly={readOnly}
                availableTargets={availableTargets}
                inheritedContext={inheritedContext}
                dragHandleProps={{ ...attributes, ...listeners }}
                isDragging={isDragging}
            />
        </div>
    );
};

export default function FormulaBuilder({
    components,
    onChange,
    readOnly = false,
    availableTargets = [],
    inheritedContext,
}: FormulaBuilderProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = components.findIndex(c => c.id === active.id);
            const newIndex = components.findIndex(c => c.id === over.id);
            onChange(arrayMove(components, oldIndex, newIndex));
        }
    };

    const handleAdd = (type: ComponentType | 'FUEL_SPLIT', basis?: 'PREVIOUS_TAX_TOTAL' | 'TARGET_COMPONENT') => {
        const newComp: FormulaComponent = {
            id: crypto.randomUUID(),
            type: type === 'FUEL_SPLIT' ? 'SWITCH' : (type as ComponentType),
            label:
                basis === 'PREVIOUS_TAX_TOTAL'
                    ? 'New Cess / Surcharge'
                    : basis === 'TARGET_COMPONENT'
                      ? 'Component Specific Charge'
                      : 'New ' + (type === 'FUEL_SPLIT' ? 'Split' : type.toLowerCase().replace('_', ' ')),
            percentage: type === 'PERCENTAGE' || type === 'FUEL_SPLIT' ? 0 : undefined,
            amount: type === 'FIXED' ? 0 : undefined,
            basis: basis || 'EX_SHOWROOM',
            conditionVariable: type === 'CONDITIONAL' ? 'REG_TYPE' : undefined,
            conditionOperator: type === 'CONDITIONAL' ? 'EQUALS' : undefined,
            thenBlock: type === 'CONDITIONAL' ? [] : undefined,
            elseBlock: type === 'CONDITIONAL' ? [] : undefined,
            switchVariable: type === 'FUEL_SPLIT' ? 'FUEL_TYPE' : undefined,
            cases:
                type === 'FUEL_SPLIT'
                    ? [
                          { id: crypto.randomUUID(), label: 'Petrol', matchValue: 'PETROL', block: [] },
                          { id: crypto.randomUUID(), label: 'Diesel', matchValue: 'DIESEL', block: [] },
                          { id: crypto.randomUUID(), label: 'EV', matchValue: 'EV', block: [] },
                          { id: crypto.randomUUID(), label: 'CNG', matchValue: 'CNG', block: [] },
                      ]
                    : undefined,
            ranges:
                type === 'SLAB'
                    ? [
                          {
                              id: crypto.randomUUID(),
                              min: 0,
                              max: null,
                              percentage: 0,
                              applicableFuels: ['PETROL', 'DIESEL', 'CNG'],
                              slabBasis: 'ENGINE_CC',
                          },
                      ]
                    : undefined,
        };
        onChange([...components, newComp]);
    };

    const handleUpdate = (updated: FormulaComponent) => {
        onChange(components.map(c => (c.id === updated.id ? updated : c)));
    };

    const handleDelete = (id: string) => {
        onChange(components.filter(c => c.id !== id));
    };

    return (
        <div className="space-y-6">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                        {components.map(comp => (
                            <SortableComponent
                                key={comp.id}
                                component={comp}
                                onChange={handleUpdate}
                                onDelete={() => handleDelete(comp.id)}
                                readOnly={readOnly}
                                availableTargets={availableTargets}
                                inheritedContext={inheritedContext}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {!readOnly && (
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                    <button
                        onClick={() => handleAdd('PERCENTAGE')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-200 dark:border-blue-500/20 shadow-sm"
                    >
                        <Percent size={12} /> Percentage
                    </button>
                    <button
                        onClick={() => handleAdd('FIXED')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-100 transition-all border border-green-200 dark:border-green-500/20 shadow-sm"
                    >
                        <Banknote size={12} /> Fixed
                    </button>
                    <button
                        onClick={() => handleAdd('SLAB')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-pink-100 transition-all border border-pink-200 dark:border-pink-500/20 shadow-sm"
                    >
                        <Table size={12} /> Slab
                    </button>
                    <button
                        onClick={() => handleAdd('CONDITIONAL')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-purple-100 transition-all border border-purple-200 dark:border-purple-500/20 shadow-sm"
                    >
                        <GitBranch size={12} /> Condition
                    </button>
                    <button
                        onClick={() => handleAdd('FUEL_SPLIT')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-teal-100 transition-all border border-teal-200 dark:border-teal-500/20 shadow-sm"
                    >
                        <Zap size={12} /> Split/Switch
                    </button>
                    <button
                        onClick={() => handleAdd('PERCENTAGE', 'PREVIOUS_TAX_TOTAL')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-100 transition-all border border-orange-200 dark:border-orange-500/20 shadow-sm"
                    >
                        <Layers size={12} /> Surcharge (Tax on Tax)
                    </button>
                </div>
            )}
        </div>
    );
}

// Recursive Block Component
export const FormulaBlock = ({
    component,
    onChange,
    onDelete,
    readOnly,
    availableTargets,
    inheritedContext,
    dragHandleProps,
    slabValueLabel = 'Tax %',
    showSlabValueTypeToggle = false,
    defaultSlabValueType = 'PERCENTAGE',
    forceEdit = false,
    isDragging,
}: {
    component: FormulaComponent;
    onChange: (c: FormulaComponent) => void;
    onDelete: () => void;
    readOnly: boolean;
    availableTargets: { id: string; label: string }[];
    inheritedContext?: { fuelType?: string; regType?: string };
    dragHandleProps?: any;
    slabValueLabel?: string;
    showSlabValueTypeToggle?: boolean;
    defaultSlabValueType?: 'PERCENTAGE' | 'FIXED';
    forceEdit?: boolean;
    isDragging?: boolean;
}) => {
    const [expanded, setExpanded] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const effectiveReadOnly = readOnly || (!forceEdit && !isEditing);

    const updateField = (field: keyof FormulaComponent, value: FormulaComponent[keyof FormulaComponent]) => {
        onChange({ ...component, [field]: value });
    };

    const isTaxOnTax = component.basis === 'PREVIOUS_TAX_TOTAL';
    const isSlab = component.type === 'SLAB';
    const slabValueType = component.slabValueType ?? defaultSlabValueType;
    const isFixedSlabValue = slabValueType === 'FIXED';
    const createSlabRange = (overrides: Partial<SlabRange> = {}): SlabRange => ({
        id: crypto.randomUUID(),
        min: 0,
        max: null,
        percentage: 0,
        applicableFuels: ['PETROL', 'DIESEL', 'CNG'],
        slabBasis: 'ENGINE_CC',
        ...overrides,
    });

    let borderColor = 'border-slate-200 dark:border-white/10';
    let headerColor = 'bg-slate-50/80 dark:bg-slate-800/80';
    let ringColor = 'ring-slate-200 dark:ring-white/5';
    let iconColor = 'text-slate-500 dark:text-slate-400';

    if (component.type === 'CONDITIONAL') {
        borderColor = 'border-purple-200/50 dark:border-purple-500/20';
        headerColor = 'bg-purple-50/50 dark:bg-purple-900/20';
        ringColor = 'ring-purple-200/50 dark:ring-purple-500/10';
        iconColor = 'text-purple-600 dark:text-purple-400';
    } else if (isTaxOnTax) {
        borderColor = 'border-orange-200/50 dark:border-orange-500/20';
        headerColor = 'bg-orange-50/50 dark:bg-orange-900/20';
        ringColor = 'ring-orange-200/50 dark:ring-orange-500/10';
        iconColor = 'text-orange-600 dark:text-orange-400';
    } else if (isSlab) {
        borderColor = 'border-pink-200/50 dark:border-pink-500/20';
        headerColor = 'bg-pink-50/50 dark:bg-pink-900/20';
        ringColor = 'ring-pink-200/50 dark:ring-pink-500/10';
        iconColor = 'text-pink-600 dark:text-pink-400';
    } else if (component.type === 'PERCENTAGE') {
        borderColor = 'border-blue-200/50 dark:border-blue-500/20';
        headerColor = 'bg-blue-50/50 dark:bg-blue-900/20';
        ringColor = 'ring-blue-200/50 dark:ring-blue-500/10';
        iconColor = 'text-blue-600 dark:text-blue-400';
    } else if (component.type === 'FIXED') {
        borderColor = 'border-green-200/50 dark:border-green-500/20';
        headerColor = 'bg-green-50/50 dark:bg-green-900/20';
        ringColor = 'ring-green-200/50 dark:ring-green-500/10';
        iconColor = 'text-green-600 dark:text-green-400';
    }

    return (
        <div
            className={`group border border-white/20 rounded-2xl bg-white/60 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 ring-1 ${ringColor} overflow-hidden ${borderColor}`}
        >
            {/* Header */}
            <div
                className={`flex items-center gap-4 px-4 py-3 cursor-pointer group/header ${headerColor} rounded-t-2xl border-b ${borderColor} transition-colors ${isDragging ? 'bg-blue-50/50' : ''}`}
                onClick={() => setExpanded(!expanded)}
            >
                {/* Drag Handle */}
                {!readOnly && (
                    <div
                        {...dragHandleProps}
                        className="p-2 -ml-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl cursor-grab active:cursor-grabbing text-slate-400 hover:text-blue-600 transition-all group-hover/header:translate-x-1"
                    >
                        <GripVertical size={20} className="drop-shadow-sm" />
                    </div>
                )}

                <button className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                    {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                <div className="flex items-center gap-2 flex-1">
                    {component.type === 'PERCENTAGE' && !isTaxOnTax && <Percent size={18} className={iconColor} />}
                    {component.type === 'PERCENTAGE' && isTaxOnTax && <Layers size={18} className={iconColor} />}
                    {component.type === 'FIXED' && <Banknote size={18} className={iconColor} />}
                    {component.type === 'CONDITIONAL' && <GitBranch size={18} className={iconColor} />}
                    {component.type === 'SWITCH' && <GitBranch size={18} className={iconColor} />}
                    {component.type === 'SLAB' && <Table size={18} className={iconColor} />}

                    {effectiveReadOnly ? (
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                            {component.label}
                        </span>
                    ) : (
                        <input
                            value={component.label}
                            onChange={e => updateField('label', e.target.value)}
                            className="bg-transparent border-none font-extrabold text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-0 p-0 w-full cursor-text hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 transition-colors tracking-tight"
                            placeholder={
                                isSlab
                                    ? 'Slab Name (e.g. MV Tax Table)'
                                    : component.type === 'CONDITIONAL'
                                      ? 'Condition Name'
                                      : component.type === 'SWITCH'
                                        ? 'Split Name'
                                        : isTaxOnTax
                                          ? 'Cess Name'
                                          : 'Charge Label'
                            }
                        />
                    )}
                </div>

                {/* Edit Controls */}
                {!readOnly && (
                    <div className="flex items-center gap-1">
                        {!isEditing ? (
                            <div className="flex items-center gap-2">
                                {component.basis && component.basis !== 'EX_SHOWROOM' && (
                                    <span className="text-[9px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-tighter italic border border-blue-500/20">
                                        Basis: {component.basis}
                                    </span>
                                )}
                                <button
                                    onClick={e => {
                                        e.stopPropagation();
                                        setIsEditing(true);
                                        setExpanded(true);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded transition-colors"
                                    title="Edit Component"
                                >
                                    <Pencil size={14} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                {/* Basis Control Move to Header */}
                                {(component.type === 'PERCENTAGE' || component.type === 'FIXED') && (
                                    <div className="flex items-center gap-1 mr-2 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-white/5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase px-1.5">
                                            Basis
                                        </label>
                                        <select
                                            value={component.basis || 'EX_SHOWROOM'}
                                            onChange={e => updateField('basis', e.target.value)}
                                            className="text-[10px] font-black bg-white dark:bg-slate-900 border-none focus:ring-0 py-0.5 pl-1 pr-6 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 uppercase tracking-tighter italic"
                                        >
                                            <option value="EX_SHOWROOM">Ex-Showroom</option>
                                            <option value="IDV">IDV Basis</option>
                                            <option value="OD_PREMIUM">OD Premium</option>
                                            <option value="INVOICE_BASE">Invoice</option>
                                            <option value="PREVIOUS_TAX_TOTAL">Accumulated</option>
                                            <option value="TARGET_COMPONENT">Specific Charge</option>
                                        </select>
                                    </div>
                                )}

                                {/* Target Component Selector if Basis is Target */}
                                {component.basis === 'TARGET_COMPONENT' && (
                                    <div className="flex items-center gap-1 mr-2 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-white/5">
                                        <select
                                            value={component.targetComponentId || ''}
                                            onChange={e => updateField('targetComponentId', e.target.value)}
                                            className="text-[10px] font-black bg-white dark:bg-slate-900 border-none focus:ring-0 py-0.5 pl-1 pr-6 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 uppercase tracking-tighter italic"
                                        >
                                            <option value="">Select Target...</option>
                                            {availableTargets
                                                .filter(t => t.id !== component.id)
                                                .map(t => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.label || '(Unnamed)'}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                )}

                                {/* Variant Logic Control */}
                                {(component.type === 'PERCENTAGE' ||
                                    component.type === 'FIXED' ||
                                    component.type === 'SLAB') && (
                                    <div className="flex items-center gap-1 mr-2 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-white/5">
                                        <select
                                            className="text-[10px] font-black bg-white dark:bg-slate-900 border-none focus:ring-0 py-0.5 pl-1 pr-6 rounded-lg cursor-pointer text-slate-600 dark:text-slate-200 uppercase tracking-tighter italic"
                                            value={
                                                component.variantTreatment ||
                                                (component.type === 'SLAB' ? 'PRO_RATA' : 'NONE')
                                            }
                                            onChange={e => updateField('variantTreatment', e.target.value)}
                                            title="How to treat variants like BH Series"
                                        >
                                            <option value="NONE">Standard (15 Yr)</option>
                                            <option value="PRO_RATA">Pro-Rata (Based on Variant)</option>
                                        </select>
                                    </div>
                                )}

                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 rounded transition-colors"
                                    title="Done Editing"
                                >
                                    <Check size={14} />
                                </button>
                                <div className="w-px h-4 bg-slate-300 dark:bg-white/10 mx-1" />
                                <button
                                    onClick={onDelete}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title="Delete Component"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Body */}
            {expanded && (
                <div className="p-3 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md">
                    {/* TYPE SPECIFIC FIELDS */}

                    {/* 1. PERCENTAGE */}
                    {component.type === 'PERCENTAGE' && (
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                                    Percentage by Fuel (%)
                                </label>

                                <div className="grid grid-cols-4 gap-2">
                                    {['PETROL', 'DIESEL', 'EV', 'CNG'].map(fuel => {
                                        // Context Filter
                                        if (inheritedContext?.fuelType && inheritedContext.fuelType !== fuel)
                                            return null;

                                        const val =
                                            component.fuelMatrix?.[fuel as keyof typeof component.fuelMatrix] ??
                                            (fuel === 'PETROL' ? component.percentage : 0) ??
                                            0;

                                        return (
                                            <div key={fuel}>
                                                <label className="text-[10px] text-slate-600 dark:text-slate-300 font-extrabold block mb-1 uppercase tracking-tighter italic">
                                                    {fuel}
                                                </label>
                                                <div className="relative group/input">
                                                    <input
                                                        type="number"
                                                        value={val}
                                                        onChange={e => {
                                                            const newVal = parseFloat(e.target.value);
                                                            const newMatrix = {
                                                                PETROL:
                                                                    component.fuelMatrix?.PETROL ??
                                                                    component.percentage ??
                                                                    0,
                                                                DIESEL: component.fuelMatrix?.DIESEL ?? 0,
                                                                EV: component.fuelMatrix?.EV ?? 0,
                                                                CNG: component.fuelMatrix?.CNG ?? 0,
                                                                ...component.fuelMatrix,
                                                            };
                                                            (newMatrix as Record<string, number>)[fuel] = newVal;
                                                            if (fuel === 'PETROL') updateField('percentage', newVal);
                                                            updateField('fuelMatrix', newMatrix);
                                                        }}
                                                        className="w-full pl-2 pr-6 py-1.5 bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/30 rounded-xl text-xs font-black text-blue-700 dark:text-blue-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                                        readOnly={readOnly}
                                                        step="0.001"
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-400/50 dark:text-blue-400/40">
                                                        %
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. FIXED */}
                    {component.type === 'FIXED' && (
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                                Fixed Amount (₹)
                            </label>

                            <div className="grid grid-cols-4 gap-2">
                                {['PETROL', 'DIESEL', 'EV', 'CNG'].map(fuel => {
                                    // Context Filter
                                    if (inheritedContext?.fuelType && inheritedContext.fuelType !== fuel) return null;

                                    const val =
                                        component.fuelMatrix?.[fuel as keyof typeof component.fuelMatrix] ??
                                        (fuel === 'PETROL' ? component.amount : 0) ??
                                        0;

                                    return (
                                        <div key={fuel}>
                                            <label className="text-[10px] text-slate-600 dark:text-slate-300 font-extrabold block mb-1 uppercase tracking-tighter italic">
                                                {fuel}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-green-500 dark:text-green-400 opacity-60">
                                                    ₹
                                                </span>
                                                <input
                                                    type="number"
                                                    value={val}
                                                    onChange={e => {
                                                        const newVal = parseFloat(e.target.value);
                                                        const newMatrix = {
                                                            PETROL:
                                                                component.fuelMatrix?.PETROL ?? component.amount ?? 0,
                                                            DIESEL: component.fuelMatrix?.DIESEL ?? 0,
                                                            EV: component.fuelMatrix?.EV ?? 0,
                                                            CNG: component.fuelMatrix?.CNG ?? 0,
                                                            ...component.fuelMatrix,
                                                        };
                                                        (newMatrix as Record<string, number>)[fuel] = newVal;
                                                        if (fuel === 'PETROL') updateField('amount', newVal);
                                                        updateField('fuelMatrix', newMatrix);
                                                    }}
                                                    className="w-full pl-4 pr-1 py-1.5 bg-green-50/50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/30 rounded-xl text-xs font-black text-green-700 dark:text-green-200 focus:ring-2 focus:ring-green-500 transition-all outline-none"
                                                    readOnly={readOnly}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 3. CONDITIONAL */}
                    {component.type === 'CONDITIONAL' && (
                        <div className="space-y-3">
                            {/* IF ROW */}
                            <div className="flex gap-2 items-center bg-white/40 dark:bg-slate-900/40 p-2 border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm">
                                <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-3 py-1 rounded-xl tracking-widest uppercase italic">
                                    IF
                                </span>
                                <select
                                    className="text-xs bg-transparent border-none focus:ring-0 font-black text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg px-2 transition-colors uppercase italic"
                                    value={component.conditionVariable}
                                    onChange={e => updateField('conditionVariable', e.target.value)}
                                    disabled={effectiveReadOnly}
                                >
                                    <option value="">Select Variable...</option>
                                    <option value="REG_TYPE">Registration Type</option>
                                    <option value="FUEL_TYPE">Fuel Type</option>
                                    <option value="ENGINE_CC">Engine CC</option>
                                    <option value="EX_SHOWROOM">Ex-Showroom</option>
                                    <option value="KW_RATING">EV KW Rating</option>
                                    <option value="SEATING_CAPACITY">Seating Capacity</option>
                                    <option value="GROSS_VEHICLE_WEIGHT">Gross Vehicle Weight</option>
                                </select>
                                <select
                                    className="text-xs bg-transparent border-none focus:ring-0 font-black text-slate-500 dark:text-slate-400 cursor-pointer text-center"
                                    value={component.conditionOperator}
                                    onChange={e => updateField('conditionOperator', e.target.value)}
                                    disabled={effectiveReadOnly}
                                >
                                    <option value="EQUALS">=</option>
                                    <option value="NOT_EQUALS">≠</option>
                                    <option value="GREATER_THAN">{'>'}</option>
                                    <option value="LESS_THAN">{'<'}</option>
                                </select>
                                <input
                                    className="text-xs bg-transparent border-b border-slate-200 dark:border-white/10 focus:border-purple-500 focus:ring-0 font-black text-slate-900 dark:text-white flex-1 transition-colors px-2 py-1"
                                    placeholder="Value..."
                                    value={component.conditionValue}
                                    onChange={e => updateField('conditionValue', e.target.value)}
                                    readOnly={effectiveReadOnly}
                                />
                            </div>

                            {/* THEN / ELSE GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* THEN COL */}
                                <div className="border border-green-200 dark:border-green-900/30 bg-green-50/30 dark:bg-green-900/10 rounded-2xl p-2 flex flex-col h-full relative group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-green-400/50 rounded-l-2xl" />
                                    <div className="flex items-center justify-between mb-2 pl-3">
                                        <span className="text-[10px] font-black text-green-700 dark:text-green-400 uppercase tracking-widest italic">
                                            Then (True)
                                        </span>
                                    </div>
                                    <div className="flex-1 pl-2">
                                        <FormulaBuilder
                                            components={component.thenBlock || []}
                                            onChange={newList => updateField('thenBlock', newList)}
                                            readOnly={effectiveReadOnly}
                                            availableTargets={availableTargets}
                                            inheritedContext={inheritedContext}
                                        />
                                    </div>
                                </div>

                                {/* ELSE COL */}
                                <div className="border border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10 rounded-2xl p-2 flex flex-col h-full relative group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-red-400/50 rounded-l-2xl" />
                                    <div className="flex items-center justify-between mb-2 pl-3">
                                        <span className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase tracking-widest italic">
                                            Else (False)
                                        </span>
                                    </div>
                                    <div className="flex-1 pl-2">
                                        <FormulaBuilder
                                            components={component.elseBlock || []}
                                            onChange={newList => updateField('elseBlock', newList)}
                                            readOnly={effectiveReadOnly}
                                            availableTargets={availableTargets}
                                            inheritedContext={inheritedContext}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. SLAB */}
                    {component.type === 'SLAB' && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    Universal Tax Table
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold italic ml-2">
                                    Define rules row-by-row. Engine checks top-to-bottom. First match wins.
                                </span>
                            </div>

                            {showSlabValueTypeToggle && (
                                <div className="flex justify-end mb-2">
                                    <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-white/5">
                                        <span className="text-[9px] font-black text-slate-400 uppercase px-2">
                                            Value Type
                                        </span>
                                        <select
                                            value={slabValueType}
                                            onChange={e => updateField('slabValueType', e.target.value)}
                                            className="text-[10px] font-black bg-white dark:bg-slate-900 border-none focus:ring-0 py-0.5 pl-1 pr-6 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 uppercase tracking-tighter italic"
                                            disabled={effectiveReadOnly}
                                        >
                                            <option value="PERCENTAGE">%</option>
                                            <option value="FIXED">Fixed</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="border border-white/40 dark:border-white/5 rounded-3xl overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm shadow-inner ring-1 ring-black/5 mt-4">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="bg-slate-100/50 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-black/5 dark:border-white/5">
                                        <tr>
                                            {!inheritedContext?.fuelType && (
                                                <th className="px-4 py-3 w-[25%]">Applicable Fuels</th>
                                            )}
                                            <th className="px-3 py-3 w-[20%]">Calculate On</th>
                                            <th className="px-3 py-3 w-[15%]">Min</th>
                                            <th className="px-3 py-3 w-[15%]">Max</th>
                                            <th className="px-3 py-3 w-[10%] text-center">{slabValueLabel}</th>
                                            <th className="px-3 py-3 w-[10%] text-center border-l border-white/10 bg-orange-500/5">
                                                Cess %
                                            </th>
                                            {!effectiveReadOnly && <th className="px-3 py-3 w-[5%]"></th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                        {(component.ranges || []).map((range, rIdx) => {
                                            const updateRange = (updates: Partial<typeof range>) => {
                                                const newRanges = [...(component.ranges || [])];
                                                newRanges[rIdx] = { ...newRanges[rIdx], ...updates };
                                                updateField('ranges', newRanges);
                                            };

                                            const toggleFuel = (fuel: string) => {
                                                const current = range.applicableFuels || [];
                                                const isSelected = current.includes(fuel as any);
                                                const newFuels = isSelected
                                                    ? current.filter(f => f !== fuel)
                                                    : [...current, fuel as any];
                                                updateRange({ applicableFuels: newFuels });
                                            };

                                            return (
                                                <tr
                                                    key={range.id}
                                                    className="group hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-200"
                                                >
                                                    {!inheritedContext?.fuelType && (
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-1.5 flex-wrap">
                                                                {['PETROL', 'DIESEL', 'EV', 'CNG'].map(fuel => {
                                                                    const active = range.applicableFuels?.includes(
                                                                        fuel as any
                                                                    );
                                                                    return (
                                                                        <button
                                                                            key={fuel}
                                                                            onClick={() =>
                                                                                !effectiveReadOnly && toggleFuel(fuel)
                                                                            }
                                                                            className={`text-[10px] font-black px-2 py-1 rounded-lg border-2 transition-all duration-300 ${
                                                                                active
                                                                                    ? fuel === 'EV'
                                                                                        ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30'
                                                                                        : fuel === 'PETROL'
                                                                                          ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30'
                                                                                          : fuel === 'CNG'
                                                                                            ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                                                                                            : 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-500/30'
                                                                                    : 'bg-transparent text-slate-300 dark:text-slate-600 border-slate-100 dark:border-white/5 opacity-40 hover:opacity-100 hover:border-slate-200'
                                                                            }`}
                                                                        >
                                                                            {fuel.substring(0, 1)}
                                                                            <span className="hidden xl:inline ml-0.5">
                                                                                {fuel.substring(1).toLowerCase()}
                                                                            </span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="px-3 py-3">
                                                        <select
                                                            className="w-full text-xs bg-white/50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer shadow-sm uppercase italic"
                                                            value={
                                                                range.slabBasis || component.slabVariable || 'ENGINE_CC'
                                                            }
                                                            onChange={e =>
                                                                updateRange({ slabBasis: e.target.value as any })
                                                            }
                                                            disabled={effectiveReadOnly}
                                                        >
                                                            <option value="ENGINE_CC">Engine CC</option>
                                                            <option value="KW_RATING">EV KW Rating</option>
                                                            <option value="EX_SHOWROOM">Ex-Showroom</option>
                                                            <option value="SEATING_CAPACITY">Seating Capacity</option>
                                                            <option value="GROSS_VEHICLE_WEIGHT">GVW</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <input
                                                            type="number"
                                                            value={range.min}
                                                            onChange={e =>
                                                                updateRange({ min: parseFloat(e.target.value) })
                                                            }
                                                            className="w-full bg-white/50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg px-2 py-1.5 text-xs font-black text-slate-900 dark:text-white"
                                                            placeholder="0"
                                                            readOnly={effectiveReadOnly}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <input
                                                            type="number"
                                                            value={range.max === null ? '' : range.max}
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                updateRange({
                                                                    max: val === '' ? null : parseFloat(val),
                                                                });
                                                            }}
                                                            className="w-full bg-white/50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg px-2 py-1.5 text-xs font-black text-slate-900 dark:text-white"
                                                            placeholder="∞"
                                                            readOnly={effectiveReadOnly}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <input
                                                            type="number"
                                                            value={
                                                                isFixedSlabValue
                                                                    ? (range.amount ?? '')
                                                                    : range.percentage
                                                            }
                                                            onChange={e => {
                                                                const nextValue =
                                                                    e.target.value === ''
                                                                        ? ''
                                                                        : parseFloat(e.target.value);
                                                                if (isFixedSlabValue) {
                                                                    updateRange({
                                                                        amount:
                                                                            nextValue === '' ? undefined : nextValue,
                                                                    });
                                                                } else {
                                                                    updateRange({
                                                                        percentage: nextValue === '' ? 0 : nextValue,
                                                                    });
                                                                }
                                                            }}
                                                            className="w-16 bg-blue-50/50 dark:bg-blue-500/10 border-2 border-blue-100 dark:border-blue-500/30 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl px-0 py-2 text-sm font-black text-blue-700 dark:text-blue-300 text-center"
                                                            placeholder="0"
                                                            readOnly={effectiveReadOnly}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-3 text-center border-l border-orange-200/20 bg-orange-500/[0.02]">
                                                        <input
                                                            type="number"
                                                            value={range.cessPercentage || ''}
                                                            onChange={e =>
                                                                updateRange({
                                                                    cessPercentage:
                                                                        e.target.value === ''
                                                                            ? undefined
                                                                            : parseFloat(e.target.value),
                                                                })
                                                            }
                                                            className="w-16 bg-orange-50/50 dark:bg-orange-500/10 border-2 border-orange-100 dark:border-orange-500/30 focus:border-orange-600 focus:ring-4 focus:ring-orange-100 rounded-xl px-0 py-2 text-sm font-black text-orange-700 dark:text-orange-300 text-center"
                                                            placeholder="0"
                                                            readOnly={effectiveReadOnly}
                                                        />
                                                    </td>
                                                    {!effectiveReadOnly && (
                                                        <td className="px-3 py-3 text-right">
                                                            <button
                                                                onClick={() => {
                                                                    const newRanges = (component.ranges || []).filter(
                                                                        (_, i) => i !== rIdx
                                                                    );
                                                                    updateField('ranges', newRanges);
                                                                }}
                                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {!effectiveReadOnly && (
                                    <div className="p-4 bg-slate-50/30 dark:bg-white/5 border-t border-black/5 dark:border-white/5 flex justify-center">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <button
                                                onClick={() => {
                                                    const newRanges = [...(component.ranges || []), createSlabRange()];
                                                    updateField('ranges', newRanges);
                                                }}
                                                className="flex items-center gap-2 text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-white dark:hover:bg-white/5 px-6 py-3 rounded-2xl transition-all shadow-sm active:scale-95 uppercase tracking-widest"
                                            >
                                                <Plus size={12} /> Add Rule Row
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const ranges = component.ranges || [];
                                                    const last = ranges[ranges.length - 1];
                                                    const nextMin =
                                                        last && last.max !== null ? last.max : (last?.min ?? 0);
                                                    const nextBasis =
                                                        last?.slabBasis || component.slabVariable || 'ENGINE_CC';
                                                    const nextFuels = last?.applicableFuels || [
                                                        'PETROL',
                                                        'DIESEL',
                                                        'CNG',
                                                    ];
                                                    const nextRange = createSlabRange({
                                                        min: nextMin,
                                                        max: null,
                                                        slabBasis: nextBasis,
                                                        applicableFuels: nextFuels,
                                                    });
                                                    updateField('ranges', [...ranges, nextRange]);
                                                }}
                                                className="flex items-center gap-2 text-[10px] font-black text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-white/5 px-6 py-3 rounded-2xl transition-all shadow-sm active:scale-95 uppercase tracking-widest"
                                            >
                                                <Plus size={12} /> Add Next Row
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 5. SWITCH */}
                    {component.type === 'SWITCH' && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    Split By:
                                </span>
                                <select
                                    value={component.switchVariable || 'REG_TYPE'}
                                    onChange={e => updateField('switchVariable', e.target.value)}
                                    className="text-xs bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-lg px-2 py-1 font-black text-teal-600 dark:text-teal-400 focus:ring-2 focus:ring-teal-500 uppercase italic"
                                    disabled={effectiveReadOnly}
                                >
                                    <option value="REG_TYPE">Registration Type</option>
                                    <option value="FUEL_TYPE">Fuel Type</option>
                                    <option value="ENGINE_CC">Engine CC</option>
                                </select>
                            </div>

                            <div className="space-y-3 pl-2 border-l-2 border-teal-100 dark:border-teal-900/30">
                                {(component.cases || []).map((caseItem, cIdx) => (
                                    <div key={caseItem.id} className="relative group">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                                                <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                                                    Case: {caseItem.label}
                                                </span>
                                                <span className="text-[10px] bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-lg font-black italic">
                                                    "{caseItem.matchValue}"
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-2 shadow-sm">
                                            <FormulaBuilder
                                                components={caseItem.block || []}
                                                onChange={newBlock => {
                                                    const newCases = [...(component.cases || [])];
                                                    newCases[cIdx].block = newBlock;
                                                    updateField('cases', newCases);
                                                }}
                                                readOnly={effectiveReadOnly}
                                                availableTargets={availableTargets}
                                                inheritedContext={{
                                                    ...inheritedContext,
                                                    fuelType:
                                                        component.switchVariable === 'FUEL_TYPE'
                                                            ? caseItem.matchValue
                                                            : inheritedContext?.fuelType,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
