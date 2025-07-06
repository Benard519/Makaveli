/*
  # Add additional fields to sales table

  1. New Columns
    - `deposited_amount` (numeric)
    - `selling_price` (numeric)
    - `cheque_paid` (numeric)
    - `small_comment` (text)

  2. Changes
    - Add four new columns to existing sales table
    - All fields are optional to maintain compatibility with existing data
    - Note: driver_phone already exists in the sales table
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'deposited_amount'
  ) THEN
    ALTER TABLE sales ADD COLUMN deposited_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'selling_price'
  ) THEN
    ALTER TABLE sales ADD COLUMN selling_price numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'cheque_paid'
  ) THEN
    ALTER TABLE sales ADD COLUMN cheque_paid numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'small_comment'
  ) THEN
    ALTER TABLE sales ADD COLUMN small_comment text;
  END IF;
END $$;