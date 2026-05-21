-- ================================================================
-- MATKA HAWELI — Supabase Database Schema + Data
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor)
-- ================================================================

-- 1. CATEGORIES
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  icon TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. MENU ITEMS
CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  description TEXT,
  is_veg BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. SPECIALS (Featured items on homepage)
CREATE TABLE specials (
  id SERIAL PRIMARY KEY,
  display_number TEXT NOT NULL,
  emoji TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT NOT NULL,
  badge TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. GALLERY
CREATE TABLE gallery (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  label TEXT,
  is_large BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ORDERS
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT,
  order_type TEXT DEFAULT 'pickup' CHECK (order_type IN ('pickup','delivery','dine-in')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','preparing','ready','delivered','cancelled')),
  total_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ORDER ITEMS
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_price TEXT NOT NULL,
  quantity INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. RESERVATIONS
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  guests INT DEFAULT 2,
  occasion TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- INSERT CATEGORIES
-- ================================================================
INSERT INTO categories (slug, title, icon, sort_order) VALUES
('vadapav', 'Vadapav', '🍔', 1),
('chrispy', 'Chrispy Vada Pav', '🔥', 2),
('tandoor', 'Tandoor Vada Pav', '♨️', 3),
('anda', 'Anda (अंडा)', '🥚', 4),
('misal', 'Misal & Bhaji', '🥘', 5),
('vada', 'Variety of Vada', '🧆', 6),
('chai', 'Chai & Coffee (चहा आणि कॉफी)', '☕', 7),
('thali', 'Thali (थाळी)', '🍽️', 8),
('fry', 'Fry (फ्राय)', '🐟', 9),
('starter', 'Starter (स्टार्टर)', '🍗', 10),
('mutton', 'Mutton Matka (मटन मटका)', '🥩', 11),
('chicken', 'Chicken Matka (चिकन मटका)', '🍖', 12),
('biryani', 'Biryani (बिर्याणी)', '🍚', 13),
('rice', 'Rice (राईस)', '🍛', 14),
('ricetopping', 'Rice & Topping (टॉपिंग)', '🍲', 15),
('ricegravy', 'Rice & Gravy (ग्रेवी)', '🥣', 16),
('noodles', 'Noodles (नूडल्स)', '🍜', 17),
('chinese', 'Chinese Starter (चायनिज)', '🥡', 18),
('kebsa', 'Kebsa (केब्सा)', '🫕', 19),
('soup', 'Soup (सूप)', '🥣', 20),
('special', 'Matka Haweli Special (स्पेशल)', '👑', 21),
('bhakri', 'Bhakri & Roti (भाकरी)', '🫓', 22),
('mojito', 'Mojito (मोजीतो)', '🍹', 23),
('extra', 'Extra (एक्स्ट्रा)', '➕', 24);

-- ================================================================
-- INSERT MENU ITEMS
-- ================================================================

-- Vadapav (category_id = 1)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(1, 'Regular Vadapav', '₹20', 1),
(1, 'Chura Pav', '₹15', 2),
(1, 'Cheese Vadapav', '₹40', 3),
(1, 'Schezwan Vadapav', '₹40', 4),
(1, 'Schezwan Cheese Vadapav', '₹50', 5),
(1, 'Mayonnaise Vadapav', '₹40', 6),
(1, 'Mayonnaise Cheese Vadapav', '₹55', 7),
(1, 'Mayonnaise Che. Sch. Vadapav', '₹60', 8),
(1, 'Special Matka Haweli Vadapav', '₹80', 9),
(1, 'Vahi Vada', '₹40', 10);

-- Chrispy (category_id = 2)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(2, 'Chrispy Vadapav', '₹50', 1),
(2, 'Chrispy Cheese Vadapav', '₹60', 2),
(2, 'Chrispy Schezwan Vadapav', '₹60', 3),
(2, 'Chrispy Sch. Cheese Vadapav', '₹70', 4),
(2, 'Chrispy Mayonnaise Vadapav', '₹60', 5),
(2, 'Chrispy May. Che. Vadapav', '₹70', 6),
(2, 'Chrispy May. Che. Sch. Vadapav', '₹75', 7);

-- Tandoor (category_id = 3)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(3, 'Tandoor Vadapav', '₹40', 1),
(3, 'Tandoor Cheese Vadapav', '₹60', 2),
(3, 'Tandoor Schezwan Vadapav', '₹55', 3),
(3, 'Tandoor Sch. Cheese Vadapav', '₹65', 4),
(3, 'Tandoor Mayonnaise Vadapav', '₹55', 5),
(3, 'Tandoor May. Che. Vadapav', '₹65', 6),
(3, 'Tandoor May. Che. Sch. Vadapav', '₹70', 7),
(3, 'Tandoor Paneer Vadapav', '₹60', 8),
(3, 'Tandoor Paneer Cheese Sch Vadapav', '₹70', 9),
(3, 'Tandoor Less Vadapav', '₹60', 10);

-- Anda (category_id = 4)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(4, 'Handi Masala (Half)', '₹60', 1),
(4, 'Handi Masala (Full)', '₹80', 2),
(4, 'Handi Paneer', '₹120', 3),
(4, 'Handi Biryani', '₹120', 4),
(4, 'Boil Anda (Single)', '₹30', 5),
(4, 'Double Anda Burji', '₹60', 6),
(4, 'Double Omelette', '₹50', 7),
(4, 'Omelette Pav', '₹60', 8),
(4, 'Anda Burji Pav', '₹70', 9),
(4, 'Anda Burji Chapati', '₹80', 10);

-- Misal & Bhaji (category_id = 5)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(5, 'Puneri Misal (पुनेरी मिसळ)', '₹60', 1),
(5, 'Puneri Vada Misal', '₹60', 2),
(5, 'Puneri Vada Misal Pav', '₹70', 3),
(5, 'Puneri Vada Cheese Misal Pav', '₹85', 4),
(5, 'Puri Bhaji (पुरी भाजी)', '₹90', 5),
(5, 'Mung Bhaji (मुंग भाजी)', '₹40', 6);

-- Vada (category_id = 6)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(6, 'Vada Single', '₹15', 1),
(6, 'Cheese Vada Single', '₹30', 2),
(6, 'Chrispy Vada Single', '₹25', 3),
(6, 'Chrispy Cheese Vada Single', '₹35', 4);

-- Chai & Coffee (category_id = 7)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(7, 'Kulhad Chai (कुल्लड चहा)', '₹15', 1),
(7, 'Tandoor Chai (तंदूर चहा)', '₹30', 2),
(7, 'Nes Coffee (नेस कॉफी)', '₹40', 3);

-- Thali (category_id = 8)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(8, 'Veg Thali (भेज थाळी)', '₹150', 1),
(8, 'Chicken Thali (चिकन थाळी)', '₹200', 2),
(8, 'Mutton Spe. Thali (मटण स्पे. थाळी)', '₹299', 3),
(8, 'Anda Thali (अंडा थाळी)', '₹160', 4),
(8, 'Surmai Thali (सुरमय थाळी)', '₹350', 5),
(8, 'Paplet Thali (पापलेट थाळी)', '₹360', 6),
(8, 'Prawns Thali (फ्रॉन्स थाळी)', '₹370', 7),
(8, 'Bangda Thali (बांगडा थाळी)', '₹250', 8),
(8, 'Bombil Thali (बोबील थाळी)', '₹250', 9);

-- Fry (category_id = 9)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(9, 'Surmai Fry (सुरमय फ्राय)', '₹170', 1),
(9, 'Paplet Fry (पापलेट फ्राय)', '₹160', 2),
(9, 'Prawns Fry (फ्रॉन्स फ्राय)', '₹200', 3),
(9, 'Bangda Fry (बांगडा फ्राय)', '₹120', 4),
(9, 'Bombil Fry (बोबील फ्राय)', '₹120', 5);

-- Starter (category_id = 10)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(10, 'Chicken Fry 6 Pcs (चिकन फ्राय)', '₹160', 1),
(10, 'Kalegi Fry 6 Pcs (कलेजी फ्राय)', '₹150', 2),
(10, 'Pota Fry 6 Pcs (पोटा फ्राय)', '₹150', 3);

-- Mutton Matka (category_id = 11)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(11, 'Mutton 3 Pcs (मटन ३ पीस)', '₹399', 1),
(11, 'Mutton 5 Pcs (मटन ५ पीस)', '₹499', 2),
(11, 'Mutton 10 Pcs (मटन १० पीस)', '₹799', 3),
(11, 'Mutton Half Kilo (हाफ किलो)', '₹1200', 4),
(11, 'Mutton Full Kilo (फुल किलो)', '₹2200', 5);

-- Chicken Matka (category_id = 12)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(12, 'Chicken Matka 6 Pcs Gravy', '₹320', 1),
(12, 'Chicken Matka 12 Pcs Gravy', '₹629', 2),
(12, 'Sukha Chicken 5 Pcs (सुखा चिकन)', '₹270', 3),
(12, 'Rassa Chicken 5 Pcs (रस्सा चिकन)', '₹260', 4),
(12, 'Chicken Half Kilo (हाफ किलो)', '₹600', 5),
(12, 'Chicken Full Kilo (फुल किलो)', '₹1000', 6);

-- Biryani (category_id = 13)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(13, 'Regular Biryani (रेगुलर)', '₹249', 1),
(13, 'Dum Biryani Half (दम हाफ)', '₹399', 2),
(13, 'Dum Biryani Full (दम फुल)', '₹799', 3),
(13, 'Angara Biryani Half (अंगारा हाफ)', '₹450', 4),
(13, 'Angara Biryani Full (अंगारा फुल)', '₹850', 5),
(13, 'Butter Biryani Half (बटर हाफ)', '₹450', 6),
(13, 'Butter Biryani Full (बटर फुल)', '₹850', 7),
(13, 'Regular Biryani 1 Kg', '₹1200', 8),
(13, 'Dum Biryani 1 Kg', '₹1350', 9),
(13, 'Angara Biryani 1 Kg', '₹1650', 10),
(13, 'Butter Biryani 1 Kg', '₹1700', 11),
(13, 'Tikka Biryani 1 Kg', '₹1900', 12),
(13, 'Mutton Biryani 1 Kg', '₹2400', 13);

-- Rice (category_id = 14)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(14, 'Chicken Fried Rice', '₹90/150', 1),
(14, 'Chicken Schezwan Rice', '₹100/170', 2),
(14, 'Pot Rice', '₹310', 3),
(14, 'Clay Pot Rice', '₹320', 4),
(14, 'Mongolian Pot Rice', '₹290', 5),
(14, 'Combination Rice', '₹230', 6),
(14, 'Burnt Garlic Fried Rice', '₹230', 7),
(14, 'Burnt Chilli Rice', '₹230', 8),
(14, 'Plain Rice (प्लेन राईस)', '₹70', 9),
(14, 'Jeera Rice (जिरा राईस)', '₹110', 10);

-- Rice & Topping (category_id = 15)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(15, 'Chicken Manchurian Rice', '₹280', 1),
(15, 'Chilli Rice', '₹250', 2),
(15, 'Chicken Crispy Rice', '₹270', 3),
(15, 'Chicken Chowmein Rice', '₹280', 4),
(15, 'Dragon Chicken Rice', '₹260', 5),
(15, 'Malaysian Rice', '₹230', 6),
(15, 'Kasuri Rice', '₹240', 7),
(15, 'Garlic Rice', '₹330', 8);

-- Rice & Gravy (category_id = 16)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(16, 'Chicken Chilli Rice Gravy', '₹250', 1),
(16, 'Manchurian Rice Gravy', '₹240', 2),
(16, 'Dragon Rice Gravy', '₹250', 3),
(16, 'Chicken Singapore Rice Gravy', '₹270', 4),
(16, 'Chicken Hunan Rice Gravy', '₹280', 5),
(16, 'Korean Rice Gravy', '₹310', 6),
(16, 'Chicken Thai Rice Gravy', '₹320', 7);

-- Noodles (category_id = 17)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(17, 'Chicken Hakka Noodles', '₹90/160', 1),
(17, 'Chicken Schezwan Noodles', '₹100/170', 2),
(17, 'Singapore Noodles', '₹290', 3),
(17, 'Hongkong Noodles', '₹280', 4),
(17, 'Burnt Garlic Noodles', '₹300', 5),
(17, 'Burnt Chilli Noodles', '₹290', 6),
(17, 'Matka Haweli Special Noodles', '₹180/230', 7);

-- Chinese Starter (category_id = 18)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(18, 'Chicken Chilli Dry', '₹280', 1),
(18, 'Chicken Manchurian Dry', '₹270', 2),
(18, 'Chicken 65 Dry', '₹270', 3),
(18, 'Chicken Chowmein Dry', '₹280', 4),
(18, 'Chicken Hunan Dry', '₹280', 5),
(18, 'Chicken Black Pepper', '₹290', 6),
(18, 'Chicken Butter Garlic', '₹300', 7),
(18, 'Chicken Mongolian Dry', '₹280', 8),
(18, 'Chicken Dragon', '₹260', 9),
(18, 'Matka Haweli Special Dry', '₹310', 10);

-- Kebsa (category_id = 19)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(19, 'Malai Kebsa', '₹1049', 1),
(19, 'Dragon Kebsa', '₹999', 2),
(19, 'Chilli Kebsa', '₹1049', 3),
(19, 'Tikka Kebsa', '₹1091', 4),
(19, 'Tandoori Kebsa', '₹1111', 5),
(19, 'Schezwan Kebsa', '₹1049', 6),
(19, 'Matka Haweli Special Kebsa', '₹1999', 7);

-- Soup (category_id = 20)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(20, 'Hot & Sour Soup', '₹70/120', 1),
(20, 'Manchow Soup', '₹90/150', 2),
(20, 'Lemon Coriander Soup', '₹100/170', 3),
(20, 'Sweet Corn Soup', '₹80/150', 4),
(20, 'Tomato Ginger Soup', '₹60/100', 5),
(20, 'Clear Soup', '₹70/120', 6),
(20, 'Matka Haweli Special Soup', '₹100/180', 7),
(20, 'Leng Peng Soup', '₹120', 8);

-- Special (category_id = 21)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(21, 'Kombdi Wade (कोंबडी वडे)', '₹250', 1),
(21, 'Mutton Wade (मटण वडे)', '₹320', 2),
(21, 'Solkadhi (सोलकढी)', '₹30', 3),
(21, 'Taak (ताक)', '₹30', 4),
(21, 'Paneer Masala (पनीर मसाला)', '₹230', 5),
(21, 'Dal Khichdi (डाळ खिचडी)', '₹180', 6),
(21, 'Paneer Burji (पनीर बुर्जी)', '₹180', 7),
(21, 'Matar Paneer (मटर पनीर)', '₹220', 8);

-- Bhakri (category_id = 22)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(22, 'Jwari Bhakri (ज्वारी भाकरी)', '₹30', 1),
(22, 'Nachni Bhakri (नाचणी भाकरी)', '₹30', 2),
(22, 'Tandul Bhakri (तांदूळ भाकरी)', '₹30', 3),
(22, 'Bajri Bhakri (बाजरी भाकरी)', '₹30', 4),
(22, 'Chapati (चपाती)', '₹15', 5);

-- Mojito (category_id = 23)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(23, 'Lemon Pudina', '₹50', 1),
(23, 'Orange', '₹50', 2),
(23, 'Green Apple', '₹50', 3),
(23, 'Litchi', '₹50', 4),
(23, 'Strawberry', '₹50', 5),
(23, 'Mango', '₹50', 6),
(23, 'Paan', '₹50', 7),
(23, 'Pineapple', '₹50', 8),
(23, 'Blueberry', '₹50', 9),
(23, 'Raspberry', '₹50', 10),
(23, 'Watermelon', '₹50', 11),
(23, 'Pomegranate', '₹50', 12),
(23, 'Peru (Guava)', '₹50', 13),
(23, 'Jaljeera', '₹50', 14);

-- Extra (category_id = 24)
INSERT INTO menu_items (category_id, name, price, sort_order) VALUES
(24, 'Chicken Rassa (चिकन रस्सा)', '₹40', 1),
(24, 'Mutton Rassa (मटण रस्सा)', '₹50', 2),
(24, 'Fish Rassa (मच्छी रस्सा)', '₹40', 3);

-- ================================================================
-- INSERT SPECIALS
-- ================================================================
INSERT INTO specials (display_number, emoji, name, description, price, badge, sort_order) VALUES
('01', '🥗', 'Veg Thali (भेज थाळी)', 'डाळ, सुकी भाजी, रस्सा भाजी, पापड, दोन चपाती, लोणंच भात', '₹150', 'Pure Veg', 1),
('02', '🍗', 'Chicken Thali (चिकन थाळी)', 'सुखा चिकन आणि रस्सा, भात / २ चपाती / सोलकढी', '₹200', 'Bestseller', 2),
('03', '🍖', 'Mutton Spe. Thali (मटण स्पे. थाळी)', 'मटण आणि मटण रस्सा, भात / २ चपाती / सोलकढी', '₹299', 'Premium', 3),
('04', '🐟', 'Surmai Thali (सुरमय थाळी)', 'सुरमय रस्सा / फ्राय / जवळा, भात / १ भाकरी / सोलकढी', '₹350', 'Chef''s Special', 4);

-- ================================================================
-- INSERT GALLERY
-- ================================================================
INSERT INTO gallery (image_url, alt_text, label, is_large, sort_order) VALUES
('/assets/dining-hall.jpg', 'Matka Haweli Interior — Warm dining area with green wall decor and matka lamps', 'Royal Dining Hall', true, 1),
('/assets/thali.png', 'Traditional Thali', 'The Grand Thali', false, 2),
('/assets/tandoori.png', 'Tandoori Platter', 'Tandoori Classics', false, 3),
('/assets/matka-hero.png', 'Matka Cooking', 'The Matka Tradition', false, 4);

-- ================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ================================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE specials ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Public read access for menu data
CREATE POLICY "Public can read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public can read menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Public can read specials" ON specials FOR SELECT USING (true);
CREATE POLICY "Public can read gallery" ON gallery FOR SELECT USING (true);

-- Anyone can create orders and reservations
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create reservations" ON reservations FOR INSERT WITH CHECK (true);

-- Users can read their own orders
CREATE POLICY "Users read own orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Users read own order_items" ON order_items FOR SELECT USING (true);
