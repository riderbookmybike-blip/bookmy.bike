
import { VehicleUnit } from '@/types/vehicleUnit';
import { LedgerEntry } from '@/types/ledger';
import { Booking } from '@/types/booking';

import { Quote as AumsQuote, MockOrder as AumsMockOrder } from './aums/dataStore';

export type Quote = AumsQuote;
import { Invoice as InvoiceType } from '@/types/invoice';
export type Invoice = InvoiceType;
export type MockOrder = AumsMockOrder;
export type SalesOrder = AumsMockOrder;

export const getQuotes = (): Quote[] => [];
export const getSalesOrders = (): SalesOrder[] => [];
export const getBookings = (): Booking[] => [];

export const getVins = (): VehicleUnit[] => {
    return [];
};

export const getVehicleUnit = (vin: string): VehicleUnit | undefined => undefined;

export const getPartyLedger = (partyId: string): LedgerEntry[] => {

    return [];
};


export const updateBookingStatus = (id: string, updates: any, reason?: string) => { };
export const deliverBooking = (id: string, deliveryDetails: any) => { };
export const completePDI = (id: string, pdiDetails: any) => { };
export const acknowledgeDocuments = (id: string, docDetails: any) => { };
export const generateInvoice = (bookingId: string) => { };
export const getInvoice = (bookingId: string): Invoice | undefined => undefined;
export const recordPayment = (invoiceId: string, amount: number, mode: string, ref: string) => { };
export const getReceiptsForInvoice = (invoiceId: string): any[] => [];
export const assignVinToBooking = (bookingId: string, vinId: string) => { };
