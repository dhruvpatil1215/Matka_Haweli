import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';

/* ─── helpers ─── */
function parsePrice(price) {
  return parseInt(String(price).replace(/[^\d]/g, ''), 10) || 0;
}

export default function OrderPanel() {
  const {
    showOrder, setShowOrder,
    items, removeItem, addItem, deleteItem, clearOrder,
    totalItems, totalPrice,
    setShowHistory,
  } = useOrder();
  const { user, logout } = useAuth();
  const { addToast } = useToast();

  /* step: 'cart' | 'details' | 'success' */
  const [step, setStep] = useState('cart');

  /* details form */
  const [fullName, setFullName]           = useState(user?.displayName || '');
  const [phone, setPhone]                 = useState('');
  const [email, setEmail]                 = useState(user?.email || '');
  const [orderType, setOrderType]         = useState('pickup');
  const [tableNumber, setTableNumber]     = useState('');
  const [note, setNote]                   = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [orderSuccess, setOrderSuccess]   = useState(null);

  if (!showOrder) return null;

  /* ── close & reset ── */
  const handleClose = () => {
    setShowOrder(false);
    setStep('cart');
    setOrderSuccess(null);
  };

  /* ── proceed from cart → details ── */
  const handleProceed = () => {
    if (items.length === 0) {
      addToast('Add at least one item to proceed.', 'error');
      return;
    }
    setStep('details');
  };

  /* ── submit order ── */
  const handlePlaceOrder = async () => {
    if (!fullName.trim()) {
      addToast('Please enter your full name.', 'error'); return;
    }
    if (!phone.trim()) {
      addToast('Please enter your phone number.', 'error'); return;
    }
    if (orderType === 'dine-in' && !tableNumber.trim()) {
      addToast('Please enter your table number.', 'error'); return;
    }
    setSubmitting(true);
    try {
      const itemsSummary = items.map(i => `• ${i.name} (x${i.qty})`).join('\n');
      const orderDetails = [
        `Type: ${orderType === 'dine-in' ? `Dine-In (Table ${tableNumber.trim()})` : orderType === 'delivery' ? 'Delivery' : 'Pickup / Takeaway'}`,
        `Phone: ${phone.trim()}`,
        email.trim() ? `Email: ${email.trim()}` : null,
      ].filter(Boolean).join('\n');

      const combinedNotes = note.trim()
        ? `[ITEMS]\n${itemsSummary}\n\n[DETAILS]\n${orderDetails}\n\n[USER NOTE]\n${note.trim()}`
        : `[ITEMS]\n${itemsSummary}\n\n[DETAILS]\n${orderDetails}`;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id:      user?.uid || null,
          user_name:    fullName.trim(),
          user_email:   email.trim() || user?.email || null,
          user_phone:   phone.trim(),
          order_type:   orderType,
          status:       'pending',
          total_amount: totalPrice,
          notes:        combinedNotes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      if (orderData && items.length > 0) {
        const payload = items.map(i => ({
          order_id:   orderData.id,
          item_name:  i.name,
          item_price: i.price,
          quantity:   i.qty,
        }));
        const { error: itemsError } = await supabase.from('order_items').insert(payload);
        if (itemsError) throw itemsError;
      }

      const shortId = orderData.id
        ? orderData.id.replace(/-/g, '').slice(0, 8).toUpperCase()
        : Math.random().toString(36).slice(2, 10).toUpperCase();

      clearOrder();
      setOrderSuccess({ shortId });
      setStep('success');
      setPhone(''); setNote(''); setTableNumber(''); setOrderType('pickup');
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Failed to place order. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ════════════════════════════════
     STEP INDICATOR
  ════════════════════════════════ */
  const StepBar = ({ current }) => (
    <div className="op-stepbar">
      <div className={`op-step-item ${current === 'cart' || current === 'details' ? 'op-step-done' : ''}`}>
        <span className={`op-step-circle ${current === 'cart' ? 'op-step-active' : current === 'details' || current === 'success' ? 'op-step-complete' : ''}`}>
          {current === 'details' || current === 'success' ? '✓' : '1'}
        </span>
        <span className="op-step-label">Cart</span>
      </div>
      <div className="op-step-line" />
      <div className={`op-step-item ${current === 'details' || current === 'success' ? 'op-step-done' : ''}`}>
        <span className={`op-step-circle ${current === 'details' ? 'op-step-active' : current === 'success' ? 'op-step-complete' : ''}`}>
          {current === 'success' ? '✓' : '2'}
        </span>
        <span className="op-step-label">Details</span>
      </div>
    </div>
  );

  /* ════════════════════════════════
     TOP BAR (shared)
  ════════════════════════════════ */
  const TopBar = () => (
    <div className="op-topbar">
      <div className="op-topbar-left">
        <span className="op-topbar-cart-icon">🛒</span>
        <div>
          <div className="op-topbar-title">Your Order</div>
          <div className="op-topbar-subtitle">
            {step === 'success'
              ? 'Order confirmed!'
              : `${totalItems} item${totalItems !== 1 ? 's' : ''}`}
          </div>
        </div>
      </div>
      <button className="op-close-btn" onClick={handleClose}>✕</button>
    </div>
  );

  /* ════════════════════════════════
     SUCCESS SCREEN
  ════════════════════════════════ */
  if (step === 'success') {
    return (
      <div className="op-overlay" onClick={handleClose}>
        <div className="op-sheet" onClick={e => e.stopPropagation()}>
          <TopBar />
          <div className="op-success-body">
            <div className="op-success-emoji">🎉</div>
            <h2 className="op-success-heading">Order Placed!</h2>
            <p className="op-success-sub">Your order has been received and is being prepared.</p>
            <div className="op-id-pill">
              Order ID: <strong>#{orderSuccess?.shortId}</strong>
            </div>
            <div className="op-status-steps">
              <div className="op-status-row">
                <span className="op-dot op-dot--green" />
                <span className="op-status-text">Order Received ✅</span>
              </div>
              <div className="op-status-row">
                <span className="op-dot op-dot--muted" />
                <span className="op-status-text op-status-dim">Being Prepared 👨‍🍳</span>
              </div>
              <div className="op-status-row">
                <span className="op-dot op-dot--muted" />
                <span className="op-status-text op-status-dim">Ready Soon 🔥</span>
              </div>
            </div>
          </div>
          <div className="op-footer-fixed">
            <button className="op-cta-btn" onClick={handleClose}>
              🍽️ Continue Browsing
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════
     STEP 2 — DETAILS
  ════════════════════════════════ */
  if (step === 'details') {
    return (
      <div className="op-overlay" onClick={handleClose}>
        <div className="op-sheet" onClick={e => e.stopPropagation()}>
          <TopBar />
          <StepBar current="details" />

          <div className="op-body">
            <h3 className="op-section-title">Your Details</h3>

            <div className="op-field-group">
              <label className="op-label">Full Name <span className="op-required">*</span></label>
              <input
                className="op-input"
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>

            <div className="op-field-group">
              <label className="op-label">Phone Number <span className="op-required">*</span></label>
              <input
                className="op-input"
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div className="op-field-group">
              <label className="op-label">Email <span className="op-optional">(optional)</span></label>
              <input
                className="op-input"
                type="email"
                placeholder="e.g. rahul@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="op-field-group">
              <label className="op-label">Order Type</label>
              <div className="op-type-grid">
                {[
                  { id: 'pickup',   emoji: '🛍️', label: 'Pickup' },
                  { id: 'dine-in',  emoji: '🍽️', label: 'Dine-In' },
                  { id: 'delivery', emoji: '🛵', label: 'Delivery' },
                ].map(t => (
                  <button
                    key={t.id}
                    className={`op-type-card ${orderType === t.id ? 'op-type-card--active' : ''}`}
                    onClick={() => setOrderType(t.id)}
                  >
                    <span className="op-type-emoji">{t.emoji}</span>
                    <span className="op-type-label">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {orderType === 'dine-in' && (
              <div className="op-field-group">
                <label className="op-label">Table Number <span className="op-required">*</span></label>
                <input
                  className="op-input"
                  type="number"
                  placeholder="Enter your table number"
                  value={tableNumber}
                  onChange={e => setTableNumber(e.target.value)}
                  min="1"
                />
              </div>
            )}

            <div className="op-field-group">
              <label className="op-label">Special Instructions</label>
              <textarea
                className="op-input op-textarea"
                rows="3"
                placeholder="Allergies, spice level, special requests..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            {/* order summary mini */}
            <div className="op-mini-summary">
              <div className="op-summary-row">
                <span>Subtotal</span><span>₹{totalPrice}</span>
              </div>
              <div className="op-summary-row op-summary-muted">
                <span>Taxes &amp; charges</span><span>Included</span>
              </div>
              <div className="op-summary-row op-summary-total">
                <span>Total</span><span>₹{totalPrice}</span>
              </div>
            </div>
          </div>

          <div className="op-footer-fixed">
            <button className="op-back-btn" onClick={() => setStep('cart')}>← Back</button>
            <button
              className="op-cta-btn op-cta-flex"
              onClick={handlePlaceOrder}
              disabled={submitting}
            >
              {submitting ? 'Placing Order…' : 'Place Order →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════
     STEP 1 — CART
  ════════════════════════════════ */
  return (
    <div className="op-overlay" onClick={handleClose}>
      <div className="op-sheet" onClick={e => e.stopPropagation()}>
        <TopBar />
        <StepBar current="cart" />

        <div className="op-body">
          {items.length === 0 ? (
            <div className="op-empty">
              <span className="op-empty-icon">🍽️</span>
              <p>Your cart is empty.<br/>Browse the menu and add items!</p>
            </div>
          ) : (
            <>
              <div className="op-cart-list">
                {items.map(item => {
                  const basePrice = parsePrice(item.price);
                  return (
                    <div className="op-cart-item" key={item.name}>
                      <span className="op-cart-dot" />
                      <div className="op-cart-info">
                        <span className="op-cart-name">{item.name}</span>
                        <span className="op-cart-price">₹{basePrice * item.qty}</span>
                      </div>
                      <div className="op-cart-controls">
                        <button className="op-qty-btn" onClick={() => removeItem(item.name)}>−</button>
                        <span className="op-qty-num">{item.qty}</span>
                        <button className="op-qty-btn" onClick={() => addItem(item.name, item.price)}>+</button>
                        <button className="op-qty-btn op-qty-del" onClick={() => deleteItem(item.name)}>
                          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary card */}
              <div className="op-summary-card">
                <div className="op-summary-row">
                  <span>Subtotal</span><span>₹{totalPrice}</span>
                </div>
                <div className="op-summary-row op-summary-muted">
                  <span>Taxes &amp; charges</span><span>Included</span>
                </div>
                <div className="op-summary-divider" />
                <div className="op-summary-row op-summary-total">
                  <span>Total</span><span>₹{totalPrice}</span>
                </div>
              </div>
            </>
          )}

          {/* History link */}
          <button
            className="op-history-link"
            onClick={() => { setShowOrder(false); setShowHistory(true); }}
          >
            📜 View Order History
          </button>
        </div>

        <div className="op-footer-fixed">
          <button
            className="op-cta-btn"
            onClick={handleProceed}
            disabled={items.length === 0}
          >
            Proceed to Order Details →
          </button>
        </div>
      </div>
    </div>
  );
}
