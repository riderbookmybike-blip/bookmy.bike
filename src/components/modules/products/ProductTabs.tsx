// @ts-nocheck
'use client';

import React from 'react';
import { ProductBrand } from '@/types/productMaster';
import { ShieldCheck, Layers, Tag, ChevronRight, Plus, Trash2, MapPin, Check } from 'lucide-react';

// --- MODALS ---
export const ModelCreationModal = ({
    isOpen,
    onClose,
    onCreate,
}: {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: { name: string; category: string; fuelType: string; hsnCode: string; gstRate: number }) => void;
}) => {
    const [name, setName] = React.useState('');
    const [category, setCategory] = React.useState('Scooter');
    const [fuelType, setFuelType] = React.useState('Petrol');
    const [hsnCode, setHsnCode] = React.useState('871120');
    const [gstRate, setGstRate] = React.useState(28);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl p-10 animate-in zoom-in-95 duration-300">
                <div className="space-y-6">
                    <div>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-2 leading-none italic">
                            New Entity
                        </p>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                            Register Model
                        </h2>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Model Name
                        </label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Activa 7G"
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer"
                            >
                                <option
                                    value="Scooter"
                                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    Scooter
                                </option>
                                <option
                                    value="Motorcycle"
                                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    Motorcycle
                                </option>
                                <option
                                    value="Moped"
                                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    Moped
                                </option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Fuel Type
                            </label>
                            <select
                                value={fuelType}
                                onChange={e => setFuelType(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer"
                            >
                                <option
                                    value="Petrol"
                                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    Petrol
                                </option>
                                <option
                                    value="Electric"
                                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    Electric
                                </option>
                                <option
                                    value="CNG"
                                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    CNG
                                </option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                HSN Code (6-Digit)
                            </label>
                            <input
                                type="text"
                                value={hsnCode}
                                onChange={e => setHsnCode(e.target.value)}
                                placeholder="e.g. 871120"
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                GST Rate (%)
                            </label>
                            <input
                                type="number"
                                value={gstRate}
                                onChange={e => setGstRate(Number(e.target.value))}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (name.trim()) {
                                    onCreate({ name, category, fuelType, hsnCode, gstRate });
                                    setName('');
                                    setCategory('Scooter');
                                    setFuelType('Petrol');
                                    setHsnCode('871120');
                                    setGstRate(28);
                                    onClose();
                                }
                            }}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all"
                        >
                            Create Model
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ModelEditModal = ({
    isOpen,
    onClose,
    model,
    onUpdate,
}: {
    isOpen: boolean;
    onClose: () => void;
    model: any;
    onUpdate: (
        id: string,
        data: { name: string; category: string; fuelType: string; hsnCode: string; gstRate: number }
    ) => void;
}) => {
    const [name, setName] = React.useState(model?.name || '');
    const [category, setCategory] = React.useState(model?.category || 'Scooter');
    const [fuelType, setFuelType] = React.useState(model?.fuelType || 'Petrol');
    const [hsnCode, setHsnCode] = React.useState(model?.hsnCode || '871120');
    const [gstRate, setGstRate] = React.useState(model?.gstRate || 28);

    React.useEffect(() => {
        if (model) {
            setName(model.name || '');
            setCategory(model.category || 'Scooter');
            setFuelType(model.fuelType || 'Petrol');
            setHsnCode(model.hsnCode || '871120');
            setGstRate(model.gstRate || 28);
        }
    }, [model]);

    if (!isOpen || !model) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl p-10 animate-in zoom-in-95 duration-300">
                <div className="space-y-6">
                    <div>
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-2 leading-none italic">
                            Edit Entity
                        </p>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                            Update Model
                        </h2>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Model Name
                        </label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Activa 7G"
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 transition-all outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 transition-all outline-none appearance-none cursor-pointer"
                            >
                                <option
                                    value="Scooter"
                                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    Scooter
                                </option>
                                <option
                                    value="Motorcycle"
                                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    Motorcycle
                                </option>
                                <option
                                    value="Moped"
                                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    Moped
                                </option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Fuel Type
                            </label>
                            <select
                                value={fuelType}
                                onChange={e => setFuelType(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 transition-all outline-none appearance-none cursor-pointer"
                            >
                                <option
                                    value="Petrol"
                                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    Petrol
                                </option>
                                <option
                                    value="Electric"
                                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    Electric
                                </option>
                                <option
                                    value="CNG"
                                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    CNG
                                </option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                HSN Code (6-Digit)
                            </label>
                            <input
                                type="text"
                                value={hsnCode}
                                onChange={e => setHsnCode(e.target.value)}
                                placeholder="e.g. 871120"
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                GST Rate (%)
                            </label>
                            <input
                                type="number"
                                value={gstRate}
                                onChange={e => setGstRate(Number(e.target.value))}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (name.trim()) {
                                    onUpdate(model.id, { name, category, fuelType, hsnCode, gstRate });
                                    onClose();
                                }
                            }}
                            className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:shadow-amber-500/40 transition-all"
                        >
                            Update Model
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const VariantCreationModal = ({
    isOpen,
    onClose,
    onCreate,
}: {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string) => void;
}) => {
    const [name, setName] = React.useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl p-10 animate-in zoom-in-95 duration-300">
                <div className="space-y-6">
                    <div>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-2 leading-none italic">
                            New Spec
                        </p>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                            Register Variant
                        </h2>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Variant Name
                        </label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Deluxe"
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (name.trim()) {
                                    onCreate(name);
                                    setName('');
                                    onClose();
                                }
                            }}
                            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all"
                        >
                            Create Variant
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ProductBrandOverview = ({ brand }: { brand: ProductBrand }) => {
    return (
        <div className="w-full h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden text-slate-900 dark:text-white flex flex-col justify-center transition-colors duration-500">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full -mr-40 -mt-40" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 blur-[100px] rounded-full -ml-32 -mb-32" />

                <div className="relative z-10 space-y-12">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-6">
                            {brand.logoUrl && (
                                <div className="w-20 h-20 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-2 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={brand.logoUrl}
                                        alt={brand.name}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                            )}
                            <div>
                                <p className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-[0.4em] mb-4 leading-none italic">
                                    Master Brand Entity
                                </p>
                                <h2 className="text-7xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic leading-[0.8]">
                                    {brand.name}
                                </h2>
                            </div>
                        </div>
                        <div className="px-6 py-3 bg-slate-100 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 italic">
                            {brand.type}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-8">
                        <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-100 dark:border-white/5 hover:border-blue-500/50 dark:hover:border-white/20 transition-all text-center group backdrop-blur-sm">
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                Digital SKU Count
                            </p>
                            <div className="text-4xl font-black text-slate-900 dark:text-white italic">
                                {brand.skuCount}
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-100 dark:border-white/5 hover:border-green-500/50 dark:hover:border-white/20 transition-all text-center group backdrop-blur-sm">
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors">
                                Active Reach
                            </p>
                            <div className="text-4xl font-black text-green-400 flex items-center justify-center gap-2">
                                <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-ping" />
                                100%
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-100 dark:border-white/5 hover:border-amber-500/50 dark:hover:border-white/20 transition-all text-center group backdrop-blur-sm">
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                                Catalog Status
                            </p>
                            <div className="text-4xl font-black text-slate-400 italic">SYNC</div>
                        </div>
                        <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-100 dark:border-white/5 hover:border-indigo-500/50 dark:hover:border-white/20 transition-all text-center group backdrop-blur-sm">
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                                Health Index
                            </p>
                            <div className="text-4xl font-black text-slate-900 dark:text-white italic">AA+</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-500/10 overflow-hidden relative border border-white/10">
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full blur-[80px]" />
                <div className="flex items-center gap-6 relative">
                    <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md shadow-lg">
                        <Tag size={20} />
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest italic mb-1">
                            Hierarchical Governance Locked
                        </h4>
                        <p className="text-[11px] text-white/70 font-bold max-w-2xl leading-relaxed uppercase tracking-tight">
                            The Product Master structural integrity is maintained through strict governance. Navigate to{' '}
                            <span className="underline font-black italic text-white">Models & SKUs</span> to manage
                            high-fidelity engineering variants.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- TAB 2: MODELS ---
export const ProductModelsTab = ({
    models,
    selectedModelId,
    onSelectModel,
    onCreateModel,
    onUpdateModel,
    isCreateModalOpen,
    setCreateModalOpen,
}: {
    models: any[];
    selectedModelId?: string;
    onSelectModel: (model: any) => void;
    onCreateModel: (data: {
        name: string;
        category: string;
        fuelType: string;
        hsnCode: string;
        gstRate: number;
    }) => void;
    onUpdateModel: (
        id: string,
        data: { name: string; category: string; fuelType: string; hsnCode: string; gstRate: number }
    ) => void;
    isCreateModalOpen?: boolean;
    setCreateModalOpen?: (open: boolean) => void;
}) => {
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [editingModel, setEditingModel] = React.useState<any>(null);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <ModelCreationModal
                isOpen={isCreateModalOpen || false}
                onClose={() => setCreateModalOpen?.(false)}
                onCreate={onCreateModel}
            />

            <ModelEditModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingModel(null);
                }}
                model={editingModel}
                onUpdate={onUpdateModel}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
                {models.map(model => (
                    <div
                        key={model.id}
                        onClick={() => onSelectModel(model)}
                        className={`relative p-5 rounded-3xl border-2 transition-all text-left overflow-hidden group cursor-pointer ${
                            selectedModelId === model.id
                                ? 'bg-blue-600/5 dark:bg-blue-600/10 border-blue-600 shadow-xl shadow-blue-500/10 scale-[1.02]'
                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 hover:border-blue-500/30'
                        }`}
                    >
                        {/* Background Ornament */}
                        <div
                            className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl rounded-full transition-opacity duration-500 ${selectedModelId === model.id ? 'bg-blue-500/20 opacity-100' : 'bg-slate-500/5 opacity-0 group-hover:opacity-100'}`}
                        />

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div
                                className={`p-2 rounded-xl ${selectedModelId === model.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-50 dark:bg-white/5 text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-all'}`}
                            >
                                <Layers size={18} strokeWidth={selectedModelId === model.id ? 2.5 : 2} />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={e => {
                                        e.stopPropagation();
                                        setEditingModel(model);
                                        setIsEditModalOpen(true);
                                    }}
                                    className="p-1.5 bg-slate-50 dark:bg-white/5 text-slate-400 rounded-lg hover:bg-amber-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                    </svg>
                                </button>
                                {selectedModelId === model.id && (
                                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40">
                                        <Check size={12} strokeWidth={4} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="relative z-10">
                            <h3
                                className={`text-sm font-black tracking-tight uppercase italic leading-none mb-2 ${selectedModelId === model.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}
                            >
                                {model.name}
                            </h3>

                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {model.category && (
                                    <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 text-slate-500 border border-slate-100 dark:border-white/5">
                                        {model.category}
                                    </span>
                                )}
                                <span
                                    className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border transition-colors ${
                                        model.status === 'Discontinue'
                                            ? 'bg-rose-50 text-rose-500 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/30'
                                            : model.status === 'Newly Launch'
                                              ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-600/10 dark:border-blue-600/30'
                                              : model.status === 'Re Launch'
                                                ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-600/10 dark:border-amber-600/30'
                                                : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-600/10 dark:border-emerald-600/30'
                                    }`}
                                >
                                    {model.status || 'Active'}
                                </span>
                            </div>

                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                                {model.variants?.length || 0} Variants Configured
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const VariantEditModal = ({
    isOpen,
    onClose,
    variant,
    onUpdate,
}: {
    isOpen: boolean;
    onClose: () => void;
    variant: any;
    onUpdate: (id: string, name: string) => void;
}) => {
    const [name, setName] = React.useState(variant?.name || '');

    React.useEffect(() => {
        if (variant) {
            setName(variant.name || '');
        }
    }, [variant]);

    if (!isOpen || !variant) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl p-10 animate-in zoom-in-95 duration-300">
                <div className="space-y-6">
                    <div>
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-2 leading-none italic">
                            Edit Spec
                        </p>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                            Update Variant
                        </h2>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Variant Name
                        </label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Deluxe"
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 transition-all outline-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (name.trim()) {
                                    onUpdate(variant.id, name);
                                    onClose();
                                }
                            }}
                            className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:shadow-amber-500/40 transition-all"
                        >
                            Update Variant
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- TAB 3: VARIANTS ---
export const ProductVariantsTab = ({
    model,
    selectedVariantId,
    onSelectVariant,
    onCreateVariant,
    onUpdateVariant,
}: {
    model: any;
    selectedVariantId?: string;
    onSelectVariant: (variant: any) => void;
    onCreateVariant: (name: string) => void;
    onUpdateVariant: (id: string, name: string) => void;
}) => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [editingVariant, setEditingVariant] = React.useState<any>(null);

    if (!model) {
        return (
            <div className="h-full flex items-center justify-center p-20 animate-in fade-in duration-700">
                <div className="text-center space-y-6">
                    <div className="p-8 bg-slate-100 dark:bg-slate-800 rounded-full inline-block group">
                        <Layers
                            size={64}
                            className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors duration-500"
                        />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
                            No Model Selected
                        </h3>
                        <p className="text-sm text-slate-400 font-bold max-w-xs mx-auto mt-2">
                            Please select a model from the{' '}
                            <span className="text-blue-500 underline uppercase tracking-widest text-[10px] font-black">
                                Models
                            </span>{' '}
                            tab to view its engineering variants.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <VariantCreationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={onCreateVariant}
            />

            <VariantEditModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingVariant(null);
                }}
                variant={editingVariant}
                onUpdate={onUpdateVariant}
            />

            <div className="flex justify-between items-end">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20">
                        <Layers size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2 leading-none italic">
                            Engineering Matrix
                        </p>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                            {model.name} Variants
                        </h2>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all border border-white/10"
                >
                    + New Variant Profile
                </button>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {model.variants?.map((variant: any) => (
                    <div
                        key={variant.id}
                        className={`relative group bg-white dark:bg-slate-900 rounded-[3rem] border-[3px] transition-all overflow-hidden ${
                            selectedVariantId === variant.id
                                ? 'border-indigo-500 shadow-[0_0_60px_-10px_rgba(99,102,241,0.3)] ring-4 ring-indigo-500/5 scale-[1.01] bg-indigo-500/[0.04]'
                                : 'border-slate-100 dark:border-white/5 hover:border-indigo-500/50'
                        }`}
                    >
                        {/* Edit Button */}
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                setEditingVariant(variant);
                                setIsEditModalOpen(true);
                            }}
                            className="absolute top-6 right-6 p-2 bg-amber-500/10 text-amber-500 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-amber-500 hover:text-white hover:scale-110 transition-all z-10"
                            title="Edit Variant"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                            </svg>
                        </button>

                        <div className="p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative">
                            {selectedVariantId === variant.id && (
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                            )}

                            <div className="flex items-center gap-8 relative z-10">
                                <div
                                    className={`p-5 rounded-[1.5rem] transition-all duration-500 ${selectedVariantId === variant.id ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-slate-500 group-hover:text-indigo-500'}`}
                                >
                                    <ShieldCheck size={36} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic leading-none mb-2">
                                        {variant.name}
                                    </h3>
                                    <div className="flex gap-6 mt-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                                            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                {variant.specifications?.engine?.displacement || '--'} CC
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                                            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                {variant.specifications?.transmission?.type || '--'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 relative z-10">
                                <div className="flex -space-x-3">
                                    {variant.colors?.map((c: any) => (
                                        <div
                                            key={c.id}
                                            className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 shadow-xl group-hover:scale-110 transition-transform"
                                            style={{
                                                backgroundColor: c.name.includes('Grey')
                                                    ? '#4b5563'
                                                    : c.name.includes('White')
                                                      ? '#f8fafc'
                                                      : c.name.includes('Blue')
                                                        ? '#2563eb'
                                                        : '#000',
                                            }}
                                            title={c.name}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={() => onSelectVariant(variant)}
                                    className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                                        selectedVariantId === variant.id
                                            ? 'bg-indigo-600 text-white shadow-xl'
                                            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:shadow-2xl'
                                    }`}
                                >
                                    {selectedVariantId === variant.id ? 'Active Profile' : 'Configure Variant'}
                                </button>
                            </div>
                        </div>

                        {selectedVariantId === variant.id && (
                            <div className="px-10 pb-10 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-700">
                                <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] space-y-6 border border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Tag size={18} className="text-indigo-500" />
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                            Key Technical Features
                                        </h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {variant.features?.map((f: string) => (
                                            <span
                                                key={f}
                                                className="px-4 py-2 bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black border border-slate-100 dark:border-white/5 uppercase tracking-wider shadow-sm"
                                            >
                                                {f}
                                            </span>
                                        ))}
                                        <button className="px-4 py-2 border border-dashed border-slate-300 dark:border-white/20 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:border-indigo-400 hover:text-indigo-400 transition-all">
                                            + Feature
                                        </button>
                                    </div>
                                </div>
                                <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] space-y-6 border border-slate-100 dark:border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck size={18} className="text-blue-500" />
                                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                Dynamometer Profile
                                            </h4>
                                        </div>
                                        <button className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all">
                                            Edit Specs
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-white/5">
                                            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                                                Max Power
                                            </p>
                                            <p className="text-lg font-black dark:text-white tracking-tight">
                                                {variant.specifications?.engine?.maxPower || '--'}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-white/5">
                                            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                                                Cooling System
                                            </p>
                                            <p className="text-lg font-black dark:text-white tracking-tight">
                                                {variant.specifications?.engine?.cooling || '--'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- TAB 4: COLORS ---
export const ProductColorsTab = ({ variant }: { variant: any }) => {
    if (!variant) {
        return (
            <div className="h-full flex items-center justify-center p-20 animate-in fade-in duration-700">
                <div className="text-center space-y-6">
                    <div className="p-8 bg-slate-100 dark:bg-slate-800 rounded-full inline-block group">
                        <Tag
                            size={64}
                            className="text-slate-300 dark:text-slate-600 group-hover:text-amber-500 transition-colors duration-500"
                        />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
                            No Variant Selected
                        </h3>
                        <p className="text-sm text-slate-400 font-bold max-w-xs mx-auto mt-2">
                            Please select a variant from the{' '}
                            <span className="text-indigo-500 underline uppercase tracking-widest text-[10px] font-black">
                                Variants
                            </span>{' '}
                            tab to manage its color palette and SKUs.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-900 dark:bg-white rounded-[1.5rem] flex items-center justify-center text-white dark:text-slate-900 shadow-2xl">
                        <Tag size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 leading-none italic">
                            Aesthetic Matrix
                        </p>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                            {variant.name} Palette
                        </h2>
                    </div>
                </div>
                <button className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                    + Register Colorway
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {variant.colors?.map((color: any) => (
                    <div
                        key={color.id}
                        className="p-10 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm group hover:border-blue-500 hover:shadow-2xl transition-all relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 text-slate-300 hover:text-red-500 bg-slate-50 dark:bg-white/5 rounded-xl transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <div
                            className="w-20 h-20 rounded-full border-[6px] border-slate-50 dark:border-slate-800 shadow-2xl mb-8 group-hover:scale-110 transition-transform duration-500"
                            style={{
                                backgroundColor: color.name.includes('Grey')
                                    ? '#4b5563'
                                    : color.name.includes('White')
                                      ? '#f8fafc'
                                      : color.name.includes('Blue')
                                        ? '#2563eb'
                                        : '#000',
                            }}
                        />
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1 tracking-tight uppercase italic">
                            {color.name}
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 leading-none">
                            Catalog Verified
                        </p>

                        <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-[1.5rem] border border-slate-100 dark:border-white/10 relative group-hover:bg-blue-600/5 transition-colors">
                            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.4em] mb-2 font-mono leading-none">
                                Global System SKU
                            </p>
                            <code className="text-base font-black text-blue-600 dark:text-blue-400 font-mono tracking-tighter block break-all">
                                {color.sku}
                            </code>
                        </div>
                    </div>
                ))}

                <button className="p-10 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-blue-500 hover:bg-blue-500/5 transition-all text-center group flex flex-col items-center justify-center min-h-[340px]">
                    <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-[1.5rem] text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-all mb-4">
                        <Plus size={48} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] group-hover:text-blue-500 transition-colors">
                        Create SKU Entry
                    </span>
                </button>
            </div>
        </div>
    );
};
// @ts-nocheck
