import { useEffect, useRef } from 'react';

const COLORS = [
  'rgba(212,163,73,.8)',
  'rgba(232,115,26,.7)',
  'rgba(255,107,53,.6)',
  'rgba(240,212,138,.9)',
];

export default function EmberParticles() {
  const containerRef = useRef(null);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;

    for (let i = 0; i < 25; i++) {
      const e = document.createElement('div');
      e.classList.add('ember');
      e.style.left = Math.random() * 100 + '%';
      e.style.animationDuration = (Math.random() * 8 + 6) + 's';
      e.style.animationDelay = (Math.random() * 12) + 's';
      const s = Math.random() * 3 + 2;
      e.style.width = s + 'px';
      e.style.height = s + 'px';
      e.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
      c.appendChild(e);
    }

    return () => {
      while (c.firstChild) c.removeChild(c.firstChild);
    };
  }, []);

  return <div id="ember-container" ref={containerRef} aria-hidden="true" />;
}
