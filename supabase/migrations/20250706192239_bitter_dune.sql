/*
  # Complete Database Setup for MaizeBiz Tracker
  
  This script creates all necessary tables and security policies.
  Run this in your Supabase SQL Editor to set up the database.
  
  1. New Tables
    - `purchases` - Store purchase records
    - `sales` - Store sales records
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name text NOT NULL,
  date_of_purchase date NOT NULL,
  quantity_bought numeric NOT NULL,
  price_per_unit numeric NOT NULL,
  total_amount_paid numeric NOT NULL,
  payment_method text NOT NULL,
  truck_number_plate text,
  origin_weight numeric,
  destination_weight numeric,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  driver_phone text NOT NULL,
  date_of_sale date NOT NULL,
  quantity_sold numeric NOT NULL,
  selling_price_per_unit numeric NOT NULL,
  amount_paid numeric NOT NULL,
  comment text NOT NULL,
  total_amount_received numeric NOT NULL,
  delivery_method text NOT NULL,
  deposited_amount numeric DEFAULT 0,
  selling_price numeric,
  cheque_paid numeric DEFAULT 0,
  small_comment text,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create policies for purchases table
CREATE POLICY "Users can manage their own purchases"
  ON purchases
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for sales table
CREATE POLICY "Users can manage their own sales"
  ON sales
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);