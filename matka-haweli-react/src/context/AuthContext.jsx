import { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider } from '../firebase';
import {
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      console.error('Google login error:', err);
      throw err;
    }
  };

  const setupRecaptcha = (containerId) => {
    try {
      if (!auth) return null;
      // If we already have a verifier instance, reuse it to avoid double-rendering error
      if (window.recaptchaVerifier) {
        return window.recaptchaVerifier;
      }
      const verifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        }
      });
      window.recaptchaVerifier = verifier;
      return verifier;
    } catch (err) {
      console.error('Error setting up RecaptchaVerifier:', err);
      throw err;
    }
  };

  const sendOtp = async (phoneNumber, verifier) => {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      return confirmationResult;
    } catch (err) {
      console.error('Error sending OTP:', err);
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, setupRecaptcha, sendOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
