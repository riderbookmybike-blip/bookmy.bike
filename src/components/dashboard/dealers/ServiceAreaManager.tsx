'use client';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Plus, MapPin, Loader2, Navigation } from 'lucide-react';
import { toast } from 'sonner';

// Haversine formula for distance calculation
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export const ServiceAreaManager = ({
    tenantId,
    defaultStateCode = 'MH',
}: {
    tenantId: string;
    defaultStateCode?: string;
}) => {
    const [areas, setAreas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newDistrict, setNewDistrict] = useState('');
    const [adding, setAdding] = useState(false);
    const [primaryMap, setPrimaryMap] = useState<Record<string, string>>({});
    const [primaryUpdating, setPrimaryUpdating] = useState<string | null>(null);

    // Proximity state
    const [homeInfo, setHomeInfo] = useState<{ district: string; lat: number; lon: number } | null>(null);
    const [allDistricts, setAllDistricts] = useState<any[]>([]); // { name, lat, lon, distance? }
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const supabase = createClient();

    const fetchHomeLocation = async () => {
        // 1. Get dealer's head office pincode
        const { data: locs } = await supabase
            .from('id_locations')
            .select('pincode, district')
            .eq('tenant_id', tenantId)
            .order('type', { ascending: false }); // Prioritize HEAD_OFFICE if sorted by enum-like logic

        const dealerLoc = locs?.[0];
        if (!dealerLoc?.pincode) return;

        // 2. Resolve coords for this pincode
        const { data: pinData } = await supabase
            .from('loc_pincodes')
            .select('district, latitude, longitude')
            .eq('pincode', dealerLoc.pincode)
            .limit(1)
            .single();

        if (pinData) {
            setHomeInfo({
                district: pinData.district,
                lat: parseFloat(pinData.latitude),
                lon: parseFloat(pinData.longitude),
            });
        }
    };

    const fetchAllDistricts = async () => {
        // Fetch all unique districts in the state with their avg coordinates
        const { data } = await supabase.rpc('get_state_districts', { p_state_code: defaultStateCode });

        if (data) {
            setAllDistricts(data);
        } else {
            // Fallback: simple query if RPC doesn't exist (assuming we might need to create it)
            const { data: fallbackData } = await supabase
                .from('loc_pincodes')
                .select('district, latitude, longitude')
                .eq('state_code', defaultStateCode);

            if (fallbackData) {
                // Deduplicate and format
                const unique = new Map();
                fallbackData.forEach((p: any) => {
                    if (!unique.has(p.district)) {
                        unique.set(p.district, {
                            name: p.district,
                            lat: parseFloat(p.latitude),
                            lon: parseFloat(p.longitude),
                        });
                    }
                });
                setAllDistricts(Array.from(unique.values()));
            }
        }
    };

    const fetchAreas = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('id_dealer_service_areas').select('*').eq('tenant_id', tenantId);

        if (data) {
            setAreas(data);

            // Defaulting Logic: If no areas exist but we have home info, add home district
            // We use a separate check to avoid repeated attempts if the add is in progress
            if (data.length === 0 && homeInfo && !adding) {
                // Check if it really doesn't exist (safety)
                const alreadyHasHome = data.some(a => a.district === homeInfo.district);
                if (!alreadyHasHome) {
                    await addDistrict(homeInfo.district, true);
                }
            }
        }
        setLoading(false);
    };

    const fetchPrimaryMappings = async (districts: string[]) => {
        if (!districts || districts.length === 0) {
            setPrimaryMap({});
            return;
        }

        const { data } = await supabase
            .from('id_primary_dealer_districts')
            .select('district, tenant_id, is_active')
            .eq('state_code', defaultStateCode)
            .in('district', districts);

        const nextMap: Record<string, string> = {};
        (data || []).forEach((row: any) => {
            if (row?.is_active && row?.district) {
                nextMap[String(row.district).toLowerCase()] = row.tenant_id;
            }
        });
        setPrimaryMap(nextMap);
    };

    useEffect(() => {
        const init = async () => {
            if (tenantId) {
                await fetchHomeLocation();
                await fetchAllDistricts();
            }
        };
        init();
    }, [tenantId]);

    // Re-fetch areas once homeInfo is ready if empty
    useEffect(() => {
        if (tenantId && homeInfo) {
            fetchAreas();
        }
    }, [tenantId, homeInfo?.district]); // Depend on the specific district name to avoid loops

    useEffect(() => {
        if (areas.length > 0) {
            const districts = areas.map(a => a.district).filter(Boolean);
            fetchPrimaryMappings(districts);
        }
    }, [areas, defaultStateCode]);

    const addDistrict = async (name: string, isSilent = false) => {
        const districtName = (name || newDistrict).trim();
        if (!districtName) return;

        // Prevention: check local state first
        if (areas.some(a => a.district.toLowerCase() === districtName.toLowerCase())) {
            if (!isSilent) toast.info(`${districtName} is already in your service areas`);
            setNewDistrict('');
            setIsDropdownOpen(false);
            return;
        }

        setAdding(true);

        // Use UPSERT instead of INSERT to be idempotent and avoid constraint errors
        const { error } = await supabase.from('id_dealer_service_areas').upsert(
            {
                tenant_id: tenantId,
                district: districtName,
                state_code: defaultStateCode,
                is_active: true,
            },
            {
                onConflict: 'tenant_id, district',
            }
        );

        if (error) {
            console.error('Add district error:', error);
            if (!isSilent) toast.error(`Failed to add ${districtName}`);
        } else {
            if (!isSilent) toast.success(`${districtName} added to service areas`);
            setNewDistrict('');
            setIsDropdownOpen(false);
            // Refresh state
            const { data: updatedData } = await supabase
                .from('id_dealer_service_areas')
                .select('*')
                .eq('tenant_id', tenantId);
            if (updatedData) setAreas(updatedData);
        }
        setAdding(false);
    };

    const removeArea = async (id: string) => {
        const { error } = await supabase.from('id_dealer_service_areas').delete().eq('id', id);

        if (error) {
            toast.error('Failed to remove district');
        } else {
            toast.success('District removed');
            setAreas(prev => prev.filter(a => a.id !== id));
        }
    };

    const makePrimary = async (district: string) => {
        const safeDistrict = (district || '').trim();
        if (!safeDistrict) return;
        setPrimaryUpdating(safeDistrict);
        const { error } = await supabase.rpc('set_primary_dealer_for_district', {
            p_tenant_id: tenantId,
            p_district: safeDistrict,
            p_state_code: defaultStateCode,
        });
        if (error) {
            console.error('Primary dealer update error:', error);
            toast.error(`Failed to set primary for ${safeDistrict}`);
        } else {
            toast.success(`${safeDistrict} set as primary`);
            const districts = areas.map(a => a.district).filter(Boolean);
            fetchPrimaryMappings(districts);
        }
        setPrimaryUpdating(null);
    };

    // Calculate distances and sort
    const sortedDistricts = useMemo(() => {
        if (!homeInfo) return allDistricts;

        return allDistricts
            .map(d => ({
                ...d,
                distance: getDistance(homeInfo.lat, homeInfo.lon, d.lat, d.lon),
            }))
            .sort((a, b) => (a.distance || 0) - (b.distance || 0))
            .filter(d => !areas.some(a => a.district === d.name)); // Filter out already added
    }, [allDistricts, homeInfo, areas]);

    const filteredSuggestions = useMemo(() => {
        if (!newDistrict) return sortedDistricts.slice(0, 5);
        return sortedDistricts.filter(d => d.name.toLowerCase().includes(newDistrict.toLowerCase())).slice(0, 10);
    }, [newDistrict, sortedDistricts]);

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Serviceable Areas</h3>
            <p className="text-sm text-slate-500 mb-6">Manage the districts where this dealer provides service.</p>

            <div className="flex gap-2 mb-6 relative">
                <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        value={newDistrict}
                        onChange={e => {
                            setNewDistrict(e.target.value);
                            setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        placeholder="Search & Add District..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-500/50 rounded-2xl text-sm font-bold outline-none text-slate-900 dark:text-white transition-all"
                        onKeyDown={e => e.key === 'Enter' && addDistrict(newDistrict)}
                    />

                    {/* Proximity Dropdown */}
                    {isDropdownOpen && filteredSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-2 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2">
                                Suggested by Proximity
                            </div>
                            <div className="max-h-64 overflow-auto">
                                {filteredSuggestions.map(d => (
                                    <button
                                        key={d.name}
                                        onClick={() => addDistrict(d.name)}
                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                                <Navigation
                                                    size={14}
                                                    className="group-hover:rotate-45 transition-transform"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {d.name}
                                                </p>
                                                {homeInfo?.district === d.name && (
                                                    <span className="text-[10px] text-green-500 font-black uppercase">
                                                        Home District
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {d.distance !== undefined && (
                                            <span className="text-[10px] font-mono opacity-40 shrink-0">
                                                {isNaN(d.distance!) ? 'Dist. Unknown' : `${Math.round(d.distance!)} km`}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => addDistrict(newDistrict)}
                    disabled={adding || !newDistrict}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                    {adding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                </button>

                {/* Backdrop to close dropdown */}
                {isDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 italic">
                    <Loader2 className="animate-spin mb-2" size={24} />
                    <p className="text-xs uppercase tracking-widest font-bold">Mapping Territory...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Active Service Coverage
                    </h4>
                    <div className="flex flex-wrap gap-3">
                        {areas.map(area => (
                            <div
                                key={area.id}
                                className="group flex items-center gap-3 pl-4 pr-2 py-2 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-500/10 dark:to-slate-900 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-100/50 dark:border-indigo-500/20 shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex flex-col">
                                    <span className="text-xs font-black uppercase tracking-tight">{area.district}</span>
                                    {primaryMap[String(area.district).toLowerCase()] === tenantId && (
                                        <span className="text-[8px] font-black text-amber-500 uppercase">
                                            Primary Dealer
                                        </span>
                                    )}
                                </div>
                                {primaryMap[String(area.district).toLowerCase()] !== tenantId && (
                                    <button
                                        onClick={() => makePrimary(area.district)}
                                        disabled={primaryUpdating === area.district}
                                        className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                                    >
                                        {primaryUpdating === area.district ? 'Setting...' : 'Make Primary'}
                                    </button>
                                )}
                                <button
                                    onClick={() => removeArea(area.id)}
                                    className="p-1 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        {areas.length === 0 && (
                            <div className="w-full py-8 text-center bg-slate-50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-slate-100 dark:border-white/5 text-slate-400 text-sm italic">
                                No service areas configured yet.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
