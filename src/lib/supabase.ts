import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      purchases: {
        Row: {
          id: string;
          supplier_name: string;
          location_of_origin: string | null;
          date_of_purchase: string;
          quantity_bought: number;
          price_per_unit: number;
          total_amount_paid: number;
          payment_method: string;
          truck_number_plate: string | null;
          origin_weight: number | null;
          destination_weight: number | null;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          supplier_name: string;
          location_of_origin?: string | null;
          date_of_purchase: string;
          quantity_bought: number;
          price_per_unit: number;
          total_amount_paid: number;
          payment_method: string;
          truck_number_plate?: string | null;
          origin_weight?: number | null;
          destination_weight?: number | null;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          supplier_name?: string;
          location_of_origin?: string | null;
          date_of_purchase?: string;
          quantity_bought?: number;
          price_per_unit?: number;
          total_amount_paid?: number;
          payment_method?: string;
          truck_number_plate?: string | null;
          origin_weight?: number | null;
          destination_weight?: number | null;
          user_id?: string;
          created_at?: string;
        };
      };
      sales: {
        Row: {
          id: string;
          customer_name: string;
          driver_phone: string;
          date_of_sale: string;
          quantity_sold: number;
          number_of_bags: number | null;
          selling_price_per_unit: number;
          amount_paid: number;
          comment: string;
          total_amount_received: number;
          delivery_method: string;
          payment_method_sale: string | null;
          deposited_amount: number | null;
          cheque_paid: number | null;
          small_comment: string | null;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          driver_phone: string;
          date_of_sale: string;
          quantity_sold: number;
          number_of_bags?: number | null;
          selling_price_per_unit: number;
          amount_paid: number;
          comment: string;
          total_amount_received: number;
          delivery_method: string;
          payment_method_sale?: string | null;
          deposited_amount?: number | null;
          cheque_paid?: number | null;
          small_comment?: string | null;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_name?: string;
          driver_phone?: string;
          date_of_sale?: string;
          quantity_sold?: number;
          number_of_bags?: number | null;
          selling_price_per_unit?: number;
          amount_paid?: number;
          comment?: string;
          total_amount_received?: number;
          delivery_method?: string;
          payment_method_sale?: string | null;
          deposited_amount?: number | null;
          cheque_paid?: number | null;
          small_comment?: string | null;
          user_id?: string;
          created_at?: string;
        };
      };
      laborers: {
        Row: {
          id: string;
          date: string;
          number_of_laborers: number;
          price_per_laborer: number;
          total_labour: number;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          number_of_laborers: number;
          price_per_laborer: number;
          total_labour: number;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          number_of_laborers?: number;
          price_per_laborer?: number;
          total_labour?: number;
          user_id?: string;
          created_at?: string;
        };
      };
    };
  };
};