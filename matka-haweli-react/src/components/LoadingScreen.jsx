export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        {/* Animated flame */}
        <div className="loading-flame">
          <svg viewBox="0 0 48 48" width="64" height="64">
            <path d="M24 4C24 4 12 18 12 28C12 34.6 17.4 40 24 40C30.6 40 36 34.6 36 28C36 18 24 4 24 4ZM24 36C19.6 36 16 32.4 16 28C16 23.6 20 16 24 11C28 16 32 23.6 32 28C32 32.4 28.4 36 24 36Z" fill="url(#loadFlame)" />
            <defs>
              <linearGradient id="loadFlame" x1="24" y1="4" x2="24" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF6B35" />
                <stop offset="100%" stopColor="#C0392B" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Brand name */}
        <h1 className="loading-brand">
          <span className="loading-matka">MATKA</span>
          <span className="loading-haweli">HAWELI</span>
        </h1>

        {/* Loading bar */}
        <div className="loading-bar-track">
          <div className="loading-bar-fill"></div>
        </div>

        <p className="loading-tagline">Taste The Fire</p>
      </div>
    </div>
  );
}
