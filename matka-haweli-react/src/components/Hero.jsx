import { useEffect, useRef } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function Hero() {
  const heroContentRef = useRef(null);
  const fireBgRef = useRef(null);

  const est = useScrollReveal({ animation: 'fade-down' });
  const flame = useScrollReveal({ animation: 'zoom' });
  const title = useScrollReveal({ animation: 'fade-up' });
  const tagline = useScrollReveal({ animation: 'fade-up' });
  const desc = useScrollReveal({ animation: 'fade-up', delay: 100 });
  const buttons = useScrollReveal({ animation: 'fade-up', delay: 200 });
  const scroll = useScrollReveal({ animation: 'fade-up', delay: 400 });

  // Parallax effect
  useEffect(() => {
    const handleScroll = () => {
      const s = window.scrollY;
      const h = heroContentRef.current;
      const bg = fireBgRef.current;
      if (h && s < window.innerHeight) {
        h.style.transform = `translateY(${s * 0.2}px)`;
        h.style.opacity = 1 - (s / window.innerHeight) * 0.6;
        if (bg) bg.style.transform = `scale(${1 + s * 0.0003})`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="hero">
      <div className="hero-fire-bg">
        <img ref={fireBgRef} src="/assets/fire-bg.png" alt="" aria-hidden="true" className="fire-image" />
        <div className="fire-overlay"></div>
      </div>

      <div className="hero-content" ref={heroContentRef}>
        <div ref={est.ref} className={`hero-est ${est.className}`}>
          <span className="est-line"></span>
          <span className="est-text">EST. 2014 — VIRAR WEST</span>
          <span className="est-line"></span>
        </div>

        <div ref={flame.ref} className={`hero-flame-icon ${flame.className}`}>
          <svg viewBox="0 0 48 48" width="48" height="48">
            <path d="M24 4C24 4 12 18 12 28C12 34.6 17.4 40 24 40C30.6 40 36 34.6 36 28C36 18 24 4 24 4ZM24 36C19.6 36 16 32.4 16 28C16 23.6 20 16 24 11C28 16 32 23.6 32 28C32 32.4 28.4 36 24 36Z" fill="url(#flameGrad)" />
            <defs>
              <linearGradient id="flameGrad" x1="24" y1="4" x2="24" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF6B35" />
                <stop offset="100%" stopColor="#C0392B" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 ref={title.ref} className={`hero-title title-animate ${title.className}`}>
          <span className="title-matka">MATKA</span>
          <span className="title-haweli">HAWELI</span>
        </h1>

        <div ref={tagline.ref} className={`hero-tagline ${tagline.className}`}>
          <span className="tagline-dot"></span>
          <span className="tagline-text">TASTE THE FIRE</span>
          <span className="tagline-sparkle">✦</span>
        </div>

        <p ref={desc.ref} className={`hero-desc ${desc.className}`}>
          A regal courtyard of clay-pot biryanis, charcoal kebabs and slow-burnt spices — where
          every dish tells a story of flame.
        </p>

        <div ref={buttons.ref} className={`hero-buttons ${buttons.className}`}>
          <button className="btn-primary" id="viewMenuBtn" onClick={() => scrollTo('menu')}>
            <span>VIEW MENU</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2C12 2 7 8 7 13C7 16.3 9.7 19 13 19C16.3 19 19 16.3 19 13C19 8 12 2 12 2Z" />
            </svg>
          </button>
          <button className="btn-outline" id="reserveTableBtn" onClick={() => scrollTo('contact')}>
            RESERVE A TABLE
          </button>
        </div>

        <div ref={scroll.ref} className={`hero-scroll ${scroll.className}`}>
          <span className="scroll-text">SCROLL</span>
          <svg className="scroll-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 10l5 5 5-5" />
          </svg>
        </div>
      </div>
    </section>
  );
}
