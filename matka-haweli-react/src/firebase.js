// Firebase configuration for Matka Haweli
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCwjlXJVZ8q7en2Qzg0Ja3EeePiyELPidQ",
  authDomain: "matka-haveli.firebaseapp.com",
  projectId: "matka-haveli",
  storageBucket: "matka-haveli.firebasestorage.app",
  messagingSenderId: "839627504907",
  appId: "1:839627504907:web:ff8e37b6d0c154810a360e",
  measurementId: "G-25PQPB1D07"
};

// Prevent duplicate initialization during HMR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

