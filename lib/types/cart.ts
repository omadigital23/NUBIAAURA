// Types standardisés pour le panier NUBIA AURA

export interface CartItem {
  id: string; // product_id
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface CartState {
  items: CartItem[];
  total: number;
  loading: boolean;
  error: string | null;
}

export interface CartContextType extends CartState {
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  refetchCart: () => Promise<void>;
}

export interface PersistedCartItem extends CartItem {
  // Extension pour persistence
}

export interface CartApiResponse {
  items?: CartItem[];
  success?: boolean;
  item?: CartItem;
  error?: string;
  code?: string;
}

// Types pour les actions du panier
export type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART'; payload: CartItem[] };
