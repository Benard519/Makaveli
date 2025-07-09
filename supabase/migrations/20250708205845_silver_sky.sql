/*
  # Create laborers table for MaizeBiz Tracker

  1. New Tables
    - `laborers`
      - `id` (uuid, primary key)
      - `date` (date)
      - `number_of_laborers` (integer)
      - `price_per_laborer` (numeric)
      - `total_labour` (numeric)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `laborers` table
    - Add policy for users to manage their own laborer records
*/

CREATE TABLE IF NOT EXISTS laborers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  number_of_laborers integer NOT NULL,
  price_per_laborer numeric NOT NULL,
  total_labour numeric NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE laborers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own laborer records"
  ON laborers
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);