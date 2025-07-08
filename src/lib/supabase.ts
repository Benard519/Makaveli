import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      purchases: {
        Row: {
          id: string;
          supplier_name: string;
          date_of_purchase: string;
          quantity_bought: number;
          price_per_unit: number;
          total_amount_paid: number;
          payment_method: string;
          truck_number_plate?: string;
          origin_weight?: number;
          destination_weight?: number;
          location_of_origin?: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          supplier_name: string;
          date_of_purchase: string;
          quantity_bought: number;
          price_per_unit: number;
          total_amount_paid: number;
          payment_method: string;
          truck_number_plate?: string;
          origin_weight?: number;
          destination_weight?: number;
          location_of_origin?: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          supplier_name?: string;
          date_of_purchase?: string;
          quantity_bought?: number;
          price_per_unit?: number;
          total_amount_paid?: number;
          payment_method?: string;
          truck_number_plate?: string;
          origin_weight?: number;
          destination_weight?: number;
          location_of_origin?: string;
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
          number_of_bags?: number;
          selling_price_per_unit: number;
          amount_paid: number;
          payment_method_sale?: string;
          comment: string;
          total_amount_received: number;
          delivery_method: string;
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
          number_of_bags?: number;
          selling_price_per_unit: number;
          amount_paid: number;
          payment_method_sale?: string;
          comment: string;
          total_amount_received: number;
          delivery_method: string;
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
          number_of_bags?: number;
          selling_price_per_unit?: number;
          amount_paid?: number;
          payment_method_sale?: string;
          comment?: string;
          total_amount_received?: number;
          delivery_method?: string;
          deposited_amount?: number;
          cheque_paid?: number;
          small_comment?: string;
          user_id?: string;
          created_at?: string;
        };
      };
    };
  };
};