export type VehicleUnitStatus = 'AVAILABLE' | 'ASSIGNED' | 'DELIVERED';

export interface VehicleUnit {
    id: string;
    vin: string; // The Chassis Number (Primary ID logically)
    engineNumber?: string;

    // Links
    sku: string; // Links to InventoryItem
    bookingId?: string; // Assigned Booking

    // State
    status: VehicleUnitStatus;
    location: string; // e.g., "Warehouse A"

    // Audit
    inwardDate: string;
    assignedDate?: string;
}
