'use client';

import React, { useState, useEffect } from 'react';
import {
    MapPin,
    Search,
    CheckCircle2,
    XCircle,
    Filter,
    ChevronRight,
    Loader2,
    Building2,
    Map as MapIcon,
    Zap,
    LayoutGrid,
    ListFilter,
    Edit3,
    Settings,
    Plus,
    Minus,
    RotateCcw,
    Maximize2,
    Minimize2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Haversine Distance Helper
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371;
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

function toTitleCase(str: string | null | undefined): string {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
}

function normalizeRTO(rto: string | null | undefined): string {
    if (!rto) return '';
    return rto.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

// Interfaces
interface Pincode {
    pincode: string;
    area: string | null;
    taluka: string | null;
    district: string | null;
    state: string | null;
    status: string | null;
    zone: string | null;
    pricing: string | null;
    latitude: number | null;
    longitude: number | null;
    rto_code: string | null;
}

interface GeoFeature {
    type: string;
    properties: {
        district: string;
        dt_code?: string;
        st_nm?: string;
        dtname?: string; // Some generic usage
    };
    geometry: {
        type: string;
        coordinates: any[];
    };
}

interface GeoJSON {
    type: string;
    features: GeoFeature[];
}

// Data Normalization Map: Maps specific Talukas/Towns/Villages -> Official Parent District
const RAW_DB_NORMALIZATION: Record<string, string> = {
    // Existing Normalizations
    Wada: 'Palghar',
    Kudus: 'Palghar',
    'Thane Taluka': 'Thane',
    'Thane West': 'Thane',
    'Mira Bhayandar': 'Thane',
    'Navi Mumbai': 'Thane',
    Kalyan: 'Thane',
    Dombivli: 'Thane',
    Ulhasnagar: 'Thane',
    Ambernath: 'Thane',
    Badlapur: 'Thane',
    Bhiwandi: 'Thane',
    Murbad: 'Thane',
    Shahapur: 'Thane',
    Vasai: 'Palghar',
    Virar: 'Palghar',
    'Palghar Taluka': 'Palghar',
    Dahanu: 'Palghar',
    Talasari: 'Palghar',
    Jawhar: 'Palghar',
    Mokhada: 'Palghar',
    Vikramgad: 'Palghar',
    'Pune City': 'Pune',
    'Pimpri Chinchwad': 'Pune',
    Haveli: 'Pune',
    Mulshi: 'Pune',
    Maval: 'Pune',
    Khed: 'Pune',
    Ambegaon: 'Pune',
    Junnar: 'Pune',
    Shirur: 'Pune',
    Daund: 'Pune',
    Indapur: 'Pune',
    Baramati: 'Pune',
    Purandar: 'Pune',
    Bhor: 'Pune',
    Velhe: 'Pune',
    // New Normalizations (User Feedback 68 -> 36)
    Sasale: 'Ratnagiri',
    Shiroda: 'Sindhudurg',
    Shirol: 'Kolhapur',
    Sinnar: 'Nashik',
    'Solapur North': 'Solapur',
    'Solapur South': 'Solapur',
    Taramumbari: 'Sindhudurg',
    Trimbak: 'Nashik',
    Trimbakeshwar: 'Nashik',
    Umadi: 'Sangli',
    Vayangani: 'Sindhudurg',
    Vijaydurg: 'Sindhudurg',
    Rajur: 'Ahmednagar',
    Kotul: 'Ahmednagar',
    Dahiwadi: 'Satara',
    'Mumbai City': 'Mumbai',
    'Mumbai Suburban': 'Mumbai',
    Dharashiv: 'Osmanabad',
    'Chhatrapati Sambhaji Nagar': 'Aurangabad',
    'Raigad Fort': 'Raigad',
    Mahad: 'Raigad',
    Mangaon: 'Raigad',
    Alibag: 'Raigad',
    Pen: 'Raigad',
    Panvel: 'Raigad',
    Uran: 'Raigad',
    Karjat: 'Raigad',
    Khalapur: 'Raigad',
    Roha: 'Raigad',
};

const normalizeDistrictName = (name: string): string => {
    if (!name) return 'Unknown';
    const cleanName = name.trim();

    // 1. Direct Lookup
    if (RAW_DB_NORMALIZATION[cleanName]) return RAW_DB_NORMALIZATION[cleanName];

    // 2. Case Insensitive Lookup
    const lowerName = cleanName.toLowerCase();
    for (const key in RAW_DB_NORMALIZATION) {
        if (key.toLowerCase().trim() === lowerName) return RAW_DB_NORMALIZATION[key];
    }

    // 3. Fallback to Title Case
    return toTitleCase(cleanName);
};

// Name Normalization Map (DB Name -> GeoJSON Name)
// This fixes the "Sync" issue where DB has "Mumbai City" but Map has "Mumbai"
const DISTRICT_MAPPING: Record<string, string> = {
    'Mumbai City': 'Mumbai',
    'Mumbai Suburban': 'Mumbai Suburban', // Check if map has this, often maps just have 'Mumbai' or 'Mumbai Suburban' separate
    Pune: 'Pune',
    Thane: 'Thane',
    Palghar: 'Palghar',
    Raigad: 'Raigad',
    Nashik: 'Nashik',
    Ahmednagar: 'Ahmednagar',
    // Add typical mismatches here
    Aurangabad: 'Aurangabad',
    'Chhatrapati Sambhaji Nagar': 'Aurangabad', // New name vs Old map name
    Dharashiv: 'Osmanabad', // New Name vs Old Name
};

// Reverse lookup helper (GeoJSON Name -> DB Name Key for lookup)
// Actually we iterate GeoJSON, so we need to find which DB entry matches it.
// We can try exact match, then check Mapping.

export default function ServiceAreaPage() {
    // Map State
    const [geoData, setGeoData] = useState<GeoJSON | null>(null);
    const [mapBounds, setMapBounds] = useState<{
        minLat: number;
        maxLat: number;
        minLon: number;
        maxLon: number;
    } | null>(null);
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [hoveredDistrictLabel, setHoveredDistrictLabel] = useState<{
        name: string;
        status: string;
        x: number;
        y: number;
    } | null>(null);
    const [adjacencyGraph, setAdjacencyGraph] = useState<Record<string, string[]>>({});
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Map Interaction Handlers
    const handleWheel = (e: React.WheelEvent) => {
        if (!mapBounds) return;
        const scaleSensitivity = 0.001;
        const newScale = Math.min(Math.max(0.5, transform.scale - e.deltaY * scaleSensitivity), 5); // Limit zoom 0.5x to 5x

        // Zoom towards center (simplified, can be mouse-pointer based but center is safer/easier)
        // For mouse-pointer zoom, we need ref to svg container to get relative coords.
        // Let's stick to center zoom for simplicity unless requested otherwise.
        setTransform(prev => ({ ...prev, scale: newScale }));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setTransform(prev => ({
            ...prev,
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleZoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale * 1.2, 5) }));
    const handleZoomOut = () => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale / 1.2, 0.5) }));
    const handleResetView = () => setTransform({ x: 0, y: 0, scale: 1 });

    // Fetch Map Data Effect
    useEffect(() => {
        fetch('/maps/maharashtra.json')
            .then(res => res.json())
            .then((data: GeoJSON) => {
                setGeoData(data);
                // Calculate Bounds
                let minLat = 90,
                    maxLat = -90,
                    minLon = 180,
                    maxLon = -180;

                const processCoords = (coords: any[]) => {
                    coords.forEach(coord => {
                        if (Array.isArray(coord[0])) {
                            processCoords(coord);
                        } else {
                            const [lon, lat] = coord;
                            if (lon < minLon) minLon = lon;
                            if (lon > maxLon) maxLon = lon;
                            if (lat < minLat) minLat = lat;
                            if (lat > maxLat) maxLat = lat;
                        }
                    });
                };

                // ADJACENCY CALCULATION (Shared Border Logic)
                // Map Point -> List of Districts using that point
                const pointToDistricts = new Map<string, Set<string>>();

                // Helper to flatten coords to single points
                const extractPoints = (feature: any, districtName: string) => {
                    const points: string[] = [];
                    const visit = (coords: any[]) => {
                        if (typeof coords[0] === 'number') {
                            points.push(coords.join(','));
                        } else {
                            coords.forEach(c => visit(c));
                        }
                    };
                    visit(feature.geometry.coordinates);

                    // Add to Map
                    points.forEach(p => {
                        if (!pointToDistricts.has(p)) pointToDistricts.set(p, new Set());
                        pointToDistricts.get(p)?.add(districtName);
                    });
                };

                data.features.forEach(f => {
                    processCoords(f.geometry.coordinates);

                    // Build Adjacency Graph
                    // Use normalized name to match logic
                    let dName = f.properties.district || f.properties.dtname || 'Unknown';
                    // We need to apply normalization here so the graph keys match the application keys
                    // e.g. "Mumbai" in GeoJSON -> "Mumbai City" / "Mumbai Suburban" in App?
                    // Actually, let's keep graph keys as GeoJSON names to start, but we need to link them.

                    // Better approach: Use the SAME name normalization as elsewhere
                    // If GeoJSON says "Mumbai", and we normalized DB "Mumbai City" -> "Mumbai", keys match.
                    // But here we are building graph from GeoJSON.
                    // Let's use the raw GeoJSON name for the graph, and normalize properly during lookup.
                    // Actually, if we normalize HERE, it simplifies lookup.
                    // But wait, our `normalizeDistrictName` maps DB names.
                    // If GeoJSON has "Mumbai", and DB has "Mumbai City" -> "Mumbai City" (default, as we removed the fake mapping).
                    // Wait, we need the reverse.

                    // Simple fix: Store using raw names, but populate the graph for all aliases.
                    // Or just use the exact internal name logic.

                    extractPoints(f, dName);
                });

                // Build Graph
                const graph: Record<string, string[]> = {};
                pointToDistricts.forEach(districtsSet => {
                    const districts = Array.from(districtsSet);
                    if (districts.length > 1) {
                        // These districts share a point -> They are neighbors
                        for (let i = 0; i < districts.length; i++) {
                            for (let j = i + 1; j < districts.length; j++) {
                                const d1 = districts[i];
                                const d2 = districts[j];

                                if (!graph[d1]) graph[d1] = [];
                                if (!graph[d1].includes(d2)) graph[d1].push(d2);

                                if (!graph[d2]) graph[d2] = [];
                                if (!graph[d2].includes(d1)) graph[d2].push(d1);
                            }
                        }
                    }
                });

                // Manual Fixes for known borders that might not share exact vertices due to simplified geometry
                // e.g. Mumbai City <-> Mumbai Suburban sometimes don't touch in simple maps
                if (!graph['Mumbai']) graph['Mumbai'] = ['Thane']; // Example, usually they touch.
                if (graph['Mumbai'] && !graph['Mumbai'].includes('Thane')) graph['Mumbai'].push('Thane');

                setAdjacencyGraph(graph);

                // Add padding
                const latPad = (maxLat - minLat) * 0.05;
                const lonPad = (maxLon - minLon) * 0.05;
                setMapBounds({
                    minLat: minLat - latPad,
                    maxLat: maxLat + latPad,
                    minLon: minLon - lonPad,
                    maxLon: maxLon + lonPad,
                });
            })
            .catch(err => console.error('Failed to load map data', err));
    }, []);

    // Existing State
    const [pincodes, setPincodes] = useState<Pincode[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Deliverable' | 'Not Deliverable'>('all');
    const [updating, setUpdating] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<'pincodes' | 'districts' | 'map'>('pincodes');
    const [enabledDistricts, setEnabledDistricts] = useState<string[]>([]);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [filters, setFilters] = useState<Record<string, string[]>>({});
    const [searchInputs, setSearchInputs] = useState<Record<string, string>>({});
    const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
    const [lookupLoading, setLookupLoading] = useState(false);

    const [editingDistrictName, setEditingDistrictName] = useState<string | null>(null);

    // Edit Modal State
    const [editingPincode, setEditingPincode] = useState<Pincode | null>(null);
    const [editingDistrict, setEditingDistrict] = useState<{ name: string; state: string; rtos: string[] } | null>(
        null
    );
    const [originalDistrictName, setOriginalDistrictName] = useState<string | null>(null);

    const supabase = createClient();

    // Data Normalization Map (Fixes Granular/Bad DB Data -> Standard Dictionary)
    const RAW_DB_NORMALIZATION: Record<string, string> = {
        Wada: 'Palghar',
        Kudus: 'Palghar',
        'Thane Taluka': 'Thane',
        Murbad: 'Thane',
        Harsul: 'Nashik',
        Korapgaon: 'Nashik',
        Igatpuri: 'Nashik',
        'Mumbai City': 'Mumbai City',
        'Mumbai Suburban': 'Mumbai Suburban',
        Raigad: 'Raigad',
        Pune: 'Pune',
        पुणे: 'Pune',
    };

    const normalizeDistrictName = (name: string) => {
        let dName = toTitleCase(name || '');
        if (RAW_DB_NORMALIZATION[dName]) {
            return RAW_DB_NORMALIZATION[dName];
        }
        if (dName === 'Mumbai') return 'Mumbai City';
        return dName;
    };

    useEffect(() => {
        const loadInitialData = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) {
                // Fetch current tenant from pathname or session
                // For now, we'll fetch the tenant config based on slug
                const slug = window.location.pathname.split('/')[2];
                const { data: tenant } = await supabase
                    .from('id_tenants')
                    .select('id, config')
                    .eq('slug', slug)
                    .single();

                if (tenant) {
                    setTenantId(tenant.id);
                    const config = (tenant.config as any) || {};
                    const rawDistricts: string[] = config.serviceable_districts || [];

                    // Normalize the loaded districts so they match our application logic
                    const normalizedEnabled = Array.from(new Set(rawDistricts.map(normalizeDistrictName)));

                    setEnabledDistricts(normalizedEnabled);
                }
            }
            fetchPincodes();
        };
        loadInitialData();
    }, []);

    // ... existing fetchPincodes ...

    const handleColumnFilter = (key: string, value: string) => {
        setFilters(prev => {
            const current = prev[key] || [];
            if (value === '') return { ...prev, [key]: [] };
            const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
            return { ...prev, [key]: next };
        });
    };

    const fetchPincodes = async () => {
        setLoading(true);
        try {
            let allPincodes: any[] = [];
            let from = 0;
            const batchSize = 1000;
            let more = true;

            while (more) {
                const { data, error } = await supabase
                    .from('loc_pincodes')
                    .select('*', { count: 'exact' })
                    .order('pincode', { ascending: true })
                    .range(from, from + batchSize - 1);

                if (error) throw error;

                if (data) {
                    allPincodes = [...allPincodes, ...data];
                    if (data.length < batchSize) {
                        more = false;
                    } else {
                        from += batchSize;
                    }
                } else {
                    more = false;
                }
            }
            setPincodes(allPincodes);
        } catch (err: unknown) {
            toast.error('Failed to load pincodes: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (pincode: string, currentStatus: string | null) => {
        setUpdating(pincode);
        const newStatus = currentStatus === 'Deliverable' ? 'Not Deliverable' : 'Deliverable';
        try {
            const { error } = await supabase.from('loc_pincodes').update({ status: newStatus }).eq('pincode', pincode);

            if (error) throw error;

            setPincodes(prev => prev.map(p => (p.pincode === pincode ? { ...p, status: newStatus } : p)));

            toast.success(`${pincode} marked as ${newStatus}`);
        } catch (err: unknown) {
            toast.error('Update failed: ' + err.message);
        } finally {
            setUpdating(null);
        }
    };

    const toggleDistrictServiceability = async (district: string, currentEnabled: boolean) => {
        if (!tenantId) return;

        setUpdating(district);
        const newEnabled = currentEnabled
            ? enabledDistricts.filter(d => d.toLowerCase() !== district.toLowerCase())
            : [...enabledDistricts, district];

        try {
            // 1. Update Tenant Config (Source of Truth)
            // We need to fetch the full config first to avoid overwriting other keys
            const { data: currentTenant } = await supabase
                .from('id_tenants')
                .select('config')
                .eq('id', tenantId)
                .single();

            const updatedConfig = {
                ...((currentTenant?.config as any) || {}),
                serviceable_districts: newEnabled,
            };

            const { error: configError } = await supabase
                .from('id_tenants')
                .update({ config: updatedConfig })
                .eq('id', tenantId);

            if (configError) throw configError;

            // 2. Bulk Update Pincodes for this district (Consistency)
            const statusValue = !currentEnabled ? 'Deliverable' : 'Not Deliverable';

            const { error: pincodeError } = await supabase
                .from('loc_pincodes')
                .update({ status: statusValue })
                .eq('district', district);

            if (pincodeError) throw pincodeError;

            setEnabledDistricts(newEnabled);
            setPincodes(prev => prev.map(p => (p.district === district ? { ...p, status: statusValue } : p)));

            toast.success(`District ${district} is now ${statusValue}`);
        } catch (err: unknown) {
            toast.error('Failed to update district: ' + err.message);
        } finally {
            setUpdating(null);
        }
    };

    const fetchCoordinates = async (pincode: string) => {
        if (!pincode) return;
        setLookupLoading(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json`,
                {
                    headers: {
                        'Accept-Language': 'en-US,en;q=0.5',
                        'User-Agent': 'BookMyBike-App',
                    },
                }
            );
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setEditingPincode(prev =>
                    prev
                        ? {
                              ...prev,
                              latitude: parseFloat(lat),
                              longitude: parseFloat(lon),
                          }
                        : null
                );
                toast.success(`Coordinates fetched for ${pincode}`);
            } else {
                toast.error(`No coordinates found for pincode ${pincode}`);
            }
        } catch (err) {
            console.error('Geocoding error:', err);
            toast.error('Failed to fetch coordinates API error');
        } finally {
            setLookupLoading(false);
        }
    };

    const handleEdit = (pincode: Pincode) => {
        setEditingPincode(pincode);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPincode) return;

        setUpdating(editingPincode.pincode);
        try {
            const { error } = await supabase
                .from('loc_pincodes')
                .update({
                    state: editingPincode.state,
                    district: editingPincode.district,
                    taluka: editingPincode.taluka,
                    area: editingPincode.area,
                    rto_code: normalizeRTO(editingPincode.rto_code),
                    latitude: editingPincode.latitude,
                    longitude: editingPincode.longitude,
                })
                .eq('pincode', editingPincode.pincode);

            if (error) throw error;

            setPincodes(prev => prev.map(p => (p.pincode === editingPincode.pincode ? editingPincode : p)));

            toast.success(`Pincode ${editingPincode.pincode} updated successfully`);
            setEditingPincode(null);
        } catch (err: unknown) {
            toast.error('Failed to update: ' + err.message);
        } finally {
            setUpdating(null);
        }
    };

    const handleSaveDistrictEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDistrict || !originalDistrictName) return;

        setUpdating(originalDistrictName);
        try {
            // 1. Fetch current DB RTOs to identify what was removed
            const { data: dbData } = await supabase
                .from('loc_pincodes')
                .select('rto_code')
                .eq('district', originalDistrictName);

            const currentDbRtos = Array.from(new Set((dbData || []).map(d => d.rto_code).filter(Boolean)));
            const newRtos = editingDistrict.rtos.map(r => normalizeRTO(r)).filter(Boolean) as string[];

            // 2. Identify Removed RTOs
            const removedRtos = currentDbRtos.filter(oldR => !newRtos.includes(normalizeRTO(oldR) || ''));

            // 3. Perform Updates
            if (newRtos.length === 1) {
                // CASE A: Bulk Override (Set ALL to Single Value)
                const { error } = await supabase
                    .from('loc_pincodes')
                    .update({
                        district: editingDistrict.name,
                        state: editingDistrict.state,
                        rto_code: newRtos[0],
                    })
                    .eq('district', originalDistrictName);
                if (error) throw error;
            } else {
                // CASE B: List Update (Merge Removed into Primary)
                // First update Name/State (without RTO change)
                const { error: metaError } = await supabase
                    .from('loc_pincodes')
                    .update({
                        district: editingDistrict.name,
                        state: editingDistrict.state,
                    })
                    .eq('district', originalDistrictName);
                if (metaError) throw metaError;

                // Handle Removed RTOs: Reassign them to the first valid NEW RTO
                if (removedRtos.length > 0 && newRtos.length > 0) {
                    const fallbackRto = newRtos[0];
                    for (const removed of removedRtos) {
                        if (!removed) continue;
                        // IMPORTANT: Rows already have the NEW district name from the update above
                        await supabase
                            .from('loc_pincodes')
                            .update({ rto_code: fallbackRto })
                            .eq('district', editingDistrict.name)
                            .eq('rto_code', removed);
                    }
                    toast.success(`Merged ${removedRtos.length} removed RTO group(s) into ${fallbackRto}`);
                }
            }

            // Also update tenants config if the name changed
            if (editingDistrict.name !== originalDistrictName) {
                const newEnabled = enabledDistricts.map(d =>
                    d.toLowerCase() === originalDistrictName.toLowerCase() ? editingDistrict.name : d
                );

                const { data: currentTenant } = await supabase
                    .from('id_tenants')
                    .select('config')
                    .eq('id', tenantId!)
                    .single();

                const updatedConfig = {
                    ...((currentTenant?.config as any) || {}),
                    serviceable_districts: newEnabled,
                };

                await supabase.from('id_tenants').update({ config: updatedConfig }).eq('id', tenantId!);

                setEnabledDistricts(newEnabled);
            }

            // Refetch or update local state
            // WAIT for DB replication/propagation (especially for bulk updates)
            await new Promise(resolve => setTimeout(resolve, 3000));

            await fetchPincodes();
            toast.success(`District ${editingDistrict.name} updated successfully`);

            // Critical: Nullify state AFTER fetch to avoid UI flicker
            setEditingDistrict(null);
            setOriginalDistrictName(null);

            // FORCE a full reset of the updating state
            setUpdating(null);
        } catch (err: unknown) {
            console.error('Error saving district:', err);
            toast.error('Failed to update district: ' + err.message);
            setUpdating(null);
        }
    };

    const [sortConfig, setSortConfig] = useState<{ key: keyof Pincode; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: keyof Pincode) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const filteredPincodes = pincodes
        .filter(p => {
            const matchesSearch =
                p.pincode.includes(searchQuery) ||
                p.taluka?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.district?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

            // Column Filters (Multi-select)
            const matchesColumns = Object.entries(filters).every(([key, values]) => {
                if (!values || values.length === 0) return true;
                const itemValue = String(p[key as keyof Pincode] || '');
                return values.includes(itemValue);
            });

            return matchesSearch && matchesStatus && matchesColumns;
        })
        .sort((a, b) => {
            // Prioritize Deliverable if no explicit sort is set
            if (!sortConfig) {
                if (a.status === 'Deliverable' && b.status !== 'Deliverable') return -1;
                if (a.status !== 'Deliverable' && b.status === 'Deliverable') return 1;
                return a.pincode.localeCompare(b.pincode);
            }

            const aValue = a[sortConfig.key] || '';
            const bValue = b[sortConfig.key] || '';

            // Safe comparison for strings/numbers
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    const uniqueDistricts = React.useMemo(() => {
        const districtMap = new Map<
            string,
            {
                name: string;
                state: string;
                rtos: string[];
                latSum: number;
                lngSum: number;
                count: number;
            }
        >();

        pincodes.forEach(p => {
            if (p.district) {
                // 1. Normalize Name (Fix "Wada" -> "Palghar")
                let dName = normalizeDistrictName(p.district);

                // Standardize Mumbai
                if (dName === 'Mumbai') dName = 'Mumbai City'; // Default single "Mumbai" to City if ambiguous

                const existing = districtMap.get(dName);
                const rto = normalizeRTO(p.rto_code);

                // Accumulate Lat/Lng for Centroid
                const lat = Number(p.latitude) || 0;
                const lng = Number(p.longitude) || 0;
                const hasCoordinates = lat !== 0 && lng !== 0;

                if (!existing) {
                    districtMap.set(dName, {
                        name: dName,
                        state: p.state || 'Unknown',
                        rtos: rto ? [rto] : [],
                        latSum: hasCoordinates ? lat : 0,
                        lngSum: hasCoordinates ? lng : 0,
                        count: hasCoordinates ? 1 : 0,
                    });
                } else {
                    if (rto && !existing.rtos.includes(rto)) {
                        existing.rtos.push(rto);
                    }
                    if (hasCoordinates) {
                        existing.latSum += lat;
                        existing.lngSum += lng;
                        existing.count += 1;
                    }
                }
            }
        });

        // 1. Calculate Centroids
        let districtsWithCoords = Array.from(districtMap.values()).map(d => ({
            ...d,
            latitude: d.count > 0 ? d.latSum / d.count : 0,
            longitude: d.count > 0 ? d.lngSum / d.count : 0,
        }));

        // 2. Determine BORDER Status (Green/Orange/Red)
        // Logic:
        // Green: Explicitly Enabled
        // Orange: Shares a border with a Green district (using Adjacency Graph)
        // Red: Else

        return districtsWithCoords
            .map(d => {
                const isEnabled = enabledDistricts.some(ed => ed.toLowerCase() === d.name.toLowerCase());
                let status: 'GREEN' | 'ORANGE' | 'RED' = 'RED';
                let nearestHub = '';
                let distanceToHub = 0;

                if (isEnabled) {
                    status = 'GREEN';
                } else {
                    // Check Adjacency
                    // We need to check if 'd.name' is a neighbor of any 'enabledDistrict'
                    // Problem: d.name is NORMALIZED (e.g. "Mumbai City"), but Graph keys might be "Mumbai" (GeoJSON).
                    // We need a robust lookup.

                    // 1. Get neighbours of current district
                    // Try direct match first
                    let neighbors = adjacencyGraph[d.name] || [];

                    // Try mapped matches (e.g. if d.name is "Mumbai City", map might have "Mumbai")
                    if (d.name.includes('Mumbai')) {
                        neighbors = [...neighbors, ...(adjacencyGraph['Mumbai'] || [])];
                    }

                    // Also check if any enabled district lists THIS district as a neighbor
                    // (Adjacency is symmetric, but checking both sides is safer with aliases)

                    const isNeighborToGreen = enabledDistricts.some(ed => {
                        // Check if 'ed' (Green) is in 'neighbors' list
                        // Handle "Mumbai" alias again
                        const result =
                            neighbors.includes(ed) ||
                            (ed === 'Mumbai City' && neighbors.includes('Mumbai')) ||
                            (ed === 'Mumbai Suburban' && neighbors.includes('Mumbai'));
                        return result;
                    });

                    if (isNeighborToGreen) {
                        status = 'ORANGE';
                    }
                }

                return { ...d, status, nearestHub, distanceToHub };
            })
            .sort((a, b) => {
                // Sort: Green -> Orange -> Red
                const scoreToNum = (s: string) => (s === 'GREEN' ? 0 : s === 'ORANGE' ? 1 : 2);
                return scoreToNum(a.status) - scoreToNum(b.status) || a.name.localeCompare(b.name);
            });
    }, [pincodes, enabledDistricts, adjacencyGraph]);

    const filteredDistricts = uniqueDistricts.filter(
        d =>
            d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.state.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sub-component for Column Header
    const ColumnHeader = ({
        label,
        colKey,
        className = '',
    }: {
        label: string;
        colKey: keyof Pincode;
        className?: string;
    }) => {
        const isSorted = sortConfig?.key === colKey;
        const selectedValues = filters[colKey] || [];
        const isFiltered = selectedValues.length > 0;
        const showFilter = activeFilterColumn === colKey;

        // Get dynamic options based on other active filters (Cascading)
        const options = React.useMemo(() => {
            if (!showFilter) return [];

            // Filter pincodes by EVERYTHING EXCEPT this column's filter
            const partialFiltered = pincodes.filter(p => {
                // 1. Status Global Filter
                if (statusFilter !== 'all' && p.status !== statusFilter) return false;

                // 2. Global Search Query
                const query = searchQuery.toLowerCase();
                const matchesSearch =
                    !query ||
                    p.pincode.includes(query) ||
                    p.taluka?.toLowerCase().includes(query) ||
                    p.area?.toLowerCase().includes(query) ||
                    p.district?.toLowerCase().includes(query);

                if (!matchesSearch) return false;

                // 3. Other Column Filters (Skip current column to allow changing selection)
                return Object.entries(filters).every(([key, values]) => {
                    if (key === colKey) return true; // Skip ourselves
                    if (!values || values.length === 0) return true;
                    return values.includes(String(p[key as keyof Pincode] || ''));
                });
            });

            const rawValues = partialFiltered
                .map(p =>
                    String(p[colKey] || '')
                        .replace(' Division', '')
                        .trim()
                )
                .filter(Boolean);

            const uniqueMap = new Map<string, string>();
            rawValues.forEach(value => {
                const key = value.toLowerCase();
                if (!uniqueMap.has(key)) uniqueMap.set(key, value);
            });
            return Array.from(uniqueMap.values()).sort((a, b) => a.localeCompare(b));
        }, [showFilter, colKey, pincodes, filters, statusFilter, searchQuery]);

        // Filter the options list based on what user types in the filter box
        const filteredOptions = options.filter(opt =>
            opt.toLowerCase().includes((searchInputs[colKey] || '').toLowerCase())
        );

        return (
            <div className={`flex flex-col relative ${className}`}>
                <div className="flex items-center gap-2 group/header select-none">
                    <div
                        onClick={() => handleSort(colKey)}
                        className={`cursor-pointer flex items-center gap-1 transition-colors ${isSorted ? 'text-indigo-600' : 'hover:text-slate-600'}`}
                    >
                        {label}
                        {isSorted && (
                            <ChevronRight
                                size={12}
                                className={`transition-transform ${sortConfig?.direction === 'desc' ? 'rotate-90' : '-rotate-90'}`}
                            />
                        )}
                    </div>
                    <button
                        onClick={() => setActiveFilterColumn(showFilter ? null : colKey)}
                        className={`p-1.5 rounded-md transition-all ${isFiltered ? 'text-indigo-600 bg-indigo-50 shadow-sm' : 'text-slate-300 hover:text-slate-500'}`}
                    >
                        <Filter size={11} fill={isFiltered ? 'currentColor' : 'none'} />
                    </button>
                </div>

                {/* Filter Popover */}
                {showFilter && (
                    <div className="absolute top-full left-0 mt-3 z-50 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-3 ring-1 ring-slate-900/5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                autoFocus
                                placeholder={`Search ${label}...`}
                                className="w-full text-xs font-bold bg-slate-50 dark:bg-black/20 pl-9 pr-4 py-2.5 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 shadow-inner"
                                value={searchInputs[colKey] || ''}
                                onChange={e => setSearchInputs(prev => ({ ...prev, [colKey]: e.target.value }))}
                            />
                        </div>

                        {/* Options List */}
                        <div className="max-h-64 overflow-y-auto flex flex-col gap-1.5 pr-1 custom-scrollbar">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map(opt => {
                                    const isSelected = selectedValues.includes(opt);
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => handleColumnFilter(colKey, opt)}
                                            className={`text-left px-4 py-3 rounded-xl text-sm font-black transition-all duration-200 flex items-center justify-between ${
                                                isSelected
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                                    : 'bg-slate-50 hover:bg-indigo-50 dark:bg-white/5 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-transparent hover:border-indigo-200 dark:hover:border-white/10'
                                            }`}
                                        >
                                            <span className="truncate pr-2">{toTitleCase(opt)}</span>
                                            {isSelected && <CheckCircle2 size={14} className="flex-shrink-0" />}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="text-xs font-bold text-slate-500 p-8 text-center italic leading-relaxed bg-slate-50 dark:bg-black/20 rounded-2xl">
                                    No matches found for "{searchInputs[colKey] || ''}"
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 border-t border-slate-100 dark:border-white/5 pt-3 mt-1">
                            {isFiltered && (
                                <button
                                    onClick={() => {
                                        handleColumnFilter(colKey, '');
                                        setSearchInputs(prev => ({ ...prev, [colKey]: '' }));
                                    }}
                                    className="flex-1 py-2 text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 hover:underline text-center tracking-widest transition-all"
                                >
                                    Clear
                                </button>
                            )}
                            <button
                                onClick={() => setActiveFilterColumn(null)}
                                className="flex-1 py-2 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/5 rounded-lg text-center tracking-widest transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}

                {/* Active Filter Indicator (if collapsed) */}
                {isFiltered && !showFilter && (
                    <div className="text-[10px] text-indigo-600 font-bold truncate max-w-[100px] mt-1 bg-indigo-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <span>{selectedValues.length} Selected</span>
                        <div
                            onClick={e => {
                                e.stopPropagation();
                                handleColumnFilter(colKey, '');
                            }}
                            className="hover:text-rose-500 cursor-pointer"
                        >
                            <XCircle size={10} />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden font-sans relative">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 pointer-events-none" />

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar relative z-10">
                <div className="max-w-[1920px] mx-auto space-y-8">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white mb-1">
                                Service <span className="text-indigo-600">Perimeter</span>
                            </h1>
                            <div className="flex items-center gap-4">
                                <p className="text-slate-500 font-medium text-sm flex items-center gap-2 border-r border-slate-200 dark:border-white/10 pr-4">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Live Network Coverage
                                </p>
                                <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                                    <button
                                        onClick={() => setViewMode('pincodes')}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-tighter transition-all ${viewMode === 'pincodes' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Pincodes
                                    </button>
                                    <button
                                        onClick={() => setViewMode('districts')}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-tighter transition-all ${viewMode === 'districts' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Districts
                                    </button>
                                    <button
                                        onClick={() => setViewMode('map')}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-tighter transition-all ${viewMode === 'map' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Map View
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="glass-card px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                <Zap size={14} className="text-amber-500" fill="currentColor" />
                                {filteredPincodes.length} Active Nodes
                            </div>
                        </div>
                    </div>

                    {/* NEO-GLASS STATS DASHBOARD */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        {[
                            {
                                label: 'States',
                                key: 'state' as keyof Pincode,
                                icon: MapIcon,
                                color: 'from-indigo-500 to-violet-500',
                            },
                            {
                                label: 'Districts',
                                key: 'district' as keyof Pincode,
                                icon: Building2,
                                color: 'from-blue-500 to-cyan-500',
                            },
                            {
                                label: 'Talukas',
                                key: 'taluka' as keyof Pincode,
                                icon: MapPin,
                                color: 'from-emerald-500 to-teal-500',
                            },
                            {
                                label: 'Areas',
                                key: 'area' as keyof Pincode,
                                icon: LayoutGrid,
                                color: 'from-amber-500 to-orange-500',
                            },
                            {
                                label: 'RTOs',
                                key: 'rto_code' as keyof Pincode,
                                icon: CheckCircle2,
                                color: 'from-rose-500 to-pink-500',
                            },
                        ].map(metric => {
                            const uniqueValues = new Set(pincodes.map(p => p[metric.key]).filter(Boolean));
                            const total = uniqueValues.size;
                            const activeCount = new Set(
                                pincodes
                                    .filter(p => p.status === 'Deliverable')
                                    .map(p => p[metric.key])
                                    .filter(Boolean)
                            ).size;

                            return (
                                <div
                                    key={metric.label}
                                    className="group relative overflow-hidden bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div
                                        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${metric.color} opacity-5 blur-3xl rounded-full group-hover:opacity-10 transition-opacity`}
                                    />

                                    <div className="relative z-10 flex flex-col items-center">
                                        <div
                                            className={`w-10 h-10 mb-3 rounded-2xl bg-gradient-to-br ${metric.color} p-[1px] shadow-lg`}
                                        >
                                            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center">
                                                <metric.icon size={18} className="text-slate-700 dark:text-white" />
                                            </div>
                                        </div>

                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                            {metric.label}
                                        </span>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                                                {total}
                                            </span>
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                                                {activeCount} Live
                                            </span>
                                        </div>

                                        {/* Micro Chart */}
                                        <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${metric.color} transition-all duration-500`}
                                                style={{ width: `${total > 0 ? (activeCount / total) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* COMMAND BAR */}
                    <div className="sticky top-0 z-40 -mx-4 px-4 py-4 backdrop-blur-xl bg-slate-50/80 dark:bg-slate-950/80 transition-all">
                        <div className="glass-card bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-xl shadow-indigo-500/5 items-center">
                            {/* This div now only contains the search/filter header, not the entire content grid */}
                            {viewMode === 'pincodes' ? (
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                                    <div className="relative flex-1 max-w-md group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            placeholder="Search by area, taluka or pincode..."
                                            className="w-full bg-slate-50 dark:bg-black/20 pl-12 pr-4 py-3 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 shadow-inner"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {(['all', 'Deliverable', 'Not Deliverable'] as const).map(status => (
                                            <button
                                                key={status}
                                                onClick={() => setStatusFilter(status)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                                    statusFilter === status
                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                                        : 'bg-slate-50 dark:bg-white/5 text-slate-500 hover:bg-slate-100'
                                                }`}
                                            >
                                                {status === 'all'
                                                    ? 'All Zones'
                                                    : status === 'Deliverable'
                                                      ? 'Serviceable'
                                                      : 'Disabled'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                                    <div className="relative flex-1 max-w-md group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            placeholder="Search districts or states..."
                                            className="w-full bg-slate-50 dark:bg-black/20 pl-12 pr-4 py-3 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 shadow-inner"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                        <span className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                            {uniqueDistricts.length} Total Districts
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            {enabledDistricts.length} Enabled
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* MAIN CONTENT GRID */}
                    {viewMode === 'pincodes' ? (
                        <div className="space-y-4">
                            {/* Pincodes Table */}
                            <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-4 shadow-sm backdrop-blur-2xl">
                                {/* Table Header */}
                                <div className="grid grid-cols-12 gap-4 px-6 py-4 mb-2 border-b border-slate-50 dark:border-white/5">
                                    <ColumnHeader label="State" colKey="state" className="col-span-2" />
                                    <ColumnHeader label="District" colKey="district" className="col-span-2" />
                                    <ColumnHeader label="Taluka" colKey="taluka" className="col-span-2" />
                                    <ColumnHeader label="Area" colKey="area" className="col-span-2" />
                                    <ColumnHeader
                                        label="Pincode"
                                        colKey="pincode"
                                        className="col-span-1 flex justify-center"
                                    />
                                    <ColumnHeader
                                        label="RTO"
                                        colKey="rto_code"
                                        className="col-span-1 flex justify-center"
                                    />
                                    <div className="col-span-1 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center self-center">
                                        Serviceable
                                    </div>
                                    <div className="col-span-1 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right self-center">
                                        Actions
                                    </div>
                                </div>

                                {/* Table Body */}
                                <div className="space-y-2 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                                            <p className="text-slate-400 font-bold animate-pulse">
                                                Synchronizing perimeter data...
                                            </p>
                                        </div>
                                    ) : filteredPincodes.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-slate-50/50 dark:bg-white/5 rounded-3xl">
                                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
                                                <Search className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 font-bold">
                                                No results match your current filters.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setFilters({});
                                                    setStatusFilter('all');
                                                    setSearchQuery('');
                                                }}
                                                className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline"
                                            >
                                                Reset All Filters
                                            </button>
                                        </div>
                                    ) : (
                                        filteredPincodes.map(p => (
                                            <div
                                                key={p.pincode}
                                                className="group grid grid-cols-12 gap-4 items-center bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 px-6 py-3.5 rounded-[1.25rem] shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-500/20 hover:-translate-y-0.5 transition-all duration-300"
                                            >
                                                <div className="col-span-2">
                                                    <div
                                                        className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wide truncate"
                                                        title={toTitleCase(p.state)}
                                                    >
                                                        {toTitleCase(p.state)}
                                                    </div>
                                                </div>

                                                <div className="col-span-2">
                                                    <div
                                                        className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate"
                                                        title={toTitleCase(p.district)}
                                                    >
                                                        {toTitleCase(p.district?.replace(' Division', ''))}
                                                    </div>
                                                </div>

                                                <div className="col-span-2">
                                                    <div
                                                        className="text-sm font-black italic text-slate-900 dark:text-white tracking-tighter truncate"
                                                        title={toTitleCase(p.taluka)}
                                                    >
                                                        {toTitleCase(p.taluka)}
                                                    </div>
                                                </div>

                                                <div className="col-span-2 flex flex-col justify-center">
                                                    <div
                                                        className="text-xs font-black text-slate-700 dark:text-slate-200 truncate pr-4"
                                                        title={toTitleCase(p.area)}
                                                    >
                                                        {toTitleCase(p.area)}
                                                    </div>
                                                    {p.latitude && p.longitude && (
                                                        <div className="flex items-center gap-1 mt-0.5 text-[9px] font-mono font-bold text-indigo-500/60 dark:text-indigo-400/60">
                                                            <span>LAT: {Number(p.latitude).toFixed(4)}</span>
                                                            <span className="opacity-30">|</span>
                                                            <span>LON: {Number(p.longitude).toFixed(4)}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="col-span-1 flex justify-center">
                                                    <div className="bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-lg font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                                                        {p.pincode}
                                                    </div>
                                                </div>

                                                <div className="col-span-1 flex justify-center">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded whitespace-nowrap">
                                                        {p.rto_code || '-'}
                                                    </div>
                                                </div>

                                                <div className="col-span-1 flex justify-center">
                                                    {p.status === 'Deliverable' ? (
                                                        <CheckCircle2
                                                            size={18}
                                                            className="text-emerald-500 drop-shadow-sm"
                                                        />
                                                    ) : (
                                                        <XCircle size={18} className="text-rose-500/40" />
                                                    )}
                                                </div>

                                                <div className="col-span-1 flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(p)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/5 transition-all"
                                                        title="Edit Pincode"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleStatus(p.pincode, p.status)}
                                                        disabled={updating === p.pincode}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                                            p.status === 'Deliverable'
                                                                ? 'text-rose-500 bg-rose-50 hover:bg-rose-100'
                                                                : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                                                        }`}
                                                    >
                                                        {updating === p.pincode
                                                            ? '...'
                                                            : p.status === 'Deliverable'
                                                              ? 'Disable'
                                                              : 'Enable'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : viewMode === 'districts' ? (
                        <div className="space-y-6">
                            {/* Districts Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredDistricts.map(district => {
                                    const isEnabled = enabledDistricts.some(
                                        d => d.toLowerCase() === district.name.toLowerCase()
                                    );
                                    return (
                                        <div
                                            key={district.name}
                                            className={`group relative p-6 rounded-[2rem] border transition-all duration-300 ${
                                                isEnabled
                                                    ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-500/20 text-white'
                                                    : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-white/5 hover:border-indigo-500/30'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div
                                                    className={`p-3 rounded-2xl ${isEnabled ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/5'}`}
                                                >
                                                    <Building2
                                                        size={24}
                                                        className={isEnabled ? 'text-white' : 'text-slate-400'}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            setOriginalDistrictName(district.name);
                                                            setEditingDistrict({ ...district });
                                                        }}
                                                        className={`p-2 rounded-xl transition-all ${
                                                            isEnabled
                                                                ? 'bg-white/20 text-white hover:bg-white/30'
                                                                : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-indigo-600'
                                                        }`}
                                                        title="Edit District"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            toggleDistrictServiceability(district.name, isEnabled)
                                                        }
                                                        disabled={updating === district.name}
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                            isEnabled
                                                                ? 'bg-white text-indigo-600 hover:scale-105'
                                                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'
                                                        }`}
                                                    >
                                                        {updating === district.name ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : isEnabled ? (
                                                            'Disable'
                                                        ) : (
                                                            'Enable'
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <h3
                                                    className={`text-lg font-black italic uppercase tracking-tighter truncate ${isEnabled ? 'text-white' : 'text-slate-900 dark:text-white'}`}
                                                >
                                                    {district.name}
                                                </h3>
                                                <p
                                                    className={`text-xs font-bold uppercase tracking-widest ${isEnabled ? 'text-white/60' : 'text-slate-400'} mb-3`}
                                                >
                                                    {district.state}
                                                </p>

                                                {/* RTO List - Always Visible */}
                                                <div className="flex flex-wrap gap-1.5 min-h-[22px]">
                                                    {district.rtos.length > 0 ? (
                                                        district.rtos.map(rto => (
                                                            <span
                                                                key={rto}
                                                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors ${
                                                                    isEnabled
                                                                        ? 'bg-white/10 border-white/20 text-white'
                                                                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-indigo-600 dark:text-indigo-400'
                                                                }`}
                                                            >
                                                                {rto}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span
                                                            className={`text-[10px] font-bold italic opacity-30 ${isEnabled ? 'text-white' : 'text-slate-400'}`}
                                                        >
                                                            -
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Background Decor */}
                                            <div
                                                className={`absolute -bottom-4 -right-4 w-24 h-24 blur-2xl rounded-full opacity-20 ${isEnabled ? 'bg-white' : 'bg-indigo-500'}`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-6 shadow-sm backdrop-blur-2xl h-[700px] relative overflow-hidden flex flex-col">
                            {/* Map Instructions */}
                            <div className="absolute top-6 left-8 z-10 pointer-events-none">
                                <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                                    Live <span className="text-indigo-600">Operations Map</span>
                                </h3>
                                <p className="text-xs font-bold text-slate-400 mt-1 max-w-xs">
                                    <span className="text-emerald-500">Green: Live</span> •{' '}
                                    <span className="text-orange-500">Orange: Catchment (&lt;60km)</span> •{' '}
                                    <span className="text-rose-500">Red: Dead Zone</span>
                                </p>
                            </div>

                            {/* Custom SVG Real Map */}
                            <div
                                className={`${
                                    isFullScreen
                                        ? 'fixed inset-0 z-[100] w-screen h-screen rounded-none bg-slate-50 dark:bg-slate-900'
                                        : 'flex-1 w-full h-full relative rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5'
                                } group cursor-grab active:cursor-grabbing overflow-hidden`}
                                onWheel={handleWheel}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                            >
                                {geoData && mapBounds ? (
                                    <>
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg
                                                width="100%"
                                                height="100%"
                                                viewBox={`0 0 800 600`}
                                                className="w-full h-full drop-shadow-2xl filter transition-transform duration-75 ease-out will-change-transform"
                                                preserveAspectRatio="xMidYMid meet"
                                            >
                                                <defs>
                                                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                                        <feGaussianBlur stdDeviation="3" result="blur" />
                                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                                    </filter>
                                                </defs>

                                                <g
                                                    transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
                                                >
                                                    {/* Render Districts */}
                                                    {geoData.features.map((feature: any, i: number) => {
                                                        const geoName =
                                                            feature.properties.district ||
                                                            feature.properties.dtname ||
                                                            'Unknown';

                                                        // Name Normalization Map (DB Name -> GeoJSON Name)
                                                        const DISTRICT_MAPPING: Record<string, string> = {
                                                            'Mumbai City': 'Mumbai',
                                                            'Mumbai Suburban': 'Mumbai',
                                                            Pune: 'Pune',
                                                            Thane: 'Thane',
                                                            Palghar: 'Palghar',
                                                            Raigad: 'Raigad',
                                                            Nashik: 'Nashik',
                                                            Ahmednagar: 'Ahmednagar',
                                                            Aurangabad: 'Aurangabad',
                                                            'Chhatrapati Sambhaji Nagar': 'Aurangabad',
                                                            Dharashiv: 'Osmanabad',
                                                        };

                                                        // Find ALL matching districts from DB (Many-to-One support)
                                                        // e.g., 'Mumbai City' and 'Mumbai Suburban' both match 'Mumbai'
                                                        const matchedDistricts = uniqueDistricts.filter(d => {
                                                            const dbName = d.name;
                                                            // 1. Exact Match
                                                            if (dbName.toLowerCase() === geoName.toLowerCase())
                                                                return true;
                                                            // 2. Mapped Match (DB Name -> GeoJSON Name)
                                                            if (DISTRICT_MAPPING[dbName] === geoName) return true;
                                                            // 3. Partial Match
                                                            if (dbName.toLowerCase().includes(geoName.toLowerCase()))
                                                                return true;
                                                            if (geoName.toLowerCase().includes(dbName.toLowerCase()))
                                                                return true;
                                                            return false;
                                                        });

                                                        // aggregatedStatus: If ANY matched district is 'Deliverable', show GREEN.
                                                        // Otherwise only RED if all are RED.
                                                        // Wait, what determines GREEN?
                                                        // The list logic calculates status: 'GREEN' | 'ORANGE' | 'RED'

                                                        let status = 'RED';
                                                        let districtName = geoName;

                                                        if (matchedDistricts.length > 0) {
                                                            // If multiple matches (e.g. Mumbai City + Suburban), prioritize GREEN
                                                            const hasGreen = matchedDistricts.some(
                                                                d => d.status === 'GREEN'
                                                            );
                                                            const hasOrange = matchedDistricts.some(
                                                                d => d.status === 'ORANGE'
                                                            );

                                                            status = hasGreen ? 'GREEN' : hasOrange ? 'ORANGE' : 'RED';

                                                            // Combine names for tooltip if multiple
                                                            if (matchedDistricts.length > 1) {
                                                                districtName = matchedDistricts
                                                                    .map(d => d.name)
                                                                    .join(' & ');
                                                            } else {
                                                                districtName = matchedDistricts[0].name;
                                                            }
                                                        }

                                                        // Colors
                                                        const fill =
                                                            status === 'GREEN'
                                                                ? '#10b981'
                                                                : status === 'ORANGE'
                                                                  ? '#f97316'
                                                                  : '#e11d48'; // emerald, orange, rose

                                                        // Project Coordinates Implementation
                                                        const width = 800;
                                                        const height = 600;
                                                        const { minLat, maxLat, minLon, maxLon } = mapBounds;
                                                        const latRange = maxLat - minLat;
                                                        const lonRange = maxLon - minLon;

                                                        // Helper to project a single point
                                                        const project = (lon: number, lat: number) => {
                                                            const x = ((lon - minLon) / lonRange) * width;
                                                            const y = height - ((lat - minLat) / latRange) * height; // Invert Y
                                                            return `${x},${y}`;
                                                        };

                                                        const drawPolygon = (coords: any[]) => {
                                                            const type = feature.geometry.type;
                                                            const renderRing = (ring: any[]) => {
                                                                return (
                                                                    'M ' +
                                                                    ring
                                                                        .map((pt: any) => project(pt[0], pt[1]))
                                                                        .join(' L ') +
                                                                    ' Z '
                                                                );
                                                            };
                                                            let path = '';
                                                            if (type === 'Polygon') {
                                                                feature.geometry.coordinates.forEach((ring: any[]) => {
                                                                    path += renderRing(ring);
                                                                });
                                                            } else if (type === 'MultiPolygon') {
                                                                feature.geometry.coordinates.forEach(
                                                                    (polygon: any[]) => {
                                                                        polygon.forEach((ring: any[]) => {
                                                                            path += renderRing(ring);
                                                                        });
                                                                    }
                                                                );
                                                            }
                                                            return path;
                                                        };

                                                        return (
                                                            <g
                                                                key={i}
                                                                className="group/district transition-all duration-300"
                                                            >
                                                                <path
                                                                    d={drawPolygon(feature.geometry.coordinates)}
                                                                    fill={fill}
                                                                    fillOpacity={
                                                                        status === 'GREEN'
                                                                            ? 0.9
                                                                            : status === 'ORANGE'
                                                                              ? 0.8
                                                                              : 0.6
                                                                    }
                                                                    stroke="white"
                                                                    strokeWidth={1 / transform.scale}
                                                                    className="transition-all duration-300 hover:brightness-110 cursor-pointer hover:stroke-indigo-500"
                                                                    style={{ strokeWidth: 1.5 / transform.scale }}
                                                                    onMouseEnter={e => {
                                                                        setHoveredDistrictLabel({
                                                                            name: districtName, // "Mumbai City & Mumbai Suburban"
                                                                            status: status,
                                                                            x: 0,
                                                                            y: 0,
                                                                        });
                                                                    }}
                                                                    onMouseLeave={() => setHoveredDistrictLabel(null)}
                                                                />
                                                            </g>
                                                        );
                                                    })}
                                                    {/* Render Labels (Smart Zoom-Dependent) */}
                                                    {uniqueDistricts.map((d, i) => {
                                                        // 1. Zoom Threshold Check
                                                        // Adjusted Thresholds:
                                                        // Names: > 1.5x (Easier to see)
                                                        // RTOs: > 3.0x (Detailed but reachable)
                                                        const showName = transform.scale > 1.5;
                                                        const showRTO = transform.scale > 3.0;

                                                        if (!showName && !showRTO) return null;

                                                        const width = 800;
                                                        const height = 600;
                                                        const { minLat, maxLat, minLon, maxLon } = mapBounds;
                                                        const latRange = maxLat - minLat;
                                                        const lonRange = maxLon - minLon;

                                                        if (d.latitude === 0 || d.longitude === 0) return null;

                                                        const x = ((d.longitude - minLon) / lonRange) * width;
                                                        const y = height - ((d.latitude - minLat) / latRange) * height;

                                                        // Join multiple RTOs if available (e.g. "MH04, MH48")
                                                        // Limit to 2 lines or strictly truncate to prevent overflow
                                                        const rtoList = d.rtos || [];
                                                        const rtoText =
                                                            rtoList.length > 2
                                                                ? `${rtoList.slice(0, 2).join(', ')}...`
                                                                : rtoList.join(', ');

                                                        return (
                                                            <g
                                                                key={`label-${i}`}
                                                                transform={`translate(${x}, ${y})`}
                                                                className="pointer-events-none fade-in duration-300"
                                                            >
                                                                {showName && (
                                                                    <text
                                                                        textAnchor="middle"
                                                                        y={showRTO ? -2 / transform.scale : 0}
                                                                        style={{
                                                                            fontSize: `${Math.max(4, 9 / transform.scale)}px`,
                                                                        }}
                                                                        className="fill-white font-black uppercase tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                                                                    >
                                                                        {d.name.replace(' Division', '')}
                                                                    </text>
                                                                )}
                                                                {showRTO && rtoText && (
                                                                    <text
                                                                        textAnchor="middle"
                                                                        y={10 / transform.scale}
                                                                        style={{
                                                                            fontSize: `${Math.max(3, 7 / transform.scale)}px`,
                                                                        }}
                                                                        className="fill-indigo-100 font-bold uppercase tracking-wider drop-shadow-md opacity-90"
                                                                    >
                                                                        {rtoText}
                                                                    </text>
                                                                )}
                                                            </g>
                                                        );
                                                    })}
                                                </g>
                                            </svg>

                                            {/* Hover Tooltip (Floating Overlay) */}
                                            {hoveredDistrictLabel && (
                                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-xl shadow-2xl border border-white/10 pointer-events-none animate-in slide-in-from-bottom-2 fade-in zoom-in-95 duration-200 z-50 flex items-center gap-3">
                                                    <div
                                                        className={`w-2 h-2 rounded-full ${hoveredDistrictLabel.status === 'GREEN' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : hoveredDistrictLabel.status === 'ORANGE' ? 'bg-orange-500' : 'bg-rose-500'}`}
                                                    />
                                                    <div>
                                                        <p className="text-xs font-black uppercase tracking-widest leading-none mb-0.5">
                                                            {hoveredDistrictLabel.name}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                            {hoveredDistrictLabel.status === 'GREEN'
                                                                ? 'Serviceable'
                                                                : 'Not Serviceable'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Map Controls (Fixed Position) */}
                                        <div className="absolute top-4 right-4 flex flex-col gap-2 z-[200] pointer-events-auto">
                                            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-md rounded-lg p-2 text-xs font-bold text-slate-600 dark:text-slate-300 text-center border border-slate-200 dark:border-white/10">
                                                {transform.scale.toFixed(1)}x
                                            </div>
                                            <button
                                                onClick={() => setIsFullScreen(!isFullScreen)}
                                                className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-white/10 text-slate-600 dark:text-white hover:bg-slate-50 active:scale-95 transition-all"
                                                title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                                            >
                                                {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                                            </button>
                                            <button
                                                onClick={handleZoomIn}
                                                className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-white/10 text-slate-600 dark:text-white hover:bg-slate-50 active:scale-95 transition-all"
                                            >
                                                <Plus size={20} />
                                            </button>
                                            <button
                                                onClick={handleResetView}
                                                className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-white/10 text-slate-600 dark:text-white hover:bg-slate-50 active:scale-95 transition-all"
                                            >
                                                <RotateCcw size={20} />
                                            </button>
                                            <button
                                                onClick={handleZoomOut}
                                                className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-white/10 text-slate-600 dark:text-white hover:bg-slate-50 active:scale-95 transition-all"
                                            >
                                                <Minus size={20} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                                        <p className="text-slate-400 text-sm font-bold">Rendering Cartography...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {editingPincode && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <div
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                                onClick={() => setEditingPincode(null)}
                            />
                            <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
                                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                            <MapPin size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black uppercase text-slate-900 dark:text-white italic tracking-tighter">
                                                Edit Region{' '}
                                                <span className="text-indigo-600">{editingPincode.pincode}</span>
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Update serviceability metadata
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setEditingPincode(null)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400 transition-colors"
                                    >
                                        <XCircle size={24} />
                                    </button>
                                </div>
                                <form onSubmit={handleSaveEdit} className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <MapIcon size={12} className="text-indigo-500" />
                                                State
                                            </label>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                                                value={editingPincode.state || ''}
                                                onChange={e =>
                                                    setEditingPincode({ ...editingPincode, state: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <Building2 size={12} className="text-blue-500" />
                                                District
                                            </label>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                                                value={editingPincode.district || ''}
                                                onChange={e =>
                                                    setEditingPincode({ ...editingPincode, district: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <MapPin size={12} className="text-emerald-500" />
                                                Taluka
                                            </label>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                                                value={editingPincode.taluka || ''}
                                                onChange={e =>
                                                    setEditingPincode({ ...editingPincode, taluka: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <Zap size={12} className="text-rose-500" />
                                                RTO Code
                                            </label>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner placeholder:text-slate-300"
                                                placeholder="e.g., MH-12"
                                                value={editingPincode.rto_code || ''}
                                                onChange={e =>
                                                    setEditingPincode({ ...editingPincode, rto_code: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <LayoutGrid size={12} className="text-amber-500" />
                                                Area / Locality Name
                                            </label>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                                                value={editingPincode.area || ''}
                                                onChange={e =>
                                                    setEditingPincode({ ...editingPincode, area: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                    <MapIcon size={12} className="text-indigo-400" />
                                                    Latitude
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => fetchCoordinates(editingPincode.pincode)}
                                                    disabled={lookupLoading}
                                                    className="text-[9px] font-black uppercase text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors disabled:opacity-50"
                                                >
                                                    {lookupLoading ? (
                                                        <Loader2 size={10} className="animate-spin" />
                                                    ) : (
                                                        <Zap size={10} />
                                                    )}
                                                    Fetch from Map
                                                </button>
                                            </div>
                                            <input
                                                type="number"
                                                step="any"
                                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner placeholder:text-slate-300"
                                                placeholder="e.g., 19.9972"
                                                value={editingPincode.latitude || ''}
                                                onChange={e =>
                                                    setEditingPincode({
                                                        ...editingPincode,
                                                        latitude: e.target.value ? parseFloat(e.target.value) : null,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <MapIcon size={12} className="text-indigo-400" />
                                                Longitude
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner placeholder:text-slate-300"
                                                placeholder="e.g., 79.2961"
                                                value={editingPincode.longitude || ''}
                                                onChange={e =>
                                                    setEditingPincode({
                                                        ...editingPincode,
                                                        longitude: e.target.value ? parseFloat(e.target.value) : null,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-4 flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setEditingPincode(null)}
                                            className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={updating === editingPincode.pincode}
                                            className="flex-[2] py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                                        >
                                            {updating === editingPincode.pincode ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                'Save Perimeter Data'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {editingDistrict && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <div
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                                onClick={() => setEditingDistrict(null)}
                            />
                            <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
                                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                            <Building2 size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black uppercase text-slate-900 dark:text-white italic tracking-tighter">
                                                Edit District{' '}
                                                <span className="text-indigo-600">{editingDistrict.name}</span>
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Bulk update district metadata
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setEditingDistrict(null)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400 transition-colors"
                                    >
                                        <XCircle size={24} />
                                    </button>
                                </div>
                                <form onSubmit={handleSaveDistrictEdit} className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <Building2 size={12} className="text-blue-500" />
                                                District Name
                                            </label>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                                                value={editingDistrict.name || ''}
                                                onChange={e =>
                                                    setEditingDistrict({ ...editingDistrict, name: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <MapIcon size={12} className="text-indigo-500" />
                                                State
                                            </label>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                                                value={editingDistrict.state || ''}
                                                onChange={e =>
                                                    setEditingDistrict({ ...editingDistrict, state: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <Zap size={12} className="text-rose-500" />
                                                RTO Codes (Primary)
                                            </label>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner placeholder:text-slate-300"
                                                placeholder="e.g., MH-12"
                                                value={editingDistrict.rtos.join(', ')}
                                                onChange={e =>
                                                    setEditingDistrict({
                                                        ...editingDistrict,
                                                        rtos: e.target.value
                                                            .split(',')
                                                            .map(s => s.trim())
                                                            .filter(Boolean),
                                                    })
                                                }
                                            />
                                            <p className="text-[9px] text-slate-400 font-bold italic">
                                                Note: Changing this will update all pincodes in this district.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-4 flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setEditingDistrict(null)}
                                            className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={updating === originalDistrictName}
                                            className="flex-[2] py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {updating === originalDistrictName ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                'Update District'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
