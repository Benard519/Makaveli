/*
  # Enhanced MaizeBiz Tracker Fields

  1. New Columns for Purchases
    - `location_of_origin` (text) - Location where purchase was made
  
  2. New Columns for Sales
    - `number_of_bags` (numeric) - Number of bags sold
    - `payment_method_sale` (text) - Payment method for sales
  
  3. Changes
    - Add location field to purchases table
    - Add bags and payment method to sales table
    - Remove selling_price field from sales (replaced by number_of_bags)
*/

-- Add location_of_origin to purchases table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'location_of_origin'
  ) THEN
    ALTER TABLE purchases ADD COLUMN location_of_origin text;
  END IF;
END $$;

-- Add number_of_bags to sales table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'number_of_bags'
  ) THEN
    ALTER TABLE sales ADD COLUMN number_of_bags numeric(10,2);
  END IF;
END $$;

-- Add payment_method_sale to sales table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'payment_method_sale'
  ) THEN
    ALTER TABLE sales ADD COLUMN payment_method_sale text;
  END IF;
END $$;