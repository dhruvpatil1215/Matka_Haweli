import { createContext, useContext, useState } from 'react';

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const [items, setItems] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const addItem = (name, price) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.name === name);
      if (existing) {
        return prev.map((i) =>
          i.name === name ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { name, price, qty: 1 }];
    });
  };

  const removeItem = (name) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.name === name);
      if (existing && existing.qty > 1) {
        return prev.map((i) =>
          i.name === name ? { ...i, qty: i.qty - 1 } : i
        );
      }
      return prev.filter((i) => i.name !== name);
    });
  };

  const deleteItem = (name) => {
    setItems((prev) => prev.filter((i) => i.name !== name));
  };

  const clearOrder = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = items.reduce((sum, i) => {
    const priceStr = String(i.price);
    const num = parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;
    return sum + num * i.qty;
  }, 0);

  return (
    <OrderContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        deleteItem,
        clearOrder,
        totalItems,
        totalPrice,
        showLogin,
        setShowLogin,
        showOrder,
        setShowOrder,
        showHistory,
        setShowHistory,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrder must be inside OrderProvider');
  return ctx;
}
