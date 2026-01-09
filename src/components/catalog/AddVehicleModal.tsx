'use client';

import React, { useState } from 'react';
import { X, Loader2, Save, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AddVehicleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddVehicleModal({ isOpen, onClose, onSuccess }: AddVehicleModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'BIKE',
        make: '',
        model: '',
        variant: '',
        color: '',
        price: '',
        image_url: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const supabase = createClient();
            const { error } = await supabase.from('items').insert([{
                type: formData.type,
                make: formData.make,
                model: formData.model,
                variant: formData.variant,
                color: formData.color,
                price: Number(formData.price),
                image_url: formData.image_url,
                is_active: true
            }]);

            if (error) throw error;

            onSuccess();
            onClose();
            setFormData({ type: 'BIKE', make: '', model: '', variant: '', color: '', price: '', image_url: '' });

        } catch (error: any) {
            console.error('Error adding vehicle:', error);
            alert('Failed to add vehicle: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Add New Vehicle</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-slate-900">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                            >
                                <option value="MOTORCYCLE">MOTORCYCLE</option>
                                <option value="SCOOTER">SCOOTER</option>
                                <option value="MOPED">MOPED</option>
                                <option value="CAR">CAR</option>
                                <option value="ACCESSORY">ACCESSORY</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Make</label>
                            <input
                                required
                                placeholder="e.g. Honda"
                                value={formData.make}
                                onChange={e => setFormData({ ...formData, make: e.target.value })}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Model Name</label>
                        <input
                            required
                            placeholder="e.g. City 5th Gen"
                            value={formData.model}
                            onChange={e => setFormData({ ...formData, model: e.target.value })}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Variant</label>
                            <input
                                required
                                placeholder="e.g. V CVT"
                                value={formData.variant}
                                onChange={e => setFormData({ ...formData, variant: e.target.value })}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Color</label>
                            <input
                                required
                                placeholder="e.g. Radiant Red"
                                value={formData.color}
                                onChange={e => setFormData({ ...formData, color: e.target.value })}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ex-Showroom Price (₹)</label>
                        <input
                            required
                            type="number"
                            placeholder="0.00"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Image URL</label>
                        <div className="flex gap-2">
                            <input
                                placeholder="https://..."
                                value={formData.image_url}
                                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                className="flex-1 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                            />
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/20 flex items-center justify-center shrink-0">
                                {formData.image_url ? (
                                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover rounded-xl" onError={(e) => e.currentTarget.style.display = 'none'} />
                                ) : (
                                    <Upload size={16} className="text-slate-400" />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-3 rounded-xl font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50 transition-all"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Save Vehicle
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
