/*
  # Add payment method field to sales table

  1. New Columns
    - `payment_method_sale` (text) - Payment method for sales transactions
  
  2. Changes
    - Add payment method column to existing sales table
    - Field is optional to maintain compatibility with existing data
*/

DO $$
BEGIN
  -- Add payment_method_sale column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'sales' 
    AND column_name = 'payment_method_sale'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN payment_method_sale text;
  END IF;
END $$;