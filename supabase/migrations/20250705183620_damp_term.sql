/*
  # Create purchases table for MaizeBiz Tracker

  1. New Tables
    - `purchases`
      - `id` (uuid, primary key)
      - `supplier_name` (text)
      - `date_of_purchase` (date)
      - `quantity_bought` (numeric)
      - `price_per_unit` (numeric)
      - `total_amount_paid` (numeric)
      - `payment_method` (text)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `purchases` table
    - Add policy for users to manage their own purchases
*/

CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name text NOT NULL,
  date_of_purchase date NOT NULL,
  quantity_bought numeric NOT NULL,
  price_per_unit numeric NOT NULL,
  total_amount_paid numeric NOT NULL,
  payment_method text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own purchases"
  ON purchases
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);