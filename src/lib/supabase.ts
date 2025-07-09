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
          location_of_origin?: string;
          date_of_purchase: string;
          quantity_bought: number;
          price_per_unit: number;
          total_amount_paid: number;
          payment_method: string;
          truck_number_plate?: string;
          origin_weight?: number;
          destination_weight?: number;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          supplier_name: string;
          location_of_origin?: string;
          date_of_purchase: string;
          quantity_bought: number;
          price_per_unit: number;
          total_amount_paid: number;
          payment_method: string;
          truck_number_plate?: string;
          origin_weight?: number;
          destination_weight?: number;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          supplier_name?: string;
          location_of_origin?: string;
          date_of_purchase?: string;
          quantity_bought?: number;
          price_per_unit?: number;
          total_amount_paid?: number;
          payment_method?: string;
          truck_number_plate?: string;
          origin_weight?: number;
          destination_weight?: number;
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
          selling_price_per_unit: number;
          amount_paid: number;
          comment: string;
          total_amount_received: number;
          delivery_method: string;
          number_of_bags?: number;
          deposited_amount?: number;
          cheque_paid?: number;
          small_comment?: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          driver_phone: string;
          date_of_sale: string;
          quantity_sold: number;
          selling_price_per_unit: number;
          amount_paid: number;
          comment: string;
          total_amount_received: number;
          delivery_method: string;
          number_of_bags?: number;
          deposited_amount?: number;
          cheque_paid?: number;
          small_comment?: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_name?: string;
          driver_phone?: string;
          date_of_sale?: string;
          quantity_sold?: number;
          selling_price_per_unit?: number;
          amount_paid?: number;
          comment?: string;
          total_amount_received?: number;
          delivery_method?: string;
          number_of_bags?: number;
          deposited_amount?: number;
          cheque_paid?: number;
          small_comment?: string;
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