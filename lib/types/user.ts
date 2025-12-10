/**
 * Types centralisés pour les utilisateurs
 */

export interface User {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  addresses?: Address[];
  orders_count?: number;
}

export interface Address {
  id: string;
  user_id: string;
  label?: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  zipCode?: string;
  country: string;
  is_default: boolean;
  created_at: string;
}
