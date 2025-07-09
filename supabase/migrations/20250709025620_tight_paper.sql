/*
  # Ensure laborers table exists with all required fields

  1. New Tables (if not exists)
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

-- Create laborers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.laborers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  number_of_laborers integer NOT NULL,
  price_per_laborer numeric NOT NULL,
  total_labour numeric NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'laborers' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.laborers ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'laborers' 
    AND policyname = 'Users can manage their own laborer records'
  ) THEN
    CREATE POLICY "Users can manage their own laborer records"
      ON public.laborers
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;