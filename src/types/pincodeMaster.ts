export interface PincodeRecord {
    id: string; // Unique ID (e.g., pincode itself or uuid)
    pincode: string;
    taluka: string;
    district: string;
    state: string;
    area: string;
    rtoCode?: string; // e.g., MH-04
    latitude?: number;
    longitude?: number;
}

export interface DealerServiceArea {
    defaultDistricts: string[]; // Auto-derived from branch locations
    additionalDistricts: string[]; // Manually added
}
