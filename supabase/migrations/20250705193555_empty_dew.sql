/*
  # Add additional fields to purchases table

  1. New Columns
    - `truck_number_plate` (text)
    - `origin_weight` (numeric)
    - `destination_weight` (numeric)

  2. Changes
    - Add three new columns to existing purchases table
    - All fields are optional to maintain compatibility with existing data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'truck_number_plate'
  ) THEN
    ALTER TABLE purchases ADD COLUMN truck_number_plate text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'origin_weight'
  ) THEN
    ALTER TABLE purchases ADD COLUMN origin_weight numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'destination_weight'
  ) THEN
    ALTER TABLE purchases ADD COLUMN destination_weight numeric;
  END IF;
END $$;