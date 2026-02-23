'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Store, Warehouse, Wrench, Building, Trash2, Edit2, X, Save, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ServiceAreaManager } from '@/components/dashboard/dealers/ServiceAreaManager';

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
        if (!confirm('Are you sure you want to delete this location?')) return;

        const supabase = createClient();
        await supabase.from('id_locations').delete().eq('id', id);
        fetchLocations();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Physical Network</h3>
                    <p className="text-sm text-slate-500">Manage showrooms, warehouses, and service centers.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingLoc(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
                >
                    <Plus size={16} />
                    ADD LOCATION
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-400 text-sm">Loading locations...</div>
            ) : locations.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                    <MapPin className="mx-auto text-slate-300 mb-3" size={32} />
                    <p className="text-sm font-medium text-slate-900 dark:text-white">No locations added yet</p>
                    <p className="text-xs text-slate-500 mt-1">Add your first showroom or warehouse to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {locations.map(loc => (
                        <div
                            key={loc.id}
                            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 hover:shadow-lg transition-all relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            loc.type === 'SHOWROOM'
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : loc.type === 'WAREHOUSE'
                                                  ? 'bg-amber-50 text-amber-600'
                                                  : 'bg-cyan-50 text-cyan-600'
                                        }`}
                                    >
                                        {loc.type === 'SHOWROOM' && <Store size={18} />}
                                        {loc.type === 'WAREHOUSE' && <Warehouse size={18} />}
                                        {loc.type === 'SERVICE_CENTER' && <Wrench size={18} />}
                                        {loc.type === 'HEAD_OFFICE' && <Building size={18} />}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{loc.name}</h4>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            {loc.type.replace('_', ' ')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            setEditingLoc(loc);
                                            setIsModalOpen(true);
                                        }}
                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(loc.id)}
                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-start gap-2 text-xs text-slate-500">
                                    <MapPin size={14} className="mt-0.5 shrink-0" />
                                    <p className="line-clamp-2">
                                        {[loc.address_line_1, loc.address_line_2, loc.city, loc.state, loc.pincode]
                                            .filter(Boolean)
                                            .join(', ')}
                                    </p>
                                </div>
                                {(loc.contact_phone || loc.contact_email) && (
                                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                                        {loc.contact_phone && <span>📞 {loc.contact_phone}</span>}
                                        {loc.contact_email && <span>✉️ {loc.contact_email}</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
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

            <div className="pt-8 border-t border-slate-200 dark:border-white/10">
                <ServiceAreaManager tenantId={dealerId} />
            </div>
        </div>
    );
}

function LocationModal({ dealerId, initialData, onClose, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'SHOWROOM',
        address_line_1: '',
        district: '', // City/District
        taluka: '', // Block
        state: '',
        pincode: '',
        contact_phone: '',
        contact_email: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                type: initialData.type,
                address_line_1: initialData.address_line_1 || '',
                district: initialData.district || initialData.city || '',
                taluka: initialData.taluka || '',
                state: initialData.state || '',
                pincode: initialData.pincode || '',
                contact_phone: initialData.contact_phone || '',
                contact_email: initialData.contact_email || '',
            });
        }
    }, [initialData]);

    const handlePincodeChange = async (pincode: string) => {
        setFormData(prev => ({ ...prev, pincode }));

        if (pincode.length === 6) {
            setLookupLoading(true);
            try {
                // 1. Fetch address details from Postal Pincode API
                const postalRes = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
                const postalData = await postalRes.json();

                let foundState = '';
                let foundDistrict = '';
                let foundTaluka = '';

                if (postalData?.[0]?.Status === 'Success') {
                    const postOffice = postalData[0].PostOffice[0];
                    foundState = postOffice.State;
                    foundDistrict = postOffice.District;
                    foundTaluka = postOffice.Block;

                    setFormData(prev => ({
                        ...prev,
                        state: foundState,
                        district: foundDistrict,
                        taluka: foundTaluka,
                    }));
                }

                // 2. Fetch coordinates from Nominatim (OSM)
                const geoRes = await fetch(
                    `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json`,
                    {
                        headers: {
                            'Accept-Language': 'en-US,en;q=0.5',
                            'User-Agent': 'BookMyBike-App',
                        },
                    }
                );
                const geoData = await geoRes.json();

                if (geoData && geoData.length > 0) {
                    const { lat, lon } = geoData[0];
                    const latitude = parseFloat(lat);
                    const longitude = parseFloat(lon);

                    setFormData(
                        prev =>
                            ({
                                ...prev,
                                latitude,
                                longitude,
                            }) as any
                    );

                    // 3. Proactively update loc_pincodes if coords are missing there
                    // This powers the ServiceAreaManager proximity logic
                    const supabase = createClient();
                    const { data: existingPin } = await supabase
                        .from('loc_pincodes')
                        .select('latitude, longitude')
                        .eq('pincode', pincode)
                        .maybeSingle();

                    if (existingPin && (!(existingPin as any).latitude || !(existingPin as any).longitude)) {
                        await supabase
                            .from('loc_pincodes')
                            .update({
                                latitude,
                                longitude,
                                district: foundDistrict || (existingPin as any).district,
                                state: foundState || (existingPin as any).state,
                                taluka: foundTaluka || (existingPin as any).taluka,
                            })
                            .eq('pincode', pincode);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch pincode details', error);
            } finally {
                setLookupLoading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const supabase = createClient();

        try {
            // Exclude latitude/longitude - they don't exist in id_locations table
            const { latitude, longitude, ...cleanFormData } = formData as any;

            const payload = {
                ...cleanFormData,
                city: formData.district, // Map district to city for legacy compatibility
                tenant_id: dealerId,
            };

            // console.log('[LOCATION_DEBUG] Saving location:', payload);

            let error;
            if (initialData) {
                const result = await supabase.from('id_locations').update(payload).eq('id', initialData.id);
                error = result.error;
            } else {
                const result = await supabase.from('id_locations').insert(payload);
                error = result.error;
            }

            if (error) {
                console.error('[LOCATION_DEBUG] Save error:', error);
                alert(`Failed to save location: ${error.message}`);
            } else {
                onSuccess();
            }
        } catch (error: unknown) {
            console.error('[LOCATION_DEBUG] Exception:', error);
            alert(`Failed to save location: ${error?.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {initialData ? 'Edit Location' : 'Add New Location'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Location Name</label>
                            <input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Bandra West Showroom"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            />
                        </div>

                        <div className="col-span-1 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            >
                                <option value="SHOWROOM">Showroom</option>
                                <option value="WAREHOUSE">Warehouse</option>
                                <option value="SERVICE_CENTER">Service Center</option>
                                <option value="HEAD_OFFICE">Head Office</option>
                            </select>
                        </div>

                        <div className="col-span-1 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                Pincode
                                {lookupLoading && <span className="text-indigo-500 animate-pulse">Fetching...</span>}
                            </label>
                            <input
                                value={formData.pincode}
                                onChange={e => handlePincodeChange(e.target.value)}
                                maxLength={6}
                                placeholder="e.g. 400050"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Street Address</label>
                            <input
                                value={formData.address_line_1}
                                onChange={e => setFormData({ ...formData, address_line_1: e.target.value })}
                                placeholder="Shop No, Building, Street"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            />
                        </div>

                        <div className="col-span-1 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">State</label>
                            <input
                                value={formData.state}
                                readOnly
                                className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border-none rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed outline-none"
                            />
                        </div>

                        <div className="col-span-1 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">District</label>
                            <input
                                value={formData.district}
                                readOnly
                                className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border-none rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed outline-none"
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Taluka / Area</label>
                            <input
                                value={formData.taluka}
                                readOnly
                                className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border-none rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-indigo-700 transition-colors shadow-xl shadow-indigo-600/20 mt-4 disabled:opacity-50"
                    >
                        {loading ? 'SAVING...' : 'SAVE LOCATION'}
                    </button>
                </form>
            </div>
        </div>
    );
}
