import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Simple in-memory cache so we only fetch once per session
const cache = {};

async function fetchWithCache(key, fetcher) {
  if (cache[key]) return cache[key];
  const data = await fetcher();
  cache[key] = data;
  return data;
}

/**
 * Fetches all categories + their menu_items from Supabase.
 * Returns: { menuData, tabs, loading, error }
 *   menuData: { [slug]: { icon, title, items: [[name, price], ...] } }
 *   tabs:     [{ key, label }, ...]
 */
export function useMenuData() {
  const [menuData, setMenuData] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Fetch categories ordered by sort_order
        const { data: categories, error: catErr } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (catErr) throw catErr;

        // Fetch all menu items
        const { data: menuItems, error: itemErr } = await supabase
          .from('menu_items')
          .select('*')
          .eq('is_available', true)
          .order('sort_order', { ascending: true });

        if (itemErr) throw itemErr;

        // Build menuData map keyed by category slug
        const dataMap = {};
        const tabList = [];

        categories.forEach((cat) => {
          const items = menuItems
            .filter((item) => item.category_id === cat.id)
            .map((item) => [item.name, item.price]);

          dataMap[cat.slug] = {
            icon: cat.icon,
            title: cat.title,
            items,
          };

          tabList.push({
            key: cat.slug,
            label: `${cat.icon} ${cat.title.split(' ')[0]}`,
          });
        });

        if (!cancelled) {
          setMenuData(dataMap);
          setTabs(tabList);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch menu data:', err);
          setError(err.message || 'Failed to load menu');
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { menuData, tabs, loading, error };
}

/**
 * Fetches featured specials from Supabase.
 * Returns: { specials, loading, error }
 */
export function useSpecialsData() {
  const [specials, setSpecials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data, error: err } = await supabase
          .from('specials')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (err) throw err;

        const mapped = data.map((s) => ({
          num: s.display_number,
          emoji: s.emoji,
          name: s.name,
          desc: s.description,
          price: s.price,
          badge: s.badge,
        }));

        if (!cancelled) {
          setSpecials(mapped);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch specials:', err);
          setError(err.message || 'Failed to load specials');
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { specials, loading, error };
}
