import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

// Default Admin PIN
const ADMIN_PIN = '8888';

export default function AdminDashboard() {
  const { addToast } = useToast();
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('matka_admin_auth') === 'true'
  );
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Orders data state
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'completed', 'cancelled'
  const [updatingId, setUpdatingId] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    activeCount: 0,
    todaySales: 0,
    todayCompleted: 0
  });

  // Track previous order IDs to play chime ONLY on new incoming pending orders
  const knownOrderIdsRef = useRef(new Set());

  // Handle PIN submission
  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      localStorage.setItem('matka_admin_auth', 'true');
      setIsAuthenticated(true);
      setPinError('');
      addToast('Welcome back, Admin!', 'success');
    } else {
      setPinError('Invalid passcode. Please try again.');
      setPinInput('');
      addToast('Access Denied: Incorrect PIN', 'error');
    }
  };

  // Log out admin
  const handleLogout = () => {
    localStorage.removeItem('matka_admin_auth');
    setIsAuthenticated(false);
    addToast('Logged out of Admin Panel.', 'info');
  };

  // Play retro chime when a new order arrives
  const playNewOrderChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      // Dual tone synthesizer (Beep beep)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12); // A5
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.4);

      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.5);
    } catch (err) {
      console.warn('Audio Context chime failed:', err);
    }
  };

  // Fetch all orders
  async function fetchOrders(showLoader = false) {
    if (showLoader) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const fetchedOrders = data || [];
      
      // Determine if there are new PENDING orders since last load to trigger chime
      if (knownOrderIdsRef.current.size > 0) {
        let hasNewPending = false;
        let newCustomer = '';
        
        fetchedOrders.forEach(o => {
          if (!knownOrderIdsRef.current.has(o.id)) {
            // Register it
            knownOrderIdsRef.current.add(o.id);
            // If it's pending, trigger alert
            if (o.status === 'pending') {
              hasNewPending = true;
              newCustomer = o.user_name || 'Guest';
            }
          }
        });

        if (hasNewPending) {
          playNewOrderChime();
          addToast(`🔔 New order received from ${newCustomer}!`, 'success', 8000);
        }
      } else {
        // Initial load: populate known IDs without chiming
        fetchedOrders.forEach(o => knownOrderIdsRef.current.add(o.id));
      }

      setOrders(fetchedOrders);

      // Calculate stats
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      let activeCount = 0;
      let todaySales = 0;
      let todayCompleted = 0;

      fetchedOrders.forEach(o => {
        const orderDate = new Date(o.created_at);
        const isActive = ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status);

        if (isActive) {
          activeCount++;
        }

        if (o.status === 'delivered' && orderDate >= startOfToday) {
          todayCompleted++;
          todaySales += Number(o.total_amount || 0);
        }
      });

      setStats({
        activeCount,
        todaySales,
        todayCompleted
      });

    } catch (err) {
      console.error('Admin fetch error:', err);
      addToast('Failed to load orders from database.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Load orders on authentication
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchOrders(true);

    // Set up Supabase Realtime Listener
    const subscription = supabase
      .channel('admin-orders-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          // Trigger silent refetch on any DB change
          fetchOrders(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isAuthenticated]);

  // Update order status
  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId);

      if (error) throw error;

      addToast(`Order status updated to ${newStatus.toUpperCase()}`, 'success');
      // Local state will update via realtime listener
    } catch (err) {
      console.error('Update status error:', err);
      addToast(`Error updating status: ${err.message}`, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Navigate back to customer website
  const handleGoToWebsite = () => {
    window.history.pushState({}, '', '/');
  };

  // Filter orders by tab
  const getFilteredOrders = () => {
    return orders.filter(order => {
      if (activeTab === 'active') {
        return ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status);
      }
      if (activeTab === 'completed') {
        return order.status === 'delivered';
      }
      if (activeTab === 'cancelled') {
        return order.status === 'cancelled';
      }
      return true;
    });
  };

  // Format order date
  const formatOrderTime = (dateString) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) + ' (' + d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ')';
    } catch (e) {
      return dateString;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'New Order';
      case 'confirmed': return 'Confirmed';
      case 'preparing': return 'Cooking';
      case 'ready': return 'Ready';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  // Render passcode gate if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <svg className="flame-icon text-fire" viewBox="0 0 32 32" width="40" height="40" style={{ marginBottom: '12px' }}>
              <path d="M16 2C16 2 8 12 8 20C8 24.4 11.6 28 16 28C20.4 28 24 24.4 24 20C24 12 16 2 16 2ZM16 25C13.2 25 11 22.8 11 20C11 16.8 14 12 16 9C18 12 21 16.8 21 20C21 22.8 18.8 25 16 25Z" fill="currentColor" />
            </svg>
            <h2>Matka <em>Haweli</em></h2>
            <p>Admin Control Panel</p>
          </div>
          
          <form onSubmit={handlePinSubmit} className="admin-login-form">
            <div className="form-group">
              <label htmlFor="adminPin">Enter Admin Passcode</label>
              <input
                type="password"
                id="adminPin"
                placeholder="••••"
                maxLength="4"
                pattern="\d*"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
              {pinError && <p className="admin-login-error">{pinError}</p>}
            </div>
            
            <button type="submit" className="btn-admin-submit">
              Authenticate
            </button>
          </form>

          <button className="btn-admin-back" onClick={handleGoToWebsite}>
            ← Back to Customer Website
          </button>
        </div>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <div className="admin-layout">
      {/* Sidebar / Top Nav */}
      <header className="admin-header">
        <div className="admin-brand">
          <svg className="flame-icon text-fire" viewBox="0 0 32 32" width="24" height="24">
            <path d="M16 2C16 2 8 12 8 20C8 24.4 11.6 28 16 28C20.4 28 24 24.4 24 20C24 12 16 2 16 2ZM16 25C13.2 25 11 22.8 11 20C11 16.8 14 12 16 9C18 12 21 16.8 21 20C21 22.8 18.8 25 16 25Z" fill="currentColor" />
          </svg>
          <span className="admin-brand-text">Matka <em>Haweli</em> Admin</span>
        </div>
        
        <div className="admin-actions-bar">
          <button className="admin-nav-btn text-gold" onClick={playNewOrderChime} title="Test Chime Sound">
            🔊 Test Chime
          </button>
          <button className="admin-nav-btn" onClick={handleGoToWebsite}>
            🌐 Live Website
          </button>
          <button className="admin-nav-btn logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      <main className="admin-container">
        {/* Stats Section */}
        <section className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="admin-stat-icon">🔔</span>
            <div className="admin-stat-info">
              <h3>Active Orders</h3>
              <p className="admin-stat-value">{stats.activeCount}</p>
            </div>
          </div>
          
          <div className="admin-stat-card">
            <span className="admin-stat-icon text-gold">💰</span>
            <div className="admin-stat-info">
              <h3>Today's Sales</h3>
              <p className="admin-stat-value text-gold">₹{stats.todaySales.toFixed(2)}</p>
            </div>
          </div>

          <div className="admin-stat-card">
            <span className="admin-stat-icon text-green">✅</span>
            <div className="admin-stat-info">
              <h3>Today's Completed</h3>
              <p className="admin-stat-value text-green">{stats.todayCompleted}</p>
            </div>
          </div>
        </section>

        {/* Filters and List */}
        <div className="admin-content-card">
          <div className="admin-card-header">
            {/* Tabs */}
            <div className="admin-tabs">
              <button 
                className={`admin-tab ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                Active Orders
                {stats.activeCount > 0 && <span className="tab-count-badge">{stats.activeCount}</span>}
              </button>
              <button 
                className={`admin-tab ${activeTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                Completed Orders
              </button>
              <button 
                className={`admin-tab ${activeTab === 'cancelled' ? 'active' : ''}`}
                onClick={() => setActiveTab('cancelled')}
              >
                Cancelled
              </button>
            </div>
            
            <button className="btn-refresh" onClick={() => fetchOrders(true)} disabled={loading}>
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>

          {/* Orders Listing */}
          {loading ? (
            <div className="admin-loading">
              <div className="spinner"></div>
              <p>Fetching latest kitchen tickets...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="admin-empty-state">
              <span className="empty-icon">🍲</span>
              <h3>No orders found</h3>
              <p>No orders currently match the selected filter.</p>
            </div>
          ) : (
            <div className="admin-orders-grid">
              {filteredOrders.map(order => (
                <div key={order.id} className={`admin-order-card border-${order.status}`}>
                  
                  {/* Card Header */}
                  <div className="admin-order-card-header">
                    <div className="order-details-meta">
                      <span className="order-time">{formatOrderTime(order.created_at)}</span>
                      <span className="order-id">ID: #{order.id.slice(0, 8)}</span>
                    </div>
                    <span className={`status-badge badge-${order.status}`}>
                      {getStatusLabel(order.status).toUpperCase()}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="admin-order-customer">
                    <h3>👤 {order.user_name}</h3>
                    <p>📞 <a href={`tel:${order.user_phone}`} className="phone-link">{order.user_phone}</a></p>
                    <p className="order-serving-type">
                      📍 {order.order_type === 'dine_in' ? (
                        <strong className="text-gold">Dine In (Table Selection)</strong>
                      ) : (
                        <strong className="text-fire">Takeaway / Parcel</strong>
                      )}
                    </p>
                  </div>

                  {/* Items List */}
                  <div className="admin-order-items">
                    <h4>ORDERED ITEMS</h4>
                    <div className="items-list-container">
                      {order.order_items && order.order_items.length > 0 ? (
                        order.order_items.map((item, idx) => (
                          <div className="admin-item-row" key={item.id || idx}>
                            <span className="item-qty-badge">{item.quantity}x</span>
                            <span className="item-name">{item.item_name}</span>
                            <span className="item-price">₹{Number(item.item_price.replace(/[^\d.]/g, '')) * item.quantity}</span>
                          </div>
                        ))
                      ) : (
                        // Fallback parsing from notes if order_items is empty
                        order.notes?.includes('[ITEMS]') ? (
                          order.notes.split('[DETAILS]')[0].replace('[ITEMS]\n', '').split('\n').filter(Boolean).map((line, idx) => (
                            <div className="admin-item-row fallback" key={idx}>
                              <span className="item-name">{line.trim()}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted">No items found.</p>
                        )
                      )}
                    </div>
                  </div>

                  {/* Customer Instructions */}
                  {order.notes?.includes('[USER NOTE]') && (
                    <div className="admin-order-instructions">
                      <strong>Instructions:</strong> "{order.notes.split('[USER NOTE]')[1].trim()}"
                    </div>
                  )}

                  {/* Total and Footer */}
                  <div className="admin-order-card-footer">
                    <span className="order-total-label">Total Amount:</span>
                    <span className="order-total-value">₹{order.total_amount}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="admin-order-actions">
                    {order.status === 'pending' && (
                      <>
                        <button 
                          className="btn-action btn-confirm"
                          onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                          disabled={updatingId === order.id}
                        >
                          Confirm Order
                        </button>
                        <button 
                          className="btn-action btn-cancel"
                          onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                          disabled={updatingId === order.id}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    
                    {order.status === 'confirmed' && (
                      <button 
                        className="btn-action btn-preparing"
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        disabled={updatingId === order.id}
                      >
                        Start Cooking
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button 
                        className="btn-action btn-ready"
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                        disabled={updatingId === order.id}
                      >
                        Mark Ready
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button 
                        className="btn-action btn-delivered"
                        onClick={() => handleUpdateStatus(order.id, 'delivered')}
                        disabled={updatingId === order.id}
                      >
                        Deliver Order
                      </button>
                    )}

                    {/* Override dropdown for full control */}
                    <div className="status-override-dropdown">
                      <select 
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleUpdateStatus(order.id, e.target.value);
                            e.target.value = ""; // reset
                          }
                        }}
                        disabled={updatingId === order.id}
                      >
                        <option value="" disabled>Change status manually...</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
