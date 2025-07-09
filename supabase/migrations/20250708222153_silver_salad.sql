/*
  # Add number_of_bags column to sales table

  1. New Columns
    - `number_of_bags` (numeric) - Number of bags sold (calculated from quantity ÷ 90)
  
  2. Changes
    - Add number_of_bags column to existing sales table
    - Field is optional to maintain compatibility with existing data
    - Uses numeric type to handle decimal values
*/

DO $$
BEGIN
  -- Check if the column doesn't exist before adding it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'sales' 
    AND column_name = 'number_of_bags'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN number_of_bags numeric(10,2);
    
    -- Update existing records to calculate number_of_bags from quantity_sold
    UPDATE public.sales 
    SET number_of_bags = ROUND((quantity_sold / 90.0)::numeric, 2)
    WHERE number_of_bags IS NULL AND quantity_sold IS NOT NULL;
  END IF;
END $$;