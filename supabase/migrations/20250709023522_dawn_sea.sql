/*
  # Add missing location_of_origin column to purchases table

  1. Changes
    - Add `location_of_origin` column to purchases table if it doesn't exist
    - This column was added in a previous migration but may be missing in deployed database

  2. Safety
    - Uses IF NOT EXISTS to prevent errors if column already exists
    - Safe to run multiple times
*/

DO $$
BEGIN
  -- Add location_of_origin column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'purchases' 
    AND column_name = 'location_of_origin'
  ) THEN
    ALTER TABLE public.purchases ADD COLUMN location_of_origin text;
  END IF;
END $$;