'use server';

import { db } from '@/lib/firebase/admin';

export async function getOngoingBookings() {
    try {
        // Based on user's screenshot: Aapli Collections -> Bookings -> Ongoing Bookings
        const snapshot = await db.collection('Aapli Collections')
            .doc('Bookings')
            .collection('Ongoing Bookings')
            .limit(50)
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching ongoing bookings from Firebase:', error);
        throw error;
    }
}

export async function getBookingDetails(bookingId: string) {
    try {
        const doc = await db.collection('Aapli Collections')
            .doc('Bookings')
            .collection('Ongoing Bookings')
            .doc(bookingId)
            .get();

        if (!doc.exists) return null;

        return {
            id: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error(`Error fetching booking ${bookingId}:`, error);
        throw error;
    }
}
