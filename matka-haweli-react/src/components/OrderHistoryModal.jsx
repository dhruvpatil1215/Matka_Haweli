import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';

export default function OrderHistoryModal() {
  const { showHistory, setShowHistory, setShowLogin } = useOrder();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!showHistory || !user) return;

    let cancelled = false;

    async function fetchOrders() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchErr } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('user_id', user.uid)
          .order('created_at', { ascending: false });

        if (fetchErr) throw fetchErr;

        if (!cancelled) {
          setOrders(data || []);
        }
      } catch (err) {
        console.error('Error fetching order history:', err);
        if (!cancelled) {
          setError(err.message || 'Failed to load order history.');
          addToast('Could not fetch order history.', 'error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchOrders();

    return () => {
      cancelled = true;
    };
  }, [showHistory, user, addToast]);

  if (!showHistory) return null;

  const handleLoginRedirect = () => {
    setShowHistory(false);
    setShowLogin(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'badge-pending';
      case 'confirmed': return 'badge-confirmed';
      case 'preparing': return 'badge-preparing';
      case 'ready': return 'badge-ready';
      case 'delivered': return 'badge-delivered';
      case 'cancelled': return 'badge-cancelled';
      default: return 'badge-default';
    }
  };

  const formatOrderDate = (dateString) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setShowHistory(false)}>
      <div className="modal-card history-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close" onClick={() => setShowHistory(false)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="modal-glow"></div>

        {/* Header */}
        <div className="history-header">
          <h2 className="history-title">Order <span className="text-fire">History</span></h2>
          <p className="history-subtitle">Track your past and active orders</p>
        </div>

        {/* Content */}
        {!user ? (
          <div className="history-auth-prompt">
            <span className="history-prompt-icon">🔒</span>
            <h3>Sign in to view your orders</h3>
            <p>Please log in with Google to view and track your order history.</p>
            <button className="btn-checkout" onClick={handleLoginRedirect}>
              Log In Now
            </button>
          </div>
        ) : loading ? (
          <div className="history-loading">
            <div className="spinner"></div>
            <p>Fetching your orders...</p>
          </div>
        ) : error ? (
          <div className="history-error">
            <span className="history-error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="history-empty">
            <span className="history-empty-icon">📜</span>
            <h3>No orders found</h3>
            <p>You haven't placed any orders yet. Head to the menu to order your first meal!</p>
          </div>
        ) : (
          <div className="history-orders-list">
            {orders.map((order) => (
              <div className="history-order-card" key={order.id}>
                {/* Card Header */}
                <div className="history-card-header">
                  <div className="history-order-info">
                    <span className="history-order-date">{formatOrderDate(order.created_at)}</span>
                    <span className="history-order-id">ID: #{order.id.slice(0, 8)}</span>
                  </div>
                  <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                    {order.status?.toUpperCase()}
                  </span>
                </div>

                {/* Items List */}
                <div className="history-card-items">
                  {order.order_items && order.order_items.length > 0 ? (
                    order.order_items.map((item) => (
                      <div className="history-item-row" key={item.id}>
                        <span className="history-item-name">
                          {item.item_name} <span className="text-muted">x{item.quantity}</span>
                        </span>
                        <span className="history-item-price">
                          {String(item.item_price).startsWith('₹') ? item.item_price : `₹${item.item_price}`}
                        </span>
                      </div>
                    ))
                  ) : (
                    // Fallback to text summary in notes if order_items failed or wasn't populated
                    <div className="history-fallback-items">
                      {order.notes?.includes('[ITEMS]') ? (
                        order.notes.split('[DETAILS]')[0].replace('[ITEMS]\n', '').split('\n').filter(Boolean).map((line, idx) => (
                          <div className="history-item-row" key={idx}>
                            <span className="history-item-name">{line.replace('• ', '')}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted">View details in notes</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="history-card-footer">
                  <div className="history-order-type">
                    Type: <strong className="capitalize">{order.order_type === 'dine_in' ? 'Dine In' : 'Takeaway'}</strong>
                  </div>
                  <div className="history-order-total">
                    Total: <strong className="text-fire">₹{order.total_amount}</strong>
                  </div>
                </div>

                {/* Special Request Notes */}
                {order.notes?.includes('[USER NOTE]') && (
                  <div className="history-order-note">
                    <strong>Note:</strong> "{order.notes.split('[USER NOTE]')[1].trim()}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
