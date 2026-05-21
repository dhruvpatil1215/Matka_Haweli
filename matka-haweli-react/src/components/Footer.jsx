export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <svg className="flame-icon" viewBox="0 0 32 32" width="24" height="24">
              <path d="M16 2C16 2 8 12 8 20C8 24.4 11.6 28 16 28C20.4 28 24 24.4 24 20C24 12 16 2 16 2ZM16 25C13.2 25 11 22.8 11 20C11 16.8 14 12 16 9C18 12 21 16.8 21 20C21 22.8 18.8 25 16 25Z" fill="currentColor" />
            </svg>
            <div>
              <span className="footer-name">Matka Haweli</span>
              <span className="footer-sub">Flame-Kissed Flavors Since 2014</span>
            </div>
          </div>
          <div className="footer-socials">
            <a href="#" className="social-link" aria-label="Instagram">IG</a>
            <a href="#" className="social-link" aria-label="Facebook">FB</a>
            <a href="#" className="social-link" aria-label="YouTube">YT</a>
          </div>
        </div>
        <div className="footer-line"></div>
        <div className="footer-bottom">
          <p>&copy; 2024 Matka Haweli. All rights reserved.</p>
          <p className="crafted">Crafted with 🔥 and tradition</p>
        </div>
      </div>
    </footer>
  );
}
