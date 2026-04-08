/**
 * Shared address interface used across address components
 */
export interface Address {
  id: string;
  label: string;
  first_name: string;
  last_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}
