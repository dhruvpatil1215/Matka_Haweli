import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';

export default function OrderButton() {
  const { user } = useAuth();
  const { totalItems, setShowLogin, setShowOrder } = useOrder();

  const handleClick = () => {
    if (user) {
      setShowOrder(true);
    } else {
      setShowLogin(true);
    }
  };

  return (
    <button className="floating-order-btn" id="orderNowBtn" onClick={handleClick}>
      <span className="order-btn-icon">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
      </span>
      <span className="order-btn-label">ORDER</span>
      {totalItems > 0 && (
        <span className="order-btn-badge">{totalItems}</span>
      )}
    </button>
  );
}
