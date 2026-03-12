'use client';

import React, { useState, useEffect } from 'react';
import {
    MapPin,
    Plus,
    Store,
    Warehouse,
    Wrench,
    Building,
    Trash2,
    Edit2,
    X,
    Navigation,
    Search,
    Activity,
    Loader2,
    Globe,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getErrorMessage } from '@/lib/utils/errorMessage';
import { toast } from 'sonner';

interface LocationSettingsProps {
    dealerId: string;
}

export default function LocationSettings({ dealerId }: LocationSettingsProps) {
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLoc, setEditingLoc] = useState<any>(null);

    const fetchLocations = async () => {
        setLoading(true);
        const supabase = createClient();
        const { data } = await supabase
            .from('id_locations')
            .select('*')
            .eq('tenant_id', dealerId)
            .order('created_at', { ascending: false });

        if (data) setLocations(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchLocations();
    }, [dealerId]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this node?')) return;
        const supabase = createClient();
        const { error } = await supabase.from('id_locations').delete().eq('id', id);
        if (error) {
            toast.error('Failed to decommission node');
        } else {
            toast.success('Node decommissioned');
            fetchLocations();
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="flex items-center gap-5 relative z-10">
                    <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform duration-500">
                        <MapPin size={28} />
                    </div>
                    <div>
                        <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">
                            Operational Grid Framework
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 opacity-70 flex items-center gap-2">
                            <Activity size={12} className="text-emerald-500" /> Manage physical nodal facility
                            coordinates.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingLoc(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-3 px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 z-10"
                >
                    <Plus size={16} /> Define New Node
                </button>
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                    <Globe size={180} />
                </div>
            </div>

            {/* Grid List */}
            {loading ? (
                <div className="py-24 bg-white/50 border border-slate-100 rounded-3xl flex justify-center items-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {locations.map(loc => (
                        <div
                            key={loc.id}
                            className="bg-white border border-slate-200 rounded-2xl p-6 transition-all hover:border-indigo-400/50 hover:shadow-xl hover:shadow-slate-200/20 group relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner ${
                                            loc.type === 'SHOWROOM'
                                                ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/10'
                                                : loc.type === 'WAREHOUSE'
                                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/10'
                                                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10'
                                        }`}
                                    >
                                        {loc.type === 'SHOWROOM' && <Store size={22} />}
                                        {loc.type === 'WAREHOUSE' && <Warehouse size={22} />}
                                        {loc.type === 'SERVICE_CENTER' && <Wrench size={22} />}
                                        {loc.type === 'HEAD_OFFICE' && <Building size={22} />}
                                    </div>
                                    <div>
                                        <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-tight">
                                            {loc.name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                {loc.type.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-300">
                                    <button
                                        onClick={() => {
                                            setEditingLoc(loc);
                                            setIsModalOpen(true);
                                        }}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-transparent hover:border-indigo-100 transition-all"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(loc.id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                <div className="flex items-start gap-3">
                                    <MapPin size={14} className="text-slate-300 mt-0.5" />
                                    <div>
                                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed uppercase tracking-wider opacity-80">
                                            {[loc.address_line_1, loc.address_line_2, loc.city, loc.state, loc.pincode]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </p>
                                        {(loc.lat || loc.lng) && (
                                            <p className="text-[9px] text-indigo-400 font-black mt-1.5 flex items-center gap-1.5 uppercase tracking-widest">
                                                <Navigation size={10} /> {loc.lat?.toFixed(6)}, {loc.lng?.toFixed(6)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[9px] font-black text-slate-300 uppercase tracking-widest pt-2">
                                    <span>UID: {loc.id.slice(0, 8).toUpperCase()}</span>
                                    <div className="flex items-center gap-3">
                                        {loc.map_link && (
                                            <a
                                                href={
                                                    loc.map_link.startsWith('http')
                                                        ? loc.map_link
                                                        : `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-400 hover:text-indigo-600 transition-colors"
                                            >
                                                MAP LINK
                                            </a>
                                        )}
                                        <span
                                            className={`flex items-center gap-1.5 ${loc.lat ? 'text-emerald-400' : 'text-slate-200'}`}
                                        >
                                            <Activity size={10} /> {loc.lat ? 'CALIBRATED' : 'UNCALIBRATED'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {locations.length === 0 && (
                        <div className="col-span-full py-20 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center">
                            <MapPin size={32} className="text-slate-100 mb-4" />
                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                Deployment Grid Empty
                            </p>
                            <p className="text-[10px] text-slate-200 mt-2 font-bold uppercase tracking-widest leading-relaxed">
                                No operational nodes detected in this sector.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <LocationModal
                    dealerId={dealerId}
                    initialData={editingLoc}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchLocations();
                    }}
                />
            )}
        </div>
    );
}

function LocationModal({ dealerId, initialData, onClose, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [calibrating, setCalibrating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'SHOWROOM',
        address_line_1: '',
        address_line_2: '',
        district: '',
        state: '',
        pincode: '',
        contact_phone: '',
        contact_email: '',
        lat: null as number | null,
        lng: null as number | null,
        map_link: '',
    });

    useEffect(() => {
        if (initialData)
            setFormData({
                name: initialData.name,
                type: initialData.type,
                address_line_1: initialData.address_line_1 || '',
                address_line_2: initialData.address_line_2 || '',
                district: initialData.district || initialData.city || '',
                state: initialData.state || '',
                pincode: initialData.pincode || '',
                contact_phone: initialData.contact_phone || '',
                contact_email: initialData.contact_email || '',
                lat: initialData.lat || null,
                lng: initialData.lng || null,
                map_link: initialData.map_link || '',
            });
    }, [initialData]);

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }
        setCalibrating(true);
        navigator.geolocation.getCurrentPosition(
            position => {
                setFormData(prev => ({
                    ...prev,
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                }));
                setCalibrating(false);
                toast.success('Geo-coordinates calibrated');
            },
            error => {
                console.error(error);
                setCalibrating(false);
                toast.error('Failed to acquire signal');
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const supabase = createClient();
        try {
            const payload = {
                ...formData,
                city: formData.district,
                tenant_id: dealerId,
            };
            let err;
            if (initialData) {
                const res = await supabase.from('id_locations').update(payload).eq('id', initialData.id);
                err = res.error;
            } else {
                const res = await supabase.from('id_locations').insert(payload);
                err = res.error;
            }
            if (!err) {
                toast.success('Node configuration deployed');
                onSuccess();
            } else toast.error(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                            <Navigation size={22} className={calibrating ? 'animate-pulse' : ''} />
                        </div>
                        <div>
                            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-[0.2em]">
                                {initialData ? 'Calibrate Operation Node' : 'Establish New Node Vector'}
                            </h3>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">
                                Physical infrastructure deployment framework.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-white rounded-2xl text-slate-400 transition-all border border-transparent hover:border-slate-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                    {/* Primary Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="sm:col-span-2 space-y-2.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                                Node Designation
                            </label>
                            <input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-black text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                                placeholder="e.g. South Hub Showroom"
                            />
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                                Operational Protocol
                            </label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[12px] font-black text-slate-900 uppercase tracking-[0.15em] outline-none focus:bg-white focus:border-indigo-500/50 transition-all cursor-pointer"
                            >
                                <option value="SHOWROOM">SHOWROOM</option>
                                <option value="WAREHOUSE">WAREHOUSE</option>
                                <option value="SERVICE_CENTER">SERVICE_CENTER</option>
                                <option value="HEAD_OFFICE">HEAD_OFFICE</option>
                            </select>
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                                Registry Pincode
                            </label>
                            <input
                                maxLength={6}
                                value={formData.pincode}
                                onChange={e => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-black text-indigo-600 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500/50 transition-all outline-none"
                                placeholder="6-Digit Vector"
                            />
                        </div>
                    </div>

                    {/* Geography Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-1">
                            <MapPin size={14} className="text-slate-300" />
                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">
                                Geographic Deployment
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                            <div className="sm:col-span-2 space-y-2.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Primary Access Layer (Address Line 1)
                                </label>
                                <input
                                    value={formData.address_line_1}
                                    onChange={e => setFormData({ ...formData, address_line_1: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-900 placeholder:text-slate-300 focus:border-indigo-500/50 transition-all outline-none"
                                    placeholder="Unit / Street / Building"
                                />
                            </div>
                            <div className="sm:col-span-2 space-y-2.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Secondary Descriptor (Plus Code / Landmarks)
                                </label>
                                <input
                                    value={formData.address_line_2}
                                    onChange={e => setFormData({ ...formData, address_line_2: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-900 placeholder:text-slate-300 focus:border-indigo-500/50 transition-all outline-none"
                                    placeholder="e.g. Next to Metro Station or CRC5+7W"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Sector (City/District)
                                </label>
                                <input
                                    value={formData.district}
                                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-900 placeholder:text-slate-300 focus:border-indigo-500/50 transition-all outline-none"
                                    placeholder="e.g. Mumbai"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    State Jurisdiction
                                </label>
                                <input
                                    value={formData.state}
                                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-900 placeholder:text-slate-300 focus:border-indigo-500/50 transition-all outline-none"
                                    placeholder="e.g. Maharashtra"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Vector Calibration (Coordinates) */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-3">
                                <Activity size={14} className="text-emerald-500" />
                                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">
                                    Node Calibration (Coordinates)
                                </h4>
                            </div>
                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                disabled={calibrating}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
                            >
                                {calibrating ? (
                                    <Loader2 size={12} className="animate-spin" />
                                ) : (
                                    <Navigation size={12} />
                                )}
                                {calibrating ? 'Acquiring Signal...' : 'Calibrate Vector'}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-indigo-50/30 p-8 rounded-[2rem] border border-indigo-100/50">
                            <div className="space-y-2.5">
                                <label className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                                    Latitude
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={formData.lat || ''}
                                    onChange={e =>
                                        setFormData({
                                            ...formData,
                                            lat: e.target.value ? parseFloat(e.target.value) : null,
                                        })
                                    }
                                    className="w-full px-5 py-3.5 bg-white border border-indigo-100 rounded-xl text-[12px] font-black text-indigo-900 placeholder:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                    placeholder="0.000000"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                                    Longitude
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={formData.lng || ''}
                                    onChange={e =>
                                        setFormData({
                                            ...formData,
                                            lng: e.target.value ? parseFloat(e.target.value) : null,
                                        })
                                    }
                                    className="w-full px-5 py-3.5 bg-white border border-indigo-100 rounded-xl text-[12px] font-black text-indigo-900 placeholder:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                    placeholder="0.000000"
                                />
                            </div>
                            <div className="sm:col-span-2 lg:col-span-1 space-y-2.5">
                                <label className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                                    Global Navigation Link
                                </label>
                                <input
                                    value={formData.map_link}
                                    onChange={e => setFormData({ ...formData, map_link: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-white border border-indigo-100 rounded-xl text-[11px] font-bold text-indigo-900 placeholder:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                    placeholder="Google Maps URL or Plus Code"
                                />
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer Controls */}
                <div className="px-10 py-8 border-t border-slate-100 bg-white shrink-0">
                    <div className="flex gap-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100"
                        >
                            Abort Protocol
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-4 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {loading ? 'DEPLOYING VECTOR...' : 'SYNC CONFIGURATION'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const Save = ({ size, className }: { size?: number; className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);
