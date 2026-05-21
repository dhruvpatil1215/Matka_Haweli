import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { useToast } from '../context/ToastContext';

export default function LoginModal() {
  const { showLogin, setShowLogin, setShowOrder } = useOrder();
  const { loginWithGoogle } = useAuth();
  const { addToast } = useToast();

  if (!showLogin) return null;

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      setShowLogin(false);
      setShowOrder(true);
      addToast('Successfully signed in with Google!', 'success');
    } catch (err) {
      console.error(err);
      
      // Provide user-friendly instructions depending on the Firebase error code
      if (err.code === 'auth/unauthorized-domain') {
        addToast('Login Blocked: This local IP is not authorized in Firebase Console.', 'error', 5000);
      } else if (err.code === 'auth/operation-not-allowed') {
        addToast('Google Sign-In is not enabled in your Firebase Console.', 'error', 5000);
      } else {
        addToast(err.message || 'Failed to sign in with Google.', 'error');
      }
    }
  };

  const handleGuest = () => {
    setShowLogin(false);
    setShowOrder(true);
    addToast('Continuing as Guest', 'info');
  };

  return (
    <div className="modal-overlay" onClick={() => setShowLogin(false)}>
      <div className="modal-card login-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="modal-close" onClick={() => setShowLogin(false)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Decorative top glow */}
        <div className="modal-glow"></div>

        {/* Flame icon */}
        <div className="login-flame">
          <svg viewBox="0 0 48 48" width="56" height="56">
            <path d="M24 4C24 4 12 18 12 28C12 34.6 17.4 40 24 40C30.6 40 36 34.6 36 28C36 18 24 4 24 4ZM24 36C19.6 36 16 32.4 16 28C16 23.6 20 16 24 11C28 16 32 23.6 32 28C32 32.4 28.4 36 24 36Z" fill="url(#loginFlame)" />
            <defs>
              <linearGradient id="loginFlame" x1="24" y1="4" x2="24" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF6B35" />
                <stop offset="100%" stopColor="#C0392B" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h2 className="login-title">Welcome to <span className="text-fire">Matka Haweli</span></h2>
        <p className="login-subtitle">Sign in to place your order</p>

        {/* Google Login Button */}
        <button className="login-google-btn" onClick={handleGoogle}>
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Continue as Guest Button */}
        <button className="login-guest-btn" onClick={handleGuest}>
          Continue as Guest
        </button>

        <div className="login-divider">
          <span>Secure Checkout</span>
        </div>

        <p className="login-privacy">
          🔒 Your data is safe. We only use your name to personalise your order receipt.
        </p>
      </div>
    </div>
  );
}
