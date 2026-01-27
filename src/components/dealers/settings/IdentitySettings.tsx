'use client';

import React, { useState } from 'react';
import { Camera, Save, Building2, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

interface IdentitySettingsProps {
    dealer: any;
    onUpdate: () => void;
}

export default function IdentitySettings({ dealer, onUpdate }: IdentitySettingsProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: dealer.name || '',
        location: dealer.location || '',
        pincode: dealer.pincode || '',
        phone: dealer.phone || '',
        email: dealer.email || '',
        website: dealer.website || '' // Assuming we might add website later, or use map_link
    });

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `logo-${dealer.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('tenants')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('tenants')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('id_tenants')
                .update({ logo_url: publicUrl })
                .eq('id', dealer.id);

            if (updateError) throw updateError;

            onUpdate(); // Refresh parent
        } catch (error) {
            console.error('Error uploading logo:', error);
            alert('Failed to upload logo');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('id_tenants')
                .update(formData)
                .eq('id', dealer.id);

            if (error) throw error;
            onUpdate();
            alert('Details updated successfully');
        } catch (error) {
            console.error('Error updating details:', error);
            alert('Failed to update details');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">

                {/* Logo Section */}
                <div className="w-full md:w-auto flex flex-col items-center gap-4">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-3xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-sm">
                            {dealer.logo_url ? (
                                <Image
                                    src={dealer.logo_url}
                                    alt="Dealer Logo"
                                    width={128}
                                    height={128}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <Building2 size={40} className="text-slate-300" />
                            )}

                            {uploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>

                        <label className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                            <Camera size={16} />
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                disabled={uploading}
                            />
                        </label>
                    </div>
                    <div className="text-center">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Brand Logo</h3>
                        <p className="text-xs text-slate-400 mt-1">Recommended: 512x512px PNG</p>
                    </div>
                </div>

                {/* Info Form */}
                <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Basic Information</h3>
                            <p className="text-sm text-slate-500">Public details visible on the network.</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {loading ? 'SAVING...' : (
                                <>
                                    <Save size={16} />
                                    SAVE CHANGES
                                </>
                            )}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trading Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-3.5 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location / City</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-3.5 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pincode</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-3.5 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={formData.pincode}
                                    onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 text-slate-400" size={16} />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-3.5 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
