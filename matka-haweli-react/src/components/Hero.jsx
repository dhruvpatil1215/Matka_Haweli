import { useEffect, useRef } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

/* ─── Floating smoke/ember canvas ─── */
function AmbientCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 55 }, () => createParticle(canvas));

    function createParticle(c, atBottom = false) {
      const isEmber = Math.random() < 0.35;
      return {
        x: Math.random() * c.width,
        y: atBottom ? c.height + 10 : Math.random() * c.height,
        size: isEmber ? Math.random() * 2.5 + 0.5 : Math.random() * 14 + 6,
        speedY: -(Math.random() * 0.6 + (isEmber ? 0.8 : 0.2)),
        speedX: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.55 + 0.05,
        isEmber,
        hue: isEmber ? Math.floor(Math.random() * 30 + 15) : 0,
        life: Math.random(),
        decay: Math.random() * 0.002 + 0.001,
        wobble: Math.random() * Math.PI * 2,
      };
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.wobble += 0.018;
        p.x += p.speedX + Math.sin(p.wobble) * 0.35;
        p.y += p.speedY;
        p.life -= p.decay;

        if (p.life <= 0 || p.y < -20) {
          particles[i] = createParticle(canvas, true);
          return;
        }

        const alpha = p.life * p.opacity;
        if (p.isEmber) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.shadowBlur = 8;
          ctx.shadowColor = `hsl(${p.hue}, 100%, 60%)`;
          ctx.fillStyle = `hsl(${p.hue}, 100%, 65%)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          g.addColorStop(0, `rgba(180,100,30,${alpha * 0.14})`);
          g.addColorStop(1, `rgba(30,20,10,0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-ambient-canvas" aria-hidden="true" />;
}

export default function Hero() {
  const heroContentRef = useRef(null);
  const fireBgRef      = useRef(null);

  const est     = useScrollReveal({ animation: 'fade-down' });
  const ornament= useScrollReveal({ animation: 'zoom' });
  const title   = useScrollReveal({ animation: 'fade-up' });
  const tagline = useScrollReveal({ animation: 'fade-up' });
  const desc    = useScrollReveal({ animation: 'fade-up', delay: 100 });
  const buttons = useScrollReveal({ animation: 'fade-up', delay: 200 });
  const scroll  = useScrollReveal({ animation: 'fade-up', delay: 400 });

  useEffect(() => {
    const handleScroll = () => {
      const s  = window.scrollY;
      const h  = heroContentRef.current;
      const bg = fireBgRef.current;
      if (h && s < window.innerHeight) {
        h.style.transform = `translateY(${s * 0.18}px)`;
        h.style.opacity   = 1 - (s / window.innerHeight) * 0.55;
        if (bg) bg.style.transform = `scale(${1 + s * 0.00025})`;
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

      {/* ── Background fire image ── */}
      <div className="hero-fire-bg">
        <img ref={fireBgRef} src="/assets/fire-bg.png" alt="" aria-hidden="true" className="fire-image" />
        <div className="fire-overlay" />
      </div>

      {/* ── Ambient particles canvas ── */}
      <AmbientCanvas />

      {/* ── Left flame pillar ── */}
      <div className="hero-flame-pillar hero-flame-pillar--left" aria-hidden="true">
        <svg viewBox="0 0 80 260" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="flameL1" x1="40" y1="260" x2="40" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF4500" stopOpacity="0.9"/>
              <stop offset="40%" stopColor="#FF8C00" stopOpacity="0.75"/>
              <stop offset="80%" stopColor="#FFD700" stopOpacity="0.45"/>
              <stop offset="100%" stopColor="#FFF5CC" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="flameL2" x1="40" y1="260" x2="40" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#C0392B" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#FF6B35" stopOpacity="0"/>
            </linearGradient>
            <filter id="flameBlur"><feGaussianBlur stdDeviation="3"/></filter>
          </defs>
          <path d="M40 260 C20 200 5 175 10 140 C15 110 30 100 25 70 C22 50 35 20 40 0 C45 20 58 50 55 70 C50 100 65 110 70 140 C75 175 60 200 40 260Z" fill="url(#flameL1)" filter="url(#flameBlur)"/>
          <path d="M40 260 C28 210 18 185 22 155 C26 130 38 118 35 90 C33 70 40 45 40 30 C40 45 47 70 45 90 C42 118 54 130 58 155 C62 185 52 210 40 260Z" fill="url(#flameL2)"/>
        </svg>
      </div>

      {/* ── Right flame pillar ── */}
      <div className="hero-flame-pillar hero-flame-pillar--right" aria-hidden="true">
        <svg viewBox="0 0 80 260" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="flameR1" x1="40" y1="260" x2="40" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF4500" stopOpacity="0.9"/>
              <stop offset="40%" stopColor="#FF8C00" stopOpacity="0.75"/>
              <stop offset="80%" stopColor="#FFD700" stopOpacity="0.45"/>
              <stop offset="100%" stopColor="#FFF5CC" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="flameR2" x1="40" y1="260" x2="40" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#C0392B" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#FF6B35" stopOpacity="0"/>
            </linearGradient>
            <filter id="flameBlurR"><feGaussianBlur stdDeviation="3"/></filter>
          </defs>
          <path d="M40 260 C20 200 5 175 10 140 C15 110 30 100 25 70 C22 50 35 20 40 0 C45 20 58 50 55 70 C50 100 65 110 70 140 C75 175 60 200 40 260Z" fill="url(#flameR1)" filter="url(#flameBlurR)"/>
          <path d="M40 260 C28 210 18 185 22 155 C26 130 38 118 35 90 C33 70 40 45 40 30 C40 45 47 70 45 90 C42 118 54 130 58 155 C62 185 52 210 40 260Z" fill="url(#flameR2)"/>
        </svg>
      </div>

      {/* ── Radial ambient glow ── */}
      <div className="hero-glow-center"  aria-hidden="true" />
      <div className="hero-glow-bottom"  aria-hidden="true" />

      {/* ── Main content ── */}
      <div className="hero-content" ref={heroContentRef}>

        {/* Established line */}
        <div ref={est.ref} className={`hero-est ${est.className}`}>
          <span className="est-line" />
          <span className="est-text">EST. 2025 — VIRAR WEST, MUMBAI</span>
          <span className="est-line" />
        </div>

        {/* Golden ornament */}
        <div ref={ornament.ref} className={`hero-ornament ${ornament.className}`} aria-hidden="true">
          <svg viewBox="0 0 160 28" fill="none" width="160" height="28">
            <line x1="0" y1="14" x2="54" y2="14" stroke="url(#ornGold)" strokeWidth="1"/>
            <circle cx="62" cy="14" r="3" fill="#D4A349" opacity=".7"/>
            <path d="M80 4 L84 14 L80 24 L76 14 Z" fill="#D4A349"/>
            <circle cx="98" cy="14" r="3" fill="#D4A349" opacity=".7"/>
            <line x1="106" y1="14" x2="160" y2="14" stroke="url(#ornGoldR)" strokeWidth="1"/>
            <defs>
              <linearGradient id="ornGold" x1="0" y1="0" x2="54" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#D4A349" stopOpacity="0"/>
                <stop offset="100%" stopColor="#D4A349" stopOpacity="0.8"/>
              </linearGradient>
              <linearGradient id="ornGoldR" x1="106" y1="0" x2="160" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#D4A349" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#D4A349" stopOpacity="0"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Main title */}
        <h1 ref={title.ref} className={`hero-title title-animate ${title.className}`}>
          <span className="title-matka">MATKA</span>
          <span className="title-haweli">HAWELI</span>
        </h1>

        {/* Tagline */}
        <div ref={tagline.ref} className={`hero-tagline ${tagline.className}`}>
          <span className="tagline-gem">◆</span>
          <span className="tagline-text">TASTE THE FIRE</span>
          <span className="tagline-gem">◆</span>
        </div>

        {/* Description */}
        <p ref={desc.ref} className={`hero-desc ${desc.className}`}>
          A regal courtyard of clay-pot biryanis, charcoal kebabs and slow-burnt spices —<br/>
          where every dish tells a story of flame and heritage.
        </p>

        {/* CTA Buttons */}
        <div ref={buttons.ref} className={`hero-buttons ${buttons.className}`}>
          <button className="hero-btn hero-btn--primary" id="viewMenuBtn" onClick={() => scrollTo('menu')}>
            <span className="hero-btn-bg" />
            <span className="hero-btn-inner">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
                <path d="M3 4h14v2H3zm0 5h14v2H3zm0 5h10v2H3z"/>
              </svg>
              VIEW MENU
            </span>
          </button>
          <button className="hero-btn hero-btn--outline" id="reserveTableBtn" onClick={() => scrollTo('contact')}>
            <span className="hero-btn-inner">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
                <path d="M17 3H3a1 1 0 00-1 1v12a1 1 0 001 1h14a1 1 0 001-1V4a1 1 0 00-1-1zm-1 12H4V8h12v7zm0-9H4V5h12v1z"/>
              </svg>
              RESERVE A TABLE
            </span>
          </button>
        </div>

        {/* Scroll indicator */}
        <div ref={scroll.ref} className={`hero-scroll ${scroll.className}`}>
          <span className="scroll-text">SCROLL</span>
          <div className="scroll-line-wrap">
            <span className="scroll-line" />
          </div>
        </div>
      </div>
    </section>
  );
}
