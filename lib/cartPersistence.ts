import { supabase } from '@/lib/supabase';

export type PersistedCartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

const LS_KEY = 'nubia_cart_v1';

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function loadCart(): Promise<PersistedCartItem[]> {
  const userId = await getCurrentUserId();
  if (userId) {
    const { data, error } = await supabase
      .from('carts')
      .select('items')
      .eq('user_id', userId)
      .single();
    if (!error && Array.isArray(data?.items) && data.items.length > 0) {
      return data.items as PersistedCartItem[];
    }
    // Fallback to localStorage for first-time sync or empty DB
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
      const fallback = raw ? (JSON.parse(raw) as PersistedCartItem[]) : [];
      // If we have local items, upsert them to DB for this user
      if (fallback.length > 0) {
        await supabase.from('carts').upsert({ user_id: userId, items: fallback }, { onConflict: 'user_id' });
      }
      return fallback;
    } catch {
      return [];
    }
  }
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
    return raw ? (JSON.parse(raw) as PersistedCartItem[]) : [];
  } catch {
    return [];
  }
}

export async function saveCart(items: PersistedCartItem[]): Promise<void> {
  const userId = await getCurrentUserId();
  if (userId) {
    await supabase.from('carts').upsert({ user_id: userId, items }, { onConflict: 'user_id' });
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }
}

export async function clearPersistedCart(): Promise<void> {
  const userId = await getCurrentUserId();
  if (userId) {
    await supabase.from('carts').delete().eq('user_id', userId);
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LS_KEY);
  }
}
