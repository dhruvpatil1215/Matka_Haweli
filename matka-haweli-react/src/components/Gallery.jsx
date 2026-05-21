import { useScrollReveal } from '../hooks/useScrollReveal';

const GALLERY_ITEMS = [
  { src: '/assets/dining-hall.jpg', alt: 'Matka Haweli Interior — Warm dining area with green wall decor and matka lamps', label: 'Royal Dining Hall', large: true },
  { src: '/assets/thali.png', alt: 'Traditional Thali', label: 'The Grand Thali' },
  { src: '/assets/tandoori.png', alt: 'Tandoori Platter', label: 'Tandoori Classics' },
  { src: '/assets/matka-hero.png', alt: 'Matka Cooking', label: 'The Matka Tradition' },
];

function GalleryItem({ item, delay }) {
  const { ref, className } = useScrollReveal({ animation: 'fade-up', delay });

  return (
    <div ref={ref} className={`gallery-item${item.large ? ' gallery-large' : ''} ${className}`}>
      <img src={item.src} alt={item.alt} loading="lazy" />
      <div className="gallery-overlay">
        <span className="gallery-label">{item.label}</span>
      </div>
    </div>
  );
}

export default function Gallery() {
  const header = useScrollReveal({ animation: 'fade-up' });

  return (
    <section id="gallery" className="section gallery-section">
      <div className="container">
        <div ref={header.ref} className={`section-header ${header.className}`}>
          <span className="section-label">AMBIENCE</span>
          <h2 className="section-title">Step Into The <span className="text-fire">Haweli</span></h2>
          <div className="title-underline"></div>
        </div>

        <div className="gallery-grid">
          {GALLERY_ITEMS.map((item, i) => (
            <GalleryItem key={item.label} item={item} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}
