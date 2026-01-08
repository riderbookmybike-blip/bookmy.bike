'use client';

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface SimpleVariantTableProps {
    modelName: string;
    variants: any[];
    onAddVariant: (data: { name: string }) => void;
    onUpdateVariant: (variantId: string, field: string, value: string) => void;
    onDeleteVariant: (variantId: string) => void;
}

export const SimpleVariantTable: React.FC<SimpleVariantTableProps> = ({
    modelName,
    variants,
    onAddVariant,
    onUpdateVariant,
    onDeleteVariant
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');

    const columns = [
        { key: 'name', label: 'Variant Name', width: '150px' },
        { key: 'displacement', label: 'CC', width: '100px', category: 'engine' },
        { key: 'maxPower', label: 'Power', width: '120px', category: 'engine' },
        { key: 'maxTorque', label: 'Torque', width: '120px', category: 'engine' },
        { key: 'kerbWeight', label: 'Weight', width: '100px', category: 'dimensions' },
        { key: 'fuelCapacity', label: 'Fuel Cap', width: '100px', category: 'dimensions' },
        { key: 'frontBrake', label: 'F. Brake', width: '100px', category: 'tyres' },
        { key: 'rearBrake', label: 'R. Brake', width: '100px', category: 'tyres' }
    ];

    const handleAdd = () => {
        if (newName.trim()) {
            onAddVariant({ name: newName.trim() });
            setNewName('');
            setIsAdding(false);
        }
    };

    const getCellValue = (variant: any, col: any) => {
        if (col.key === 'name') return variant.name || variant.variant || '';
        if (col.category) {
            return variant.specifications?.[col.category]?.[col.key] || '';
        }
        return '';
    };

    return (
        <div className="w-full h-full">
            {/* Simple header - no padding */}
            <div className="flex items-center justify-between mb-2 px-4 pt-2">
                <h3 className="text-sm font-bold text-white">{modelName} - Variants</h3>
                <button
                    onClick={() => setIsAdding(true)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500 transition-colors flex items-center gap-1"
                >
                    <Plus size={12} />
                    Add
                </button>
            </div>

            {/* Full-width spreadsheet table - absolutely no padding */}
            <div className="w-full overflow-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-800 border-b border-slate-700">
                            <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide border-r border-slate-700" style={{ width: '40px' }}>
                                #
                            </th>
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide border-r border-slate-700"
                                    style={{ width: col.width }}
                                >
                                    {col.label}
                                </th>
                            ))}
                            <th className="px-3 py-2 text-center text-[10px] font-bold text-slate-400 uppercase" style={{ width: '60px' }}>
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {variants.map((variant, idx) => (
                            <tr key={variant.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                <td className="px-3 py-2 text-xs text-slate-500 border-r border-slate-800">
                                    {idx + 1}
                                </td>
                                {columns.map(col => (
                                    <td key={col.key} className="px-3 py-2 border-r border-slate-800">
                                        <input
                                            type="text"
                                            value={getCellValue(variant, col)}
                                            onChange={(e) => {
                                                if (col.key === 'name') {
                                                    onUpdateVariant(variant.id, 'name', e.target.value);
                                                } else if (col.category) {
                                                    onUpdateVariant(variant.id, `${col.category}.${col.key}`, e.target.value);
                                                }
                                            }}
                                            className="w-full px-2 py-1 bg-transparent text-xs text-white border border-transparent hover:border-slate-600 focus:border-blue-500 focus:bg-slate-800/50 rounded outline-none transition-colors"
                                            placeholder={`Enter ${col.label.toLowerCase()}`}
                                        />
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center border-r border-slate-800">
                                    <button
                                        onClick={() => onDeleteVariant(variant.id)}
                                        className="p-1 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {/* Add new row */}
                        {isAdding && (
                            <tr className="bg-blue-500/10 border-b-2 border-blue-500">
                                <td className="px-3 py-2 text-xs text-slate-500 border-r border-slate-800">
                                    {variants.length + 1}
                                </td>
                                <td className="px-3 py-2 border-r border-slate-800">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAdd();
                                            if (e.key === 'Escape') { setIsAdding(false); setNewName(''); }
                                        }}
                                        placeholder="Variant name"
                                        className="w-full px-2 py-1 bg-slate-800 text-xs text-white border border-blue-500 rounded outline-none"
                                    />
                                </td>
                                <td colSpan={columns.length - 1 + 1} className="px-3 py-2 border-r border-slate-800">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleAdd}
                                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500"
                                        >
                                            Add
                                        </button>
                                        <button
                                            onClick={() => { setIsAdding(false); setNewName(''); }}
                                            className="px-3 py-1 bg-slate-700 text-white rounded text-xs font-bold hover:bg-slate-600"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {variants.length === 0 && !isAdding && (
                    <div className="text-center py-12 text-slate-500 text-sm">
                        No variants. Click "Add" to create one.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SimpleVariantTable;
