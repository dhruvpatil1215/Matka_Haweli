import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';

export default function OrderPanel() {
  const { showOrder, setShowOrder, items, removeItem, addItem, deleteItem, clearOrder, totalItems, totalPrice, setShowHistory } = useOrder();
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);



  if (!showOrder) return null;

  const displayName = customerName || user?.displayName || '';

  const handlePlaceOrder = async () => {
    const finalName = displayName.trim();
    if (!finalName) {
      addToast('Please enter your name to place the order.', 'error');
      return;
    }
    const finalPhone = customerPhone.trim();
    if (!finalPhone) {
      addToast('Please enter your phone number so we can confirm your order.', 'error');
      return;
    }


    setSubmitting(true);

    try {
      // Create a readable summary of the items for the orders table notes column
      const itemsSummary = items.map(item => `• ${item.name} (x${item.qty})`).join('\n');
      const orderDetails = [
        `Type: Takeaway / Parcel`,
        `Phone: ${finalPhone}`
      ].join('\n');

      const combinedNotes = note.trim()
        ? `[ITEMS]\n${itemsSummary}\n\n[DETAILS]\n${orderDetails}\n\n[USER NOTE]\n${note.trim()}`
        : `[ITEMS]\n${itemsSummary}\n\n[DETAILS]\n${orderDetails}`;

      // 1. Insert order into orders table
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.uid || null,
          user_name: finalName,
          user_email: user?.email || null,
          user_phone: finalPhone,
          order_type: orderType,
          status: 'pending',
          total_amount: totalPrice,
          notes: combinedNotes
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insert order items into order_items table
      if (orderData && items.length > 0) {
        const orderItemsPayload = items.map(item => ({
          order_id: orderData.id,
          item_name: item.name,
          item_price: item.price,
          quantity: item.qty
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsPayload);

        if (itemsError) throw itemsError;
      }

      // Success
      addToast('Takeaway order placed successfully!', 'success', 6000);
      
      // Reset state and close order panel
      clearOrder();
      setShowOrder(false);
      setCustomerName('');
      setCustomerPhone('');
      setNote('');
      // Keep table number auto-detected for future orders
    } catch (err) {
      console.error('Error saving order to Supabase:', err);
      addToast(err.message || 'Failed to place order. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setShowOrder(false)}>
      <div className="modal-card order-panel" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className="modal-close" onClick={() => setShowOrder(false)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="modal-glow"></div>

        {/* Header */}
        <div className="order-header">
          <h2 className="order-title">Your <span className="text-fire">Order</span></h2>
          <div className="order-header-right">
            {user && (
              <div className="order-user-info">
                {user.photoURL && <img src={user.photoURL} alt="" className="order-avatar" referrerPolicy="no-referrer" />}
                <div>
                  <span className="order-user-name">{user.displayName || 'Guest'}</span>
                  <span className="order-user-email">{user.email}</span>
                </div>
              </div>
            )}
            <button 
              className="history-trigger-btn"
              onClick={() => {
                setShowOrder(false);
                setShowHistory(true);
              }}
              title="View past orders"
            >
              📜 History
            </button>
          </div>
        </div>

        {/* Customer details form */}
        <div className="order-details-form">
          <div className="form-group">
            <label htmlFor="custName">Your Name</label>
            <input
              type="text"
              id="custName"
              placeholder={user?.displayName || 'Enter your name'}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="custPhone">Phone Number</label>
            <input
              type="tel"
              id="custPhone"
              placeholder="+91 XXXXX XXXXX"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>

        </div>

        {/* Order items */}
        {items.length === 0 ? (
          <div className="order-empty">
            <span className="order-empty-icon">🍽️</span>
            <p>No items yet. Browse the menu and add items!</p>
          </div>
        ) : (
          <div className="order-items-list">
            {items.map((item) => (
              <div className="order-item" key={item.name}>
                <div className="order-item-info">
                  <span className="order-item-name">{item.name}</span>
                  <span className="order-item-price">
                    {String(item.price).startsWith('₹') ? item.price : `₹${item.price}`}
                  </span>
                </div>
                <div className="order-item-controls">
                  <button className="qty-btn" onClick={() => removeItem(item.name)}>−</button>
                  <span className="qty-count">{item.qty}</span>
                  <button className="qty-btn" onClick={() => addItem(item.name, item.price)}>+</button>
                  <button className="qty-btn qty-delete" onClick={() => deleteItem(item.name)}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Note */}
        {items.length > 0 && (
          <div className="form-group" style={{ marginTop: '12px' }}>
            <label htmlFor="orderNote">Special Instructions</label>
            <textarea
              id="orderNote"
              rows="2"
              placeholder="Any special requests (e.g. spicy level, extra sauce)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            ></textarea>
          </div>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="order-footer">
            <div className="order-total">
              <span>Total ({totalItems} items)</span>
              <span className="order-total-price">₹{totalPrice}</span>
            </div>
            <button
              className="btn-checkout"
              onClick={handlePlaceOrder}
              disabled={submitting}
            >
              {submitting ? (
                <>Placing Order...</>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span>Order Now</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Logout */}
        {user && (
          <button className="order-logout-btn" onClick={logout}>
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
}
