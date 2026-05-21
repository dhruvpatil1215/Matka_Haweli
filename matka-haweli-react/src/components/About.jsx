import { useScrollReveal, useCountUp } from '../hooks/useScrollReveal';

function StatItem({ target, suffix, label }) {
  const { ref, count } = useCountUp(target);
  return (
    <div className="stat">
      <span className="stat-num" ref={ref}>{count}</span>
      <span className="stat-suffix">{suffix}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export default function About() {
  const imgCol = useScrollReveal({ animation: 'slide-right' });
  const content = useScrollReveal({ animation: 'slide-left' });

  return (
    <section id="about" className="section about-section">
      <div className="container">
        <div className="about-grid">
          <div ref={imgCol.ref} className={`about-img-col ${imgCol.className}`}>
            <div className="about-img-wrapper">
              <img src="/assets/matka-hero.png" alt="Matka Cooking Tradition" loading="lazy" />
              <div className="about-badge">
                <span className="badge-num">10+</span>
                <span className="badge-text">Years of<br />Tradition</span>
              </div>
            </div>
          </div>
          <div ref={content.ref} className={`about-content ${content.className}`}>
            <span className="section-label">OUR STORY</span>
            <h2 className="section-title">A Legacy Forged<br />in <span className="text-fire">Flame</span></h2>
            <div className="title-underline left"></div>
            <p>At Matka Haweli, we believe the finest flavors are born from patience and tradition. Our chefs craft each dish in handcrafted clay matkas, slow-cooked over open flames — a technique passed down through generations.</p>
            <p>The earthen pot infuses every morsel with a smoky, rustic essence that no modern cookware can replicate. This is not just dining — it's a journey through India's rich culinary heritage.</p>
            <div className="about-stats">
              <StatItem target={50} suffix="+" label="Signature Dishes" />
              <StatItem target={15} suffix="K+" label="Happy Guests" />
              <StatItem target={4} suffix=".8★" label="Google Rating" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
