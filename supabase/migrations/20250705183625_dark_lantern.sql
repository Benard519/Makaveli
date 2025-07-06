/*
  # Create sales table for MaizeBiz Tracker

  1. New Tables
    - `sales`
      - `id` (uuid, primary key)
      - `customer_name` (text)
      - `driver_phone` (text)
      - `date_of_sale` (date)
      - `quantity_sold` (numeric)
      - `selling_price_per_unit` (numeric)
      - `amount_paid` (numeric)
      - `comment` (text)
      - `total_amount_received` (numeric)
      - `delivery_method` (text)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `sales` table
    - Add policy for users to manage their own sales
*/

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
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sales"
  ON sales
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);