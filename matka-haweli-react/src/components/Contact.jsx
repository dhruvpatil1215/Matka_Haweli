import { useState } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { supabase } from '../lib/supabase';

const ADMIN_WHATSAPP = '917011822978';

export default function Contact() {
  const header = useScrollReveal({ animation: 'fade-up' });
  const info = useScrollReveal({ animation: 'slide-right' });
  const formWrap = useScrollReveal({ animation: 'slide-left' });
  const mapWrap = useScrollReveal({ animation: 'fade-up', delay: 200 });

  const [formData, setFormData] = useState({
    fname: '', fphone: '', fdate: '', ftime: '', fguests: '', fmsg: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    try {
      const guestCount = parseInt(formData.fguests) || 2;
      const { error: resError } = await supabase
        .from('reservations')
        .insert({
          name: formData.fname,
          phone: formData.fphone,
          date: formData.fdate,
          time: formData.ftime,
          guests: guestCount,
          notes: formData.fmsg.trim() || null,
          status: 'pending'
        });

      if (resError) throw resError;
    } catch (err) {
      console.error('Error saving reservation to database:', err);
    }

    // Build WhatsApp reservation message
    const lines = [];
    lines.push('🔥 *MATKA HAWELI — TABLE RESERVATION* 🔥');
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push(`👤 *Name:* ${formData.fname}`);
    lines.push(`📞 *Phone:* ${formData.fphone}`);
    lines.push(`📅 *Date:* ${formData.fdate}`);
    lines.push(`🕐 *Time:* ${formData.ftime}`);
    lines.push(`👥 *Guests:* ${formData.fguests}`);
    if (formData.fmsg.trim()) {
      lines.push('');
      lines.push(`📝 *Special Request:* ${formData.fmsg}`);
    }
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push(`🕐 Sent: ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`);

    const encoded = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encoded}`, '_blank');

    setTimeout(() => {
      setSubmitted(false);
      setFormData({ fname: '', fphone: '', fdate: '', ftime: '', fguests: '', fmsg: '' });
    }, 3000);
  };

  return (
    <section id="contact" className="section contact-section">
      <div className="container">
        <div ref={header.ref} className={`section-header ${header.className}`}>
          <span className="section-label">VISIT US</span>
          <h2 className="section-title">Reserve Your <span className="text-fire">Table</span></h2>
          <div className="title-underline"></div>
        </div>

        <div className="contact-grid">
          <div ref={info.ref} className={`contact-info ${info.className}`}>
            <p className="contact-intro">Experience the warmth of Matka Haweli. Walk in or reserve your spot for an unforgettable evening.</p>
            <div className="info-item">
              <div className="info-icon">📍</div>
              <div><strong>Location</strong><p>Matka Haweli, Main Road, Virar West, Maharashtra 401303</p></div>
            </div>
            <div className="info-item">
              <div className="info-icon">📞</div>
              <div><strong>Phone</strong><p>+91 70118 22978</p></div>
            </div>
            <div className="info-item">
              <div className="info-icon">🕐</div>
              <div><strong>Hours</strong><p>Mon–Sun: 11:00 AM – 11:00 PM</p></div>
            </div>
            <div className="info-item">
              <div className="info-icon">💬</div>
              <div><strong>WhatsApp</strong><p>+91 70118 22978</p></div>
            </div>
          </div>

          <div ref={formWrap.ref} className={`contact-form-wrap ${formWrap.className}`}>
            <form className="reservation-form" id="reservationForm" onSubmit={handleSubmit}>
              <h3>Make a Reservation</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fname">Full Name</label>
                  <input type="text" id="fname" name="fname" placeholder="Your Name" required value={formData.fname} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="fphone">Phone</label>
                  <input type="tel" id="fphone" name="fphone" placeholder="+91 XXXXX XXXXX" required value={formData.fphone} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fdate">Date</label>
                  <input type="date" id="fdate" name="fdate" required value={formData.fdate} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="ftime">Time</label>
                  <input type="time" id="ftime" name="ftime" required value={formData.ftime} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="fguests">Number of Guests</label>
                <select id="fguests" name="fguests" required value={formData.fguests} onChange={handleChange}>
                  <option value="">Select guests</option>
                  <option>1-2 Guests</option>
                  <option>3-4 Guests</option>
                  <option>5-6 Guests</option>
                  <option>7-10 Guests</option>
                  <option>10+ (Party)</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="fmsg">Special Requests</label>
                <textarea id="fmsg" name="fmsg" rows="3" placeholder="Dietary requirements or special occasions..." value={formData.fmsg} onChange={handleChange}></textarea>
              </div>
              <button
                type="submit"
                className="btn-primary btn-full"
                style={submitted ? { background: 'linear-gradient(135deg,#27ae60,#2ecc71)', pointerEvents: 'none' } : {}}
              >
                {submitted ? (
                  <span>✓ SENT VIA WHATSAPP!</span>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ flexShrink: 0 }}>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span>RESERVE VIA WHATSAPP</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Google Maps Embed */}
        <div ref={mapWrap.ref} className={`contact-map-wrap ${mapWrap.className}`}>
          <div className="contact-map-header">
            <span className="info-icon">🗺️</span>
            <h3>Find Us Here</h3>
          </div>
          <div className="contact-map">
            <iframe
              title="Matka Haweli Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.5!2d72.7921!3d19.4559!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDI3JzIxLjIiTiA3MsKwNDcnMzEuNiJF!5e0!3m2!1sen!2sin!4v1700000000000"
              width="100%"
              height="350"
              style={{ border: 0, borderRadius: '14px' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}
