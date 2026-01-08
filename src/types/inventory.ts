export interface InventoryItem {
    id: string;
    sku: string; // Links to ProductVariant.sku

    // Product Details (Denormalized for display)
    brand: string;
    model: string;
    variant: string;
    color: string;

    // Quantities
    totalStock: number; // Physical stock on hand
    reserved: number;   // Soft Locked
    allotted: number;   // Hard Locked
    available: number;  // available = totalStock - reserved - allotted

    // Audit
    lastUpdated: string;
}

export interface StockTransaction {
    id: string;
    sku: string;
    type: 'INWARD' | 'RESERVE' | 'ALLOT' | 'RELEASE';
    quantity: number;
    referenceId: string; // Booking ID or GRN ID
    timestamp: string;
}
