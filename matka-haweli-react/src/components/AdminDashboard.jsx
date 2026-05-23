import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import '../admin.css';

const ADMIN_PIN = '8888';

/* ── tiny helpers ─────────────────────────────────────── */
function fmtDateTime(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  } catch { return dateStr; }
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  try { return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return dateStr; }
}

const STATUS_LABELS = {
  pending: 'Pending', preparing: 'Preparing', ready: 'Ready',
  completed: 'Completed', delivered: 'Completed', cancelled: 'Cancelled'
};

function StatusBadge({ status }) {
  const s = status === 'delivered' ? 'completed' : status;
  return <span className={`adm-status-badge ${s}`}>{STATUS_LABELS[status] || status}</span>;
}

function getTableNumber(notes) {
  if (!notes) return '';
  const match = notes.match(/Dine-In \(Table\s+([^)]+)\)/i);
  return match ? match[1] : '';
}

/* ── Flame SVG ─────────────────────────────────────────── */
function FlameSvg({ size = 32 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ color: '#c9a84c' }}>
      <path d="M16 2C16 2 8 12 8 20C8 24.4 11.6 28 16 28C20.4 28 24 24.4 24 20C24 12 16 2 16 2ZM16 25C13.2 25 11 22.8 11 20C11 16.8 14 12 16 9C18 12 21 16.8 21 20C21 22.8 18.8 25 16 25Z" fill="currentColor"/>
    </svg>
  );
}

/* ── Modal ─────────────────────────────────────────────── */
function Modal({ title, onClose, children, footer }) {
  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-head">
          <span className="adm-modal-title">{title}</span>
          <button className="adm-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="adm-modal-body">{children}</div>
        {footer && <div className="adm-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { addToast } = useToast();

  /* ── auth ── */
  const [authed, setAuthed] = useState(localStorage.getItem('matka_admin_auth') === 'true');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  /* ── navigation ── */
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ── orders ── */
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersTab, setOrdersTab] = useState('active');
  const [updatingId, setUpdatingId] = useState(null);
  const knownIdsRef = useRef(new Set());

  /* ── stats ── */
  const [stats, setStats] = useState({ todayOrders: 0, pending: 0, completed: 0, reservations: 0 });

  /* ── menu ── */
  const [menuItems, setMenuItems] = useState([]);   // flat list of menu_items rows
  const [categories, setCategories] = useState([]); // list of category rows
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuModal, setMenuModal] = useState(null); // null | 'add' | item object
  const [menuCatFilter, setMenuCatFilter] = useState('all'); // filter by category_id
  const [menuSearch, setMenuSearch] = useState(''); // search query
  const [menuForm, setMenuForm] = useState({ name: '', category_id: '', price: '', description: '', image_url: '', is_available: true });
  const [menuSaving, setMenuSaving] = useState(false);

  /* ── reservations ── */
  const [reservations, setReservations] = useState([]);
  const [resLoading, setResLoading] = useState(false);
  const [resUpdating, setResUpdating] = useState(null);

  /* ── offers ── */
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offerModal, setOfferModal] = useState(null);
  const [offerForm, setOfferForm] = useState({ title: '', description: '', image_url: '', active: true });
  const [offerSaving, setOfferSaving] = useState(false);

  /* ── gallery ── */
  const [gallery, setGallery] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryForm, setGalleryForm] = useState({ image_url: '', caption: '' });
  const [gallerySaving, setGallerySaving] = useState(false);

  /* ── settings ── */
  const [settings, setSettings] = useState({
    restaurant_name: 'Matka Haweli',
    phone: '+91 70118 22978',
    whatsapp: '917011822978',
    opening_hours: 'Mon–Sun: 11:00 AM – 11:00 PM',
    address: 'Main Road, Virar West, Maharashtra 401303'
  });
  const [settingsSaving, setSettingsSaving] = useState(false);

  /* ════════════════════════════════════════════════════════
     AUDIO CHIME
     ════════════════════════════════════════════════════════ */
  const playChime = useCallback(() => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      [[587.33, 0], [880, 0.12]].forEach(([freq, delay]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.4);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.4);
      });
    } catch (e) { console.warn('Chime failed', e); }
  }, []);

  /* ════════════════════════════════════════════════════════
     ORDERS FETCH
     ════════════════════════════════════════════════════════ */
  const fetchOrders = useCallback(async (showLoader = false) => {
    if (showLoader) setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const list = data || [];

      if (knownIdsRef.current.size > 0) {
        let hasNew = false, newName = '';
        list.forEach(o => {
          if (!knownIdsRef.current.has(o.id)) {
            knownIdsRef.current.add(o.id);
            if (o.status === 'pending') { hasNew = true; newName = o.user_name || 'Guest'; }
          }
        });
        if (hasNew) {
          playChime();
          addToast(`🔔 New order from ${newName}!`, 'success', 8000);
        }
      } else {
        list.forEach(o => knownIdsRef.current.add(o.id));
      }

      setOrders(list);
      calcStats(list);
    } catch (err) {
      console.error(err);
      addToast('Failed to load orders', 'error');
    } finally {
      setOrdersLoading(false);
    }
  }, [playChime, addToast]);

  /* ════════════════════════════════════════════════════════
     STATS
     ════════════════════════════════════════════════════════ */
  const calcStats = (list) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let todayOrders = 0, pending = 0, completed = 0;
    list.forEach(o => {
      const isToday = new Date(o.created_at) >= today;
      if (isToday) todayOrders++;
      if (['pending', 'preparing', 'ready'].includes(o.status)) pending++;
      if (['completed', 'delivered'].includes(o.status) && isToday) completed++;
    });
    setStats(s => ({ ...s, todayOrders, pending, completed }));
  };

  /* ════════════════════════════════════════════════════════
     MENU FETCH
     ════════════════════════════════════════════════════════ */
  const fetchMenu = useCallback(async () => {
    setMenuLoading(true);
    try {
      // Fetch categories
      const { data: cats, error: catErr } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (catErr) throw catErr;
      setCategories(cats || []);

      // Fetch all menu items (available + unavailable for admin)
      const { data: items, error: itemErr } = await supabase
        .from('menu_items')
        .select('*, categories(title, icon, slug)')
        .order('sort_order', { ascending: true });
      if (itemErr) throw itemErr;
      setMenuItems(items || []);
    } catch (e) {
      addToast('Could not load menu items: ' + (e.message || ''), 'error');
    } finally { setMenuLoading(false); }
  }, [addToast]);

  /* ════════════════════════════════════════════════════════
     RESERVATIONS FETCH
     ════════════════════════════════════════════════════════ */
  const fetchReservations = useCallback(async () => {
    setResLoading(true);
    try {
      const { data, error } = await supabase.from('reservations').select('*').order('date', { ascending: false });
      if (error) throw error;
      setReservations(data || []);
      setStats(s => ({ ...s, reservations: (data || []).length }));
    } catch (e) {
      addToast('Could not load reservations', 'error');
    } finally { setResLoading(false); }
  }, [addToast]);

  /* ════════════════════════════════════════════════════════
     OFFERS FETCH
     ════════════════════════════════════════════════════════ */
  const fetchOffers = useCallback(async () => {
    setOffersLoading(true);
    try {
      const { data, error } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setOffers(data || []);
    } catch (e) {
      addToast('Could not load offers', 'error');
    } finally { setOffersLoading(false); }
  }, [addToast]);

  /* ════════════════════════════════════════════════════════
     GALLERY FETCH
     ════════════════════════════════════════════════════════ */
  const fetchGallery = useCallback(async () => {
    setGalleryLoading(true);
    try {
      const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setGallery(data || []);
    } catch (e) {
      addToast('Could not load gallery', 'error');
    } finally { setGalleryLoading(false); }
  }, [addToast]);

  /* ════════════════════════════════════════════════════════
     SETTINGS FETCH
     ════════════════════════════════════════════════════════ */
  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await supabase.from('settings').select('*');
      if (data && data.length > 0) {
        const map = {};
        data.forEach(row => { map[row.key] = row.value; });
        setSettings(s => ({ ...s, ...map }));
      }
    } catch (e) { /* silent — table may not exist */ }
  }, []);

  /* ════════════════════════════════════════════════════════
     AUTH EFFECT
     ════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!authed) return;

    fetchOrders(true);
    fetchReservations();

    // Auto refresh orders every 2 seconds to ensure admin receives them immediately
    const intervalId = setInterval(() => {
      fetchOrders(false);
    }, 2000);

    const sub = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => fetchReservations())
      .subscribe();

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(sub);
    };
  }, [authed, fetchOrders, fetchReservations]);

  /* Lazy-load sections */
  useEffect(() => {
    if (!authed) return;
    if (activePage === 'menu') fetchMenu();
    if (activePage === 'offers') fetchOffers();
    if (activePage === 'gallery') fetchGallery();
    if (activePage === 'settings') fetchSettings();
  }, [activePage, authed, fetchMenu, fetchOffers, fetchGallery, fetchSettings]);

  /* ════════════════════════════════════════════════════════
     ORDER STATUS UPDATE
     ════════════════════════════════════════════════════════ */
  const updateOrderStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      addToast(`Status → ${STATUS_LABELS[status] || status}`, 'success');
      setOrders(prev => {
        const updated = prev.map(o => o.id === id ? { ...o, status } : o);
        calcStats(updated);
        return updated;
      });
    } catch (e) {
      addToast('Failed to update status', 'error');
    } finally { setUpdatingId(null); }
  };

  /* ════════════════════════════════════════════════════════
     MENU CRUD
     ════════════════════════════════════════════════════════ */
  const openMenuAdd = () => {
    setMenuForm({ name: '', category_id: categories[0]?.id || '', price: '', description: '', image_url: '', is_available: true });
    setMenuModal('add');
  };
  const openMenuEdit = (item) => {
    setMenuForm({
      name: item.name,
      category_id: item.category_id || '',
      price: item.price || '',
      description: item.description || '',
      image_url: item.image_url || '',
      is_available: item.is_available !== false
    });
    setMenuModal(item);
  };
  const saveMenuItem = async () => {
    if (!menuForm.name.trim() || !menuForm.price) {
      addToast('Name and price are required', 'error'); return;
    }
    setMenuSaving(true);
    try {
      const payload = {
        name: menuForm.name.trim(),
        category_id: menuForm.category_id || null,
        price: menuForm.price.trim(),
        description: menuForm.description.trim() || null,
        image_url: menuForm.image_url.trim() || null,
        is_available: menuForm.is_available,
      };
      if (menuModal === 'add') {
        const { error } = await supabase.from('menu_items').insert(payload);
        if (error) throw error;
        addToast('Item added!', 'success');
      } else {
        const { error } = await supabase.from('menu_items').update(payload).eq('id', menuModal.id);
        if (error) throw error;
        addToast('Item updated!', 'success');
      }
      setMenuModal(null);
      fetchMenu();
    } catch (e) {
      addToast(e.message || 'Save failed', 'error');
    } finally { setMenuSaving(false); }
  };
  const deleteMenuItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) { addToast('Delete failed', 'error'); return; }
    addToast('Item deleted', 'success');
    fetchMenu();
  };
  const toggleAvailable = async (item) => {
    const { error } = await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id);
    if (error) { addToast('Update failed', 'error'); return; }
    setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, is_available: !item.is_available } : m));
  };

  /* ════════════════════════════════════════════════════════
     RESERVATION CRUD
     ════════════════════════════════════════════════════════ */
  const updateReservation = async (id, status) => {
    setResUpdating(id);
    const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
    if (error) { addToast('Update failed', 'error'); }
    else { addToast(`Reservation ${status}`, 'success'); fetchReservations(); }
    setResUpdating(null);
  };

  /* ════════════════════════════════════════════════════════
     OFFERS CRUD
     ════════════════════════════════════════════════════════ */
  const openOfferAdd = () => {
    setOfferForm({ title: '', description: '', image_url: '', active: true });
    setOfferModal('add');
  };
  const openOfferEdit = (item) => {
    setOfferForm({ title: item.title, description: item.description || '', image_url: item.image_url || '', active: item.active !== false });
    setOfferModal(item);
  };
  const saveOffer = async () => {
    if (!offerForm.title.trim()) { addToast('Title is required', 'error'); return; }
    setOfferSaving(true);
    try {
      if (offerModal === 'add') {
        const { error } = await supabase.from('offers').insert(offerForm);
        if (error) throw error;
        addToast('Offer added!', 'success');
      } else {
        const { error } = await supabase.from('offers').update(offerForm).eq('id', offerModal.id);
        if (error) throw error;
        addToast('Offer updated!', 'success');
      }
      setOfferModal(null);
      fetchOffers();
    } catch (e) { addToast(e.message || 'Save failed', 'error'); }
    finally { setOfferSaving(false); }
  };
  const deleteOffer = async (id) => {
    if (!window.confirm('Delete this offer?')) return;
    await supabase.from('offers').delete().eq('id', id);
    addToast('Offer deleted', 'success');
    fetchOffers();
  };
  const toggleOffer = async (item) => {
    await supabase.from('offers').update({ active: !item.active }).eq('id', item.id);
    fetchOffers();
  };

  /* ════════════════════════════════════════════════════════
     GALLERY CRUD
     ════════════════════════════════════════════════════════ */
  const addGalleryImage = async () => {
    if (!galleryForm.image_url.trim()) { addToast('Image URL is required', 'error'); return; }
    setGallerySaving(true);
    const { error } = await supabase.from('gallery').insert(galleryForm);
    if (error) { addToast('Upload failed', 'error'); }
    else { addToast('Image added!', 'success'); setGalleryForm({ image_url: '', caption: '' }); fetchGallery(); }
    setGallerySaving(false);
  };
  const deleteGalleryImage = async (id) => {
    if (!window.confirm('Remove this image?')) return;
    await supabase.from('gallery').delete().eq('id', id);
    addToast('Image removed', 'success');
    fetchGallery();
  };

  /* ════════════════════════════════════════════════════════
     SETTINGS SAVE
     ════════════════════════════════════════════════════════ */
  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      const rows = Object.entries(settings).map(([key, value]) => ({ key, value }));
      for (const row of rows) {
        await supabase.from('settings').upsert(row, { onConflict: 'key' });
      }
      addToast('Settings saved!', 'success');
    } catch (e) { addToast('Save failed', 'error'); }
    finally { setSettingsSaving(false); }
  };

  /* ════════════════════════════════════════════════════════
     NAVIGATE + CLOSE SIDEBAR
     ════════════════════════════════════════════════════════ */
  const navigate = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  /* ════════════════════════════════════════════════════════
     FILTERED ORDERS
     ════════════════════════════════════════════════════════ */
  const filteredOrders = orders.filter(o => {
    if (ordersTab === 'active') return ['pending', 'preparing', 'ready'].includes(o.status);
    if (ordersTab === 'completed') return ['completed', 'delivered'].includes(o.status);
    if (ordersTab === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  /* ════════════════════════════════════════════════════════
     PAGE TITLE MAP
     ════════════════════════════════════════════════════════ */
  const PAGE_TITLES = {
    dashboard: 'Dashboard', orders: 'Manage Orders', menu: 'Menu Management',
    reservations: 'Reservations', offers: 'Offer Management',
    gallery: 'Gallery', notifications: 'Notifications', settings: 'Settings'
  };

  /* ════════════════════════════════════════════════════════
     LOGIN SCREEN
     ════════════════════════════════════════════════════════ */
  if (!authed) {
    const handlePin = (e) => {
      e.preventDefault();
      if (pinInput === ADMIN_PIN) {
        localStorage.setItem('matka_admin_auth', 'true');
        setAuthed(true);
        addToast('Welcome back, Admin! 🔥', 'success');
      } else {
        setPinError('Incorrect passcode. Try again.');
        setPinInput('');
      }
    };
    return (
      <div className="adm-login-page">
        <div className="adm-login-card">
          <div className="adm-login-logo">
            <div className="adm-login-flame"><FlameSvg size={28} /></div>
            <div className="adm-login-title">MATKA HAWELI</div>
            <div className="adm-login-subtitle">Admin Control Panel</div>
          </div>
          <form className="adm-login-form" onSubmit={handlePin}>
            <div className="adm-form-group">
              <label className="adm-label" htmlFor="adminPin">Admin Passcode</label>
              <input
                id="adminPin"
                className="adm-input"
                type="password"
                placeholder="••••"
                maxLength="4"
                autoFocus
                value={pinInput}
                onChange={e => { setPinInput(e.target.value.replace(/\D/g, '')); setPinError(''); }}
              />
              {pinError && <p className="adm-login-error">⚠ {pinError}</p>}
            </div>
            {/* PIN dots indicator */}
            <div className="adm-pin-dots">
              {[0,1,2,3].map(i => <div key={i} className={`adm-pin-dot ${pinInput.length > i ? 'filled' : ''}`} />)}
            </div>
            <button className="adm-btn primary" type="submit" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              🔓 Authenticate
            </button>
          </form>
          <button className="adm-login-back" onClick={() => window.history.pushState({}, '', '/')}>
            ← Back to Customer Website
          </button>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     MAIN ADMIN UI
     ════════════════════════════════════════════════════════ */
  return (
    <div className="admin-root">

      {/* ── SIDEBAR OVERLAY (mobile) ── */}
      <div className={`adm-sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ── SIDEBAR ── */}
      <aside className={`adm-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="adm-sidebar-brand">
          <div className="adm-brand-icon"><FlameSvg size={36} /></div>
          <div className="adm-brand-text">
            <span className="adm-brand-name">MATKA HAWELI</span>
            <span className="adm-brand-sub">Admin Panel</span>
          </div>
        </div>

        <nav className="adm-nav">
          {[
            { id: 'dashboard',     icon: '🏠', label: 'Dashboard' },
            { id: 'orders',        icon: '🧾', label: 'Orders', badge: pendingCount },
            { id: 'menu',          icon: '🍽️', label: 'Menu Management' },
            { id: 'reservations',  icon: '📅', label: 'Reservations', badge: reservations.filter(r => r.status === 'pending').length },
            { id: 'offers',        icon: '🏷️', label: 'Offers' },
            { id: 'gallery',       icon: '🖼️', label: 'Gallery' },
            { id: 'notifications', icon: '🔔', label: 'Notifications' },
            { id: 'settings',      icon: '⚙️', label: 'Settings' },
          ].map(item => (
            <button
              key={item.id}
              className={`adm-nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <span className="adm-nav-icon">{item.icon}</span>
              <span className="adm-nav-label">{item.label}</span>
              {item.badge > 0 && <span className="adm-nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-divider" style={{ margin: '0 0 6px' }} />
          <button className="adm-sidebar-footer-btn" onClick={playChime}>🔊 Test Chime</button>
          <button className="adm-sidebar-footer-btn" onClick={() => window.history.pushState({}, '', '/')}>🌐 Live Website</button>
          <button className="adm-sidebar-footer-btn danger" onClick={() => { localStorage.removeItem('matka_admin_auth'); setAuthed(false); }}>🚪 Sign Out</button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="adm-main">

        {/* Top Bar */}
        <header className="adm-topbar">
          <div className="adm-topbar-left">
            <button className="adm-mobile-menu-btn" onClick={() => setSidebarOpen(o => !o)}>☰</button>
            <span className="adm-page-title">{PAGE_TITLES[activePage]}</span>
          </div>
          <div className="adm-topbar-right">
            {pendingCount > 0 && (
              <button className="adm-topbar-btn gold" onClick={() => navigate('orders')}>
                🔔 {pendingCount} Pending
              </button>
            )}
            <button className="adm-topbar-btn" onClick={() => window.history.pushState({}, '', '/')}>🌐 Website</button>
          </div>
        </header>

        {/* Page Content */}
        <div className="adm-content">

          {/* ══════════ DASHBOARD ══════════ */}
          {activePage === 'dashboard' && (
            <>
              <div className="adm-section-header">
                <h2 className="adm-section-title">Overview <span>Today</span></h2>
              </div>

              <div className="adm-stats-grid">
                <div className="adm-stat-card accent-gold">
                  <div className="adm-stat-icon-wrap gold">📊</div>
                  <div className="adm-stat-info">
                    <div className="adm-stat-label">Orders Today</div>
                    <div className="adm-stat-value gold">{stats.todayOrders}</div>
                  </div>
                </div>
                <div className="adm-stat-card accent-fire">
                  <div className="adm-stat-icon-wrap fire">⏳</div>
                  <div className="adm-stat-info">
                    <div className="adm-stat-label">Pending Orders</div>
                    <div className="adm-stat-value fire">{stats.pending}</div>
                  </div>
                </div>
                <div className="adm-stat-card accent-green">
                  <div className="adm-stat-icon-wrap green">✅</div>
                  <div className="adm-stat-info">
                    <div className="adm-stat-label">Completed Today</div>
                    <div className="adm-stat-value green">{stats.completed}</div>
                  </div>
                </div>
                <div className="adm-stat-card accent-blue">
                  <div className="adm-stat-icon-wrap blue">📅</div>
                  <div className="adm-stat-info">
                    <div className="adm-stat-label">Reservations</div>
                    <div className="adm-stat-value blue">{stats.reservations}</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="adm-card" style={{ marginBottom: '20px' }}>
                <div className="adm-card-head">
                  <span className="adm-card-head-title">Quick Actions</span>
                </div>
                <div className="adm-card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {[
                    { label: '🧾 View Orders', page: 'orders' },
                    { label: '📅 Reservations', page: 'reservations' },
                    { label: '🍽️ Manage Menu', page: 'menu' },
                    { label: '🏷️ Edit Offers', page: 'offers' },
                    { label: '🖼️ Gallery', page: 'gallery' },
                    { label: '⚙️ Settings', page: 'settings' },
                  ].map(q => (
                    <button key={q.page} className="adm-btn ghost" onClick={() => navigate(q.page)}>{q.label}</button>
                  ))}
                </div>
              </div>

              {/* Recent Orders Preview */}
              <div className="adm-card">
                <div className="adm-card-head">
                  <span className="adm-card-head-title">Recent Orders</span>
                  <button className="adm-btn sm ghost" onClick={() => navigate('orders')}>View All →</button>
                </div>
                {ordersLoading ? (
                  <div className="adm-spinner-wrap"><div className="adm-spinner" /><p className="adm-spinner-text">Loading...</p></div>
                ) : orders.length === 0 ? (
                  <div className="adm-empty"><span className="adm-empty-icon">🍲</span><p className="adm-empty-title">No orders yet</p></div>
                ) : (
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 8).map(o => (
                          <tr key={o.id}>
                            <td><strong>{o.user_name}</strong><br/><span className="adm-text-muted" style={{fontSize:'11px'}}>{o.user_phone}</span></td>
                            <td>{o.order_items?.length || 0} item(s)</td>
                            <td className="adm-text-gold"><strong>₹{o.total_amount}</strong></td>
                            <td><StatusBadge status={o.status} /></td>
                            <td style={{fontSize:'12px', color:'var(--adm-text-muted)'}}>{fmtDateTime(o.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══════════ ORDERS ══════════ */}
          {activePage === 'orders' && (
            <>
              <div className="adm-section-header">
                <h2 className="adm-section-title">Manage <span>Orders</span></h2>
                <button className="adm-btn ghost sm" onClick={() => fetchOrders(true)}>🔄 Refresh</button>
              </div>

              <div className="adm-card" style={{ marginBottom: '0' }}>
                <div className="adm-card-head">
                  <div className="adm-tabs">
                    {[
                      { id: 'active', label: 'Active', badge: orders.filter(o => ['pending','preparing','ready'].includes(o.status)).length },
                      { id: 'completed', label: 'Completed' },
                      { id: 'cancelled', label: 'Cancelled' },
                    ].map(t => (
                      <button key={t.id} className={`adm-tab ${ordersTab === t.id ? 'active' : ''}`} onClick={() => setOrdersTab(t.id)}>
                        {t.label}
                        {t.badge > 0 && <span className="adm-tab-badge">{t.badge}</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {ordersLoading ? (
                  <div className="adm-spinner-wrap"><div className="adm-spinner" /><p className="adm-spinner-text">Loading orders...</p></div>
                ) : filteredOrders.length === 0 ? (
                  <div className="adm-empty">
                    <span className="adm-empty-icon">🍲</span>
                    <p className="adm-empty-title">No orders here</p>
                    <p className="adm-empty-desc">No {ordersTab} orders at the moment.</p>
                  </div>
                ) : (
                  <div className="adm-orders-grid">
                    {filteredOrders.map(order => (
                      <div key={order.id} className={`adm-order-card status-${order.status === 'delivered' ? 'completed' : order.status}`}>

                        {/* Top */}
                        <div className="adm-order-card-top">
                          <div className="adm-order-meta">
                            <span className="adm-order-time">{fmtDateTime(order.created_at)}</span>
                            <span className="adm-order-id">#{order.id.slice(0,8)}</span>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>

                        {/* Customer */}
                        <div className="adm-order-customer">
                          <div className="adm-order-name">👤 {order.user_name}</div>
                          <div className="adm-order-phone">📞 {order.user_phone}</div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                            <span className={`adm-order-type-tag ${order.order_type || 'pickup'}`}>
                              {order.order_type === 'dine-in' ? '🍽️ Dine-In' : '🛍️ Takeaway'}
                            </span>
                            {order.order_type === 'dine-in' && (
                              <span className="adm-order-type-tag table-tag">
                                🪑 Table {getTableNumber(order.notes) || 'N/A'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Items */}
                        <div className="adm-order-items">
                          <div className="adm-order-items-label">Ordered Items</div>
                          {order.order_items && order.order_items.length > 0 ? (
                            order.order_items.map((item, idx) => (
                              <div className="adm-item-row" key={item.id || idx}>
                                <span className="adm-item-qty">{item.quantity}×</span>
                                <span className="adm-item-name">{item.item_name}</span>
                                <span className="adm-item-price">
                                  ₹{(Number(String(item.item_price).replace(/[^\d.]/g,'')) * item.quantity).toFixed(0)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p style={{ fontSize: '12px', color: 'var(--adm-text-muted)' }}>No items data</p>
                          )}
                        </div>

                        {/* Note */}
                        {order.notes?.includes('[USER NOTE]') && (
                          <div className="adm-order-note">
                            📝 "{order.notes.split('[USER NOTE]')[1]?.trim()}"
                          </div>
                        )}

                        {/* Footer: Total + Contact */}
                        <div className="adm-order-footer">
                          <div>
                            <div className="adm-order-total-label">Total</div>
                            <div className="adm-order-total">₹{order.total_amount}</div>
                          </div>
                          <div className="adm-order-contact-btns">
                            <a
                              className="adm-contact-btn whatsapp"
                              href={`https://wa.me/${String(order.user_phone).replace(/\D/g,'')}?text=${encodeURIComponent(`Hi ${order.user_name}, your order at Matka Haweli is being processed!`)}`}
                              target="_blank" rel="noreferrer"
                            >💬 WA</a>
                            <a className="adm-contact-btn call" href={`tel:${order.user_phone}`}>📞 Call</a>
                          </div>
                        </div>

                        {/* Status Action Buttons */}
                        <div className="adm-order-actions">
                          {order.status === 'pending' && (
                            <>
                              <button className="adm-action-btn preparing" disabled={updatingId === order.id} onClick={() => updateOrderStatus(order.id, 'preparing')}>🍳 Preparing</button>
                              <button className="adm-action-btn cancel" disabled={updatingId === order.id} onClick={() => updateOrderStatus(order.id, 'cancelled')}>✕ Cancel</button>
                            </>
                          )}
                          {order.status === 'preparing' && (
                            <button className="adm-action-btn ready" disabled={updatingId === order.id} onClick={() => updateOrderStatus(order.id, 'ready')}>✅ Mark Ready</button>
                          )}
                          {order.status === 'ready' && (
                            <button className="adm-action-btn completed" disabled={updatingId === order.id} onClick={() => updateOrderStatus(order.id, 'completed')}>🎉 Complete</button>
                          )}
                          {/* Override dropdown */}
                          <select
                            style={{ flex: 1, minWidth: '120px', padding: '8px', background: 'var(--adm-surface3)', border: '1px solid var(--adm-border-light)', borderRadius: '6px', color: 'var(--adm-text-muted)', fontSize: '12px' }}
                            defaultValue=""
                            onChange={e => { if (e.target.value) { updateOrderStatus(order.id, e.target.value); e.target.value = ''; } }}
                            disabled={updatingId === order.id}
                          >
                            <option value="" disabled>Override status…</option>
                            <option value="pending">Pending</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready">Ready</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══════════ MENU ══════════ */}
          {activePage === 'menu' && (
            <>
              <div className="adm-section-header">
                <h2 className="adm-section-title">Menu <span>Management</span></h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="adm-btn ghost sm" onClick={fetchMenu}>🔄 Refresh</button>
                  <button className="adm-btn primary" onClick={openMenuAdd}>+ Add Item</button>
                </div>
              </div>

              {/* Stats bar */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div
                  onClick={() => { setMenuCatFilter('all'); setMenuSearch(''); }}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--adm-surface)',
                    border: menuCatFilter === 'all' ? '1px solid var(--adm-gold)' : '1px solid var(--adm-border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    userSelect: 'none'
                  }}
                  title="Click to show all items"
                >
                  <span className="adm-text-muted">Total Items: </span><strong>{menuItems.length}</strong>
                </div>
                <div
                  onClick={() => { setMenuCatFilter('available'); setMenuSearch(''); }}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--adm-surface)',
                    border: menuCatFilter === 'available' ? '1px solid var(--adm-green)' : '1px solid var(--adm-border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    userSelect: 'none'
                  }}
                  title="Click to filter by Available"
                >
                  <span className="adm-text-muted">Available: </span><strong className="adm-text-green">{menuItems.filter(m => m.is_available !== false).length}</strong>
                </div>
                <div
                  onClick={() => { setMenuCatFilter('unavailable'); setMenuSearch(''); }}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--adm-surface)',
                    border: menuCatFilter === 'unavailable' ? '1px solid var(--adm-red)' : '1px solid var(--adm-border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    userSelect: 'none'
                  }}
                  title="Click to filter by Unavailable"
                >
                  <span className="adm-text-muted">Unavailable: </span><strong className="adm-text-red">{menuItems.filter(m => m.is_available === false).length}</strong>
                </div>
                <div style={{ padding: '8px 16px', background: 'var(--adm-surface)', border: '1px solid var(--adm-border)', borderRadius: '8px', fontSize: '13px', userSelect: 'none' }}>
                  <span className="adm-text-muted">Categories: </span><strong className="adm-text-gold">{categories.length}</strong>
                </div>
              </div>

              {/* Search & Quick Filters Bar */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="🔍 Search items by name..."
                  className="adm-input"
                  style={{ maxWidth: '300px', margin: 0 }}
                  value={menuSearch}
                  onChange={e => setMenuSearch(e.target.value)}
                />
                
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    className={`adm-btn sm ${menuCatFilter === 'all' ? 'primary' : 'ghost'}`}
                    onClick={() => setMenuCatFilter('all')}
                  >All ({menuItems.length})</button>
                  <button
                    className={`adm-btn sm ${menuCatFilter === 'available' ? 'primary' : 'ghost'}`}
                    onClick={() => setMenuCatFilter('available')}
                    style={{ color: 'var(--adm-green)', borderColor: menuCatFilter === 'available' ? 'var(--adm-green)' : 'var(--adm-border)' }}
                  >🟢 Available ({menuItems.filter(m => m.is_available !== false).length})</button>
                  <button
                    className={`adm-btn sm ${menuCatFilter === 'unavailable' ? 'primary' : 'ghost'}`}
                    onClick={() => setMenuCatFilter('unavailable')}
                    style={{ color: 'var(--adm-red)', borderColor: menuCatFilter === 'unavailable' ? 'var(--adm-red)' : 'var(--adm-border)' }}
                  >🚫 Unavailable ({menuItems.filter(m => m.is_available === false).length})</button>
                </div>
              </div>

              {/* Category filter */}
              {categories.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px', borderTop: '1px solid var(--adm-border)', paddingTop: '12px' }}>
                  {categories.map(cat => {
                    const count = menuItems.filter(m => m.category_id === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        className={`adm-btn sm ${menuCatFilter === cat.id ? 'primary' : 'ghost'}`}
                        onClick={() => setMenuCatFilter(cat.id)}
                      >{cat.icon} {cat.title} ({count})</button>
                    );
                  })}
                </div>
              )}

              <div className="adm-card">
                {menuLoading ? (
                  <div className="adm-spinner-wrap"><div className="adm-spinner" /><p className="adm-spinner-text">Loading from Supabase…</p></div>
                ) : menuItems.length === 0 ? (
                  <div className="adm-empty">
                    <span className="adm-empty-icon">🍽️</span>
                    <p className="adm-empty-title">No menu items found</p>
                    <p className="adm-empty-desc">Add items to the <code>menu_items</code> table in Supabase or click below.</p>
                    <button className="adm-btn primary" style={{ marginTop: '12px' }} onClick={openMenuAdd}>+ Add First Item</button>
                  </div>
                ) : (
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Available</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {menuItems
                          .filter(item => {
                            // Category filter
                            if (menuCatFilter === 'unavailable') {
                              if (item.is_available !== false) return false;
                            } else if (menuCatFilter === 'available') {
                              if (item.is_available === false) return false;
                            } else if (menuCatFilter !== 'all') {
                              if (item.category_id !== menuCatFilter) return false;
                            }

                            // Search filter
                            if (menuSearch && !item.name.toLowerCase().includes(menuSearch.toLowerCase())) {
                              return false;
                            }

                            return true;
                          })
                          .map(item => {
                            const cat = item.categories || categories.find(c => c.id === item.category_id);
                            return (
                              <tr key={item.id} style={{ opacity: item.is_available === false ? 0.55 : 1 }}>
                                <td>
                                  {item.image_url
                                    ? <img src={item.image_url} alt={item.name} className="adm-table-img" onError={e => { e.target.style.display = 'none'; }} />
                                    : <div className="adm-table-img-placeholder">{cat?.icon || '🍽️'}</div>
                                  }
                                </td>
                                <td>
                                  <strong style={{ color: 'var(--adm-text)' }}>{item.name}</strong>
                                  {item.description && (
                                    <div style={{ fontSize: '11px', color: 'var(--adm-text-muted)', marginTop: '2px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {item.description}
                                    </div>
                                  )}
                                </td>
                                <td>
                                  {cat ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--adm-text-muted)' }}>
                                      {cat.icon} {cat.title}
                                    </span>
                                  ) : <span className="adm-text-dim">—</span>}
                                </td>
                                <td className="adm-text-gold"><strong>{item.price}</strong></td>
                                <td>
                                  <label className="adm-toggle">
                                    <input
                                      type="checkbox"
                                      checked={item.is_available !== false}
                                      onChange={() => toggleAvailable(item)}
                                    />
                                    <div className="adm-toggle-track"><div className="adm-toggle-thumb" /></div>
                                    <span className="adm-toggle-label" style={{ color: item.is_available !== false ? 'var(--adm-green)' : 'var(--adm-red)' }}>
                                      {item.is_available !== false ? 'On' : 'Off'}
                                    </span>
                                  </label>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button className="adm-btn sm ghost" onClick={() => openMenuEdit(item)}>✏️ Edit</button>
                                    <button className="adm-btn sm danger" onClick={() => deleteMenuItem(item.id)}>🗑️</button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Menu Modal */}
              {menuModal !== null && (
                <Modal
                  title={menuModal === 'add' ? 'Add Menu Item' : `Edit — ${menuModal.name}`}
                  onClose={() => setMenuModal(null)}
                  footer={
                    <>
                      <button className="adm-btn ghost" onClick={() => setMenuModal(null)}>Cancel</button>
                      <button className="adm-btn primary" onClick={saveMenuItem} disabled={menuSaving}>
                        {menuSaving ? 'Saving…' : menuModal === 'add' ? 'Add Item' : 'Save Changes'}
                      </button>
                    </>
                  }
                >
                  <div className="adm-form-row">
                    <div className="adm-form-group">
                      <label className="adm-label">Item Name *</label>
                      <input className="adm-input" placeholder="e.g. Chicken Biryani" value={menuForm.name} onChange={e => setMenuForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="adm-form-group">
                      <label className="adm-label">Category</label>
                      <select className="adm-select" value={menuForm.category_id} onChange={e => setMenuForm(f => ({ ...f, category_id: e.target.value }))}>
                        <option value="">— No Category —</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.icon} {cat.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="adm-form-row">
                    <div className="adm-form-group">
                      <label className="adm-label">Price *</label>
                      <input className="adm-input" placeholder="e.g. ₹299" value={menuForm.price} onChange={e => setMenuForm(f => ({ ...f, price: e.target.value }))} />
                    </div>
                    <div className="adm-form-group">
                      <label className="adm-label">Image URL</label>
                      <input className="adm-input" placeholder="https://..." value={menuForm.image_url} onChange={e => setMenuForm(f => ({ ...f, image_url: e.target.value }))} />
                    </div>
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Description</label>
                    <textarea className="adm-textarea" placeholder="Short description…" value={menuForm.description} onChange={e => setMenuForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <label className="adm-toggle" style={{ marginTop: '4px' }}>
                    <input type="checkbox" checked={menuForm.is_available} onChange={e => setMenuForm(f => ({ ...f, is_available: e.target.checked }))} />
                    <div className="adm-toggle-track"><div className="adm-toggle-thumb" /></div>
                    <span className="adm-toggle-label">{menuForm.is_available ? '✅ Available on Menu' : '❌ Hidden from Menu'}</span>
                  </label>
                </Modal>
              )}
            </>
          )}


          {/* ══════════ RESERVATIONS ══════════ */}
          {activePage === 'reservations' && (
            <>
              <div className="adm-section-header">
                <h2 className="adm-section-title">Reservation <span>Management</span></h2>
                <button className="adm-btn ghost sm" onClick={fetchReservations}>🔄 Refresh</button>
              </div>

              <div className="adm-card">
                {resLoading ? (
                  <div className="adm-spinner-wrap"><div className="adm-spinner" /></div>
                ) : reservations.length === 0 ? (
                  <div className="adm-empty">
                    <span className="adm-empty-icon">📅</span>
                    <p className="adm-empty-title">No reservations</p>
                    <p className="adm-empty-desc">Reservations made on the website will appear here.</p>
                  </div>
                ) : (
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead>
                        <tr><th>Name</th><th>Phone</th><th>Date</th><th>Time</th><th>Guests</th><th>Notes</th><th>Status</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {reservations.map(r => (
                          <tr key={r.id}>
                            <td><strong>{r.name}</strong></td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <a href={`tel:${r.phone}`} style={{ color: 'var(--adm-blue)', fontSize: '12px' }}>📞 {r.phone}</a>
                              </div>
                            </td>
                            <td>{fmtDate(r.date)}</td>
                            <td>{r.time || '—'}</td>
                            <td>{r.guests || '—'}</td>
                            <td style={{ maxWidth: '160px', fontSize: '12px', color: 'var(--adm-text-muted)' }}>{r.notes || '—'}</td>
                            <td>
                              <span className={`adm-res-badge ${r.status || 'pending'}`}>
                                {r.status || 'Pending'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {r.status !== 'accepted' && (
                                  <button className="adm-btn sm success" disabled={resUpdating === r.id} onClick={() => updateReservation(r.id, 'accepted')}>✓ Accept</button>
                                )}
                                {r.status !== 'rejected' && (
                                  <button className="adm-btn sm danger" disabled={resUpdating === r.id} onClick={() => updateReservation(r.id, 'rejected')}>✕ Reject</button>
                                )}
                                <a
                                  className="adm-contact-btn whatsapp"
                                  href={`https://wa.me/${String(r.phone).replace(/\D/g,'')}?text=${encodeURIComponent(`Hi ${r.name}, your table reservation at Matka Haweli on ${r.date} at ${r.time} has been ${r.status === 'accepted' ? 'confirmed ✅' : 'updated'}!`)}`}
                                  target="_blank" rel="noreferrer"
                                  style={{ fontSize: '11px', padding: '5px 8px' }}
                                >💬</a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══════════ OFFERS ══════════ */}
          {activePage === 'offers' && (
            <>
              <div className="adm-section-header">
                <h2 className="adm-section-title">Offer <span>Management</span></h2>
                <button className="adm-btn primary" onClick={openOfferAdd}>+ Add Offer</button>
              </div>

              {offersLoading ? (
                <div className="adm-spinner-wrap"><div className="adm-spinner" /></div>
              ) : offers.length === 0 ? (
                <div className="adm-empty">
                  <span className="adm-empty-icon">🏷️</span>
                  <p className="adm-empty-title">No offers yet</p>
                  <p className="adm-empty-desc">Create special offers and banners for your customers.</p>
                  <button className="adm-btn primary" style={{ marginTop: '12px' }} onClick={openOfferAdd}>+ Create First Offer</button>
                </div>
              ) : (
                <div className="adm-offers-grid">
                  {offers.map(offer => (
                    <div key={offer.id} className={`adm-offer-card ${offer.active ? 'active-offer' : ''}`}>
                      {offer.image_url
                        ? <img src={offer.image_url} alt={offer.title} className="adm-offer-img" />
                        : <div className="adm-offer-img-placeholder">🏷️</div>
                      }
                      <div className="adm-offer-body">
                        <div className="adm-offer-title">{offer.title}</div>
                        {offer.description && <div className="adm-offer-desc">{offer.description}</div>}
                        <div className="adm-offer-actions">
                          <label className="adm-toggle">
                            <input type="checkbox" checked={offer.active !== false} onChange={() => toggleOffer(offer)} />
                            <div className="adm-toggle-track"><div className="adm-toggle-thumb" /></div>
                            <span className="adm-toggle-label">{offer.active ? '🟢 Active' : '⚫ Off'}</span>
                          </label>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="adm-btn sm ghost" onClick={() => openOfferEdit(offer)}>✏️</button>
                            <button className="adm-btn sm danger" onClick={() => deleteOffer(offer.id)}>🗑️</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Offer Modal */}
              {offerModal !== null && (
                <Modal
                  title={offerModal === 'add' ? 'Add New Offer' : 'Edit Offer'}
                  onClose={() => setOfferModal(null)}
                  footer={
                    <>
                      <button className="adm-btn ghost" onClick={() => setOfferModal(null)}>Cancel</button>
                      <button className="adm-btn primary" onClick={saveOffer} disabled={offerSaving}>
                        {offerSaving ? 'Saving…' : 'Save Offer'}
                      </button>
                    </>
                  }
                >
                  <div className="adm-form-group">
                    <label className="adm-label">Offer Title *</label>
                    <input className="adm-input" placeholder="e.g. Weekend Special - 20% Off!" value={offerForm.title} onChange={e => setOfferForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Description</label>
                    <textarea className="adm-textarea" placeholder="Describe the offer…" value={offerForm.description} onChange={e => setOfferForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Banner Image URL</label>
                    <input className="adm-input" placeholder="https://..." value={offerForm.image_url} onChange={e => setOfferForm(f => ({ ...f, image_url: e.target.value }))} />
                  </div>
                  <label className="adm-toggle">
                    <input type="checkbox" checked={offerForm.active} onChange={e => setOfferForm(f => ({ ...f, active: e.target.checked }))} />
                    <div className="adm-toggle-track"><div className="adm-toggle-thumb" /></div>
                    <span className="adm-toggle-label">{offerForm.active ? 'Active (visible on website)' : 'Disabled'}</span>
                  </label>
                </Modal>
              )}
            </>
          )}

          {/* ══════════ GALLERY ══════════ */}
          {activePage === 'gallery' && (
            <>
              <div className="adm-section-header">
                <h2 className="adm-section-title">Gallery <span>Management</span></h2>
              </div>

              {/* Add Image Form */}
              <div className="adm-card" style={{ marginBottom: '20px' }}>
                <div className="adm-card-head"><span className="adm-card-head-title">Add New Image</span></div>
                <div className="adm-card-body">
                  <div className="adm-form-row">
                    <div className="adm-form-group">
                      <label className="adm-label">Image URL *</label>
                      <input className="adm-input" placeholder="https://..." value={galleryForm.image_url} onChange={e => setGalleryForm(f => ({ ...f, image_url: e.target.value }))} />
                    </div>
                    <div className="adm-form-group">
                      <label className="adm-label">Caption</label>
                      <input className="adm-input" placeholder="e.g. Our famous Matka Biryani" value={galleryForm.caption} onChange={e => setGalleryForm(f => ({ ...f, caption: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="adm-btn primary" onClick={addGalleryImage} disabled={gallerySaving}>
                      {gallerySaving ? 'Adding…' : '+ Add Image'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Gallery Grid */}
              {galleryLoading ? (
                <div className="adm-spinner-wrap"><div className="adm-spinner" /></div>
              ) : gallery.length === 0 ? (
                <div className="adm-empty">
                  <span className="adm-empty-icon">🖼️</span>
                  <p className="adm-empty-title">No images yet</p>
                  <p className="adm-empty-desc">Add restaurant images using the form above.</p>
                </div>
              ) : (
                <div className="adm-gallery-grid">
                  {gallery.map(img => (
                    <div key={img.id} className="adm-gallery-item">
                      <img src={img.image_url} alt={img.caption || ''} className="adm-gallery-img" />
                      {img.caption && <div className="adm-gallery-caption">{img.caption}</div>}
                      <div className="adm-gallery-overlay">
                        <button className="adm-btn danger sm" onClick={() => deleteGalleryImage(img.id)}>🗑️ Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ══════════ NOTIFICATIONS ══════════ */}
          {activePage === 'notifications' && (
            <>
              <div className="adm-section-header">
                <h2 className="adm-section-title">Notification <span>Centre</span></h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                <div className="adm-card">
                  <div className="adm-card-head"><span className="adm-card-head-title">🔊 Order Chime</span></div>
                  <div className="adm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--adm-text-muted)', lineHeight: '1.6' }}>
                      A chime sound plays automatically when a new order arrives. Use the button below to test it.
                    </p>
                    <button className="adm-btn primary" onClick={playChime}>🔊 Play Test Chime</button>
                  </div>
                </div>

                <div className="adm-card">
                  <div className="adm-card-head"><span className="adm-card-head-title">🔔 Live Orders Status</span></div>
                  <div className="adm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--adm-text-muted)', lineHeight: '1.6' }}>
                      Supabase Realtime is active — orders update live without refreshing.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', background: 'var(--adm-green)', borderRadius: '50%', animation: 'pulse-badge 2s infinite' }} />
                      <span style={{ fontSize: '13px', color: 'var(--adm-green)' }}>Realtime Connected</span>
                    </div>
                    <button className="adm-btn ghost sm" onClick={() => fetchOrders(true)}>🔄 Manual Refresh</button>
                  </div>
                </div>

                <div className="adm-card">
                  <div className="adm-card-head"><span className="adm-card-head-title">📊 Order Summary</span></div>
                  <div className="adm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { label: 'Total Orders', val: orders.length },
                      { label: 'Pending', val: orders.filter(o => o.status === 'pending').length, cls: 'adm-text-fire' },
                      { label: 'Preparing', val: orders.filter(o => o.status === 'preparing').length, cls: 'adm-text-gold' },
                      { label: 'Ready', val: orders.filter(o => o.status === 'ready').length, cls: 'adm-text-green' },
                      { label: 'Completed', val: orders.filter(o => ['completed','delivered'].includes(o.status)).length, cls: 'adm-text-muted' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--adm-border)' }}>
                        <span style={{ fontSize: '13px', color: 'var(--adm-text-muted)' }}>{row.label}</span>
                        <strong className={row.cls || ''}>{row.val}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ══════════ SETTINGS ══════════ */}
          {activePage === 'settings' && (
            <>
              <div className="adm-section-header">
                <h2 className="adm-section-title">Restaurant <span>Settings</span></h2>
                <button className="adm-btn primary" onClick={saveSettings} disabled={settingsSaving}>
                  {settingsSaving ? 'Saving…' : '💾 Save Settings'}
                </button>
              </div>

              <div className="adm-settings-grid">
                <div className="adm-settings-section">
                  <div className="adm-settings-section-title">🏠 Restaurant Info</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="adm-form-group">
                      <label className="adm-label">Restaurant Name</label>
                      <input className="adm-input" value={settings.restaurant_name} onChange={e => setSettings(s => ({ ...s, restaurant_name: e.target.value }))} />
                    </div>
                    <div className="adm-form-group">
                      <label className="adm-label">Address</label>
                      <textarea className="adm-textarea" rows={2} value={settings.address} onChange={e => setSettings(s => ({ ...s, address: e.target.value }))} />
                    </div>
                    <div className="adm-form-group">
                      <label className="adm-label">Opening Hours</label>
                      <input className="adm-input" value={settings.opening_hours} onChange={e => setSettings(s => ({ ...s, opening_hours: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="adm-settings-section">
                  <div className="adm-settings-section-title">📞 Contact Details</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="adm-form-group">
                      <label className="adm-label">Phone Number</label>
                      <input className="adm-input" placeholder="+91 XXXXX XXXXX" value={settings.phone} onChange={e => setSettings(s => ({ ...s, phone: e.target.value }))} />
                    </div>
                    <div className="adm-form-group">
                      <label className="adm-label">WhatsApp Number (with country code)</label>
                      <input className="adm-input" placeholder="917011822978" value={settings.whatsapp} onChange={e => setSettings(s => ({ ...s, whatsapp: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="adm-settings-section">
                  <div className="adm-settings-section-title">🔐 Security</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--adm-text-muted)', lineHeight: '1.6' }}>
                      Admin PIN is hardcoded in the source code. To change it, update <code style={{ background: 'var(--adm-surface3)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>ADMIN_PIN</code> in <code style={{ background: 'var(--adm-surface3)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>AdminDashboard.jsx</code>.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'var(--adm-gold-dim)', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.2)' }}>
                      <span>🔑</span>
                      <span style={{ fontSize: '13px', color: 'var(--adm-gold)' }}>Current PIN: ••••</span>
                    </div>
                    <button className="adm-btn danger" onClick={() => { localStorage.removeItem('matka_admin_auth'); setAuthed(false); }}>
                      🚪 Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>{/* /adm-content */}
      </div>{/* /adm-main */}
    </div>
  );
}
