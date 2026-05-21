import { useState, useEffect, useRef, useMemo } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useOrder } from '../context/OrderContext';
import { useToast } from '../context/ToastContext';
import { useMenuData } from '../hooks/useMenuData';

const STATIC_MENU_DATA = {
  vadapav: { icon: '🍔', title: 'Vadapav', items: [
    ['Regular Vadapav','₹20'],['Chura Pav','₹15'],['Cheese Vadapav','₹40'],
    ['Schezwan Vadapav','₹40'],['Schezwan Cheese Vadapav','₹50'],
    ['Mayonnaise Vadapav','₹40'],['Mayonnaise Cheese Vadapav','₹55'],
    ['Mayonnaise Che. Sch. Vadapav','₹60'],
    ['Special Matka Haweli Vadapav','₹80'],['Vahi Vada','₹40'],
  ]},
  chrispy: { icon: '🔥', title: 'Chrispy Vada Pav', items: [
    ['Chrispy Vadapav','₹50'],['Chrispy Cheese Vadapav','₹60'],
    ['Chrispy Schezwan Vadapav','₹60'],['Chrispy Sch. Cheese Vadapav','₹70'],
    ['Chrispy Mayonnaise Vadapav','₹60'],['Chrispy May. Che. Vadapav','₹70'],
    ['Chrispy May. Che. Sch. Vadapav','₹75'],
  ]},
  tandoor: { icon: '♨️', title: 'Tandoor Vada Pav', items: [
    ['Tandoor Vadapav','₹40'],['Tandoor Cheese Vadapav','₹60'],
    ['Tandoor Schezwan Vadapav','₹55'],['Tandoor Sch. Cheese Vadapav','₹65'],
    ['Tandoor Mayonnaise Vadapav','₹55'],['Tandoor May. Che. Vadapav','₹65'],
    ['Tandoor May. Che. Sch. Vadapav','₹70'],['Tandoor Paneer Vadapav','₹60'],
    ['Tandoor Paneer Cheese Sch Vadapav','₹70'],['Tandoor Less Vadapav','₹60'],
  ]},
  anda: { icon: '🥚', title: 'Anda (अंडा)', items: [
    ['Handi Masala (Half)','₹60'],['Handi Masala (Full)','₹80'],
    ['Handi Paneer','₹120'],['Handi Biryani','₹120'],
    ['Boil Anda (Single)','₹30'],['Double Anda Burji','₹60'],
    ['Double Omelette','₹50'],['Omelette Pav','₹60'],
    ['Anda Burji Pav','₹70'],['Anda Burji Chapati','₹80'],
  ]},
  misal: { icon: '🥘', title: 'Misal & Bhaji', items: [
    ['Puneri Misal (पुनेरी मिसळ)','₹60'],['Puneri Vada Misal','₹60'],
    ['Puneri Vada Misal Pav','₹70'],['Puneri Vada Cheese Misal Pav','₹85'],
    ['Puri Bhaji (पुरी भाजी)','₹90'],['Mung Bhaji (मुंग भाजी)','₹40'],
  ]},
  vada: { icon: '🧆', title: 'Variety of Vada', items: [
    ['Vada Single','₹15'],['Cheese Vada Single','₹30'],
    ['Chrispy Vada Single','₹25'],['Chrispy Cheese Vada Single','₹35'],
  ]},
  chai: { icon: '☕', title: 'Chai & Coffee (चहा आणि कॉफी)', items: [
    ['Kulhad Chai (कुल्लड चहा)','₹15'],['Tandoor Chai (तंदूर चहा)','₹30'],
    ['Nes Coffee (नेस कॉफी)','₹40'],
  ]},
  thali: { icon: '🍽️', title: 'Thali (थाळी)', items: [
    ['Veg Thali (भेज थाळी)','₹150'],['Chicken Thali (चिकन थाळी)','₹200'],
    ['Mutton Spe. Thali (मटण स्पे. थाळी)','₹299'],['Anda Thali (अंडा थाळी)','₹160'],
    ['Surmai Thali (सुरमय थाळी)','₹350'],['Paplet Thali (पापलेट थाळी)','₹360'],
    ['Prawns Thali (फ्रॉन्स थाळी)','₹370'],['Bangda Thali (बांगडा थाळी)','₹250'],
    ['Bombil Thali (बोबील थाळी)','₹250'],
  ]},
  fry: { icon: '🐟', title: 'Fry (फ्राय)', items: [
    ['Surmai Fry (सुरमय फ्राय)','₹170'],['Paplet Fry (पापलेट फ्राय)','₹160'],
    ['Prawns Fry (फ्रॉन्स फ्राय)','₹200'],['Bangda Fry (बांगडा फ्राय)','₹120'],
    ['Bombil Fry (बोबील फ्राय)','₹120'],
  ]},
  starter: { icon: '🍗', title: 'Starter (स्टार्टर)', items: [
    ['Chicken Fry 6 Pcs (चिकन फ्राय)','₹160'],
    ['Kalegi Fry 6 Pcs (कलेजी फ्राय)','₹150'],
    ['Pota Fry 6 Pcs (पोटा फ्राय)','₹150'],
  ]},
  mutton: { icon: '🥩', title: 'Mutton Matka (मटन मटका)', items: [
    ['Mutton 3 Pcs (मटन ३ पीस)','₹399'],
    ['Mutton 5 Pcs (मटन ५ पीस)','₹499'],
    ['Mutton 10 Pcs (मटन १० पीस)','₹799'],
    ['Mutton Half Kilo (हाफ किलो)','₹1200'],
    ['Mutton Full Kilo (फुल किलो)','₹2200'],
  ]},
  chicken: { icon: '🍖', title: 'Chicken Matka (चिकन मटका)', items: [
    ['Chicken Matka 6 Pcs Gravy','₹320'],
    ['Chicken Matka 12 Pcs Gravy','₹629'],
    ['Sukha Chicken 5 Pcs (सुखा चिकन)','₹270'],
    ['Rassa Chicken 5 Pcs (रस्सा चिकन)','₹260'],
    ['Chicken Half Kilo (हाफ किलो)','₹600'],
    ['Chicken Full Kilo (फुल किलो)','₹1000'],
  ]},
  biryani: { icon: '🍚', title: 'Biryani (बिर्याणी)', items: [
    ['Regular Biryani (रेगुलर)','₹249'],
    ['Dum Biryani Half (दम हाफ)','₹399'],
    ['Dum Biryani Full (दम फुल)','₹799'],
    ['Angara Biryani Half (अंगारा हाफ)','₹450'],
    ['Angara Biryani Full (अंगारा फुल)','₹850'],
    ['Butter Biryani Half (बटर हाफ)','₹450'],
    ['Butter Biryani Full (बटर फुल)','₹850'],
    ['Regular Biryani 1 Kg','₹1200'],['Dum Biryani 1 Kg','₹1350'],
    ['Angara Biryani 1 Kg','₹1650'],['Butter Biryani 1 Kg','₹1700'],
    ['Tikka Biryani 1 Kg','₹1900'],['Mutton Biryani 1 Kg','₹2400'],
  ]},
  rice: { icon: '🍛', title: 'Rice (राईस)', items: [
    ['Chicken Fried Rice','₹90/150'],['Chicken Schezwan Rice','₹100/170'],
    ['Pot Rice','₹310'],['Clay Pot Rice','₹320'],
    ['Mongolian Pot Rice','₹290'],['Combination Rice','₹230'],
    ['Burnt Garlic Fried Rice','₹230'],['Burnt Chilli Rice','₹230'],
    ['Plain Rice (प्लेन राईस)','₹70'],['Jeera Rice (जिरा राईस)','₹110'],
  ]},
  ricetopping: { icon: '🍲', title: 'Rice & Topping (टॉपिंग)', items: [
    ['Chicken Manchurian Rice','₹280'],['Chilli Rice','₹250'],
    ['Chicken Crispy Rice','₹270'],['Chicken Chowmein Rice','₹280'],
    ['Dragon Chicken Rice','₹260'],['Malaysian Rice','₹230'],
    ['Kasuri Rice','₹240'],['Garlic Rice','₹330'],
  ]},
  ricegravy: { icon: '🥣', title: 'Rice & Gravy (ग्रेवी)', items: [
    ['Chicken Chilli Rice Gravy','₹250'],['Manchurian Rice Gravy','₹240'],
    ['Dragon Rice Gravy','₹250'],['Chicken Singapore Rice Gravy','₹270'],
    ['Chicken Hunan Rice Gravy','₹280'],['Korean Rice Gravy','₹310'],
    ['Chicken Thai Rice Gravy','₹320'],
  ]},
  noodles: { icon: '🍜', title: 'Noodles (नूडल्स)', items: [
    ['Chicken Hakka Noodles','₹90/160'],['Chicken Schezwan Noodles','₹100/170'],
    ['Singapore Noodles','₹290'],['Hongkong Noodles','₹280'],
    ['Burnt Garlic Noodles','₹300'],['Burnt Chilli Noodles','₹290'],
    ['Matka Haweli Special Noodles','₹180/230'],
  ]},
  chinese: { icon: '🥡', title: 'Chinese Starter (चायनिज)', items: [
    ['Chicken Chilli Dry','₹280'],['Chicken Manchurian Dry','₹270'],
    ['Chicken 65 Dry','₹270'],['Chicken Chowmein Dry','₹280'],
    ['Chicken Hunan Dry','₹280'],['Chicken Black Pepper','₹290'],
    ['Chicken Butter Garlic','solid ₹300'],['Chicken Mongolian Dry','₹280'],
    ['Chicken Dragon','₹260'],['Matka Haweli Special Dry','₹310'],
  ]},
  kebsa: { icon: '🫕', title: 'Kebsa (केब्सा)', items: [
    ['Malai Kebsa','₹1049'],['Dragon Kebsa','₹999'],
    ['Chilli Kebsa','₹1049'],['Tikka Kebsa','₹1091'],
    ['Tandoori Kebsa','₹1111'],['Schezwan Kebsa','₹1049'],
    ['Matka Haweli Special Kebsa','₹1999'],
  ]},
  soup: { icon: '🥣', title: 'Soup (सूप)', items: [
    ['Hot & Sour Soup','₹70/120'],['Manchow Soup','₹90/150'],
    ['Lemon Coriander Soup','₹100/170'],['Sweet Corn Soup','₹80/150'],
    ['Tomato Ginger Soup','₹60/100'],['Clear Soup','₹70/120'],
    ['Matka Haweli Special Soup','₹100/180'],['Leng Peng Soup','₹120'],
  ]},
  special: { icon: '👑', title: 'Matka Haweli Special (स्पेशल)', items: [
    ['Kombdi Wade (कोंबडी वडे)','₹250'],['Mutton Wade (मटण वडे)','₹320'],
    ['Solkadhi (सोलकढी)','₹30'],['Taak (ताक)','₹30'],
    ['Paneer Masala (पनीर मसाला)','₹230'],['Dal Khichdi (डाळ खिचडी)','₹180'],
    ['Paneer Burji (पनीर बुर्जी)','₹180'],['Matar Paneer (मटर पनीर)','₹220'],
  ]},
  bhakri: { icon: '🫓', title: 'Bhakri & Roti (भाकरी)', items: [
    ['Jwari Bhakri (ज्वारी भाकरी)','₹30'],['Nachni Bhakri (नाचणी भाकरी)','₹30'],
    ['Tandul Bhakri (तांदूळ भाकरी)','₹30'],['Bajri Bhakri (बाजरी भाकरी)','₹30'],
    ['Chapati (चपाती)','₹15'],
  ]},
  mojito: { icon: '🍹', title: 'Mojito (मोजीतो)', items: [
    ['Lemon Pudina','₹50'],['Orange','₹50'],['Green Apple','₹50'],
    ['Litchi','₹50'],['Strawberry','₹50'],['Mango','₹50'],
    ['Paan','₹50'],['Pineapple','₹50'],['Blueberry','₹50'],
    ['Raspberry','₹50'],['Watermelon','₹50'],['Pomegranate','₹50'],
    ['Peru (Guava)','₹50'],['Jaljeera','₹50'],
  ]},
  extra: { icon: '➕', title: 'Extra (एक्स्ट्रा)', items: [
    ['Chicken Rassa (चिकन रस्सा)','₹40'],
    ['Mutton Rassa (मटण रस्सा)','₹50'],
    ['Fish Rassa (मच्छी रस्सा)','₹40'],
  ]},
};

const STATIC_TABS = [
  { key: 'vadapav', label: '🍔 Vadapav' },
  { key: 'chrispy', label: '🔥 Chrispy' },
  { key: 'tandoor', label: '♨️ Tandoor' },
  { key: 'anda', label: '🥚 Anda' },
  { key: 'misal', label: '🥘 Misal' },
  { key: 'vada', label: '🧆 Vada' },
  { key: 'chai', label: '☕ Chai' },
  { key: 'thali', label: '🍽️ Thali' },
  { key: 'fry', label: '🐟 Fry' },
  { key: 'starter', label: '🍗 Starter' },
  { key: 'mutton', label: '🥩 Mutton' },
  { key: 'chicken', label: '🍖 Chicken' },
  { key: 'biryani', label: '🍚 Biryani' },
  { key: 'rice', label: '🍛 Rice' },
  { key: 'ricetopping', label: '🍲 Rice Topping' },
  { key: 'ricegravy', label: '🥣 Rice Gravy' },
  { key: 'noodles', label: '🍜 Noodles' },
  { key: 'chinese', label: '🥡 Chinese' },
  { key: 'kebsa', label: '🫕 Kebsa' },
  { key: 'soup', label: '🥣 Soup' },
  { key: 'special', label: '👑 Special' },
  { key: 'bhakri', label: '🫓 Bhakri' },
  { key: 'mojito', label: '🍹 Mojito' },
  { key: 'extra', label: '➕ Extra' },
];

function MenuSkeleton() {
  return (
    <div className="menu-skeleton">
      <div className="menu-skeleton-tabs">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="menu-skeleton-tab shimmer" />
        ))}
      </div>
      <div className="menu-skeleton-list">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="menu-skeleton-item shimmer" />
        ))}
      </div>
    </div>
  );
}

function AddButton({ name, price }) {
  const { addItem, removeItem, items } = useOrder();
  const { addToast } = useToast();
  const [pop, setPop] = useState(false);
  const qty = items.find(i => i.name === name)?.qty || 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    addItem(name, price);
    setPop(true);
    setTimeout(() => setPop(false), 400);
    addToast(`Added! ${name}`, 'success', 1500);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    removeItem(name);
    if (qty <= 1) addToast(`Removed ${name}`, 'error', 1500);
  };

  if (qty > 0) {
    return (
      <div className="mi-qty-controls" onClick={(e) => e.stopPropagation()}>
        <button className="mi-qty-btn mi-qty-minus" onClick={handleRemove}>−</button>
        <span className="mi-qty-count">{qty}</span>
        <button className={`mi-qty-btn mi-qty-plus${pop ? ' pop' : ''}`} onClick={handleAdd}>+</button>
      </div>
    );
  }

  return (
    <button className={`mi-add-btn${pop ? ' pop' : ''}`} onClick={handleAdd} title="Add to order">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}

function MenuCategory({ data }) {
  const itemsRef = useRef(null);

  useEffect(() => {
    if (itemsRef.current) {
      const items = itemsRef.current.querySelectorAll('.mi');
      items.forEach((item, i) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(16px) scale(.97)';
        item.style.transition = 'opacity .4s ease, transform .4s ease';
        setTimeout(() => {
          item.style.opacity = '1';
          item.style.transform = 'translateY(0) scale(1)';
        }, (i + 1) * 50);
      });
    }
  }, [data]);

  return (
    <div className="menu-category-h">
      <div className="cat-header">
        <span className="cat-icon">{data.icon}</span>
        <h3>{data.title}</h3>
        <span className="cat-count">{data.items.length} items</span>
      </div>
      <div className="cat-items" ref={itemsRef}>
        {data.items.map(([name, price]) => (
          <div className="mi" key={name}>
            <div className="mi-info">
              <span className="mi-name">{name}</span>
              <span className="mi-price">{price}</span>
            </div>
            <AddButton name={name} price={price} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Menu() {
  const { menuData: liveMenuData, tabs: liveTabs, loading, error } = useMenuData();

  const menuData = (liveMenuData && Object.keys(liveMenuData).length > 0) ? liveMenuData : STATIC_MENU_DATA;
  const TABS = liveTabs.length > 0 ? liveTabs : STATIC_TABS;

  const [activeTab, setActiveTab] = useState('vadapav');
  const [searchQuery, setSearchQuery] = useState('');
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const header = useScrollReveal({ animation: 'fade-up' });
  const tabs = useScrollReveal({ animation: 'fade-up', delay: 100 });
  const content = useScrollReveal({ animation: 'fade-up', delay: 200 });
  const tabsContainerRef = useRef(null);

  useEffect(() => {
    if (liveTabs.length > 0 && !liveTabs.find(t => t.key === activeTab)) {
      setActiveTab(liveTabs[0]?.key || 'vadapav');
    }
  }, [liveTabs, activeTab]);

  const activeData = menuData[activeTab];

  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const activeBtn = container.querySelector('.menu-tab.active');
    if (!activeBtn) {
      setSliderStyle(prev => ({ ...prev, opacity: 0 }));
      return;
    }

    const updateSlider = () => {
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setSliderStyle({
        left: btnRect.left - containerRect.left + container.scrollLeft,
        width: btnRect.width,
        opacity: 1,
      });
    };

    requestAnimationFrame(updateSlider);
    activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    container.addEventListener('scroll', updateSlider, { passive: true });
    window.addEventListener('resize', updateSlider);
    return () => {
      container.removeEventListener('scroll', updateSlider);
      window.removeEventListener('resize', updateSlider);
    };
  }, [activeTab, searchQuery, menuData]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const results = [];
    Object.entries(menuData).forEach(([, cat]) => {
      cat.items.forEach(([name, price]) => {
        if (name.toLowerCase().includes(q)) {
          results.push([name, price]);
        }
      });
    });
    return results;
  }, [searchQuery, menuData]);

  const handleTabClick = (key) => {
    setActiveTab(key);
    setSearchQuery('');
  };

  return (
    <section id="menu" className="section menu-section">
      <div className="container">
        <div ref={header.ref} className={`section-header ${header.className}`}>
          <span className="section-label">OUR MENU</span>
          <h2 className="section-title">
            Chrispy Cheese Vadapav <span className="text-fire">&amp;</span> Tandoor Vadapav
          </h2>
          <div className="title-underline"></div>
          <p className="section-subtitle">जसा वडा आणि पाव — तस तुझ आणि माझ नात ♥</p>
          
          <div className={`menu-db-badge ${loading ? 'loading' : error ? 'offline' : 'live'}`}>
            <span className="menu-db-dot" />
            {loading ? 'Connecting to database…' : error ? 'Showing cached menu (DB offline)' : 'Live from Supabase'}
          </div>
        </div>

        {loading && <MenuSkeleton />}

        {!loading && error && (
          <div className="menu-db-error">
            ⚠️ Could not reach Supabase — showing cached menu data.
          </div>
        )}

        {!loading && (
          <div className="menu-search-wrap">
            <div className="menu-search-box">
              <svg className="menu-search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                className="menu-search-input"
                placeholder="Search menu... (e.g. biryani, paneer, mojito)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="menuSearch"
              />
              {searchQuery && (
                <button className="menu-search-clear" onClick={() => setSearchQuery('')}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {!loading && !searchQuery && (
          <div ref={(node) => { tabs.ref(node); tabsContainerRef.current = node; }} className={`menu-tabs-h ${tabs.className}`}>
            <div
              className="menu-tab-slider"
              style={{
                transform: `translateX(${sliderStyle.left}px)`,
                width: `${sliderStyle.width}px`,
                opacity: sliderStyle.opacity,
              }}
            />
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`menu-tab${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => handleTabClick(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Category items or search results */}
        {!loading && (
          <div ref={content.ref} className={`menu-content-h ${content.className}`}>
            {searchResults ? (
              searchResults.length > 0 ? (
                <div className="menu-category-h">
                  <div className="cat-header">
                    <span className="cat-icon">🔍</span>
                    <h3>Search Results — {searchResults.length} item{searchResults.length !== 1 ? 's' : ''}</h3>
                  </div>
                  <div className="cat-items">
                    {searchResults.map(([name, price]) => (
                      <div className="mi" key={name}>
                        <div className="mi-info">
                          <span className="mi-name">{name}</span>
                          <span className="mi-price">{price}</span>
                        </div>
                        <AddButton name={name} price={price} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="menu-search-empty">
                  <span className="menu-search-empty-icon">🔍</span>
                  <p>No items found for "<strong>{searchQuery}</strong>"</p>
                  <p className="menu-search-empty-hint">Try searching for biryani, thali, vadapav, mojito...</p>
                </div>
              )
            ) : (
              activeData && <MenuCategory key={activeTab} data={activeData} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}