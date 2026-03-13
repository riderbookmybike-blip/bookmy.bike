'use client';

import React, { useState, useEffect } from 'react';
import {
    Camera,
    Save,
    Building2,
    MapPin,
    Phone,
    Mail,
    Globe,
    Image as ImageIcon,
    CheckCircle2,
    AlertCircle,
    Fingerprint,
    Settings2,
    Activity,
    Search as SearchIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { checkServiceability } from '@/actions/serviceArea';
import LogoCropper from '@/components/ui/LogoCropper';
import { getErrorMessage } from '@/lib/utils/errorMessage';
import { toast } from 'sonner';

import { ChevronDown, Check, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatStudioId = (value: string) => {
    const upper = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 9);
    if (upper.length <= 3) return upper;
    if (upper.length <= 6) return `${upper.slice(0, 3)}-${upper.slice(3)}`;
    return `${upper.slice(0, 3)}-${upper.slice(3, 6)}-${upper.slice(6, 9)}`;
};

interface IdentitySettingsProps {
    dealer: any;
    onUpdate: () => void;
}

export default function IdentitySettings({ dealer, onUpdate }: IdentitySettingsProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadingFavicon, setUploadingFavicon] = useState(false);
    const [cropSource, setCropSource] = useState<string | null>(null);

    // Brand Selection State
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchBrand, setSearchBrand] = useState('');

    const [formData, setFormData] = useState({
        name: dealer.name || '',
        studio_id: dealer.studio_id || '',
        location: dealer.location || '',
        pincode: dealer.pincode || '',
        phone: dealer.phone || '',
        email: dealer.email || '',
        brand_type: dealer.brand_type || 'MONOBRAND',
    });

    const [allBrands, setAllBrands] = useState<{ id: string; name: string; logo_url: string | null }[]>([]);
    const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
    const [brandsLoading, setBrandsLoading] = useState(true);

    useEffect(() => {
        const fetchBrands = async () => {
            setBrandsLoading(true);
            const supabase = createClient();
            const [{ data: brands }, { data: dealerBrands }] = await Promise.all([
                supabase.from('cat_brands').select('id, name, logo_url').eq('is_active', true).order('name'),
                supabase.from('dealer_brands').select('brand_id').eq('tenant_id', dealer.id),
            ]);
            setAllBrands(brands || []);
            setSelectedBrandIds((dealerBrands || []).map((db: any) => db.brand_id));
            setBrandsLoading(false);
        };
        fetchBrands();
    }, [dealer.id]);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setCropSource(reader.result as string);
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleCroppedUpload = async (blob: Blob) => {
        setUploading(true);
        try {
            const supabase = createClient();
            const fileName = `logo-${dealer.id}-${Date.now()}.png`;
            const { error: uploadError } = await supabase.storage
                .from('id_tenants')
                .upload(fileName, blob, { upsert: true, contentType: 'image/png' });

            if (uploadError) throw uploadError;

            const {
                data: { publicUrl },
            } = supabase.storage.from('id_tenants').getPublicUrl(fileName);
            const { error: updateError } = await supabase
                .from('id_tenants')
                .update({ logo_url: publicUrl })
                .eq('id', dealer.id);
            if (updateError) throw updateError;

            setCropSource(null);
            onUpdate();
            toast.success('Corporate identity updated');
        } catch (error) {
            console.error('Error uploading logo:', error);
            toast.error('Failed to upload logo');
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
                .update({
                    ...formData,
                    studio_id: formData.studio_id.trim() || null,
                })
                .eq('id', dealer.id);
            if (error) throw error;

            await supabase.from('dealer_brands').delete().eq('tenant_id', dealer.id);
            if (selectedBrandIds.length > 0) {
                await supabase.from('dealer_brands').insert(
                    selectedBrandIds.map((brandId, idx) => ({
                        tenant_id: dealer.id,
                        brand_id: brandId,
                        is_primary: idx === 0,
                    }))
                );
            }
            onUpdate();
            toast.success('Operational DNA synchronized');
        } catch (error: any) {
            toast.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const filteredBrandsForMenu = allBrands.filter(
        b =>
            !['GENERIC', 'AUTOCARE', "O'CLUB PRIVILLAGE", 'RAI TECH', 'STUDDS'].includes(b.name) &&
            b.name.toLowerCase().includes(searchBrand.toLowerCase())
    );

    const toggleBrand = (brandId: string) => {
        if (formData.brand_type === 'MONOBRAND') {
            setSelectedBrandIds([brandId]);
            setIsMenuOpen(false);
        } else {
            setSelectedBrandIds(prev =>
                prev.includes(brandId) ? prev.filter(id => id !== brandId) : [...prev, brandId]
            );
        }
    };

    const removeBrand = (brandId: string) => {
        setSelectedBrandIds(prev => prev.filter(id => id !== brandId));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {cropSource && (
                <LogoCropper src={cropSource} onCancel={() => setCropSource(null)} onComplete={handleCroppedUpload} />
            )}

            {/* Assets Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <div className="relative group shrink-0">
                        <div className="w-20 h-20 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden shadow-inner">
                            {dealer.logo_url ? (
                                <img src={dealer.logo_url} className="w-full h-full object-contain p-2" alt="" />
                            ) : (
                                <Building2 size={32} className="text-slate-200" />
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center animate-pulse" />
                            )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 p-1.5 bg-slate-900 text-white rounded-lg cursor-pointer hover:bg-indigo-600 transition-all shadow-lg border-2 border-white">
                            <Camera size={14} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        </label>
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                            Corporate Identity
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-bold uppercase tracking-widest opacity-70">
                            Official high-fidelity logo for
                            <br />
                            system white-labeling.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <div className="relative group shrink-0">
                        <div className="w-20 h-20 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden shadow-inner">
                            {dealer.favicon_url ? (
                                <img src={dealer.favicon_url} className="w-full h-full object-contain p-4" alt="" />
                            ) : (
                                <ImageIcon size={24} className="text-slate-200" />
                            )}
                            {uploadingFavicon && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center animate-pulse" />
                            )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 p-1.5 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-all shadow-lg border-2 border-white">
                            <ImageIcon size={14} />
                            <input
                                type="file"
                                className="hidden"
                                accept="image/png,image/x-icon"
                                onChange={async e => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setUploadingFavicon(true);
                                    const supabase = createClient();
                                    const { error: upErr } = await supabase.storage
                                        .from('id_tenants')
                                        .upload(`fav-${Date.now()}.png`, file);
                                    if (!upErr) {
                                        const { data } = supabase.storage
                                            .from('id_tenants')
                                            .getPublicUrl(`fav-${Date.now()}.png`);
                                        await supabase
                                            .from('id_tenants')
                                            .update({ favicon_url: data.publicUrl })
                                            .eq('id', dealer.id);
                                        onUpdate();
                                        toast.success('Schema asset updated');
                                    }
                                    setUploadingFavicon(false);
                                }}
                            />
                        </label>
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Schema Asset</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-bold uppercase tracking-widest opacity-70">
                            Deployment icon used for
                            <br />
                            browser tab identification.
                        </p>
                    </div>
                </div>
            </div>

            {/* Configuration Suite */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-indigo-500 shadow-sm">
                            <Settings2 size={16} />
                        </div>
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">
                            Operational DNA Configuration
                        </h3>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all disabled:opacity-50 shadow-lg shadow-slate-900/10 flex items-center gap-2"
                    >
                        {loading ? <Activity size={12} className="animate-spin" /> : <Save size={12} />}
                        {loading ? 'SYNCING...' : 'APPLY CONTEXT'}
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            Trading Designation
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-5 py-3 bg-[#fcfdfe] border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                            placeholder="Enterprise Name"
                        />
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            Studio Identifier
                        </label>
                        <input
                            type="text"
                            value={formData.studio_id}
                            maxLength={3}
                            onChange={e => setFormData({ ...formData, studio_id: formatStudioId(e.target.value) })}
                            className="w-full px-5 py-3 bg-[#fcfdfe] border border-slate-200 rounded-xl text-sm font-black text-indigo-600 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                            placeholder="e.g. 48J"
                        />
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            Regional Center
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-5 py-3 bg-[#fcfdfe] border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                        />
                    </div>

                    {/* Brand Protocol Dropdown Suite */}
                    <div className="col-span-1 lg:col-span-2 space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Brand Protocol
                                </label>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest opacity-60">
                                    Define nodal brand authorization.
                                </p>
                            </div>
                            <div className="flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm self-start">
                                {['MONOBRAND', 'MULTIBRAND'].map(bt => (
                                    <button
                                        key={bt}
                                        onClick={() => {
                                            setFormData({ ...formData, brand_type: bt });
                                            if (bt === 'MONOBRAND')
                                                setSelectedBrandIds(prev => [prev[0]].filter(Boolean));
                                        }}
                                        className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${formData.brand_type === bt ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {bt.replace('BRAND', '')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block px-1">
                                Authorized Registry
                            </label>

                            {/* Selected Brands Area */}
                            <div
                                onClick={() => setIsMenuOpen(prev => !prev)}
                                className={`min-h-[50px] p-2 bg-white border border-slate-200 rounded-xl flex flex-wrap gap-1.5 cursor-pointer hover:border-indigo-500/30 transition-all ${isMenuOpen ? 'ring-4 ring-indigo-500/5 border-indigo-500/50' : ''}`}
                            >
                                {selectedBrandIds.length === 0 ? (
                                    <div className="flex items-center justify-between w-full px-3 py-1.5">
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                                            Select Brands...
                                        </span>
                                        <ChevronDown
                                            size={14}
                                            className={`text-slate-300 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        {selectedBrandIds.map(id => {
                                            const b = allBrands.find(brand => brand.id === id);
                                            return b ? (
                                                <div
                                                    key={id}
                                                    className="flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 group"
                                                >
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        {b.name}
                                                    </span>
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            removeBrand(id);
                                                        }}
                                                        className="p-0.5 hover:bg-indigo-200 rounded-md transition-colors"
                                                    >
                                                        <CloseIcon size={12} />
                                                    </button>
                                                </div>
                                            ) : null;
                                        })}
                                        <div className="ml-auto px-2 flex items-center">
                                            <ChevronDown
                                                size={14}
                                                className={`text-slate-300 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {isMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 overflow-hidden flex flex-col max-h-[300px]"
                                        >
                                            <div className="p-3 border-b border-slate-50 sticky top-0 bg-white z-10">
                                                <div className="relative">
                                                    <SearchIcon
                                                        size={14}
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                                                    />
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={searchBrand}
                                                        onChange={e => setSearchBrand(e.target.value)}
                                                        placeholder="Search brand registry..."
                                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-[11px] font-bold text-slate-900 focus:ring-0 placeholder:text-slate-300"
                                                        onClick={e => e.stopPropagation()}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-0.5">
                                                {brandsLoading ? (
                                                    <div className="py-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse">
                                                        Synchronizing Registry...
                                                    </div>
                                                ) : filteredBrandsForMenu.length === 0 ? (
                                                    <div className="py-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                        No brand protocol found
                                                    </div>
                                                ) : (
                                                    filteredBrandsForMenu.map(brand => {
                                                        const isSelected = selectedBrandIds.includes(brand.id);
                                                        return (
                                                            <button
                                                                key={brand.id}
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    toggleBrand(brand.id);
                                                                }}
                                                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isSelected ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                                                    />
                                                                    <span className="text-[11px] font-black uppercase tracking-widest">
                                                                        {brand.name}
                                                                    </span>
                                                                </div>
                                                                {isSelected && <Check size={14} />}
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            Nodal Post-Index (Pincode)
                        </label>
                        <input
                            type="text"
                            value={formData.pincode}
                            onChange={e =>
                                setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })
                            }
                            maxLength={6}
                            className="w-full px-5 py-3 bg-[#fcfdfe] border border-slate-200 rounded-xl text-sm font-black text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                            placeholder="000 000"
                        />
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            Direct Mail Address
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-5 py-3 bg-[#fcfdfe] border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                        />
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            Operational Phone
                        </label>
                        <input
                            type="text"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-5 py-3 bg-[#fcfdfe] border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
