import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
};

if (!getApps().length) {
  console.log('[FirebaseAdmin] Initializing Firebase Admin SDK...');
  if (!serviceAccount.projectId) console.warn('[FirebaseAdmin] Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!serviceAccount.clientEmail) console.warn('[FirebaseAdmin] Missing FIREBASE_CLIENT_EMAIL');
  if (!serviceAccount.privateKey) console.warn('[FirebaseAdmin] Missing FIREBASE_PRIVATE_KEY');
  
  try {
    initializeApp({
      credential: cert(serviceAccount),
    });
    console.log('[FirebaseAdmin] Initialization successful');
  } catch (error) {
    console.error('[FirebaseAdmin] Initialization failed:', error);
  }
} else {
  console.log('[FirebaseAdmin] App already initialized');
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
