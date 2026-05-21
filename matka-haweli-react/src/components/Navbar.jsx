import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';

const NAV_ITEMS = [
  { id: 'home', label: 'HOME' },
  { id: 'specials', label: 'SPECIALS' },
  { id: 'menu', label: 'MENU' },
  { id: 'gallery', label: 'GALLERY' },
  { id: 'about', label: 'ABOUT' },
  { id: 'contact', label: 'CONTACT' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const { user } = useAuth();
  const { totalItems, setShowLogin, setShowOrder, setShowHistory } = useOrder();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      // Active section detection
      const y = window.scrollY + 160;
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (y >= top && y < top + height) {
            setActiveSection(item.id);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setMenuOpen(false);
    }
  };

  const handleOrderClick = () => {
    if (user) {
      setShowOrder(true);
    } else {
      setShowLogin(true);
    }
  };

  return (
    <nav id="navbar" className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-container">
        <a href="#" className="nav-logo" id="navLogo" onClick={(e) => { e.preventDefault(); scrollTo('home'); }}>
          <svg className="flame-icon" viewBox="0 0 32 32" width="28" height="28">
            <path d="M16 2C16 2 8 12 8 20C8 24.4 11.6 28 16 28C20.4 28 24 24.4 24 20C24 12 16 2 16 2ZM16 25C13.2 25 11 22.8 11 20C11 16.8 14 12 16 9C18 12 21 16.8 21 20C21 22.8 18.8 25 16 25Z" fill="currentColor" />
          </svg>
          <span className="nav-brand-text">Matka <em>Haweli</em></span>
        </a>

        <ul className={`nav-links${menuOpen ? ' open' : ''}`} id="navLinks">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                className={`nav-link${activeSection === item.id ? ' active' : ''}`}
                onClick={() => scrollTo(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          {user && (
            <>
              <button 
                className="nav-history-btn" 
                onClick={() => setShowHistory(true)} 
                title="Order History"
              >
                📜 History
              </button>
              <button className="nav-user-btn" onClick={handleOrderClick} title={user.displayName || 'Your Order'}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="nav-user-avatar" referrerPolicy="no-referrer" />
                ) : (
                  <span className="nav-user-initial">{(user.displayName || 'U')[0]}</span>
                )}
                {totalItems > 0 && <span className="nav-user-badge">{totalItems}</span>}
              </button>
            </>
          )}
          <button className="nav-reserve-btn" id="navOrderBtn" onClick={handleOrderClick}>
            {user ? 'MY ORDER' : 'ORDER NOW'}
          </button>
        </div>

        <button
          className={`hamburger${menuOpen ? ' active' : ''}`}
          id="hamburger"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  );
}
