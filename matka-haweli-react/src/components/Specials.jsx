import { useScrollReveal } from '../hooks/useScrollReveal';
import { useSpecialsData } from '../hooks/useMenuData';

const STATIC_SPECIALS = [
  { num: '01', emoji: '🥗', name: 'Veg Thali (भेज थाळी)', desc: 'डाळ, सुकी भाजी, रस्सा भाजी, पापड, दोन चपाती, लोणंच भात', price: '₹150', badge: 'Pure Veg' },
  { num: '02', emoji: '🍗', name: 'Chicken Thali (चिकन थाळी)', desc: 'सुखा चिकन आणि रस्सा, भात / २ चपाती / सोलकढी', price: '₹200', badge: 'Bestseller' },
  { num: '03', emoji: '🍖', name: 'Mutton Spe. Thali (मटण स्पे. थाळी)', desc: 'मटण आणि मटण रस्सा, भात / २ चपाती / सोलकढी', price: '₹299', badge: 'Premium' },
  { num: '04', emoji: '🐟', name: 'Surmai Thali (सुरमय थाळी)', desc: 'सुरमय रस्सा / फ्राय / जवळा, भात / १ भाकरी / सोलकढी', price: '₹350', badge: "Chef's Special" },
];

function SpecialCardSkeleton() {
  return (
    <div className="special-card special-card-skeleton shimmer" aria-hidden="true" />
  );
}

function SpecialCard({ item, delay }) {
  const { ref, className } = useScrollReveal({ animation: 'fade-up', delay });

  return (
    <div ref={ref} className={`special-card ${className}`}>
      <div className="card-glow"></div>
      <div className="card-number">{item.num}</div>
      <div className="card-emoji">{item.emoji}</div>
      <h3>{item.name}</h3>
      <p>{item.desc}</p>
      <div className="card-bottom">
        <span className="card-price">{item.price}</span>
        <span className="card-badge">{item.badge}</span>
      </div>
    </div>
  );
}

export default function Specials() {
  const header = useScrollReveal({ animation: 'fade-up' });
  const { specials: liveSpecials, loading } = useSpecialsData();

  const specials = liveSpecials.length > 0 ? liveSpecials : STATIC_SPECIALS;

  return (
    <section id="specials" className="section specials-section">
      <div className="container">
        <div ref={header.ref} className={`section-header ${header.className}`}>
          <span className="section-label">OUR SIGNATURE</span>
          <h2 className="section-title">Royal <span className="text-fire">Thali</span> Collection</h2>
          <div className="title-underline"></div>
        </div>

        <div className="specials-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SpecialCardSkeleton key={i} />)
            : specials.map((item, i) => (
                <SpecialCard key={item.num} item={item} delay={i * 100} />
              ))
          }
        </div>
      </div>
    </section>
  );
}
