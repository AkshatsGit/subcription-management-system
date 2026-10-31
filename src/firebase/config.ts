// Firebase Client SDK Configuration for Brightloop Subscription Management System
// Built by Team Ripple

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDq5iMk3G1pnV1pTgOU5Bhq61WaoD_DV3s',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'brightloop-7abbb.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'brightloop-7abbb',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'brightloop-7abbb.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '626741264896',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:626741264896:web:31220c814dbb357f55cee5',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-RSJM6GQH12',
};

// Initialize Firebase App singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to Emulators if configured in environment
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  const authUrl = import.meta.env.VITE_EMULATOR_AUTH_URL || 'http://localhost:9099';
  const firestoreHost = import.meta.env.VITE_EMULATOR_FIRESTORE_HOST || 'localhost';
  const firestorePort = Number(import.meta.env.VITE_EMULATOR_FIRESTORE_PORT) || 8080;
  const functionsPort = Number(import.meta.env.VITE_EMULATOR_FUNCTIONS_PORT) || 5001;

  try {
    connectAuthEmulator(auth, authUrl, { disableWarnings: true });
    connectFirestoreEmulator(db, firestoreHost, firestorePort);
    connectStorageEmulator(storage, firestoreHost, 9199);
    connectFunctionsEmulator(functions, firestoreHost, functionsPort);
    console.info('[Firebase] Connected to local emulator suite');
  } catch (err) {
    console.warn('[Firebase] Emulator connection warning:', err);
  }
}

