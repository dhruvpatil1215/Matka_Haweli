import { useScrollReveal } from '../hooks/useScrollReveal';

export default function Testimonial() {
  const card = useScrollReveal({ animation: 'fade-up' });

  return (
    <section className="section testimonial-section">
      <div className="container">
        <div ref={card.ref} className={`testimonial-card ${card.className}`}>
          <div className="quote-mark">"</div>
          <blockquote>
            The flavors at Matka Haweli transported me straight to the royal kitchens of Rajasthan. The Matka Gosht is deeply aromatic and soul-warming — unlike anything I've ever tasted.
          </blockquote>
          <div className="testimonial-author">
            <span className="author-name">— Priya Sharma</span>
            <span className="author-role">Food Critic, Mumbai</span>
          </div>
        </div>
      </div>
    </section>
  );
}
