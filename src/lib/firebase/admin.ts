import 'server-only';
import admin from 'firebase-admin';
import { getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// Singleton initialization
function formatPrivateKey(key: string) {
    return key.replace(/\\n/g, '\n');
}

export function initFirebaseAdmin() {
    if (getApps().length > 0) {
        return getApp();
    }

    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    let credential;

    if (serviceAccountPath) {
        try {
            // Try reading from file path (Local/Development)
            const raw = fs.readFileSync(path.resolve(process.cwd(), serviceAccountPath), 'utf8');
            const serviceAccount = JSON.parse(raw);
            credential = admin.credential.cert(serviceAccount);
        } catch (e) {
            console.warn('Failed to read FIREBASE_SERVICE_ACCOUNT_PATH, checking for direct env vars...');
        }
    }

    // Fallback or Production: Direct Env Vars (Vercel compliant)
    if (!credential) {
        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            credential = admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
            });
        } else {
            throw new Error('Firebase Admin SDK: Missing Service Account Credentials (PATH or ENV vars).');
        }
    }

    return admin.initializeApp({
        credential,
    });
}

export function getAdminFirestore() {
    initFirebaseAdmin();
    return getFirestore();
}
