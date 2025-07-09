/*
  # Add number_of_bags column to sales table

  1. New Columns
    - `number_of_bags` (numeric) - Number of bags sold (calculated from quantity ÷ 90)
  
  2. Changes
    - Add number_of_bags column to existing sales table
    - Field is optional to maintain compatibility with existing data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'number_of_bags'
  ) THEN
    ALTER TABLE sales ADD COLUMN number_of_bags numeric(10,2);
  END IF;
END $$;